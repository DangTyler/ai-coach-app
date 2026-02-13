/**
 * Local backend server.
 *
 * Run with:
 *   npm run backend        (uses Bun if installed)
 *   npm run backend:node   (uses Node + tsx)
 *
 * Serves the Hono app at /api/trpc for tRPC (auth, etc.) and GET / for health.
 * Set EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000 in the app .env to connect.
 * For Supabase: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or environment.
 */
import "dotenv/config";
import app from "./hono";

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST ?? "0.0.0.0";

if (typeof Bun !== "undefined") {
  Bun.serve({
    hostname: host,
    port,
    fetch: app.fetch,
  });
  console.log(`[Backend] Running at http://${host}:${port} (Bun) – use this URL or http://localhost:${port} from this machine`);
} else {
  void (async () => {
    const { serve } = await import("@hono/node-server");
    serve({ fetch: app.fetch, port, hostname: host }, (info: { port: number; address?: string }) => {
      const addr = info.address ?? host;
      console.log(`[Backend] Running at http://${addr}:${info.port} (Node) – use http://localhost:${info.port} or your Mac IP for the app`);
    });
  })();
}
