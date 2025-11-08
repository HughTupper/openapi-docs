import { useState, useEffect } from "react";
import {
  ApiProvider,
  EndpointList,
  EndpointItem,
  MethodBadge,
  useApiLoader,
  useSearch,
  useExecuteOperation,
  useCodeSnippet,
  type OpenApiSpec,
  type HttpMethod,
  type NormalizedEndpoint,
} from "@openapi-docs/ui";
import petstoreApiData from "./petstore-api.json";
import "./App.css";

// Cast the imported JSON to the proper type
const petstoreApi = petstoreApiData as OpenApiSpec;

// Advanced Search Component using the new useSearch hook
function AdvancedSearchDemo() {
  const { results, filters, setFilters, getFilterOptions, clearFilters } =
    useSearch();

  const filterOptions = getFilterOptions();

  return (
    <div className="advanced-search-demo">
      <h3>🔍 Advanced Search Hook Demo</h3>

      {/* Search Controls */}
      <div className="search-controls">
        <input
          type="text"
          placeholder="Search endpoints (fuzzy text search)..."
          value={filters.query || ""}
          onChange={(e) => setFilters({ query: e.target.value })}
          className="search-input"
        />

        <div className="filter-row">
          {/* Method Filter */}
          <select
            value={filters.methods?.[0] || ""}
            onChange={(e) =>
              setFilters({
                methods: e.target.value ? [e.target.value as HttpMethod] : [],
              })
            }
          >
            <option value="">All Methods</option>
            {filterOptions.methods.map((method: HttpMethod) => (
              <option key={method} value={method}>
                {method.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={filters.tags?.[0] || ""}
            onChange={(e) =>
              setFilters({
                tags: e.target.value ? [e.target.value] : [],
              })
            }
          >
            <option value="">All Tags</option>
            {filterOptions.tags.map((tag: string) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          {/* Response Status Filter */}
          <select
            value={filters.responseStatusCodes?.[0] || ""}
            onChange={(e) =>
              setFilters({
                responseStatusCodes: e.target.value ? [e.target.value] : [],
              })
            }
          >
            <option value="">All Response Codes</option>
            {filterOptions.statusCodes.map((status: string) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button onClick={clearFilters} className="clear-button">
            Clear Filters
          </button>
        </div>

        {/* Advanced Toggles */}
        <div className="toggle-filters">
          <label>
            <input
              type="checkbox"
              checked={filters.deprecated === false}
              onChange={(e) =>
                setFilters({
                  deprecated: e.target.checked ? false : undefined,
                })
              }
            />
            Hide Deprecated
          </label>

          <label>
            <input
              type="checkbox"
              checked={filters.hasParameters === true}
              onChange={(e) =>
                setFilters({
                  hasParameters: e.target.checked ? true : undefined,
                })
              }
            />
            Has Parameters
          </label>

          <label>
            <input
              type="checkbox"
              checked={filters.hasRequestBody === true}
              onChange={(e) =>
                setFilters({
                  hasRequestBody: e.target.checked ? true : undefined,
                })
              }
            />
            Has Request Body
          </label>
        </div>
      </div>

      {/* Search Results with Relevance Scores */}
      <div className="search-results">
        <p className="results-count">Found {results.length} endpoint(s)</p>

        {results.map(({ endpoint, score }) => (
          <div key={endpoint.id} className="search-result-item">
            <div className="result-header">
              <MethodBadge
                method={endpoint.method}
                className={`method-badge method-${endpoint.method}`}
              />
              <code className="endpoint-path">{endpoint.path}</code>
              <span className="relevance-score">Score: {score.toFixed(2)}</span>
            </div>
            <div className="result-summary">{endpoint.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// API Loader Demo Component
function ApiLoaderDemo() {
  const { spec, loading, error, loadSpec } = useApiLoader();

  const handleLoadPetstore = () => {
    loadSpec({ url: "https://petstore3.swagger.io/api/v3/openapi.json" });
  };

  return (
    <div className="api-loader-demo">
      <h3>🌐 URL Loading Demo</h3>

      <div className="loader-controls">
        <button onClick={handleLoadPetstore} disabled={loading}>
          {loading ? "Loading..." : "Load Petstore API from URL"}
        </button>
      </div>

      {loading && <div className="loading">Loading API specification...</div>}
      {error && <div className="error">Error: {error}</div>}
      {spec && (
        <div className="loaded-spec">
          <p>
            ✅ Loaded: {spec.info.title} v{spec.info.version}
          </p>
          <p>Endpoints: {spec.endpoints.length}</p>
        </div>
      )}
    </div>
  );
}

// Request Execution Demo Component
function ExecutionDemo({ endpoint }: { endpoint: NormalizedEndpoint }) {
  const { executeById, loading, result, error, clearError } =
    useExecuteOperation({
      defaultSecurity: {
        apiKey: { name: "api_key", value: "special-key", in: "query" },
      },
      interceptors: {
        onRequest: async (url, init) => {
          console.log("🚀 Making request to:", url);
          return { url, init };
        },
        onResponse: async (response, data) => {
          console.log("✅ Response received:", response.status);
          return data;
        },
      },
    });

  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  const handleExecute = async () => {
    try {
      await executeById(endpoint.operationId!, {
        pathParams,
        queryParams:
          Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  const pathParameters =
    endpoint.parameters?.filter((p) => p.in === "path") || [];
  const queryParameters =
    endpoint.parameters?.filter((p) => p.in === "query") || [];

  return (
    <div className="execution-demo">
      <h4>🧪 Try It Out</h4>

      {/* Path Parameters */}
      {pathParameters.length > 0 && (
        <div className="parameter-section">
          <h5>Path Parameters</h5>
          {pathParameters.map((param) => (
            <div key={param.name} className="parameter-input">
              <label>
                {param.name}{" "}
                {param.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                value={pathParams[param.name] || ""}
                onChange={(e) =>
                  setPathParams((prev) => ({
                    ...prev,
                    [param.name]: e.target.value,
                  }))
                }
                placeholder={param.description || `Enter ${param.name}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Query Parameters */}
      {queryParameters.length > 0 && (
        <div className="parameter-section">
          <h5>Query Parameters</h5>
          {queryParameters.map((param) => (
            <div key={param.name} className="parameter-input">
              <label>
                {param.name}{" "}
                {param.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                value={queryParams[param.name] || ""}
                onChange={(e) =>
                  setQueryParams((prev) => ({
                    ...prev,
                    [param.name]: e.target.value,
                  }))
                }
                placeholder={param.description || `Enter ${param.name}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={loading}
        className="execute-button"
      >
        {loading ? "Executing..." : "Execute Request"}
      </button>

      {/* Results */}
      {result && (
        <div className="execution-result success">
          <h5>✅ Response ({result.status})</h5>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="execution-result error">
          <h5>❌ Error</h5>
          <p>{error}</p>
          <button onClick={clearError}>Clear Error</button>
        </div>
      )}
    </div>
  );
}

// Code Generation Demo Component
function CodeGenerationDemo({ endpoint }: { endpoint: NormalizedEndpoint }) {
  const { generate, availableLanguages } = useCodeSnippet();
  const [selectedLanguage, setSelectedLanguage] = useState("curl");
  const [snippet, setSnippet] = useState<any>(null);
  const [includeAuth, setIncludeAuth] = useState(false);

  const handleGenerate = () => {
    const result = generate(endpoint.operationId!, {
      language: selectedLanguage as any,
      parameters: {
        pathParams: { id: "123", petId: "456" },
        queryParams: { status: "available", limit: "10" },
      },
      includeAuth,
      auth: includeAuth
        ? {
            type: "apiKey",
            apiKey: { name: "api_key", value: "special-key", in: "query" },
          }
        : undefined,
    });
    setSnippet(result);
  };

  return (
    <div className="code-generation-demo">
      <h4>📝 Code Generation</h4>

      <div className="code-controls">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {availableLanguages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={includeAuth}
            onChange={(e) => setIncludeAuth(e.target.checked)}
          />
          Include Authentication
        </label>

        <button onClick={handleGenerate}>Generate Code</button>
      </div>

      {snippet && (
        <div className="code-snippet">
          <div className="snippet-header">
            <span className="language-name">{snippet.language.name}</span>
            <span className="snippet-description">{snippet.description}</span>
          </div>
          <pre className={`language-${snippet.language.extension}`}>
            <code>{snippet.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// Enhanced Endpoint Details Component
function EnhancedEndpointDetails({
  endpoint,
}: {
  endpoint: NormalizedEndpoint;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "try-it" | "code">(
    "overview"
  );

  return (
    <div className="enhanced-endpoint-details">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📋 Overview
        </button>
        <button
          className={`tab ${activeTab === "try-it" ? "active" : ""}`}
          onClick={() => setActiveTab("try-it")}
        >
          🧪 Try It Out
        </button>
        <button
          className={`tab ${activeTab === "code" ? "active" : ""}`}
          onClick={() => setActiveTab("code")}
        >
          📝 Code Examples
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            {endpoint.description && (
              <div className="detail-section">
                <h4>Description</h4>
                <p>{endpoint.description}</p>
              </div>
            )}

            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div className="detail-section">
                <h4>Parameters ({endpoint.parameters.length})</h4>
                <div className="parameters-list">
                  {endpoint.parameters.map((param, index) => (
                    <div key={index} className="parameter-item">
                      <div className="parameter-header">
                        <code className="parameter-name">{param.name}</code>
                        <span className={`parameter-location ${param.in}`}>
                          {param.in}
                        </span>
                        {param.required && (
                          <span className="required-badge">required</span>
                        )}
                      </div>
                      {param.description && (
                        <p className="parameter-description">
                          {param.description}
                        </p>
                      )}
                      {param.schema && (
                        <div className="parameter-schema">
                          <strong>Type:</strong> {param.schema.type}
                          {param.schema.format && ` (${param.schema.format})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.responses && endpoint.responses.length > 0 && (
              <div className="detail-section">
                <h4>Responses ({endpoint.responses.length})</h4>
                <div className="responses-list">
                  {endpoint.responses.map((response, index) => (
                    <div key={index} className="response-item">
                      <div className="response-header">
                        <span
                          className={`status-code status-${response.statusCode[0]}xx`}
                        >
                          {response.statusCode}
                        </span>
                        <span className="response-description">
                          {response.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "try-it" && <ExecutionDemo endpoint={endpoint} />}

        {activeTab === "code" && <CodeGenerationDemo endpoint={endpoint} />}
      </div>
    </div>
  );
}

// Enhanced Search Component that combines all features
function EnhancedSearchComponent() {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(true);
  const [showApiLoader, setShowApiLoader] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<NormalizedEndpoint | null>(null);

  const { results, filters } = useSearch();

  return (
    <div className="enhanced-search-container">
      {/* Feature Toggle Controls */}
      <div className="feature-toggles">
        <button
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          className={`toggle-btn ${showAdvancedSearch ? "active" : ""}`}
        >
          🔍 Advanced Search
        </button>
        <button
          onClick={() => setShowApiLoader(!showApiLoader)}
          className={`toggle-btn ${showApiLoader ? "active" : ""}`}
        >
          🌐 API Loader
        </button>
      </div>

      {/* Advanced Search Demo */}
      {showAdvancedSearch && (
        <div className="demo-section">
          <AdvancedSearchDemo />
        </div>
      )}

      {/* API Loader Demo */}
      {showApiLoader && (
        <div className="demo-section">
          <ApiLoaderDemo />
        </div>
      )}

      {/* Results List with Enhanced Details */}
      <div className="results-section">
        <div className="results-header">
          <h3>📋 Endpoints ({results.length})</h3>
          {filters.query && (
            <span className="search-indicator">
              Searching for: "{filters.query}"
            </span>
          )}
        </div>

        <div className="endpoints-grid">
          {results.map(({ endpoint, score }) => (
            <div
              key={endpoint.id}
              className={`endpoint-card ${
                selectedEndpoint?.id === endpoint.id ? "selected" : ""
              }`}
              onClick={() =>
                setSelectedEndpoint(
                  selectedEndpoint?.id === endpoint.id ? null : endpoint
                )
              }
            >
              <div className="endpoint-header">
                <MethodBadge
                  method={endpoint.method}
                  className={`method-badge method-${endpoint.method}`}
                />
                <code className="endpoint-path">{endpoint.path}</code>
                {filters.query && (
                  <span className="relevance-score">
                    {(score * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="endpoint-summary">
                {endpoint.summary || "No summary available"}
              </div>

              {endpoint.tags && endpoint.tags.length > 0 && (
                <div className="endpoint-tags">
                  {endpoint.tags.map((tag) => (
                    <span key={tag} className="tag-badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {endpoint.deprecated && (
                <div className="deprecated-badge">⚠️ Deprecated</div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Endpoint Details */}
        {selectedEndpoint && (
          <div className="selected-endpoint-details">
            <EnhancedEndpointDetails endpoint={selectedEndpoint} />
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Interactive OpenAPI Docs Demo</h1>
        <p>
          A headless React library for OpenAPI documentation with interactive
          features
        </p>
      </header>

      <main className="main">
        <ApiProvider spec={petstoreApi}>
          <EnhancedSearchComponent />

          {/* Original static examples for comparison */}
          <section className="static-examples">
            <h2>Static Examples (Original Demo)</h2>

            <div className="example-grid">
              <div className="example-card">
                <h3>Basic List</h3>
                <EndpointList className="endpoint-list">
                  {(endpoint) => (
                    <EndpointItem
                      key={endpoint.id}
                      endpoint={endpoint}
                      className="endpoint-item"
                      renderMethod={(method) => (
                        <MethodBadge
                          method={method}
                          className={`method-badge method-${method}`}
                        />
                      )}
                      renderPath={(path) => (
                        <code className="endpoint-path">{path}</code>
                      )}
                      renderSummary={(summary) =>
                        summary ? (
                          <span className="endpoint-summary">{summary}</span>
                        ) : null
                      }
                    />
                  )}
                </EndpointList>
              </div>

              <div className="example-card">
                <h3>Grouped by Tag</h3>
                <EndpointList
                  groupBy="tag"
                  className="grouped-endpoint-list"
                  renderGroup={(tagName, endpoints) => (
                    <div key={tagName} className="tag-group">
                      <h4 className="tag-title">{tagName}</h4>
                      <div className="tag-endpoints">
                        {endpoints.map((endpoint) => (
                          <EndpointItem
                            key={endpoint.id}
                            endpoint={endpoint}
                            className="grouped-endpoint-item"
                            renderMethod={(method) => (
                              <MethodBadge
                                method={method}
                                className={`method-badge method-${method}`}
                              />
                            )}
                            renderPath={(path) => (
                              <code className="endpoint-path">{path}</code>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </section>
        </ApiProvider>
      </main>
    </div>
  );
}

export default App;

// Add styles for the enhanced demo
const style = document.createElement("style");
style.textContent = `
  .enhanced-search-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .feature-toggles {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .toggle-btn {
    padding: 8px 16px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    border-color: #007acc;
    background-color: #007acc;
    color: white;
  }

  .toggle-btn:hover {
    border-color: #007acc;
  }

  .demo-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
  }

  .advanced-search-demo h3,
  .api-loader-demo h3 {
    margin-top: 0;
    color: #333;
  }

  .search-controls {
    margin-bottom: 20px;
  }

  .search-input {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .filter-row {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;
    flex-wrap: wrap;
  }

  .filter-row select {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 120px;
  }

  .clear-button {
    padding: 6px 12px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .clear-button:hover {
    background: #c82333;
  }

  .toggle-filters {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .toggle-filters label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }

  .results-count {
    font-weight: bold;
    margin-bottom: 15px;
    color: #666;
  }

  .search-result-item {
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 6px;
    margin-bottom: 10px;
    background: white;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
  }

  .relevance-score {
    font-size: 12px;
    background: #e9ecef;
    padding: 2px 6px;
    border-radius: 3px;
    color: #666;
  }

  .result-summary {
    color: #666;
    font-size: 14px;
  }

  .loader-controls button {
    padding: 8px 16px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 15px;
  }

  .loader-controls button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading {
    padding: 10px;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    color: #856404;
  }

  .error {
    padding: 10px;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    color: #721c24;
  }

  .loaded-spec {
    padding: 10px;
    background: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    color: #155724;
  }

  .results-section {
    margin-top: 20px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .search-indicator {
    font-style: italic;
    color: #666;
    font-size: 14px;
  }

  .endpoints-grid {
    display: grid;
    gap: 15px;
    margin-bottom: 20px;
  }

  .endpoint-card {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .endpoint-card:hover {
    border-color: #007acc;
    box-shadow: 0 2px 4px rgba(0,122,204,0.1);
  }

  .endpoint-card.selected {
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
  }

  .endpoint-card .endpoint-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .endpoint-card .endpoint-path {
    font-family: monospace;
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 13px;
  }

  .endpoint-card .endpoint-summary {
    color: #666;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .endpoint-tags {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .tag-badge {
    font-size: 11px;
    background: #e9ecef;
    color: #495057;
    padding: 2px 6px;
    border-radius: 12px;
  }

  .deprecated-badge {
    font-size: 11px;
    background: #fff3cd;
    color: #856404;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .selected-endpoint-details {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f8f9fa;
  }

  .tab-navigation {
    display: flex;
    margin-bottom: 15px;
    border-bottom: 1px solid #ddd;
  }

  .tab {
    padding: 8px 16px;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .tab.active {
    border-bottom-color: #007acc;
    color: #007acc;
  }

  .tab-content {
    padding: 15px 0;
  }

  .detail-section {
    margin-bottom: 20px;
  }

  .detail-section h4,
  .detail-section h5 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
  }

  .parameters-list,
  .responses-list {
    display: grid;
    gap: 10px;
  }

  .parameter-item,
  .response-item {
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
    background: white;
  }

  .parameter-header,
  .response-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  .parameter-name {
    font-family: monospace;
    background: #f8f9fa;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .parameter-location {
    font-size: 11px;
    background: #6c757d;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .parameter-location.path { background: #28a745; }
  .parameter-location.query { background: #007bff; }
  .parameter-location.header { background: #6610f2; }
  .parameter-location.cookie { background: #fd7e14; }

  .required-badge {
    font-size: 10px;
    background: #dc3545;
    color: white;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .parameter-description,
  .response-description {
    color: #666;
    font-size: 13px;
    margin-bottom: 5px;
  }

  .parameter-schema {
    font-size: 12px;
    color: #666;
  }

  .status-code {
    font-family: monospace;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
  }

  .status-code.status-2xx { background: #d4edda; color: #155724; }
  .status-code.status-3xx { background: #d1ecf1; color: #0c5460; }
  .status-code.status-4xx { background: #f8d7da; color: #721c24; }
  .status-code.status-5xx { background: #f5c6cb; color: #721c24; }

  .parameter-section {
    margin-bottom: 15px;
  }

  .parameter-input {
    margin-bottom: 10px;
  }

  .parameter-input label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .parameter-input input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .execute-button {
    padding: 10px 20px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 15px;
  }

  .execute-button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .execution-result {
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 15px;
  }

  .execution-result.success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  .execution-result.error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .execution-result pre {
    background: rgba(0,0,0,0.1);
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    margin-top: 10px;
  }

  .code-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 15px;
  }

  .code-controls select {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .code-controls button {
    padding: 6px 12px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .code-snippet {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  .snippet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8f9fa;
    border-bottom: 1px solid #ddd;
  }

  .language-name {
    font-weight: bold;
    color: #333;
  }

  .snippet-description {
    font-size: 12px;
    color: #666;
  }

  .code-snippet pre {
    margin: 0;
    padding: 15px;
    background: #f8f9fa;
    overflow-x: auto;
  }

  .code-snippet code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
  }
`;

document.head.appendChild(style);
