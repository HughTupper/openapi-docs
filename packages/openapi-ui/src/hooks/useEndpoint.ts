import { useContext, useMemo } from "react";
import { ApiContext } from "../context/ApiContext";
import { NormalizedEndpoint, HttpMethod } from "../types";

export type EndpointIdentifier =
  | string // operationId or endpoint ID
  | { method: HttpMethod; path: string }; // method + path combination

/**
 * Hook to access a specific endpoint by ID or method/path combination
 */
export function useEndpoint(
  identifier: EndpointIdentifier
): NormalizedEndpoint | undefined {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useEndpoint must be used within an ApiProvider");
  }

  return useMemo(() => {
    if (typeof identifier === "string") {
      // Search by ID or operationId
      return context.getEndpointById(identifier);
    } else {
      // Search by method and path
      return context.getEndpointByMethodAndPath(
        identifier.method,
        identifier.path
      );
    }
  }, [context, identifier]);
}
