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
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    serverComponentsExternalPackages: [
      'onnxruntime-node',
      '@huggingface/transformers',
      'sharp',
      'canvas',
    ],
  },
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

    // Optimize for Vercel deployment
    if (process.env.VERCEL && isServer) {
      // Exclude heavy packages from server bundle on Vercel
      config.externals = [...(config.externals || []), 'onnxruntime-node'];
    }

    return config;
  },
};

export default nextConfig;
