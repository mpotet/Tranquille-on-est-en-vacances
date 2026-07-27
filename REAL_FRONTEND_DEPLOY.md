# 🚀 Déploiement du vrai frontend en FTP

Tu as maintenant:
- **Backend**: Cloudflare Worker (données en DB)
- **Frontend**: HTML5 qui charge les données en temps réel via l'API

## Architecture

```
Frontend FTP (http://tranquilleonestenvacances.free.fr/)
         ↓
    (chaque page)
         ↓
Backend API (https://tranquille-vacances.esti-archi.workers.dev/)
         ↓
   Database D1
   Storage R2
```

## Workflow

### Build pour production
```bash
cd frontend
npm run build:prod
```

Génère `dist-prod/index.html` (8.6 KB):
- Charge les articles depuis l'API
- Charge les dossiers depuis l'API
- Rendu dynamique en JavaScript

### Déployer en FTP
```bash
# 1. Filezilla
# - Connecter: ftpperso.free.fr
# - Naviguer: /www/
# - Envoyer: dist-prod/index.html → index.html

# 2. Test
# Ouvrir: http://tranquilleonestenvacances.free.fr/
# Doit charger les VRAIS articles (pas des données en dur!)
```

## Ce que tu vois en production

- **Page d'accueil**: 3 derniers articles (depuis l'API)
- **Voyages**: Liste complète (depuis l'API)
- **Voyage detail**: Article avec contenu markdown rendu (depuis l'API)

## API endpoints utilisés

Le frontend appelle:
```
GET /api/articles           → Liste des articles
GET /api/folders            → Dossiers
GET /api/settings           → Configuration
```

Tous publics (pas d'auth nécessaire).

## Configuration

Pour changer l'URL du backend:
```javascript
// Dans frontend/frontend.html ligne ~195:
const API_BASE = 'https://tranquille-vacances.esti-archi.workers.dev';
```

Puis rebuild:
```bash
npm run build:prod
```

## Avantages

✅ Une seule source de données (la DB)
✅ Données toujours à jour en prod
✅ Frontend très léger (8.6 KB)
✅ Pas de maintenance double (demo.html)
✅ Scalable: ajouté des articles = automatiquement visibles

## Limitations actuelles

- Pas d'admin panel en FTP (admin reste sur le worker)
- Pas de formulaire de contact en FTP
- Pas de push notifications en FTP

Si besoin: créer une page `/admin` en FTP qui redirige vers le worker.

## Vérification

```bash
# Avant d'envoyer en FTP, test local
npm run build:prod

# Ouvrir dist-prod/index.html dans le navigateur
# Tester la connexion API (F12 → Network)
# Les appels doivent aller vers https://tranquille-vacances.esti-archi.workers.dev/
```

## Troubleshoot

### "Erreur CORS" en prod
Le worker doit autoriser les requêtes du frontend FTP.

À vérifier dans `backend/worker/index.js`:
```javascript
// Ajouter CORS headers:
res.headers.set('Access-Control-Allow-Origin', '*');
```

### "Articles ne chargent pas"
- Vérifier la console (F12)
- Vérifier que le worker répond: https://tranquille-vacances.esti-archi.workers.dev/api/articles
- Vérifier que la DB D1 est accessible

### "Page blanche"
- Vérifier la console (F12 → Console)
- Vérifier que les CDN (Tailwind, Google Fonts) chargent
- Vérifier que l'API répond

## C'est prêt!

```bash
npm run build:prod && # Build
# Filezilla upload
# http://tranquilleonestenvacances.free.fr/ 🚀
```
