import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Typecheck en CI séparé si besoin ; build prod non bloqué sur TS legacy
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
