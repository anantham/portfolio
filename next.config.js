const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only hardening: avoid stale vendor chunk entries causing module/runtime mismatch.
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = { type: 'memory' }
    }

    // Cesium configuration for client-side only
    if (!isServer) {
      // Copy Cesium static assets to public directory
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Workers'),
              to: path.join(__dirname, 'public/cesium/Workers')
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/ThirdParty'),
              to: path.join(__dirname, 'public/cesium/ThirdParty')
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Assets'),
              to: path.join(__dirname, 'public/cesium/Assets')
            },
            {
              from: path.join(__dirname, 'node_modules/cesium/Build/Cesium/Widgets'),
              to: path.join(__dirname, 'public/cesium/Widgets')
            }
          ]
        })
      );

      // Cesium module configuration
      config.module = {
        ...config.module,
        unknownContextCritical: false,
        unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/
      };

      // Define Cesium base URL
      config.plugins.push(
        new (require('webpack')).DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify('/cesium')
        })
      );
    }

    return config
  },
}

module.exports = nextConfig
