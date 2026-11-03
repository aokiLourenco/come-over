const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
