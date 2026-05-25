/**
 * frontend/proxy.js
 * Proxifie localhost:3000 → backend Worker sur localhost:8787
 * Aucune dépendance — Node.js built-ins uniquement.
 *
 * Usage: npm run dev  (depuis frontend/)
 * Prérequis: cd ../backend && npm run dev  (Worker sur :8787)
 */
import http from 'node:http';
import os   from 'node:os';

const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8787;
const LISTEN_PORT  = 3000;

function getLocalIp() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    host:    BACKEND_HOST,
    port:    BACKEND_PORT,
    path:    clientReq.url,
    method:  clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `${BACKEND_HOST}:${BACKEND_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', () => {
    const body = [
      '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">',
      '<title>Backend non démarré</title>',
      '<style>body{font-family:sans-serif;padding:3rem;background:#fffdf9;color:#1a2b3c}',
      'pre{background:#f0ede6;padding:1rem;border-radius:.75rem;font-size:1rem}',
      'h1{color:#d97706}</style></head><body>',
      '<h1>⚠️ Backend non démarré</h1>',
      '<p>Ouvrez un deuxième terminal et lancez&nbsp;:</p>',
      '<pre>cd ../backend\nnpm run dev</pre>',
      '<p>Puis rechargez cette page.</p>',
      '</body></html>',
    ].join('');
    clientRes.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    clientRes.end(body);
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`\n🌐  Frontend dev  →  http://localhost:${LISTEN_PORT}`);
  if (localIp) {
    console.log(`📱  Réseau local   →  http://${localIp}:${LISTEN_PORT}`);
  }
  console.log(`    Proxy vers    →  http://${BACKEND_HOST}:${BACKEND_PORT}`);
  console.log(`\n💡  Pour les notifications push (PWA), le HTTPS est requis.`);
  console.log(`    Lance le backend avec : npm run dev  puis appuie sur [t] dans wrangler`);
  console.log(`    pour obtenir une URL HTTPS publique (*.trycloudflare.com).\n`);
  if (localIp) {
    console.log(`    Backend direct  →  http://${localIp}:${BACKEND_PORT}  (HTTP, sans proxy)\n`);
  }
});
