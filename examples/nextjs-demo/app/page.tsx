'use client'

import { useState, useEffect } from 'react'
import {
  ApiProvider,
  useSearch,
  useApiLoader,
  EndpointList,
  EndpointItem,
  MethodBadge,
  type OpenApiSpec
} from '@openapi-docs/ui'

// Sample OpenAPI spec - in a real app, this would be loaded from your API
const sampleApiSpec: OpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Next.js Demo API',
    version: '1.0.0',
    description: 'A sample API for demonstrating Next.js integration with our OpenAPI documentation library.',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.example.com/v1',
      description: 'Staging server'
    }
  ],
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        description: 'Retrieve a list of all users in the system with pagination support.',
        operationId: 'getUsers',
        tags: ['Users'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            required: false,
            schema: { type: 'integer', default: 1, minimum: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of users per page',
            required: false,
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new user',
        description: 'Create a new user account in the system.',
        operationId: 'createUser',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Invalid input data'
          }
        }
      }
    },
    '/users/{userId}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieve detailed information about a specific user.',
        operationId: 'getUserById',
        tags: ['Users'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            description: 'The unique identifier of the user',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      },
      put: {
        summary: 'Update user',
        description: 'Update an existing user\'s information.',
        operationId: 'updateUser',
        tags: ['Users'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      },
      delete: {
        summary: 'Delete user',
        description: 'Remove a user from the system.',
        operationId: 'deleteUser',
        tags: ['Users'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': {
            description: 'User deleted successfully'
          },
          '404': {
            description: 'User not found'
          }
        }
      }
    },
    '/posts': {
      get: {
        summary: 'Get all posts',
        description: 'Retrieve a list of blog posts with filtering options.',
        operationId: 'getPosts',
        tags: ['Posts', 'Content'],
        parameters: [
          {
            name: 'author',
            in: 'query',
            description: 'Filter posts by author ID',
            schema: { type: 'string' }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter posts by publication status',
            schema: { 
              type: 'string', 
              enum: ['draft', 'published', 'archived'],
              default: 'published'
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of posts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'email', 'name'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1 },
          avatar: { type: 'string', format: 'uri' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 8 }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          avatar: { type: 'string', format: 'uri' }
        }
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          author: { $ref: '#/components/schemas/User' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          publishedAt: { type: 'string', format: 'date-time' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrevious: { type: 'boolean' }
        }
      }
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  tags: [
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Posts',
      description: 'Blog post operations'
    },
    {
      name: 'Content',
      description: 'Content management'
    }
  ]
}

// Advanced Search Component for Next.js
function NextjsAdvancedSearch() {
  const { results, filters, setFilters, getFilterOptions, clearFilters } = useSearch()
  const filterOptions = getFilterOptions()

  return (
    <div className="section">
      <h2>🔍 Advanced Search & Filtering</h2>
      <p>Explore our powerful search capabilities with real-time filtering:</p>
      
      <div style={{ 
        display: 'grid', 
        gap: '1rem', 
        marginBottom: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
      }}>
        <input
          type="text"
          placeholder="Search endpoints..."
          value={filters.query || ''}
          onChange={(e) => setFilters({ query: e.target.value })}
          style={{
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
        
        <select
          value={filters.methods?.[0] || ''}
          onChange={(e) => setFilters({ 
            methods: e.target.value ? [e.target.value as any] : [] 
          })}
          style={{
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px'
          }}
        >
          <option value="">All Methods</option>
          {filterOptions.methods.map(method => (
            <option key={method} value={method}>{method.toUpperCase()}</option>
          ))}
        </select>
        
        <select
          value={filters.tags?.[0] || ''}
          onChange={(e) => setFilters({ 
            tags: e.target.value ? [e.target.value] : [] 
          })}
          style={{
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px'
          }}
        >
          <option value="">All Tags</option>
          {filterOptions.tags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        
        <button
          onClick={clearFilters}
          style={{
            padding: '0.75rem',
            background: '#f56565',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      </div>

      <div>
        <p style={{ marginBottom: '1rem', color: '#718096' }}>
          Found {results.length} endpoint(s)
          {filters.query && ` matching "${filters.query}"`}
        </p>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {results.map(({ endpoint, score }) => (
            <div
              key={endpoint.id}
              style={{
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '0.5rem' 
              }}>
                <MethodBadge 
                  method={endpoint.method}
                  className={`method-badge method-${endpoint.method}`}
                />
                <code className="endpoint-path">{endpoint.path}</code>
                {filters.query && (
                  <span style={{
                    fontSize: '0.8rem',
                    background: '#e2e8f0',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    color: '#4a5568'
                  }}>
                    {(score * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
              <p className="endpoint-summary">{endpoint.summary}</p>
              {endpoint.tags && endpoint.tags.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: '0.5rem' 
                }}>
                  {endpoint.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        background: '#edf2f7',
                        color: '#4a5568',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main API Documentation Component
function ApiDocumentation() {
  return (
    <div className="api-container" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
          🚀 Next.js API Documentation
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#718096', marginBottom: '2rem' }}>
          Interactive API documentation with server-side rendering, advanced search, and modern UI.
        </p>
      </div>

      <NextjsAdvancedSearch />

      <div className="section">
        <h2>📋 All Endpoints</h2>
        <p>Complete list of available API endpoints with interactive documentation:</p>
        
        <EndpointList
          className="endpoint-list"
          groupBy="tag"
          renderGroup={(tagName, endpoints) => (
            <div key={tagName} style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#4a5568',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '0.5rem'
              }}>
                {tagName}
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {endpoints.map((endpoint) => (
                  <EndpointItem
                    key={endpoint.id}
                    endpoint={endpoint}
                    className="endpoint-item"
                    style={{
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
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
                ))}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}

// Main Docs Page Component
export default function DocsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading API documentation...
      </div>
    )
  }

  return (
    <ApiProvider spec={sampleApiSpec}>
      <ApiDocumentation />
    </ApiProvider>
  )
}