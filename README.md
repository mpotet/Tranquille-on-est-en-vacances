# 🌴 Tranquille, on est en vacances

> Le blog de voyage de la famille Potet - léger, moderne, et entièrement gratuit sur le tier Cloudflare.

---

## 🗂️ Structure du projet

Il n'y a pas de séparation front / back : un seul Worker Cloudflare rend les
pages HTML (publiques + admin) **et** sert l'API. Tout le site vit donc dans
`backend/` - le nom est historique.

```
.
├── package.json               # Raccourcis (tnr, deploy…) qui délèguent à backend/
├── backend/                   # LE site : Worker (pages + API), base, tests
│   ├── wrangler.toml          # Configuration Cloudflare Workers
│   ├── schema.sql             # Schéma de la base D1
│   ├── migrations/            # Migrations SQL successives
│   ├── dev.js                 # npm run dev : wrangler local + tunnel HTTPS
│   ├── public/                # Fichiers statiques (service worker, manifest, icônes, CSS)
│   ├── src/                   # Source Tailwind (compilée vers public/tailwind.css)
│   ├── scripts/               # Déploiement, migrations d'images, maintenance
│   ├── tests/                 # TNR (npm run tnr)
│   └── worker/
│       ├── index.js           # Point d'entrée du Worker (routeur)
│       ├── auth.js            # Authentification (session HMAC-SHA256, cookie HttpOnly)
│       ├── api/               # API REST (articles, dossiers, photos, commentaires…)
│       ├── helpers/           # Rendu HTML, sanitisation, jour par jour
│       └── pages/             # Pages rendues côté serveur (accueil, admin, éditeur…)
└── frontend/                  # PAS le front du site - outils annexes :
    ├── index.html             # Page qui redirige vers le site en production
    └── proxy.js               # Proxy de dev :3000 → Worker :8787 (accès depuis le réseau local)
```

---

## 🎮 Développer en local

```bash
cd backend
npm run dev        # Worker sur http://localhost:8787 + URL HTTPS *.trycloudflare.com (PWA, push)
```

Le site complet (pages publiques + admin + API) est servi par ce seul Worker.
Optionnel, pour l'ouvrir depuis un autre appareil du réseau local via le port 3000 :

```bash
cd frontend
npm run dev        # http://<ip-locale>:3000 → proxifie vers :8787
```

---

## 🚀 Déploiement sur Cloudflare

Toutes les commandes ci-dessous se lancent depuis `backend/`.

### Prérequis

```bash
npm install -g wrangler
wrangler login
```

### Étape 1 - Créer la base D1

```bash
wrangler d1 create tranquille-vacances-db
```

Copiez le `database_id` affiché et remplacez `YOUR_D1_DATABASE_ID` dans `wrangler.toml`.

```bash
# Appliquer le schéma
wrangler d1 execute tranquille-vacances-db --file=schema.sql
```

### Étape 2 - Créer le bucket R2 pour les photos

```bash
wrangler r2 bucket create tranquille-vacances-photos
```

### Étape 3 - Configurer les secrets

```bash
# Mot de passe admin du blog
wrangler secret put ADMIN_PASSWORD

# Clé secrète pour les tokens de session (chaîne aléatoire ≥ 32 caractères)
wrangler secret put SESSION_SECRET
```

Exemple pour générer un `SESSION_SECRET` :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Étape 4 - Mettre à jour wrangler.toml

```toml
[vars]
PUBLIC_URL = "https://tranquille-vacances.YOUR_SUBDOMAIN.workers.dev"

[[d1_databases]]
binding      = "DB"
database_name = "tranquille-vacances-db"
database_id  = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # < votre ID

[[r2_buckets]]
binding     = "PHOTOS"
bucket_name = "tranquille-vacances-photos"
```

### Étape 5 - Déployer

```bash
npm run deploy:prod   # TNR puis wrangler deploy --env production
```

Votre blog est maintenant accessible à `https://tranquille-vacances.YOUR_SUBDOMAIN.workers.dev`.

---

## 🔐 Interface Admin

Accédez à `/admin` et connectez-vous avec le mot de passe défini à l'étape 3.

**Fonctionnalités admin :**
- 📁 Gestion des dossiers avec arborescence illimitée
- 📝 Liste des articles avec statut (publié / brouillon)
- 🔄 Basculement rapide de statut (publier / dépublier)
- ✏️ Éditeur complet :
  - Titre, destination, date, description courte
  - Dates de voyage (début/fin) + journal quotidien (un résumé par jour)
  - Éditeur visuel de blog (sans Markdown obligatoire)
  - Upload multiple de photos avec glisser-déposer
  - Sélection du dossier
  - URL de couverture avec prévisualisation

---

## 🎨 Design

| Élément | Valeur |
|---------|--------|
| Police principale | Nunito (amicale, arrondie) |
| Police titres | Playfair Display (élégante) |
| Couleur principale | Bleu Majorelle `#0247FE` |
| Couleur accent | Orange brûlé (touches) `#C65A1E` |
| Fond | Blanc `#FFFFFF` |
| Framework CSS | Tailwind CSS (CDN) |

---

## 🏗️ Architecture technique

```
Client (navigateur)
    ↕ HTML + fetch('/api/*')
Cloudflare Worker (JavaScript)
    ↕ SQL                    ↕ Binaire (photos)
Cloudflare D1 (SQLite)    Cloudflare R2 (objets)
```

- **Worker** : route les requêtes, sert les pages HTML, gère l'auth et les API REST
- **D1** : stocke les métadonnées (dossiers, articles, références photos)
- **R2** : stocke les photos optimisées
- **Auth** : cookie HttpOnly signé HMAC-SHA256, durée 7 jours

### API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/folders` | Liste tous les dossiers |
| `POST` | `/api/folders` | Créer un dossier 🔒 |
| `PUT` | `/api/folders/:id` | Modifier un dossier 🔒 |
| `DELETE` | `/api/folders/:id` | Supprimer un dossier 🔒 |
| `GET` | `/api/articles` | Liste les articles (filtres: `status`, `folder`, `page`) |
| `GET` | `/api/articles/:slug` | Détail d'un article + photos |
| `POST` | `/api/articles` | Créer un article 🔒 |
| `PUT` | `/api/articles/:id` | Modifier un article 🔒 |
| `PATCH` | `/api/articles/:id/status` | Basculer publié/brouillon 🔒 |
| `DELETE` | `/api/articles/:id` | Supprimer un article 🔒 |
| `POST` | `/api/articles/:id/photos` | Upload photos (multipart) 🔒 |
| `DELETE` | `/api/photos/:id` | Supprimer une photo 🔒 |
| `PATCH` | `/api/photos/:id` | Modifier caption/ordre 🔒 |

🔒 = route protégée (session admin requise)

---

## 💡 Optimisation des photos

La démo simule un upload côté client. En production, vous pouvez ajouter une conversion WebP côté client avant l'upload via la Canvas API :

```javascript
async function toWebP(file, maxWidth = 1200, quality = 0.85) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = new OffscreenCanvas(img.width * scale, img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
}
```

---

## 📊 Limites du tier gratuit Cloudflare

| Service | Limite gratuite |
|---------|----------------|
| Workers | 100 000 req/jour |
| D1 | 5 millions lectures/jour, 100 000 écritures/jour |
| R2 | 10 Go stockage, 1 million requêtes/mois |

Pour un blog familial, ces limites sont très largement suffisantes.

---

## 📝 Licence

Projet personnel - famille Potet. ✨
