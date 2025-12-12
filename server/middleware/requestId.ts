/// <reference path="../types.d.ts" />
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to generate and attach unique request IDs
 * for error correlation and debugging.
 * 
 * - Uses existing X-Request-Id header if present
 * - Generates new UUID if not present
 * - Sets X-Request-Id header in response
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}
