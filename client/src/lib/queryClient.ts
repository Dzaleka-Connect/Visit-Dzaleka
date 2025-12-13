import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const requestId = res.headers.get("X-Request-Id");

    if (requestId) {
      console.error(`[Request Failed] ID: ${requestId} Status: ${res.status}`);
    }

    const error = new Error(`${res.status}: ${text}`);
    (error as any).requestId = requestId;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Use returnNull on 401 to prevent noisy console errors when session expires
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error instanceof Error && (error.message.startsWith("401:") || error.message.startsWith("403:"))) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Global error logging for mutations
        if (error.requestId) {
          console.error(`Mutation failed with Request ID: ${error.requestId}`);
        }
      }
    },
  },
});

