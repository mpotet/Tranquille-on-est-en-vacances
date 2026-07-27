# 🚀 Guide de déploiement - Backend Cloudflare + Frontend FTP

Tu as:
- **Backend** sur Cloudflare Worker (`tranquille-vacances.esti-archi.workers.dev`)
- **Frontend** en FTP sur Free.fr (`tranquilleonestenvacances.free.fr`)

## 🔄 Workflow

### Pour développer localement

```bash
# Terminal 1: Lancer le backend Cloudflare local
cd backend
npm run dev
# → Worker sur http://localhost:8787

# Terminal 2: Lancer le frontend avec proxy
cd frontend
npm run dev
# → Frontend sur http://localhost:3000
# Appelle localhost:8787

# Ouvrir navigateur
http://localhost:3000
```

### Pour mettre en production

```bash
# Build avec l'URL du worker en production
cd frontend
npm run build:prod
# → Génère dist-prod/index.html
# → Configuré pour appeler https://tranquille-vacances.esti-archi.workers.dev

# Envoyer en FTP via Filezilla
# 1. Connecter: ftpperso.free.fr
# 2. Naviguer: /www/
# 3. Envoyer: dist-prod/index.html → index.html
# 4. Accessibilité: http://tranquilleonestenvacances.free.fr/

# Test
# Ouvrir http://tranquilleonestenvacances.free.fr/
# Doit appeler le backend Cloudflare en prod
```

---

## 📋 Fichiers générés

### `npm run build` (DEV)
```
dist/index.html
├─ Backend: http://localhost:8787 (local)
└─ Utilisation: npm run dev seulement
```

### `npm run build:prod` (PROD)
```
dist-prod/index.html
├─ Backend: https://tranquille-vacances.esti-archi.workers.dev (Cloudflare)
└─ À envoyer en FTP
```

---

## ⚙️ Configuration du backend

Ton worker Cloudflare est défini dans `backend/wrangler.toml`:

```toml
name = "tranquille-vacances"
# Production URL: https://tranquille-vacances.esti-archi.workers.dev

[env.production]
PUBLIC_URL = "https://tranquille-vacances.esti-archi.workers.dev"
```

### Mettre à jour l'URL du worker

Si tu changes l'URL (ex: domaine custom), modifier dans `frontend/build-prod.js`:

```javascript
const BACKEND_URL = 'https://ta-nouvelle-url.com';
```

---

## 🔧 Maintenance

### Le backend change?
```bash
# C'est automatique! Les appels API du frontend pointent toujours vers le worker
cd backend
npm run dev  # En local
wrangler publish  # En prod
```

### Le frontend change?
```bash
# Modifier demo.html
# Rebuilder
npm run build:prod
# Re-envoyer index.html en FTP
```

---

## 🚨 Dépannage

### "Erreur CORS" en prod
→ Le worker n'autorise pas les requêtes du frontend
→ Vérifier CORS dans `backend/worker/index.js`

```javascript
// Ajouter dans les headers:
'Access-Control-Allow-Origin': 'http://tranquilleonestenvacances.free.fr'
```

### "API non trouvée" (404)
→ Vérifier que l'URL du worker est correcte
→ `https://tranquille-vacances.esti-archi.workers.dev` (pas localhost!)

### "Le frontend marche pas en local"
→ S'assurer que le backend local tourne
```bash
cd backend && npm run dev
```

---

## ✅ Checklist avant production

- [ ] `npm run build:prod` exécuté sans erreur
- [ ] `dist-prod/index.html` généré (168 KB)
- [ ] Backend Cloudflare testé (`https://tranquille-vacances.esti-archi.workers.dev`)
- [ ] Filezilla: dist-prod/index.html envoyé vers `/www/`
- [ ] Frontend FTP accessible: http://tranquilleonestenvacances.free.fr/
- [ ] Les données chargent (appel API vers Cloudflare fonctionne)
- [ ] Console du navigateur: aucune erreur CORS

---

## 📞 Support

- Erreur backend: Voir `backend/` et logs Cloudflare
- Erreur frontend: Voir `frontend/` et console navigateur (F12)
- Erreur FTP: Voir `SIMPLE_DEPLOY.md`

Bonne chance! 🚀
