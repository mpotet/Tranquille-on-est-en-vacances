# 🚀 Déploiement simple - Juste le blog

C'est simple: tu copies `demo.html` et tu l'envoies en FTP. C'est tout.

## Étapes

### 1. Build (génère `dist/index.html`)
```bash
cd frontend
npm run build
```

### 2. Filezilla

**Connexion:**
- Hôte: `ftpperso.free.fr`
- User: `votrelogin.free.fr`
- Pass: Votre mot de passe FTP
- Port: `21`

**Destination:**
- Naviguer dans `/www/`

**Upload:**
- Prendre `dist/index.html`
- Glisser vers `/www/`
- Attendre la fin

### 3. Test

Ouvrir: http://tranquilleonestenvacances.free.fr/

✅ Doit afficher votre blog complet avec toutes les images et texte.

---

## C'est tout!

Pas de `.htaccess`, pas de complexité.

Si ça marche: parfait! 🎉

Si ça marche pas (erreur 500): 
→ Contacter Free support, il y a un problème serveur.

---

## Mettre à jour le site

1. Modifier `demo.html`
2. `npm run build`
3. Upload `dist/index.html` via Filezilla
4. Rafraîchir le site
