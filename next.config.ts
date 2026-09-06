import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served under ronnlof.com/kotihinta/ via a reverse-proxy Pages Function
  // on the blog, rather than its own workers.dev subdomain.
  basePath: "/kotihinta",
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
