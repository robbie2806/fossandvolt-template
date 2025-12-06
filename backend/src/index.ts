import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";

import { auth } from "./auth";
import { env } from "./env";
import { companionRouter } from "./routes/companion";
import { chatRouter } from "./routes/chat";
import { bondRouter } from "./routes/bond";
import { settingsRouter } from "./routes/settings";
import { blipkinRouter } from "./routes/blipkin";
import { type AppType } from "./types";

// AppType context adds user and session to the context, will be null if the user or session is null
const app = new Hono<AppType>();

console.log("🔧 Initializing Hono application...");
app.use("*", logger());
app.use(
  "/*",
  cors({
    origin: (origin) => origin || "*", // Allow the requesting origin or fallback to *
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

/** Authentication middleware
 * Extracts session from request headers and attaches user/session to context
 * All routes can access c.get("user") and c.get("session")
 */
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null); // type: typeof auth.$Infer.Session.user | null
  c.set("session", session?.session ?? null); // type: typeof auth.$Infer.Session.session | null
  return next();
});

// Better Auth handler
// Handles all authentication endpoints: /api/auth/sign-in, /api/auth/sign-up, etc.
console.log("🔐 Mounting Better Auth handler at /api/auth/*");
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Serve uploaded images statically
// Files in uploads/ directory are accessible at /uploads/* URLs
console.log("📁 Serving static files from uploads/ directory");
app.use("/uploads/*", serveStatic({ root: "./" }));

// Mount PixieVolt AI route modules
console.log("🤖 Mounting companion routes at /api/companion");
app.route("/api/companion", companionRouter);

console.log("💬 Mounting chat routes at /api/chat");
app.route("/api/chat", chatRouter);

console.log("🎯 Mounting bond routes at /api/bond");
app.route("/api/bond", bondRouter);

console.log("⚙️  Mounting settings routes at /api/settings");
app.route("/api/settings", settingsRouter);

console.log("✨ Mounting Blipkin routes at /api/blipkin");
app.route("/api/blipkin", blipkinRouter);

// Health check endpoint
// Used by load balancers and monitoring tools to verify service is running
app.get("/health", (c) => {
  console.log("💚 Health check requested");
  return c.json({ status: "ok" });
});

// Start the server
console.log("⚙️  Starting server...");
serve({ fetch: app.fetch, port: Number(env.PORT) }, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🚀 Server is running on port ${env.PORT}`);
  console.log(`🔗 Base URL: http://localhost:${env.PORT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📚 Available endpoints:");
  console.log("  🔐 Auth:       /api/auth/*");
  console.log("  🤖 Companion:  GET/POST/PUT /api/companion");
  console.log("  💬 Chat:       GET/POST /api/chat");
  console.log("  🎯 Bond:       GET /api/bond, POST /api/bond/check-in, /api/bond/gratitude, /api/bond/goal");
  console.log("  ⚙️  Settings:   GET/PUT /api/settings");
  console.log("  ✨ Blipkin:    GET/POST/PUT /api/blipkin, POST /api/blipkin/feed, /api/blipkin/play");
  console.log("  💚 Health:     GET /health");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
