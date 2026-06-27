import express, { Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './config/logger';
import TestRouter from './routes/health.routes';

const app: Express = express();

app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', TestRouter);

export { app };