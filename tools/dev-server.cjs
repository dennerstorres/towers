const { createServer } = require('node:http');
const { createReadStream, existsSync, statSync } = require('node:fs');
const { extname, join, normalize, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const preferredPort = Number(process.env.PORT || process.argv[2] || 4173);
const host = '127.0.0.1';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${host}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const filePath = normalize(join(root, pathname));
  if (!filePath.startsWith(root)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
});

function listen(port) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, host, () => {
    console.log(`Towers dev server running at http://${host}:${port}/`);
    console.log('Press Ctrl+C to stop.');
  });
}

listen(preferredPort);
