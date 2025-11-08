import { describe, it, expect } from "vitest";
import {
  parseOpenApi,
  findEndpointById,
  findEndpointByMethodAndPath,
  filterEndpointsByTag,
  groupEndpointsByTag,
} from "../parseOpenApi";
import { mockOpenApiSpec } from "../../test/mockData";

describe("parseOpenApi", () => {
  it("should parse a valid OpenAPI spec object", () => {
    const result = parseOpenApi(mockOpenApiSpec);

    expect(result).toBeDefined();
    expect(result.info).toEqual(mockOpenApiSpec.info);
    expect(result.servers).toEqual(mockOpenApiSpec.servers);
    expect(result.tags).toEqual(mockOpenApiSpec.tags);
    expect(result.endpoints).toHaveLength(5); // 2 users GET/POST, 1 users/{id} GET/DELETE, 1 posts GET
  });

  it("should parse a valid OpenAPI spec from JSON string", () => {
    const jsonString = JSON.stringify(mockOpenApiSpec);
    const result = parseOpenApi(jsonString);

    expect(result).toBeDefined();
    expect(result.info).toEqual(mockOpenApiSpec.info);
    expect(result.endpoints).toHaveLength(5);
  });

  it("should parse a valid OpenAPI spec from YAML string", () => {
    const yamlString = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      operationId: getTest
      summary: Test endpoint
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
`;
    const result = parseOpenApi(yamlString);

    expect(result).toBeDefined();
    expect(result.info.title).toBe("Test API");
    expect(result.info.version).toBe("1.0.0");
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0].operationId).toBe("getTest");
  });

  it("should throw error for invalid JSON and YAML", () => {
    const invalidString = "invalid content {[}";
    expect(() => parseOpenApi(invalidString)).toThrow(
      /Failed to parse OpenAPI specification/
    );
  });

  it("should normalize endpoints correctly", () => {
    const result = parseOpenApi(mockOpenApiSpec);
    const endpoints = result.endpoints;

    // Check first endpoint
    const listUsers = endpoints.find((e) => e.operationId === "listUsers");
    expect(listUsers).toBeDefined();
    expect(listUsers?.method).toBe("get");
    expect(listUsers?.path).toBe("/users");
    expect(listUsers?.summary).toBe("List users");
    expect(listUsers?.tags).toEqual(["users"]);
    expect(listUsers?.parameters).toHaveLength(1);
    expect(listUsers?.parameters[0].name).toBe("limit");
    expect(listUsers?.parameters[0].required).toBe(false);
  });

  it("should handle parameters correctly", () => {
    const result = parseOpenApi(mockOpenApiSpec);
    const getUserById = result.endpoints.find(
      (e) => e.operationId === "getUserById"
    );

    expect(getUserById?.parameters).toHaveLength(1);
    expect(getUserById?.parameters[0]).toMatchObject({
      name: "userId",
      in: "path",
      required: true,
      description: "ID of user to retrieve",
    });
  });

  it("should handle request bodies correctly", () => {
    const result = parseOpenApi(mockOpenApiSpec);
    const createUser = result.endpoints.find(
      (e) => e.operationId === "createUser"
    );

    expect(createUser?.requestBody).toBeDefined();
    expect(createUser?.requestBody?.required).toBe(true);
    expect(createUser?.requestBody?.description).toBe("User to create");
    expect(createUser?.requestBody?.content).toHaveLength(1);
    expect(createUser?.requestBody?.content[0].mediaType).toBe(
      "application/json"
    );
  });

  it("should handle responses correctly", () => {
    const result = parseOpenApi(mockOpenApiSpec);
    const createUser = result.endpoints.find(
      (e) => e.operationId === "createUser"
    );

    expect(createUser?.responses).toHaveLength(2);

    const successResponse = createUser?.responses.find(
      (r) => r.statusCode === "201"
    );
    expect(successResponse).toBeDefined();
    expect(successResponse?.description).toBe("User created");

    const errorResponse = createUser?.responses.find(
      (r) => r.statusCode === "400"
    );
    expect(errorResponse).toBeDefined();
    expect(errorResponse?.description).toBe("Invalid input");
  });

  it("should extract schemas correctly", () => {
    const result = parseOpenApi(mockOpenApiSpec);
    const schemas = result.schemas;

    expect(schemas).toBeDefined();
    expect(schemas.User).toBeDefined();
    expect(schemas.User.type).toBe("object");
    expect(schemas.User.required).toEqual(["id", "username"]);
    expect(schemas.User.properties).toBeDefined();
    expect(schemas.User.properties?.id?.type).toBe("integer");
  });
});

describe("utility functions", () => {
  const parsedSpec = parseOpenApi(mockOpenApiSpec);
  const endpoints = parsedSpec.endpoints;

  describe("findEndpointById", () => {
    it("should find endpoint by operation ID", () => {
      const endpoint = findEndpointById(endpoints, "listUsers");
      expect(endpoint).toBeDefined();
      expect(endpoint?.operationId).toBe("listUsers");
    });

    it("should return undefined for non-existent ID", () => {
      const endpoint = findEndpointById(endpoints, "nonExistent");
      expect(endpoint).toBeUndefined();
    });
  });

  describe("findEndpointByMethodAndPath", () => {
    it("should find endpoint by method and path", () => {
      const endpoint = findEndpointByMethodAndPath(endpoints, "get", "/users");
      expect(endpoint).toBeDefined();
      expect(endpoint?.method).toBe("get");
      expect(endpoint?.path).toBe("/users");
    });

    it("should return undefined for non-existent combination", () => {
      const endpoint = findEndpointByMethodAndPath(
        endpoints,
        "patch",
        "/users"
      );
      expect(endpoint).toBeUndefined();
    });
  });

  describe("filterEndpointsByTag", () => {
    it("should filter endpoints by tag", () => {
      const userEndpoints = filterEndpointsByTag(endpoints, "users");
      expect(userEndpoints).toHaveLength(4); // GET/POST /users, GET/DELETE /users/{id}

      const postEndpoints = filterEndpointsByTag(endpoints, "posts");
      expect(postEndpoints).toHaveLength(1); // GET /posts
    });

    it("should return empty array for non-existent tag", () => {
      const filtered = filterEndpointsByTag(endpoints, "nonExistent");
      expect(filtered).toHaveLength(0);
    });
  });

  describe("groupEndpointsByTag", () => {
    it("should group endpoints by tags", () => {
      const grouped = groupEndpointsByTag(endpoints);

      expect(grouped.users).toHaveLength(4);
      expect(grouped.posts).toHaveLength(1);
    });

    it("should handle endpoints without tags", () => {
      // Create an endpoint without tags
      const endpointWithoutTags = { ...endpoints[0], tags: undefined };
      const endpointsWithUntagged = [...endpoints, endpointWithoutTags];

      const grouped = groupEndpointsByTag(endpointsWithUntagged);
      expect(grouped.Untagged).toHaveLength(1);
    });
  });
});
