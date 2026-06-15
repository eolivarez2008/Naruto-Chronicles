import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dnyw9l3xa/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
