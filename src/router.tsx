import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Lists stay fresh for 60s; navigating back avoids a refetch flash.
        staleTime: 60_000,
        // Keep unused data cached for 5 minutes so route revisits are instant.
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Prefetch route + loader data on intent (hover/touch) for instant transitions.
    defaultPreload: "intent",
    // Treat preloaded data as fresh for 30s to avoid duplicate fetches.
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 120,
    defaultPendingMinMs: 300,
  });

  return router;
};
