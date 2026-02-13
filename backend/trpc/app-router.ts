import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { creditsRouter } from "./routes/credits";
import { exampleRouter } from "./routes/example";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  credits: creditsRouter,
  example: exampleRouter,
});

export type AppRouter = typeof appRouter;
