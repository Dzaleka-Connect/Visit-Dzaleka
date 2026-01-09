import "express-session";

declare module "express-session" {
    interface SessionData {
        userId: string;
        userRole: string;
        // Impersonation support
        originalAdminId?: string;
        originalAdminRole?: string;
        isImpersonating?: boolean;
    }
}

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}
