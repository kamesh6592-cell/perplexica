/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
    ],
  },
  serverExternalPackages: [
    'pdf-parse',
    'onnxruntime-node',
    '@huggingface/transformers',
    'sharp',
    'canvas',
  ],
  webpack: (config, { isServer, dev }) => {
    // Reduce bundle size for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      };
    }

    // Aggressive optimization for Vercel deployment
    if (process.env.VERCEL && isServer) {
      // Exclude all heavy packages from server bundle on Vercel
      const heavyPackages = [
        'onnxruntime-node',
        '@huggingface/transformers',
        'better-sqlite3',
        'sharp',
        'canvas'
      ];
      
      config.externals = [
        ...config.externals,
        ...heavyPackages,
        // Also exclude any imports of these packages
        ({ request }, callback) => {
          if (heavyPackages.some(pkg => request?.includes(pkg))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
    }

    return config;
  },
};

export default nextConfig;
