// Servidor local de desenvolvimento: serve o site estático e emula as
// funções da pasta api/ como a Vercel faz. Uso: node .claude/dev-server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import indicadores from '../api/indicadores.js';
import noticias from '../api/noticias.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8123;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};
const APIS = { '/api/indicadores': indicadores, '/api/noticias': noticias };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); return res; };
  const api = APIS[url.pathname];
  if (api) {
    try { await api(req, res); } catch (e) { res.statusCode = 500; res.end('Erro: ' + e.message); }
    return;
  }
  const caminho = url.pathname === '/' ? '/index.html' : url.pathname;
  try {
    const arquivo = await readFile(join(ROOT, normalize(decodeURIComponent(caminho))));
    res.setHeader('Content-Type', MIME[extname(caminho).toLowerCase()] || 'application/octet-stream');
    res.end(arquivo);
  } catch {
    res.statusCode = 404;
    res.end('404');
  }
}).listen(PORT, () => console.log('Site em http://localhost:' + PORT));
