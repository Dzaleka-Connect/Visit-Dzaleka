import serverless from "serverless-http";
import { createApp } from "../../server/app";

// Initialize the app
const appPromise = createApp().then(({ app }) => app);

// Export the handler
export const handler = async (event: any, context: any) => {
  const app = await appPromise;
  const handler = serverless(app);
  return handler(event, context);
};
