/**
 * frontend/build.js
 * Prépare les fichiers pour le déploiement FTP sur Free.fr
 *
 * Usage: npm run build
 * Sortie: ../dist/ (à envoyer via Filezilla)
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

    console.log('📄 Copie de demo.html...');
    const demoContent = await fs.readFile(demoFile, 'utf-8');

    // Remplacer les URLs du backend pour pointer vers le domaine Free
    // En production, utiliser une URL absolue pour le backend
    const updatedContent = demoContent.replace(
      /const API_URL = ['"`]http:\/\/localhost:8787['"`]/g,
      "const API_URL = 'https://tranquilleonestenvacances.free.fr/api'"
    );

    await fs.writeFile(path.join(distDir, 'index.html'), updatedContent);

    console.log('📋 Copie du fichier .htaccess...');
    const htaccessFile = path.join(__dirname, '.htaccess');
    const htaccessContent = await fs.readFile(htaccessFile, 'utf-8');
    await fs.writeFile(path.join(distDir, '.htaccess'), htaccessContent);

    console.log('📋 Création du fichier .env.local pour la config...');
    const envContent = `# Configuration pour le déploiement Free.fr
VITE_API_URL=https://tranquilleonestenvacances.free.fr/api
`;
    await fs.writeFile(path.join(distDir, '.env.local.example'), envContent);

    console.log('\n✅ Build terminé!');
    console.log(`📁 Fichiers générés dans: ${distDir}`);
    console.log('\n📤 Prochaines étapes:');
    console.log('1. Ouvrir Filezilla');
    console.log('2. Connexion aux paramètres Free.fr');
    console.log('3. Parcourir vers: dist/');
    console.log('4. Envoyer index.html et autres fichiers en FTP');
    console.log('\n🔗 Votre site: http://tranquilleonestenvacances.free.fr/');

  } catch (error) {
    console.error('❌ Erreur lors du build:', error.message);
    process.exit(1);
  }
}

build();
