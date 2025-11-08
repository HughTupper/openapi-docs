import * as yaml from 'js-yaml';
import { createContext, useState, useCallback, useEffect, useMemo, useContext, useRef } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/parsing/parseOpenApi.ts
function parseOpenApi(spec) {
  const parsedSpec = typeof spec === "string" ? parseSpecString(spec) : spec;
  const endpoints = extractEndpoints(parsedSpec);
  const schemas = extractSchemas(parsedSpec);
  return {
    info: parsedSpec.info,
    servers: parsedSpec.servers || [],
    endpoints,
    schemas,
    tags: parsedSpec.tags || [],
    securitySchemes: parsedSpec.components?.securitySchemes
  };
}
function parseSpecString(specString) {
  try {
    return JSON.parse(specString);
  } catch (jsonError) {
    try {
      const parsed = yaml.load(specString);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
      throw new Error("Parsed YAML is not a valid object");
    } catch (yamlError) {
      throw new Error(
        `Failed to parse OpenAPI specification. Invalid JSON: ${jsonError.message}. Invalid YAML: ${yamlError.message}`
      );
    }
  }
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
var specCache = /* @__PURE__ */ new Map();
var defaultFetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch spec: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
};
function useApiLoader(initialConfig) {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(
    initialConfig?.url
  );
  const {
    cacheDuration = 5 * 60 * 1e3,
    // 5 minutes
    fetcher = defaultFetcher,
    retries = 3,
    retryDelay = 1e3
  } = initialConfig || {};
  const loadFromUrl = useCallback(
    async (url, config) => {
      const cached = specCache.get(url);
      if (cached && Date.now() - cached.timestamp < (config.cacheDuration || cacheDuration)) {
        return cached.spec;
      }
      const fetchFn = config.fetcher || fetcher;
      const maxRetries = config.retries || retries;
      const delay = config.retryDelay || retryDelay;
      let lastError = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const specText = await fetchFn(url);
          const parsedSpec = parseOpenApi(specText);
          specCache.set(url, {
            spec: parsedSpec,
            timestamp: Date.now()
          });
          return parsedSpec;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < maxRetries) {
            await new Promise(
              (resolve) => setTimeout(resolve, delay * Math.pow(2, attempt))
            );
          }
        }
      }
      throw lastError || new Error("Failed to load spec");
    },
    [cacheDuration, fetcher, retries, retryDelay]
  );
  const loadFromSpec = useCallback(
    (specInput) => {
      return parseOpenApi(specInput);
    },
    []
  );
  const loadSpec = useCallback(
    async (config) => {
      setLoading(true);
      setError(null);
      try {
        let parsedSpec;
        if (config.url) {
          setCurrentUrl(config.url);
          parsedSpec = await loadFromUrl(config.url, config);
        } else if (config.spec) {
          setCurrentUrl(void 0);
          parsedSpec = loadFromSpec(config.spec);
        } else {
          throw new Error("Either url or spec must be provided");
        }
        setSpec(parsedSpec);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load API specification";
        setError(errorMessage);
        setSpec(null);
      } finally {
        setLoading(false);
      }
    },
    [loadFromUrl, loadFromSpec]
  );
  const reload = useCallback(() => {
    if (currentUrl) {
      specCache.delete(currentUrl);
      loadSpec({
        url: currentUrl,
        cacheDuration,
        fetcher,
        retries,
        retryDelay
      });
    }
  }, [currentUrl, loadSpec, cacheDuration, fetcher, retries, retryDelay]);
  useEffect(() => {
    if (initialConfig && (initialConfig.url || initialConfig.spec)) {
      loadSpec(initialConfig);
    }
  }, []);
  return {
    spec,
    loading,
    error,
    reload,
    loadSpec
  };
}
function clearSpecCache() {
  specCache.clear();
}
function getCacheStats() {
  return {
    size: specCache.size,
    keys: Array.from(specCache.keys())
  };
}
function ApiProvider({
  children,
  spec: initialSpec,
  url,
  loaderConfig,
  onError,
  onLoadingChange
}) {
  const loader = useApiLoader(
    url ? { url, ...loaderConfig } : initialSpec ? { spec: initialSpec, ...loaderConfig } : void 0
  );
  const [localSpec, setLocalSpecState] = useState(() => {
    if (url || !initialSpec) return null;
    try {
      return parseOpenApi(initialSpec);
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : "Failed to parse OpenAPI specification";
      onError?.(errorMessage);
      return null;
    }
  });
  const [localError, setLocalError] = useState(null);
  const spec = url ? loader.spec : localSpec;
  const loading = url ? loader.loading : false;
  const error = url ? loader.error : localError;
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);
  const setSpec = useCallback(
    (newSpec) => {
      if (url) {
        console.warn(
          "Cannot set spec when using URL loading. Use reload() or loadSpec() instead."
        );
      } else {
        setLocalSpecState(newSpec);
        setLocalError(null);
      }
    },
    [url]
  );
  const setErrorState = useCallback(
    (newError) => {
      if (url) {
        console.warn("Cannot set error when using URL loading");
      } else {
        setLocalError(newError);
      }
    },
    [url]
  );
  const setLoading = useCallback(
    (_loading) => {
      if (url) {
        console.warn("Cannot set loading when using URL loading");
      }
    },
    [url]
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
function useSearch(options = {}) {
  const {
    searchFields = [
      "summary",
      "description",
      "operationId",
      "path",
      "tags",
      "parameters",
      "responses"
    ],
    caseSensitive = false,
    fuzzySearch = false,
    minQueryLength = 1
  } = options;
  const endpoints = useEndpoints();
  const [filters, setFilters] = useState({});
  const normalizeText = useCallback(
    (text) => {
      return caseSensitive ? text : text.toLowerCase();
    },
    [caseSensitive]
  );
  const fuzzyMatch = useCallback(
    (query, text) => {
      const normalizedQuery = normalizeText(query);
      const normalizedText = normalizeText(text);
      if (normalizedText.includes(normalizedQuery)) {
        return 1;
      }
      if (!fuzzySearch) return 0;
      let queryIndex = 0;
      let matches = 0;
      for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
        if (normalizedText[i] === normalizedQuery[queryIndex]) {
          matches++;
          queryIndex++;
        }
      }
      return queryIndex === normalizedQuery.length ? matches / normalizedQuery.length * 0.7 : 0;
    },
    [normalizeText, fuzzySearch]
  );
  const searchInEndpoint = useCallback(
    (endpoint, query) => {
      if (!query || query.length < minQueryLength) return null;
      const matchedFields = [];
      let totalScore = 0;
      const highlights = {};
      if (searchFields.includes("summary") && endpoint.summary) {
        const score = fuzzyMatch(query, endpoint.summary);
        if (score > 0) {
          matchedFields.push("summary");
          totalScore += score * 2;
          highlights.summary = endpoint.summary;
        }
      }
      if (searchFields.includes("description") && endpoint.description) {
        const score = fuzzyMatch(query, endpoint.description);
        if (score > 0) {
          matchedFields.push("description");
          totalScore += score * 1.5;
          highlights.description = endpoint.description;
        }
      }
      if (searchFields.includes("operationId") && endpoint.operationId) {
        const score = fuzzyMatch(query, endpoint.operationId);
        if (score > 0) {
          matchedFields.push("operationId");
          totalScore += score * 1.8;
          highlights.operationId = endpoint.operationId;
        }
      }
      if (searchFields.includes("path")) {
        const score = fuzzyMatch(query, endpoint.path);
        if (score > 0) {
          matchedFields.push("path");
          totalScore += score * 1.7;
          highlights.path = endpoint.path;
        }
      }
      if (searchFields.includes("tags") && endpoint.tags) {
        for (const tag of endpoint.tags) {
          const score = fuzzyMatch(query, tag);
          if (score > 0) {
            matchedFields.push("tags");
            totalScore += score * 1.3;
            highlights.tags = endpoint.tags.join(", ");
            break;
          }
        }
      }
      if (searchFields.includes("parameters") && endpoint.parameters) {
        for (const param of endpoint.parameters) {
          const nameScore = fuzzyMatch(query, param.name);
          const descScore = param.description ? fuzzyMatch(query, param.description) : 0;
          if (nameScore > 0 || descScore > 0) {
            matchedFields.push("parameters");
            totalScore += (nameScore + descScore) * 1.2;
            highlights.parameters = `Parameter: ${param.name}`;
            break;
          }
        }
      }
      if (searchFields.includes("responses")) {
        for (const response of endpoint.responses) {
          const score = response.description ? fuzzyMatch(query, response.description) : 0;
          if (score > 0) {
            matchedFields.push("responses");
            totalScore += score * 1.1;
            highlights.responses = `${response.statusCode}: ${response.description}`;
            break;
          }
        }
      }
      if (matchedFields.length === 0) return null;
      const normalizedScore = Math.min(totalScore / matchedFields.length, 1);
      return {
        endpoint,
        score: normalizedScore,
        matchedFields,
        highlights
      };
    },
    [searchFields, fuzzyMatch, minQueryLength]
  );
  const filteredResults = useMemo(() => {
    let results = endpoints;
    if (filters.methods && filters.methods.length > 0) {
      results = results.filter(
        (endpoint) => filters.methods.includes(endpoint.method)
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(
        (endpoint) => endpoint.tags?.some((tag) => filters.tags.includes(tag))
      );
    }
    if (filters.deprecated !== void 0) {
      results = results.filter(
        (endpoint) => endpoint.deprecated === filters.deprecated
      );
    }
    if (filters.hasParameters !== void 0) {
      results = results.filter(
        (endpoint) => filters.hasParameters ? endpoint.parameters && endpoint.parameters.length > 0 : !endpoint.parameters || endpoint.parameters.length === 0
      );
    }
    if (filters.hasRequestBody !== void 0) {
      results = results.filter(
        (endpoint) => filters.hasRequestBody ? !!endpoint.requestBody : !endpoint.requestBody
      );
    }
    if (filters.responseStatusCodes && filters.responseStatusCodes.length > 0) {
      results = results.filter(
        (endpoint) => endpoint.responses.some(
          (response) => filters.responseStatusCodes.includes(response.statusCode)
        )
      );
    }
    if (filters.query && filters.query.length >= minQueryLength) {
      const searchResults = results.map(
        (endpoint) => searchInEndpoint(endpoint, filters.query)
      ).filter(
        (result) => result !== null
      ).sort((a, b) => b.score - a.score);
      return searchResults;
    }
    return results.map((endpoint) => ({
      endpoint,
      score: 1,
      matchedFields: [],
      highlights: {}
    }));
  }, [endpoints, filters, searchInEndpoint, minQueryLength]);
  const getFilterOptions = useCallback(() => {
    const methods = /* @__PURE__ */ new Set();
    const tags = /* @__PURE__ */ new Set();
    const statusCodes = /* @__PURE__ */ new Set();
    for (const endpoint of endpoints) {
      methods.add(endpoint.method);
      if (endpoint.tags) {
        endpoint.tags.forEach((tag) => tags.add(tag));
      }
      endpoint.responses.forEach((response) => {
        statusCodes.add(response.statusCode);
      });
    }
    return {
      methods: Array.from(methods).sort(),
      tags: Array.from(tags).sort(),
      statusCodes: Array.from(statusCodes).sort()
    };
  }, [endpoints]);
  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  const setQuery = useCallback(
    (query) => {
      updateFilter("query", query);
    },
    [updateFilter]
  );
  return {
    filters,
    results: filteredResults,
    totalResults: filteredResults.length,
    isSearching: Object.keys(filters).some((key) => {
      const value = filters[key];
      return value !== void 0 && value !== null && (Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.length > 0 : true);
    }),
    setFilters,
    updateFilter,
    clearFilters,
    setQuery,
    getFilterOptions
  };
}
function useTextSearch(initialQuery = "", options = {}) {
  const search = useSearch(options);
  useEffect(() => {
    if (initialQuery) {
      search.setQuery(initialQuery);
    }
  }, []);
  return {
    query: search.filters.query || "",
    results: search.results,
    totalResults: search.totalResults,
    setQuery: search.setQuery,
    clearSearch: () => search.setQuery("")
  };
}
function useExecuteOperation(config = {}) {
  const {
    defaultConfig = {},
    defaultSecurity,
    interceptors,
    parseJson = true
  } = config;
  const spec = useApiSpec();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const abortControllerRef = useRef(null);
  const buildUrl = useCallback(
    (endpoint, params = {}) => {
      let baseUrl = defaultConfig.baseUrl || config.defaultConfig?.baseUrl;
      if (!baseUrl && spec?.servers && spec.servers.length > 0) {
        baseUrl = spec.servers[0].url;
      }
      if (!baseUrl) {
        throw new Error(
          "No base URL available. Provide baseUrl in config or ensure OpenAPI spec has servers."
        );
      }
      let path = endpoint.path;
      if (params.pathParams) {
        for (const [key, value] of Object.entries(params.pathParams)) {
          path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
        }
      }
      const url = new URL(path, baseUrl);
      if (params.queryParams) {
        for (const [key, value] of Object.entries(params.queryParams)) {
          if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
      return url.toString();
    },
    [defaultConfig.baseUrl, config.defaultConfig?.baseUrl, spec?.servers]
  );
  const applyAuthentication = useCallback(
    (headers, security) => {
      if (security.apiKey) {
        if (security.apiKey.in === "header") {
          headers.set(security.apiKey.name, security.apiKey.value);
        }
      }
      if (security.bearer) {
        headers.set("Authorization", `Bearer ${security.bearer.token}`);
      }
      if (security.basic) {
        const encoded = btoa(
          `${security.basic.username}:${security.basic.password}`
        );
        headers.set("Authorization", `Basic ${encoded}`);
      }
      if (security.oauth2) {
        headers.set("Authorization", `Bearer ${security.oauth2.token}`);
      }
      if (security.custom) {
        headers.set(security.custom.name, security.custom.value);
      }
    },
    []
  );
  const executeRequest = useCallback(
    async (endpoint, params = {}) => {
      setLoading(true);
      setError(null);
      setResult(null);
      abortControllerRef.current = new AbortController();
      let url = "";
      let init = {};
      try {
        url = buildUrl(endpoint, params);
        const security = { ...defaultSecurity, ...params.security };
        if (security.apiKey?.in === "query") {
          const urlObj = new URL(url);
          urlObj.searchParams.set(security.apiKey.name, security.apiKey.value);
          url = urlObj.toString();
        }
        const headers = new Headers();
        if (defaultConfig.headers) {
          Object.entries(defaultConfig.headers).forEach(([key, value]) => {
            headers.set(key, value);
          });
        }
        if (params.headers) {
          Object.entries(params.headers).forEach(([key, value]) => {
            headers.set(key, value);
          });
        }
        if (security) {
          applyAuthentication(headers, security);
        }
        let body;
        if (params.body !== void 0) {
          const contentType2 = params.contentType || "application/json";
          headers.set("Content-Type", contentType2);
          if (contentType2.includes("application/json")) {
            body = JSON.stringify(params.body);
          } else if (contentType2.includes("multipart/form-data")) {
            headers.delete("Content-Type");
            body = params.body instanceof FormData ? params.body : new FormData();
            if (!(params.body instanceof FormData)) {
              Object.entries(params.body).forEach(([key, value]) => {
                body.append(key, String(value));
              });
            }
          } else if (contentType2.includes("application/x-www-form-urlencoded")) {
            body = new URLSearchParams(
              Object.entries(params.body).map(([key, value]) => [
                key,
                String(value)
              ])
            ).toString();
          } else {
            body = String(params.body);
          }
        }
        init = {
          method: endpoint.method.toUpperCase(),
          headers,
          body,
          signal: abortControllerRef.current.signal,
          credentials: defaultConfig.withCredentials ? "include" : "same-origin"
        };
        if (interceptors?.onRequest) {
          const intercepted = await interceptors.onRequest(url, init);
          url = intercepted.url;
          init = intercepted.init;
        }
        const response = await fetch(url, init);
        let data;
        const contentType = response.headers.get("content-type") || "";
        if (parseJson && contentType.includes("application/json")) {
          data = await response.json();
        } else if (contentType.includes("text/")) {
          data = await response.text();
        } else {
          data = await response.blob();
        }
        if (!response.ok) {
          const errorMessage = typeof data === "object" && data.message ? data.message : `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }
        if (interceptors?.onResponse) {
          data = await interceptors.onResponse(response, data);
        }
        const executionResult = {
          data,
          status: response.status,
          headers: response.headers,
          response
        };
        setResult(executionResult);
        return executionResult;
      } catch (err) {
        const error2 = err instanceof Error ? err : new Error(String(err));
        if (error2.name !== "AbortError") {
          setError(error2.message);
          if (interceptors?.onError) {
            await interceptors.onError(error2, url, init);
          }
        }
        throw error2;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      buildUrl,
      defaultSecurity,
      defaultConfig,
      applyAuthentication,
      interceptors,
      parseJson
    ]
  );
  const executeById = useCallback(
    async (operationId, params) => {
      if (!spec?.endpoints) {
        throw new Error("No API specification loaded");
      }
      const endpoint = spec.endpoints.find(
        (ep) => ep.operationId === operationId
      );
      if (!endpoint) {
        throw new Error(`Operation with ID "${operationId}" not found`);
      }
      return executeRequest(endpoint, params);
    },
    [spec?.endpoints, executeRequest]
  );
  const execute = useCallback(
    async (endpoint, params) => {
      return executeRequest(endpoint, params);
    },
    [executeRequest]
  );
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  return {
    loading,
    error,
    result,
    executeById,
    execute,
    clearError,
    clearResult,
    cancel
  };
}
function useExecuteEndpoint(endpoint, config = {}) {
  const executor = useExecuteOperation(config);
  const execute = useCallback(
    async (params) => {
      if (!endpoint) {
        throw new Error("No endpoint provided");
      }
      return executor.execute(endpoint, params);
    },
    [endpoint, executor.execute]
  );
  return {
    ...executor,
    execute
  };
}
function useCodeSnippet() {
  const spec = useApiSpec();
  const [lastGenerated, setLastGenerated] = useState(
    null
  );
  const availableLanguages = useMemo(
    () => [
      { id: "curl", name: "cURL", extension: "sh" },
      { id: "javascript", name: "JavaScript (fetch)", extension: "js" },
      { id: "typescript", name: "TypeScript (fetch)", extension: "ts" },
      { id: "python", name: "Python (requests)", extension: "py" },
      { id: "node", name: "Node.js (axios)", extension: "js" },
      { id: "php", name: "PHP (cURL)", extension: "php" },
      { id: "java", name: "Java (OkHttp)", extension: "java" },
      { id: "go", name: "Go (net/http)", extension: "go" }
    ],
    []
  );
  const getBaseUrl = useCallback(
    (serverUrl) => {
      if (serverUrl) return serverUrl;
      if (spec?.servers && spec.servers.length > 0) {
        return spec.servers[0].url;
      }
      return "https://api.example.com";
    },
    [spec?.servers]
  );
  const buildUrl = useCallback(
    (endpoint, options) => {
      const baseUrl = getBaseUrl(options.serverUrl);
      let path = endpoint.path;
      if (options.parameters?.pathParams) {
        Object.entries(options.parameters.pathParams).forEach(
          ([key, value]) => {
            path = path.replace(`{${key}}`, String(value));
          }
        );
      }
      const url = new URL(path, baseUrl);
      if (options.parameters?.queryParams) {
        Object.entries(options.parameters.queryParams).forEach(
          ([key, value]) => {
            if (value !== void 0 && value !== null) {
              url.searchParams.set(key, String(value));
            }
          }
        );
      }
      return url.toString();
    },
    [getBaseUrl]
  );
  const generateAuthHeaders = useCallback(
    (auth) => {
      if (!auth) return {};
      const headers = {};
      switch (auth.type) {
        case "apiKey":
          if (auth.apiKey?.in === "header") {
            headers[auth.apiKey.name] = auth.apiKey.value;
          }
          break;
        case "bearer":
          if (auth.bearer?.token) {
            headers["Authorization"] = `Bearer ${auth.bearer.token}`;
          }
          break;
        case "basic":
          if (auth.basic?.username && auth.basic?.password) {
            const credentials = btoa(
              `${auth.basic.username}:${auth.basic.password}`
            );
            headers["Authorization"] = `Basic ${credentials}`;
          }
          break;
        case "oauth2":
          if (auth.oauth2?.token) {
            headers["Authorization"] = `Bearer ${auth.oauth2.token}`;
          }
          break;
      }
      return headers;
    },
    []
  );
  const generateCurl = useCallback(
    (endpoint, options) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      let curl = `curl -X ${method}`;
      Object.entries(allHeaders).forEach(([key, value]) => {
        curl += ` \\
  -H "${key}: ${value}"`;
      });
      if (options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method)) {
        const bodyStr = typeof options.parameters.body === "string" ? options.parameters.body : JSON.stringify(options.parameters.body, null, 2);
        curl += ` \\
  -H "Content-Type: application/json"`;
        curl += ` \\
  -d '${bodyStr}'`;
      }
      if (options.includeAuth && options.auth?.type === "apiKey" && options.auth.apiKey?.in === "query") {
        const separator = url.includes("?") ? "&" : "?";
        curl += ` \\
  "${url}${separator}${options.auth.apiKey.name}=${options.auth.apiKey.value}"`;
      } else {
        curl += ` \\
  "${url}"`;
      }
      return curl;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generateJavaScript = useCallback(
    (endpoint, options, isTypeScript = false) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      const hasBody = options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);
      if (hasBody) {
        allHeaders["Content-Type"] = "application/json";
      }
      let code = `// ${endpoint.summary || "API Request"}
`;
      if (isTypeScript) {
        code += `interface ApiResponse {
  // Define your response type here
  [key: string]: any;
}

`;
      }
      code += `const response`;
      if (isTypeScript) code += `: Response`;
      code += ` = await fetch('${url}', {
`;
      code += `  method: '${method}',
`;
      if (Object.keys(allHeaders).length > 0) {
        code += `  headers: {
`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    '${key}': '${value}',
`;
        });
        code += `  },
`;
      }
      if (hasBody && options.parameters?.body) {
        const bodyStr = typeof options.parameters.body === "string" ? `'${options.parameters.body}'` : JSON.stringify(options.parameters.body, null, 4).split("\n").join("\n  ");
        code += `  body: JSON.stringify(${bodyStr}),
`;
      }
      code += `});

`;
      code += `if (!response.ok) {
`;
      code += `  throw new Error(\`HTTP error! status: \${response.status}\`);
`;
      code += `}

`;
      code += `const data`;
      if (isTypeScript) code += `: ApiResponse`;
      code += ` = await response.json();
`;
      code += `console.log(data);`;
      return code;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generatePython = useCallback(
    (endpoint, options) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toLowerCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      let code = `import requests
import json

`;
      code += `# ${endpoint.summary || "API Request"}
`;
      code += `url = "${url}"
`;
      if (Object.keys(allHeaders).length > 0) {
        code += `headers = {
`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    "${key}": "${value}",
`;
        });
        code += `}
`;
      }
      const hasBody = options.parameters?.body && ["post", "put", "patch"].includes(method);
      if (hasBody && options.parameters?.body) {
        const bodyStr = typeof options.parameters.body === "string" ? options.parameters.body : JSON.stringify(options.parameters.body, null, 2);
        code += `
data = ${bodyStr.includes("{") ? bodyStr : `"${bodyStr}"`}
`;
      }
      code += `
response = requests.${method}(url`;
      if (Object.keys(allHeaders).length > 0) {
        code += `, headers=headers`;
      }
      if (hasBody) {
        code += `, json=data if isinstance(data, dict) else data`;
      }
      code += `)

`;
      code += `response.raise_for_status()  # Raises an HTTPError for bad responses
`;
      code += `result = response.json()
`;
      code += `print(result)`;
      return code;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generateNode = useCallback(
    (endpoint, options) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toLowerCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      let code = `const axios = require('axios');

`;
      code += `// ${endpoint.summary || "API Request"}
`;
      code += `const config = {
`;
      code += `  method: '${method}',
`;
      code += `  url: '${url}',
`;
      if (Object.keys(allHeaders).length > 0) {
        code += `  headers: {
`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    '${key}': '${value}',
`;
        });
        code += `  },
`;
      }
      const hasBody = options.parameters?.body && ["post", "put", "patch"].includes(method);
      if (hasBody && options.parameters?.body) {
        const bodyStr = typeof options.parameters.body === "string" ? `'${options.parameters.body}'` : JSON.stringify(options.parameters.body, null, 2);
        code += `  data: ${bodyStr},
`;
      }
      code += `};

`;
      code += `axios(config)
`;
      code += `  .then(response => {
`;
      code += `    console.log(response.data);
`;
      code += `  })
`;
      code += `  .catch(error => {
`;
      code += `    console.error('Error:', error.response?.data || error.message);
`;
      code += `  });`;
      return code;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generatePhp = useCallback(
    (endpoint, options) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      let code = `<?php

`;
      code += `// ${endpoint.summary || "API Request"}
`;
      code += `$url = "${url}";
`;
      const hasBody = options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);
      code += `$curl = curl_init();

`;
      code += `curl_setopt_array($curl, [
`;
      code += `    CURLOPT_URL => $url,
`;
      code += `    CURLOPT_RETURNTRANSFER => true,
`;
      code += `    CURLOPT_CUSTOMREQUEST => "${method}",
`;
      if (Object.keys(allHeaders).length > 0 || hasBody) {
        code += `    CURLOPT_HTTPHEADER => [
`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `        "${key}: ${value}",
`;
        });
        if (hasBody) {
          code += `        "Content-Type: application/json",
`;
        }
        code += `    ],
`;
      }
      if (hasBody && options.parameters?.body) {
        const bodyStr = typeof options.parameters.body === "string" ? options.parameters.body : JSON.stringify(options.parameters.body);
        code += `    CURLOPT_POSTFIELDS => '${bodyStr}',
`;
      }
      code += `]);

`;
      code += `$response = curl_exec($curl);
`;
      code += `$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
`;
      code += `curl_close($curl);

`;
      code += `if ($httpCode >= 200 && $httpCode < 300) {
`;
      code += `    $data = json_decode($response, true);
`;
      code += `    print_r($data);
`;
      code += `} else {
`;
      code += `    echo "HTTP Error: $httpCode\\n";
`;
      code += `    echo $response;
`;
      code += `}`;
      return code;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generateJava = useCallback(
    (endpoint, options) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      let code = `import okhttp3.*;
import java.io.IOException;

`;
      code += `public class ApiClient {
`;
      code += `    public static void main(String[] args) throws IOException {
`;
      code += `        OkHttpClient client = new OkHttpClient();

`;
      const hasBody = options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);
      if (hasBody && options.parameters?.body) {
        const bodyStr = typeof options.parameters.body === "string" ? options.parameters.body : JSON.stringify(options.parameters.body);
        code += `        RequestBody body = RequestBody.create(
`;
        code += `            "${bodyStr}",
`;
        code += `            MediaType.parse("application/json")
`;
        code += `        );

`;
      }
      code += `        Request.Builder requestBuilder = new Request.Builder()
`;
      code += `            .url("${url}")
`;
      code += `            .method("${method}", ${hasBody ? "body" : "null"});

`;
      if (Object.keys(allHeaders).length > 0) {
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `        requestBuilder.addHeader("${key}", "${value}");
`;
        });
        code += `
`;
      }
      code += `        Request request = requestBuilder.build();
`;
      code += `        Response response = client.newCall(request).execute();

`;
      code += `        if (response.isSuccessful()) {
`;
      code += `            System.out.println(response.body().string());
`;
      code += `        } else {
`;
      code += `            System.err.println("HTTP Error: " + response.code());
`;
      code += `            System.err.println(response.body().string());
`;
      code += `        }
`;
      code += `    }
`;
      code += `}`;
      return code;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generateGo = useCallback(
    (endpoint, options) => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth ? generateAuthHeaders(options.auth) : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };
      let code = `package main

`;
      code += `import (
`;
      code += `    "bytes"
`;
      code += `    "fmt"
`;
      code += `    "io"
`;
      code += `    "net/http"
`;
      if (options.parameters?.body && typeof options.parameters.body === "object") {
        code += `    "encoding/json"
`;
      }
      code += `)

`;
      code += `func main() {
`;
      const hasBody = options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);
      if (hasBody && options.parameters?.body) {
        if (typeof options.parameters.body === "object") {
          code += `    data := map[string]interface{}${JSON.stringify(
            options.parameters.body,
            null,
            4
          ).replace(/"/g, "`")}
`;
          code += `    jsonData, _ := json.Marshal(data)
`;
          code += `    req, err := http.NewRequest("${method}", "${url}", bytes.NewBuffer(jsonData))
`;
        } else {
          code += `    body := []byte(\`${options.parameters.body}\`)
`;
          code += `    req, err := http.NewRequest("${method}", "${url}", bytes.NewBuffer(body))
`;
        }
      } else {
        code += `    req, err := http.NewRequest("${method}", "${url}", nil)
`;
      }
      code += `    if err != nil {
`;
      code += `        panic(err)
`;
      code += `    }

`;
      if (Object.keys(allHeaders).length > 0 || hasBody) {
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    req.Header.Set("${key}", "${value}")
`;
        });
        if (hasBody) {
          code += `    req.Header.Set("Content-Type", "application/json")
`;
        }
        code += `
`;
      }
      code += `    client := &http.Client{}
`;
      code += `    resp, err := client.Do(req)
`;
      code += `    if err != nil {
`;
      code += `        panic(err)
`;
      code += `    }
`;
      code += `    defer resp.Body.Close()

`;
      code += `    body, err := io.ReadAll(resp.Body)
`;
      code += `    if err != nil {
`;
      code += `        panic(err)
`;
      code += `    }

`;
      code += `    fmt.Printf("Status: %s\\n", resp.Status)
`;
      code += `    fmt.Printf("Response: %s\\n", string(body))
`;
      code += `}`;
      return code;
    },
    [buildUrl, generateAuthHeaders]
  );
  const generateForEndpoint = useCallback(
    (endpoint, options) => {
      const language = availableLanguages.find(
        (lang) => lang.id === options.language
      );
      if (!language) {
        throw new Error(`Unsupported language: ${options.language}`);
      }
      let code;
      switch (options.language) {
        case "curl":
          code = generateCurl(endpoint, options);
          break;
        case "javascript":
          code = generateJavaScript(endpoint, options, false);
          break;
        case "typescript":
          code = generateJavaScript(endpoint, options, true);
          break;
        case "python":
          code = generatePython(endpoint, options);
          break;
        case "node":
          code = generateNode(endpoint, options);
          break;
        case "php":
          code = generatePhp(endpoint, options);
          break;
        case "java":
          code = generateJava(endpoint, options);
          break;
        case "go":
          code = generateGo(endpoint, options);
          break;
        default:
          throw new Error(
            `Code generation not implemented for language: ${options.language}`
          );
      }
      const result = {
        code,
        language,
        description: `${language.name} code for ${endpoint.method.toUpperCase()} ${endpoint.path}`
      };
      setLastGenerated(result);
      return result;
    },
    [
      availableLanguages,
      generateCurl,
      generateJavaScript,
      generatePython,
      generateNode,
      generatePhp,
      generateJava,
      generateGo
    ]
  );
  const generate = useCallback(
    (operationId, options) => {
      if (!spec?.endpoints) {
        throw new Error("No API spec available");
      }
      const endpoint = findEndpointById(spec.endpoints, operationId);
      if (!endpoint) {
        throw new Error(`Operation with ID "${operationId}" not found`);
      }
      return generateForEndpoint(endpoint, options);
    },
    [spec, generateForEndpoint]
  );
  return {
    /** Available programming languages for code generation */
    availableLanguages,
    /** Generate code snippet for an operation by ID */
    generate,
    /** Generate code snippet for a specific endpoint */
    generateForEndpoint,
    /** Last generated code snippet */
    lastGenerated,
    /** Clear the last generated result */
    clearLast: useCallback(() => setLastGenerated(null), [])
  };
}
function useEndpointCodeSnippet(endpoint) {
  const codeSnippet = useCodeSnippet();
  const generate = useCallback(
    (options) => {
      if (!endpoint) {
        throw new Error("No endpoint provided");
      }
      return codeSnippet.generateForEndpoint(endpoint, options);
    },
    [endpoint, codeSnippet]
  );
  return {
    ...codeSnippet,
    /** Generate code snippet for the specific endpoint */
    generate
  };
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

export { ApiContext, ApiProvider, EndpointItem, EndpointList, MethodBadge, clearSpecCache, filterEndpointsByTag, findEndpointById, findEndpointByMethodAndPath, getCacheStats, groupEndpointsByTag, parseOpenApi, useApiLoader, useApiSpec, useCodeSnippet, useEndpoint, useEndpointCodeSnippet, useEndpoints, useExecuteEndpoint, useExecuteOperation, useSchema, useSchemas, useSearch, useTextSearch };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map