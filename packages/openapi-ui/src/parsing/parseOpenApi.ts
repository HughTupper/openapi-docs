import * as yaml from "js-yaml";
import {
  OpenApiSpec,
  NormalizedEndpoint,
  NormalizedParameter,
  NormalizedRequestBody,
  NormalizedResponse,
  NormalizedSchema,
  NormalizedMediaType,
  ParsedApiSpec,
  HttpMethod,
  Operation,
  Parameter,
  Reference,
  Schema,
  RequestBody,
  Response,
  MediaType,
} from "../types";

/**
 * Main function to parse and normalize an OpenAPI 3.x specification
 * Accepts either a parsed OpenAPI object or a string (JSON/YAML)
 */
export function parseOpenApi(spec: OpenApiSpec | string): ParsedApiSpec {
  const parsedSpec = typeof spec === "string" ? parseSpecString(spec) : spec;
  const endpoints = extractEndpoints(parsedSpec);
  const schemas = extractSchemas(parsedSpec);

  return {
    info: parsedSpec.info,
    servers: parsedSpec.servers || [],
    endpoints,
    schemas,
    tags: parsedSpec.tags || [],
    securitySchemes: parsedSpec.components?.securitySchemes as
      | Record<string, any>
      | undefined,
  };
}

/**
 * Parse an OpenAPI specification from a string (JSON or YAML)
 */
function parseSpecString(specString: string): OpenApiSpec {
  try {
    // First try JSON parsing
    return JSON.parse(specString);
  } catch (jsonError) {
    try {
      // If JSON parsing fails, try YAML parsing
      const parsed = yaml.load(specString);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as OpenApiSpec;
      }
      throw new Error("Parsed YAML is not a valid object");
    } catch (yamlError) {
      throw new Error(
        `Failed to parse OpenAPI specification. Invalid JSON: ${
          (jsonError as Error).message
        }. Invalid YAML: ${(yamlError as Error).message}`
      );
    }
  }
}

/**
 * Extract and normalize all endpoints from the OpenAPI spec
 */
function extractEndpoints(spec: OpenApiSpec): NormalizedEndpoint[] {
  const endpoints: NormalizedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const httpMethods: HttpMethod[] = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
      "trace",
    ];

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (operation) {
        const endpoint = normalizeEndpoint(path, method, operation, spec);
        endpoints.push(endpoint);
      }
    }
  }

  return endpoints;
}

/**
 * Normalize a single endpoint operation
 */
function normalizeEndpoint(
  path: string,
  method: HttpMethod,
  operation: Operation,
  spec: OpenApiSpec
): NormalizedEndpoint {
  const id = generateEndpointId(method, path, operation.operationId);

  return {
    id,
    method,
    path,
    summary: operation.summary,
    description: operation.description,
    operationId: operation.operationId,
    tags: operation.tags,
    parameters: normalizeParameters(operation.parameters || [], spec),
    requestBody: operation.requestBody
      ? normalizeRequestBody(operation.requestBody, spec)
      : undefined,
    responses: normalizeResponses(operation.responses, spec),
    deprecated: operation.deprecated || false,
    security: operation.security,
  };
}

/**
 * Generate a unique ID for an endpoint
 */
function generateEndpointId(
  method: HttpMethod,
  path: string,
  operationId?: string
): string {
  if (operationId) {
    return operationId;
  }
  return `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

/**
 * Normalize parameters array
 */
function normalizeParameters(
  parameters: (Parameter | Reference)[],
  spec: OpenApiSpec
): NormalizedParameter[] {
  return parameters.map((param) => {
    const resolved = resolveReference(param, spec) as Parameter;
    return {
      name: resolved.name,
      in: resolved.in,
      description: resolved.description,
      required: resolved.required || false,
      deprecated: resolved.deprecated || false,
      schema: resolved.schema
        ? normalizeSchema(resolved.schema, spec)
        : undefined,
      example: resolved.example,
    };
  });
}

/**
 * Normalize request body
 */
function normalizeRequestBody(
  requestBody: RequestBody | Reference,
  spec: OpenApiSpec
): NormalizedRequestBody {
  const resolved = resolveReference(requestBody, spec) as RequestBody;

  return {
    description: resolved.description,
    required: resolved.required || false,
    content: Object.entries(resolved.content).map(([mediaType, content]) =>
      normalizeMediaType(mediaType, content, spec)
    ),
  };
}

/**
 * Normalize responses object
 */
function normalizeResponses(
  responses: Record<string, Response | Reference>,
  spec: OpenApiSpec
): NormalizedResponse[] {
  return Object.entries(responses).map(([statusCode, response]) => {
    const resolved = resolveReference(response, spec) as Response;

    return {
      statusCode,
      description: resolved.description,
      content: resolved.content
        ? Object.entries(resolved.content).map(([mediaType, content]) =>
            normalizeMediaType(mediaType, content, spec)
          )
        : undefined,
      headers: resolved.headers
        ? Object.fromEntries(
            Object.entries(resolved.headers).map(([name, header]) => [
              name,
              {
                name,
                description: (resolveReference(header, spec) as any)
                  .description,
                required:
                  (resolveReference(header, spec) as any).required || false,
                schema: (resolveReference(header, spec) as any).schema
                  ? normalizeSchema(
                      (resolveReference(header, spec) as any).schema,
                      spec
                    )
                  : undefined,
                example: (resolveReference(header, spec) as any).example,
              },
            ])
          )
        : undefined,
    };
  });
}

/**
 * Normalize media type
 */
function normalizeMediaType(
  mediaType: string,
  content: MediaType,
  spec: OpenApiSpec
): NormalizedMediaType {
  return {
    mediaType,
    schema: content.schema ? normalizeSchema(content.schema, spec) : undefined,
    example: content.example,
    examples: content.examples
      ? Object.fromEntries(
          Object.entries(content.examples).map(([name, example]) => [
            name,
            (resolveReference(example, spec) as any).value || example,
          ])
        )
      : undefined,
  };
}

/**
 * Normalize schema object
 */
function normalizeSchema(
  schema: Schema | Reference,
  spec: OpenApiSpec
): NormalizedSchema {
  const resolved = resolveReference(schema, spec) as Schema;

  const normalized: NormalizedSchema = {
    type: resolved.type,
    format: resolved.format,
    description: resolved.description,
    example: resolved.example,
    enum: resolved.enum,
    required: resolved.required,
    nullable: resolved.nullable,
    deprecated: resolved.deprecated,
    title: resolved.title,
    default: resolved.default,
    minimum: resolved.minimum,
    maximum: resolved.maximum,
    minLength: resolved.minLength,
    maxLength: resolved.maxLength,
    pattern: resolved.pattern,
    minItems: resolved.minItems,
    maxItems: resolved.maxItems,
    uniqueItems: resolved.uniqueItems,
  };

  // Handle object properties
  if (resolved.properties) {
    normalized.properties = Object.fromEntries(
      Object.entries(resolved.properties).map(([name, prop]) => [
        name,
        normalizeSchema(prop, spec),
      ])
    );
  }

  // Handle array items
  if (resolved.items) {
    normalized.items = normalizeSchema(resolved.items, spec);
  }

  // Handle additional properties
  if (resolved.additionalProperties !== undefined) {
    if (typeof resolved.additionalProperties === "boolean") {
      normalized.additionalProperties = resolved.additionalProperties;
    } else {
      normalized.additionalProperties = normalizeSchema(
        resolved.additionalProperties,
        spec
      );
    }
  }

  // Handle composition schemas
  if (resolved.allOf) {
    normalized.allOf = resolved.allOf.map((s) => normalizeSchema(s, spec));
  }
  if (resolved.oneOf) {
    normalized.oneOf = resolved.oneOf.map((s) => normalizeSchema(s, spec));
  }
  if (resolved.anyOf) {
    normalized.anyOf = resolved.anyOf.map((s) => normalizeSchema(s, spec));
  }

  return normalized;
}

/**
 * Extract all schemas from components
 */
function extractSchemas(spec: OpenApiSpec): Record<string, NormalizedSchema> {
  if (!spec.components?.schemas) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(spec.components.schemas).map(([name, schema]) => [
      name,
      normalizeSchema(schema, spec),
    ])
  );
}

/**
 * Resolve $ref references
 */
function resolveReference<T>(item: T | Reference, spec: OpenApiSpec): T {
  if (typeof item === "object" && item !== null && "$ref" in item) {
    const ref = (item as Reference).$ref;
    const path = ref.replace("#/", "").split("/");

    let current: any = spec;
    for (const segment of path) {
      current = current[segment];
      if (!current) {
        throw new Error(`Unable to resolve reference: ${ref}`);
      }
    }

    return current as T;
  }

  return item as T;
}

/**
 * Utility function to find an endpoint by ID
 */
export function findEndpointById(
  endpoints: NormalizedEndpoint[],
  id: string
): NormalizedEndpoint | undefined {
  return endpoints.find((endpoint) => endpoint.id === id);
}

/**
 * Utility function to find an endpoint by method and path
 */
export function findEndpointByMethodAndPath(
  endpoints: NormalizedEndpoint[],
  method: HttpMethod,
  path: string
): NormalizedEndpoint | undefined {
  return endpoints.find(
    (endpoint) => endpoint.method === method && endpoint.path === path
  );
}

/**
 * Utility function to filter endpoints by tag
 */
export function filterEndpointsByTag(
  endpoints: NormalizedEndpoint[],
  tag: string
): NormalizedEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.tags?.includes(tag));
}

/**
 * Utility function to group endpoints by tag
 */
export function groupEndpointsByTag(
  endpoints: NormalizedEndpoint[]
): Record<string, NormalizedEndpoint[]> {
  const groups: Record<string, NormalizedEndpoint[]> = {};

  for (const endpoint of endpoints) {
    if (!endpoint.tags || endpoint.tags.length === 0) {
      const untagged = groups["Untagged"] || [];
      untagged.push(endpoint);
      groups["Untagged"] = untagged;
    } else {
      for (const tag of endpoint.tags) {
        const group = groups[tag] || [];
        group.push(endpoint);
        groups[tag] = group;
      }
    }
  }

  return groups;
}
