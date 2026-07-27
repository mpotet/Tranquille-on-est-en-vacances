# 🎯 Déploiement à la racine `/www/`

## Résumé rapide

Tu veux tout mettre à la racine du serveur Free, pas dans un sous-dossier. C'est bon, c'est maintenant possible!

### Fichiers générés

```
dist/
├─ index.html           (177 KB - Votre site complet)
├─ .htaccess            (1 KB - Redirections + cache + compression)
└─ .env.local.example   (104 B - Config exemple)
```

### Procédure

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **FTP** (Filezilla)
   - Connecter à `ftpperso.free.fr`
   - Naviguer dans `/www/`
   - Envoyer les 3 fichiers

3. **Résultat** (sur le serveur)
   ```
   /www/
   ├─ index.html         ✅
   ├─ .htaccess          ✅
   └─ .env.local.example (optionnel)
   ```

4. **Test**
   - Accéder à http://tranquilleonestenvacances.free.fr/
   - Tester les routes: `/voyage/paris`, `/admin/dashboard`, etc.
   - Tout doit fonctionner!

---

## Qu'est-ce que le `.htaccess`?

C'est un fichier magique qui:

✅ **Redirige les routes SPA vers `index.html`**
- URL: `/voyage/paris` → Fichier servi: `index.html`
- JavaScript prend le relais pour afficher la bonne page

✅ **Sécurise**
- Bloque l'accès à `.env.local`
- Bloque l'accès à `build.js`

✅ **Optimise**
- Cache les CSS/JS pendant 1 mois
- Compresse les fichiers avec GZIP

### Exemple

| L'utilisateur visite... | Le serveur sert... | Qui arrive au navigateur |
|---|---|---|
| `/` | `index.html` | Site chargé ✅ |
| `/voyages` | `index.html` | Site chargé, JS gère la page ✅ |
| `/voyage/maroc` | `index.html` | Site chargé, JS affiche le voyage ✅ |
| `/admin/dashboard` | `index.html` | Site chargé, JS affiche le dashboard ✅ |

**Sans `.htaccess**: Erreur 404 sur toutes les routes SPA! ❌

---

## Détails techniques

### Pourquoi ça marche?

Votre site `demo.html` est une **Single Page App (SPA)**:
- Un seul fichier HTML
- Tout est en JavaScript
- Gère les routes internes (pas d'appels au serveur)

### Comment le `.htaccess` le sait?

```apache
RewriteCond %{REQUEST_FILENAME} !-f     # Si ce n'est pas un fichier
RewriteCond %{REQUEST_FILENAME} !-d     # ET ce n'est pas un dossier
RewriteRule ^ index.html [QSA,L]        # → Sert index.html
```

**Traduction**: "Si l'utilisateur demande un chemin qui n'existe pas, sers-lui `index.html`"

---

## Checklist avant déploiement

- [ ] `npm run build` créé `dist/`
- [ ] `dist/` contient 3 fichiers:
  - [ ] `index.html` (174 KB)
  - [ ] `.htaccess` (1 KB)
  - [ ] `.env.local.example` (104 B)
- [ ] Filezilla connecté à `ftpperso.free.fr`
- [ ] Navigué dans `/www/`
- [ ] Les 3 fichiers envoyés en FTP
- [ ] Site accessible à http://tranquilleonestenvacances.free.fr/
- [ ] Routes fonctionnent (tester `/voyages`, `/voyage/...`)

---

## Troubleshooting

### "500 Internal Server Error"
- Le `.htaccess` a une erreur
- Supprimez le `.htaccess` et testez
- Si ça marche, c'est un problème du `.htaccess`
- Voir `HTACCESS_EXPLAINED.md` pour debug

### "Les routes affichent du HTML blanc"
- Le `.htaccess` redirige bien vers `index.html`
- Mais `index.html` ne charge pas bien
- Vérifier les URLs CDN (Tailwind, Google Fonts)
- Vérifier la console du navigateur (F12)

### "404 Not Found"
- Le `.htaccess` n'est pas appliqué
- Vérifier:
  - [ ] Le fichier s'appelle `.htaccess` (pas `.htaccess.txt`)
  - [ ] Il est dans `/www/` (racine, pas sous-dossier)
  - [ ] Permissions OK (généralement OK par défaut)

### "Les images/fonts ne chargent pas"
- C'est un problème de CDN, pas du `.htaccess`
- Vérifier:
  - [ ] URLs absolues dans le HTML
  - [ ] Connexion internet du serveur
  - [ ] CORS (si applicable)

---

## Documentation complète

- **[HTACCESS_EXPLAINED.md](HTACCESS_EXPLAINED.md)** — Explication ligne par ligne
- **[DEPLOYMENT_FTP.md](DEPLOYMENT_FTP.md)** — Guide Filezilla
- **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** — Version rapide

---

## ✨ C'est prêt!

```bash
npm run build && # → dist/ généré
# Filezilla → Upload à /www/
# http://tranquilleonestenvacances.free.fr/ → Fonctionne! 🎉
```

Bon déploiement! 🚀
