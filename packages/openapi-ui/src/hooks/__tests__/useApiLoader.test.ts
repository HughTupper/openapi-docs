import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useApiLoader, clearSpecCache } from "../useApiLoader";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSpec = {
  openapi: "3.0.0" as const,
  info: { title: "Test API", version: "1.0.0" },
  paths: {
    "/test": {
      get: {
        operationId: "getTest",
        summary: "Test endpoint",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: { type: "object" as const },
              },
            },
          },
        },
      },
    },
  },
};

describe("useApiLoader", () => {
  beforeEach(() => {
    clearSpecCache();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should load spec from object", async () => {
    const { result } = renderHook(() => useApiLoader({ spec: mockSpec }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeDefined();
    expect(result.current.spec?.info.title).toBe("Test API");
    expect(result.current.error).toBeNull();
  });

  it("should load spec from JSON string", async () => {
    const jsonString = JSON.stringify(mockSpec);
    const { result } = renderHook(() => useApiLoader({ spec: jsonString }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeDefined();
    expect(result.current.spec?.info.title).toBe("Test API");
    expect(result.current.error).toBeNull();
  });

  it("should load spec from YAML string", async () => {
    const yamlString = `
openapi: 3.0.0
info:
  title: YAML Test API
  version: 1.0.0
paths:
  /yaml-test:
    get:
      operationId: getYamlTest
      summary: YAML Test endpoint
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
`;

    const { result } = renderHook(() => useApiLoader({ spec: yamlString }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeDefined();
    expect(result.current.spec?.info.title).toBe("YAML Test API");
    expect(result.current.error).toBeNull();
  });

  it("should load spec from URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockSpec)),
    });

    const { result } = renderHook(() =>
      useApiLoader({ url: "https://example.com/api.json" })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeDefined();
    expect(result.current.spec?.info.title).toBe("Test API");
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/api.json");
  });

  it("should handle fetch errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useApiLoader({ url: "https://example.com/api.json", retries: 0 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeNull();
    expect(result.current.error).toContain("Network error");
  });

  it("should handle HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const { result } = renderHook(() =>
      useApiLoader({ url: "https://example.com/api.json", retries: 0 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeNull();
    expect(result.current.error).toContain("404 Not Found");
  });

  it("should cache successful requests", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockSpec)),
    });

    // First call
    const { result: result1 } = renderHook(() =>
      useApiLoader({ url: "https://example.com/api.json" })
    );

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
    });

    expect(result1.current.spec).toBeDefined();

    // Second call should use cache
    const { result: result2 } = renderHook(() =>
      useApiLoader({ url: "https://example.com/api.json" })
    );

    await waitFor(() => {
      expect(result2.current.loading).toBe(false);
    });

    expect(result2.current.spec).toBeDefined();
    // Should only have been called once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockSpec)),
      });

    const { result } = renderHook(() =>
      useApiLoader({
        url: "https://example.com/api.json",
        retries: 1,
        retryDelay: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should handle invalid spec data", async () => {
    const { result } = renderHook(() =>
      useApiLoader({ spec: "invalid json {[}" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeNull();
    expect(result.current.error).toContain(
      "Failed to parse OpenAPI specification"
    );
  });

  it("should provide reload functionality", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockSpec)),
    });

    const { result } = renderHook(() =>
      useApiLoader({ url: "https://example.com/api.json" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock to test reload
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            ...mockSpec,
            info: { ...mockSpec.info, title: "Reloaded API" },
          })
        ),
    });

    // Reload should clear cache and fetch again
    result.current.reload();

    await waitFor(() => {
      expect(result.current.spec?.info.title).toBe("Reloaded API");
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should handle loadSpec with new URL", async () => {
    const { result } = renderHook(() => useApiLoader());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockSpec)),
    });

    result.current.loadSpec({ url: "https://example.com/new-api.json" });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.spec).toBeDefined();
    expect(result.current.spec?.info.title).toBe("Test API");
  });
});
