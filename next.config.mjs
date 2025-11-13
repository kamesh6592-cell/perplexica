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

    // Vercel-specific optimizations - only exclude heavy packages, preserve path resolution
    if (process.env.VERCEL && isServer) {
      // Externalize only the heaviest packages
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        'onnxruntime-node',
        '@huggingface/transformers',
        '@langchain/community/embeddings/huggingface_transformers',
      ];
    }

    return config;
  },
};

export default nextConfig;
