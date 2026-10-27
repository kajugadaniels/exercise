import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
        pathname: "/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/**",
      },
    ],
  },
  partialPrefetching: true,
  reactCompiler: true,
};

export default nextConfig;
