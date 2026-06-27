export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<h1 className="text-7xl md:text-9xl font-extrabold text-muted-foreground">
				404
			</h1>
			<h2 className="text-3xl md:text-5xl font-bold tracking-tight flex items-center flex-wrap justify-center gap-2">
				Not Found
			</h2>
			<p className="text-muted-foreground text-center">
				The page you are looking for does not exist.
			</p>
		</div>
	);
}
