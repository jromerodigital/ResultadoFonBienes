import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const cleanUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  const relReq =
    cleanUrl === '/' || cleanUrl === '' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
  const candidatePath = path.resolve(DIST_DIR, relReq);
  const relFromDist = path.relative(DIST_DIR, candidatePath);

  if (relFromDist.startsWith('..') || path.isAbsolute(relFromDist)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Acceso denegado.');
    return;
  }

  const targetFile =
    fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()
      ? candidatePath
      : path.join(DIST_DIR, 'index.html');

  fs.readFile(targetFile, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Error interno. Ejecuta "npm run build" primero.');
      return;
    }
    const ext = path.extname(targetFile).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`  FONBIENES · INTELIGENCIA COMERCIAL (MODO PROTEGIDO)`);
  console.log(`  --> http://localhost:${PORT}/`);
  console.log(`========================================================\n`);
});
