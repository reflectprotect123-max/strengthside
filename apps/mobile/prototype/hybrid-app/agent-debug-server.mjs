#!/usr/bin/env node
/**
 * Local static server + NDJSON ingest for session-start hang debugging.
 * Serves this directory; POST /__agent_debug appends one NDJSON line to
 * /opt/cursor/logs/debug.log
 *
 * Usage:
 *   node agent-debug-server.mjs [port]
 * Default port: 8765
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 8765);
const LOG = '/opt/cursor/logs/debug.log';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function ensureLogDir() {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
}

function appendLog(obj) {
  ensureLogDir();
  fs.appendFileSync(LOG, JSON.stringify(obj) + '\n');
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/__agent_debug') {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.timestamp) payload.timestamp = Date.now();
        appendLog(payload);
        res.writeHead(204);
        res.end();
      } catch (e) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.end('bad json');
      }
    });
    return;
  }

  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

ensureLogDir();
server.listen(PORT, '127.0.0.1', () => {
  console.log(`agent-debug-server listening http://127.0.0.1:${PORT}/`);
  console.log(`ingest POST /__agent_debug → ${LOG}`);
});
