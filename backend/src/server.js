import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT || 4000);

const server = app.listen(port, () => {
  console.log(`EngageAI API listening on port ${port}`);
});

server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS || 125000);
server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 130000);

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
