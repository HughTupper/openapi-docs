import { useState, useCallback, useEffect } from "react";
import { parseOpenApi } from "../parsing/parseOpenApi";
import { ParsedApiSpec, OpenApiSpec } from "../types";

export interface ApiLoaderConfig {
  /** URL to fetch the OpenAPI spec from */
  url?: string;
  /** OpenAPI spec object or string */
  spec?: OpenApiSpec | string;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
  /** Custom fetch function */
  fetcher?: (url: string) => Promise<string>;
  /** Enable automatic retries on failure */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

export interface ApiLoaderState {
  /** Parsed API specification */
  spec: ParsedApiSpec | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Reload function to refetch from URL */
  reload: () => void;
  /** Load a new spec (URL or object) */
  loadSpec: (config: ApiLoaderConfig) => void;
}

interface CacheEntry {
  spec: ParsedApiSpec;
  timestamp: number;
}

// Simple in-memory cache
const specCache = new Map<string, CacheEntry>();

const defaultFetcher = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch spec: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
};

export function useApiLoader(initialConfig?: ApiLoaderConfig): ApiLoaderState {
  const [spec, setSpec] = useState<ParsedApiSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(
    initialConfig?.url
  );

  const {
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    fetcher = defaultFetcher,
    retries = 3,
    retryDelay = 1000,
  } = initialConfig || {};

  const loadFromUrl = useCallback(
    async (
      url: string,
      config: Pick<
        ApiLoaderConfig,
        "fetcher" | "retries" | "retryDelay" | "cacheDuration"
      >
    ): Promise<ParsedApiSpec> => {
      // Check cache first
      const cached = specCache.get(url);
      if (
        cached &&
        Date.now() - cached.timestamp < (config.cacheDuration || cacheDuration)
      ) {
        return cached.spec;
      }

      const fetchFn = config.fetcher || fetcher;
      const maxRetries = config.retries || retries;
      const delay = config.retryDelay || retryDelay;

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const specText = await fetchFn(url);
          const parsedSpec = parseOpenApi(specText);

          // Cache the result
          specCache.set(url, {
            spec: parsedSpec,
            timestamp: Date.now(),
          });

          return parsedSpec;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, delay * Math.pow(2, attempt))
            );
          }
        }
      }

      throw lastError || new Error("Failed to load spec");
    },
    [cacheDuration, fetcher, retries, retryDelay]
  );

  const loadFromSpec = useCallback(
    (specInput: OpenApiSpec | string): ParsedApiSpec => {
      return parseOpenApi(specInput);
    },
    []
  );

  const loadSpec = useCallback(
    async (config: ApiLoaderConfig) => {
      setLoading(true);
      setError(null);

      try {
        let parsedSpec: ParsedApiSpec;

        if (config.url) {
          setCurrentUrl(config.url);
          parsedSpec = await loadFromUrl(config.url, config);
        } else if (config.spec) {
          setCurrentUrl(undefined);
          parsedSpec = loadFromSpec(config.spec);
        } else {
          throw new Error("Either url or spec must be provided");
        }

        setSpec(parsedSpec);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load API specification";
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
      // Clear cache for current URL to force refetch
      specCache.delete(currentUrl);
      loadSpec({
        url: currentUrl,
        cacheDuration,
        fetcher,
        retries,
        retryDelay,
      });
    }
  }, [currentUrl, loadSpec, cacheDuration, fetcher, retries, retryDelay]);

  // Load initial config on mount
  useEffect(() => {
    if (initialConfig && (initialConfig.url || initialConfig.spec)) {
      loadSpec(initialConfig);
    }
  }, []); // Only run on mount

  return {
    spec,
    loading,
    error,
    reload,
    loadSpec,
  };
}

/**
 * Clear all cached specs
 */
export function clearSpecCache(): void {
  specCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: specCache.size,
    keys: Array.from(specCache.keys()),
  };
}
