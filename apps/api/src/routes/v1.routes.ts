import { Router } from "express";
import articleRouter from "./article.routes";
import techReadRouter from "./tech-read.routes";
import assetRouter from "./asset.routes";
import userRouter from "./user.routes";
import { createNestedSubmissionRouter, directSubmissionRouter } from "./submission.routes";
import { createNestedCommentRouter, directCommentRouter } from "./comment.routes";

// Combines all route modules into a single router, mounting each one at its appropriate URL path.
const router = Router();

router.use("/articles", articleRouter);
router.use("/articles/:articleId/submissions", createNestedSubmissionRouter("article"));
router.use("/articles/:articleId/comments", createNestedCommentRouter("article"));

router.use("/tech-reads", techReadRouter);
router.use("/tech-reads/:techReadId/submissions", createNestedSubmissionRouter("techRead"));
router.use("/tech-reads/:techReadId/comments", createNestedCommentRouter("techRead"));

router.use("/submissions", directSubmissionRouter);
router.use("/submissions/:submissionId/assets", assetRouter);

router.use("/comments", directCommentRouter);

router.use("/users", userRouter);

export default router;
