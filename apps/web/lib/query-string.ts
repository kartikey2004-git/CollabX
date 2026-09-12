// Turns a flat object of filter/pagination values into a "?a=1&b=2" query string, skipping any
// key whose value is undefined/null/empty so hooks can pass a filters object straight through
// without each one hand-rolling URLSearchParams logic.

export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
