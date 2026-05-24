import crypto from "crypto";
import { storage } from "../storage";
import { logger } from "./logger";
import { isSafeDestination } from "../utils/ssrf";

export class WebhookDispatcher {
  private static isProcessing = false;

  /**
   * Dispatches an event payload to all configured webhook endpoints that are subscribed to it.
   * Instead of sending immediately, it queues the deliveries in the database as "pending"
   * and triggers the background processor.
   */
  static async dispatch(eventName: string, data: any) {
    try {
      const endpoints = await storage.getWebhookEndpoints();
      
      const activeEndpoints = endpoints.filter(ep => 
        ep.status === "active" && ep.events.includes(eventName)
      );

      if (activeEndpoints.length === 0) return;

      // Queue the delivery in the database with status = "pending"
      // The payload column is automatically encrypted at the storage boundary
      for (const ep of activeEndpoints) {
        await storage.createWebhookDelivery({
          endpointId: ep.id,
          event: eventName,
          status: "pending",
          payload: data,
          responseStatus: null,
          responseBody: null,
        });
      }

      // Trigger background processing in a fire-and-forget manner
      this.triggerProcessor();
      
    } catch (error) {
      logger.error(`Failed to dispatch webhooks for event ${eventName}`, error as Error);
    }
  }

  /**
   * Trigger processing of any pending deliveries in a non-blocking background queue.
   */
  static triggerProcessor() {
    setImmediate(async () => {
      try {
        await this.processPendingDeliveries();
      } catch (error) {
        logger.error("Background webhook processor failed", error as Error);
      }
    });
  }

  /**
   * Worker loop that processes all pending webhook deliveries.
   */
  private static async processPendingDeliveries() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingDeliveries = await storage.getPendingWebhookDeliveries();
      
      for (const delivery of pendingDeliveries) {
        // Mark as processing so no other worker picks it up
        await storage.updateWebhookDelivery(delivery.id, { status: "processing" });

        const endpoint = await storage.getWebhookEndpoint(delivery.endpointId);
        if (!endpoint || endpoint.status !== "active") {
          await storage.updateWebhookDelivery(delivery.id, {
            status: "failed",
            responseBody: "Endpoint not found or inactive",
            responseStatus: 404,
          });
          continue;
        }

        await this.sendDelivery(endpoint, delivery);
      }
    } catch (error) {
      logger.error("Error processing pending webhook deliveries", error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Triggers manual retry of a specific delivery record.
   */
  static async retryDelivery(deliveryId: string) {
    const delivery = await storage.getWebhookDelivery(deliveryId);
    if (!delivery) {
      throw new Error("Webhook delivery not found");
    }

    const endpoint = await storage.getWebhookEndpoint(delivery.endpointId);
    if (!endpoint) {
      throw new Error("Webhook endpoint not found");
    }

    // Set status to pending and re-run send
    await storage.updateWebhookDelivery(delivery.id, { status: "processing" });
    return this.sendDelivery(endpoint, delivery);
  }

  /**
   * Performs the HTTP request, handles signature, SSRF checks, and updates the delivery log.
   */
  private static async sendDelivery(endpoint: any, delivery: any) {
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let deliveryStatus = "failed";

    // 1. Enforce HTTPS and verify destination does not resolve to private network (SSRF protection)
    const isSafe = await isSafeDestination(endpoint.url);
    if (!isSafe) {
      logger.error(`Webhook delivery aborted: URL ${endpoint.url} is not a safe public HTTPS endpoint.`);
      const failMessage = "Blocked: Webhook URL must use HTTPS and resolve to a public IP address.";
      await storage.updateWebhookDelivery(delivery.id, {
        status: "failed",
        responseStatus: 400,
        responseBody: failMessage,
      });
      return { status: "failed", responseStatus: 400, responseBody: failMessage };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Visit-Dzaleka-Webhook-Engine/1.0",
    };

    const payload = {
      event: delivery.event,
      timestamp: delivery.timestamp || new Date().toISOString(),
      data: delivery.payload,
    };
    const payloadString = JSON.stringify(payload);

    // 2. Sign payload combined with a timestamp to prevent replay attacks
    if (endpoint.secret) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signaturePayload = `${timestamp}.${payloadString}`;
      const signature = crypto.createHmac("sha256", endpoint.secret)
                              .update(signaturePayload)
                              .digest("hex");
      headers["X-Dzaleka-Timestamp"] = timestamp;
      headers["X-Dzaleka-Signature"] = signature;
    }

    try {
      // Abort controller for a 10s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Block redirects to prevent redirect SSRF vectors (redirect: "error")
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
        redirect: "error",
      });

      clearTimeout(timeoutId);
      
      responseStatus = response.status;
      responseBody = await response.text().catch(() => "");
      
      if (response.ok) {
        deliveryStatus = "success";
        await storage.updateWebhookEndpoint(endpoint.id, { lastSuccessAt: new Date() });
      } else {
        logger.warn(`Webhook to ${endpoint.url} failed with status ${responseStatus}`);
      }
    } catch (error: any) {
      logger.error(`Webhook delivery to ${endpoint.url} error`, error);
      responseBody = error.message;
    }

    // 3. Minimize stored response size to protect private metadata
    const sanitizedResponseBody = responseBody ? responseBody.substring(0, 200) : undefined;

    // Update the delivery record with final status
    try {
      await storage.updateWebhookDelivery(delivery.id, {
        status: deliveryStatus,
        responseStatus,
        responseBody: sanitizedResponseBody,
      });
    } catch (dbError) {
      logger.error("Failed to update webhook delivery log", dbError as Error);
    }

    return {
      status: deliveryStatus,
      responseStatus,
      responseBody: sanitizedResponseBody,
    };
  }
}
