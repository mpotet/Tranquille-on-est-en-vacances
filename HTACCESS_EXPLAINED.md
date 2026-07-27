# 📋 Explication du fichier `.htaccess`

## Qu'est-ce que c'est?

Le fichier `.htaccess` est un fichier de configuration Apache qui:
- Gère les redirections d'URL
- Configure le cache
- Compresse les fichiers
- Sécurise votre site

## Pourquoi on en a besoin?

Votre site est un **SPA (Single Page App)**:
- Un seul fichier `index.html`
- JavaScript gère les routes (pages)
- Problème: Si l'utilisateur rafraîchit sur `/voyage/paris`, le serveur cherche ce fichier
- Solution: `.htaccess` redirige toutes les URLs vers `index.html`

## Contenu du `.htaccess`

```apache
# Mode réécriture activé
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Bloque l'accès aux fichiers sensibles
RewriteRule ^\.env\.local$ - [F]
RewriteRule ^build\.js$ - [F]

# IMPORTANT: Redirige tout vers index.html (SPA routing)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# Cache des assets (CSS, JS, images)
ExpiresByType text/html "access plus 0 seconds"
ExpiresByType text/css "access plus 1 month"
ExpiresByType image/jpeg "access plus 1 month"

# Compression GZIP
AddOutputFilterByType DEFLATE text/html text/css application/javascript
```

## Ce qu'il fait ligne par ligne

| Ligne | Action | Raison |
|------|--------|--------|
| `RewriteEngine On` | Active les redirections | Nécessaire pour tout ce qui suit |
| Force HTTPS | Redirige HTTP → HTTPS | Sécurité + SEO |
| Bloque `.env.local` | Empêche accès au fichier config | Sécurité (pas laisser les secrets!) |
| **Redirige tout vers `index.html`** | **Route vers le bon fichier** | **ESSENTIEL pour SPA** |
| Cache 1 mois les CSS/JS | Télécharge moins souvent | Performance |
| Compression GZIP | Compresse les fichiers | Réduit la bande passante |

## L'élément clé pour votre SPA

```apache
RewriteCond %{REQUEST_FILENAME} !-f    # Si ce n'est pas un fichier
RewriteCond %{REQUEST_FILENAME} !-d    # Et ce n'est pas un dossier
RewriteRule ^ index.html [QSA,L]       # → Redirige vers index.html
```

### Exemple en action

| URL demandée | Fichier réel servi | Gestion |
|---|---|---|
| `/` | `index.html` | ✅ Fichier existe |
| `/voyage/paris` | `index.html` | ✅ `.htaccess` redirige |
| `/admin/dashboard` | `index.html` | ✅ `.htaccess` redirige |
| `/logo.png` | `logo.png` | ✅ C'est un fichier, pas redirigé |
| `/images/photo.jpg` | `images/photo.jpg` | ✅ C'est un dossier + fichier |

## Ça marche avec Free.fr?

✅ **OUI** — Apache + mod_rewrite sont supportés sur Free.fr

Si vous avez une erreur:
```
Internal Server Error (500)
```

Essayez une version plus simple (voir ci-dessous).

## Version simplifiée (si la version complète bugge)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

## Checklist

- [ ] Fichier `.htaccess` créé dans `dist/`
- [ ] Fichier transféré à la racine `/www/` (même dossier que `index.html`)
- [ ] Le fichier est bien nommé `.htaccess` (pas `.htaccess.txt`)
- [ ] Permissions OK (généralement pas besoin de changer)
- [ ] Test: Accéder à `/voyage/paris` → Ça charge le site (pas erreur 404)

## Troubleshoot

### "500 Internal Server Error"
- Le `.htaccess` a une erreur de syntaxe
- Solution: Supprimez le `.htaccess` et testez sans
- Puis ajoutez la version simplifiée ci-dessus

### "404 Not Found sur les routes SPA"
- Le `.htaccess` n'est pas appliqué
- Vérifier qu'il est bien dans `/www/` (racine)
- Vérifier le nom exact (`.htaccess`, pas `.htaccess.txt`)

### "Les fichiers CSS/JS ne chargent pas"
- C'est un problème de chemin, pas de `.htaccess`
- Les URLs CDN (Tailwind, Google Fonts) doivent charger depuis internet
- Vérifier la connexion internet du serveur

## Améliorations futures possibles

```apache
# Interdire les hotlinks d'images
RewriteCond %{HTTP_REFERER} !^https?://tranquilleonestenvacances\.free\.fr [NC]
RewriteCond %{REQUEST_FILENAME} \.(jpg|jpeg|png|gif)$ [NC]
RewriteRule ^ - [L]

# Bloquer les bots spammeurs
RewriteCond %{HTTP_USER_AGENT} (bot|crawler) [NC]
RewriteRule ^.* - [F]
```

## En résumé

Le `.htaccess` est **essentiel** pour que votre SPA fonctionne correctement. Il:
- ✅ Redirige les routes vers le bon fichier
- ✅ Sécurise les fichiers sensibles
- ✅ Optimise la performance (cache, compression)
- ✅ Force HTTPS

Sans lui, vos routes SPA retourneraient des erreurs 404! 🚀
