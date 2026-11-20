import { fileURLToPath } from "node:url";

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
