import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['@fomo/env'],
};

export default nextConfig;
