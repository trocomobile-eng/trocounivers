# Troco — Design Upgrade

Statut : **Lots 1-2 livrés** · Lots 3-5 planifiés

Objectif : harmoniser l'identité visuelle de Troco à partir des 7 maquettes de référence (`untitled folder/`) et des findings de `TROCO_AUDIT.md`. Pas de régression de features. Architecture Firebase intacte.

---

## Principes directeurs (identité conservée)

- Logo Troco (texte + flèches boucle) utilisé sans modification.
- Palette **vert / turquoise doux** sur fond crème `#F6F9F8` à gradient subtil.
- Cartes blanches arrondies (rayon 20-24 px) avec ombres douces.
- Typographie Inter — titres `font-extrabold` tracking négatif.
- Esprit communautaire : avatars, badges, lieux, quartiers.
- BottomNav 5 slots avec bouton `+` central vert.

---

## Lot 1 — Design tokens, header unifié, BottomNav ✅

### Décisions

**Couleur primaire canonique : `#1ABEA3`** (teal/mint)
- Reprend l'identité turquoise.
- Correspond aux maquettes (pseudo `@`, chevrons de popup, CTA).
- Déprécie l'usage ad-hoc de `#22C58B` (vert feuille) pour les états actifs. Le vert `#22C58B` reste disponible comme accent secondaire (btn-primary dans l'ancien système, sera migré en Lot 2+).
- Palette d'accompagnement :
  - `--t-primary-600` `#108F7E` — texte actif, hover
  - `--t-primary-100` `#D1F3EA` — fond pill, badge
  - `--t-primary-50`  `#E6F9F3` — fond ultra-léger

### Fichiers modifiés

- `frontend/src/styles/index.css` → ajout tokens `--t-primary*` (additif, zéro suppression).
- `frontend/tailwind.config.js` → remplacement de la palette `troco.*` inutilisée (bleu/lime du prototype initial) par les tokens sémantiques du design system réel. Nouveau mapping :
  - `bg-troco-primary` / `text-troco-primary` / `text-troco-primary-600` / `bg-troco-primary-50`…
  - `text-troco-ink`, `text-troco-muted`, `text-troco-faint`
  - `rounded-troco-md`, `rounded-troco-lg`
  - `shadow-soft`, `shadow-card`, `shadow-strong`, `shadow-glow`
- `frontend/src/components/BottomNav.jsx` → migration des hex en dur vers classes Tailwind sémantiques :
  - Badge : `bg-troco-primary`
  - État actif : `bg-troco-primary/10 text-troco-primary-600`, icône `text-troco-primary`
  - Bouton `+` : `bg-troco-primary`
- `frontend/src/components/TrocoPageHeader.jsx` → aucun changement (variant `brand` déjà conforme : logo gauche + cloche + avatar).

### Validation

- `npm run build` ✅ (1 min 17 s, aucun warning nouveau).
- Les anciens tokens `--t-green` / `--t-teal` et classes legacy (`--troco-accent`, `.btn-primary`) sont **préservés** → aucune page n'est cassée.

### Non fait (volontaire)

- Pas de migration en masse des `#22C58B` / `#1ABEA3` en dur dans les autres composants : à faire au fil des Lots 2-5 pour éviter un diff géant non-testable.
- `src/index.css` (ancien fichier tokens parallèle) non touché — à consolider en Lot 5 avec déprécation propre.

---

## Lot 2 — Explorer (liste + carte) ✅

Cibles : maquette 1 (liste) et maquette 7 (carte).

### Fait

- **MobileFeedPage**
  - Barre de recherche : placeholder `Rechercher un objet, une personne…`, classes `border-troco-border text-troco-ink placeholder:text-troco-faint`.
  - Chips catégories : inchangées (CategoryPills déjà pill scrollable).
  - Toggle Liste/Carte : `bg-troco-primary-50` container, pill active = `bg-troco-primary text-white shadow-glow`.
  - `onBackToList` retiré de TrocoMap → doublon avec le toggle inline supprimé.
  - Tous les hex en dur (`#22C58B`, `#17212B`, `#6F7782`, `#E7ECEB`, `#F0FAF7`, `#F0F3F2`, `#94a3b8`) remplacés par classes sémantiques.
  - GuestFeedBanner, DistancePill, MobileItemCard, SocialProofBlock, pull-to-refresh, panneau filtres : migration complète.

- **DesktopFeedPage**
  - Nouveau composant `ViewModeToggle` pill Liste/Carte sorti du panneau filtres, placé inline à droite des catégories (toujours visible).
  - Panneau filtres ne contient plus que le réglage Distance.
  - Placeholder search aligné : `Rechercher un objet, une personne…`.
  - GuestFeedBanner, DesktopFilterPill, DesktopFeedCard, CarouselSection, header : migration hex → tokens.

- **TrocoMap**
  - PopupCard refondu : image gauche (64×64, `rounded-[18px] bg-troco-primary-50`), titre + location au centre, chevron rond teal (`bg-troco-primary shadow-glow`) à droite — carte entière cliquable.
  - Marker hover : halo renforcé `ring-4 rgba(26,190,163,0.35)`.
  - MapOverlay : bouton `☰ Liste` supprimé, badge compteur aligné à gauche uniquement, prop `onBackToList` retirée du composant.
  - Zoom controls et overlay migrés en tokens.

- Build : `npm run build` ✅ (59.58 s). Dev server smoke test HTTP 200 sur `/` et `/feed`.

---

## Lot 3 — Trocs + Messages ⏳

Cibles : maquettes 2 et 3.

### Trocs (`ExchangesPage`)
- Header : `TrocoPageHeader` variant brand + titre `Trocs` + sous-titre `Tes échanges en cours`.
- 3 tabs : `En cours · Propositions · Terminés`. Pill active teal.
- Carte échange : les deux objets côte à côte, icône swap (`Repeat2`) centrée teal, statut badge en pied + bouton `Voir`.

### Messages (`MessagesPage`)
- Liste de cartes blanches : avatar rond + deux miniatures d'objets (swap) + nom + dernier message + horodatage + état (lu/non-lu) + chevron.
- Fond bulles chat actuel conservé (pas de refonte du chat lui-même en Lot 3 — Lot 5).

---

## Lot 4 — Profil + Préférences + EditProfile ⏳

Cibles : maquettes 4, 5, 6.

### ProfilePage
- Photo plein cadre carré arrondi, `@pseudo` en teal `font-black`.
- 3 stats sous le pseudo : `Trocs · Note · Badges` (carte blanche, séparateurs verticaux).
- Deux CTAs côte à côte : `Modifier` (secondary) / `Déconnexion` (ghost rouge).

### Préférences
- 2 cartes « Je recherche » / « Je ne recherche pas ».
- Chips éditables avec `×` pour retirer, chip `+ Ajouter` en pointillé teal.
- Section `Activité récente` sous forme de timeline.

### EditProfilePage
- Header : flèche retour + eyebrow `PROFIL` + titre `Modifier mon profil`.
- Bloc photo (avatar large + bouton `Changer la photo`).
- Carte `INFORMATIONS` avec champs labellisés uppercase + inputs borderless soulignés.

---

## Lot 5 — Harmonisation autres pages ⏳

ItemDetail, AddItem, Favorites, Wishlist, UserProfile, ProposeExchange, Availability, ChoosePlace, MeetingConfirmed, Chat, Settings, Onboarding, Login, Signup.

Approche : passer `TrocoPageHeader variant="page"` partout, remplacer les hex en dur par classes Tailwind sémantiques, uniformiser rayons/ombres via `rounded-troco-*` et `shadow-*`.

En fin de Lot 5 : consolider `src/index.css` dans `src/styles/index.css` et supprimer le doublon (`P1-06` de l'audit).

---

## Convention à respecter (pour tous les Lots)

| Intention             | Classe Tailwind                                       |
|-----------------------|-------------------------------------------------------|
| Vert actif / CTA      | `bg-troco-primary`, `text-troco-primary`              |
| Hover / texte foncé   | `text-troco-primary-600`                              |
| Pill fond doux        | `bg-troco-primary-50`, `bg-troco-primary-100`         |
| Texte titre           | `text-troco-ink`                                      |
| Texte secondaire      | `text-troco-muted`                                    |
| Texte tertiaire       | `text-troco-faint`                                    |
| Fond page             | `bg-troco-bg` (ou laisser hériter du body)            |
| Carte                 | `rounded-troco-lg bg-white shadow-card`               |
| Carte proéminente     | `rounded-troco-lg bg-white shadow-strong`             |
| Rayon bouton          | `rounded-troco-md` (20 px)                            |
| Border douce          | `border border-troco-border`                          |

Interdit : nouveaux hex en dur `#1ABEA3` / `#22C58B` / `#17212B` / etc. dans le JSX. Utiliser les classes ci-dessus.

---

## Journal

- 2026-11-18 — Lot 1 livré (tokens + Tailwind + BottomNav). Build OK.
- 2026-11-21 — Lot 2 livré (MobileFeedPage, DesktopFeedPage, TrocoMap, ViewModeToggle extrait). Build OK, smoke test 200.
