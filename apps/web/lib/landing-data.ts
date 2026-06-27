import {
	Boxes,
	Database,
	FileCode,
	FolderTree,
	GitBranch,
	Layers3,
	Package,
	Rocket,
	Server,
	ShieldCheck,
	Terminal,
	Workflow,
	type LucideIcon,
} from "lucide-react";

export const REPO_URL = "https://github.com/akashdeep023/turborepo-setup";
export const DOCS_URL = `${REPO_URL}#readme`;

export const heroTech = [
	"React",
	"Express",
	"Prisma",
	"PostgreSQL",
	"TypeScript",
	"Tailwind",
	"shadcn/ui",
];

export const features: {
	icon: LucideIcon;
	title: string;
	description: string;
}[] = [
	{
		icon: FolderTree,
		title: "Monorepo Architecture",
		description:
			"Turborepo workspaces keep apps and packages organized with fast, cached builds.",
	},
	{
		icon: Package,
		title: "Shared Packages",
		description:
			"Reuse UI, database, and config packages across every app in the monorepo.",
	},
	{
		icon: Database,
		title: "Prisma Ready",
		description:
			"Schema, migrations, and a typed client are configured and ready to extend.",
	},
	{
		icon: Layers3,
		title: "PostgreSQL",
		description:
			"Production-grade relational storage with Docker Compose for local development.",
	},
	{
		icon: Server,
		title: "Express API",
		description:
			"A structured Express server with routing, logging, and health checks built in.",
	},
	{
		icon: FileCode,
		title: "Next.js App",
		description:
			"App Router frontend with shared components, Tailwind, and shadcn/ui.",
	},
	{
		icon: ShieldCheck,
		title: "Type-safe",
		description:
			"End-to-end TypeScript across apps and packages for fewer runtime surprises.",
	},
	{
		icon: Terminal,
		title: "Pino Logging",
		description:
			"Structured JSON logging in the API with readable output in development.",
	},
	{
		icon: Boxes,
		title: "Docker Ready",
		description:
			"Spin up PostgreSQL and supporting services with a single compose file.",
	},
	{
		icon: GitBranch,
		title: "ESLint + Prettier",
		description:
			"Shared lint and format configs keep code consistent across the monorepo.",
	},
	{
		icon: Workflow,
		title: "Turbo Cache",
		description:
			"Remote and local caching speed up CI and local development workflows.",
	},
	{
		icon: Rocket,
		title: "Production Config",
		description:
			"Environment handling, build pipelines, and deployment-ready defaults.",
	},
];

