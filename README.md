# @openapi-docs/ui

A production-ready, headless React component library for building OpenAPI documentation interfaces. Built with TypeScript, fully tested, and designed for maximum customization and flexibility.

## ✨ Features

### 🏗️ **Headless Architecture**

- **Render Props Pattern**: Complete UI control with logical abstractions
- **Zero Styling**: No CSS included - bring your own design system
- **Component Composition**: Mix and match components as needed
- **Framework Agnostic**: Works with any React styling solution

### 📚 **Complete OpenAPI 3.x Support**

- **Comprehensive Parsing**: Full OpenAPI 3.0+ specification support
- **Type Safety**: Extensive TypeScript types for all OpenAPI constructs
- **YAML & JSON**: Support for both YAML and JSON specification formats
- **URL Loading**: Direct loading from remote OpenAPI specification URLs

### 🚀 **Advanced Functionality**

- **Smart Search**: Multi-criteria filtering with fuzzy text search and relevance scoring
- **Request Execution**: Built-in "Try it out" functionality with authentication support
- **Code Generation**: Multi-language code snippet generation (cURL, JavaScript, Python, etc.)
- **Real-time Loading**: Async spec loading with caching and error handling

### 🧪 **Developer Experience**

- **100% TypeScript**: Full type safety and IntelliSense support
- **Comprehensive Testing**: 108+ tests with >95% coverage
- **ESM Ready**: Modern ESM-only build with tree-shaking support
- **Zero Dependencies**: Minimal runtime dependencies for optimal bundle size

## 📦 Installation

```bash
npm install @openapi-docs/ui
# or
yarn add @openapi-docs/ui
# or
pnpm add @openapi-docs/ui
```

## 🚀 Quick Start

### Basic Setup

```tsx
import { ApiProvider, EndpointList } from "@openapi-docs/ui";

const spec = {
  openapi: "3.0.0",
  info: { title: "My API", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        summary: "List all users",
        responses: { "200": { description: "Success" } },
      },
    },
  },
};

function App() {
  return (
    <ApiProvider spec={spec}>
      <EndpointList>
        {({ endpoints }) => (
          <div>
            <h1>API Endpoints</h1>
            {endpoints.map((endpoint) => (
              <div key={endpoint.id}>
                <span className="method">{endpoint.method}</span>
                <span className="path">{endpoint.path}</span>
                <span className="summary">{endpoint.summary}</span>
              </div>
            ))}
          </div>
        )}
      </EndpointList>
    </ApiProvider>
  );
}
```

### Loading from URL

```tsx
import { useApiLoader, ApiProvider } from "@openapi-docs/ui";

function ApiDocs() {
  const { spec, loading, error, loadSpec } = useApiLoader();

  useEffect(() => {
    loadSpec("https://api.example.com/openapi.yaml");
  }, []);

  if (loading) return <div>Loading API specification...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!spec) return <div>No specification loaded</div>;

  return <ApiProvider spec={spec}>{/* Your documentation UI */}</ApiProvider>;
}
```

## 🎯 Core Hooks

### `useEndpoints` - Endpoint Management

```tsx
import { useEndpoints } from "@openapi-docs/ui";

function EndpointBrowser() {
  const { endpoints, loading } = useEndpoints({
    method: "GET",
    tag: "users",
    search: "user management",
  });

  return (
    <div>
      {endpoints.map((endpoint) => (
        <EndpointCard key={endpoint.id} endpoint={endpoint} />
      ))}
    </div>
  );
}
```

### `useSearch` - Advanced Filtering

```tsx
import { useSearch } from "@openapi-docs/ui";

function SearchInterface() {
  const { results, filters, setFilters, filterOptions, clearFilters } =
    useSearch();

  return (
    <div>
      {/* Search Input */}
      <input
        value={filters.text || ""}
        onChange={(e) => setFilters({ text: e.target.value })}
        placeholder="Search endpoints..."
      />

      {/* Method Filter */}
      <select
        value={filters.methods?.[0] || ""}
        onChange={(e) => setFilters({ methods: [e.target.value] })}
      >
        <option value="">All Methods</option>
        {filterOptions.methods.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>

      {/* Results */}
      {results.map(({ endpoint, score }) => (
        <div key={endpoint.id} data-relevance={score}>
          {endpoint.method} {endpoint.path}
        </div>
      ))}
    </div>
  );
}
```

### `useExecuteOperation` - API Testing

```tsx
import { useExecuteOperation } from "@openapi-docs/ui";

function ApiTester() {
  const { executeById, loading, result, error } = useExecuteOperation({
    defaultSecurity: {
      bearer: { token: "your-api-token" },
    },
    interceptors: {
      onRequest: async (url, init) => {
        console.log("Making request to:", url);
        return { url, init };
      },
      onResponse: async (response, data) => {
        console.log("Response received:", response.status);
        return data;
      },
    },
  });

  const handleExecute = async () => {
    try {
      await executeById("getUserById", {
        pathParams: { id: "123" },
        queryParams: { include: "profile" },
      });
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  return (
    <div>
      <button onClick={handleExecute} disabled={loading}>
        {loading ? "Executing..." : "Try it out"}
      </button>

      {result && (
        <pre>
          Status: {result.status}
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### `useCodeSnippet` - Code Generation

```tsx
import { useCodeSnippet } from "@openapi-docs/ui";

function CodeGenerator() {
  const { generate, availableLanguages } = useCodeSnippet();
  const [language, setLanguage] = useState("curl");
  const [snippet, setSnippet] = useState(null);

  const handleGenerate = () => {
    const result = generate("getUserById", {
      language,
      parameters: {
        pathParams: { id: "123" },
        queryParams: { format: "json" },
      },
      includeAuth: true,
      auth: {
        type: "bearer",
        bearer: { token: "your-token" },
      },
    });
    setSnippet(result);
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {availableLanguages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>

      <button onClick={handleGenerate}>Generate Code</button>

      {snippet && (
        <pre>
          <code className={`language-${snippet.language.extension}`}>
            {snippet.code}
          </code>
        </pre>
      )}
    </div>
  );
}
```

## 🎨 Component Examples

### Custom Endpoint Item

```tsx
import { EndpointItem, MethodBadge } from "@openapi-docs/ui";

function CustomEndpointItem({ endpoint }) {
  return (
    <EndpointItem
      endpoint={endpoint}
      renderMethod={({ method }) => (
        <MethodBadge
          method={method}
          className={`badge badge-${method.toLowerCase()}`}
        />
      )}
      renderPath={({ path }) => (
        <code className="font-mono text-sm">{path}</code>
      )}
      renderSummary={({ summary }) => (
        <h3 className="text-lg font-semibold">{summary}</h3>
      )}
    >
      {({ endpoint, method, path, summary }) => (
        <div className="border rounded-lg p-4 hover:shadow-md">
          <div className="flex items-center gap-2 mb-2">
            {method}
            {path}
          </div>
          {summary}
          <div className="mt-2 text-sm text-gray-600">
            {endpoint.parameters?.length || 0} parameters
          </div>
        </div>
      )}
    </EndpointItem>
  );
}
```

## 🔧 Configuration

### Authentication

```tsx
const { execute } = useExecuteOperation({
  defaultSecurity: {
    // API Key
    apiKey: {
      name: "X-API-Key",
      value: "your-key",
      in: "header",
    },
    // Bearer Token
    bearer: {
      token: "your-jwt-token",
    },
    // Basic Auth
    basic: {
      username: "user",
      password: "pass",
    },
    // OAuth2
    oauth2: {
      token: "oauth-token",
    },
  },
});
```

### Request/Response Interceptors

```tsx
const { execute } = useExecuteOperation({
  interceptors: {
    onRequest: async (url, init) => {
      // Modify request before sending
      return {
        url: url + "?timestamp=" + Date.now(),
        init: {
          ...init,
          headers: {
            ...init.headers,
            "Custom-Header": "value",
          },
        },
      };
    },
    onResponse: async (response, data) => {
      // Transform response data
      return {
        ...data,
        _metadata: {
          timestamp: Date.now(),
          status: response.status,
        },
      };
    },
  },
});
```

## 📊 TypeScript Support

The library is built with TypeScript and provides comprehensive type definitions:

```tsx
import type {
  OpenApiSpec,
  NormalizedEndpoint,
  HttpMethod,
  SearchFilters,
  CodeSnippetOptions,
  ExecuteOperationParams,
} from "@openapi-docs/ui";

// Fully typed endpoint data
const endpoint: NormalizedEndpoint = {
  id: "getUserById",
  method: "get",
  path: "/users/{id}",
  summary: "Get user by ID",
  // ... fully typed
};

// Type-safe search configuration
const filters: SearchFilters = {
  methods: ["GET", "POST"],
  tags: ["users"],
  text: "user management",
  deprecated: false,
};
```

## 🧪 Testing

The library includes comprehensive test coverage:

```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
npm run test:watch         # Watch mode for development
```

**Test Stats:**

- ✅ 108+ test cases
- ✅ >95% code coverage
- ✅ Component integration tests
- ✅ Hook behavior tests
- ✅ Edge case handling

## 📈 Bundle Size

Optimized for minimal bundle impact:

- **Core Library**: ~51KB (ESM, minified)
- **Tree Shakeable**: Import only what you need
- **Zero CSS**: No styling overhead
- **Minimal Dependencies**: Only essential runtime deps

## License

MIT
