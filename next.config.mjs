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
        // Handle missing optional dependencies
        dompurify: false,
        canvg: false,
      };
    }

    // Handle optional dependencies for jsPDF on Vercel
    if (process.env.VERCEL) {
      config.resolve.alias = {
        ...config.resolve.alias,
        dompurify: false,
        canvg: false,
        jspdf: false, // Disable jsPDF entirely on Vercel
      };
    }

    // Aggressive optimization for Vercel deployment
    if (process.env.VERCEL && isServer) {
      // Exclude only the largest packages from server bundle on Vercel
      const heavyPackages = [
        'onnxruntime-node',
        '@huggingface/transformers',
        '@langchain/community/embeddings/huggingface_transformers'
      ];
      
      // More aggressive externalization
      config.externals = [
        ...config.externals,
        // Externalize heavy packages completely
        ...heavyPackages.map(pkg => ({ [pkg]: `commonjs ${pkg}` })),
        // Dynamic exclusion for any imports containing these packages
        ({ request }, callback) => {
          if (request && heavyPackages.some(pkg => request.includes(pkg))) {
            return callback(null, `commonjs ${request}`);
          }
          // Also exclude node_modules with heavy ML patterns
          if (request && (
            request.includes('onnxruntime') || 
            request.includes('@huggingface/transformers')
          )) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
      
      // Override resolve to prevent loading heavy modules only
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        '@huggingface/transformers': false,
      };
    }

    return config;
  },
};

export default nextConfig;
