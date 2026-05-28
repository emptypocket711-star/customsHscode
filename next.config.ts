import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/external/container-receipt": [
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/playwright-core/lib/**",
      "./node_modules/@sparticuz/chromium/bin/**"
    ]
  }
};

export default nextConfig;
