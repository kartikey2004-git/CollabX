import { Router } from "express";
import { getAllTestUsers, healthCheck } from "../controllers/health.controller";
const TestRouter = Router();

TestRouter.get("/users", getAllTestUsers);
TestRouter.get("/health", healthCheck);

export default TestRouter;

