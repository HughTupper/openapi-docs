import { useState, useCallback, useMemo, useEffect } from "react";
import { useEndpoints } from "./useEndpoints";
import { NormalizedEndpoint, HttpMethod } from "../types";

export interface SearchFilters {
  /** Text search query */
  query?: string;
  /** Filter by HTTP methods */
  methods?: HttpMethod[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by deprecated status */
  deprecated?: boolean;
  /** Filter by endpoints with parameters */
  hasParameters?: boolean;
  /** Filter by endpoints with request body */
  hasRequestBody?: boolean;
  /** Filter by response status codes */
  responseStatusCodes?: string[];
}

export interface SearchOptions {
  /** Fields to search in (default: all) */
  searchFields?: (
    | "summary"
    | "description"
    | "operationId"
    | "path"
    | "tags"
    | "parameters"
    | "responses"
  )[];
  /** Case sensitive search (default: false) */
  caseSensitive?: boolean;
  /** Enable fuzzy search (default: false) */
  fuzzySearch?: boolean;
  /** Minimum search query length to trigger search (default: 1) */
  minQueryLength?: number;
}

export interface SearchResult {
  /** The matching endpoint */
  endpoint: NormalizedEndpoint;
  /** Relevance score (0-1, higher is more relevant) */
  score: number;
  /** Fields that matched the search query */
  matchedFields: string[];
  /** Highlighted text snippets */
  highlights?: Record<string, string>;
}

export interface UseSearchState {
  /** Current search filters */
  filters: SearchFilters;
  /** Search results */
  results: SearchResult[];
  /** Total number of results */
  totalResults: number;
  /** Whether search is active */
  isSearching: boolean;
  /** Set search filters */
  setFilters: (filters: SearchFilters) => void;
  /** Update specific filter */
  updateFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Get unique values for filter options */
  getFilterOptions: () => {
    methods: HttpMethod[];
    tags: string[];
    statusCodes: string[];
  };
}

/**
 * Advanced search hook for filtering and searching OpenAPI endpoints
 */
export function useSearch(options: SearchOptions = {}): UseSearchState {
  const {
    searchFields = [
      "summary",
      "description",
      "operationId",
      "path",
      "tags",
      "parameters",
      "responses",
    ],
    caseSensitive = false,
    fuzzySearch = false,
    minQueryLength = 1,
  } = options;

  const endpoints = useEndpoints();
  const [filters, setFilters] = useState<SearchFilters>({});

  // Normalize search query
  const normalizeText = useCallback(
    (text: string) => {
      return caseSensitive ? text : text.toLowerCase();
    },
    [caseSensitive]
  );

  // Simple fuzzy search implementation
  const fuzzyMatch = useCallback(
    (query: string, text: string): number => {
      const normalizedQuery = normalizeText(query);
      const normalizedText = normalizeText(text);

      if (normalizedText.includes(normalizedQuery)) {
        return 1; // Exact match gets highest score
      }

      if (!fuzzySearch) return 0;

      // Simple fuzzy matching - count matching characters in order
      let queryIndex = 0;
      let matches = 0;

      for (
        let i = 0;
        i < normalizedText.length && queryIndex < normalizedQuery.length;
        i++
      ) {
        if (normalizedText[i] === normalizedQuery[queryIndex]) {
          matches++;
          queryIndex++;
        }
      }

      return queryIndex === normalizedQuery.length
        ? (matches / normalizedQuery.length) * 0.7
        : 0;
    },
    [normalizeText, fuzzySearch]
  );

  // Search in endpoint text fields
  const searchInEndpoint = useCallback(
    (endpoint: NormalizedEndpoint, query: string): SearchResult | null => {
      if (!query || query.length < minQueryLength) return null;

      const matchedFields: string[] = [];
      let totalScore = 0;
      const highlights: Record<string, string> = {};

      // Search in summary
      if (searchFields.includes("summary") && endpoint.summary) {
        const score = fuzzyMatch(query, endpoint.summary);
        if (score > 0) {
          matchedFields.push("summary");
          totalScore += score * 2; // Summary is important
          highlights.summary = endpoint.summary;
        }
      }

      // Search in description
      if (searchFields.includes("description") && endpoint.description) {
        const score = fuzzyMatch(query, endpoint.description);
        if (score > 0) {
          matchedFields.push("description");
          totalScore += score * 1.5; // Description is moderately important
          highlights.description = endpoint.description;
        }
      }

      // Search in operationId
      if (searchFields.includes("operationId") && endpoint.operationId) {
        const score = fuzzyMatch(query, endpoint.operationId);
        if (score > 0) {
          matchedFields.push("operationId");
          totalScore += score * 1.8; // OperationId is quite important
          highlights.operationId = endpoint.operationId;
        }
      }

      // Search in path
      if (searchFields.includes("path")) {
        const score = fuzzyMatch(query, endpoint.path);
        if (score > 0) {
          matchedFields.push("path");
          totalScore += score * 1.7; // Path is important
          highlights.path = endpoint.path;
        }
      }

      // Search in tags
      if (searchFields.includes("tags") && endpoint.tags) {
        for (const tag of endpoint.tags) {
          const score = fuzzyMatch(query, tag);
          if (score > 0) {
            matchedFields.push("tags");
            totalScore += score * 1.3; // Tags are moderately important
            highlights.tags = endpoint.tags.join(", ");
            break; // Only count tags once
          }
        }
      }

      // Search in parameters
      if (searchFields.includes("parameters") && endpoint.parameters) {
        for (const param of endpoint.parameters) {
          const nameScore = fuzzyMatch(query, param.name);
          const descScore = param.description
            ? fuzzyMatch(query, param.description)
            : 0;

          if (nameScore > 0 || descScore > 0) {
            matchedFields.push("parameters");
            totalScore += (nameScore + descScore) * 1.2; // Parameters are moderately important
            highlights.parameters = `Parameter: ${param.name}`;
            break; // Only count parameters once
          }
        }
      }

      // Search in responses
      if (searchFields.includes("responses")) {
        for (const response of endpoint.responses) {
          const score = response.description
            ? fuzzyMatch(query, response.description)
            : 0;
          if (score > 0) {
            matchedFields.push("responses");
            totalScore += score * 1.1; // Responses are less important
            highlights.responses = `${response.statusCode}: ${response.description}`;
            break; // Only count responses once
          }
        }
      }

      if (matchedFields.length === 0) return null;

      // Normalize score (0-1 range)
      const normalizedScore = Math.min(totalScore / matchedFields.length, 1);

      return {
        endpoint,
        score: normalizedScore,
        matchedFields,
        highlights,
      };
    },
    [searchFields, fuzzyMatch, minQueryLength]
  );

  // Apply all filters
  const filteredResults = useMemo(() => {
    let results = endpoints;

    // Apply method filter
    if (filters.methods && filters.methods.length > 0) {
      results = results.filter((endpoint: NormalizedEndpoint) =>
        filters.methods!.includes(endpoint.method)
      );
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((endpoint: NormalizedEndpoint) =>
        endpoint.tags?.some((tag: string) => filters.tags!.includes(tag))
      );
    }

    // Apply deprecated filter
    if (filters.deprecated !== undefined) {
      results = results.filter(
        (endpoint: NormalizedEndpoint) =>
          endpoint.deprecated === filters.deprecated
      );
    }

    // Apply hasParameters filter
    if (filters.hasParameters !== undefined) {
      results = results.filter((endpoint: NormalizedEndpoint) =>
        filters.hasParameters
          ? endpoint.parameters && endpoint.parameters.length > 0
          : !endpoint.parameters || endpoint.parameters.length === 0
      );
    }

    // Apply hasRequestBody filter
    if (filters.hasRequestBody !== undefined) {
      results = results.filter((endpoint: NormalizedEndpoint) =>
        filters.hasRequestBody ? !!endpoint.requestBody : !endpoint.requestBody
      );
    }

    // Apply response status codes filter
    if (filters.responseStatusCodes && filters.responseStatusCodes.length > 0) {
      results = results.filter((endpoint: NormalizedEndpoint) =>
        endpoint.responses.some((response: any) =>
          filters.responseStatusCodes!.includes(response.statusCode)
        )
      );
    }

    // Apply text search
    if (filters.query && filters.query.length >= minQueryLength) {
      const searchResults = results
        .map((endpoint: NormalizedEndpoint) =>
          searchInEndpoint(endpoint, filters.query!)
        )
        .filter(
          (result: SearchResult | null): result is SearchResult =>
            result !== null
        )
        .sort((a: SearchResult, b: SearchResult) => b.score - a.score); // Sort by relevance

      return searchResults;
    }

    // If no text search, convert to SearchResult format
    return results.map((endpoint: NormalizedEndpoint) => ({
      endpoint,
      score: 1,
      matchedFields: [],
      highlights: {},
    }));
  }, [endpoints, filters, searchInEndpoint, minQueryLength]);

  // Get filter options
  const getFilterOptions = useCallback(() => {
    const methods = new Set<HttpMethod>();
    const tags = new Set<string>();
    const statusCodes = new Set<string>();

    for (const endpoint of endpoints) {
      methods.add(endpoint.method);

      if (endpoint.tags) {
        endpoint.tags.forEach((tag: string) => tags.add(tag));
      }

      endpoint.responses.forEach((response: any) => {
        statusCodes.add(response.statusCode);
      });
    }

    return {
      methods: Array.from(methods).sort(),
      tags: Array.from(tags).sort(),
      statusCodes: Array.from(statusCodes).sort(),
    };
  }, [endpoints]);

  // Update specific filter
  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Set search query shorthand
  const setQuery = useCallback(
    (query: string) => {
      updateFilter("query", query);
    },
    [updateFilter]
  );

  return {
    filters,
    results: filteredResults,
    totalResults: filteredResults.length,
    isSearching: Object.keys(filters).some((key) => {
      const value = filters[key as keyof SearchFilters];
      return (
        value !== undefined &&
        value !== null &&
        (Array.isArray(value)
          ? value.length > 0
          : typeof value === "string"
          ? value.length > 0
          : true)
      );
    }),
    setFilters,
    updateFilter,
    clearFilters,
    setQuery,
    getFilterOptions,
  };
}

/**
 * Hook for simple text search (convenience wrapper)
 */
export function useTextSearch(initialQuery = "", options: SearchOptions = {}) {
  const search = useSearch(options);

  // Set initial query on mount
  useEffect(() => {
    if (initialQuery) {
      search.setQuery(initialQuery);
    }
  }, []); // Empty dependency array - only run on mount

  return {
    query: search.filters.query || "",
    results: search.results,
    totalResults: search.totalResults,
    setQuery: search.setQuery,
    clearSearch: () => search.setQuery(""),
  };
}
