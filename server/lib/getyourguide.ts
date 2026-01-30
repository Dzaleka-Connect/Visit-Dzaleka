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

interface DealParams {
    productId: string;
    discountPercent: number;
    startDate: string;
    endDate: string;
}

const API_URL = process.env.GETYOURGUIDE_API_URL || 'https://supplier-api.getyourguide.com/1';
const SANDBOX_URL = process.env.GETYOURGUIDE_SANDBOX_URL || 'https://supplier-api.getyourguide.com/sandbox/1';

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
    const url = `${useSandbox ? SANDBOX_URL : API_URL}/notify-availability-update`;

    const payload = {
        data: {
            productId: productId,
            availabilities: [
                {
                    dateTime: datetime,
                    vacancies: availableSpots,
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

        console.log(`✅ Availability updated for product ${productId} at ${datetime}: ${availableSpots} spots`);
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
                                category: 'Adult',
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
