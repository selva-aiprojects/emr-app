/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app with serverless-http so it can run as a Vercel Function.
 * Vercel automatically exposes this file at /api
 */
import serverless from 'serverless-http';
import { app } from '../server/index.js';

export default serverless(app);
