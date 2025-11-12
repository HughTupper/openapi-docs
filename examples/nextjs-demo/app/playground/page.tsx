'use client'

import { useState, useEffect } from 'react'
import {
  ApiProvider,
  useSearch,
  useExecuteOperation,
  useCodeSnippet,
  MethodBadge,
  type OpenApiSpec,
  type NormalizedEndpoint
} from '@openapi-docs/ui'

// Import the same API spec as the docs page
const sampleApiSpec: OpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Next.js Demo API',
    version: '1.0.0',
    description: 'Interactive API playground for testing endpoints.',
  },
  servers: [
    {
      url: 'https://jsonplaceholder.typicode.com',
      description: 'Demo server (JSONPlaceholder)'
    }
  ],
  paths: {
    '/posts': {
      get: {
        summary: 'Get all posts',
        description: 'Retrieve a list of posts from the demo API.',
        operationId: 'getPosts',
        tags: ['Posts'],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            description: 'Filter posts by user ID',
            required: false,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'List of posts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      userId: { type: 'integer' },
                      title: { type: 'string' },
                      body: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a post',
        description: 'Create a new post (demo endpoint).',
        operationId: 'createPost',
        tags: ['Posts'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'body', 'userId'],
                properties: {
                  title: { type: 'string' },
                  body: { type: 'string' },
                  userId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Post created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    title: { type: 'string' },
                    body: { type: 'string' },
                    userId: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/posts/{id}': {
      get: {
        summary: 'Get post by ID',
        description: 'Retrieve a specific post by its ID.',
        operationId: 'getPostById',
        tags: ['Posts'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Post ID',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Post found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    userId: { type: 'integer' },
                    title: { type: 'string' },
                    body: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Post not found'
          }
        }
      }
    },
    '/users': {
      get: {
        summary: 'Get all users',
        description: 'Retrieve a list of users.',
        operationId: 'getUsers',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      username: { type: 'string' },
                      email: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: 'Posts', description: 'Post management' },
    { name: 'Users', description: 'User management' }
  ]
}

// API Testing Component
function ApiTester({ endpoint }: { endpoint: NormalizedEndpoint }) {
  const { executeById, loading, result, error, clearError } = useExecuteOperation({
    interceptors: {
      onRequest: async (url, init) => {
        console.log('🚀 Making request to:', url)
        return { url, init }
      },
      onResponse: async (response, data) => {
        console.log('✅ Response received:', response.status)
        return data
      },
      onError: async (error) => {
        console.error('❌ Request failed:', error)
        throw error
      }
    }
  })

  const [pathParams, setPathParams] = useState<Record<string, string>>({})
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [requestBody, setRequestBody] = useState<string>('{}')

  const handleExecute = async () => {
    try {
      clearError()
      const options: any = {
        pathParams: Object.keys(pathParams).length > 0 ? pathParams : undefined,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined
      }

      // Add request body for POST/PUT/PATCH requests
      if (endpoint.method !== 'get' && endpoint.method !== 'delete') {
        try {
          options.body = JSON.parse(requestBody)
        } catch (e) {
          throw new Error('Invalid JSON in request body')
        }
      }

      await executeById(endpoint.operationId!, options)
    } catch (err) {
      console.error('Request failed:', err)
    }
  }

  const pathParameters = endpoint.parameters?.filter(p => p.in === 'path') || []
  const queryParameters = endpoint.parameters?.filter(p => p.in === 'query') || []

  return (
    <div style={{ 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px', 
      padding: '2rem',
      background: 'white',
      marginBottom: '2rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <MethodBadge 
          method={endpoint.method}
          className={`method-badge method-${endpoint.method}`}
        />
        <code className="endpoint-path" style={{ fontSize: '1.1rem' }}>{endpoint.path}</code>
        <h3 style={{ margin: 0, flex: 1 }}>{endpoint.summary}</h3>
      </div>

      {pathParameters.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>Path Parameters</h4>
          {pathParameters.map(param => (
            <div key={param.name} style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold' 
              }}>
                {param.name} {param.required && <span style={{ color: '#f56565' }}>*</span>}
              </label>
              <input
                type="text"
                value={pathParams[param.name] || ''}
                onChange={(e) => setPathParams(prev => ({
                  ...prev,
                  [param.name]: e.target.value
                }))}
                placeholder={param.description || `Enter ${param.name}`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {param.description && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#718096', 
                  margin: '0.5rem 0 0 0' 
                }}>
                  {param.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {queryParameters.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>Query Parameters</h4>
          {queryParameters.map(param => (
            <div key={param.name} style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold' 
              }}>
                {param.name} {param.required && <span style={{ color: '#f56565' }}>*</span>}
              </label>
              <input
                type="text"
                value={queryParams[param.name] || ''}
                onChange={(e) => setQueryParams(prev => ({
                  ...prev,
                  [param.name]: e.target.value
                }))}
                placeholder={param.description || `Enter ${param.name}`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {param.description && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#718096', 
                  margin: '0.5rem 0 0 0' 
                }}>
                  {param.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {endpoint.method !== 'get' && endpoint.method !== 'delete' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>Request Body (JSON)</h4>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            placeholder='{"title": "Example", "body": "Post content", "userId": 1}'
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'Monaco, monospace'
            }}
          />
        </div>
      )}

      <button
        onClick={handleExecute}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: loading ? '#cbd5e0' : '#48bb78',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '1.5rem'
        }}
      >
        {loading ? '⏳ Executing...' : '🚀 Execute Request'}
      </button>

      {result && (
        <div style={{
          background: '#f0fff4',
          border: '1px solid #9ae6b4',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h5 style={{ color: '#22543d', marginBottom: '1rem' }}>
            ✅ Response ({result.status})
          </h5>
          <pre style={{
            background: '#1a202c',
            color: '#e2e8f0',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.9rem',
            margin: 0
          }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fed7d7',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h5 style={{ color: '#c53030', marginBottom: '0.5rem' }}>
            ❌ Error
          </h5>
          <p style={{ color: '#742a2a', margin: 0 }}>{error}</p>
          <button
            onClick={clearError}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#c53030',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Clear Error
          </button>
        </div>
      )}
    </div>
  )
}

// Code Generation Component
function CodeGenerator({ endpoint }: { endpoint: NormalizedEndpoint }) {
  const { generate, availableLanguages } = useCodeSnippet()
  const [selectedLanguage, setSelectedLanguage] = useState('curl')
  const [snippet, setSnippet] = useState<any>(null)

  const handleGenerate = () => {
    const result = generate(endpoint.operationId!, {
      language: selectedLanguage as any,
      parameters: {
        pathParams: { id: '1' },
        queryParams: { userId: '1' }
      },
      includeAuth: false
    })
    setSnippet(result)
  }

  useEffect(() => {
    handleGenerate()
  }, [selectedLanguage, endpoint.operationId])

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      background: 'white',
      overflow: 'hidden',
      marginBottom: '2rem'
    }}>
      <div style={{
        background: '#f7fafc',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h4 style={{ margin: 0, flex: 1 }}>📝 Code Example</h4>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px'
          }}
        >
          {availableLanguages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
      </div>

      {snippet && (
        <pre style={{
          background: '#1a202c',
          color: '#e2e8f0',
          padding: '1.5rem',
          margin: 0,
          overflow: 'auto',
          fontSize: '0.9rem',
          fontFamily: 'Monaco, Menlo, monospace'
        }}>
          <code>{snippet.code}</code>
        </pre>
      )}
    </div>
  )
}

// Main Playground Component
function ApiPlayground() {
  const { results } = useSearch()
  const [selectedEndpoint, setSelectedEndpoint] = useState<NormalizedEndpoint | null>(null)

  useEffect(() => {
    if (results.length > 0 && !selectedEndpoint) {
      setSelectedEndpoint(results[0].endpoint)
    }
  }, [results, selectedEndpoint])

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
          🧪 API Playground
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#718096' }}>
          Test API endpoints interactively with real requests and responses.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Endpoint Selector */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          height: 'fit-content'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Select Endpoint</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {results.map(({ endpoint }) => (
              <button
                key={endpoint.id}
                onClick={() => setSelectedEndpoint(endpoint)}
                style={{
                  padding: '1rem',
                  border: selectedEndpoint?.id === endpoint.id ? 
                    '2px solid #667eea' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: selectedEndpoint?.id === endpoint.id ? 
                    'rgba(102, 126, 234, 0.05)' : 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <MethodBadge 
                    method={endpoint.method}
                    className={`method-badge method-${endpoint.method}`}
                  />
                  <code style={{ fontSize: '0.8rem' }}>{endpoint.path}</code>
                </div>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#718096', 
                  margin: 0 
                }}>
                  {endpoint.summary}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint Details */}
        <div>
          {selectedEndpoint ? (
            <>
              <ApiTester endpoint={selectedEndpoint} />
              <CodeGenerator endpoint={selectedEndpoint} />
            </>
          ) : (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
              color: '#718096'
            }}>
              <p>Select an endpoint from the sidebar to start testing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Page Component
export default function PlaygroundPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading playground...
      </div>
    )
  }

  return (
    <ApiProvider spec={sampleApiSpec}>
      <ApiPlayground />
    </ApiProvider>
  )
}