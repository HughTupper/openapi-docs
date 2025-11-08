# Simple Demo - OpenAPI Docs UI

This demo showcases the `@openapi-docs/ui` headless React library with a simple Pet Store API specification.

## What's Demonstrated

### 1. **Basic Usage**

- Loading an OpenAPI 3.x specification
- Using `ApiProvider` to provide context
- Rendering endpoints with `EndpointList` and `EndpointItem`
- Styling with regular CSS classes

### 2. **Core Features**

- **Headless components** - No built-in styling, completely customizable
- **Render props** - Custom rendering for methods, paths, and summaries
- **Filtering** - Show only GET endpoints
- **Grouping** - Group endpoints by tags
- **TypeScript support** - Fully typed components and props

### 3. **Styling Examples**

- **Method badges** with color coding (GET=green, POST=blue, DELETE=red, etc.)
- **Responsive design** that works on mobile
- **Clean card-based layout** with hover effects
- **Typography hierarchy** with proper spacing

## Running the Demo

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Key Files

- `src/App.tsx` - Main demo component showing different usage patterns
- `src/App.css` - Complete styling for the headless components
- `src/petstore-api.json` - Sample OpenAPI 3.x specification
- `vite.config.ts` - Vite configuration for modern React development

## Usage Patterns Shown

### 1. **Simple List**

```tsx
<EndpointList>
  {(endpoint) => <EndpointItem endpoint={endpoint} />}
</EndpointList>
```

### 2. **Grouped by Tags**

```tsx
<EndpointList
  groupBy="tag"
  renderGroup={(tagName, endpoints) => (
    <div className="tag-group">
      <h3>{tagName}</h3>
      {endpoints.map(endpoint => ...)}
    </div>
  )}
/>
```

### 3. **Filtered List**

```tsx
<EndpointList filter={(endpoint) => endpoint.method === "get"}>
  {(endpoint) => <EndpointItem endpoint={endpoint} />}
</EndpointList>
```

### 4. **Custom Rendering**

```tsx
<EndpointItem
  endpoint={endpoint}
  renderMethod={(method) => (
    <MethodBadge method={method} className={`method-${method}`} />
  )}
  renderPath={(path) => <code>{path}</code>}
  renderSummary={(summary) => <span>{summary}</span>}
/>
```

## Styling Approach

The demo uses regular CSS classes to style the headless components:

- Each component accepts `className` and `style` props
- Method badges get `data-method` attributes for CSS targeting
- Responsive design with flexbox and CSS Grid
- Modern design system with consistent spacing and typography

This demonstrates how you can use any styling approach (CSS modules, styled-components, Tailwind, etc.) with the headless components.

## Next Steps

1. **Try different OpenAPI specs** - Replace `petstore-api.json` with your own API
2. **Experiment with styling** - Modify `App.css` or try other CSS frameworks
3. **Add interactivity** - Click handlers, search, filters, etc.
4. **Integrate with your app** - Copy patterns into your real application
