# Next.js OpenAPI Documentation Demo

A comprehensive Next.js 16 application showcasing the integration and capabilities of the `@openapi-docs/ui` library.

## ✨ Features

- **🚀 Next.js 16 & React 19**: Built with the latest versions for optimal performance
- **⚡ Server-Side Rendering**: Full SSR support for fast initial page loads and SEO
- **🎨 Headless Architecture**: Complete control over styling and layout
- **🔍 Advanced Search**: Real-time filtering with fuzzy search and relevance scoring
- **🧪 API Testing**: Interactive endpoint testing with live requests
- **📝 Code Generation**: Multi-language code snippets with authentication
- **🌐 Dynamic Loading**: Load OpenAPI specs from URLs at runtime
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🔧 TypeScript**: Full TypeScript support with excellent DX

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm

### Installation

```bash
# Navigate to the Next.js demo
cd examples/nextjs-demo

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3001
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Homepage with features overview
│   ├── docs/              # API documentation page
│   │   └── page.tsx       # Interactive docs with search
│   ├── playground/        # API testing playground
│   │   └── page.tsx       # Live API testing interface
│   ├── examples/          # Code examples and tutorials
│   │   └── page.tsx       # Integration examples
│   └── globals.css        # Global styles and components
```

## 🎯 Demo Pages

### 🏠 Homepage (`/`)
- **Features Overview**: Comprehensive feature showcase
- **Getting Started**: Quick integration guide
- **Modern Design**: Beautiful landing page with gradients and animations

### 📚 API Documentation (`/docs`)
- **Advanced Search**: Real-time filtering with fuzzy search
- **Interactive Documentation**: Click-to-explore endpoint details
- **Organized Layout**: Grouped by tags with clear hierarchy
- **Relevance Scoring**: Smart search result ranking

### 🧪 API Playground (`/playground`)
- **Live Testing**: Execute real API requests
- **Parameter Forms**: Dynamic forms for path/query parameters
- **Request Bodies**: JSON editor for POST/PUT requests
- **Real Responses**: View actual API responses
- **Error Handling**: Graceful error display and recovery

### 📝 Code Examples (`/examples`)
- **Integration Guide**: Step-by-step setup instructions
- **Code Snippets**: Copy-paste examples for common use cases
- **Configuration**: Next.js and TypeScript setup
- **Styling Guide**: Custom styling examples

## ⚙️ Configuration

### Next.js Configuration

The demo includes optimized Next.js configuration for our library:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@openapi-docs/ui'],
    esmExternals: 'loose'
  },
  transpilePackages: ['@openapi-docs/ui'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx']
    }
    return config
  }
}
```

### TypeScript Configuration

Includes proper TypeScript setup with path aliases:

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🎨 Styling

The demo uses a modern design system with:

- **CSS Custom Properties**: Consistent color palette and spacing
- **Responsive Grid**: Mobile-first responsive layouts  
- **Glass Morphism**: Modern backdrop-blur effects
- **Gradient Backgrounds**: Beautiful color transitions
- **Component Variants**: Styled method badges and status indicators

## 🔧 Development

### Available Scripts

```bash
# Development server (port 3001)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Environment Variables

The demo works out of the box without environment variables, but you can customize:

```env
# Optional: Custom API base URL
NEXT_PUBLIC_API_URL=https://your-api.com

# Optional: Enable debug mode
NEXT_PUBLIC_DEBUG=true
```

## 📦 Dependencies

### Core Dependencies
- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **@openapi-docs/ui**: Our OpenAPI documentation library

### Development Dependencies
- **TypeScript 5.3**: Static type checking
- **ESLint**: Code linting and formatting
- **@types/react**: React type definitions

## 🚀 Deployment

The demo is ready for deployment to any platform that supports Next.js:

### Vercel (Recommended)
```bash
# Deploy to Vercel
npx vercel

# Or connect your GitHub repo to Vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Static Export
```bash
# Enable static export in next.config.js
output: 'export'

# Build static files
npm run build
```

## 🤝 Contributing

This demo serves as a comprehensive example of integrating our library with Next.js. Contributions are welcome!

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

This demo is part of the OpenAPI Documentation Library project and follows the same license.

## 🔗 Links

- **📚 Full Documentation**: [Main README](../../README.md)
- **📦 NPM Package**: `@openapi-docs/ui`
- **🐛 Issues**: [GitHub Issues](https://github.com/your-org/openapi-docs/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/your-org/openapi-docs/discussions)

---

**Happy coding!** 🎉