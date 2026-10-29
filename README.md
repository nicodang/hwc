# Happy Wednesday Club — animation de salon

Animation de 56 secondes, en boucle, pensée pour tourner sur un écran de stand.
C’est une page web statique (HTML, CSS, JS, aucune dépendance), hébergeable telle quelle sur GitHub Pages.

Le fil narratif : un enfant lit et rêve de Londres ; d’ici là, le Happy Wednesday Club lui offre ses mercredis en anglais.

Deux mises en page, choisies automatiquement selon l’orientation de l’écran : **paysage 1920 × 1080** (écran de salon, TV, tablette couchée) et **portrait 1080 × 1920** (smartphone, totem vertical). Le cadre est mis à l’échelle sans déformation. Les positions propres au portrait sont dans le bloc `.portrait` en fin de `styles.css` et dans les listes `PORTRAIT ? … : …` de `show.js`.

## Voir l’animation

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
python3 -m http.server 8000
```

puis aller sur http://localhost:8000. Touche **F** pour le plein écran.

| Touche | Action |
| --- | --- |
| Espace | Pause / lecture |
| ← → | Reculer / avancer d’une seconde |
| F | Plein écran |
| R | Reprendre au début |
| D | Afficher le minuteur et le nom de la scène |

Le curseur disparaît après deux secondes sans mouvement et l’écran est maintenu allumé quand le navigateur le permet.

## Publier sur GitHub Pages

1. Pousser le dépôt sur GitHub.
2. Dans *Settings → Pages*, choisir *Deploy from a branch*, branche `main`, dossier `/ (root)`.
3. L’animation est disponible sur `https://<compte>.github.io/<dépôt>/`.

Sur le stand, ouvrir cette adresse en mode kiosque, par exemple :

```bash
open -a "Google Chrome" --args --kiosk "https://<compte>.github.io/<dépôt>/"
```

## Organisation

- `index.html` — les éléments de chaque scène (les textes des activités se modifient directement ici).
- `styles.css` — mise en page paysage (1920 × 1080) puis portrait (1080 × 1920), couleurs, petites boucles (nuages, course, lecture, drapeau).
- `show.js` — la chronologie : chaque mouvement est une liste d’images clés en millisecondes.
- `assets/img/` — visuels prêts à l’emploi, produits à partir de `input/`.
- `assets/fonts/` — Fredoka et Nunito, embarquées pour ne dépendre d’aucun réseau.
- `tools/build_assets.py` — détourage des personnages, reconstruction de la skyline, QR code, logos.

## Scènes

| Temps | Scène |
| --- | --- |
| 0 – 6 s | Le rêve : le garçon lit, une bulle de pensée fait apparaître Londres |
| 6 – 13 s | Le titre : médaillon HWC, « Happy Wednesday Club », la fillette traverse en courant |
| 13 – 19 s | L’offre : immersion 100 % bilingue le mercredi, 3-11 ans, 9h-18h, forme pratique |
| 19 – 35 s | Les activités de la journée (grille 2 × 2, elles arrivent une par une et restent) : histoires et lecture, multisport, arts et graphismes, cours d’anglais avec une neurolinguiste |
| 35 – 40 s | Le déjeuner bilingue : repas convivial, repas sain avec l’équipe, immersion continue |
| 41 – 55 s | Inscriptions 2026-2027, site, QR code (affiché 13 s), écoles partenaires, infos stand |
| 55 – 56 s | Tout repart, la boucle recommence sans coupure |

La durée totale est la constante `T` en tête de `show.js` ; chaque scène est une liste d’images clés en millisecondes.

La ligne « Salon KIDS ETC · 5 & 6 décembre · Nantes » est propre à ce salon : elle se modifie ou se supprime dans `index.html` (`.cta__salon`).

## Régénérer les visuels

Si les fichiers de `input/` changent :

```bash
pip3 install --user pillow numpy scipy
python3 tools/build_assets.py
```
