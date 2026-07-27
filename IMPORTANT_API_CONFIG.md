# ⚙️ Configuration API - Important à lire

## État actuel

Votre `demo.html` est une **démo statique** avec:
- ✅ Interface complète (HTML + CSS)
- ✅ Données d'exemple en dur (hardcodées)
- ✅ Zéro appel API en production

Si vous voulez **activer les appels API réels**, vous devez:
1. Modifier `demo.html` pour faire les `fetch()` vers votre backend
2. Ou créer un `index.html` qui importe les scripts JS (api.js, etc.)

---

## Architecture recommandée

### Option A: Rester en statique (Plus simple)
```
demo.html (174 KB) = fichier complet prêt à uploader
↓
Filezilla upload vers /www/
↓
Site fonctionne sans backend
```

**Avantage**: Rien à configurer, pas de dépendance API

**Inconvénient**: Données figées, pas de vraie interactivité

---

### Option B: Intégrer l'API (Recommandé pour production)
Créer un vrai système d'import:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div id="app"></div>
  <script type="module">
    import api from './api.js';
    import { App } from './app.js';
    
    async function init() {
      const settings = await api.getSettings();
      const articles = await api.getArticles();
      new App(settings, articles).render();
    }
    
    init().catch(err => console.error(err));
  </script>
</body>
</html>
```

**Avantage**: Données dynamiques, vrai backend

**Inconvénient**: Besoin du serveur backend en production

---

## Prochaines étapes

### Immédiatement (Déployer la démo)
```bash
cd frontend
npm run build
# Envoyer dist/index.html via Filezilla
```

### Plus tard (Si vous voulez l'API)
1. Vérifier que votre backend est accessible sur le domaine Free
2. Créer un vrai `index.html` qui charge les scripts JS
3. Tester les appels API en local d'abord
4. Redéployer via Filezilla

---

## Configuration du backend pour Free.fr

Si vous allez héberger aussi le backend sur Free:

```
Backend URL: https://api.tranquilleonestenvacances.free.fr/
Frontend URL: https://tranquilleonestenvacances.free.fr/
```

À configurer dans:
- `frontend/build.js` ligne `API_URL`
- CORS du backend (autoriser les requêtes from *.free.fr)

---

## Fichier de configuration actuel

`frontend/build.js` configure:
```javascript
const API_URL = 'https://tranquilleonestenvacances.free.fr/api'
```

Si votre backend n'est PAS sur ce domaine, modifier cette ligne avant le build.

---

## Questions ?

- **"Mon site montre une erreur CORS"** → Votre backend n'autorise pas les requêtes cross-origin
- **"Les articles ne se chargent pas"** → L'API n'est pas accessible (vérifier l'URL)
- **"Tout fonctionne mais les données ne changent pas"** → Vous êtes en mode statique, c'est normal
