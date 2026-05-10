import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { env } from './src/config/env.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { notFoundHandler } from './src/middlewares/notFoundHandler.js';
import { API_PREFIX, registerRoutes } from './src/routes/index.js';

const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(serverRoot, '..');
const clientRoot = path.resolve(workspaceRoot, 'client');
const clientIndexPath = path.join(clientRoot, 'index.html');
const distPath = path.resolve(workspaceRoot, 'dist');
const distIndexPath = path.join(distPath, 'index.html');

/**
 * Gắn frontend vào Express theo đúng môi trường chạy.
 */
async function registerFrontend(app, httpServer) {
  if (env.appEnv === 'development') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      appType: 'custom',
      configFile: path.resolve(workspaceRoot, 'vite.config.js'),
      server: {
        middlewareMode: true,
        // Reuse the shared HTTP server so Vite does not open a second HMR WebSocket port.
        hmr: httpServer
          ? {
              server: httpServer,
            }
          : false,
      },
    });

    app.use(vite.middlewares);

    // Trong development, mọi route GET ngoài API sẽ trả về index.html đã được Vite transform.
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith(API_PREFIX)) {
        return next();
      }

      try {
        const template = await fs.readFile(clientIndexPath, 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);

        return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        return next(error);
      }
    });

    return;
  }

  try {
    await fs.access(distIndexPath);

    app.use(express.static(distPath));

    // Trong production, backend serve luôn frontend build từ thư mục dist.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith(API_PREFIX)) {
        return next();
      }

      return res.sendFile(distIndexPath);
    });
  } catch (error) {
    // Nếu chưa build frontend thì giữ nguyên backend API, không chặn quá trình khởi động server.
  }
}

/**
 * Tạo và cấu hình ứng dụng Express dùng cho toàn bộ API backend.
 */
export async function createApp({ httpServer } = {}) {
  const app = express();

  app.use(
    cors({
      origin: env.appUrl,
      credentials: true,
    }),
  );
  app.use(express.json());

  registerRoutes(app);
  await registerFrontend(app, httpServer);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
