# 🚀 Démarrage rapide: Build + Déploiement FTP

## TL;DR (30 secondes)

```bash
# 1. Faire le build
cd frontend
npm run build

# 2. Ouvrir Filezilla
# 3. Connecter à ftpperso.free.fr
# 4. Envoyer dist/index.html vers /www/
# 5. Visite http://tranquilleonestenvacances.free.fr/ ✨
```

---

## Documentation complète

📄 **[DEPLOYMENT_FTP.md](DEPLOYMENT_FTP.md)** — Guide complet Filezilla (identifiants, config, troubleshoot)

📄 **[MIGRATION_VERCEL_TO_FTP.md](MIGRATION_VERCEL_TO_FTP.md)** — Contexte de migration & checklist

📄 **[DEPLOY_SCRIPT_OPTIONAL.md](DEPLOY_SCRIPT_OPTIONAL.md)** — Automatiser le FTP (optional)

---

## ✅ Checklist après migration

- [ ] `npm run build` crée bien `dist/index.html`
- [ ] Filezilla connecté à `ftpperso.free.fr`
- [ ] `dist/index.html` envoyé vers `/www/`
- [ ] http://tranquilleonestenvacances.free.fr/ charge correctement
- [ ] Les fonctionnalités marchent (articles, etc.)

---

## Fichiers modifiés

```
frontend/
  ├─ package.json          (ajout script "build")
  ├─ build.js             (nouveau: génère dist/)
  └─ proxy.js             (inchangé: dev seulement)

dist/
  └─ index.html           (généré à chaque build)

Docs/
  ├─ DEPLOYMENT_FTP.md             (nouveau)
  ├─ MIGRATION_VERCEL_TO_FTP.md    (nouveau)
  ├─ DEPLOY_SCRIPT_OPTIONAL.md     (nouveau)
  └─ QUICK_START_DEPLOYMENT.md     (ce fichier)
```

---

## Points clés

🌐 **Votre site**: http://tranquilleonestenvacances.free.fr/

🛠️ **Dev local**: Inchangé (`npm run dev` → localhost:3000)

📦 **Build**: Nouveau (`npm run build` → dist/index.html)

📤 **Déploiement**: Via Filezilla (manuel)

⚙️ **Backend API**: Automatiquement pointée vers `https://tranquilleonestenvacances.free.fr/api`

---

## Questions fréquentes

**Q: Où est mon site?**
R: http://tranquilleonestenvacances.free.fr/

**Q: Pourquoi plus Vercel?**
R: Vous voulez héberger gratuitement sur Free.fr

**Q: Qu'est-ce que Filezilla?**
R: Un gestionnaire FTP gratuit pour uploader des fichiers

**Q: Ça marche sur mobile?**
R: Oui, c'est du HTML statique responsive

**Q: Comment modifier le site?**
R: Éditer `demo.html` → `npm run build` → Filezilla upload
