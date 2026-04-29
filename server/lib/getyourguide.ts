/**
 * GetYourGuide API Client
 * Handles communication with GetYourGuide Supplier API
 */

interface AvailabilityUpdate {
    productId: string;
    datetime: string; // ISO 8601 format
    availableSpots: number;
    price?: number;
}

export interface GetYourGuideAvailabilityNotification {
    dateTime: string;
    vacancies?: number;
    vacanciesByCategory?: Array<{
        category: string;
        vacancies: number;
    }>;
    openingTimes?: Array<{
        fromTime: string;
        toTime: string;
    }>;
    currency?: string;
    pricesByCategory?: {
        retailPrices: Array<{
            category: string;
            price: number;
        }>;
    };
}

export interface GetYourGuideNotificationResult {
    status: number;
    productId: string;
    availabilityCount: number;
    response: unknown;
}

interface DealParams {
    productId: string;
    discountPercent: number;
    startDate: string;
    endDate: string;
}

const API_URL = process.env.GETYOURGUIDE_API_URL || 'https://supplier-api.getyourguide.com/1';
const SANDBOX_URL = process.env.GETYOURGUIDE_SANDBOX_URL || 'https://supplier-api.getyourguide.com/sandbox/1';

async function parseResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function formatGygApiError(status: number, body: unknown): string {
    if (body && typeof body === 'object') {
        const payload = body as Record<string, unknown>;
        const code = typeof payload.errorCode === 'string' ? payload.errorCode : undefined;
        const message = typeof payload.errorMessage === 'string'
            ? payload.errorMessage
            : typeof payload.message === 'string'
                ? payload.message
                : JSON.stringify(payload);

        return [code, message].filter(Boolean).join(': ');
    }

    return String(body || `HTTP ${status}`);
}

/**
 * Get Basic Auth header for GetYourGuide API
 */
function getAuthHeader(): string {
    const username = process.env.GETYOURGUIDE_API_USERNAME;
    const password = process.env.GETYOURGUIDE_API_PASSWORD;

    if (!username || !password) {
        throw new Error('GetYourGuide API credentials not configured');
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${credentials}`;
}

/**
 * Notify GetYourGuide of availability update
 */
export async function notifyAvailabilityUpdate(
    productId: string,
    datetime: string,
    availableSpots: number,
    useSandbox: boolean = false
): Promise<void> {
    await notifyAvailabilityBatch(productId, [{ dateTime: datetime, vacancies: availableSpots }], useSandbox);
    console.log(`✅ Availability updated for product ${productId} at ${datetime}: ${availableSpots} spots`);
}

/**
 * Notify GetYourGuide of one or more availability changes.
 */
export async function notifyAvailabilityBatch(
    productId: string,
    availabilities: GetYourGuideAvailabilityNotification[],
    useSandbox: boolean = false
): Promise<GetYourGuideNotificationResult> {
    if (!availabilities.length) {
        throw new Error('No GetYourGuide availability records were provided');
    }

    const url = `${useSandbox ? SANDBOX_URL : API_URL}/notify-availability-update`;
    const payload = {
        data: {
            productId,
            availabilities,
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });
        const responseBody = await parseResponseBody(response);

        if (!response.ok) {
            throw new Error(`GetYourGuide API error: ${response.status} - ${formatGygApiError(response.status, responseBody)}`);
        }

        console.log(`✅ Availability batch accepted for product ${productId}: ${availabilities.length} records`);
        return {
            status: response.status,
            productId,
            availabilityCount: availabilities.length,
            response: responseBody,
        };
    } catch (error) {
        console.error('Failed to notify GetYourGuide of availability update:', error);
        throw error;
    }
}

/**
 * Notify GetYourGuide of availability + price update
 */
export async function notifyAvailabilityWithPrice(
    productId: string,
    datetime: string,
    availableSpots: number,
    price: number,
    currency: string = 'MWK',
    useSandbox: boolean = false
): Promise<void> {
    const url = `${useSandbox ? SANDBOX_URL : API_URL}/notify-availability-update`;

    const payload = {
        data: {
            productId: productId,
            availabilities: [
                {
                    dateTime: datetime,
                    vacancies: availableSpots,
                    currency: currency,
                    pricesByCategory: {
                        retailPrices: [
                            {
                                category: 'ADULT',
                                price: price
                            }
                        ]
                    }
                }
            ]
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GetYourGuide API error: ${response.status} - ${errorText}`);
        }

        console.log(`✅ Availability & price updated for product ${productId}`);
    } catch (error) {
        console.error('Failed to notify GetYourGuide of availability + price:', error);
        throw error;
    }
}

/**
 * Create a deal on GetYourGuide
 */
export async function createDeal(
    params: DealParams,
    useSandbox: boolean = false
): Promise<string> {
    const url = `${useSandbox ? SANDBOX_URL : API_URL}/deals`;

    const payload = {
        data: {
            externalProductId: params.productId,
            dealName: `Discount ${params.discountPercent}%`,
            dateRange: {
                start: params.startDate,
                end: params.endDate,
            },
            dealType: 'last_minute',
            discountPercentage: params.discountPercent,
            noticePeriodDays: 3,
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GetYourGuide API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Deal created for product ${params.productId}`);
        return data.data?.dealId || data.dealId || '';
    } catch (error) {
        console.error('Failed to create deal on GetYourGuide:', error);
        throw error;
    }
}

/**
 * Get all deals from GetYourGuide
 */
export async function getDeals(productId: string, useSandbox: boolean = false): Promise<any[]> {
    const url = `${useSandbox ? SANDBOX_URL : API_URL}/deals?externalProductId=${encodeURIComponent(productId)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader(),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GetYourGuide API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.deals || [];
    } catch (error) {
        console.error('Failed to get deals from GetYourGuide:', error);
        throw error;
    }
}

/**
 * Delete a deal from GetYourGuide
 */
export async function deleteDeal(dealId: string, useSandbox: boolean = false): Promise<void> {
    const url = `${useSandbox ? SANDBOX_URL : API_URL}/deals/${dealId}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': getAuthHeader(),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GetYourGuide API error: ${response.status} - ${errorText}`);
        }

        console.log(`✅ Deal ${dealId} deleted`);
    } catch (error) {
        console.error('Failed to delete deal from GetYourGuide:', error);
        throw error;
    }
}

/**
 * Register a new supplier on GetYourGuide
 */
export async function registerSupplier(
    supplierData: {
        externalSupplierId: string;
        firstName: string;
        lastName: string;
        legalCompanyName: string;
        websiteUrl: string;
        country: string;
        currency: string;
        email: string;
        legalStatus: 'company' | 'individual';
        mobileNumber: string;
        city: string;
        postalCode: string;
        stateOrRegion?: string;
    },
    useSandbox: boolean = false
): Promise<void> {
    const url = `${useSandbox ? SANDBOX_URL : API_URL}/suppliers`;

    const payload = {
        data: supplierData,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GetYourGuide API error: ${response.status} - ${errorText}`);
        }

        console.log(`✅ Supplier ${supplierData.externalSupplierId} registered`);
    } catch (error) {
        console.error('Failed to register supplier on GetYourGuide:', error);
        throw error;
    }
}
