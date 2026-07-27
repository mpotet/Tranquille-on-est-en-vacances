# 🚀 START HERE: Déploiement sur Free.fr

Vous avez migration votre frontend de **Vercel** vers **FTP Free.fr**.

## ⚡ 30 secondes pour être prêt

```bash
cd frontend
npm run build
```

✅ Voilà! Un fichier `dist/index.html` de 177 KB est créé.

Prochaine étape → Ouvrir **Filezilla** et envoyer ce fichier vers votre serveur Free.

---

## 📚 Où aller maintenant?

### Vous venez de lancer le build?
→ Lire **[DEPLOYMENT_FTP.md](DEPLOYMENT_FTP.md)**
(Guide complet Filezilla)

### Vous êtes perdu?
→ Lire **[DEPLOYMENT_DOCS_INDEX.md](DEPLOYMENT_DOCS_INDEX.md)**
(Index complet de tous les docs)

### Vous êtes impatient?
→ Lire **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)**
(La version très rapide)

---

## ✨ Ce qui a changé

| Avant (Vercel) | Après (FTP Free) |
|---|---|
| `git push` → auto-deploy | Build + Filezilla |
| Domain Vercel | http://tranquilleonestenvacances.free.fr/ |
| Pas de coût | Gratuit (inclus dans Free) |

---

## 🎯 Checklist rapide

- [ ] `npm run build` créé le fichier
- [ ] Filezilla connecté à `ftpperso.free.fr`
- [ ] `dist/index.html` uploadé vers `/www/`
- [ ] Site accessible sur http://tranquilleonestenvacances.free.fr/
- [ ] Fonctionnalités testées ✅

---

## 📦 Le fichier qui compte

```
dist/index.html (174 KB)
↓
Envoyer via Filezilla vers /www/
↓
Accessible à http://tranquilleonestenvacances.free.fr/
```

---

**Besoin d'aide?**
- Upload FTP → `DEPLOYMENT_FTP.md`
- Configuration API → `IMPORTANT_API_CONFIG.md`
- Automatisation → `DEPLOY_SCRIPT_OPTIONAL.md`
- Tout → `DEPLOYMENT_DOCS_INDEX.md`

**Bonne chance! 🚀**
