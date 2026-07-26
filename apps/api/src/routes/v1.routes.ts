import { Router } from "express";
import workspaceRouter from "./workspace.routes";
import workspaceMemberRouter from "./workspace-member.routes";
import { directProjectRouter, nestedProjectRouter } from "./project.routes";
import { directArtifactRouter, nestedArtifactRouter } from "./artifact.routes";

// Combines all route modules into a single router, mounting each one at its appropriate URL path.
const router = Router();

router.use("/workspaces", workspaceRouter);
router.use("/workspaces/:workspaceId/members", workspaceMemberRouter);
router.use("/workspaces/:workspaceId/projects", nestedProjectRouter);
router.use("/projects", directProjectRouter);
router.use("/projects/:projectId/artifacts", nestedArtifactRouter);
router.use("/artifacts", directArtifactRouter);

export default router;
