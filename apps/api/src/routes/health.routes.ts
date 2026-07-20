import { Router } from "express";
import { healthCheck } from "../controllers/health.controller";
const HealthRouter = Router();

// GET /health — a simple endpoint to check that the server is running (no auth needed).
HealthRouter.get("/health", healthCheck);

export default HealthRouter;

