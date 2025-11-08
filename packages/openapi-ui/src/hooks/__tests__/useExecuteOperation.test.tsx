import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { ApiProvider } from "../../context/ApiProvider";
import {
  useExecuteOperation,
  useExecuteEndpoint,
} from "../useExecuteOperation";
import { NormalizedEndpoint } from "../../types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSpec = {
  openapi: "3.0.0" as const,
  info: { title: "Test API", version: "1.0.0" },
  servers: [{ url: "https://api.example.com" }],
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        summary: "List all users",
        parameters: [
          {
            name: "limit",
            in: "query" as const,
            schema: { type: "integer" as const },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { type: "array" as const },
              },
            },
          },
        },
      },
      post: {
        operationId: "createUser",
        summary: "Create user",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" as const },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: { type: "object" as const },
              },
            },
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        operationId: "getUserById",
        summary: "Get user by ID",
        parameters: [
          {
            name: "id",
            in: "path" as const,
            required: true,
            schema: { type: "string" as const },
          },
        ],
        responses: {
          "200": {
            description: "User found",
            content: {
              "application/json": {
                schema: { type: "object" as const },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object" as const,
                  properties: {
                    message: { type: "string" as const },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const mockUserEndpoint: NormalizedEndpoint = {
  id: "getUserById",
  method: "get",
  path: "/users/{id}",
  summary: "Get user by ID",
  operationId: "getUserById",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      description: "User ID",
      schema: { type: "string" },
    },
  ],
  responses: [
    {
      statusCode: "200",
      description: "User found",
      content: [
        {
          mediaType: "application/json",
          schema: { type: "object" },
        },
      ],
    },
  ],
  deprecated: false,
};

function TestWrapper({ children }: { children: ReactNode }) {
  return <ApiProvider spec={mockSpec}>{children}</ApiProvider>;
}

describe("useExecuteOperation", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should execute operation by ID successfully", async () => {
    const responseData = { id: 1, name: "John Doe" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(responseData),
    });

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    let executeResult: any;
    await act(async () => {
      executeResult = await result.current.executeById("getUserById", {
        pathParams: { id: "123" },
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users/123",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      })
    );

    expect(executeResult.data).toEqual(responseData);
    expect(executeResult.status).toBe(200);
    expect(result.current.result?.data).toEqual(responseData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should execute operation with query parameters", async () => {
    const responseData = [{ id: 1, name: "John" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(responseData),
    });

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.executeById("listUsers", {
        queryParams: { limit: 10, active: true },
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users?limit=10&active=true",
      expect.any(Object)
    );
  });

  it("should execute operation with request body", async () => {
    const requestData = { name: "Jane Doe", email: "jane@example.com" };
    const responseData = { id: 2, ...requestData };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(responseData),
    });

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.executeById("createUser", {
        body: requestData,
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(requestData),
        headers: expect.any(Headers),
      })
    );
  });

  it("should handle API key authentication", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(
      () =>
        useExecuteOperation({
          defaultSecurity: {
            apiKey: { name: "X-API-Key", value: "test-key", in: "header" },
          },
        }),
      { wrapper: TestWrapper }
    );

    await act(async () => {
      await result.current.executeById("listUsers");
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("X-API-Key")).toBe("test-key");
  });

  it("should handle bearer token authentication", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.executeById("listUsers", {
        security: {
          bearer: { token: "test-token" },
        },
      });
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("should handle basic authentication", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.executeById("listUsers", {
        security: {
          basic: { username: "user", password: "pass" },
        },
      });
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    const expectedAuth = btoa("user:pass");
    expect(headers.get("Authorization")).toBe(`Basic ${expectedAuth}`);
  });

  it("should handle HTTP errors", async () => {
    const errorResponse = { message: "User not found" };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(errorResponse),
    });

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.executeById("getUserById", {
          pathParams: { id: "999" },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("User not found");
      }
    });

    expect(result.current.error).toBe("User not found");
    expect(result.current.result).toBeNull();
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.executeById("listUsers");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Network error");
      }
    });

    expect(result.current.error).toBe("Network error");
  });

  it("should use request interceptor", async () => {
    const interceptor = vi.fn().mockImplementation(async (url, init) => ({
      url: url + "?intercepted=true",
      init: {
        ...init,
        headers: new Headers({ ...init.headers, "X-Intercepted": "true" }),
      },
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(
      () =>
        useExecuteOperation({
          interceptors: { onRequest: interceptor },
        }),
      { wrapper: TestWrapper }
    );

    await act(async () => {
      await result.current.executeById("listUsers");
    });

    expect(interceptor).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users?intercepted=true",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it("should use response interceptor", async () => {
    const originalData = { id: 1, name: "John" };
    const interceptedData = { ...originalData, intercepted: true };

    const interceptor = vi
      .fn()
      .mockImplementation(async (_response, _data) => interceptedData);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(originalData),
    });

    const { result } = renderHook(
      () =>
        useExecuteOperation({
          interceptors: { onResponse: interceptor },
        }),
      { wrapper: TestWrapper }
    );

    let executeResult: any;
    await act(async () => {
      executeResult = await result.current.executeById("getUserById", {
        pathParams: { id: "123" },
      });
    });

    expect(interceptor).toHaveBeenCalledWith(expect.any(Object), originalData);
    expect(executeResult.data).toEqual(interceptedData);
  });

  it("should clear error and result", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Test error"));

    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    // Generate an error
    await act(async () => {
      try {
        await result.current.executeById("listUsers");
      } catch {}
    });

    expect(result.current.error).toBe("Test error");

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();

    // Set up successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ test: "data" }),
    });

    // Execute successfully
    await act(async () => {
      await result.current.executeById("listUsers");
    });

    expect(result.current.result?.data).toEqual({ test: "data" });

    // Clear result
    act(() => {
      result.current.clearResult();
    });

    expect(result.current.result).toBeNull();
  });

  it("should throw error for unknown operation ID", async () => {
    const { result } = renderHook(() => useExecuteOperation(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.executeById("unknownOperation");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain(
          'Operation with ID "unknownOperation" not found'
        );
      }
    });
  });
});

describe("useExecuteEndpoint", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should execute specific endpoint", async () => {
    const responseData = { id: 123, name: "Test User" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(responseData),
    });

    const { result } = renderHook(() => useExecuteEndpoint(mockUserEndpoint), {
      wrapper: TestWrapper,
    });

    let executeResult: any;
    await act(async () => {
      executeResult = await result.current.execute({
        pathParams: { id: "123" },
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users/123",
      expect.any(Object)
    );
    expect(executeResult.data).toEqual(responseData);
  });

  it("should throw error when no endpoint provided", async () => {
    const { result } = renderHook(() => useExecuteEndpoint(null), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.execute();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toBe("No endpoint provided");
      }
    });
  });
});
