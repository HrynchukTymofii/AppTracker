import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'utfs.io',
            pathname: '/**',
          },
          {
            protocol: 'https',
            hostname: 'p48gqac1wm.ufs.sh',
            pathname: '/**',
          },
        ],
      },
};

export default nextConfig;
