# 🔧 Troubleshooting Free.fr

## Erreur: "500 Internal Server Error"

### Cause
Le `.htaccess` contient des directives non supportées par Free.fr

### Solution

1. **Essayez la version simplifiée** (déjà en place)
   ```bash
   cd frontend
   npm run build
   # Envoyer dist/.htaccess via Filezilla
   ```

2. **Si ça ne marche toujours pas**: Supprimez le `.htaccess`
   ```
   Filezilla → Clic droit sur .htaccess → Supprimer
   ```

3. **Test sans `.htaccess`**
   - Accéder à http://tranquilleonestenvacances.free.fr/
   - ✅ Si ça marche: Le site charge au moins
   - Mais les routes SPA ne fonctionnent pas

---

## Erreur: "404 Not Found" sur les routes

### Symptômes
- `http://tranquilleonestenvacances.free.fr/` → Marche ✅
- `http://tranquilleonestenvacances.free.fr/voyages` → Erreur 404 ❌

### Causes possibles

| Cause | Solution |
|-------|----------|
| `.htaccess` non appliqué | S'assurer qu'il est dans `/www/` (racine) |
| `.htaccess` mal nommé | Vérifier: `.htaccess` (pas `.htaccess.txt`) |
| Mod_rewrite désactivé | Essayer version sans `.htaccess` |
| Permissions fichiers | Généralement OK, ne pas toucher |

### Steps de debug

1. **Vérifier que le `.htaccess` est présent**
   ```
   Filezilla → /www/ → Chercher `.htaccess`
   ```
   Si absent: Re-envoyer depuis `dist/`

2. **Vérifier le nom exact**
   ```
   Windows: .htaccess (pas .htaccess.txt)
   Filezilla: Affichage → Afficher les fichiers cachés
   ```

3. **Vérifier les permissions**
   ```
   Filezilla → Clic droit → Permissions
   → Doit être: 644 ou 644 (owner: rw, group: r, public: r)
   ```

4. **Tester sans `.htaccess`**
   ```
   Filezilla → Supprimer .htaccess
   Rafraîchir le site
   ```
   - Si c'est un 404: Le `.htaccess` était le problème
   - Si c'est blanc: C'est un problème de chargement du site

---

## Erreur: "Le site est blanc ou ne charge pas"

### Symptômes
- Page blanche
- Pas de contenu
- Pas d'erreur visible

### Debug

1. **Ouvrir la console du navigateur** (F12 ou Ctrl+Shift+I)
   - Onglet **Console**
   - Y a-t-il des erreurs en rouge?

2. **Erreurs courantes**

   **❌ "Failed to fetch from CDN"**
   - Tailwind CSS n'arrive pas à charger
   - Cause: Connexion internet du serveur bloquée
   - Solution: Contact Free support

   **❌ "Uncaught SyntaxError"**
   - Erreur dans le JavaScript
   - Cause: Encodage du fichier (UTF-8 requis)
   - Solution: Re-télécharger `index.html`

   **❌ "CORS error"**
   - API backend bloquée
   - Cause: CORS pas configuré
   - Solution: Voir `IMPORTANT_API_CONFIG.md`

3. **Vérifier le code source**
   - Ctrl+U pour voir le source
   - Doit commencer par `<!DOCTYPE html>`
   - Doit contenir le CSS Tailwind
   - Doit avoir le code JavaScript

---

## Erreur: "Les images/fonts ne chargent pas"

### Cause
Les URLs CDN (Google Fonts, Tailwind, Phosphor Icons) ne chargent pas

### Debug

1. **Ouvrir la console** (F12)
   - Onglet **Network**
   - Chercher les requêtes en rouge (erreurs)

2. **Vérifier les URLs**
   ```
   CDN attendus:
   - https://cdn.tailwindcss.com
   - https://fonts.googleapis.com
   - https://unpkg.com/@phosphor-icons/web
   - https://cdn.jsdelivr.net/npm/marked
   ```

3. **Solutions**
   - ✅ Vérifier la connexion internet
   - ✅ Vérifier que Free n'a pas bloqué les CDN externes
   - ✅ Attendre quelques minutes (cache)
   - ✅ Vider le cache navigateur (Ctrl+F5)

---

## Erreur: "Permissions denied"

### Symptôme
Filezilla affiche "Permission denied" lors de l'upload

### Solutions

1. **Vérifier que vous êtes dans `/www/`**
   ```
   Filezilla → Panneau droit → Doit afficher /www/
   ```

2. **Vérifier les permissions du dossier `/www/`**
   ```
   Filezilla → Clic droit sur www → Permissions
   → Doit être: 755 (rwxr-xr-x)
   ```

3. **Réessayer l'upload**
   - Supprimer les anciens fichiers
   - Re-envoyer les nouveaux

---

## Erreur: "Connection refused"

### Symptôme
Filezilla ne peut pas se connecter à `ftpperso.free.fr`

### Solutions

1. **Vérifier les identifiants**
   ```
   Hôte: ftpperso.free.fr
   User: votrelogin.free.fr (pas juste "login"!)
   Pass: Votre mot de passe FTP
   Port: 21
   ```

2. **Vérifier la connexion internet**
   - Ping `ftpperso.free.fr`
   - Vérifier que le pare-feu ne bloque pas le port 21

3. **Essayer le port 22 (SFTP)**
   ```
   Si le port 21 ne marche pas
   Filezilla → Protocole: SFTP
   Port: 22
   ```

---

## Si rien ne marche

### Plan B: Contacter Free

Créer un ticket support Free:
```
Problème: "500 Internal Server Error sur mon hébergement"
Détails: "J'ai mis un fichier .htaccess avec RewriteEngine On,
          Free bloque peut-être mod_rewrite"
```

### Plan C: Version sans `.htaccess`

Si Free ne supporte vraiment pas `mod_rewrite`:

1. **Supprimer `.htaccess` via Filezilla**
2. **Envoyer juste `index.html`**
3. **Limiter à la racine** (pas de routes SPA)
   ```
   URL valide:  http://tranquilleonestenvacances.free.fr/
   URL invalide: http://tranquilleonestenvacances.free.fr/voyages
   ```

Les utilisateurs accèdent via la racine, JavaScript gère le reste.

---

## Vérification rapide

### Checklist

- [ ] `http://tranquilleonestenvacances.free.fr/` charge
- [ ] Contenu visible (pas blanc)
- [ ] Images chargent
- [ ] Fonts chargent
- [ ] Routes fonctionnent (`/voyages`, `/voyage/...`)
- [ ] Admin login accessible (`/admin`)

Si tous les ✅: **Vous êtes bon!** 🎉

---

## Logs serveur

Si vous avez accès aux logs (via le panel Free):
```
Gestionnaire de fichiers → Voir les erreurs
/var/log/apache2/error.log (si accessible)
```

Chercher:
```
mod_rewrite: RewriteRule parse error
[core:error] file does not exist
[core:notice] .htaccess not allowed here
```

Ces messages vous aideront à debug.

---

## Support

- **Free.fr docs**: https://support.free.fr/
- **Apache mod_rewrite**: https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html
- **Votre doc locale**: Voir `HTACCESS_EXPLAINED.md`
