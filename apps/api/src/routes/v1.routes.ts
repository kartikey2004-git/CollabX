import { Router } from "express";
import workspaceRouter from "./workspace.routes";
import { directProjectRouter, nestedProjectRouter } from "./project.routes";
import { directArtifactRouter, nestedArtifactRouter } from "./artifact.routes";

// Together all the individual route files into one router, mounting each at the URL path where it should live.

const router = Router();

router.use("/workspaces", workspaceRouter);
router.use("/workspaces/:workspaceId/projects", nestedProjectRouter);
router.use("/projects", directProjectRouter);
router.use("/projects/:projectId/artifacts", nestedArtifactRouter);
router.use("/artifacts", directArtifactRouter);

export default router;
