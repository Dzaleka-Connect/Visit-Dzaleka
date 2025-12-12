/**
 * Error handling utilities for production-safe error responses
 */

/**
 * Sanitizes error messages for client responses.
 * In production, only returns generic messages.
 * In development, includes error details for debugging.
 */
export function sanitizeErrorResponse(error: unknown): { message: string; details?: string } {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isProduction) {
        // Never expose internal error details in production
        return { message: 'An internal error occurred' };
    }

    // In development, include details for debugging
    return {
        message: 'Internal error',
        details: errorMessage
    };
}

/**
 * Custom error class for version conflicts (optimistic locking)
 */
export class VersionConflictError extends Error {
    constructor(message = 'Resource was modified by another request') {
        super(message);
        this.name = 'VersionConflictError';
    }
}

/**
 * Logs error with request context for debugging
 */
export function logError(
    context: string,
    error: unknown,
    requestId?: string
): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error(JSON.stringify({
        timestamp,
        context,
        requestId: requestId || 'unknown',
        error: errorMessage,
        stack: process.env.NODE_ENV !== 'production' ? stack : undefined
    }));
}
