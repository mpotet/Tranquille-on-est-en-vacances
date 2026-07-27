/**
 * Dev build: Copie demo.html avec localhost:8787 (pour npm run dev)
 * Utilise le backend local
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const distDir = path.join(projectRoot, 'dist');
const demoFile = path.join(projectRoot, 'demo.html');

async function build() {
  try {
    console.log('📦 Dev build (localhost:8787)...');
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    console.log('📄 Copie de demo.html...');
    let content = await fs.readFile(demoFile, 'utf-8');

    // S'assurer que localhost:8787 est bien configuré
    if (!content.includes("const API_URL = 'http://localhost:8787'")) {
      content = content.replace(
        /const API_URL = ['"][^'"]*['"]/g,
        "const API_URL = 'http://localhost:8787'"
      );
    }

    await fs.writeFile(path.join(distDir, 'index.html'), content);

    console.log('\n✅ Dev build prêt!');
    console.log(`📁 Fichier: ${path.join(distDir, 'index.html')}`);
    console.log(`   Backend: http://localhost:8787`);
    console.log('\n💡 Pour développer localement:');
    console.log('   1. Terminal 1: cd backend && npm run dev');
    console.log('   2. Terminal 2: cd frontend && npm run dev');
    console.log('   3. Ouvrir: http://localhost:3000');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

build();
