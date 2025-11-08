import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { ApiProvider } from "../../context/ApiProvider";
import { useSearch, useTextSearch } from "../useSearch";

const mockSpec = {
  openapi: "3.0.0" as const,
  info: { title: "Test API", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        summary: "List all users",
        description: "Get a list of all users in the system",
        tags: ["users"],
        parameters: [
          {
            name: "limit",
            in: "query" as const,
            description: "Number of users to return",
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
        description: "Create a new user account",
        tags: ["users"],
        requestBody: {
          description: "User data",
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
    "/posts": {
      get: {
        operationId: "listPosts",
        summary: "List posts",
        description: "Get blog posts from the system",
        tags: ["posts", "blog"],
        responses: {
          "200": {
            description: "List of posts",
            content: {
              "application/json": {
                schema: { type: "array" as const },
              },
            },
          },
        },
      },
    },
    "/admin/stats": {
      get: {
        operationId: "getAdminStats",
        summary: "Get admin statistics",
        description: "Get administrative statistics",
        tags: ["admin"],
        deprecated: true,
        responses: {
          "200": {
            description: "Statistics data",
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

function TestWrapper({ children }: { children: ReactNode }) {
  return <ApiProvider spec={mockSpec}>{children}</ApiProvider>;
}

describe("useSearch", () => {
  it("should return all endpoints when no filters applied", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    expect(result.current.results).toHaveLength(4); // 4 endpoints total
    expect(result.current.totalResults).toBe(4);
    expect(result.current.isSearching).toBe(false);
  });

  it("should filter by text query", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.setQuery("user");
    });

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.isSearching).toBe(true);

    // Should find endpoints related to users
    const userEndpoints = result.current.results.filter((r) =>
      r.matchedFields.some((field) =>
        ["summary", "description", "operationId"].includes(field)
      )
    );
    expect(userEndpoints.length).toBeGreaterThan(0);
  });

  it("should filter by HTTP method", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("methods", ["post"]);
    });

    expect(result.current.results).toHaveLength(1); // Only POST /users
    expect(result.current.results[0].endpoint.method).toBe("post");
    expect(result.current.isSearching).toBe(true);
  });

  it("should filter by tags", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("tags", ["users"]);
    });

    expect(result.current.results).toHaveLength(2); // GET and POST /users
    expect(
      result.current.results.every((r) => r.endpoint.tags?.includes("users"))
    ).toBe(true);
  });

  it("should filter by deprecated status", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("deprecated", true);
    });

    expect(result.current.results).toHaveLength(1); // Only deprecated endpoint
    expect(result.current.results[0].endpoint.deprecated).toBe(true);
    expect(result.current.results[0].endpoint.operationId).toBe(
      "getAdminStats"
    );
  });

  it("should filter by hasParameters", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("hasParameters", true);
    });

    expect(result.current.results).toHaveLength(1); // Only GET /users has parameters
    expect(result.current.results[0].endpoint.operationId).toBe("listUsers");
  });

  it("should filter by hasRequestBody", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("hasRequestBody", true);
    });

    expect(result.current.results).toHaveLength(1); // Only POST /users has request body
    expect(result.current.results[0].endpoint.operationId).toBe("createUser");
  });

  it("should filter by response status codes", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("responseStatusCodes", ["201"]);
    });

    expect(result.current.results).toHaveLength(1); // Only POST /users returns 201
    expect(result.current.results[0].endpoint.operationId).toBe("createUser");
  });

  it("should combine multiple filters", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.setFilters({
        methods: ["get"],
        tags: ["users"],
        hasParameters: true,
      });
    });

    expect(result.current.results).toHaveLength(1); // Only GET /users matches all criteria
    expect(result.current.results[0].endpoint.operationId).toBe("listUsers");
  });

  it("should provide filter options", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    const options = result.current.getFilterOptions();

    expect(options.methods).toContain("get");
    expect(options.methods).toContain("post");
    expect(options.tags).toContain("users");
    expect(options.tags).toContain("posts");
    expect(options.tags).toContain("admin");
    expect(options.statusCodes).toContain("200");
    expect(options.statusCodes).toContain("201");
  });

  it("should clear filters", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateFilter("methods", ["post"]);
    });
    expect(result.current.isSearching).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.results).toHaveLength(4); // Back to all endpoints
  });

  it("should rank search results by relevance", () => {
    const { result } = renderHook(() => useSearch(), { wrapper: TestWrapper });

    act(() => {
      result.current.setQuery("user");
    });

    expect(result.current.results.length).toBeGreaterThan(1);

    // Results should be sorted by score (descending)
    for (let i = 1; i < result.current.results.length; i++) {
      expect(result.current.results[i].score).toBeLessThanOrEqual(
        result.current.results[i - 1].score
      );
    }
  });

  it("should respect minimum query length", () => {
    const { result } = renderHook(() => useSearch({ minQueryLength: 3 }), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setQuery("u"); // Too short
    });

    expect(result.current.results).toHaveLength(4); // Should return all results
    expect(
      result.current.results.every((r) => r.matchedFields.length === 0)
    ).toBe(true);
  });
});

describe("useTextSearch", () => {
  it("should provide simple text search interface", () => {
    const { result } = renderHook(() => useTextSearch(""), {
      wrapper: TestWrapper,
    });

    expect(result.current.query).toBe("");
    expect(result.current.totalResults).toBe(4);

    act(() => {
      result.current.setQuery("user");
    });

    expect(result.current.query).toBe("user");
    expect(result.current.results.length).toBeGreaterThan(0);
  });

  it("should clear search", () => {
    const { result } = renderHook(() => useTextSearch("user"), {
      wrapper: TestWrapper,
    });

    expect(result.current.query).toBe("user");

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe("");
    expect(result.current.totalResults).toBe(4);
  });
});
