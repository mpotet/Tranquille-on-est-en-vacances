/**
 * Build production: Configure l'API vers le worker Cloudflare
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const distDir = path.join(projectRoot, 'dist-prod');
const demoFile = path.join(projectRoot, 'demo.html');

// À adapter selon ton URL worker
const BACKEND_URL = 'https://tranquille-vacances.esti-archi.workers.dev';

async function build() {
  try {
    console.log('📦 Build PRODUCTION...');
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    console.log(`📄 Copie de demo.html...`);
    let content = await fs.readFile(demoFile, 'utf-8');

    // Remplacer localhost par le worker en prod
    content = content.replace(
      /const API_URL = ['"]http:\/\/localhost:8787['"]/g,
      `const API_URL = '${BACKEND_URL}'`
    );

    await fs.writeFile(path.join(distDir, 'index.html'), content);

    const sizeKb = (content.length / 1024).toFixed(1);
    console.log(`\n✅ Fait!`);
    console.log(`📁 Fichier: ${path.join(distDir, 'index.html')}`);
    console.log(`   Taille: ${sizeKb} KB`);
    console.log(`   Backend: ${BACKEND_URL}`);
    console.log(`\n📤 Envoyer dist-prod/index.html via Filezilla vers /www/`);
    console.log(`🔗 Votre site: http://tranquilleonestenvacances.free.fr/`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

build();
