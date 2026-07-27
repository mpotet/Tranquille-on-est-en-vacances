# 📚 Index de la documentation de déploiement

Bienvenue! Vous avez migré votre frontend de Vercel vers FTP Free.fr. Voici l'arborescence complète.

## 🚀 Commencer ici

### Pour les pressés (30 sec)
👉 **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)**
- TL;DR: build + Filezilla + go
- Checklist post-migration
- FAQ rapide

---

## 📦 Pour faire le build

### `npm run build` – Qu'est-ce que ça fait?
Le script `frontend/build.js`:
1. Crée `dist/`
2. Copie `demo.html` → `dist/index.html` (177 KB)
3. Configure l'API pour la production

**Fichier**: `frontend/build.js`
**Résultat**: `dist/index.html` prêt pour upload

---

## 📤 Pour déployer avec Filezilla

👉 **[DEPLOYMENT_FTP.md](DEPLOYMENT_FTP.md)** — GUIDE COMPLET
- Obtenir les identifiants Free
- Configurer Filezilla
- Transférer les fichiers étape par étape
- Troubleshoot les problèmes
- Vérifier que tout marche

**C'est le document à lire si vous êtes perdu.**

---

## 🔄 Contexte et histoire

👉 **[MIGRATION_VERCEL_TO_FTP.md](MIGRATION_VERCEL_TO_FTP.md)**
- Avant/après (Vercel vs FTP)
- Commandes principales
- Configuration backend en prod
- Avantages/limites
- Améliorations futures possibles

---

## ⚙️ Configuration de l'API

👉 **[IMPORTANT_API_CONFIG.md](IMPORTANT_API_CONFIG.md)**
- État actuel (démo statique)
- Comment l'API fonctionne (ou pas)
- Intégration backend si vous le voulez
- CORS et configuration du serveur

**À lire si**: Vous avez une erreur CORS ou vous voulez les vraies données

---

## 🤖 Automatiser le déploiement (Optionnel)

👉 **[DEPLOY_SCRIPT_OPTIONAL.md](DEPLOY_SCRIPT_OPTIONAL.md)**
- Script Node.js avec `basic-ftp`
- GitHub Actions (CI/CD auto)
- Gestion des secrets FTP

**À lire si**: Vous trouvez Filezilla trop manuel

---

## 📋 Résumé complet

👉 **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)**
- Ce qui a été fait
- Checklist pré-lancement
- Fichiers modifiés
- Paramètres clés
- Troubleshoot rapide

---

## 🗂️ Fichiers du projet

### Modifiés
```
frontend/package.json       ajout: "build": "node build.js"
frontend/build.js          NOUVEAU: génère dist/
```

### Générés
```
dist/index.html            (177 KB, prêt pour FTP)
```

### Documentation (ce que vous lisez)
```
QUICK_START_DEPLOYMENT.md
DEPLOYMENT_FTP.md
MIGRATION_VERCEL_TO_FTP.md
IMPORTANT_API_CONFIG.md
DEPLOY_SCRIPT_OPTIONAL.md
DEPLOYMENT_SUMMARY.md
DEPLOYMENT_DOCS_INDEX.md (ce fichier)
```

---

## 🎯 Flux rapide pour déployer

```
1. cd frontend
2. npm run build
3. Ouvrir Filezilla
4. Connecter à ftpperso.free.fr
5. Envoyer dist/index.html vers /www/
6. Visiter http://tranquilleonestenvacances.free.fr/
7. Done! 🎉
```

---

## ❓ Je cherche...

| Je veux... | Voir... |
|-----------|---------|
| Démarrer maintenant | QUICK_START_DEPLOYMENT.md |
| Instructions Filezilla | DEPLOYMENT_FTP.md |
| Comprendre la migration | MIGRATION_VERCEL_TO_FTP.md |
| Fixer une erreur CORS | IMPORTANT_API_CONFIG.md |
| Automatiser les uploads | DEPLOY_SCRIPT_OPTIONAL.md |
| Vue d'ensemble du projet | DEPLOYMENT_SUMMARY.md |
| Parcourir la doc | Ce fichier! |

---

## 📞 Points de contact

**Si le site ne charge pas:**
→ `DEPLOYMENT_FTP.md` section Dépannage

**Si c'est blanc/vide:**
→ Vérifier que index.html est dans `/www/` (pas dans un sous-dossier)

**Si l'API ne marche pas:**
→ `IMPORTANT_API_CONFIG.md` section Configuration du backend

**Si les modifications ne s'affichent pas:**
→ Vider le cache (Ctrl+F5) et attendre quelques minutes

---

## ✨ Vous êtes prêt!

```bash
cd frontend && npm run build
# Puis Filezilla!
```

Bonne chance! 🚀
