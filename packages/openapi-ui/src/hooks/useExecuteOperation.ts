import { useState, useCallback, useRef } from "react";
import { useApiSpec } from "./useApiSpec";
import { NormalizedEndpoint } from "../types";

export interface RequestConfig {
  /** Base URL for the API (overrides servers from spec) */
  baseUrl?: string;
  /** HTTP headers to include with the request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to include credentials (cookies) */
  withCredentials?: boolean;
}

export interface SecurityConfig {
  /** API key authentication */
  apiKey?: {
    name: string;
    value: string;
    in: "query" | "header" | "cookie";
  };
  /** Bearer token authentication */
  bearer?: {
    token: string;
  };
  /** Basic authentication */
  basic?: {
    username: string;
    password: string;
  };
  /** OAuth2 token */
  oauth2?: {
    token: string;
  };
  /** Custom authentication header */
  custom?: {
    name: string;
    value: string;
  };
}

export interface RequestInterceptor {
  /** Called before the request is sent */
  onRequest?: (
    url: string,
    init: RequestInit
  ) =>
    | Promise<{ url: string; init: RequestInit }>
    | { url: string; init: RequestInit };
  /** Called after a successful response */
  onResponse?: (response: Response, data: any) => Promise<any> | any;
  /** Called when an error occurs */
  onError?: (
    error: Error,
    url: string,
    init: RequestInit
  ) => Promise<void> | void;
}

export interface ExecuteOperationParams {
  /** Path parameters */
  pathParams?: Record<string, string | number>;
  /** Query parameters */
  queryParams?: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >;
  /** Request body */
  body?: any;
  /** Content type for request body */
  contentType?: string;
  /** Security configuration for this request */
  security?: SecurityConfig;
  /** Request-specific headers */
  headers?: Record<string, string>;
}

export interface ExecuteOperationResult {
  /** Response data */
  data: any;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Full Response object */
  response: Response;
}

export interface UseExecuteOperationState {
  /** Whether a request is currently in progress */
  loading: boolean;
  /** Error from the last request */
  error: string | null;
  /** Result from the last successful request */
  result: ExecuteOperationResult | null;
  /** Execute an operation by ID */
  executeById: (
    operationId: string,
    params?: ExecuteOperationParams
  ) => Promise<ExecuteOperationResult>;
  /** Execute an operation by endpoint object */
  execute: (
    endpoint: NormalizedEndpoint,
    params?: ExecuteOperationParams
  ) => Promise<ExecuteOperationResult>;
  /** Clear the current error */
  clearError: () => void;
  /** Clear the current result */
  clearResult: () => void;
  /** Cancel the current request (if supported) */
  cancel: () => void;
}

export interface UseExecuteOperationConfig {
  /** Default request configuration */
  defaultConfig?: RequestConfig;
  /** Default security configuration */
  defaultSecurity?: SecurityConfig;
  /** Request interceptors */
  interceptors?: RequestInterceptor;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Whether to automatically parse JSON responses */
  parseJson?: boolean;
}

/**
 * Hook for executing OpenAPI operations
 */
export function useExecuteOperation(
  config: UseExecuteOperationConfig = {}
): UseExecuteOperationState {
  const {
    defaultConfig = {},
    defaultSecurity,
    interceptors,
    parseJson = true,
  } = config;

  const spec = useApiSpec();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteOperationResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(
    (endpoint: NormalizedEndpoint, params: ExecuteOperationParams = {}) => {
      // Get base URL from config, spec servers, or fallback
      let baseUrl = defaultConfig.baseUrl || config.defaultConfig?.baseUrl;

      if (!baseUrl && spec?.servers && spec.servers.length > 0) {
        baseUrl = spec.servers[0].url;
      }

      if (!baseUrl) {
        throw new Error(
          "No base URL available. Provide baseUrl in config or ensure OpenAPI spec has servers."
        );
      }

      // Replace path parameters
      let path = endpoint.path;
      if (params.pathParams) {
        for (const [key, value] of Object.entries(params.pathParams)) {
          path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
        }
      }

      // Build full URL
      const url = new URL(path, baseUrl);

      // Add query parameters
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
    (headers: Headers, security: SecurityConfig) => {
      if (security.apiKey) {
        if (security.apiKey.in === "header") {
          headers.set(security.apiKey.name, security.apiKey.value);
        }
        // Query and cookie auth are handled elsewhere
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
    async (
      endpoint: NormalizedEndpoint,
      params: ExecuteOperationParams = {}
    ): Promise<ExecuteOperationResult> => {
      setLoading(true);
      setError(null);
      setResult(null);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Declare variables outside try block for error interceptor
      let url = "";
      let init: RequestInit = {};

      try {
        // Build URL with path and query params
        url = buildUrl(endpoint, params);

        // Handle API key in query params
        const security = { ...defaultSecurity, ...params.security };
        if (security.apiKey?.in === "query") {
          const urlObj = new URL(url);
          urlObj.searchParams.set(security.apiKey.name, security.apiKey.value);
          url = urlObj.toString();
        }

        // Prepare headers
        const headers = new Headers();

        // Add default headers
        if (defaultConfig.headers) {
          Object.entries(defaultConfig.headers).forEach(([key, value]) => {
            headers.set(key, value);
          });
        }

        // Add request-specific headers
        if (params.headers) {
          Object.entries(params.headers).forEach(([key, value]) => {
            headers.set(key, value);
          });
        }

        // Apply authentication
        if (security) {
          applyAuthentication(headers, security);
        }

        // Prepare request body
        let body: string | FormData | undefined;
        if (params.body !== undefined) {
          const contentType = params.contentType || "application/json";
          headers.set("Content-Type", contentType);

          if (contentType.includes("application/json")) {
            body = JSON.stringify(params.body);
          } else if (contentType.includes("multipart/form-data")) {
            // For FormData, don't set Content-Type header (browser will set it with boundary)
            headers.delete("Content-Type");
            body =
              params.body instanceof FormData ? params.body : new FormData();
            if (!(params.body instanceof FormData)) {
              Object.entries(params.body).forEach(([key, value]) => {
                (body as FormData).append(key, String(value));
              });
            }
          } else if (
            contentType.includes("application/x-www-form-urlencoded")
          ) {
            body = new URLSearchParams(
              Object.entries(params.body).map(([key, value]) => [
                key,
                String(value),
              ])
            ).toString();
          } else {
            body = String(params.body);
          }
        }

        // Prepare request init
        init = {
          method: endpoint.method.toUpperCase(),
          headers,
          body,
          signal: abortControllerRef.current.signal,
          credentials: defaultConfig.withCredentials
            ? "include"
            : "same-origin",
        };

        // Apply request interceptor
        if (interceptors?.onRequest) {
          const intercepted = await interceptors.onRequest(url, init);
          url = intercepted.url;
          init = intercepted.init;
        }

        // Make the request
        const response = await fetch(url, init);

        // Parse response
        let data: any;
        const contentType = response.headers.get("content-type") || "";

        if (parseJson && contentType.includes("application/json")) {
          data = await response.json();
        } else if (contentType.includes("text/")) {
          data = await response.text();
        } else {
          data = await response.blob();
        }

        // Check if response is ok
        if (!response.ok) {
          const errorMessage =
            typeof data === "object" && data.message
              ? data.message
              : `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        // Apply response interceptor
        if (interceptors?.onResponse) {
          data = await interceptors.onResponse(response, data);
        }

        const executionResult: ExecuteOperationResult = {
          data,
          status: response.status,
          headers: response.headers,
          response,
        };

        setResult(executionResult);
        return executionResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Don't set error state for aborted requests
        if (error.name !== "AbortError") {
          setError(error.message);

          // Apply error interceptor
          if (interceptors?.onError) {
            await interceptors.onError(error, url, init);
          }
        }

        throw error;
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
      parseJson,
    ]
  );

  const executeById = useCallback(
    async (
      operationId: string,
      params?: ExecuteOperationParams
    ): Promise<ExecuteOperationResult> => {
      if (!spec?.endpoints) {
        throw new Error("No API specification loaded");
      }

      const endpoint = spec.endpoints.find(
        (ep: NormalizedEndpoint) => ep.operationId === operationId
      );
      if (!endpoint) {
        throw new Error(`Operation with ID "${operationId}" not found`);
      }

      return executeRequest(endpoint, params);
    },
    [spec?.endpoints, executeRequest]
  );

  const execute = useCallback(
    async (
      endpoint: NormalizedEndpoint,
      params?: ExecuteOperationParams
    ): Promise<ExecuteOperationResult> => {
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
    cancel,
  };
}

/**
 * Hook for executing a specific operation
 */
export function useExecuteEndpoint(
  endpoint: NormalizedEndpoint | null,
  config: UseExecuteOperationConfig = {}
) {
  const executor = useExecuteOperation(config);

  const execute = useCallback(
    async (params?: ExecuteOperationParams) => {
      if (!endpoint) {
        throw new Error("No endpoint provided");
      }
      return executor.execute(endpoint, params);
    },
    [endpoint, executor.execute]
  );

  return {
    ...executor,
    execute,
  };
}
