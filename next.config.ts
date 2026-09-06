import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/basePath";

const nextConfig: NextConfig = {
  // Served under ronnlof.com/kotihinta/ via a reverse-proxy Pages Function
  // on the blog, rather than its own workers.dev subdomain.
  basePath: BASE_PATH,
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
