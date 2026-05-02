import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = normalize(join(__filename, '..'));
const args = new Set(process.argv.slice(2));
const portFlagIndex = process.argv.indexOf('--port');
const port = portFlagIndex >= 0 ? Number(process.argv[portFlagIndex + 1]) : 3000;
const silent = args.has('--silent');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function resolvePath(requestPath) {
  const cleaned = requestPath.split('?')[0].split('#')[0];
  const relativePath = cleaned === '/' ? '/index.html' : cleaned;
  const fullPath = normalize(join(rootDir, relativePath));
  if (!fullPath.startsWith(rootDir)) {
    return null;
  }
  return fullPath;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = resolvePath(request.url || '/');
    if (!filePath) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    let fileStats;
    try {
      fileStats = await stat(filePath);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    if (fileStats.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      try {
        const html = await readFile(indexPath);
        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        response.end(html);
      } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
      }
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });

    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  if (!silent) {
    console.log(`Pac-Man dev server running at http://127.0.0.1:${port}`);
  }
});
