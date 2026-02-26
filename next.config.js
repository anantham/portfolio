/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only hardening: avoid stale vendor chunk entries causing module/runtime mismatch.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: 'memory' }
    }
    return config
  },
}

module.exports = nextConfig
