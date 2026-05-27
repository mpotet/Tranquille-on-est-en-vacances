/**
 * dev.js - Lance wrangler dev + cloudflared tunnel en parallèle
 * Usage: npm run dev
 */
import { spawn } from 'node:child_process';

// Wrangler avec accès complet au terminal (commandes interactives [b][d][t]…)
const wrangler = spawn('npx', ['wrangler', 'dev', '--local', '--ip', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
});
wrangler.on('exit', code => process.exit(code ?? 1));

// Cloudflared en arrière-plan après 3s (le temps que wrangler démarre)
setTimeout(() => {
  const tunnel = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:8787'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  const showUrl = buf => {
    const m = buf.toString().match(/https:\/\/[^\s]+\.trycloudflare\.com/);
    if (m) process.stdout.write(`\n📱  PWA / HTTPS  →  ${m[0]}\n\n`);
  };
  tunnel.stdout.on('data', showUrl);
  tunnel.stderr.on('data', showUrl);
}, 3000);

process.on('SIGINT',  () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

