import db from "@repo/database";
import type { Artifact, ArtifactType, Prisma } from "@repo/database";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../lib/pagination";

// Which fields an artifact list can be sorted by.
export type ArtifactSortField = "createdAt" | "updatedAt" | "title";

export interface ListArtifactsParams {
  projectId: string;
  cursor?: string;
  limit: number;
  sortBy: ArtifactSortField;
  sortOrder: "asc" | "desc";
  type?: ArtifactType;
}

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

/* 

  - Determine the next position among siblings with the same parent (root artifacts use `null` as the parent).

  - We use `MAX(position) + 1` instead of `COUNT(*)` because soft-deleted siblings still occupy their original positions. 
  
  - Since the @@unique([parentArtifactId, position]) constraint ignores `deletedAt`, reusing a position from a soft-deleted sibling would violate the unique constraint.

*/

async function nextPosition(client: Db, parentArtifactId: string | null): Promise<number> {
  const result = await client.artifact.aggregate({
    where: { parentArtifactId }, // selects only the artifacts whose parentArtifactId matches the value passed to the function

    _max: { position: true }, // calculates the maximum (MAX) value of the position column among them.
  });

  /*
  
  - The function then uses the nullish coalescing operator (??) to treat null as -1, adds 1, and returns the result. This ensures that:
    
    - If siblings already exist with positions 0, 1, 2, the next position returned is 3.

    - If there are no siblings, the function returns 0, making it the first position assigned.
  
  pattern for assigning the next sequential position to a new artifact within the same parent.

  */

  return (result._max.position ?? -1) + 1;
}

export const artifactRepository = {
  // Insert a new artifact row into the database, assigning it a safe `position` among its siblings.

  async create(
    data: {
      title: string;
      type: ArtifactType;
      content: Prisma.InputJsonValue;
      projectId: string;
      parentArtifactId?: string | null; // null means root artifact
      createdBy: string;
    },
    client: Db = db,
  ): Promise<Artifact> {
    const parentArtifactId = data.parentArtifactId ?? null;

    const position = await nextPosition(client, parentArtifactId);

    return client.artifact.create({
      data: {
        title: data.title,
        type: data.type,
        content: data.content,
        projectId: data.projectId,
        parentArtifactId,
        createdBy: data.createdBy,
        position,
      },
    });
  },

  // Updates an artifact's title, content, or parent. If the artifact is moved to a different parent including the artifacts moved to root then parentArtifactId is set to `null`, and a new sibling `position` is assigned under the destination parent.

  async update(
    id: string,
    data: {
      title?: string;
      content?: Prisma.InputJsonValue;
      parentArtifactId?: string | null;
      updatedBy: string;
    },
    client: Db = db,
  ): Promise<Artifact> {
    const isReparenting = data.parentArtifactId !== undefined;

    const position = isReparenting
      ? await nextPosition(client, data.parentArtifactId as string | null)
      : undefined;

    return client.artifact.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        updatedBy: data.updatedBy,
        ...(isReparenting ? { parentArtifactId: data.parentArtifactId, position } : {}), // if reparenting then update parentArtifactId and position else do nothing
      },
    });
  },

  // Delete one artifact without removing the row by just marking it deleted.

  softDelete(id: string, client: Db = db): Promise<Artifact> {
    return client.artifact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  // Soft deletes multiple artifacts in a single operation (for example, an entire subtree) and returns the number of artifacts that were marked as deleted.

  async softDeleteMany(ids: string[], client: Db = db): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await client.artifact.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count;
  },

  // Soft delete every artifact under a given project at once (e.g. when the whole project is deleted), and return how many rows were affected.

  async softDeleteManyByProject(projectId: string, client: Db = db): Promise<number> {
    const result = await client.artifact.updateMany({
      where: { projectId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count;
  },

  // Find one artifact by id, but only if it hasn't been soft-deleted.

  findById(id: string): Promise<Artifact | null> {
    return db.artifact.findFirst({ where: { id, deletedAt: null } });
  },

  // Look up which project a given artifact belongs to (used by RBAC checks).

  async findProjectIdById(id: string): Promise<string | null> {
    const artifact = await db.artifact.findFirst({
      where: { id, deletedAt: null },
      select: { projectId: true },
    });

    return artifact?.projectId ?? null;
  },

  // true/false check for whether a (non-deleted) artifact exists.

  async exists(id: string): Promise<boolean> {
    const count = await db.artifact.count({ where: { id, deletedAt: null } });

    return count > 0;
  },

  // The artifact's parent, or `null` if it's a root artifact or its parent has been soft deleted.

  async findParent(artifactId: string): Promise<Artifact | null> {
    const artifact = await db.artifact.findFirst({
      where: { id: artifactId, deletedAt: null },
      select: { parentArtifactId: true },
    });

    if (!artifact?.parentArtifactId) return null;

    return db.artifact.findFirst({
      where: { id: artifact.parentArtifactId, deletedAt: null },
    });
  },

  // The artifact's direct child artifacts, sorted by sibling position , if two artifacts have the same position then the one with the smaller id will come first.

  findChildren(artifactId: string): Promise<Artifact[]> {
    return db.artifact.findMany({
      where: { parentArtifactId: artifactId, deletedAt: null },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
  },

  /*
  
  - Collects all ancestor IDs for an artifact by traversing up the tree to the root. 
  
  - The ancestors are returned from nearest to farthest and are used to prevent re-parenting an artifact under one of its own descendants.

  - Excalidraw for better understanding: https://excalidraw.com/#json=CBmjyaT6JxzjaZLesUhji,PG877InJlDeC9I-fpNmVkw

  */

  async findAncestorChainIds(artifactId: string): Promise<string[]> {
    // Stores the IDs of every ancestor, starting with the immediate parent and continuing up to the root.

    const ids: string[] = [];

    // Start from the given artifact and repeatedly move upward through its parent chain until we reach the root.

    let currentId: string | null = artifactId;

    while (currentId) {
      // Fetch only the current artifact's parent ID. We don't need the rest of the artifact, and soft-deleted artifacts are ignored.

      const artifact: { parentArtifactId: string | null } | null = await db.artifact.findFirst({
        where: { id: currentId, deletedAt: null },
        select: { parentArtifactId: true },
      });

      // Stop once we've reached the root (or the artifact no longer exists).
      if (!artifact?.parentArtifactId) break;

      // Record this ancestor before moving one level higher.
      ids.push(artifact.parentArtifactId);

      // Continue walking up the tree by treating the parent as the current node for the next iteration.
      currentId = artifact.parentArtifactId;
    }

    return ids;
  },

  /*
  
  - Traverses the subtree rooted at `artifactId` using a breadth-first search (BFS), collecting the IDs of all non-deleted descendants. 
  
  - Since artifact trees are typically shallow(means not much depth) not weighted, BFS is sufficient for cascading soft deletes.

  ----------------------------------------------------------

  - Returns the IDs of all non-deleted descendants of an artifact. The traversal is performed level by level (Breadth-First Search). 
    
  - Instead of recursively querying the database for each node in the tree, we process the tree level by level (Breadth-First Search). 
    
  - For every level, we fetch the children of all parent nodes in a single database query using `WHERE parentArtifactId IN (...)`.
     
  - This batching strategy dramatically reduces database round trips. Rather than executing one query per node, we execute at most one query per tree level, making the total number of queries proportional to the tree depth instead of the total number of nodes. 
  
  - Since artifact trees are typically shallow, this approach is significantly more efficient while still traversing every node.

    Example: findDescendantIds("A") => ["B", "C", "D", "E", "F"]
   
        A
      /   \
     B     C
    / \     \
   D   E     F
   
   
  - Used for cascading soft deletes, where an artifact and every artifact beneath it in the hierarchy must be deleted together.

  - Excalidraw for better understanding: https://excalidraw.com/#json=P-XmxiS_75l2xFv4sZQ6Y,S8wNO364sPJSGrsvVVb6aQ

  */

  async findDescendantIds(artifactId: string): Promise<string[]> {
    // Collects every descendant discovered during the traversal. The root artifact itself is intentionally excluded.

    const descendantIds: string[] = [];

    // The set of nodes currently being explored. Initially this contains only the starting artifact, then it is replaced with the next level of children after each iteration.

    let currentLevelIds = [artifactId];

    // Continue traversing until there are no more levels remaining.

    while (currentLevelIds.length > 0) {
      /*
      
      - Fetch every non-deleted artifact whose parent belongs to the current level.
      
      - Example: currentLevelIds = ["B", "C"]
      
        - Executes conceptually as: SELECT id FROM Artifact WHERE parentArtifactId IN ('B', 'C')
      
        - This retrieves the entire next level in single query.
      
      */

      const children = await db.artifact.findMany({
        where: {
          parentArtifactId: { in: currentLevelIds },
          deletedAt: null,
        },
        select: { id: true },
      });

      // No children means we've reached the leaf level, so the traversal is complete.

      if (children.length === 0) break;

      // Extract the child IDs from the query result. These IDs are added to the final list of descendants for that level and also become the parent IDs for the next BFS iteration, allowing the traversal to continue level by level.

      const childIds = children.map((child) => child.id);

      // Record every descendant discovered at the current level.
      descendantIds.push(...childIds);

      // Move one level deeper in the tree. The children from this iteration become the parents searched in the next.
      currentLevelIds = childIds;
    }

    // Return all descendants in breadth-first order.
    return descendantIds;
  },

  // Get one page of artifacts belonging to a project, with cursor-based pagination.

  async findByProject(params: ListArtifactsParams) {
    // Turn the incoming cursor string (if any) back into a usable value.
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;

    // Build the "give me rows after this cursor" filter.
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    // Only look at artifacts in this project that aren't soft-deleted, optionally narrowed down further by artifact type.

    const where = {
      projectId: params.projectId, // Filter by project ID.
      deletedAt: null, // Filter out soft-deleted artifacts.

      ...(params.type ? { type: params.type } : {}), // Filter by artifact type if provided.

      ...(keysetWhere ?? {}), // Apply cursor-based pagination filters.
    } as Prisma.ArtifactWhereInput;

    // Sort by the requested field, breaking ties by id for stable pagination.

    const orderBy = [
      { [params.sortBy]: params.sortOrder }, // Sort by the requested field.

      { id: params.sortOrder }, // Break ties by id for stable pagination.
    ] as Prisma.ArtifactOrderByWithRelationInput[];

    // Fetch one extra row beyond the limit so we can tell if there's a next page.
    const rows = await db.artifact.findMany({
      where,
      orderBy,
      take: params.limit + 1,
    });

    // Return the paginated results.
    return paginateResults(rows, params.limit, params.sortBy);
  },
};
