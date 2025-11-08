import { useContext } from "react";
import { ApiContext } from "../context/ApiContext";
import { ParsedApiSpec } from "../types";

/**
 * Hook to access the parsed API specification
 */
export function useApiSpec(): ParsedApiSpec | null {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useApiSpec must be used within an ApiProvider");
  }

  return context.spec;
}
