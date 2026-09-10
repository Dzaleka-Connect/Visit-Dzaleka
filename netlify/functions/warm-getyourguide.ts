import { getGygInboundCredentials } from "../../server/lib/getyourguide-auth";
import { getGygStore } from "../../server/lib/getyourguide-store";
import { getGygAvailabilityPushProductId, getGygLocalDate } from "../../server/lib/getyourguide-supplier";

// Keep the dedicated supplier Lambda and its pooler connection warm so the
// first GetYourGuide availability poll after idle does not pay a cold start.
export async function handler() {
  const [username, password] = getGygInboundCredentials()[0] || [];
  if (!username || !password) {
    return { statusCode: 204, body: "" };
  }

  const date = getGygLocalDate();
  const productId = getGygAvailabilityPushProductId() || "1188868";
  const base = (process.env.URL || "https://visit.dzaleka.com").replace(/\/$/, "");
  const url = new URL("/1/get-availabilities/", `${base}/`);
  url.searchParams.set("productId", productId);
  url.searchParams.set("fromDateTime", `${date}T00:00:00+02:00`);
  url.searchParams.set("toDateTime", `${date}T23:59:59+02:00`);

  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "x-dzaleka-diagnostic": "true",
      },
    });
    await response.arrayBuffer();
    try { await getGygStore().pruneActivity(); } catch (error) {
      console.error("GetYourGuide activity prune failed", error);
    }
    return {
      statusCode: response.ok ? 200 : 500,
      body: JSON.stringify({ status: response.status, ms: Date.now() - started }),
    };
  } catch (error) {
    console.error("GetYourGuide warmer failed", error);
    return { statusCode: 500, body: JSON.stringify({ error: "GetYourGuide warmer failed" }) };
  }
}
