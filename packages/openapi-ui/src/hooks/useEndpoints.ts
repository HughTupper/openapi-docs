import { useContext, useMemo } from "react";
import { ApiContext } from "../context/ApiContext";
import { NormalizedEndpoint } from "../types";

export interface UseEndpointsOptions {
  filter?: (endpoint: NormalizedEndpoint) => boolean;
  tag?: string;
  method?: string;
  search?: string;
}

/**
 * Hook to access and filter the list of endpoints
 */
export function useEndpoints(
  options: UseEndpointsOptions = {}
): NormalizedEndpoint[] {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useEndpoints must be used within an ApiProvider");
  }

  const { filter, tag, method, search } = options;

  return useMemo(() => {
    let filtered = context.endpoints;

    // Apply tag filter
    if (tag) {
      filtered = context.getEndpointsByTag(tag);
    }

    // Apply method filter
    if (method) {
      filtered = filtered.filter(
        (endpoint) => endpoint.method.toLowerCase() === method.toLowerCase()
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (endpoint) =>
          endpoint.path.toLowerCase().includes(searchLower) ||
          endpoint.summary?.toLowerCase().includes(searchLower) ||
          endpoint.description?.toLowerCase().includes(searchLower) ||
          endpoint.operationId?.toLowerCase().includes(searchLower)
      );
    }

    // Apply custom filter function
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
    search,
  ]);
}
