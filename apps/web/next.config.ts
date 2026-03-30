import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['@fomo/env', '@fomo/theme'],
};

export default nextConfig;
