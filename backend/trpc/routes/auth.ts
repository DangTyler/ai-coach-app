import { TRPCError } from "@trpc/server";
import * as z from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import {
  registerUser,
  loginUser,
  invalidateToken,
  updateUserProfile,
} from "../../utils/auth";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await registerUser(input.email, input.password, input.name);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Registration failed",
        });
      }
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await loginUser(input.email, input.password);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error instanceof Error ? error.message : "Login failed",
        });
      }
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    const token = ctx.token;
    if (token) {
      invalidateToken(token);
    }
    return { success: true };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      try {
        return updateUserProfile(ctx.user.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Update failed",
        });
      }
    }),
});
