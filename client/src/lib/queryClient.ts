import { QueryClient, QueryFunction } from "@tanstack/react-query";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    try {
      const payload = JSON.parse(text);
      if (typeof payload.message === "string") message = payload.message;
      if (typeof payload.detail === "string" && payload.detail && payload.detail !== payload.message) {
        message = `${message}: ${payload.detail}`;
      }
    } catch {
      // Some proxies return plain-text errors.
    }
    const requestId = res.headers.get("X-Request-Id");

    const error = new Error(`${res.status}: ${message}`);
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
  const headers: Record<string, string> = data !== undefined ? { "Content-Type": "application/json" } : {};
  const needsCsrf = isInternalApiUrl(url) && UNSAFE_METHODS.has(normalizedMethod);

  if (needsCsrf) {
    headers["X-CSRF-Token"] = await fetchCsrfToken();
  }

  const send = () => fetch(url, {
    method: normalizedMethod,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  let res = await send();

  // Another tab can replace the session after login/logout. Retry only an
  // explicit CSRF rejection: the middleware has not executed the mutation.
  if (needsCsrf && res.status === 403) {
    const error = await res.clone().json().catch(() => null);
    if (error?.code === "CSRF_INVALID_TOKEN" || error?.message === "Forbidden: Invalid CSRF token") {
      if (csrfToken === headers["X-CSRF-Token"]) csrfToken = null;
      headers["X-CSRF-Token"] = await fetchCsrfToken();
      res = await send();
    }
  }

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
    async ({ queryKey, signal }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal,
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
      // Protected data must enter an error state when the session expires.
      queryFn: getQueryFn({ on401: "throw" }),
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
