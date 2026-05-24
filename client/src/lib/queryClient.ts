import { QueryClient, QueryFunction } from "@tanstack/react-query";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const requestId = res.headers.get("X-Request-Id");

    const error = new Error(`${res.status}: ${text}`);
    (error as any).requestId = requestId;
    throw error;
  }
}

function isInternalApiUrl(url: string) {
  return url.startsWith("/api/");
}

async function fetchCsrfToken() {
  if (csrfToken) return csrfToken;
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = fetch("/api/auth/csrf", {
    credentials: "include",
  })
    .then(async (res) => {
      await throwIfResNotOk(res);
      const headerToken = res.headers.get("X-CSRF-Token");
      const payload = await res.json().catch(() => null) as { csrfToken?: string } | null;
      const nextToken = headerToken || payload?.csrfToken;
      if (!nextToken) {
        throw new Error("CSRF token was not returned by the server");
      }
      csrfToken = nextToken;
      return nextToken;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const normalizedMethod = method.toUpperCase();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  if (isInternalApiUrl(url) && UNSAFE_METHODS.has(normalizedMethod)) {
    headers["X-CSRF-Token"] = await fetchCsrfToken();
  }

  const res = await fetch(url, {
    method: normalizedMethod,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const responseToken = res.headers.get("X-CSRF-Token");
  if (responseToken) {
    csrfToken = responseToken;
  }
  if (url === "/api/auth/logout") {
    csrfToken = null;
  }
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
    },
  },
});
