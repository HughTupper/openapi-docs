// Core parsing functionality
export {
  parseOpenApi,
  findEndpointById,
  findEndpointByMethodAndPath,
  filterEndpointsByTag,
  groupEndpointsByTag,
} from "./parsing/parseOpenApi";

// React context and provider
export { ApiProvider } from "./context/ApiProvider";
export { ApiContext, type ApiContextValue } from "./context/ApiContext";

// Hooks
export { useApiSpec } from "./hooks/useApiSpec";
export { useEndpoints, type UseEndpointsOptions } from "./hooks/useEndpoints";
export { useEndpoint, type EndpointIdentifier } from "./hooks/useEndpoint";
export { useSchema, useSchemas } from "./hooks/useSchema";
export {
  useApiLoader,
  clearSpecCache,
  getCacheStats,
  type ApiLoaderConfig,
  type ApiLoaderState,
} from "./hooks/useApiLoader";
export {
  useSearch,
  useTextSearch,
  type SearchFilters,
  type SearchOptions,
  type SearchResult,
  type UseSearchState,
} from "./hooks/useSearch";

// Components
export { EndpointList } from "./components/EndpointList";
export { EndpointItem } from "./components/EndpointItem";
export { MethodBadge } from "./components/MethodBadge";

// Types - Export all the important types for consumers
export type {
  // OpenAPI spec types
  OpenApiSpec,
  Info,
  Contact,
  License,
  Server,
  ServerVariable,
  Paths,
  PathItem,
  Operation,
  Parameter,
  RequestBody,
  Responses,
  Response,
  MediaType,
  Schema,
  Reference,
  Components,
  Example,
  Header,
  Tag,
  ExternalDocumentation,
  SecurityRequirement,
  SecurityScheme,
  OAuthFlows,
  OAuthFlow,
  Link,
  Callback,
  Encoding,
  Discriminator,
  XML,

  // Normalized internal types
  NormalizedEndpoint,
  HttpMethod,
  NormalizedParameter,
  NormalizedRequestBody,
  NormalizedResponse,
  NormalizedMediaType,
  NormalizedSchema,
  NormalizedHeader,
  ParsedApiSpec,

  // Component prop types
  BaseComponentProps,
  EndpointListProps,
  EndpointItemProps,
  MethodBadgeProps,
} from "./types";
