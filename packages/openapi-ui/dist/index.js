import { createContext, useState, useCallback, useMemo, useContext } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/parsing/parseOpenApi.ts
function parseOpenApi(spec) {
  const endpoints = extractEndpoints(spec);
  const schemas = extractSchemas(spec);
  return {
    info: spec.info,
    servers: spec.servers || [],
    endpoints,
    schemas,
    tags: spec.tags || [],
    securitySchemes: spec.components?.securitySchemes
  };
}
function extractEndpoints(spec) {
  const endpoints = [];
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const httpMethods = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
      "trace"
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
function normalizeEndpoint(path, method, operation, spec) {
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
    requestBody: operation.requestBody ? normalizeRequestBody(operation.requestBody, spec) : void 0,
    responses: normalizeResponses(operation.responses, spec),
    deprecated: operation.deprecated || false,
    security: operation.security
  };
}
function generateEndpointId(method, path, operationId) {
  if (operationId) {
    return operationId;
  }
  return `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`;
}
function normalizeParameters(parameters, spec) {
  return parameters.map((param) => {
    const resolved = resolveReference(param, spec);
    return {
      name: resolved.name,
      in: resolved.in,
      description: resolved.description,
      required: resolved.required || false,
      deprecated: resolved.deprecated || false,
      schema: resolved.schema ? normalizeSchema(resolved.schema, spec) : void 0,
      example: resolved.example
    };
  });
}
function normalizeRequestBody(requestBody, spec) {
  const resolved = resolveReference(requestBody, spec);
  return {
    description: resolved.description,
    required: resolved.required || false,
    content: Object.entries(resolved.content).map(
      ([mediaType, content]) => normalizeMediaType(mediaType, content, spec)
    )
  };
}
function normalizeResponses(responses, spec) {
  return Object.entries(responses).map(([statusCode, response]) => {
    const resolved = resolveReference(response, spec);
    return {
      statusCode,
      description: resolved.description,
      content: resolved.content ? Object.entries(resolved.content).map(
        ([mediaType, content]) => normalizeMediaType(mediaType, content, spec)
      ) : void 0,
      headers: resolved.headers ? Object.fromEntries(
        Object.entries(resolved.headers).map(([name, header]) => [
          name,
          {
            name,
            description: resolveReference(header, spec).description,
            required: resolveReference(header, spec).required || false,
            schema: resolveReference(header, spec).schema ? normalizeSchema(
              resolveReference(header, spec).schema,
              spec
            ) : void 0,
            example: resolveReference(header, spec).example
          }
        ])
      ) : void 0
    };
  });
}
function normalizeMediaType(mediaType, content, spec) {
  return {
    mediaType,
    schema: content.schema ? normalizeSchema(content.schema, spec) : void 0,
    example: content.example,
    examples: content.examples ? Object.fromEntries(
      Object.entries(content.examples).map(([name, example]) => [
        name,
        resolveReference(example, spec).value || example
      ])
    ) : void 0
  };
}
function normalizeSchema(schema, spec) {
  const resolved = resolveReference(schema, spec);
  const normalized = {
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
    uniqueItems: resolved.uniqueItems
  };
  if (resolved.properties) {
    normalized.properties = Object.fromEntries(
      Object.entries(resolved.properties).map(([name, prop]) => [
        name,
        normalizeSchema(prop, spec)
      ])
    );
  }
  if (resolved.items) {
    normalized.items = normalizeSchema(resolved.items, spec);
  }
  if (resolved.additionalProperties !== void 0) {
    if (typeof resolved.additionalProperties === "boolean") {
      normalized.additionalProperties = resolved.additionalProperties;
    } else {
      normalized.additionalProperties = normalizeSchema(
        resolved.additionalProperties,
        spec
      );
    }
  }
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
function extractSchemas(spec) {
  if (!spec.components?.schemas) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(spec.components.schemas).map(([name, schema]) => [
      name,
      normalizeSchema(schema, spec)
    ])
  );
}
function resolveReference(item, spec) {
  if (typeof item === "object" && item !== null && "$ref" in item) {
    const ref = item.$ref;
    const path = ref.replace("#/", "").split("/");
    let current = spec;
    for (const segment of path) {
      current = current[segment];
      if (!current) {
        throw new Error(`Unable to resolve reference: ${ref}`);
      }
    }
    return current;
  }
  return item;
}
function findEndpointById(endpoints, id) {
  return endpoints.find((endpoint) => endpoint.id === id);
}
function findEndpointByMethodAndPath(endpoints, method, path) {
  return endpoints.find(
    (endpoint) => endpoint.method === method && endpoint.path === path
  );
}
function filterEndpointsByTag(endpoints, tag) {
  return endpoints.filter((endpoint) => endpoint.tags?.includes(tag));
}
function groupEndpointsByTag(endpoints) {
  const groups = {};
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
var ApiContext = createContext(null);
function ApiProvider({
  children,
  spec: initialSpec,
  onError
}) {
  const [spec, setSpecState] = useState(() => {
    if (!initialSpec) return null;
    if ("endpoints" in initialSpec) {
      return initialSpec;
    }
    try {
      return parseOpenApi(initialSpec);
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : "Failed to parse OpenAPI specification";
      onError?.(errorMessage);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setSpec = useCallback((newSpec) => {
    setSpecState(newSpec);
    setError(null);
  }, []);
  const setErrorState = useCallback(
    (newError) => {
      setError(newError);
      if (newError) {
        onError?.(newError);
      }
    },
    [onError]
  );
  const endpoints = useMemo(() => spec?.endpoints || [], [spec]);
  const schemas = useMemo(() => spec?.schemas || {}, [spec]);
  const getEndpointById = useCallback(
    (id) => {
      return findEndpointById(endpoints, id);
    },
    [endpoints]
  );
  const getEndpointByMethodAndPath = useCallback(
    (method, path) => {
      return findEndpointByMethodAndPath(
        endpoints,
        method.toLowerCase(),
        path
      );
    },
    [endpoints]
  );
  const getSchema = useCallback(
    (name) => {
      return schemas[name];
    },
    [schemas]
  );
  const getEndpointsByTag = useCallback(
    (tag) => {
      return filterEndpointsByTag(endpoints, tag);
    },
    [endpoints]
  );
  const contextValue = useMemo(
    () => ({
      spec,
      loading,
      error,
      endpoints,
      schemas,
      setSpec,
      setLoading,
      setError: setErrorState,
      getEndpointById,
      getEndpointByMethodAndPath,
      getSchema,
      getEndpointsByTag
    }),
    [
      spec,
      loading,
      error,
      endpoints,
      schemas,
      setSpec,
      setErrorState,
      getEndpointById,
      getEndpointByMethodAndPath,
      getSchema,
      getEndpointsByTag
    ]
  );
  return /* @__PURE__ */ jsx(ApiContext.Provider, { value: contextValue, children });
}
function useApiSpec() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApiSpec must be used within an ApiProvider");
  }
  return context.spec;
}
function useEndpoints(options = {}) {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useEndpoints must be used within an ApiProvider");
  }
  const { filter, tag, method, search } = options;
  return useMemo(() => {
    let filtered = context.endpoints;
    if (tag) {
      filtered = context.getEndpointsByTag(tag);
    }
    if (method) {
      filtered = filtered.filter(
        (endpoint) => endpoint.method.toLowerCase() === method.toLowerCase()
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (endpoint) => endpoint.path.toLowerCase().includes(searchLower) || endpoint.summary?.toLowerCase().includes(searchLower) || endpoint.description?.toLowerCase().includes(searchLower) || endpoint.operationId?.toLowerCase().includes(searchLower)
      );
    }
    if (filter) {
      filtered = filtered.filter(filter);
    }
    return filtered;
  }, [
    context.endpoints,
    context.getEndpointsByTag,
    filter,
    tag,
    method,
    search
  ]);
}
function useEndpoint(identifier) {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useEndpoint must be used within an ApiProvider");
  }
  return useMemo(() => {
    if (typeof identifier === "string") {
      return context.getEndpointById(identifier);
    } else {
      return context.getEndpointByMethodAndPath(
        identifier.method,
        identifier.path
      );
    }
  }, [context, identifier]);
}
function useSchema(name) {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useSchema must be used within an ApiProvider");
  }
  return context.getSchema(name);
}
function useSchemas() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useSchemas must be used within an ApiProvider");
  }
  return context.schemas;
}
function EndpointList({
  endpoints: externalEndpoints,
  filter,
  groupBy,
  children,
  renderGroup,
  className,
  style,
  ...props
}) {
  const contextEndpoints = useEndpoints({ filter });
  const endpoints = externalEndpoints || contextEndpoints;
  if (!endpoints.length) {
    return null;
  }
  if (groupBy === "tag") {
    const groups = groupEndpointsByTag(endpoints);
    return /* @__PURE__ */ jsx("div", { className, style, ...props, children: Object.entries(groups).map(([tagName, tagEndpoints]) => {
      if (renderGroup) {
        return renderGroup(tagName, tagEndpoints);
      }
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: tagName }),
        tagEndpoints.map((endpoint, index) => /* @__PURE__ */ jsx("div", { children: children?.(endpoint, index) }, endpoint.id))
      ] }, tagName);
    }) });
  }
  if (groupBy === "method") {
    const methodGroups = endpoints.reduce((groups, endpoint) => {
      const method = endpoint.method.toUpperCase();
      if (!groups[method]) {
        groups[method] = [];
      }
      groups[method].push(endpoint);
      return groups;
    }, {});
    return /* @__PURE__ */ jsx("div", { className, style, ...props, children: Object.entries(methodGroups).map(([method, methodEndpoints]) => {
      if (renderGroup) {
        return renderGroup(method, methodEndpoints);
      }
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: method }),
        methodEndpoints.map((endpoint, index) => /* @__PURE__ */ jsx("div", { children: children?.(endpoint, index) }, endpoint.id))
      ] }, method);
    }) });
  }
  return /* @__PURE__ */ jsx("div", { className, style, ...props, children: endpoints.map((endpoint, index) => /* @__PURE__ */ jsx("div", { children: children?.(endpoint, index) }, endpoint.id)) });
}
function EndpointItem({
  endpoint,
  children,
  renderMethod,
  renderPath,
  renderSummary,
  className,
  style,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className,
      style,
      "data-method": endpoint.method,
      "data-endpoint-id": endpoint.id,
      ...props,
      children: [
        renderMethod ? renderMethod(endpoint.method) : /* @__PURE__ */ jsx("span", { children: endpoint.method.toUpperCase() }),
        renderPath ? renderPath(endpoint.path) : /* @__PURE__ */ jsx("span", { children: endpoint.path }),
        renderSummary ? renderSummary(endpoint.summary) : endpoint.summary && /* @__PURE__ */ jsx("span", { children: endpoint.summary }),
        children
      ]
    }
  );
}
function MethodBadge({
  method,
  children,
  className,
  style,
  ...props
}) {
  const methodUpper = method.toUpperCase();
  return /* @__PURE__ */ jsx("span", { className, style, "data-method": method, ...props, children: children || methodUpper });
}

export { ApiContext, ApiProvider, EndpointItem, EndpointList, MethodBadge, filterEndpointsByTag, findEndpointById, findEndpointByMethodAndPath, groupEndpointsByTag, parseOpenApi, useApiSpec, useEndpoint, useEndpoints, useSchema, useSchemas };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map