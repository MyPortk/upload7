import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import PostgresqlStore from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

const app = express();
const PostgresStore = PostgresqlStore(session);

declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    role: string;
    name: string;
    department?: string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    store: new PostgresStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
      ttl: 24 * 60 * 60 * 7 // 7 days in seconds
    }),
    secret: process.env.SESSION_SECRET || 'inventory-management-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    proxy: isProduction, // Trust proxy on production (Render uses proxy)
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // Use lax for cross-site cookie compatibility
      domain: isProduction ? undefined : undefined // Don't restrict domain
    }
  })
);

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await seedDatabase();
  } catch (seedError) {
    console.error('⚠️ Database seeding failed (will retry on next start):', seedError);
  }
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // It is the only port that is not firewalled.
const port = parseInt(process.env.PORT || '5000', 10);

// Windows does NOT support reusePort or 0.0.0.0 in some cases
const host = process.platform === "win32" ? "localhost" : "0.0.0.0";

server.listen(
  {
    port,
    host,
    // Disable reusePort for Windows
    reusePort: process.platform !== "win32",
  },
  () => {
    log(`serving on ${host}:${port}`);
  }
);

})();
