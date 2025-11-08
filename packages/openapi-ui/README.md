# @openapi-docs/ui

A headless, composable OpenAPI documentation UI library for React. Built with TypeScript and designed to be completely unstyled, allowing you to bring your own design system.

## Features

- 🎯 **Headless** - No built-in styling, bring your own CSS/design system
- 🧩 **Composable** - Mix and match components as needed
- 📘 **TypeScript** - Fully typed with comprehensive OpenAPI 3.x support
- ⚡ **Tree-shakeable** - Import only what you need (ESM-only for optimal bundling)
- 🔧 **Extensible** - Render props and hooks for maximum flexibility
- 📦 **Zero dependencies** - Only requires React as a peer dependency
- 🚀 **Modern** - ESM-only, targets Node.js 16+ and modern bundlers

## Requirements

- **Node.js 16+** (for ESM support)
- **React 18+**
- **Modern bundler** (Vite, Webpack 5+, Next.js 13+)

## Installation

```bash
npm install @openapi-docs/ui react react-dom
```

## Quick Start

```tsx
import {
  ApiProvider,
  EndpointList,
  EndpointItem,
  MethodBadge,
} from "@openapi-docs/ui";
import openApiSpec from "./api-spec.json";

function MyApiDocs() {
  return (
    <ApiProvider spec={openApiSpec}>
      <EndpointList>
        {(endpoint) => (
          <EndpointItem
            endpoint={endpoint}
            className="endpoint-item"
            renderMethod={(method) => (
              <MethodBadge method={method} className={`method-${method}`} />
            )}
          />
        )}
      </EndpointList>
    </ApiProvider>
  );
}
```

## Core Concepts

### Headless Architecture

This library provides the logic and data structures but no visual styling. Every component accepts:

- `className` for CSS classes
- `style` for inline styles
- Render props for complete customization

### Component Hierarchy

```
ApiProvider (context)
├── EndpointList (renders multiple endpoints)
│   └── EndpointItem (renders single endpoint)
│       └── MethodBadge (renders HTTP method)
└── Custom components using hooks
```

## API Reference

### Components

#### `<ApiProvider>`

Provides OpenAPI context to child components.

```tsx
<ApiProvider
  spec={openApiSpec} // OpenAPI 3.x spec object
  onError={(error) => {}} // Error handler
>
  {children}
</ApiProvider>
```

#### `<EndpointList>`

Renders a list of API endpoints with optional filtering and grouping.

```tsx
<EndpointList
  filter={(endpoint) => endpoint.method === "get"}
  groupBy="tag" // 'tag' | 'method' | 'path'
  className="endpoint-list"
>
  {(endpoint, index) => <EndpointItem endpoint={endpoint} />}
</EndpointList>
```

#### `<EndpointItem>`

Renders a single API endpoint.

```tsx
<EndpointItem
  endpoint={endpoint}
  renderMethod={(method) => <MethodBadge method={method} />}
  renderPath={(path) => <code>{path}</code>}
  renderSummary={(summary) => <h3>{summary}</h3>}
/>
```

#### `<MethodBadge>`

Renders an HTTP method indicator.

```tsx
<MethodBadge
  method="get"
  className="method-badge"
  data-method="get" // Automatically added for styling
/>
```

### Hooks

#### `useApiSpec()`

Access the parsed OpenAPI specification.

```tsx
const spec = useApiSpec();
// Returns: ParsedApiSpec | null
```

#### `useEndpoints(options?)`

Get filtered list of endpoints.

```tsx
const endpoints = useEndpoints({
  filter: (endpoint) => endpoint.deprecated !== true,
  tag: "users",
  method: "get",
  search: "user",
});
```

#### `useEndpoint(identifier)`

Get a specific endpoint by ID or method/path.

```tsx
// By operation ID
const endpoint = useEndpoint("getUserById");

// By method and path
const endpoint = useEndpoint({ method: "get", path: "/users/{id}" });
```

#### `useSchema(name)`

Get a schema definition by name.

```tsx
const userSchema = useSchema("User");
// Returns: NormalizedSchema | undefined
```

## Styling Examples

Since components are unstyled, here are some styling approaches:

### CSS Classes

```css
.method-get {
  color: green;
}
.method-post {
  color: blue;
}
.method-delete {
  color: red;
}

.endpoint-item {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 0.5rem;
}
```

### Tailwind CSS

```tsx
<MethodBadge
  method={method}
  className={`px-2 py-1 text-xs rounded ${
    method === "get"
      ? "bg-green-100 text-green-800"
      : method === "post"
      ? "bg-blue-100 text-blue-800"
      : "bg-red-100 text-red-800"
  }`}
/>
```

### Styled Components

```tsx
const StyledMethodBadge = styled(MethodBadge)`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;

  &[data-method="get"] {
    background: green;
  }
  &[data-method="post"] {
    background: blue;
  }
`;
```

## TypeScript Support

Full TypeScript definitions are included. Key types:

```tsx
import type {
  NormalizedEndpoint,
  HttpMethod,
  ParsedApiSpec,
  EndpointListProps,
} from "@openapi-docs/ui";
```

## License

MIT
