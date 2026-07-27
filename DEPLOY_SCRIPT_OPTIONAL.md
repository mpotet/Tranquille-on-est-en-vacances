# 🤖 Script automatisé de déploiement FTP (Optionnel)

Si vous trouvez Filezilla trop manuel, voici comment automatiser le déploiement.

## Option A: Utiliser `basic-ftp` (Recommandé)

### Installation
```bash
npm install --save-dev basic-ftp
```

### Créer `frontend/deploy-ftp.js`
```javascript
import Client from 'basic-ftp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

async function deploy() {
  const client = new Client();

  try {
    console.log('🔌 Connexion FTP...');
    await client.access({
      host: 'ftpperso.free.fr',
      user: process.env.FTP_USER,      // À définir
      password: process.env.FTP_PASS,  // À définir
    });

    console.log('📂 Navigation vers /www/');
    await client.cd('/www');

    console.log('📤 Envoi de index.html...');
    await client.uploadFrom(
      fs.createReadStream(path.join(distDir, 'index.html')),
      'index.html'
    );

    console.log('✅ Déploiement terminé!');
    console.log('🌐 Site: http://tranquilleonestenvacances.free.fr/');

  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
```

### Ajouter dans `frontend/package.json`
```json
{
  "scripts": {
    "dev": "node proxy.js",
    "build": "node build.js",
    "deploy": "node deploy-ftp.js"
  }
}
```

### Configurer les variables d'env

**Créer `frontend/.env.local`** (ne pas committer!)
```
FTP_USER=votrelogin.free.fr
FTP_PASS=votremotdepasseftp
```

### Utiliser
```bash
cd frontend
npm run build
npm run deploy
```

---

## Option B: Utiliser GitHub Actions (CI/CD Avancé)

Si votre repo est sur GitHub, vous pouvez déployer automatiquement à chaque push.

### Créer `.github/workflows/deploy-ftp.yml`
```yaml
name: Deploy to FTP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build frontend
        working-directory: frontend
        run: npm run build

      - name: Deploy to FTP
        uses: milanmk/actions-file-deployer@master
        with:
          remote-url: ${{ secrets.FTP_HOST }}
          remote-user: ${{ secrets.FTP_USER }}
          remote-password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./frontend/dist/
          remote-dir: /www/
```

### Configurer les secrets GitHub
1. Aller dans **Settings** → **Secrets and variables** → **Actions**
2. Ajouter:
   - `FTP_HOST`: `ftpperso.free.fr`
   - `FTP_USER`: Votre login Free
   - `FTP_PASSWORD`: Votre mot de passe FTP

Ensuite, chaque push vers `main` déploiera automatiquement!

---

## ⚠️ Avertissement sur les secrets

**Ne jamais committer** vos identifiants FTP dans le code source!

Bonnes pratiques:
```bash
# ✅ Bien
export FTP_USER="mon_login"
export FTP_PASS="mon_mot_de_passe"
npm run deploy

# ❌ Mauvais
# Hardcoder les identifiants dans deploy-ftp.js
```

---

## Préférence recommandée

Pour un projet personnel: **Filezilla reste plus simple** (voir [DEPLOYMENT_FTP.md](DEPLOYMENT_FTP.md))

Pour une équipe ou du CI/CD: **GitHub Actions** (Option B)
