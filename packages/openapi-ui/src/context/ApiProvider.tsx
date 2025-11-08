import { useState, useCallback, useMemo, ReactNode, useEffect } from "react";
import { ApiContext, ApiContextValue } from "./ApiContext";
import { ParsedApiSpec, OpenApiSpec } from "../types";
import {
  parseOpenApi,
  findEndpointById,
  findEndpointByMethodAndPath,
  filterEndpointsByTag,
} from "../parsing/parseOpenApi";
import { useApiLoader, ApiLoaderConfig } from "../hooks/useApiLoader";

export interface ApiProviderProps {
  children: ReactNode;
  /** Pre-parsed or raw OpenAPI spec (not used if url is provided) */
  spec?: OpenApiSpec | string;
  /** URL to fetch OpenAPI spec from */
  url?: string;
  /** Loader configuration for URL fetching */
  loaderConfig?: Omit<ApiLoaderConfig, "url" | "spec">;
  /** Error callback */
  onError?: (error: string) => void;
  /** Loading callback */
  onLoadingChange?: (loading: boolean) => void;
}

export function ApiProvider({
  children,
  spec: initialSpec,
  url,
  loaderConfig,
  onError,
  onLoadingChange,
}: ApiProviderProps) {
  // Use the loader if URL is provided, otherwise handle spec directly
  const loader = useApiLoader(
    url
      ? { url, ...loaderConfig }
      : initialSpec
      ? { spec: initialSpec, ...loaderConfig }
      : undefined
  );

  // Use loader state if URL loading, otherwise manage local state
  const [localSpec, setLocalSpecState] = useState<ParsedApiSpec | null>(() => {
    if (url || !initialSpec) return null;

    // Parse OpenAPI spec
    try {
      return parseOpenApi(initialSpec);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to parse OpenAPI specification";
      onError?.(errorMessage);
      return null;
    }
  });

  const [localError, setLocalError] = useState<string | null>(null);

  const spec = url ? loader.spec : localSpec;
  const loading = url ? loader.loading : false;
  const error = url ? loader.error : localError;

  // Notify loading changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Notify errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const setSpec = useCallback(
    (newSpec: ParsedApiSpec) => {
      if (url) {
        // Can't override spec when using URL loading
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
    (newError: string | null) => {
      if (url) {
        // Can't directly set error for URL loader
        console.warn("Cannot set error when using URL loading");
      } else {
        setLocalError(newError);
      }
    },
    [url]
  );

  const setLoading = useCallback(
    (_loading: boolean) => {
      if (url) {
        // Can't directly set loading for URL loader
        console.warn("Cannot set loading when using URL loading");
      }
      // For local specs, loading is always false after initial parse
    },
    [url]
  );

  // Computed values
  const endpoints = useMemo(() => spec?.endpoints || [], [spec]);
  const schemas = useMemo(() => spec?.schemas || {}, [spec]);

  // Utility functions
  const getEndpointById = useCallback(
    (id: string) => {
      return findEndpointById(endpoints, id);
    },
    [endpoints]
  );

  const getEndpointByMethodAndPath = useCallback(
    (method: string, path: string) => {
      return findEndpointByMethodAndPath(
        endpoints,
        method.toLowerCase() as any,
        path
      );
    },
    [endpoints]
  );

  const getSchema = useCallback(
    (name: string) => {
      return schemas[name];
    },
    [schemas]
  );

  const getEndpointsByTag = useCallback(
    (tag: string) => {
      return filterEndpointsByTag(endpoints, tag);
    },
    [endpoints]
  );

  const contextValue: ApiContextValue = useMemo(
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
      getEndpointsByTag,
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
      getEndpointsByTag,
    ]
  );

  return (
    <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>
  );
}
