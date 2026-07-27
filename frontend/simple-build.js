/**
 * Simple build: Copie demo.html → dist/index.html
 * Aucune modification, juste renommage
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
    console.log('📦 Création du répertoire dist...');
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    console.log('📄 Copie de demo.html → index.html (SANS MODIFICATIONS)...');
    const demoContent = await fs.readFile(demoFile, 'utf-8');
    await fs.writeFile(path.join(distDir, 'index.html'), demoContent);

    console.log('\n✅ Fait!');
    console.log(`📁 Fichier prêt: ${path.join(distDir, 'index.html')}`);
    console.log(`   Taille: ${(demoContent.length / 1024).toFixed(1)} KB`);
    console.log('\n📤 Prochaines étapes:');
    console.log('1. Ouvrir Filezilla');
    console.log('2. Connecter à ftpperso.free.fr');
    console.log('3. Naviguer dans /www/');
    console.log('4. Envoyer dist/index.html');
    console.log('\n🔗 Votre site: http://tranquilleonestenvacances.free.fr/');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

build();
