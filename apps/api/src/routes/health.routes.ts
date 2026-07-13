import { Router } from "express";
import { healthCheck } from "../controllers/health.controller";
const TestRouter = Router();

TestRouter.get("/health", healthCheck);

export default TestRouter;

