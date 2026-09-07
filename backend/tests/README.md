# TNR — Tests de non-régression

## En deux lignes

```bash
npm run tnr          # campagne complète (~11 s)
npm run tnr:rapide   # sans le smoke HTTP (~1 s, pas besoin de wrangler)
```

`npm run deploy` et `npm run deploy:prod` les lancent automatiquement : **si un
test échoue, rien n'est mis en ligne.**

## La production n'est jamais touchée

C'est une contrainte de conception, pas une intention. Concrètement :

| Risque | Ce qui l'empêche |
|---|---|
| Écriture dans la vraie base D1 | `--local` partout, jamais `--remote` |
| Pollution de la base de dev | `--persist-to .wrangler/state-tnr`, état dédié, effacé à chaque campagne |
| Écriture dans le vrai R2 | Simulation locale de wrangler, aucun appel Cloudflare |
| Envoi d'e-mails à de vrais abonnés | Aucun test n'appelle les routes de notification |
| Conflit avec un `npm run dev` en cours | Port dédié 8799 (le dev utilise 8787) |
| Déploiement accidentel | Aucun test n'appelle `wrangler deploy` |

Les données de test (article « Jordanie TNR ») vivent dans une base SQLite
jetable, recréée puis supprimée à chaque exécution.

## Ce qui est couvert — 55 tests

**1. Rendu (33 tests)** — fonctions pures, aucune I/O.
- *Dédoublonnage* : photo re-collée fusionnée, casse/espaces ignorés, photos
  sans légende jamais confondues, ordre préservé.
- *Légendes parasites* : aucun `word image` en galerie, en corps d'article, en
  alt, en figcaption ou en lightbox.
- *Intégrité* : texte préservé, aucune image perdue, images cliquables, indices
  de lightbox alignés sur la galerie, légende écrite à la main conservée.
- *Sécurité* : `<script>`, `onerror`, `javascript:`, `<iframe>` neutralisés.
- *Robustesse* : contenu vide, `<figure>` non fermée, Markdown legacy, URL à
  parenthèses (CanalBlog), article de 300 photos.

**2. Migration 011 (11 tests)** — SQLite en mémoire.
- L'ordre `DELETE` puis `UPDATE` est vérifié explicitement : c'est le point
  critique, la légende étant la seule preuve qu'une photo est un doublon.
- Photos sans légende conservées, articles cloisonnés, idempotence.

**3. Smoke HTTP (11 tests)** — worker réellement démarré.
- Accueil, liste des voyages, page d'article, version imprimable, 404, admin
  protégé, API JSON.
- Couvre le risque « page blanche » que les tests unitaires ne voient pas.

## Un bug réel trouvé par ces tests

Le smoke HTTP a révélé une fuite que la correction initiale avait manquée : la
liste `window.photos`, envoyée au navigateur pour la visionneuse plein écran,
transportait encore les légendes. Elles avaient disparu des vignettes et du
corps de l'article, mais **réapparaissaient en plein écran**. Corrigé dans
[`worker/index.js`](../worker/index.js), et verrouillé par une assertion dédiée.

## Quand un TNR échoue

Le message dit quel test, quelle phase, ce qui était attendu et ce qui a été
obtenu. Deux réflexes :

1. **C'est une vraie régression** → corriger le code, pas le test.
2. **Le comportement a changé volontairement** → mettre à jour le test *et* son
   commentaire expliquant pourquoi.

Ne jamais relâcher une assertion pour « faire passer » : ces tests décrivent des
bugs qui ont réellement atteint le site.

## Déployer sans les TNR

`npm run deploy:force` existe, exige de taper `OUI` en majuscules, et marque la
sortie comme non vérifiée. À réserver à une urgence réelle — un correctif à
pousser depuis la route quand les tests sont cassés pour une raison sans rapport.
