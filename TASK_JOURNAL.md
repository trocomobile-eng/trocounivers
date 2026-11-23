# Task Journal

## 2026-10-05 - Feed public Troco

### Fait
- Analyse de `https://www.troco.app/feed` via HTML live, rendu Chrome et code React.
- Remplacement des noms/adresses de cafés réels par des lieux fictifs dans les données et fallbacks UI.
- Remplacement des lieux réels proposés dans le chat par des points simulés.
- Correction du strip communautés : les communautés sans compteur affichent `Bientôt` au lieu de `membres` seul.
- Ajout d'un bandeau invité sur le feed desktop et mobile pour expliquer l'action attendue.
- Réorganisation du feed : `Tous les objets` remonte avant les sections favoris/communautés.
- Vérification avec `npm run build` : build OK.

### À décider
- Anonymiser ou nettoyer les objets/noms réels dans Firestore si le feed reste public.
- Choisir la stratégie SEO pour `/feed` :
  - `noindex` si c'est une page app.
  - Prerender/SSR si la page doit être indexable.

### Notes
- Les données Firestore live n'ont pas été modifiées.
- La configuration SEO globale n'a pas été changée.
