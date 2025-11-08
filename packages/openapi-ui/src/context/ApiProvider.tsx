import { useState, useCallback, useMemo, ReactNode } from "react";
import { ApiContext, ApiContextValue } from "./ApiContext";
import { ParsedApiSpec, OpenApiSpec } from "../types";
import {
  parseOpenApi,
  findEndpointById,
  findEndpointByMethodAndPath,
  filterEndpointsByTag,
} from "../parsing/parseOpenApi";

export interface ApiProviderProps {
  children: ReactNode;
  spec?: OpenApiSpec | ParsedApiSpec;
  onError?: (error: string) => void;
}

export function ApiProvider({
  children,
  spec: initialSpec,
  onError,
}: ApiProviderProps) {
  const [spec, setSpecState] = useState<ParsedApiSpec | null>(() => {
    if (!initialSpec) return null;

    // Check if it's already parsed
    if ("endpoints" in initialSpec) {
      return initialSpec as ParsedApiSpec;
    }

    // Parse OpenAPI spec
    try {
      return parseOpenApi(initialSpec as OpenApiSpec);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to parse OpenAPI specification";
      onError?.(errorMessage);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSpec = useCallback((newSpec: ParsedApiSpec) => {
    setSpecState(newSpec);
    setError(null);
  }, []);

  const setErrorState = useCallback(
    (newError: string | null) => {
      setError(newError);
      if (newError) {
        onError?.(newError);
      }
    },
    [onError]
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
