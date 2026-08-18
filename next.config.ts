import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Merch mockups are served from Printful's CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.cdn.printful.com",
      },
    ],
  },
};

export default nextConfig;
