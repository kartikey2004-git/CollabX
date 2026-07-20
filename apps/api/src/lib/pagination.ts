import { ValidationError } from "./errors";

// The information we need to remember "where we left off" in a paginated list: the value we last sorted by, plus that row's id (to break ties).

export interface CursorPayload {
  value: string | number;
  id: string;
}

// Turns the "where we left off" info into a single opaque string (a cursor) that can be safely sent to the frontend and passed back on the next request.

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// Reverses encodeCursor: takes the cursor string from the request and turns it back into the { value, id } we need to query the next page.

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(json);

    // Make sure the decoded data actually looks like a valid cursor before trusting it.
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("value" in parsed) ||
      !("id" in parsed) ||
      typeof (parsed as CursorPayload).id !== "string"
    ) {
      throw new Error("malformed cursor");
    }
    return parsed as CursorPayload;
  } catch {
    // If decoding fails for any reason, treat it as a bad request rather than crashing.
    throw new ValidationError("Invalid pagination cursor", [
      { path: "cursor", message: "Cursor is malformed or expired" },
    ]);
  }
}

// Builds a Prisma `where` filter that fetches only rows "after" the cursor, so we can grab the next page instead of starting over from row 1. If two rows have the same sort value, we use `id` as a tiebreaker.

export function buildKeysetWhere(
  sortBy: string,
  sortOrder: "asc" | "desc",
  cursor?: CursorPayload,
): Record<string, unknown> | undefined {
  // No cursor means this is the first page, so there's no filter to apply.
  if (!cursor) return undefined;
  
  // Ascending order lookup for "greater than" the cursor; descending lookup for "less than".
  const op = sortOrder === "asc" ? "gt" : "lt";
  return {
    OR: [
      { [sortBy]: { [op]: cursor.value } },
      { [sortBy]: cursor.value, id: { [op]: cursor.id } },
    ],
  };
}

// Takes the rows fetched from the database and slices them into "this page" + info on whether there's a next page and what cursor to use for it.

export function paginateResults<T extends { id: string }>(
  rows: T[],
  limit: number,
  sortBy: keyof T,
): { items: T[]; hasMore: boolean; nextCursor: string | null } {
  // We always fetch one extra row (limit + 1) to check if more pages exist.
  const hasMore = rows.length > limit;
  
  // Only keep up to "limit" rows for the actual page of results.
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];   
  
  // Build the cursor for the next page from the last item on this page (if there is a next page).
  const nextCursor =
    hasMore && last
      ? encodeCursor({
        value: last[sortBy] as unknown as string | number,
        id: last.id,
      })
      : null;
  return { items, hasMore, nextCursor };
}
  
/*

Cursor pagination (the "keyset" style used here) lets you fetch a list in pages without using OFFSET(which is used in SQL for pagination which helps in skipping the first n rows), by remembering where you left off instead of counting rows. Here's how it works end-to-end in this codebase:

1. The cursor is just "the last row you saw"

interface CursorPayload {
  value: string | number;   // the sort field's value on the last row (e.g. createdAt)
  id: string;               // that row's id, as a tiebreaker (means if two rows have the same sort value, we use id as a tiebreaker)
}

2. First page — no cursor

Client calls GET /projects with no cursor. buildKeysetWhere returns undefined, so no extra filter is applied — Prisma just fetches the first limit + 1 rows, sorted by sortBy then id.

3. Over-fetch by one to know if there's a next page

const rows = await db.project.findMany({ where, orderBy, take: params.limit + 1 });
return paginateResults(rows, params.limit, params.sortBy);

  // Asking for limit + 1 rows is the trick: if you get back more than limit, you know a next page exists, without running a separate COUNT query.

const hasMore = rows.length > limit;
const items = hasMore ? rows.slice(0, limit) : rows;

4. Turning the last row into a cursor

const nextCursor = hasMore && last
  ? encodeCursor({ value: last[sortBy], id: last.id })
  : null;

// encodeCursor just JSON-stringifies { value, id } and base64-encodes it into one opaque string. The client gets this back and doesn't need to know what's inside — it just passes it back on the next request.

5. Fetching the next page

Client sends ?cursor=<that string>. decodeCursor reverses the encoding (and throws a ValidationError if it's tampered with or malformed). Then buildKeysetWhere turns it into a Prisma filter

  - The client sends the cursor from the last item of the previous page. `decodeCursor` converts that encoded cursor back into its original values (like `createdAt` and `id`) and throws an error if the cursor is invalid or has been modified.

const op = sortOrder === "asc" ? "gt" : "lt";
return {
  OR: [
    { [sortBy]: { [op]: cursor.value } },                          // strictly past the last value
    { [sortBy]: cursor.value, id: { [op]: cursor.id } },            // same value, tiebreak by id
  ],
};

In plain English: "give me rows where createdAt > lastSeenCreatedAt, OR (createdAt is exactly equal but id > lastSeenId)." The second branch handles ties — e.g. two projects created in the same millisecond — so no row gets skipped or duplicated across pages.

  - Those values are then used to fetch the next set of records. The query returns rows where the sorting field (e.g. `createdAt`) is greater than the last seen value, or if the sorting field is the same, rows with a greater `id`. 
  
  - Using the `id` as a tie-breaker ensures that records with identical timestamps are returned correctly, so no rows are skipped or duplicated between pages.


Why this beats OFFSET/LIMIT:

  - OFFSET 10000 forces the database to scan and discard 10,000 rows every time — cursor pagination jumps straight to the right spot using an index.
  
  - If a row is inserted while someone's paging through, offset-based paging can skip or repeat rows; cursor-based paging can't, because it's anchored to an actual row's values, not a row count.
  
  - The tradeoff: you can't jump to "page 47" directly — only "next page from here," which fits an infinite-scroll or "load more" UI (exactly what this API's nextCursor/hasMore response shape is built for).

*/
