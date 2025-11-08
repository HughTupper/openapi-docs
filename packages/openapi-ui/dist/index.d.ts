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
    [statusCode: string]: Response | Reference;
}
interface Response {
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
    responses?: Record<string, Response | Reference>;
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
 */
declare function parseOpenApi(spec: OpenApiSpec): ParsedApiSpec;
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

interface ApiProviderProps {
    children: ReactNode;
    spec?: OpenApiSpec | ParsedApiSpec;
    onError?: (error: string) => void;
}
declare function ApiProvider({ children, spec: initialSpec, onError, }: ApiProviderProps): react_jsx_runtime.JSX.Element;

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

export { ApiContext, type ApiContextValue, ApiProvider, type BaseComponentProps, type Callback, type Components, type Contact, type Discriminator, type Encoding, type EndpointIdentifier, EndpointItem, type EndpointItemProps, EndpointList, type EndpointListProps, type Example, type ExternalDocumentation, type Header, type HttpMethod, type Info, type License, type Link, type MediaType, MethodBadge, type MethodBadgeProps, type NormalizedEndpoint, type NormalizedHeader, type NormalizedMediaType, type NormalizedParameter, type NormalizedRequestBody, type NormalizedResponse, type NormalizedSchema, type OAuthFlow, type OAuthFlows, type OpenApiSpec, type Operation, type Parameter, type ParsedApiSpec, type PathItem, type Paths, type Reference, type RequestBody, type Response, type Responses, type Schema, type SecurityRequirement, type SecurityScheme, type Server, type ServerVariable, type Tag, type UseEndpointsOptions, type XML, filterEndpointsByTag, findEndpointById, findEndpointByMethodAndPath, groupEndpointsByTag, parseOpenApi, useApiSpec, useEndpoint, useEndpoints, useSchema, useSchemas };
