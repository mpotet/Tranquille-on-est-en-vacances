# 📤 Déploiement Frontend sur Free.fr via Filezilla

Ce guide explique comment déployer le frontend sur http://tranquilleonestenvacances.free.fr/

## ✅ Prérequis

- Filezilla installé ([www.filezilla-project.org](https://www.filezilla-project.org))
- Identifiants FTP Free (fournis avec votre compte Free)

## 🛠️ Étape 1: Créer le build

```bash
cd frontend
npm run build
```

Cela crée un dossier `dist/` contenant:
- `index.html` — Votre site complet (177 KB)
- `.htaccess` — Configuration serveur (redirections SPA)

## 🔌 Étape 2: Configurer Filezilla

### Obtenir vos identifiants Free

1. Aller sur https://subscribe.free.fr/login/
2. Connectez-vous avec vos identifiants Free
3. Aller dans **Gérer mes services** → **Freebox**
4. Trouver la section **FTP** pour récupérer:
   - **Adresse du serveur**: `ftpperso.free.fr`
   - **Identifiant**: Votre login Free (format: `login.free.fr`)
   - **Mot de passe**: Votre mot de passe FTP

### Ajouter une connexion dans Filezilla

1. **Fichier** → **Gestionnaire de sites**
2. Cliquer sur **Nouveau site**
3. Remplir les champs:
   - **Hôte**: `ftpperso.free.fr`
   - **Protocole**: `FTP`
   - **Port**: `21`
   - **Identifiant**: Votre login Free
   - **Mot de passe**: Votre mot de passe FTP
4. Cliquer sur **Connecter**

## 📂 Étape 2bis: Naviguer à la racine web

Une fois connecté:
- Vous êtes probablement dans `/`
- Double-cliquez sur le dossier `www` pour entrer dedans
- ✅ Vous êtes maintenant à la racine web (`/www/`)
- C'est ici que vous mettrez **TOUS les fichiers à la racine**

## 📤 Étape 3: Transférer les fichiers à la racine

### Accédez à la racine web (`/www/`)

1. **Panneau droit** (serveur FTP):
   - Si vous voyez d'autres dossiers/fichiers, effacez-les (optionnel)
   - Vous êtes dans `/www/` ✅

### Transfert depuis votre ordinateur

2. **Panneau gauche** (votre ordinateur):
   - Naviguer vers `dist/` (créé à l'étape 1)
   - Vous devriez voir:
     - `index.html` ← Le site principal
     - `.htaccess` ← Configuration redirections
     - `.env.local.example` ← Fichier config (optionnel)

3. **Envoyer à la racine**:
   - Sélectionner les 3 fichiers (`index.html`, `.htaccess`, `.env.local.example`)
   - Glisser-déposer vers le panneau droit (`/www/`)
   - ✅ Attendez que le transfert soit terminé

### Résultat attendu sur le serveur

```
/www/
├─ index.html          ← Votre site
├─ .htaccess           ← Redirections SPA
└─ .env.local.example  ← Config (optionnel)
```

**Important**: Les fichiers doivent être **directement** dans `/www/`, **pas** dans un sous-dossier!

## ✨ Étape 4: Vérifier le déploiement

1. Ouvrir un navigateur
2. Aller à: **http://tranquilleonestenvacances.free.fr/**
3. Vous devriez voir votre site

> 💡 **Astuce**: Les modifications FTP peuvent prendre quelques minutes avant d'être visibles. Si ça ne marche pas, essayez un rafraîchissement de cache (Ctrl+F5 ou Cmd+Shift+R).

## 🔒 Configuration du backend en production

Le fichier `build.js` configure automatiquement l'API pour pointer vers:
```
https://tranquilleonestenvacances.free.fr/api
```

Assurez-vous que votre backend est déployé sur le même domaine ou un domaine autorisé (CORS).

## 🔄 Mise à jour du site

À chaque modification du code:

```bash
cd frontend
npm run build
# Envoyer le contenu de `dist/` via Filezilla
```

## ⚠️ Dépannage

### "Impossible de se connecter"
- Vérifiez que l'identifiant et le mot de passe FTP sont corrects
- Vérifiez que vous utilisez `ftpperso.free.fr` (pas un autre serveur)

### "Le site est vide ou montre un texte brut"
- Assurez-vous d'être dans le dossier `/www/` sur le serveur FTP
- Vérifiez que `index.html` a bien été transféré

### "Les modifications ne s'affichent pas"
- Videz le cache du navigateur (Ctrl+F5 ou Cmd+Shift+R)
- Attendez quelques minutes (cache du serveur)
