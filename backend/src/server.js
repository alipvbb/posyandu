import { app } from './app.js';
import { env } from './config/env.js';
import http from 'node:http';

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] uncaughtException', error);
});

const start = async () => {
  try {
    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(
        `Backend running on http://0.0.0.0:${env.port} (pid=${process.pid}, NODE_ENV=${process.env.NODE_ENV || 'development'})`,
      );
    });
    server.on('error', (error) => {
      console.error('[SERVER ERROR]', error);
    });

    const redirectFromPort = process.env.REDIRECT_FROM_PORT
      ? Number(process.env.REDIRECT_FROM_PORT)
      : 0;
    if (Number.isFinite(redirectFromPort) && redirectFromPort > 0 && redirectFromPort !== env.port) {
      const redirectServer = http.createServer((req, res) => {
        const host = req.headers.host || `127.0.0.1:${redirectFromPort}`;
        const hostWithoutPort = host.split(':')[0] || '127.0.0.1';
        const location = `http://${hostWithoutPort}:${env.port}${req.url || '/'}`;
        res.writeHead(302, { Location: location });
        res.end();
      });

      redirectServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.warn(
            `Redirect port ${redirectFromPort} sedang dipakai aplikasi lain. Tetap gunakan http://localhost:${env.port}`,
          );
          return;
        }
        console.error('Redirect server failed', error);
      });

      redirectServer.listen(redirectFromPort, () => {
        console.log(
          `Redirect server running on http://localhost:${redirectFromPort} -> http://localhost:${env.port}`,
        );
      });
    }
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
