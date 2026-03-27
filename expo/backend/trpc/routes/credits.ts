import { TRPCError } from "@trpc/server";
import * as z from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { getBalance, useCredits, grantCredits } from "../../utils/credits";

export const creditsRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    return await getBalance(ctx.user.id);
  }),

  use: protectedProcedure
    .input(z.object({ amount: z.number().int().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await useCredits(ctx.user.id, input.amount);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Insufficient credits",
        });
      }
    }),

  grant: protectedProcedure
    .input(z.object({ amount: z.number().int().min(1).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      return await grantCredits(ctx.user.id, input.amount);
    }),
});
