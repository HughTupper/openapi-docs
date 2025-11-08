import { CSSProperties, ReactNode } from "react";

// Core OpenAPI 3.x types
export interface OpenApiSpec {
  openapi: string;
  info: Info;
  servers?: Server[];
  paths: Paths;
  components?: Components;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}

export interface Info {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
}

export interface Contact {
  name?: string;
  url?: string;
  email?: string;
}

export interface License {
  name: string;
  url?: string;
}

export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface Paths {
  [path: string]: PathItem;
}

export interface PathItem {
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

export interface Operation {
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

export interface Parameter {
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

export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

export interface Responses {
  [statusCode: string]: Response | Reference;
}

export interface Response {
  description: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}

export interface MediaType {
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  encoding?: Record<string, Encoding>;
}

export interface Schema {
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
  type?:
    | "null"
    | "boolean"
    | "object"
    | "array"
    | "number"
    | "string"
    | "integer";
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

export interface Reference {
  $ref: string;
}

export interface Components {
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

export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface Header {
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

export interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

export interface ExternalDocumentation {
  description?: string;
  url: string;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface SecurityScheme {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface Link {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}

export interface Callback {
  [expression: string]: PathItem;
}

export interface Encoding {
  contentType?: string;
  headers?: Record<string, Header | Reference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface Discriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface XML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

// Internal normalized types for the library
export interface NormalizedEndpoint {
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

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head"
  | "trace";

export interface NormalizedParameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required: boolean;
  deprecated?: boolean;
  schema?: NormalizedSchema;
  example?: any;
}

export interface NormalizedRequestBody {
  description?: string;
  required: boolean;
  content: NormalizedMediaType[];
}

export interface NormalizedResponse {
  statusCode: string;
  description: string;
  content?: NormalizedMediaType[];
  headers?: Record<string, NormalizedHeader>;
}

export interface NormalizedMediaType {
  mediaType: string;
  schema?: NormalizedSchema;
  example?: any;
  examples?: Record<string, any>;
}

export interface NormalizedSchema {
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

export interface NormalizedHeader {
  name: string;
  description?: string;
  required: boolean;
  schema?: NormalizedSchema;
  example?: any;
}

export interface ParsedApiSpec {
  info: Info;
  servers: Server[];
  endpoints: NormalizedEndpoint[];
  schemas: Record<string, NormalizedSchema>;
  tags: Tag[];
  securitySchemes?: Record<string, SecurityScheme>;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
}

export interface EndpointListProps extends BaseComponentProps {
  endpoints?: NormalizedEndpoint[];
  filter?: (endpoint: NormalizedEndpoint) => boolean;
  groupBy?: "tag" | "method" | "path";
  children?: (endpoint: NormalizedEndpoint, index: number) => ReactNode;
  renderGroup?: (
    groupName: string,
    endpoints: NormalizedEndpoint[]
  ) => ReactNode;
}

export interface EndpointItemProps extends BaseComponentProps {
  endpoint: NormalizedEndpoint;
  children?: ReactNode;
  renderMethod?: (method: HttpMethod) => ReactNode;
  renderPath?: (path: string) => ReactNode;
  renderSummary?: (summary?: string) => ReactNode;
}

export interface MethodBadgeProps extends BaseComponentProps {
  method: HttpMethod;
  children?: ReactNode;
}
