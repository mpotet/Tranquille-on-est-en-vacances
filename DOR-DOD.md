# Definition of Ready / Definition of Done

Le blog est publié par une personne en voyage, souvent sur une connexion mauvaise
et loin de toute aide. Ces deux listes existent pour ça : **rien ne part en
production sans filet, et rien ne commence sans qu'on sache comment revenir en
arrière.**

Elles ne sont pas décoratives. La DoD est en partie automatisée (les TNR sont un
barrage bloquant dans `npm run deploy`), et la partie manuelle est cochée
explicitement dans le commit ou la PR.

---

## DoR — Definition of Ready

Un chantier ne démarre pas tant que ces points ne sont pas tranchés.

| # | Critère | Pourquoi |
|---|---|---|
| R1 | **Le besoin est formulé « je souhaite … afin de … »** | Sans le « afin de », on optimise une métrique au lieu de servir un lecteur. |
| R2 | **Le constat est mesuré, pas supposé** | « Les images sont lourdes » ne suffit pas ; il faut le poids réel, sur les vraies données. |
| R3 | **Le périmètre est explicite** — ce qui est inclus ET exclu | Évite qu'un lot d'images devienne une refonte de l'éditeur. |
| R4 | **Le retour arrière est décrit AVANT de commencer** | Sur des données de production irremplaçables, c'est la condition d'entrée. |
| R5 | **Le critère de succès est chiffré** | « Plus rapide » n'est pas vérifiable ; « −80 % de données » l'est. |
| R6 | **Le découpage en incréments livrables est posé** | Chaque incrément doit pouvoir s'arrêter là sans laisser le site à moitié migré. |
| R7 | **L'impact sur l'existant est identifié** | Quelles pages, quels articles, quels lecteurs sont touchés. |

---

## DoD — Definition of Done

Aucune montée de version sans **tous** ces points.

### Automatique (bloquant — `npm run deploy` s'arrête sinon)

| # | Critère | Vérifié par |
|---|---|---|
| D1 | La syntaxe de tous les fichiers worker est valide | Étape 1 du déploiement |
| D2 | **Les TNR passent à 100 %** | Étape 2 — barrage |
| D3 | Le nouveau comportement est **couvert par au moins un TNR** | Revue avant commit |
| D4 | Les styles compilent | Étape 3 |
| D5 | La version est figée depuis `package.json` | Étape 4 |

### Manuel (à cocher avant de déployer)

| # | Critère | Pourquoi |
|---|---|---|
| D6 | **Vérifié sur le site réel**, pas seulement en local | Le local ne reproduit ni le CDN, ni les vraies données. |
| D7 | **Aucune donnée perdue** — prouvé, pas supposé | Sur des photos de famille, « ça devrait aller » n'est pas un critère. |
| D8 | **Le retour arrière est testé**, pas seulement écrit | Un rollback jamais exécuté n'est pas un rollback. |
| D9 | **Le gain annoncé est mesuré après coup** | On compare la promesse au résultat réel. |
| D10 | Le commit explique **le pourquoi**, pas seulement le quoi | Le prochain lecteur, c'est nous dans six mois. |
| D11 | **Aucune régression visuelle** sur un article témoin | Une page qui charge mais s'affiche mal reste cassée. |
| D12 | La version de `package.json` est incrémentée si le comportement public change | Le pied de page affiche cette version. |

---

## Versionnage

`MAJEUR.MINEUR.CORRECTIF` — la version affichée dans l'infobulle du pied de page
vient de `package.json`.

- **CORRECTIF** (1.0.x) — correction sans changement visible de fonctionnement
- **MINEUR** (1.x.0) — nouvelle capacité, compatible avec l'existant
- **MAJEUR** (x.0.0) — rupture, ou refonte visible pour le lecteur

Un incrément = un commit qui laisse le site **dans un état cohérent et
déployable**. Jamais de commit « moitié migré ».
