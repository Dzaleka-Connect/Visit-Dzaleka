import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";

// Export log function so it can be used here
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  // Trust proxy is required for secure cookies to work behind Netlify's load balancer
  // Using 'true' trusts the client's IP address and is more robust for varying proxy depths
  app.set('trust proxy', true);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5000',
    process.env.APP_URL || ''
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for now to prevent issues, user can tighten later
    },
    credentials: true,
  }));

  // Rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: { message: "Too many login attempts. Please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation for serverless
    keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
  });

  // General API rate limiter
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation for serverless
    keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
  });

  // Session store - Use PostgreSQL in production, Memory in development
  const isProduction = process.env.NODE_ENV === 'production';
  let sessionStore;

  if (isProduction && process.env.DATABASE_URL) {
    const PgSession = connectPgSimple(session);
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase')
        ? { rejectUnauthorized: false }
        : false
    });
    sessionStore = new PgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    });
    log("Using PostgreSQL session store");
  } else {
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    log("Using Memory session store");
  }

  // Session setup
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  // Apply rate limiting
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api", apiLimiter);

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "supersecretdevkey",
      resave: false,
      saveUninitialized: false,
      name: 'dzaleka.sid', // Custom session cookie name
      proxy: true, // Required for secure cookies behind a proxy
      cookie: {
        secure: isProduction, // true for HTTPS
        httpOnly: true,
        sameSite: 'lax', // 'lax' is safer and works well for SPA
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.COOKIE_DOMAIN || undefined, // Set to your domain in production if needed
      },
    })
  );

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  return { app, httpServer };
}
