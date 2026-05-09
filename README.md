# 🌴 Tranquille, on est en vacances

> Le blog de voyage de la famille Potet — léger, moderne, et entièrement gratuit sur le tier Cloudflare.

---

## 🗂️ Structure du projet

```
.
├── demo.html                  # Démo statique single-file — testez l'UI sans serveur
├── index.html                 # Point d'entrée GitHub Pages (redirige vers demo.html)
├── schema.sql                 # Schéma de la base de données Cloudflare D1
├── wrangler.toml              # Configuration Cloudflare Workers
├── worker/
│   ├── index.js               # Point d'entrée principal du Worker (routeur)
│   ├── auth.js                # Authentification (session HMAC-SHA256, cookie HttpOnly)
│   ├── utils.js               # Helpers partagés (réponses JSON/HTML, match de routes)
│   ├── api/
│   │   ├── folders.js         # CRUD des dossiers
│   │   ├── articles.js        # CRUD des articles
│   │   └── photos.js          # Upload/suppression de photos (R2)
│   └── pages/
│       ├── shell.js           # Nav, footer, lightbox, toast (partagés)
│       ├── home.js            # Page d'accueil publique
│       └── admin.js           # Login, tableau de bord, éditeur d'articles
└── README.md
```

---

## 🎮 Tester la démo locale

**Aucune installation requise.**  Ouvrez simplement `demo.html` dans votre navigateur :

```bash
open demo.html
# ou double-cliquez sur le fichier dans votre explorateur
```

La démo inclut :
- ✅ Page d'accueil avec hero image et grille de voyages
- ✅ Page liste des voyages avec filtres par dossier
- ✅ Page détail avec galerie photos et lightbox
- ✅ Interface admin complète (login demo : n'importe quel mot de passe)
- ✅ Gestion des dossiers (CRUD)
- ✅ Éditeur visuel (WYSIWYG) avec mise en forme en direct
- ✅ Upload de photos simulé (FileReader)
- ✅ Responsive mobile-first

### Démo GitHub Pages

La publication GitHub Pages repose sur le workflow `.github/workflows/pages.yml`.

- `index.html` sert de point d'entrée à la racine du dépôt
- `demo.html` reste la démo single-file source
- le workflow publie `demo.html` comme page d'accueil Pages

---

## 🚀 Déploiement sur Cloudflare

### Prérequis

```bash
npm install -g wrangler
wrangler login
```

### Étape 1 — Créer la base D1

```bash
wrangler d1 create tranquille-vacances-db
```

Copiez le `database_id` affiché et remplacez `YOUR_D1_DATABASE_ID` dans `wrangler.toml`.

```bash
# Appliquer le schéma
wrangler d1 execute tranquille-vacances-db --file=schema.sql
```

### Étape 2 — Créer le bucket R2 pour les photos

```bash
wrangler r2 bucket create tranquille-vacances-photos
```

### Étape 3 — Configurer les secrets

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

### Étape 4 — Mettre à jour wrangler.toml

```toml
[vars]
PUBLIC_URL = "https://tranquille-vacances.YOUR_SUBDOMAIN.workers.dev"

[[d1_databases]]
binding      = "DB"
database_name = "tranquille-vacances-db"
database_id  = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← votre ID

[[r2_buckets]]
binding     = "PHOTOS"
bucket_name = "tranquille-vacances-photos"
```

### Étape 5 — Déployer

```bash
wrangler deploy
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

## 🔧 Développement local

```bash
# Lancer en mode développement (D1 local + R2 local simulés)
wrangler dev --local

# Ou se connecter aux services Cloudflare en remote
wrangler dev --remote
```

---

## 📝 Licence

Projet personnel — famille Potet. ✨
