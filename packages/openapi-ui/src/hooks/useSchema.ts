import { useContext } from "react";
import { ApiContext } from "../context/ApiContext";
import { NormalizedSchema } from "../types";

/**
 * Hook to access a schema by name from the components.schemas section
 */
export function useSchema(name: string): NormalizedSchema | undefined {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useSchema must be used within an ApiProvider");
  }

  return context.getSchema(name);
}

/**
 * Hook to access all schemas
 */
export function useSchemas(): Record<string, NormalizedSchema> {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useSchemas must be used within an ApiProvider");
  }

  return context.schemas;
}
