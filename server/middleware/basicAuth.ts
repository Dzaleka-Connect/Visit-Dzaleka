import { Request, Response, NextFunction } from 'express';

/**
 * Basic Authentication Middleware for GetYourGuide Webhook
 * Validates HTTP Basic Auth credentials from Authorization header
 */
export function basicAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="GetYourGuide Webhook"');
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // Extract and decode credentials
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        // Validate against environment variables
        const expectedUsername = process.env.GETYOURGUIDE_WEBHOOK_USERNAME;
        const expectedPassword = process.env.GETYOURGUIDE_WEBHOOK_PASSWORD;

        if (!expectedUsername || !expectedPassword) {
            console.error('GetYourGuide webhook credentials not configured in environment');
            return res.status(500).json({ error: 'Webhook not configured' });
        }

        if (username === expectedUsername && password === expectedPassword) {
            // Authentication successful
            next();
        } else {
            // Invalid credentials
            res.setHeader('WWW-Authenticate', 'Basic realm="GetYourGuide Webhook"');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error parsing Basic Auth header:', error);
        return res.status(400).json({ error: 'Invalid Authorization header format' });
    }
}
