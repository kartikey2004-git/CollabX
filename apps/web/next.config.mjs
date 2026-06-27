import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config) => {
		config.resolve.alias["@repo/database"] = path.resolve(
			__dirname,
			"../../packages/database/dist/index.js",
		);
		return config;
	},
	experimental: {
		serverComponentsExternalPackages: [
			"@prisma/client",
			"@prisma/adapter-pg",
			"pg",
		],
	},
};

export default nextConfig;
