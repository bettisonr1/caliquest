import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pino's worker-thread transport doesn't survive serverless bundling
  // unless these are left external instead of getting bundled.
  serverExternalPackages: ['pino', 'pino-pretty'],
}

export default nextConfig
