/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile our local packages for proper Next.js integration
  transpilePackages: ['@openapi-docs/ui'],
  // Turbopack configuration (replaces webpack in Next.js 16)
  turbopack: {
    resolveAlias: {
      // Handle ESM modules from our library
      '.js': ['.js', '.ts', '.tsx']
    }
  }
}

export default nextConfig