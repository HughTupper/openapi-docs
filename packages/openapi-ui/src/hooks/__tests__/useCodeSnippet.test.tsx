import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { ApiProvider } from "../../context/ApiProvider";
import { useCodeSnippet, useEndpointCodeSnippet } from "../useCodeSnippet";
import { NormalizedEndpoint } from "../../types";

const mockSpec = {
  openapi: "3.0.0" as const,
  info: { title: "Test API", version: "1.0.0" },
  servers: [
    { url: "https://api.example.com" },
    { url: "https://staging-api.example.com" },
  ],
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
          },
        },
      },
      post: {
        operationId: "createUser",
        summary: "Create a new user",
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
    },
  ],
  deprecated: false,
};

function TestWrapper({ children }: { children: ReactNode }) {
  return <ApiProvider spec={mockSpec}>{children}</ApiProvider>;
}

describe("useCodeSnippet", () => {
  it("should provide available languages", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    expect(result.current.availableLanguages).toHaveLength(8);
    expect(result.current.availableLanguages.map((l) => l.id)).toEqual([
      "curl",
      "javascript",
      "typescript",
      "python",
      "node",
      "php",
      "java",
      "go",
    ]);
  });

  it("should generate cURL snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "curl",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("curl -X GET");
    expect(snippet.code).toContain("https://api.example.com/users/123");
    expect(snippet.language.name).toBe("cURL");
    expect(snippet.description).toContain("GET /users/{id}");
  });

  it("should generate cURL snippet with authentication", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      includeAuth: true,
      auth: {
        type: "bearer",
        bearer: { token: "test-token" },
      },
    });

    expect(snippet.code).toContain('-H "Authorization: Bearer test-token"');
  });

  it("should generate cURL snippet with API key in header", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      includeAuth: true,
      auth: {
        type: "apiKey",
        apiKey: { name: "X-API-Key", value: "secret-key", in: "header" },
      },
    });

    expect(snippet.code).toContain('-H "X-API-Key: secret-key"');
  });

  it("should generate cURL snippet with API key in query", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      includeAuth: true,
      auth: {
        type: "apiKey",
        apiKey: { name: "api_key", value: "secret-key", in: "query" },
      },
    });

    expect(snippet.code).toContain("api_key=secret-key");
  });

  it("should generate cURL snippet with basic auth", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      includeAuth: true,
      auth: {
        type: "basic",
        basic: { username: "user", password: "pass" },
      },
    });

    const expectedAuth = btoa("user:pass");
    expect(snippet.code).toContain(`-H "Authorization: Basic ${expectedAuth}"`);
  });

  it("should generate cURL snippet with request body", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const userData = { name: "John Doe", email: "john@example.com" };
    const snippet = result.current.generate("createUser", {
      language: "curl",
      parameters: { body: userData },
    });

    expect(snippet.code).toContain('-H "Content-Type: application/json"');
    expect(snippet.code).toContain(JSON.stringify(userData, null, 2));
  });

  it("should generate JavaScript snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "javascript",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("const response = await fetch(");
    expect(snippet.code).toContain("method: 'GET'");
    expect(snippet.code).toContain("https://api.example.com/users/123");
    expect(snippet.code).toContain("const data = await response.json()");
  });

  it("should generate TypeScript snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "typescript",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("interface ApiResponse");
    expect(snippet.code).toContain("const response: Response = await fetch(");
    expect(snippet.code).toContain(
      "const data: ApiResponse = await response.json()"
    );
  });

  it("should generate JavaScript snippet with request body", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const userData = { name: "Jane Doe" };
    const snippet = result.current.generate("createUser", {
      language: "javascript",
      parameters: { body: userData },
    });

    expect(snippet.code).toContain("'Content-Type': 'application/json'");
    expect(snippet.code).toContain("body: JSON.stringify(");
  });

  it("should generate Python snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "python",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("import requests");
    expect(snippet.code).toContain("response = requests.get(");
    expect(snippet.code).toContain("response.raise_for_status()");
  });

  it("should generate Node.js snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "node",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("const axios = require('axios')");
    expect(snippet.code).toContain("method: 'get'");
    expect(snippet.code).toContain("axios(config)");
  });

  it("should generate PHP snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "php",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("<?php");
    expect(snippet.code).toContain("$curl = curl_init()");
    expect(snippet.code).toContain('CURLOPT_CUSTOMREQUEST => "GET"');
  });

  it("should generate Java snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "java",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("import okhttp3.*");
    expect(snippet.code).toContain("OkHttpClient client = new OkHttpClient()");
    expect(snippet.code).toContain('.method("GET", null)');
  });

  it("should generate Go snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("getUserById", {
      language: "go",
      parameters: { pathParams: { id: "123" } },
    });

    expect(snippet.code).toContain("package main");
    expect(snippet.code).toContain('http.NewRequest("GET"');
    expect(snippet.code).toContain("client.Do(req)");
  });

  it("should handle query parameters", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      parameters: {
        queryParams: { limit: 10, active: true },
      },
    });

    expect(snippet.code).toContain("limit=10");
    expect(snippet.code).toContain("active=true");
  });

  it("should handle custom headers", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      parameters: {
        headers: { "Custom-Header": "custom-value" },
      },
    });

    expect(snippet.code).toContain('-H "Custom-Header: custom-value"');
  });

  it("should use custom server URL", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generate("listUsers", {
      language: "curl",
      serverUrl: "https://custom.api.com",
    });

    expect(snippet.code).toContain("https://custom.api.com/users");
  });

  it("should store and clear last generated snippet", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    expect(result.current.lastGenerated).toBeNull();

    let snippet: any;
    act(() => {
      snippet = result.current.generate("listUsers", { language: "curl" });
    });

    expect(result.current.lastGenerated).toEqual(snippet);

    act(() => {
      result.current.clearLast();
    });

    expect(result.current.lastGenerated).toBeNull();
  });

  it("should throw error for unknown operation ID", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    expect(() => {
      result.current.generate("unknownOperation", { language: "curl" });
    }).toThrow('Operation with ID "unknownOperation" not found');
  });

  it("should throw error for unsupported language", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    expect(() => {
      result.current.generate("listUsers", { language: "unsupported" as any });
    }).toThrow("Unsupported language: unsupported");
  });

  it("should generate snippet for endpoint directly", () => {
    const { result } = renderHook(() => useCodeSnippet(), {
      wrapper: TestWrapper,
    });

    const snippet = result.current.generateForEndpoint(mockUserEndpoint, {
      language: "curl",
      parameters: { pathParams: { id: "456" } },
    });

    expect(snippet.code).toContain("curl -X GET");
    expect(snippet.code).toContain("/users/456");
  });
});

describe("useEndpointCodeSnippet", () => {
  it("should generate code for specific endpoint", () => {
    const { result } = renderHook(
      () => useEndpointCodeSnippet(mockUserEndpoint),
      { wrapper: TestWrapper }
    );

    const snippet = result.current.generate({
      language: "javascript",
      parameters: { pathParams: { id: "789" } },
    });

    expect(snippet.code).toContain("fetch(");
    expect(snippet.code).toContain("/users/789");
  });

  it("should throw error when no endpoint provided", () => {
    const { result } = renderHook(() => useEndpointCodeSnippet(null), {
      wrapper: TestWrapper,
    });

    expect(() => {
      result.current.generate({ language: "curl" });
    }).toThrow("No endpoint provided");
  });

  it("should inherit all base functionality", () => {
    const { result } = renderHook(
      () => useEndpointCodeSnippet(mockUserEndpoint),
      { wrapper: TestWrapper }
    );

    expect(result.current.availableLanguages).toHaveLength(8);
    expect(result.current.lastGenerated).toBeNull();
    expect(typeof result.current.clearLast).toBe("function");
  });
});
