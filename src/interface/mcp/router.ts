import { hostHeaderValidation } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { Router } from 'express';

interface IDependencies {
  createServer: () => McpServer;
  appUrl: string;
  isLocal: boolean;
}

/** Mount the stateless SDK adapter beneath the application's /mcp route. */
export default function createMcpRouter(deps: IDependencies): Router {
  const allowedHosts = deps.appUrl ? [new URL(deps.appUrl).hostname] : [];

  if (deps.isLocal) {
    allowedHosts.push('localhost', '127.0.0.1', '[::1]');
  }

  const handler = toNodeHandler(createMcpHandler(deps.createServer));
  const router = Router();

  router.all('/', hostHeaderValidation(allowedHosts), async (req, res) => {
    await handler(req, res, req.body);
  });

  return router;
}
