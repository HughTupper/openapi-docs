import { useState } from "react";
import {
  ApiProvider,
  EndpointList,
  EndpointItem,
  MethodBadge,
  useEndpoints,
  useApiSpec,
  type OpenApiSpec,
  type HttpMethod,
} from "@openapi-docs/ui";
import petstoreApiData from "./petstore-api.json";
import "./App.css";

// Cast the imported JSON to the proper type
const petstoreApi = petstoreApiData as OpenApiSpec;

// Search and filter component
function SearchAndFilter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<Set<HttpMethod>>(
    new Set()
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const spec = useApiSpec();
  const allTags = spec?.tags?.map((tag) => tag.name) || [];
  const availableMethods: HttpMethod[] = [
    "get",
    "post",
    "put",
    "delete",
    "patch",
  ];

  // Get filtered endpoints based on current filters
  const filteredEndpoints = useEndpoints({
    search: searchTerm,
    filter: (endpoint) => {
      const methodMatch =
        selectedMethods.size === 0 || selectedMethods.has(endpoint.method);
      const tagMatch =
        selectedTags.size === 0 ||
        (endpoint.tags?.some((tag) => selectedTags.has(tag)) ?? false);
      return methodMatch && tagMatch;
    },
  });

  const toggleMethod = (method: HttpMethod) => {
    const newMethods = new Set(selectedMethods);
    if (newMethods.has(method)) {
      newMethods.delete(method);
    } else {
      newMethods.add(method);
    }
    setSelectedMethods(newMethods);
  };

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedMethods(new Set());
    setSelectedTags(new Set());
  };

  return (
    <div className="interactive-demo">
      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search endpoints by path, summary, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="clear-search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="method-filters">
            <label className="filter-label">Methods:</label>
            <div className="method-toggles">
              {availableMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  className={`method-toggle ${
                    selectedMethods.has(method) ? "active" : ""
                  }`}
                  data-method={method}
                >
                  {method.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="tag-filters">
            <label className="filter-label">Tags:</label>
            <div className="tag-toggles">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`tag-toggle ${
                    selectedTags.has(tag) ? "active" : ""
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button onClick={clearFilters} className="clear-filters">
            Clear All Filters
          </button>
        </div>

        <div className="results-summary">
          Showing {filteredEndpoints.length} endpoint
          {filteredEndpoints.length !== 1 ? "s" : ""}
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedMethods.size > 0 &&
            ` (methods: ${Array.from(selectedMethods).join(", ")})`}
          {selectedTags.size > 0 &&
            ` (tags: ${Array.from(selectedTags).join(", ")})`}
        </div>
      </div>

      {/* Endpoint List with Details */}
      <div className="endpoints-container">
        <div className="endpoints-list">
          {filteredEndpoints.length > 0 ? (
            filteredEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`interactive-endpoint-item ${
                  selectedEndpoint === endpoint.id ? "selected" : ""
                }`}
                onClick={() =>
                  setSelectedEndpoint(
                    selectedEndpoint === endpoint.id ? null : endpoint.id
                  )
                }
              >
                <div className="endpoint-header">
                  <MethodBadge
                    method={endpoint.method}
                    className={`method-badge method-${endpoint.method}`}
                  />
                  <code className="endpoint-path">{endpoint.path}</code>
                  <span className="endpoint-summary">{endpoint.summary}</span>
                  <button className="expand-button">
                    {selectedEndpoint === endpoint.id ? "−" : "+"}
                  </button>
                </div>

                {selectedEndpoint === endpoint.id && (
                  <EndpointDetails endpoint={endpoint} />
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No endpoints match your current filters.</p>
              <button onClick={clearFilters} className="clear-filters-link">
                Clear filters to see all endpoints
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Detailed view component for selected endpoint
function EndpointDetails({ endpoint }: { endpoint: any }) {
  return (
    <div className="endpoint-details">
      {endpoint.description && (
        <div className="detail-section">
          <h4>Description</h4>
          <p>{endpoint.description}</p>
        </div>
      )}

      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <div className="detail-section">
          <h4>Parameters</h4>
          <div className="parameters-list">
            {endpoint.parameters.map((param: any, index: number) => (
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
                  <p className="parameter-description">{param.description}</p>
                )}
                {param.schema && (
                  <div className="parameter-schema">
                    <strong>Type:</strong> {param.schema.type}
                    {param.schema.format && ` (${param.schema.format})`}
                    {param.schema.enum && (
                      <div>
                        <strong>Values:</strong> {param.schema.enum.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {endpoint.requestBody && (
        <div className="detail-section">
          <h4>Request Body</h4>
          <div className="request-body">
            {endpoint.requestBody.description && (
              <p>{endpoint.requestBody.description}</p>
            )}
            <div className="content-types">
              {endpoint.requestBody.content.map(
                (content: any, index: number) => (
                  <div key={index} className="content-type">
                    <code className="media-type">{content.mediaType}</code>
                    {content.schema && (
                      <div className="schema-info">
                        Schema: {content.schema.type || "object"}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {endpoint.responses && endpoint.responses.length > 0 && (
        <div className="detail-section">
          <h4>Responses</h4>
          <div className="responses-list">
            {endpoint.responses.map((response: any, index: number) => (
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
                {response.content && response.content.length > 0 && (
                  <div className="response-content">
                    {response.content.map(
                      (content: any, contentIndex: number) => (
                        <div key={contentIndex} className="content-type">
                          <code className="media-type">
                            {content.mediaType}
                          </code>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {endpoint.tags && endpoint.tags.length > 0 && (
        <div className="detail-section">
          <h4>Tags</h4>
          <div className="endpoint-tags">
            {endpoint.tags.map((tag: string, index: number) => (
              <span key={index} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
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
          <SearchAndFilter />

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
