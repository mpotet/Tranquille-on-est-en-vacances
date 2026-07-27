# 🚀 Migration Vercel → FTP Free.fr

## Résumé des changements

Vous avez migré votre frontend de **Vercel** à un hébergement **FTP sur Free.fr**.

### Avant (Vercel)
```
- Déploiement via Vercel (git push → auto-deploy)
- URL: vercel-domain.com
- Backend: Configuré comme variable d'env Vercel
```

### Après (FTP Free.fr)
```
- Déploiement manuel via Filezilla
- URL: http://tranquilleonestenvacances.free.fr/
- Backend: Configuré dans le script de build
```

## 🎯 Commandes principales

### Développement local (inchangé)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (proxy local)
cd frontend
npm run dev

# Votre site en dev: http://localhost:3000
```

### Build pour production
```bash
cd frontend
npm run build

# Génère: dist/index.html (174 KB)
```

### Déploiement
1. Exécuter `npm run build` (voir ci-dessus)
2. Ouvrir **Filezilla**
3. Se connecter à `ftpperso.free.fr` (voir [DEPLOYMENT_FTP.md](DEPLOYMENT_FTP.md))
4. Envoyer `dist/index.html` vers `/www/`

## ⚙️ Configuration du backend

### En développement
- API URL: `http://localhost:8787` (proxy.js)
- Configuré dans: `demo.html` (ligne ~2100)

### En production
- API URL: `https://tranquilleonestenvacances.free.fr/api`
- Configuré dans: `frontend/build.js`

**Important**: Assurez-vous que votre **backend est aussi accessible** sur ce domaine avec les bonnes permissions CORS.

## 📋 Checklist post-migration

- [ ] Test local avec `npm run dev`
- [ ] Test du build avec `npm run build`
- [ ] Vérifier que `dist/index.html` existe (174 KB)
- [ ] Filezilla: Connexion à `ftpperso.free.fr` OK
- [ ] Transfert de `dist/index.html` → `/www/`
- [ ] Accès à http://tranquilleonestenvacances.free.fr/ OK
- [ ] Test des fonctionnalités (articles, etc.)
- [ ] Vérifier que l'API backend répond

## 💡 Avantages et limites

### ✅ Avantages
- Coût quasi-nul (hébergement Free inclus)
- Contrôle total des fichiers via Filezilla
- Pas de dépendance Vercel

### ⚠️ Limites
- Déploiement manuel (pas d'auto-deploy git)
- Hébergement statique uniquement (pas de serverless)
- Besoin de Filezilla pour chaque update

## 🔮 Améliorations futures possibles

- [ ] Script automatisé pour FTP (Node.js + `basic-ftp` package)
- [ ] CI/CD pipeline (GitHub Actions → FTP automatique)
- [ ] Compression/minification supplémentaire du HTML
- [ ] Cache-busting pour les mises à jour
