import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("API session handling", () => {
  it("refreshes a stale CSRF token and retries the rejected mutation once", async () => {
    fetchMock.mockResolvedValueOnce(json({ csrfToken: "old" }))
      .mockResolvedValueOnce(json({ code: "CSRF_INVALID_TOKEN" }, 403))
      .mockResolvedValueOnce(json({ csrfToken: "new" }))
      .mockResolvedValueOnce(json({ id: "booking-1" }, 201));
    const { apiRequest } = await import("../client/src/lib/queryClient");
    expect((await apiRequest("POST", "/api/bookings", { visitorName: "Example" })).status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3][1].headers["X-CSRF-Token"]).toBe("new");
  });
  it("does not retry a role denial or a server failure", async () => {
    fetchMock.mockResolvedValueOnce(json({ csrfToken: "token" }))
      .mockResolvedValueOnce(json({ message: "Access denied" }, 403));
    const { apiRequest } = await import("../client/src/lib/queryClient");
    await expect(apiRequest("DELETE", "/api/bookings/1")).rejects.toThrow("403: Access denied");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("stops after one CSRF retry", async () => {
    fetchMock.mockResolvedValueOnce(json({ csrfToken: "old" }))
      .mockResolvedValueOnce(json({ code: "CSRF_INVALID_TOKEN" }, 403))
      .mockResolvedValueOnce(json({ csrfToken: "new" }))
      .mockResolvedValueOnce(json({ message: "Forbidden: Invalid CSRF token" }, 403));
    const { apiRequest } = await import("../client/src/lib/queryClient");
    await expect(apiRequest("POST", "/api/bookings", {})).rejects.toThrow("403:");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("shares the initial token request across concurrent mutations", async () => {
    fetchMock.mockResolvedValueOnce(json({ csrfToken: "token" }))
      .mockImplementation(async () => json({ ok: true }));
    const { apiRequest } = await import("../client/src/lib/queryClient");
    await Promise.all([apiRequest("POST", "/api/one"), apiRequest("POST", "/api/two")]);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/csrf")).toHaveLength(1);
  });
  it("preserves false request bodies", async () => {
    fetchMock.mockResolvedValueOnce(json({ csrfToken: "token" })).mockResolvedValueOnce(json({ ok: true }));
    const { apiRequest } = await import("../client/src/lib/queryClient");
    await apiRequest("POST", "/api/example", false);
    expect(fetchMock.mock.calls[1][1].body).toBe("false");
  });
  it("treats protected 401s as errors, while the auth probe can return null", async () => {
    fetchMock.mockImplementation(async () => json({ message: "Unauthorized" }, 401));
    const { queryClient, getQueryFn } = await import("../client/src/lib/queryClient");
    await expect(queryClient.fetchQuery({ queryKey: ["/api/bookings"], retry: false })).rejects.toThrow("401: Unauthorized");
    await expect(queryClient.fetchQuery({ queryKey: ["/api/auth/user"], queryFn: getQueryFn({ on401: "returnNull" }) })).resolves.toBeNull();
    queryClient.clear();
  });
});
