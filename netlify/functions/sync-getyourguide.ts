import { syncConfiguredGygAvailability } from "../../server/routes";

export const handler = async () => {
  try {
    const result = await syncConfiguredGygAvailability();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Scheduled GetYourGuide sync failed", error);
    return { statusCode: 500, body: JSON.stringify({ error: "GetYourGuide availability sync failed; see integration activity." }) };
  }
};
