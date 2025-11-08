import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ApiProvider } from "../../context/ApiProvider";
import { useApiSpec, useEndpoints, useEndpoint, useSchema } from "../index";
import { mockOpenApiSpec } from "../../test/mockData";
import type { ReactNode } from "react";

// Helper wrapper component for tests
function createWrapper(spec = mockOpenApiSpec) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ApiProvider spec={spec}>{children}</ApiProvider>;
  };
}

describe("useApiSpec", () => {
  it("should return parsed API spec", () => {
    const { result } = renderHook(() => useApiSpec(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current?.info.title).toBe("Test API");
    expect(result.current?.endpoints).toHaveLength(5);
  });

  it("should throw error when used outside ApiProvider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useApiSpec());
    }).toThrow("useApiSpec must be used within an ApiProvider");

    // Restore console.error
    console.error = originalError;
  });
});

describe("useEndpoints", () => {
  const wrapper = createWrapper();

  it("should return all endpoints by default", () => {
    const { result } = renderHook(() => useEndpoints(), { wrapper });

    expect(result.current).toHaveLength(5);
  });

  it("should filter endpoints by method", () => {
    const { result } = renderHook(() => useEndpoints({ method: "get" }), {
      wrapper,
    });

    expect(result.current).toHaveLength(3);
    expect(result.current.every((e) => e.method === "get")).toBe(true);
  });

  it("should filter endpoints by tag", () => {
    const { result } = renderHook(() => useEndpoints({ tag: "users" }), {
      wrapper,
    });

    expect(result.current).toHaveLength(4);
    expect(result.current.every((e) => e.tags?.includes("users"))).toBe(true);
  });

  it("should filter endpoints by search term", () => {
    const { result } = renderHook(() => useEndpoints({ search: "List" }), {
      wrapper,
    });

    expect(result.current).toHaveLength(2); // "List users" and "List posts"
  });

  it("should apply custom filter function", () => {
    const { result } = renderHook(
      () =>
        useEndpoints({
          filter: (endpoint) => endpoint.operationId === "listUsers",
        }),
      { wrapper }
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].operationId).toBe("listUsers");
  });

  it("should combine multiple filters", () => {
    const { result } = renderHook(
      () =>
        useEndpoints({
          method: "get",
          tag: "users",
          search: "user",
        }),
      { wrapper }
    );

    expect(result.current).toHaveLength(2); // GET /users and GET /users/{id}
  });

  it("should throw error when used outside ApiProvider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useEndpoints());
    }).toThrow("useEndpoints must be used within an ApiProvider");

    // Restore console.error
    console.error = originalError;
  });
});

describe("useEndpoint", () => {
  const wrapper = createWrapper();

  it("should find endpoint by operation ID", () => {
    const { result } = renderHook(() => useEndpoint("listUsers"), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current?.operationId).toBe("listUsers");
  });

  it("should find endpoint by method and path", () => {
    const { result } = renderHook(
      () => useEndpoint({ method: "get", path: "/users" }),
      { wrapper }
    );

    expect(result.current).toBeDefined();
    expect(result.current?.method).toBe("get");
    expect(result.current?.path).toBe("/users");
  });

  it("should return undefined for non-existent endpoint", () => {
    const { result } = renderHook(() => useEndpoint("nonExistent"), {
      wrapper,
    });

    expect(result.current).toBeUndefined();
  });

  it("should throw error when used outside ApiProvider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useEndpoint("test"));
    }).toThrow("useEndpoint must be used within an ApiProvider");

    // Restore console.error
    console.error = originalError;
  });
});

describe("useSchema", () => {
  const wrapper = createWrapper();

  it("should return schema by name", () => {
    const { result } = renderHook(() => useSchema("User"), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current?.type).toBe("object");
    expect(result.current?.required).toEqual(["id", "username"]);
  });

  it("should return undefined for non-existent schema", () => {
    const { result } = renderHook(() => useSchema("NonExistent"), { wrapper });

    expect(result.current).toBeUndefined();
  });

  it("should throw error when used outside ApiProvider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useSchema("User"));
    }).toThrow("useSchema must be used within an ApiProvider");

    // Restore console.error
    console.error = originalError;
  });
});
