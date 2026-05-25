import { WebhookDispatcher } from "../../server/lib/webhook-dispatcher";
import { logger } from "../../server/lib/logger";

export const handler = async (event: any, context: any) => {
  logger.info("Executing scheduled webhook processing...");
  try {
    const result = await WebhookDispatcher.processPending();
    logger.info(`Scheduled webhook processing completed successfully. Processed count: ${result.processedCount}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, processed: result.processedCount }),
    };
  } catch (error: any) {
    logger.error("Error executing scheduled webhook processing", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
