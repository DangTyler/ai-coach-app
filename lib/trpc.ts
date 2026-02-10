import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { getAuthToken } from "@/lib/auth-token";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_RORK_API_BASE_URL is not set. Please configure it.",
    );
  }

  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers() {
        const token = getAuthToken();
        if (token) {
          return { authorization: `Bearer ${token}` };
        }
        return {};
      },
      async fetch(url, options) {
        const response = await fetch(url, options);
        if (response.status === 429) {
          throw new Error("Server is busy. Please wait a moment and try again.");
        }
        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            throw new Error("Server error. Please try again later.");
          }
        }
        return response;
      },
    }),
  ],
});
