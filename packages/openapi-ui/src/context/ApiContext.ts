import { createContext } from "react";
import { ParsedApiSpec, NormalizedEndpoint, NormalizedSchema } from "../types";

export interface ApiContextValue {
  spec: ParsedApiSpec | null;
  loading: boolean;
  error: string | null;

  // Computed values
  endpoints: NormalizedEndpoint[];
  schemas: Record<string, NormalizedSchema>;

  // Actions
  setSpec: (spec: ParsedApiSpec) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utilities
  getEndpointById: (id: string) => NormalizedEndpoint | undefined;
  getEndpointByMethodAndPath: (
    method: string,
    path: string
  ) => NormalizedEndpoint | undefined;
  getSchema: (name: string) => NormalizedSchema | undefined;
  getEndpointsByTag: (tag: string) => NormalizedEndpoint[];
}

export const ApiContext = createContext<ApiContextValue | null>(null);
