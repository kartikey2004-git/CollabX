import express, { Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './config/logger';
import TestRouter from './routes/health.routes';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';

const app: Express = express();

app.all("/api/auth/*path", toNodeHandler(auth));
app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', TestRouter);

export { app };