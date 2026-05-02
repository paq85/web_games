import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

async function readAsset(requestPath) {
  const normalized = path.normalize(requestPath).replace(/^\.(?:\/|\\)+/, '');
  const absolute = path.join(rootDir, normalized);
  const resolved = path.resolve(absolute);
  if (!resolved.startsWith(rootDir)) {
    return null;
  }
  const stats = await fs.stat(resolved).catch(() => null);
  if (!stats || !stats.isFile()) {
    return null;
  }
  return resolved;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = await readAsset(pathname);

  if (!filePath) {
    send(res, 404, 'Not found');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes.get(extension) || 'application/octet-stream';
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch (error) {
    send(res, 500, `Failed to read asset: ${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`Pacman dev server running at http://localhost:${port}`);
});
