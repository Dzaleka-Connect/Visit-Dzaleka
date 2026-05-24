import serverless from "serverless-http";
import { createApp } from "../../server/app";

const handlerPromise = createApp().then(({ app }) => serverless(app));

export const handler = async (event: any, context: any) => {
  const handler = await handlerPromise;
  return handler(event, context);
};
