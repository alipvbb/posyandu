import { app } from './app.js';
import { env } from './config/env.js';
import http from 'node:http';

const start = async () => {
  try {
    app.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
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
