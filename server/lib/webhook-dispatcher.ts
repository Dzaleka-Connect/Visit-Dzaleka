import crypto from "crypto";
import { storage } from "../storage";
import { logger } from "./logger";

export class WebhookDispatcher {
  /**
   * Dispatches an event payload to all configured webhook endpoints that are subscribed to it.
   */
  static async dispatch(eventName: string, data: any) {
    try {
      const endpoints = await storage.getWebhookEndpoints();
      
      const activeEndpoints = endpoints.filter(ep => 
        ep.status === "active" && ep.events.includes(eventName)
      );

      if (activeEndpoints.length === 0) return;

      const payload = {
        event: eventName,
        timestamp: new Date().toISOString(),
        data,
      };

      const payloadString = JSON.stringify(payload);

      // We do not await `Promise.all` here so it doesn't block the calling request
      Promise.allSettled(activeEndpoints.map(ep => this.sendToEndpoint(ep, eventName, payloadString)));
      
    } catch (error) {
      logger.error(`Failed to dispatch webhooks for event ${eventName}`, error as Error);
    }
  }

  static async retryDelivery(deliveryId: string) {
    const delivery = await storage.getWebhookDelivery(deliveryId);
    if (!delivery) {
      throw new Error("Webhook delivery not found");
    }

    const endpoint = await storage.getWebhookEndpoint(delivery.endpointId);
    if (!endpoint) {
      throw new Error("Webhook endpoint not found");
    }

    const payload = delivery.payload || {
      event: delivery.event,
      timestamp: new Date().toISOString(),
      data: null,
    };

    return this.sendToEndpoint(endpoint, delivery.event, JSON.stringify(payload));
  }

  private static async sendToEndpoint(endpoint: any, eventName: string, payloadString: string) {
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let deliveryStatus = "failed";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Visit-Dzaleka-Webhook-Engine/1.0",
    };

    if (endpoint.secret) {
      const signature = crypto.createHmac("sha256", endpoint.secret)
                              .update(payloadString)
                              .digest("hex");
      headers["X-Dzaleka-Signature"] = signature;
    }

    try {
      // Abort controller for a 10s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      responseStatus = response.status;
      responseBody = await response.text().catch(() => "");
      
      if (response.ok) {
        deliveryStatus = "success";
        // Optionally update lastSuccessAt
        await storage.updateWebhookEndpoint(endpoint.id, { lastSuccessAt: new Date() });
      } else {
        logger.warn(`Webhook to ${endpoint.url} failed with status ${responseStatus}`);
      }
    } catch (error: any) {
      logger.error(`Webhook delivery to ${endpoint.url} error`, error);
      responseBody = error.message;
    }

    // Log the delivery
    try {
      await storage.createWebhookDelivery({
        endpointId: endpoint.id,
        event: eventName,
        status: deliveryStatus,
        payload: JSON.parse(payloadString),
        responseStatus,
        responseBody: responseBody ? responseBody.substring(0, 1000) : undefined,
      } as any);
    } catch (dbError) {
      logger.error("Failed to record webhook delivery", dbError as Error);
    }

    return {
      status: deliveryStatus,
      responseStatus,
      responseBody,
    };
  }
}
