import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com"],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
