import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
	REPO_URL,
	features,
	heroTech,
} from "../lib/landing-data";

function CodeBlock({ children }: { children: string }) {
	return (
		<pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-left text-sm leading-relaxed">
			<code className="font-mono text-foreground/90">{children}</code>
		</pre>
	);
}

function SectionHeading({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="mb-8 text-center md:mb-10">
			<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
				{title}
			</h2>
			<p className="mt-3 text-muted-foreground">{description}</p>
		</div>
	);
}

export default function Home() {
	return (
		<div className="w-full max-w-5xl space-y-24 pb-16 pt-24 md:pt-28">
			<section className="flex flex-col items-center px-4 text-center">
				<Badge variant="outline" className="mb-6 rounded-full px-3 py-1">
					Production-ready Turborepo Starter
				</Badge>
				<h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
				  Spend less time configuring. More time shipping.
				</h1>
				<p className="mt-6 max-w-2xl text-lg text-muted-foreground">
					A minimal monorepo starter with Next.js, Express, Prisma, and
					PostgreSQL — wired, typed, and ready for production.
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button asChild className="bg-white border-border text-black hover:bg-white/50">
						<Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
							Clone Repository
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				</div>
				<div className="mt-10 flex flex-wrap justify-center gap-2">
					{heroTech.map((tech) => (
						<Badge
							key={tech}
							variant="outline"
							className="rounded-md font-normal text-muted-foreground"
						>
							{tech}
						</Badge>
					))}
				</div>
			</section>

			<Separator />

			<section className="px-4">
				<SectionHeading
					title="Everything you need to ship"
					description="Batteries included, without the bloat."
				/>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map(({ icon: Icon, title, description }) => (
						<Card
							key={title}
							className="rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:border-foreground"
						>
							<CardHeader className="pb-2">
								<Icon className="mb-2 size-5 text-muted-foreground" />
								<CardTitle className="text-base font-medium">
									{title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									{description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
}
