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
      url: `${getBaseUrl()}/trpc`,
      transformer: superjson,
      headers() {
        const token = getAuthToken();
        if (token) {
          return { authorization: `Bearer ${token}` };
        }
        return {};
      },
      async fetch(url, options) {
        const baseUrl = getBaseUrl();
        let response: Response;
        try {
          response = await fetch(url, options);
        } catch (err) {
          console.log("[tRPC] Network error:", err);
          throw new Error(
            "Unable to connect to the server. Please check your internet connection and try again."
          );
        }
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          console.log("[tRPC] Backend returned HTML instead of JSON. Is the correct server running?", url);
          throw new Error(
            `Backend returned a web page instead of data. Make sure your backend is running (npm run backend:node) at ${baseUrl} and nothing else is using that port.`
          );
        }
        if (response.status === 429) {
          throw new Error("Server is busy. Please wait a moment and try again.");
        }
        if (response.status === 503 || response.status === 502) {
          console.log("[tRPC] Server unavailable, status:", response.status);
          throw new Error(
            "Server is temporarily unavailable. Please try again in a moment."
          );
        }
        if (!response.ok) {
          if (!contentType.includes("application/json")) {
            console.log("[tRPC] Non-JSON response, status:", response.status);
            throw new Error(
              "Server returned an unexpected response. Please try again later."
            );
          }
        }
        return response;
      },
    }),
  ],
});
