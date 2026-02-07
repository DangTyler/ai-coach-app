import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { exampleRouter } from "./routes/example";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  example: exampleRouter,
});

export type AppRouter = typeof appRouter;
