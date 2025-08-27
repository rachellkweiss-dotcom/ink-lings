import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  experimental: {
    excludeDefaultMomentLocales: false,
  }
};

export default nextConfig;
