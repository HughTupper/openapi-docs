import * as react from 'react';
import { CSSProperties, ReactNode } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

interface OpenApiSpec {
    openapi: string;
    info: Info;
    servers?: Server[];
    paths: Paths;
    components?: Components;
    security?: SecurityRequirement[];
    tags?: Tag[];
    externalDocs?: ExternalDocumentation;
}
interface Info {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: Contact;
    license?: License;
    version: string;
}
interface Contact {
    name?: string;
    url?: string;
    email?: string;
}
interface License {
    name: string;
    url?: string;
}
interface Server {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariable>;
}
interface ServerVariable {
    enum?: string[];
    default: string;
    description?: string;
}
interface Paths {
    [path: string]: PathItem;
}
interface PathItem {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    options?: Operation;
    head?: Operation;
    patch?: Operation;
    trace?: Operation;
    servers?: Server[];
    parameters?: (Parameter | Reference)[];
}
interface Operation {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentation;
    operationId?: string;
    parameters?: (Parameter | Reference)[];
    requestBody?: RequestBody | Reference;
    responses: Responses;
    callbacks?: Record<string, Callback | Reference>;
    deprecated?: boolean;
    security?: SecurityRequirement[];
    servers?: Server[];
}
interface Parameter {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: Schema | Reference;
    example?: any;
    examples?: Record<string, Example | Reference>;
}
interface RequestBody {
    description?: string;
    content: Record<string, MediaType>;
    required?: boolean;
}
interface Responses {
    [statusCode: string]: Response$1 | Reference;
}
interface Response$1 {
    description: string;
    headers?: Record<string, Header | Reference>;
    content?: Record<string, MediaType>;
    links?: Record<string, Link | Reference>;
}
interface MediaType {
    schema?: Schema | Reference;
    example?: any;
    examples?: Record<string, Example | Reference>;
    encoding?: Record<string, Encoding>;
}
interface Schema {
    title?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    type?: "null" | "boolean" | "object" | "array" | "number" | "string" | "integer";
    allOf?: (Schema | Reference)[];
    oneOf?: (Schema | Reference)[];
    anyOf?: (Schema | Reference)[];
    not?: Schema | Reference;
    items?: Schema | Reference;
    properties?: Record<string, Schema | Reference>;
    additionalProperties?: boolean | Schema | Reference;
    description?: string;
    format?: string;
    default?: any;
    nullable?: boolean;
    discriminator?: Discriminator;
    readOnly?: boolean;
    writeOnly?: boolean;
    example?: any;
    externalDocs?: ExternalDocumentation;
    deprecated?: boolean;
    xml?: XML;
}
interface Reference {
    $ref: string;
}
interface Components {
    schemas?: Record<string, Schema | Reference>;
    responses?: Record<string, Response$1 | Reference>;
    parameters?: Record<string, Parameter | Reference>;
    examples?: Record<string, Example | Reference>;
    requestBodies?: Record<string, RequestBody | Reference>;
    headers?: Record<string, Header | Reference>;
    securitySchemes?: Record<string, SecurityScheme | Reference>;
    links?: Record<string, Link | Reference>;
    callbacks?: Record<string, Callback | Reference>;
}
interface Example {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
}
interface Header {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: Schema | Reference;
    example?: any;
    examples?: Record<string, Example | Reference>;
}
interface Tag {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentation;
}
interface ExternalDocumentation {
    description?: string;
    url: string;
}
interface SecurityRequirement {
    [name: string]: string[];
}
interface SecurityScheme {
    type: "apiKey" | "http" | "oauth2" | "openIdConnect";
    description?: string;
    name?: string;
    in?: "query" | "header" | "cookie";
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlows;
    openIdConnectUrl?: string;
}
interface OAuthFlows {
    implicit?: OAuthFlow;
    password?: OAuthFlow;
    clientCredentials?: OAuthFlow;
    authorizationCode?: OAuthFlow;
}
interface OAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}
interface Link {
    operationRef?: string;
    operationId?: string;
    parameters?: Record<string, any>;
    requestBody?: any;
    description?: string;
    server?: Server;
}
interface Callback {
    [expression: string]: PathItem;
}
interface Encoding {
    contentType?: string;
    headers?: Record<string, Header | Reference>;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
}
interface Discriminator {
    propertyName: string;
    mapping?: Record<string, string>;
}
interface XML {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
}
interface NormalizedEndpoint {
    id: string;
    method: HttpMethod;
    path: string;
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    parameters: NormalizedParameter[];
    requestBody?: NormalizedRequestBody;
    responses: NormalizedResponse[];
    deprecated?: boolean;
    security?: SecurityRequirement[];
}
type HttpMethod = "get" | "post" | "put" | "delete" | "patch" | "options" | "head" | "trace";
interface NormalizedParameter {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required: boolean;
    deprecated?: boolean;
    schema?: NormalizedSchema;
    example?: any;
}
interface NormalizedRequestBody {
    description?: string;
    required: boolean;
    content: NormalizedMediaType[];
}
interface NormalizedResponse {
    statusCode: string;
    description: string;
    content?: NormalizedMediaType[];
    headers?: Record<string, NormalizedHeader>;
}
interface NormalizedMediaType {
    mediaType: string;
    schema?: NormalizedSchema;
    example?: any;
    examples?: Record<string, any>;
}
interface NormalizedSchema {
    type?: string;
    format?: string;
    description?: string;
    example?: any;
    enum?: any[];
    properties?: Record<string, NormalizedSchema>;
    items?: NormalizedSchema;
    required?: string[];
    additionalProperties?: boolean | NormalizedSchema;
    nullable?: boolean;
    deprecated?: boolean;
    title?: string;
    default?: any;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    allOf?: NormalizedSchema[];
    oneOf?: NormalizedSchema[];
    anyOf?: NormalizedSchema[];
}
interface NormalizedHeader {
    name: string;
    description?: string;
    required: boolean;
    schema?: NormalizedSchema;
    example?: any;
}
interface ParsedApiSpec {
    info: Info;
    servers: Server[];
    endpoints: NormalizedEndpoint[];
    schemas: Record<string, NormalizedSchema>;
    tags: Tag[];
    securitySchemes?: Record<string, SecurityScheme>;
}
interface BaseComponentProps {
    className?: string;
    style?: CSSProperties;
}
interface EndpointListProps extends BaseComponentProps {
    endpoints?: NormalizedEndpoint[];
    filter?: (endpoint: NormalizedEndpoint) => boolean;
    groupBy?: "tag" | "method" | "path";
    children?: (endpoint: NormalizedEndpoint, index: number) => ReactNode;
    renderGroup?: (groupName: string, endpoints: NormalizedEndpoint[]) => ReactNode;
}
interface EndpointItemProps extends BaseComponentProps {
    endpoint: NormalizedEndpoint;
    children?: ReactNode;
    renderMethod?: (method: HttpMethod) => ReactNode;
    renderPath?: (path: string) => ReactNode;
    renderSummary?: (summary?: string) => ReactNode;
}
interface MethodBadgeProps extends BaseComponentProps {
    method: HttpMethod;
    children?: ReactNode;
}

/**
 * Main function to parse and normalize an OpenAPI 3.x specification
 * Accepts either a parsed OpenAPI object or a string (JSON/YAML)
 */
declare function parseOpenApi(spec: OpenApiSpec | string): ParsedApiSpec;
/**
 * Utility function to find an endpoint by ID
 */
declare function findEndpointById(endpoints: NormalizedEndpoint[], id: string): NormalizedEndpoint | undefined;
/**
 * Utility function to find an endpoint by method and path
 */
declare function findEndpointByMethodAndPath(endpoints: NormalizedEndpoint[], method: HttpMethod, path: string): NormalizedEndpoint | undefined;
/**
 * Utility function to filter endpoints by tag
 */
declare function filterEndpointsByTag(endpoints: NormalizedEndpoint[], tag: string): NormalizedEndpoint[];
/**
 * Utility function to group endpoints by tag
 */
declare function groupEndpointsByTag(endpoints: NormalizedEndpoint[]): Record<string, NormalizedEndpoint[]>;

interface ApiLoaderConfig {
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
interface ApiLoaderState {
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
declare function useApiLoader(initialConfig?: ApiLoaderConfig): ApiLoaderState;
/**
 * Clear all cached specs
 */
declare function clearSpecCache(): void;
/**
 * Get cache statistics
 */
declare function getCacheStats(): {
    size: number;
    keys: string[];
};

interface ApiProviderProps {
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
declare function ApiProvider({ children, spec: initialSpec, url, loaderConfig, onError, onLoadingChange, }: ApiProviderProps): react_jsx_runtime.JSX.Element;

interface ApiContextValue {
    spec: ParsedApiSpec | null;
    loading: boolean;
    error: string | null;
    endpoints: NormalizedEndpoint[];
    schemas: Record<string, NormalizedSchema>;
    setSpec: (spec: ParsedApiSpec) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    getEndpointById: (id: string) => NormalizedEndpoint | undefined;
    getEndpointByMethodAndPath: (method: string, path: string) => NormalizedEndpoint | undefined;
    getSchema: (name: string) => NormalizedSchema | undefined;
    getEndpointsByTag: (tag: string) => NormalizedEndpoint[];
}
declare const ApiContext: react.Context<ApiContextValue | null>;

/**
 * Hook to access the parsed API specification
 */
declare function useApiSpec(): ParsedApiSpec | null;

interface UseEndpointsOptions {
    filter?: (endpoint: NormalizedEndpoint) => boolean;
    tag?: string;
    method?: string;
    search?: string;
}
/**
 * Hook to access and filter the list of endpoints
 */
declare function useEndpoints(options?: UseEndpointsOptions): NormalizedEndpoint[];

type EndpointIdentifier = string | {
    method: HttpMethod;
    path: string;
};
/**
 * Hook to access a specific endpoint by ID or method/path combination
 */
declare function useEndpoint(identifier: EndpointIdentifier): NormalizedEndpoint | undefined;

/**
 * Hook to access a schema by name from the components.schemas section
 */
declare function useSchema(name: string): NormalizedSchema | undefined;
/**
 * Hook to access all schemas
 */
declare function useSchemas(): Record<string, NormalizedSchema>;

interface SearchFilters {
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
interface SearchOptions {
    /** Fields to search in (default: all) */
    searchFields?: ("summary" | "description" | "operationId" | "path" | "tags" | "parameters" | "responses")[];
    /** Case sensitive search (default: false) */
    caseSensitive?: boolean;
    /** Enable fuzzy search (default: false) */
    fuzzySearch?: boolean;
    /** Minimum search query length to trigger search (default: 1) */
    minQueryLength?: number;
}
interface SearchResult {
    /** The matching endpoint */
    endpoint: NormalizedEndpoint;
    /** Relevance score (0-1, higher is more relevant) */
    score: number;
    /** Fields that matched the search query */
    matchedFields: string[];
    /** Highlighted text snippets */
    highlights?: Record<string, string>;
}
interface UseSearchState {
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
    updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
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
declare function useSearch(options?: SearchOptions): UseSearchState;
/**
 * Hook for simple text search (convenience wrapper)
 */
declare function useTextSearch(initialQuery?: string, options?: SearchOptions): {
    query: string;
    results: SearchResult[];
    totalResults: number;
    setQuery: (query: string) => void;
    clearSearch: () => void;
};

interface RequestConfig {
    /** Base URL for the API (overrides servers from spec) */
    baseUrl?: string;
    /** HTTP headers to include with the request */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Whether to include credentials (cookies) */
    withCredentials?: boolean;
}
interface SecurityConfig {
    /** API key authentication */
    apiKey?: {
        name: string;
        value: string;
        in: "query" | "header" | "cookie";
    };
    /** Bearer token authentication */
    bearer?: {
        token: string;
    };
    /** Basic authentication */
    basic?: {
        username: string;
        password: string;
    };
    /** OAuth2 token */
    oauth2?: {
        token: string;
    };
    /** Custom authentication header */
    custom?: {
        name: string;
        value: string;
    };
}
interface RequestInterceptor {
    /** Called before the request is sent */
    onRequest?: (url: string, init: RequestInit) => Promise<{
        url: string;
        init: RequestInit;
    }> | {
        url: string;
        init: RequestInit;
    };
    /** Called after a successful response */
    onResponse?: (response: Response, data: any) => Promise<any> | any;
    /** Called when an error occurs */
    onError?: (error: Error, url: string, init: RequestInit) => Promise<void> | void;
}
interface ExecuteOperationParams {
    /** Path parameters */
    pathParams?: Record<string, string | number>;
    /** Query parameters */
    queryParams?: Record<string, string | number | boolean | (string | number | boolean)[]>;
    /** Request body */
    body?: any;
    /** Content type for request body */
    contentType?: string;
    /** Security configuration for this request */
    security?: SecurityConfig;
    /** Request-specific headers */
    headers?: Record<string, string>;
}
interface ExecuteOperationResult {
    /** Response data */
    data: any;
    /** HTTP status code */
    status: number;
    /** Response headers */
    headers: Headers;
    /** Full Response object */
    response: Response;
}
interface UseExecuteOperationState {
    /** Whether a request is currently in progress */
    loading: boolean;
    /** Error from the last request */
    error: string | null;
    /** Result from the last successful request */
    result: ExecuteOperationResult | null;
    /** Execute an operation by ID */
    executeById: (operationId: string, params?: ExecuteOperationParams) => Promise<ExecuteOperationResult>;
    /** Execute an operation by endpoint object */
    execute: (endpoint: NormalizedEndpoint, params?: ExecuteOperationParams) => Promise<ExecuteOperationResult>;
    /** Clear the current error */
    clearError: () => void;
    /** Clear the current result */
    clearResult: () => void;
    /** Cancel the current request (if supported) */
    cancel: () => void;
}
interface UseExecuteOperationConfig {
    /** Default request configuration */
    defaultConfig?: RequestConfig;
    /** Default security configuration */
    defaultSecurity?: SecurityConfig;
    /** Request interceptors */
    interceptors?: RequestInterceptor;
    /** Default timeout in milliseconds */
    timeout?: number;
    /** Whether to automatically parse JSON responses */
    parseJson?: boolean;
}
/**
 * Hook for executing OpenAPI operations
 */
declare function useExecuteOperation(config?: UseExecuteOperationConfig): UseExecuteOperationState;
/**
 * Hook for executing a specific operation
 */
declare function useExecuteEndpoint(endpoint: NormalizedEndpoint | null, config?: UseExecuteOperationConfig): {
    execute: (params?: ExecuteOperationParams) => Promise<ExecuteOperationResult>;
    /** Whether a request is currently in progress */
    loading: boolean;
    /** Error from the last request */
    error: string | null;
    /** Result from the last successful request */
    result: ExecuteOperationResult | null;
    /** Execute an operation by ID */
    executeById: (operationId: string, params?: ExecuteOperationParams) => Promise<ExecuteOperationResult>;
    /** Clear the current error */
    clearError: () => void;
    /** Clear the current result */
    clearResult: () => void;
    /** Cancel the current request (if supported) */
    cancel: () => void;
};

interface CodeSnippetLanguage {
    id: string;
    name: string;
    extension: string;
}
interface CodeSnippetOptions {
    /** Target language for code generation */
    language: "curl" | "javascript" | "typescript" | "python" | "node" | "php" | "java" | "go";
    /** Include authentication headers/setup */
    includeAuth?: boolean;
    /** Authentication configuration */
    auth?: {
        type: "apiKey" | "bearer" | "basic" | "oauth2";
        apiKey?: {
            name: string;
            value: string;
            in: "header" | "query";
        };
        bearer?: {
            token: string;
        };
        basic?: {
            username: string;
            password: string;
        };
        oauth2?: {
            token: string;
        };
    };
    /** Request parameters to include */
    parameters?: {
        pathParams?: Record<string, any>;
        queryParams?: Record<string, any>;
        headers?: Record<string, string>;
        body?: any;
    };
    /** Custom server URL override */
    serverUrl?: string;
    /** Pretty format output */
    formatted?: boolean;
}
interface CodeSnippetResult {
    code: string;
    language: CodeSnippetLanguage;
    description?: string;
}
/**
 * Hook for generating code snippets for API operations
 */
declare function useCodeSnippet(): {
    /** Available programming languages for code generation */
    availableLanguages: CodeSnippetLanguage[];
    /** Generate code snippet for an operation by ID */
    generate: (operationId: string, options: CodeSnippetOptions) => CodeSnippetResult;
    /** Generate code snippet for a specific endpoint */
    generateForEndpoint: (endpoint: NormalizedEndpoint, options: CodeSnippetOptions) => CodeSnippetResult;
    /** Last generated code snippet */
    lastGenerated: CodeSnippetResult | null;
    /** Clear the last generated result */
    clearLast: () => void;
};
/**
 * Hook for generating code snippets for a specific endpoint
 */
declare function useEndpointCodeSnippet(endpoint: NormalizedEndpoint | null): {
    /** Generate code snippet for the specific endpoint */
    generate: (options: CodeSnippetOptions) => CodeSnippetResult;
    /** Available programming languages for code generation */
    availableLanguages: CodeSnippetLanguage[];
    /** Generate code snippet for a specific endpoint */
    generateForEndpoint: (endpoint: NormalizedEndpoint, options: CodeSnippetOptions) => CodeSnippetResult;
    /** Last generated code snippet */
    lastGenerated: CodeSnippetResult | null;
    /** Clear the last generated result */
    clearLast: () => void;
};

/**
 * Headless component for rendering a list of endpoints
 * Supports filtering, grouping, and custom render functions
 */
declare function EndpointList({ endpoints: externalEndpoints, filter, groupBy, children, renderGroup, className, style, ...props }: EndpointListProps): react_jsx_runtime.JSX.Element | null;

/**
 * Headless component for rendering a single endpoint item
 * Provides default structure but allows complete customization via render props
 */
declare function EndpointItem({ endpoint, children, renderMethod, renderPath, renderSummary, className, style, ...props }: EndpointItemProps): react_jsx_runtime.JSX.Element;

/**
 * Headless component for rendering HTTP method badges
 * Provides a simple wrapper that can be styled with className
 */
declare function MethodBadge({ method, children, className, style, ...props }: MethodBadgeProps): react_jsx_runtime.JSX.Element;

export { ApiContext, type ApiContextValue, type ApiLoaderConfig, type ApiLoaderState, ApiProvider, type BaseComponentProps, type Callback, type CodeSnippetLanguage, type CodeSnippetOptions, type CodeSnippetResult, type Components, type Contact, type Discriminator, type Encoding, type EndpointIdentifier, EndpointItem, type EndpointItemProps, EndpointList, type EndpointListProps, type Example, type ExecuteOperationParams, type ExecuteOperationResult, type ExternalDocumentation, type Header, type HttpMethod, type Info, type License, type Link, type MediaType, MethodBadge, type MethodBadgeProps, type NormalizedEndpoint, type NormalizedHeader, type NormalizedMediaType, type NormalizedParameter, type NormalizedRequestBody, type NormalizedResponse, type NormalizedSchema, type OAuthFlow, type OAuthFlows, type OpenApiSpec, type Operation, type Parameter, type ParsedApiSpec, type PathItem, type Paths, type Reference, type RequestBody, type RequestConfig, type RequestInterceptor, type Response$1 as Response, type Responses, type Schema, type SearchFilters, type SearchOptions, type SearchResult, type SecurityConfig, type SecurityRequirement, type SecurityScheme, type Server, type ServerVariable, type Tag, type UseEndpointsOptions, type UseExecuteOperationConfig, type UseExecuteOperationState, type UseSearchState, type XML, clearSpecCache, filterEndpointsByTag, findEndpointById, findEndpointByMethodAndPath, getCacheStats, groupEndpointsByTag, parseOpenApi, useApiLoader, useApiSpec, useCodeSnippet, useEndpoint, useEndpointCodeSnippet, useEndpoints, useExecuteEndpoint, useExecuteOperation, useSchema, useSchemas, useSearch, useTextSearch };
