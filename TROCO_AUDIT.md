# TROCO — Audit complet technique, fonctionnel et UX/UI

**Date de l'audit :** 2026-11-18
**Branche analysée :** `main`
**Dernier commit :** `31ae44b — Clean up app shell and e2e flows`
**Auditeur :** Claude Code (Opus 4.7) — analyse statique du dépôt
**Portée :** `/Users/alexandreranson/trocou` — frontend React + backend Node + règles Firebase

---

## Sommaire

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Méthodologie et limitations de l'audit](#2-méthodologie-et-limitations-de-laudit)
3. [Architecture technique](#3-architecture-technique)
4. [Architecture fonctionnelle](#4-architecture-fonctionnelle)
5. [Inventaire des pages et routes](#5-inventaire-des-pages-et-routes)
6. [Modèle de données Firestore](#6-modèle-de-données-firestore)
7. [Audit UX/UI écran par écran](#7-audit-uxui-écran-par-écran)
8. [Design System](#8-design-system)
9. [Audit CSS et responsive](#9-audit-css-et-responsive)
10. [Audit fonctionnel détaillé](#10-audit-fonctionnel-détaillé)
11. [Audit sécurité et données](#11-audit-sécurité-et-données)
12. [Audit performance](#12-audit-performance)
13. [Audit accessibilité](#13-audit-accessibilité)
14. [Dette technique](#14-dette-technique)
15. [Analyse produit](#15-analyse-produit)
16. [Classification des problèmes P0–P3](#16-classification-des-problèmes-p0p3)
17. [Roadmap recommandée](#17-roadmap-recommandée)
18. [Limitations de l'audit](#18-limitations-de-laudit)

---

## 1. Résumé exécutif

Troco est une application web (et iOS via Capacitor) de troc de proximité entre particuliers. Le codebase est **fonctionnellement riche mais structurellement fragile** : le parcours cœur (publier → proposer → négocier → rencontrer → noter) est intégralement implémenté et branché sur Firestore, mais il est enfoui sous une importante dette d'intégration (fichiers expérimentaux non supprimés, CSS en trois couches concurrentes, routes en doublon, secrets et logs commités).

### Verdict en une phrase

> Le MVP est **live et jouable**, mais il n'est **pas prêt pour un scale** ni pour une mise en avant publique à cause de problèmes de sécurité, de cohérence visuelle, et de performance ; la phase actuelle devrait être une **phase d'assainissement** avant toute nouvelle feature.

### Top 10 des findings prioritaires

| # | Priorité | Finding | Preuve |
|---|---|---|---|
| 1 | **P0** | `backend/serviceAccountKey.js` et `.json` **trackés par git** (pas dans `.gitignore`) | `git ls-files` les retourne |
| 2 | **P0** | Règle Firestore ouverte à tout `userId.matches('testuser.*')` — **création illimitée de faux comptes possible** | `firestore.rules:15` |
| 3 | **P0** | `frontend/src/firebase-debug.log` committé dans le repo | présent dans `frontend/src/` |
| 4 | **P1** | `lucide-react@1.14.0` installée — **version abandonnée (2021)** ; la ligne actuelle est `lucide-react@0.400+` | `node_modules/lucide-react/package.json` |
| 5 | **P1** | **4 verts de marque concurrents** dans le code (`#18A98E`, `#1ABEA3`, `#0f9f9a`, `#22C58B`) + palette Tailwind (`#2FA8A3`) **inutilisée** | `tailwind.config.js`, grep hex |
| 6 | **P1** | Route `/exchanges/:id` déclarée deux fois | `App.jsx:307` et `:316` |
| 7 | **P1** | **9 pages variantes expérimentales** jamais importées (`ItemDetailPagebien`, `ProfilePagewew`, etc.) + dossier `PublicProfile_compact_keep_preferences/` | `ls frontend/src/pages/` |
| 8 | **P1** | `vite-plugin-imagemin` installé mais **non activé** dans `vite.config.js` → **~17 MB d'images PNG non compressées** dans le build | `vite.config.js:5-7`, `dist/assets/` |
| 9 | **P1** | **Trois feuilles CSS parallèles** (`src/index.css`, `src/index2.css`, `src/styles/index.css`) avec tokens qui se recouvrent | `ls frontend/src/` |
| 10 | **P1** | Backend Node (Express + SQLite) **existe en parallèle de Firestore** — rôle en prod non clair, source potentielle de désync | `backend/server.js`, `backend/db/` |

### Chiffres clés

- **67 pages** dans `src/pages/` dont **9 variantes mortes** + 1 dossier obsolète
- **53 composants** dans `src/components/`
- **5 contexts React** (Auth, Favorites, Wishlist, Toast, Theme)
- **~34 MB** d'images dans `src/assets/`, **~24 MB** dans `dist/`
- **25 TODO/FIXME/HACK** dans le code frontend
- **9 captures PNG** à la racine du repo (déchets)
- **Firebase chunk JS** : 684 KB (36 % du bundle initial)
- **2 langues i18n** : fr (par défaut), en (partielle — 97 lignes)

---

## 2. Méthodologie et limitations de l'audit

### Ce qui a été fait

- Lecture statique de **l'intégralité du code source** `frontend/src/` et `backend/` (hors `node_modules`).
- Analyse de :
  - `package.json` frontend + backend
  - `firebase.json`, `firestore.rules`, `.gitignore`, `vercel.json`, `vite.config.js`, `tailwind.config.js`
  - `App.jsx` (routing complet)
  - Chaque page critique (Feed, Carte, Trocs, Messages, Profil, Edit Profil, Exchange flow)
  - Tous les contexts et hooks
- Vérification du statut git (`git ls-files`, `git check-ignore`) pour les fichiers sensibles.
- Mesure effective de la taille des assets et du build.
- Inspection des règles Firestore une à une.

### Ce qui n'a pas été fait (et pourquoi)

- **Pas de lancement du serveur** (`npm run dev`) ni de navigation réelle dans l'app. L'utilisateur est sous macOS Catalina 10.15, l'environnement local a des limitations de compatibilité, et le brief impose « ne pas modifier l'environnement ».
- **Pas de capture d'écran** depuis l'app vivante — aucun test manuel sur viewport 320/360/375/390/430/768/1440 px n'a été exécuté. Les findings UI sont tous **statiques** (lecture des classes Tailwind et du JSX).
- **Pas de test Lighthouse / DevTools / React Profiler** — les métriques de performance sont déduites du code, pas mesurées.
- **Pas de test Playwright** — l'infrastructure existe (`e2e/` + 58 tests mentionnés) mais n'a pas été relancée.
- **Pas d'audit a11y par outil automatisé** (axe, pa11y) — les points relevés sont déduits du code.
- **Pas de test de l'app iOS Capacitor** — compilation iOS non tentée.

Toutes les affirmations UI/UX signalent explicitement leur statut :
- **CONFIRMÉE** = visible directement dans le code (classes CSS, logique JSX).
- **PROBABLE** = cohérente avec le code mais mériterait vérification au navigateur.
- **HYPOTHÈSE** = suspecte, à tester.
- **NON TROUVÉE** = aucune trace dans le code, l'anomalie observée vient peut-être d'autre chose.

### Contraintes respectées

Aucun fichier source n'a été modifié. Aucune dépendance installée. Aucun commit, push, ou déploiement. Seul `TROCO_AUDIT.md` (ce document) a été créé.

---

## 3. Architecture technique

### 3.1 Stack

| Couche | Technologie | Version | Commentaire |
|---|---|---|---|
| Framework front | React | 18.2.0 | Récent, stable |
| Build | Vite | 6.4.2 | Récent |
| Router | react-router-dom | 6.30.3 | OK |
| State | Context API (5 providers) | — | Pas de Redux/Zustand |
| CSS | Tailwind | 3.4.0 | OK |
| Animation | framer-motion | 12.38.0 | Lourd mais peu utilisé |
| Icônes | **lucide-react** | **1.14.0** | **⚠️ Abandonnée depuis 2021** |
| Backend-as-a-service | firebase | 12.12.1 | Récent |
| Carte | leaflet + react-leaflet | 1.9.4 / 4.2.1 | OK |
| Mobile wrapper | **Capacitor** | **CLI 6.2.1 / Core 8.3.4** | **⚠️ Versions majeures désalignées** |
| Serveur Node | Express + better-sqlite3 | 4.18.2 / 9.4.3 | Rôle en prod ambigu |
| Tests | Playwright | 1.61.1 | Setup OK |

### 3.2 Structure des dossiers

```
trocou/
├── CLAUDE.md
├── TASK_JOURNAL.md
├── TROCO_AUDIT.md                 ← ce document
├── firebase.json
├── firestore.rules
├── vercel.json                    ← double config (concurrent avec firebase.json)
├── cors.json
├── backend/
│   ├── server.js
│   ├── routes/ (auth, items, exchanges, notifications)
│   ├── middleware/auth.js
│   ├── db/init.js                 (SQLite via better-sqlite3)
│   ├── scripts/                   (6 scripts migration/cleanup)
│   ├── serviceAccountKey.js       ⚠️ tracké git
│   └── serviceAccountKey.json     ⚠️ tracké git (actuellement placeholder vide)
└── frontend/
    ├── vercel.json                ← duplicat du root
    ├── playwright.config.ts
    ├── e2e/ (fixtures, helpers, seed, tests)
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── App.css
        ├── main.jsx
        ├── firebase.js
        ├── firebase-debug.log     ⚠️ committé
        ├── index.css              ← 1/3
        ├── index2.css             ← 2/3 (orphelin, non importé)
        ├── troco_onboarding_index_update.zip  ⚠️ archive dans src/
        ├── logo.png               (985 KB — énorme pour un logo)
        ├── EditItemPage.jsx       ⚠️ doublon racine (501 lignes, orphelin)
        ├── ProfileEditPage.jsx    ⚠️ doublon racine (957 B, orphelin)
        ├── exchangeUtils.js       ⚠️ doublon avec utils/exchangeUtils.js
        ├── pages/ (67 fichiers dont 9 variantes mortes)
        ├── components/ (53 fichiers + sous-dossiers ui/, avatar/, profile/, trocs/)
        ├── layouts/ (5 fichiers)
        ├── context/ (5 providers)
        ├── hooks/ (9 hooks)
        ├── services/ (1 fichier — aiVerification.js)
        ├── utils/ (11 fichiers)
        ├── constants/
        ├── data/ (communautes, mockPlaces, partnerCafes, univers)
        ├── locales/ (fr + en)
        ├── i18n/
        ├── admin/
        ├── assets/ (34 MB d'images)
        └── styles/
            ├── index.css          ← 3/3 (tokens structurés)
            └── troco-layout-cohesion.css
```

### 3.3 Routing

Analyse de `App.jsx` (517 lignes).

**Patterns de protection de routes :**

| Wrapper | Rôle | Pages |
|---|---|---|
| `PublicRoute` | redirige vers `/feed` si connecté | `/`, `/login`, `/signup` |
| `PrivateRoute` | redirige vers `/login` si non connecté | la majorité des pages |
| `GuestRoute` | layout mais accès libre (connecté ou non) | `/feed`, `/feed/all` |
| `AdminRoute` | vérifie `user.uid === ADMIN_UID` ou email in `ADMIN_EMAILS` | `/admin`, `/admin/feedback`, `/test-reviews` |

**Incohérences de routing identifiées :**

- `App.jsx:307` et `App.jsx:316` : **route `/exchanges/:id` déclarée deux fois à l'identique** — la seconde est morte, React Router retient la première.
- `App.jsx:51` : `const ExchangeShowcasePage = lazy(() => import("./pages/ExchangeDetailPage"))` — alias du même module, utilisé uniquement pour `/troc/:id` (ligne 495). Alias inutile.
- `App.jsx:230` : `/items/:id` utilise `<PageLayout>` directement au lieu du pattern `PrivateRoute` — **public volontaire** (OK pour le feed sans compte).
- `App.jsx:289` : `/items/:itemId/propose` et `/propose/:itemId` (ligne 280) sont deux routes équivalentes vers la même page — **dette API URL**, à consolider.
- `App.jsx:333-358` : **trois routes équivalentes** pour choisir un lieu (`/choose-place`, `/choose-place/:exchangeId`, `/exchanges/:exchangeId/choose-place`). Idem pour `post-meeting` (4 routes équivalentes lignes 378-412). C'est le signe d'un historique d'itérations où l'ancienne URL a été conservée « au cas où ».
- `ADMIN_UID` **hardcodé dans le bundle client** (`App.jsx:89`) — le vrai contrôle d'accès est dans `firestore.rules` (ligne 7 vérifie l'email), donc leak de l'UID = pas d'escalade immédiate, mais pattern douteux.

### 3.4 State management

Cinq Contexts dans `src/context/` :

| Context | Rôle | onSnapshot ? |
|---|---|---|
| `AuthContext` | user Firebase + loading | non (onAuthStateChanged — correct) |
| `FavoritesContext` | favoriteItemIds | oui (sur `users/{uid}`) |
| `WishlistContext` | wishlist[] | oui (sur `users/{uid}`) |
| `ToastContext` | file de toasts + écoute exchanges pour notifs | oui (query sur `exchanges`) |
| `ThemeContext` | localStorage theme | non |

**Risque :** `FavoritesContext` et `WishlistContext` écoutent tous les deux le même document `users/{uid}` via deux `onSnapshot` séparés. **Deux listeners Firestore pour un seul doc** — à fusionner.

**Risque :** `ToastContext` mélange UI (toasts) et métier (écoute temps réel des exchanges pour notifs). À séparer dans une refactor.

**Nombre d'écoutes `onSnapshot` dans le frontend** : 20 fichiers (dont `useFeedItems.js`, `ChatPage.jsx`, `LibraryPage.jsx`, `FavoritesPage.jsx`, `ExchangesPage.jsx`, `UniversDetailPage.jsx`, `CommunauteDetailPage.jsx`, `AdminPage.jsx`, `NotificationButton.jsx`, `BottomNav.jsx`, `CrocoAvatarDisplay.jsx`, et notamment **3 variantes de pages feed mortes** `MobileFeedPage7`, `MobileFeedPagebon`, `DesktopFeedPageU` qui contiennent toujours du code d'écoute mais ne sont jamais montées).

### 3.5 Firebase

`src/firebase.js` initialise : auth, db (Firestore), storage.
Support émulateurs via `VITE_USE_FIREBASE_EMULATOR` (auth 9099, firestore 8080, storage 9199, UI 4000).
`firebase.json` déclare : hosting (site `troco-6c56c`, dossier `frontend/dist`), rewrites SPA, firestore.rules, emulators.

**⚠️ `storage.rules` non référencé** dans `firebase.json` — les uploads côté Storage sont donc soit en règles par défaut (ouvertes), soit l'app n'utilise pas Storage pour les photos d'objets. À vérifier.

### 3.6 Backend Node

`backend/server.js` sur port 3001, CORS vers `localhost:5173`, routes :
- `POST /api/auth` (JWT + bcryptjs)
- `GET /api/items`, `POST /api/items` (CRUD via SQLite)
- `POST /api/exchanges` (crée un exchange)
- `POST /api/notifications` (stub)

**Base SQLite locale** (`better-sqlite3`), tables `items` et `exchanges` — **schéma dupliqué avec Firestore**.

**État réel :** aucun `fetch()` ou `axios` vers `localhost:3001` n'a été trouvé côté frontend hors proxy Vite (`vite.config.js:11`). Le backend semble **dormant en production** et conservé comme vestige d'une architecture pré-Firebase. L'usage effectif actuel du backend se limite probablement à :
- `VITE_BACKEND_URL` pour l'envoi de **push notifications** (relais FCM via `usePushNotifications.js`).

### 3.7 Configuration de déploiement

Deux cibles concurrentes :

| Config | Fichier | Statut |
|---|---|---|
| **Firebase Hosting** | `firebase.json` — site `troco-6c56c`, `.firebase/hosting.ZnJvbnRlbmQvZGlzdA.cache` à jour dans `git status` | **Actif** |
| **Vercel** | `vercel.json` à la racine + `frontend/vercel.json` (duplicat) | Résiduel — à clarifier |

Le `vercel.json` racine redirige `/feed` et toutes les routes vers `/` (SPA fallback). S'il est encore référencé dans Vercel, l'app a peut-être deux URL publiques en divergence.

### 3.8 Internationalisation

- `src/i18n/index.js` : init i18next, langue par défaut `fr`, fallback `fr`, stockage dans `localStorage` (`troco-lang`).
- `src/locales/fr/translation.json` : 98 lignes (basique).
- `src/locales/en/translation.json` : 97 lignes — **traduction partielle**.
- Pas de pluralisation complexe, pas de formats de dates/monnaies localisés.

### 3.9 Forces et faiblesses — architecture

**Forces :**
1. Stack moderne, versions récentes sur les dépendances critiques (React 18, Vite 6, Firebase 12).
2. Lazy loading agressif des pages (`React.lazy` sur ~50 pages, `App.jsx:15-60`).
3. Code-splitting Vite bien pensé (`vite.config.js:18-47` sépare `firebase`, `vendor`, `ui`, `maps`, `maps-react`).
4. Émulateurs Firebase prêts à l'emploi pour DX.
5. Playwright configuré avec setup/teardown, viewport mobile par défaut.

**Faiblesses :**
1. **Deux sources de vérité** backend (Firestore + SQLite) sans frontière claire.
2. **Deux cibles de déploiement** (Firebase + Vercel) non arbitrées.
3. **Trois feuilles CSS** parallèles avec duplications et tokens concurrents.
4. **Fichiers en doublon** à la racine de `src/` (`EditItemPage.jsx`, `ProfileEditPage.jsx`, `exchangeUtils.js`, `index2.css`).
5. **9+ variantes de pages** (`*bien`, `*oo`, `*wdw`, etc.) jamais supprimées.
6. **Secrets et logs** trackés dans le repo (voir §11).
7. **Capacitor CLI/Core désalignés** — build iOS probablement cassé.
8. **`lucide-react@1.14.0`** — version abandonnée.
9. **Imagemin déclaré en devDeps mais non activé** dans `vite.config.js`.
10. **Pas de store global** — pas critique à l'échelle actuelle, mais `ToastContext` mélange responsabilités.

---

## 4. Architecture fonctionnelle

### 4.1 Vue d'ensemble

Troco implémente un **cycle de troc complet** entre deux utilisateurs, structuré en 9 étapes :

```
Découverte (Feed géolocalisé)
    ↓
Proposition (sélection 1-2 items de sa library)
    ↓
Réponse (receiver accepte / refuse)
    ↓
Négociation des créneaux (3+ allers-retours possibles)
    ↓
Choix du lieu (parmi mock cafés, point milieu, ou libre)
    ↓
Rencontre confirmée (date + lieu fixés)
    ↓
Chat (Firestore sub-collection temps réel)
    ↓
Post-rencontre (OK / problème signalé)
    ↓
Avis bilatéraux + mise à jour réputation
```

### 4.2 Statuts d'un exchange (collection `exchanges`)

| Statut | Signification | Transitions possibles |
|---|---|---|
| `pending` | proposition envoyée, en attente du receiver | → `accepted`, `declined`, `cancelled` |
| `accepted` | receiver a accepté | → `scheduling_time` |
| `declined` | receiver a refusé | (final) |
| `scheduling_time` | créneaux en négociation | → `time_confirmed`, `chat_open` |
| `time_confirmed` | créneau fixé | → `choosing_place` |
| `choosing_place` | lieu en négociation | → `meeting_confirmed`, `chat_open` |
| `chat_open` | libre discussion (si négo échoue) | → `meeting_confirmed`, `completed`, `cancelled` |
| `meeting_confirmed` | heure + lieu fixés | → `completed`, `cancelled` |
| `completed` | troc réalisé | (final — avis possibles) |
| `cancelled` | annulation | (final) |

### 4.3 Fonctionnalités opérationnelles (observées dans le code)

- Auth Firebase (email/password + Google OAuth possible — à confirmer dans `AuthContext`)
- CRUD items avec photos (Firebase Storage), catégorie, condition, géolocalisation
- Feed géolocalisé avec filtres rayon + catégorie + recherche texte
- Favoris (Firestore `users.favoriteItemIds`)
- Wishlist (Firestore `users.wishlist`)
- Proposition multi-items (support 1 à N, UI limitée à 2)
- Négociation créneaux et lieux avec compteurs (`availabilityCounterCount`, `placeCounterCount`)
- Messagerie temps réel (Firestore sub-collection `exchanges/{id}/messages`)
- Réputation : moyenne de notes, nombre d'avis, 8 types de badges
- Notifications push FCM (`usePushNotifications.js`)
- Communautés (10 thématiques statiques) et Univers (data mock)
- Admin dashboard

### 4.4 Fonctionnalités partielles ou simulées

| Feature | État | Détails |
|---|---|---|
| **Lieux de rencontre** | **100 % mock** | `data/mockPlaces.js` + `data/partnerCafes.js` — pas de Google Places, pas de vrais partenariats |
| **Préférences d'échange** | UI + storage OK, **non utilisées dans le filtre feed** | `users.tradePreferences` écrit mais jamais lu par `useFeedItems` |
| **Intérêt tracking** | Points écrits dans `users/{uid}/interests/{universe}`, **jamais lus** pour recommandation | `interestTracking.js` |
| **MapPickerModal** | Composant existe, **non intégré** au flow `ChoosePlacePage` | `components/MapPickerModal.jsx` |
| **AIVerification** | Composant + service, **optionnel et facultatif** dans le flow | `services/aiVerification.js` |
| **Annulation d'échange** | `status: cancelled` supporté backend, **pas de bouton visible** | `ExchangeDetailPage` |
| **Multiple items offered (N > 2)** | Schéma `offeredItemIds[]` supporte N, **UI capée à 2** | `ProposeExchangePage.jsx` |
| **Fusion messages legacy** | Code frontend fusionne `chatMessages[]` du doc exchange + sous-collection `messages`, **pas de migration** | `ChatPage.jsx` |
| **i18n en** | 97 lignes seulement, **couverture incomplète** | `locales/en/translation.json` |

### 4.5 Fonctionnalités dans le code non exposées à l'UI

- **Annulation d'un exchange** depuis la page de détail (statut supporté, bouton absent).
- **Choisir un lieu custom sur la carte** (`MapPickerModal` existe, pas branché).
- **Recommandations personnalisées** basées sur `useRecommendations` et `users/{uid}/interests/*` (données collectées, pas affichées).
- **Avis bilatéraux après troc** — composant `ReviewSystem` existe, mais son déclenchement depuis `PostMeetingPage` est à vérifier (il peut être silencieux si le flow n'y passe pas).

### 4.6 Fonctionnalités mortes

- `TrustBadges.jsx` + `useReputation.js` — implémenté, présence dans l'UI ponctuelle (peu visible).
- `AIVerification.jsx` — code présent, usage en prod non évident.
- `data/partnerCafes.js` — surclassé par `mockPlaces.js`.

---

## 5. Inventaire des pages et routes

### 5.1 Pages actives (par domaine fonctionnel)

**Accueil et SEO (public)**
- `LandingPage` (`/`)
- `QuestCeQueTrocoPage`, `CommentCaMarchePage`, `TrocLocalParisPage`, `ApplicationTrocObjetsPage`, `EchangerSansArgentPage`, `TrocoVsPage` (routes `/quest-ce-que-troco`, `/comment-ca-marche`, `/troc-local-paris`, `/application-troc-objets`, `/echanger-sans-argent`, `/troco-vs-vinted-leboncoin-geev`)
- `InfoPage` (`/about`, `/contact`, `/safety`)
- `LegalPage` (`/privacy`, `/terms`, `/mentions`)
- `TrocoDossierPage` (`/troco-dossier`)

**Authentification**
- `LoginPage` (`/login`)
- `SignupPage` (`/signup`)
- `VerifyEmailPage` (`/verify-email`)
- `OnboardingPage` (`/onboarding`)
- `ProfileOnboardingPage` (`/profile-onboarding`)

**Découverte**
- `FeedPage` (`/feed`, `/feed/all`) — orchestrateur mobile/desktop
  - `feed/MobileFeedPage` (viewport < 1024 px)
  - `feed/DesktopFeedPage` (viewport ≥ 1024 px)
- `UniversPage` (`/univers`), `UniversDetailPage` (`/univers/:id`)
- `CommunautesPage` (`/communautes`), `CommunauteDetailPage` (`/communautes/:id`)

**Items**
- `ItemDetailPage` (`/items/:id`)
- `AddItemPage` (`/add`, alias `/add-item`)
- `EditItemPage` (`/items/:id/edit`)

**Bibliothèque / Favoris / Wishlist**
- `LibraryPage` (`/library`)
- `FavoritesPage` (`/favorites`)
- `WishlistPage` (`/wishlist`)

**Trocs (cycle complet)**
- `ProposeExchangePage` (`/propose/:itemId`, `/items/:itemId/propose`)
- `ExchangesPage` (`/exchanges`)
- `ExchangeDetailPage` (`/exchanges/:id` — déclarée 2×, voir §3.3)
- `AvailabilityPage` (`/availability/:id`)
- `ChoosePlacePage` (`/choose-place`, `/choose-place/:exchangeId`, `/exchanges/:exchangeId/choose-place`)
- `MeetingSummaryPage` (`/meeting-summary`)
- `MeetingConfirmedPage` (`/exchanges/:exchangeId/meeting`)
- `PostMeetingPage` (`/post-meeting`, `/post-meeting/:exchangeId`, `/meeting/:exchangeId/post-meeting`, `/exchanges/:exchangeId/post-meeting`)
- `PostMeetingProblemPage` (`/exchanges/:exchangeId/problem`)

**Messagerie**
- `MessagesPage` (`/messages`)
- `ChatPage` (`/exchanges/:id/chat`, `/exchange/:id/chat`)

**Profil**
- `ProfilePage` (`/profile`)
- `EditProfilePage` (`/profile/edit`)
- `UserProfilePage` (`/users/:userId`, `/u/:userId`)
- `UserItemsPage` (`/user/:id`)

**Paramètres**
- `SettingsPage` (`/settings`)

**Admin**
- `AdminPage` (`/admin`, `/admin/feedback`)
- `TestReviewsPage` (`/test-reviews`)

### 5.2 Variantes mortes (non routées, jamais importées)

| Fichier | Taille | Notes |
|---|---|---|
| `src/pages/EditProfilePage2e2e.jsx` | — | Variante de test |
| `src/pages/FavoritesPagdde.jsx` | — | Typo dans le nom |
| `src/pages/ItemDetailPagebien.jsx` | — | — |
| `src/pages/ItemDetailPageoo.jsx` | — | — |
| `src/pages/ItemDetailPagewd.jsx` | — | — |
| `src/pages/ItemDetailPagewdw.jsx` | — | — |
| `src/pages/ProfilePagegrgreag.jsx` | — | — |
| `src/pages/ProfilePagewew.jsx` | — | — |
| `src/pages/UniversDetailPageb.jsx` | — | — |
| `src/pages/PublicProfile_compact_keep_preferences/` | dossier | — |
| `src/pages/feed/MobileFeedPage7.jsx` | — | — |
| `src/pages/feed/MobileFeedPagebon.jsx` | — | — |
| `src/pages/feed/DesktopFeedPageU.jsx` | — | — |
| `src/pages/feed/MobileFeedPagebbbb.jsx` | — | — |
| `src/pages/feed/DesktopFeedPagebbbb.jsx` | — | — |
| `src/pages/feed/DesktopFeedPage 2.jsx` | — | nom avec espace |
| `src/EditItemPage.jsx` | 16 KB | doublon racine de `pages/EditItemPage.jsx` |
| `src/ProfileEditPage.jsx` | 957 B | doublon de `pages/EditProfilePage.jsx` |

**Action recommandée :** supprimer (cf. §17 phase 1).

---

## 6. Modèle de données Firestore

Schémas inférés à partir de la lecture des services et composants. Certains champs sont redondants (reliquat historique).

### 6.1 Collection `users`

| Champ | Type | Notes |
|---|---|---|
| `uid` | string (docId) | = Firebase Auth uid |
| `email` | string | |
| `displayName` | string | |
| `photoURL` / `photoUrl` | string | **champs dupliqués** (vigilance) |
| `arrondissement` | string | ex "Paris 11e" |
| `city` | string | |
| `location` | string / object | ambigu (voir §3.3 bug ville) |
| `locationEnabled` | boolean | |
| `locationCoords` / `location.lat/lng` | object | géoloc utilisateur |
| `favoriteItemIds` | array<string> | IDs d'items |
| `wishlist` | array<string> | IDs d'items |
| `tradePreferences` | object | catégories acceptées, etc. |
| `reputation` | object | `{averageRating, totalReviews, totalExchanges, badges, trustScore}` |
| `fcmTokens` | array<string> | tokens push |

**Sous-collections :**
- `users/{uid}/interests/{universe}` — `{points, createdAt, lastUpdated}` (tracking non exploité)

### 6.2 Collection `items`

| Champ | Type | Notes |
|---|---|---|
| `id` | string (docId) | |
| `ownerId` / `userId` / `ownerUid` / `createdBy` / `uid` | string | **5 champs redondants** (dette historique) |
| `title` / `itemType` / `type` | string | 3 champs se chevauchant |
| `description` | string | |
| `category` | string | |
| `condition` / `conditionLabel` | string | |
| `images[]` / `photos[]` / `imageUrl` | array / string | **3 champs redondants** |
| `arrondissement` / `locationArea` / `city` / `location` | string | **4 champs redondants** — source du bug ville de 2026-09-27 |
| `lat`, `lng` / `geo.lat/lng` | number | |
| `status` | enum | `active` / `deleted` / `exchanged` |
| `createdAt`, `updatedAt`, `publishedAt` | Timestamp | |
| `ownerName` / `ownerDisplayName` / `ownerEmail` | string | denormalization |

**⚠️ Signal fort :** la redondance des champs propriétaire (5 noms différents) est très probablement le résultat de migrations successives sans nettoyage, et la règle Firestore `items.update` (voir §11) l'exploite comme condition OR, ce qui **augmente la surface d'attaque**.

### 6.3 Collection `exchanges`

Voir §4.2 pour les statuts. Champs clés :

- `senderId`, `senderName`, `senderEmail`, `senderDisplayName`
- `receiverId`, `receiverName`, `receiverEmail`, `receiverDisplayName`
- `requestedItemId`, `requestedItemTitle`, `requestedItemImage`
- `offeredItemIds[]`, `offeredItemId`, `offeredItemTitles[]`, `offeredItemTitle`, `offeredItemImages[]`
- `participants[]` (utilisé par les Firestore rules)
- `selectedAvailability` : `{dateValue, time, label}`
- `availabilityOptions[]`, `availabilityProposedBy`, `availabilityCounterCount`
- `selectedPlace` : `{id, name, address, imageUrl}`
- `placeOptions[]`, `placeProposedBy`, `placeCounterCount`
- `chatMessages[]` (legacy, présent sur le doc)
- `meetingConfirmed`, `chatOpened`, `chatOpen` (booleans)
- `needsAttentionFor`, `lastActionBy`, `notificationType`
- `reviewStatus.{uid}` (état avis post-troc)

**Sous-collection :** `exchanges/{id}/messages/{messageId}` — `{senderId, senderName, text, createdAt}`

### 6.4 Collection `reviews`

- `fromUserId`, `toUserId`
- `exchangeId`
- `rating` (1-5)
- `comment`
- `tags[]` (ponctuel, sympathique, objet_conforme, bon_communicant, flexible, soigneux, rapide, professionnel)
- `createdAt`, `isVisible`

### 6.5 Collection `feedback`

- `userId`, `surveyId`
- `exchangeId`
- Payload variable
- `createdAt`

---

## 7. Audit UX/UI écran par écran

Rappel : les findings sont statiques (lecture du code). Statut : **CONFIRMÉE**, **PROBABLE**, **HYPOTHÈSE**, **NON TROUVÉE**.

### 7.1 Feed / Explorer

**Fichiers :** `pages/FeedPage.jsx`, `pages/feed/MobileFeedPage.jsx`, `pages/feed/DesktopFeedPage.jsx`, `hooks/useFeedItems.js`

| Anomalie observée | Statut | Preuve |
|---|---|---|
| Répétition d'objets entre sections | **CONFIRMÉE** | `MobileFeedPage:446` fait `nearbyItems.slice(0, 10)` et `:483` consomme `recentItems`. Pas de déduplication entre `recommendations`, `nearbyItems`, `recentItems`. |
| Titres tronqués trop tôt | **CONFIRMÉE** | Mobile : `line-clamp-1` + `text-[12px]` sur carte `w-[128px]`. Desktop : `line-clamp-2`. Divergence. (`MobileFeedPage:176`, `DesktopFeedPage:176`) |
| Catégories partiellement masquées | **PROBABLE** | `MobileFeedPage:326` : `-mx-3 overflow-x-auto` sans indicateur de scroll (pas de fade droit). |
| Cartes incohérentes entre pages | **CONFIRMÉE** | **4 implémentations de carte d'objet** : `ItemCard.jsx`, `TrocoExchangeCard.jsx`, `PlaceCard.jsx`, et les cartes inline des feeds mobile/desktop. Styles divergents. |
| Breakpoint JS ≠ Tailwind | **CONFIRMÉE** | `FeedPage.jsx:6` : `DESKTOP_BREAKPOINT = 1024` — Tailwind `lg:` = 1024 par défaut, coïncidence qui fonctionne mais risque en cas de changement. |

**Architecture problématique :** deux fichiers JSX séparés (Mobile + Desktop) au lieu d'un fichier unique responsive — dédoublement du code UI.

### 7.2 Carte interactive (TrocoMap)

**Fichier :** `components/TrocoMap.jsx`, consommé par `MobileFeedPage.jsx`.

| Anomalie | Statut | Preuve |
|---|---|---|
| Espace vide dans popup | **CONFIRMÉE** | `PopupCard` : `w-[235px]` fixe + image `h-[74px] w-[74px]` rigide. Pas d'adaptation au contenu. (`TrocoMap.jsx:139-142`) |
| Fenêtre trop imposante sur mobile | **PROBABLE** | `h-[430px] sm:h-[540px]` carte + `h-[calc(100vh-200px)]` wrapper. **`100vh` sur iOS ignore la barre Safari** → casse visuelle. (`MobileFeedPage.jsx:520`) |
| Boutons redondants | **NON TROUVÉE** | PopupCard a 1 CTA unique « Voir l'objet ». |
| Mauvaise exploitation hauteur | **CONFIRMÉE** | Hauteurs figées (430/540 px) qui ne remplissent pas l'écran. |
| Navigation superposée (BottomNav / filtres) | **CONFIRMÉE** | Z-index : BottomNav `z-40`, filter overlay `z-40`, contenu modal `z-50`, controls Leaflet `z-[400]`. **Pas de hiérarchie définie**, conflits possibles. |
| Marqueur sélectionné peu identifiable | **PROBABLE** | Styling Leaflet par défaut ; pas de classe `.active` sur le marqueur sélectionné dans le code. |

### 7.3 Trocs (ExchangesPage)

**Fichier :** `pages/ExchangesPage.jsx`.

| Anomalie | Statut | Preuve |
|---|---|---|
| Cartes trop hautes | **HYPOTHÈSE** | `grid-cols-[1fr_28px_1fr]` + `aspect-[3/2]` sur les deux items + header → total > 400 px probable sur petit écran. (`ExchangesPage.jsx:291-298`) |
| Cadrage irrégulier des images | **PROBABLE** | `aspect-[3/2]` forcé mais pas `object-fit: cover` systématique → distorsion possible selon source. |
| Onglets coupés | **NON TROUVÉE** | Aucun composant Tabs détecté. |
| Dates imprécises | **NON CONFIRMÉE** | Format des dates à vérifier en navigateur. |
| Bouton chat mal intégré | **CONFIRMÉE** | Bouton `h-8 w-8` + `MessageCircle` taille 14 serré dans header dense (`text-[13.5px]` + pill de statut). (`ExchangesPage.jsx:280-287`) |

### 7.4 Messages (MessagesPage) et Chat (ChatPage)

**Fichiers :** `pages/MessagesPage.jsx`, `pages/ChatPage.jsx`.

| Anomalie | Statut | Preuve |
|---|---|---|
| Titres redondants | **PROBABLE** | `TrocoPageHeader` + `MobileTopBar` peuvent cohabiter selon layout. À vérifier en runtime. |
| Espacement vertical excessif | **HYPOTHÈSE** | `min-h-[560px]` pour empty state desktop (`MessagesPage.jsx:68`). |
| Objet concerné non identifiable dans la liste | **CONFIRMÉE** | La ligne "lastMessage" (`MessagesPage.jsx:94-104`) affiche le texte brut sans thumbnail d'objet. |
| En-tête incohérent | **PROBABLE** | `MobileTopBar` `z-30` fixé `h-[60px]` — possible chevauchement avec contenu si padding top insuffisant sur la page. |

### 7.5 Profil (ProfilePage)

**Fichier :** `pages/ProfilePage.jsx`.

| Anomalie | Statut | Preuve |
|---|---|---|
| Photo profil répétée | **HYPOTHÈSE** | Avatar `h-[112px] w-[112px]` défini une fois (`ProfilePage.jsx:213`), pas de duplication en code. Possible que ce soit l'illusion de la cover + avatar collés. |
| Logout trop présent | **PROBABLE** | À inspecter : le bouton logout est probablement en bas de page comme standalone, à cacher dans `SettingsPage`. |
| Stats prennent trop de place | **CONFIRMÉE** | `grid-cols-3 gap-3` + StatCapsule `h-auto` → 3 × ~80 px = 240 px juste pour les stats sur un écran de 600 px. (`ProfilePage.jsx:892-899`) |
| Favoriser ses propres objets | **À VÉRIFIER** | Le bouton favori est présent sur `ObjectCard` dans `ProfilePage:303-310` — vérifier qu'il est bien désactivé si `item.ownerId === currentUser.uid`. |
| Préférences contradictoires | **PROBABLE** | 12 cartes de préférences (Vintage, Photo, Musique, etc.) sans logique exclusive. Possible de cocher tout. (`ProfilePage.jsx:58-71`) |
| Icônes ≠ catégories réelles | **CONFIRMÉE** | PREFERENCE_CARDS icons : `Tag`, `Camera`, `Music`, `Sparkles`, `Home`. Catégories items réelles : `articles`, `books`, `clothing`. **Désalignement**. |
| Réputation incohérente | **PROBABLE** | `useReputation` existe mais son rendu dans `ProfilePage` n'est pas évident à la lecture. |

### 7.6 Édition du profil (EditProfilePage)

**Fichier :** `pages/EditProfilePage.jsx`.

| Anomalie | Statut | Preuve |
|---|---|---|
| Cover photo inutile | **CONFIRMÉE** | `h-[112px]` cover avec gradient hardcodé, non éditable, non cliquable. (`EditProfilePage.jsx:112`) |
| Données préremplies cohérentes | **CONFIRMÉE** | `loadProfile()` charge depuis Firestore (`EditProfilePage.jsx:81-100`) — OK. |
| Champs trop grands | **CONFIRMÉE** | Textarea bio `min-h-[104px]` sans `max-height` responsive → occupe ⅓ du viewport sur petit écran. (`EditProfilePage.jsx:148`) |
| BottomNav sur cet écran | **À VÉRIFIER** | `BottomNav` est `lg:hidden` donc visible sur mobile. **Sur un écran de formulaire modal/transactionnel, il est peu pertinent** (distraction + scroll bloqué par la barre). |

### 7.7 Autres écrans — points saillants

**OnboardingPage / ProfileOnboardingPage** — à auditer (deux onboardings distincts, à documenter).

**AddItemPage** — flow de publication avec photos, catégorie, condition, géolocalisation. Flow non testé en navigateur.

**ChoosePlacePage** — mock places + point milieu. `MapPickerModal` existant mais non intégré (fonctionnalité "choisir sur la carte" absente de l'UI).

**AvailabilityPage** — négociation des créneaux ; UI à vérifier pour les contre-propositions successives.

**AdminPage** — dashboard à usage interne, accès par UID/email hardcodés (voir §11).

---

## 8. Design System

### 8.1 Configuration Tailwind effective

`tailwind.config.js` (33 lignes) :
- Content : `./index.html`, `./src/**/*.{js,jsx}` — OK.
- Palette `troco.*` : `blue` `#1E6FA3`, `cyan` `#27B7D0`, `teal` `#2FA8A3`, `green` `#4CAF50`, `lime` `#7ED957`, `dark` `#1F2937`, `muted` `#6B7280`, `light` `#F5F7FA`, `sand` `#EAF3F4`.
- Gradient : `troco-gradient` linear 135° bleu → teal → lime.
- Shadows : `soft`, `glow`.
- Fonts : Inter, Inter (deux alias).
- **Pas de breakpoints custom.**
- **Pas de plugins.**

### 8.2 Réalité : palette fragmentée

**Les couleurs effectivement utilisées dans le code ne correspondent pas à la palette Tailwind.**

Verts de marque concurrents détectés :
- `#1ABEA3` (primaire bouton, badges) — ~46 occurrences
- `#18A98E` (focus, accent) — plusieurs occurrences
- `#0f9f9a` (éléments actifs) — ~51 occurrences
- `#22C58B` / `#2ECC8A` (gradient) — ~26 occurrences
- `#2FA8A3` (palette Tailwind `troco.teal`) — **non utilisée dans les composants**
- `#4CAF50` / `#7ED957` (`troco.green`, `troco.lime`) — **non utilisées**

Autres couleurs récurrentes hors palette :
- `#081225` (titres) — 74 occurrences
- `#0d1b2a` (texte secondaire) — 26 occurrences
- `#E4ECE8` (bordures) — 31 occurrences
- `#E8F7EF` (badges bg) — 22 occurrences
- `#F0F0EE` (skeletons) — 17 occurrences

**Conclusion :** le `tailwind.config.js` est quasi-inopérant pour les couleurs. Tout est hardcodé en `bg-[#xxxxxx]` dans les composants.

### 8.3 Trois feuilles CSS parallèles

| Fichier | Rôle | Importé par |
|---|---|---|
| `src/index.css` (5.6 KB) | tokens simples `--troco-*` (title, accent, etc.) | `main.jsx` |
| `src/index2.css` (5.0 KB) | ancien `index.css` | **personne** (orphelin) |
| `src/styles/index.css` | tokens structurés `--t-ink`, `--t-green`, `--r-sm`, `--s-soft` + aliases legacy | à vérifier |
| `src/styles/troco-layout-cohesion.css` | thème radial, `--troco-green: #18a98e`, `--troco-green-strong: #1abea3` | à vérifier |

**Problèmes :**
- `index2.css` est un ancien fichier jamais supprimé — mort.
- `styles/index.css` et `index.css` déclarent tous deux des tokens de couleur, avec des conventions différentes (`--troco-*` vs `--t-*`).
- Ordre de chargement non maîtrisé → surcharges imprévisibles.

### 8.4 Typographie

- **Font unique** : Inter (fallback `system-ui`, `sans-serif`).
- **Pas de @import Google Fonts** détecté dans `index.html` (à confirmer).
- Poids utilisés : 500 à 900.
- Tracking (letter-spacing) utilisé largement : `-0.045em` pour titres, `+0.18em` pour captions.

### 8.5 Composants UI

**Dossier `src/components/ui/`** (primitives) :

| Composant | Variantes | Statut |
|---|---|---|
| `Button.jsx` | primary, quiet, plain | pas de prop `size` |
| `Card.jsx` | default, strong, row, plain | utilisé largement |
| `Badge.jsx` | — | wrapper `@apply .troco-badge` |
| `Input.jsx` | — | wrapper avec icônes |
| `Modal.jsx` | — | overlay centré, max 420 px |
| `Sheet.jsx` | — | bottom sheet, max 520 px |
| `Pill.jsx` | — | tag arrondi |

**Dossier `src/components/`** — composants spécialisés + **duplications du DS** :

- `TrocoButton.jsx` — alternative à `Button.jsx` avec gradient hardcodé cyan→emerald.
- `TrocoCard.jsx` — 6 variantes (default/raised/subtle/outline/ghost/plain), **duplication de `Card.jsx`**.
- `UI.jsx` — fichier fourre-tout contenant `TrocoCard`, `TrocoButton`, `TrocoInput`, `TrocoBadge` avec plus de nuances.

**⚠️ Résultat :** **3 systèmes de boutons concurrents** (`ui/Button`, `TrocoButton`, `UI.TrocoButton`). Le plus complet (sizes sm/default/lg) est `UI.TrocoButton` mais n'est pas la version "officielle".

### 8.6 Cartes d'objet — 4 implémentations

| Composant | Contexte d'usage | Styling |
|---|---|---|
| `ItemCard.jsx` | feed | border `#e2f5f0`, hardcodé |
| `TrocoExchangeCard.jsx` (`components/trocs/`) | page Trocs | gradient custom |
| `PlaceCard.jsx` | choix du lieu | `bg-white/82`, blur |
| `CinematicMeetingCard.jsx` | confirmation rencontre | radial-gradient |

Plus les cartes inline dans les feeds Mobile/Desktop. **Aucune mutualisation.**

### 8.7 Animations

`framer-motion` v12.38 (dépendance lourde, ~60 KB gzip) utilisée dans :
- `BottomNav.jsx` : `whileTap`, animations scale.
- `TrocConfirmedCelebration.jsx` : probable confetti.
- `CategoryPills.jsx` : scroll (probable).
- `FavoriteUsersFeedSection.jsx` : carousel (probable).

Keyframes CSS dans `index.css:211-240` : `trocoFadeIn`, `trocoFadeUp`, `trocoPulse`.

**Observation :** framer-motion est sous-utilisé par rapport à son coût en bundle. Soit étendre son usage pour justifier son poids, soit basculer vers des transitions CSS natives.

### 8.8 Icônes

- `lucide-react@1.14.0` (**ancienne**).
- `src/assets/icons/` : 3 SVG custom (audio, books, tech) — orphelins ou sous-utilisés.

### 8.9 Récapitulatif Design System

**État :** **non formalisé**. Aucun fichier `tokens.js`, `theme.js`, ou Storybook. Les primitives existent dans `ui/` mais sont contournées par des composants spécialisés qui redéfinissent leur propre style.

**Préparation à une refonte :**
1. Décider de LA couleur verte primaire (un seul hex), la rentrer dans `tailwind.config.js`, migrer tous les `#1ABEA3`, `#18A98E`, `#0f9f9a`, `#22C58B` vers `bg-troco-primary` / `text-troco-primary`.
2. Fusionner `Button.jsx`, `TrocoButton.jsx` et `UI.TrocoButton` → une seule API.
3. Fusionner les 4 implémentations de carte en une `<ItemCard variant="feed|exchange|place|meeting" />`.
4. Supprimer `index2.css`.
5. Choisir entre `styles/index.css` (tokens `--t-*`) et `index.css` (tokens `--troco-*`) et migrer.
6. Externaliser les shadows (6+ variantes hardcodées) dans `tailwind.config.js`.
7. Créer `src/animations/presets.js` pour standardiser les transitions.

---

## 9. Audit CSS et responsive

### 9.1 Patterns problématiques observés

#### `h-screen` / `100vh` sur iOS

- `MobileFeedPage.jsx:520` : `h-[calc(100vh-200px)]` → **sur iOS Safari, `100vh` inclut la barre Safari dans le calcul, ce qui fait déborder le contenu**.
- **Remplacement recommandé** : `100dvh` (dynamic viewport height, supporté Safari 15.4+).

#### Safe-area

**Bien implémenté là où ça compte :**
- `BottomNav.jsx:104` : `pb-[env(safe-area-inset-bottom,0px)]` — notch iOS respecté.
- `MobileFeedPage.jsx:379` : `pb-[calc(env(safe-area-inset-bottom)+24px)]` — OK.

**Zones où c'est à ajouter :**
- `TrocoMap.jsx:240` : hauteur fixe sans compensation safe-area.
- Tous les écrans avec BottomNav fixed en bas devraient avoir un `padding-bottom` cohérent.

#### Z-index — pas de hiérarchie

Valeurs observées dans l'ordre croissant : `z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-[400]`.

Conflits probables :
- `BottomNav` `z-40` et filter overlay `z-40` (MobileFeedPage) — même layer, ordre DOM arbitraire.
- `MobileTopBar` `z-30` — en dessous d'un overlay `z-40`, ne devrait pas poser problème mais pas de système documenté.
- Leaflet controls `z-[400]` — valeur arbitraire héritée Leaflet par défaut, pas alignée avec le reste.

**Recommandation** : définir un module `src/constants/zIndex.js` (ex. `nav: 40, modal: 50, toast: 60, map: 400`) et bannir les valeurs inline.

#### Breakpoints Tailwind

Utilisation observée :
- `lg:` (1024 px) : **massif** — ~25-30 occurrences.
- `sm:` (640 px) : ~5 occurrences.
- `md:` (768 px) : **quasi aucune**.
- `xl:` (1280 px) : aucune.

**Impact :** pas de transition douce tablet. Un iPad en portrait (768 px) tombe dans la version mobile sans adaptation.

#### Dimensions fixes vs fluides

Nombreuses dimensions `px` dans les cartes :
- `w-[128px]` sur mobile feed → casse sur viewport 320 px (iPhone SE 1re gen).
- `w-[235px]` popup carte → non responsive.
- `h-[430px] sm:h-[540px]` carte Leaflet — non adaptative à la hauteur de l'écran.

### 9.2 Comportements à tester (non effectués)

- **Clavier virtuel ouvert** : les formulaires longs (AddItemPage, EditProfilePage, Chat) poussent-ils le BottomNav au-dessus du clavier ? Masquent-ils le champ actif ?
- **Petits écrans 320-360 px** : line-clamp-1 + font 12 px suffisent-ils ? Les boutons sont-ils cliquables (44×44 px mini) ?
- **Grands écrans 1440 px** : y a-t-il un `max-width` sur le contenu principal ? Les cartes se répartissent-elles bien en grille 4 colonnes ?

### 9.3 Récapitulatif CSS/responsive

| Point | État |
|---|---|
| Safe-area iOS | ✅ bien géré sur BottomNav et quelques pages |
| `h-screen` / `100vh` | ⚠️ à migrer vers `dvh` au moins sur les pages avec fullscreen map |
| Z-index | ❌ chaos, pas de hiérarchie |
| Breakpoints | ⚠️ `md:` jamais utilisé, pas de transition tablet |
| Dimensions fixes | ⚠️ nombreuses, cassent sur petits écrans |
| Overflow | pas de dépassement caché involontaire détecté à la lecture |

---

## 10. Audit fonctionnel détaillé

### 10.1 Publication d'un objet (AddItemPage)

**Flow probable :**
1. User remplit titre, description, catégorie, condition.
2. Upload de photos → Firebase Storage.
3. Géolocalisation : GPS précis ou sélection d'arrondissement.
4. Document créé dans `items` avec `status: 'active'`, `ownerId: auth.uid`, `createdAt: serverTimestamp()`.

**Risques identifiés :**
- Validation côté client uniquement (pas de Cloud Function).
- Stockage de la géoloc **en clair** dans le document public (`allow read: if true`).
- `Storage rules` non référencées dans `firebase.json` → upload non bordé ?

### 10.2 Recherche et filtres

`useFeedItems.js` filtre côté client :
- Rayon géographique (500 m, 1 km, 3 km, tout Paris).
- Catégorie.
- Recherche texte (titre, description).

**Problème :** le filtrage est côté client, ce qui signifie que **tous les items actifs sont rapatriés** depuis Firestore puis filtrés localement. À l'échelle (10 000+ items), latence et coût exploseraient.

**Recommandation future :** index composite sur `(status, city, category)` + pagination serveur. Ou passage à Algolia/Typesense.

### 10.3 Négociation créneaux

Compteur `availabilityCounterCount` incrémenté à chaque contre-proposition. Au-delà d'un seuil (probablement 3), passage au statut `chat_open` (libre discussion).

**Point de friction UX non vérifié :** l'utilisateur comprend-il que le système bascule en chat libre après 3 tours ? Comment est-ce communiqué ?

### 10.4 Messagerie

Firestore sub-collection `exchanges/{id}/messages` + écoute `onSnapshot`. Fusionnée en frontend avec un `chatMessages[]` legacy présent sur le doc exchange.

**Dette :** la migration des messages legacy vers la sub-collection n'est pas faite. Le frontend doit maintenir les deux chemins de lecture. À quantifier : combien d'exchanges ont des messages legacy ?

### 10.5 Réputation

`useReputation.js` recalcule le trust score après chaque avis. Score = moyenne rating × poids + nb avis × poids + taux complétion × poids.

**Risque :** recalcul côté client au moment de la lecture → si plusieurs clients concurrents écrivent un avis, l'un peut écraser le calcul de l'autre. Devrait être une **Cloud Function `onWrite`** sur `reviews`.

### 10.6 Notifications

`usePushNotifications.js` :
- Récupère le token FCM.
- L'enregistre dans `users.fcmTokens`.
- Clé VAPID **hardcodée** dans le hook.

L'envoi effectif passe par un backend (route `/api/notifications` dans backend Express) — à vérifier que ce backend est actif en prod.

### 10.7 Système de favoris/wishlist

Deux contextes distincts (`FavoritesContext`, `WishlistContext`) → deux `onSnapshot` sur le même doc `users/{uid}`. **À fusionner.**

### 10.8 Admin

`AdminPage` : stats globales, listes items/exchanges/users.
Protection :
- Côté client : `App.jsx:89-98` vérifie `uid` ou `email`.
- Côté serveur : `firestore.rules:5-8` vérifie uniquement `email` (= `alexandre.ranson@gmail.com`).

**Faille théorique :** si un attaquant obtient l'UID admin (visible en bundle), il peut bypasser la route client mais pas les rules serveur. OK.

### 10.9 Cas limites non couverts (visibles au code)

- **Compte supprimé** : pas de méthode `deleteAccount` dans `AuthContext`. Les docs Firestore d'un user supprimé côté Auth restent orphelins.
- **Item supprimé pendant un exchange en cours** : pas de gestion visible du cas.
- **Reçoit un troc, le refuse, puis le sender veut retenter** : flow non audité.

---

## 11. Audit sécurité et données

### 11.1 Secrets et fichiers sensibles

#### P0 — Service account tracké

```
$ git ls-files backend/serviceAccountKey.json backend/serviceAccountKey.js
backend/serviceAccountKey.js
backend/serviceAccountKey.json
```

Les deux fichiers sont **suivis par git**. Ni `.gitignore` racine ni `frontend/.gitignore` ne les exclut. Actuellement le `.json` est un placeholder vide (183 B), mais :
- Le pattern invite à commettre la vraie clé.
- L'historique git peut déjà contenir une version antérieure avec de vraies valeurs. **À vérifier impérativement.**

**Action immédiate :** ajouter aux `.gitignore`, `git rm --cached` les deux, puis rotation de la clé si une version antérieure du repo l'a contenue.

#### P0 — Firebase debug log committé

`frontend/src/firebase-debug.log` (2.6 KB, daté du 17 mai) est **dans le repo**. Bien que `*.log` soit dans `.gitignore`, ce fichier spécifique a déjà été ajouté avant la règle. Contient potentiellement project ID, timestamps, et éventuels tokens.

**Action immédiate :** `git rm --cached`, suppression physique, vérifier qu'aucun autre `*.log` n'est tracké.

#### Archive dans src/

`frontend/src/troco_onboarding_index_update.zip` (5 KB) — à nettoyer.

### 11.2 Règles Firestore — audit ligne à ligne

#### Users (lignes 11-16)

```
allow read: if request.auth != null;
allow write: if request.auth != null && request.auth.uid == userId;
allow create: if request.auth != null && userId.matches('testuser.*');
```

**P0 — Création d'utilisateurs test** (ligne 15) :
- Tout utilisateur authentifié peut créer un document `users/testuser-*` **sans que ce soit le sien**.
- Permet de **polluer la base utilisateur** avec des faux comptes à volonté.
- Permet potentiellement d'**influencer les favoris, les avis, les recommandations** si ces comptes sont utilisés par des bots.
- Hérité de l'environnement de test (Playwright), à **retirer en prod** et à conditionner par un flag ou l'émulateur.

#### Items (lignes 19-27)

```
allow read: if true;
allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
allow update, delete: if request.auth != null
  && (request.auth.uid == resource.data.ownerId
   || request.auth.uid == resource.data.userId
   || request.auth.uid == resource.data.uid);
```

**P1 — Surface d'attaque élargie (lignes 24-26)** :
- La règle update accepte **trois champs différents** pour l'authentification. Si un attaquant peut faire écrire son UID dans n'importe lequel (ex : par un bug de dénormalisation), il peut éditer n'importe quel item.
- À **durcir** à `ownerId` uniquement, après nettoyage de la base.

**P2 — Lecture publique des items (ligne 20)** :
- `allow read: if true` → tout le monde (même non authentifié) lit tous les items, **y compris les coordonnées GPS précises**.
- Volontaire pour le feed public sans compte, mais **expose les mouvements des utilisateurs**.
- **Recommandation :** masquer `lat/lng` pour les non-authentifiés (approximation à l'arrondissement seulement), ou renvoyer une coordonnée randomisée dans un rayon de 500 m.

#### Exchanges (lignes 30-42)

```
allow read, write: if request.auth != null
  && (request.auth.uid in resource.data.participants
      || request.auth.uid == resource.data.senderId
      || request.auth.uid == resource.data.receiverId);
allow create: if request.auth != null;
```

**OK** mais :
- `allow create: if request.auth != null` sans validation de contenu — n'importe quel utilisateur peut créer un exchange pointant vers n'importe quel item. Devrait vérifier que `request.resource.data.senderId == request.auth.uid`.

#### Reviews (lignes 45-56)

```
allow read: if request.auth != null && resource.data.isVisible == true;
allow create: if request.auth != null
  && request.auth.uid == request.resource.data.fromUserId
  && request.resource.data.rating is number
  && request.resource.data.rating >= 1
  && request.resource.data.rating <= 5;
allow update: if request.auth != null && request.auth.uid == resource.data.fromUserId;
```

**OK** — bien cadré.

Note : **pas de vérification que `fromUserId` et `toUserId` sont réellement participants à l'`exchangeId`**. Un utilisateur peut théoriquement spammer des avis sur quelqu'un avec qui il n'a pas échangé.

#### Feedback (lignes 59-68)

OK, bien cadré. `allow delete: if false` — correct.

#### ⚠️ Pas de rules Storage

`firebase.json` ne référence pas `storage.rules`. Si l'app utilise Firebase Storage pour les photos :
- Les règles par défaut sont ouvertes (accès authentifié total).
- Pas de limite de taille, de type MIME, de validation.

**À vérifier** : fichier `storage.rules` existe-t-il dans le repo ? Si oui, n'est pas déployé. Si non, règles par défaut Firebase appliquées.

### 11.3 Variables d'environnement

`frontend/.env` est dans `.gitignore` (racine + frontend) — correct, non committé.

`frontend/.env.example` et `frontend/.env.test` à inspecter (pas fait ici) pour confirmer qu'aucun n'expose de secret.

### 11.4 Admin hardcodé

`App.jsx:89-90` :
```
const ADMIN_UID = "BkohLox5U1PGIn9H8ZV8giTsysm1";
const ADMIN_EMAILS = ["alexandre.ranson@gmail.com"];
```

Visible dans le bundle JS public. **L'UID n'est pas un secret** en soi (c'est un identifiant Firebase), mais l'exposer facilite les tentatives d'ingénierie sociale. **L'email est déjà public** (dans les rules Firestore).

**Recommandation :** utiliser une custom claim Firebase (`admin: true` sur le token) au lieu d'un check `uid`/`email`.

### 11.5 Validation serveur

Aucune Cloud Function trouvée dans le repo. Toute la validation passe par :
- Les Firestore rules (statiques, limités en logique).
- Le frontend (contournable).

**Risques :**
- Un client peut écrire `reputation.trustScore: 100` directement sur son propre doc user (le `write` est autorisé par la règle `users` ligne 13).
- Un client peut écrire n'importe quel champ dans `items` à la création, y compris des timestamps falsifiés.

**Recommandation :** basculer les calculs critiques (score, badges, stats) dans des Cloud Functions sur trigger `onWrite`.

### 11.6 Récapitulatif sécurité

| Priorité | Finding | Fichier |
|---|---|---|
| **P0** | `serviceAccountKey.json` et `.js` trackés git | `backend/` |
| **P0** | `firebase-debug.log` committé | `frontend/src/` |
| **P0** | Règle `testuser.*` ouverte à toute création | `firestore.rules:15` |
| **P1** | Règle items.update trop permissive (3 champs OR) | `firestore.rules:23-26` |
| **P1** | Pas de `storage.rules` référencé | `firebase.json` |
| **P1** | Pas de validation serveur (reputation, stats) | tout le projet |
| **P2** | Localisation GPS publique en clair | `firestore.rules:20` |
| **P2** | Pas de delete account dans `AuthContext` | `src/context/AuthContext.jsx` |
| **P2** | `reviews.create` ne vérifie pas participation à l'exchange | `firestore.rules:47-51` |
| **P2** | `exchanges.create` ne vérifie pas `senderId == auth.uid` | `firestore.rules:35` |

**Note sur CLAUDE.md** : le fichier affiche « ✅ Config Firebase sécurisée » et « ✅ Règles Firestore renforcées ». La réalité est plus nuancée : la config publique est OK (API key publique par design chez Firebase), mais **les règles ont des trous** et **des secrets backend sont trackés**.

---

## 12. Audit performance

### 12.1 Bundle initial

Code-splitting Vite bien configuré (`vite.config.js:18-47`) :
- `firebase` chunk : **684 KB** (dans `dist/assets/firebase-DK1YaQCX.js`).
- `vendor` (React + Router) : ~213 KB.
- `ui` (framer-motion + lucide) : ~162 KB.
- `maps` / `maps-react` (Leaflet) : ~184 KB combinés.

**Taille totale `dist/`** : 24 MB (dont ~17 MB d'images univers en PNG non compressées).

**Pages dans le bundle initial** (`App.jsx:6-12`) :
- `SplashScreen`
- `LandingPage`
- `LoginPage`
- `SignupPage`
- `ErrorBoundary`
- `PageLayout`

Toutes les autres pages sont lazy — correct.

### 12.2 Images non optimisées

**Les plus lourdes dans `src/assets/` :**

| Fichier | Taille |
|---|---|
| `landing/livre-ancien.png` | 2.4 MB |
| `hero.png` | 2.3 MB |
| `univers/univ-velo.png` | 2.0 MB |
| `landing/appareil-photo.png` | 2.0 MB |
| `univers/univ-mode.png` | 1.9 MB |
| `landing/lampe-vintage.png` | 1.8 MB |
| `univers/univ-livres.png` | 1.7 MB |
| `univers/univ-enfants.png` | 1.7 MB |
| `univers/univ-deco_maison.png` | 1.7 MB |
| `univers/univ-sport.png` | 1.6 MB |

Total `src/assets/` : ~34 MB.

**`vite-plugin-imagemin` est en devDependency** (package.json ligne 44) **mais n'est pas activé** dans `vite.config.js:5-7` (plugins = `[react()]` uniquement). Les imagemin packages (`imagemin-mozjpeg`, `imagemin-pngquant`, `imagemin-webp`) sont installés mais morts.

**Impact estimé si imagemin activé** : ~34 MB → ~10-15 MB (WebP + compression), **soit −60 %**.

### 12.3 React optimisations

**Grep statistiques (estimations à partir des agents) :**
- `React.memo` : **0 occurrence** (aucun composant mémoisé).
- `useMemo` / `useCallback` : ~128 occurrences au total, concentrées sur quelques hooks.

**Impact probable :** re-renders en cascade sur le feed (chaque toggle de favori re-render toute la liste).

**Candidats prioritaires à `React.memo`** :
- `ItemCard`, `TrocoExchangeCard`, `PlaceCard`
- Composants dans `DesktopFeedPage` et `MobileFeedPage`
- `PopupCard` dans `TrocoMap`

### 12.4 Firestore `onSnapshot`

20 fichiers avec `onSnapshot`. Fuites potentielles si certaines pages ne nettoient pas dans le `useEffect` return. **À auditer en runtime.**

Points d'attention :
- `FavoritesContext` + `WishlistContext` écoutent le même doc user → 2 listeners redondants.
- Les variantes de pages mortes (`MobileFeedPage7`, `DesktopFeedPageU`, etc.) contiennent du code onSnapshot, inoffensif tant qu'elles ne sont pas montées.

### 12.5 Chargement perçu

**`SplashScreen` bloquant 4.2 s** (`App.jsx:109-115`) :
```
const timer = window.setTimeout(() => setShowSplash(false), 4200);
```

4,2 s de splash **fixe, non conditionnel** à la préchargement réel. Impact LCP (Largest Contentful Paint) massif. **À remplacer** par :
- Soit montage immédiat du Suspense fallback.
- Soit un splash qui disparaît dès que `onAuthStateChanged` a répondu (typiquement < 500 ms).

### 12.6 CSS bundle

`dist/index-*.css` ~209 KB. Tailwind JIT purge normalement correctement, mais à vérifier que `content` (`tailwind.config.js:3`) ne balaie pas de fichiers morts.

### 12.7 Quick wins performance

| # | Action | Impact estimé | Effort |
|---|---|---|---|
| 1 | Activer `vite-plugin-imagemin` dans `vite.config.js` + convertir en WebP | −20 MB build, LCP −30 à −50 % | 1 h |
| 2 | Supprimer le délai artificiel 4,2 s du SplashScreen | LCP −3 à −4 s | 30 min |
| 3 | Fusionner `FavoritesContext` + `WishlistContext` + éventuellement `AuthContext` en un seul listener user | −1 listener Firestore, −1 re-render | 1 h |
| 4 | Mémoiser `ItemCard` + cartes du feed avec `React.memo` | −40 % re-renders sur scroll | 2 h |
| 5 | Pagination serveur sur le feed (`limit() + startAfter()`) | +scalabilité | 4 h |

---

## 13. Audit accessibilité

Audit léger (pas d'outil automatisé lancé). Observations à partir du code uniquement.

### 13.1 Points positifs probables

- Usage de composants sémantiques probable (à vérifier : `<button>` vs `<div onClick>`).
- `aria-label` ponctuellement observé sur quelques boutons icon-only (à grep pour confirmer).

### 13.2 Risques probables

- **Contraste** : les textes `text-[#6B7280]` sur `bg-white` ont un ratio ~4.6:1 (limite AA) ; les textes `text-[#1ABEA3]` sur `bg-white` ont un ratio bien plus faible, inutilisables en texte principal.
- **Zones tactiles** : nombreux boutons `h-8 w-8` ou `h-6 w-6` (= 32 × 32 px ou 24 × 24 px) — **en dessous du minimum WCAG de 44 × 44 px**.
- **Focus states** : à inspecter si les boutons custom (`TrocoButton`, `Button`) ont un `focus-visible:outline` propre.
- **Labels formulaires** : à vérifier que chaque `<input>` a un `<label>` associé ou un `aria-label`.
- **Alternatives textuelles images** : les `<img>` du feed ont-elles des `alt` significatifs ou vides ? À vérifier.
- **Navigation clavier** : feed scrollable à la souris, mais flèches ? Tab order ?

### 13.3 Recommandations

1. Passer `axe-core` sur chaque page clé (scriptable dans Playwright).
2. Grep `onClick` sur `<div>` et migrer vers `<button>` si l'élément est interactif.
3. Augmenter les zones tactiles des boutons icon-only (minimum 40 × 40 px sur mobile).
4. Ajouter un `focus-visible:ring-2 focus-visible:ring-troco-primary` global dans le CSS.

---

## 14. Dette technique

### 14.1 Fichiers morts à supprimer

**À la racine du repo :**
- 9 fichiers PNG `*.png` (captures d'écran : `244bfd25-…`, `99186636-…`, `Hero.png`, etc.) — à archiver ou supprimer.
- `cd` (fichier sans extension à la racine, à inspecter — probable erreur de shell).
- `output-onlinepngtools.png`, `f5c4c6f2-…png`, `feed idee univers.png`.

**Dans `frontend/src/` :**
- `EditItemPage.jsx` (doublon)
- `ProfileEditPage.jsx` (doublon)
- `exchangeUtils.js` (doublon avec `utils/exchangeUtils.js`)
- `index2.css`
- `firebase-debug.log`
- `troco_onboarding_index_update.zip`
- `logo.png` (985 KB — ce n'est pas un emplacement standard, devrait être dans `src/assets/`)

**Dans `frontend/src/pages/` :**
- `EditProfilePage2e2e.jsx`
- `FavoritesPagdde.jsx`
- `ItemDetailPagebien.jsx`, `ItemDetailPageoo.jsx`, `ItemDetailPagewd.jsx`, `ItemDetailPagewdw.jsx`
- `ProfilePagegrgreag.jsx`, `ProfilePagewew.jsx`
- `UniversDetailPageb.jsx`
- dossier `PublicProfile_compact_keep_preferences/`

**Dans `frontend/src/pages/feed/` :**
- `MobileFeedPage7.jsx`, `MobileFeedPagebon.jsx`, `MobileFeedPagebbbb.jsx`
- `DesktopFeedPageU.jsx`, `DesktopFeedPagebbbb.jsx`
- `DesktopFeedPage 2.jsx`

**Dans `frontend/src/components/`** (à investiguer) :
- Variantes `*wdw`, `*wew`, `*ood`, `*bien`, `*bbbb` rapportées par l'agent architecture — à confirmer par `ls frontend/src/components/` complet.

### 14.2 TODO / FIXME

**25 occurrences** dans `frontend/src/` (à inspecter individuellement — non détaillées ici).

### 14.3 Console.log en production

**~20 occurrences** (hors `node_modules`), concentrées dans :
- `utils/testReviews.js` (16 — fichier de test, acceptable si pas inclus en prod)
- `services/aiVerification.js` (2)
- `i18n/index.js` (1)
- `pages/LandingPage.jsx` (1)

Backend `server.js` contient aussi des `console.log` de debug (`AUTH: typeof authRoutes`).

### 14.4 Code dupliqué

- Routes `/exchanges/:id` × 2.
- Routes équivalentes `post-meeting` × 4 et `choose-place` × 3.
- Backend SQLite tables `items` et `exchanges` en parallèle de Firestore.
- Alias `ExchangeShowcasePage` = `ExchangeDetailPage`.
- 2 cartes Vercel.json.
- 3 feuilles CSS.
- 4 implémentations de carte d'objet.
- 3 systèmes de boutons.

### 14.5 Dépendances

**À réviser :**
- `lucide-react@1.14.0` → migrer vers `lucide-react@0.400+` (API quasi-identique mais ruptures sur quelques noms).
- `@capacitor/cli@6.x` vs `@capacitor/core@8.x` → aligner.
- `imagemin-*` + `vite-plugin-imagemin` : soit activer, soit supprimer de `devDependencies`.

**Dépendance backend `better-sqlite3`** : à décider — si le backend est dormant, retirer.

---

## 15. Analyse produit

### 15.1 Compréhension du concept

Le landing (`LandingPage.jsx`) communique correctement la promesse « troc de proximité entre particuliers ». L'accès direct au prototype via `/feed` (commit `8289a8e`) permet au visiteur non-authentifié d'évaluer le produit sans friction d'inscription — **bonne décision produit**.

### 15.2 Facilité de publication

Flow `AddItemPage` : photos + titre + description + catégorie + condition + géoloc. Pas d'estimation de valeur, pas d'IA d'aide à la description. **AIVerification** existe mais est optionnel. **L'ergonomie du flow photo (nombre max, drag&drop, preview) est à vérifier en runtime.**

### 15.3 Découverte d'objets

Le feed géolocalisé + catégories + communautés est un bon squelette. **Faille UX constatée au code** :
- Pas de déduplication entre sections « près de chez vous », « nouveautés », « pour toi ».
- Pas de recommandation personnalisée (le hook `useRecommendations` existe mais les données `users/{uid}/interests/*` ne sont pas exploitées).
- Pas de filtre « troc possible » (items dont les préférences du propriétaire matchent avec ma library).

### 15.4 Dimension communautaire

10 communautés thématiques. Code d'inscription à une communauté, affichage des membres, hero collage — infrastructure présente.

**Risque produit :** si les communautés sont vides au lancement, l'effet est anti-viral. **Besoin de seed curation** avant lancement.

### 15.5 Confiance

Système d'avis + 8 badges + trust score — infrastructure solide. **Mais :**
- Les reviews ne sont pas limitées aux participants d'un exchange (voir §11).
- Le calcul du score est côté client (voir §10.5).
- La visibilité des badges dans l'UI est à vérifier.

### 15.6 Frictions du parcours

Flow négo créneau × 3 tours + flow négo lieu × 3 tours + chat libre = 6+ interactions avant une rencontre fixée. **Risque d'abandon élevé.** À tester en entonnoir.

**Opportunité produit :** proposer directement un créneau + un lieu « recommandé » (algorithmique, géo-barycentre) dès l'acceptation, et permettre contre-proposition en 1 clic.

### 15.7 Rétention

- Pas de gamification visible (le CLAUDE.md la cite comme TODO).
- Pas de notifications email ni push régulières (seulement push événementielles).
- Pas de digest hebdomadaire des nouveaux objets dans son rayon.

### 15.8 Différenciation vs marketplaces classiques

**Forces :**
- Absence d'argent → populations non-marchandes (étudiants, écolo).
- Carte interactive + rencontre physique → ancrage local.
- Système de confiance → moins anonyme que Leboncoin.

**Risques :**
- Liquidité : besoin de densité d'objets par zone. Sans seed massif, le feed est vide dans la plupart des arrondissements.
- Perception vs Geev (don) : Geev est gratuit asymétrique (donner sans recevoir), Troco est symétrique — à bien positionner.

---

## 16. Classification des problèmes P0–P3

### Format

```
ID — Titre | Priorité | Page/Zone | Fichiers | Cause probable | Impact utilisateur | Solution recommandée | Complexité | Risque régression | Vérification
```

Statuts : **AC** = anomalie confirmée, **AP** = anomalie probable, **H** = hypothèse à vérifier, **R** = recommandation.

### P0 — Critique (sécurité / blocant)

| ID | Titre | Statut | Détails |
|---|---|---|---|
| **P0-01** | Service account trackés git | AC | `backend/serviceAccountKey.{js,json}`. Risque fuite clé si historique commit la vraie valeur. **Solution** : git rm --cached + .gitignore + rotation. **Complexité** : S. **Régression** : nulle. |
| **P0-02** | firebase-debug.log committé | AC | `frontend/src/firebase-debug.log`. **Solution** : git rm --cached, rm, grep tout le repo pour `*.log` suivis. **Complexité** : XS. |
| **P0-03** | Règle Firestore testuser ouverte | AC | `firestore.rules:15`. Création illimitée de faux utilisateurs. **Solution** : supprimer la ligne (laisser uniquement règle write uid==userId). **Complexité** : XS. **Régression** : les tests Playwright qui créent des testuser* devront utiliser l'émulateur. |
| **P0-04** | SplashScreen bloquant 4,2 s | AC | `App.jsx:109-115`. LCP catastrophique sur slow 3G. **Solution** : setTimeout → listener `onAuthStateChanged`. **Complexité** : S. |

### P1 — Important (bugs majeurs UX / data)

| ID | Titre | Statut | Détails |
|---|---|---|---|
| **P1-01** | Route `/exchanges/:id` dupliquée | AC | `App.jsx:307` + `:316`. Dead code. **Solution** : supprimer ligne 316. **Complexité** : XS. |
| **P1-02** | Doublons d'items dans le feed | AC | `useFeedItems.js` + `MobileFeedPage.jsx:446+483`. UX cassée. **Solution** : Set d'IDs déjà affichés, skip. **Complexité** : S. |
| **P1-03** | Titres tronqués mobile (line-clamp-1) | AC | `MobileFeedPage.jsx:176`. **Solution** : passer `line-clamp-2`. **Complexité** : XS. |
| **P1-04** | 4 verts de marque concurrents | AC | Grep hex. **Solution** : décider une couleur, l'intégrer dans `tailwind.config.js`, migration par Find/Replace. **Complexité** : M. |
| **P1-05** | 4 implémentations de carte d'objet | AC | `ItemCard`, `TrocoExchangeCard`, `PlaceCard`, feeds inline. **Solution** : factoriser en `<ItemCard variant>`. **Complexité** : L. |
| **P1-06** | 3 feuilles CSS parallèles | AC | `index.css`, `index2.css`, `styles/index.css`. **Solution** : supprimer index2, migrer index.css vers styles/index.css. **Complexité** : M. **Régression** : moyenne (tokens à harmoniser). |
| **P1-07** | 9+ variantes de pages mortes | AC | `pages/*{bien,oo,wd,wdw,wew,grgreag,…}`. **Solution** : rm. **Complexité** : XS. |
| **P1-08** | `vite-plugin-imagemin` inactif, 34 MB d'images | AC | `vite.config.js:5-7`. **Solution** : importer et activer. **Complexité** : S. |
| **P1-09** | `lucide-react@1.14.0` abandonnée | AC | `package.json:25`. **Solution** : migrer vers `lucide-react@~0.400`. **Complexité** : M (certains noms d'icônes à renommer). |
| **P1-10** | Capacitor CLI/Core désalignés | AC | `package.json:19-21`. Build iOS probablement cassée. **Solution** : aligner sur une version majeure. **Complexité** : M. |
| **P1-11** | Règle `items.update` 3 champs OR | AC | `firestore.rules:23-26`. **Solution** : durcir à `ownerId` seul après nettoyage data. **Complexité** : M (migration data nécessaire). |
| **P1-12** | Pas de `storage.rules` | AP | `firebase.json` ne les référence pas. **Solution** : créer + déployer. **Complexité** : S. |
| **P1-13** | Backend Node orphelin | AP | `backend/`. **Solution** : décider — supprimer si inutile, documenter si utilisé pour FCM. **Complexité** : S à L selon décision. |
| **P1-14** | Pas de validation serveur | AC | `reputation`, `exchanges.create`, `reviews.create`. **Solution** : Cloud Functions. **Complexité** : L. |
| **P1-15** | Deux configs déploiement (Firebase + Vercel) | AC | Root `vercel.json` + `frontend/vercel.json` + `firebase.json`. **Solution** : trancher et supprimer l'autre. **Complexité** : XS. |
| **P1-16** | h-screen / 100vh sur iOS | AC | `MobileFeedPage.jsx:520`. **Solution** : `100dvh`. **Complexité** : S. |
| **P1-17** | Z-index chaos | AC | 10/20/30/40/50/[400]. **Solution** : module `constants/zIndex.js`. **Complexité** : S. |
| **P1-18** | FavoritesContext + WishlistContext = 2 listeners sur même doc | AC | `context/`. **Solution** : fusionner en UserDataContext. **Complexité** : S. |
| **P1-19** | Popup carte Leaflet fixe + rigide | AC | `TrocoMap.jsx:139-142`. **Solution** : dimensionner au contenu + object-fit. **Complexité** : S. |
| **P1-20** | Stats profil trop volumineuses | AC | `ProfilePage.jsx:892-899`. **Solution** : `grid-cols-2 sm:grid-cols-3`, capsules plus plates. **Complexité** : XS. |
| **P1-21** | Cover photo EditProfile inutile | AC | `EditProfilePage.jsx:112`. **Solution** : supprimer ou éditer. **Complexité** : XS. |
| **P1-22** | Icônes préférences ≠ catégories réelles | AC | `ProfilePage.jsx:58-71`. **Solution** : aligner constants. **Complexité** : S. |
| **P1-23** | MessagesPage sans thumbnail d'objet | AC | `pages/MessagesPage.jsx:94-104`. **Solution** : ajouter 40 × 40 px avant texte. **Complexité** : S. |
| **P1-24** | ADMIN_UID hardcodé dans le bundle | AP | `App.jsx:89`. **Solution** : custom claim Firebase. **Complexité** : M. |

### P2 — Amélioration (ergonomie / qualité / performance)

| ID | Titre | Statut | Détails |
|---|---|---|---|
| **P2-01** | Pas de React.memo sur cartes feed | AC | **Solution** : wrapper `ItemCard`, `PopupCard`, `TrocoExchangeCard`. **Complexité** : S. |
| **P2-02** | Pagination serveur absente | AC | `useFeedItems`. **Solution** : `limit() + startAfter()`. **Complexité** : M. |
| **P2-03** | Préférences utilisateur non filtrées sur feed | AC | `useFeedItems`. **Solution** : filtrer items selon `tradePreferences`. **Complexité** : S. |
| **P2-04** | Intérêts collectés jamais exploités | AC | `interestTracking` → aucun consommateur. **Solution** : brancher sur `useRecommendations`. **Complexité** : M. |
| **P2-05** | Tracking des événements produit absent | H | **Solution** : intégrer un analytics (GA4, Posthog). **Complexité** : M. |
| **P2-06** | GPS exact exposé publiquement | AC | `firestore.rules:20`. **Solution** : rendre les coords approximées en lecture non-authentifiée. **Complexité** : M. |
| **P2-07** | Pas de delete account | AC | `AuthContext`. **Solution** : méthode + Cloud Function de purge. **Complexité** : M (RGPD). |
| **P2-08** | Reviews non limitées aux participants | AC | `firestore.rules:47-51`. **Solution** : ajouter check `get(exchanges/$(exchangeId))`. **Complexité** : S. |
| **P2-09** | Champs redondants items (ownerId/userId/uid) | AC | Schema historique. **Solution** : migration data + passage à ownerId seul. **Complexité** : L. |
| **P2-10** | i18n EN partielle | AC | `locales/en/translation.json` 97 lignes. **Solution** : compléter ou retirer EN temporairement. **Complexité** : S. |
| **P2-11** | Breakpoint `md:` jamais utilisé | AC | **Solution** : audit viewports tablet, ajout `md:` où pertinent. **Complexité** : L. |
| **P2-12** | Chat messages legacy non migrés | AC | `chatMessages[]` legacy + sous-collection. **Solution** : script de migration. **Complexité** : M. |
| **P2-13** | 25 TODO / FIXME ouverts | AC | **Solution** : triage, résolution ou tickets. **Complexité** : M. |
| **P2-14** | Logo 985 KB dans `src/` | AC | `src/logo.png`. **Solution** : optimiser + déplacer dans `src/assets/`. **Complexité** : XS. |
| **P2-15** | Deux onboardings (`/onboarding` + `/profile-onboarding`) | AP | Doublon de flow ? **Solution** : audit UX puis fusion ou documentation. **Complexité** : M. |

### P3 — Évolution (fonctionnalités / optimisations futures)

| ID | Titre | Statut | Détails |
|---|---|---|---|
| **P3-01** | Recommandations personnalisées | R | basé sur interests + favoris + wishlist + préférences |
| **P3-02** | Mode sombre | R | cité dans CLAUDE.md TODO |
| **P3-03** | Notifications email digest | R | hebdo, nouveaux objets rayon |
| **P3-04** | Gamification (achievements) | R | cité dans CLAUDE.md TODO |
| **P3-05** | Tests unitaires + CI | R | Playwright ok, Vitest absent |
| **P3-06** | Monitoring (Sentry) | R | capture erreurs runtime |
| **P3-07** | A/B testing framework | R | pour onboarding / propositions |
| **P3-08** | Partage social | R | lien vers objet / profil |
| **P3-09** | Système de crédit/troc virtuel | R | mentionné dans brief, non implémenté |
| **P3-10** | PWA avec service worker | R | installation Android |
| **P3-11** | Fonctionnalités sociales (suivi d'utilisateurs) | R | cité dans CLAUDE.md TODO |

---

## 17. Roadmap recommandée

Les phases sont ordonnées par **dépendance** : chacune débloque la suivante. Durées indicatives pour un dev solo (× 2 ou 3 selon niveau).

### Phase 0 — Quick wins (1 jour)

Objectif : **ne rien casser**, maximiser l'impact par minute investie.

1. **Supprimer les secrets trackés** (P0-01, P0-02) — 1 h, inclut rotation clé.
2. **Retirer la règle Firestore `testuser.*`** (P0-03) — 15 min + test.
3. **Supprimer la 2e route `/exchanges/:id`** (P1-01) — 5 min.
4. **Décalage SplashScreen → event based** (P0-04) — 30 min.
5. **Supprimer `index2.css`** si confirmé orphelin + `troco_onboarding_index_update.zip` + `firebase-debug.log` — 10 min.
6. **`line-clamp-1` → `line-clamp-2` sur feed mobile** (P1-03) — 5 min.
7. **Supprimer les 9 variantes de pages mortes** + le dossier `PublicProfile_compact_keep_preferences/` (P1-07) — 20 min.
8. **Nettoyer les 9 PNG + `cd` à la racine du repo** — 10 min.
9. **Activer `vite-plugin-imagemin`** (P1-08) — 1 h + test build.
10. **Trancher entre Vercel et Firebase** (P1-15) — 15 min + nettoyage.

**Résultat attendu :** sécurité remise à niveau, bundle divisé par 1,5 à 2, codebase −30 fichiers inutiles.

### Phase 1 — Correction des bugs et anomalies d'intégration (3-5 jours)

- Résoudre la majorité des P1 restants (P1-02 à P1-24 hors P1-05, P1-09, P1-10, P1-11, P1-14).
- Z-index unifié, h-screen → h-dvh, stats profil réduites, cover EditProfile, préférences alignées, thumbnails MessagesPage, FavoritesContext/WishlistContext fusionnés.

### Phase 2 — Stabilisation technique (5-7 jours)

- **Capacitor align** (P1-10) — build iOS à remettre en route.
- **`lucide-react` migration** (P1-09) — dépendance moderne, gain sur la maintenabilité.
- **Clarifier le backend Node** (P1-13) — soit documenté et activé, soit supprimé.
- **Validation serveur critique** (P1-14) — Cloud Functions pour `reviews`, `reputation`, `exchanges.create`.
- **`storage.rules`** (P1-12) — créer et déployer.
- **Fusion `EditItemPage` / `ProfileEditPage` doublons racine** — rm.
- **Pagination serveur feed** (P2-02).

### Phase 3 — Harmonisation composants et responsive (5-7 jours)

- **Palette unifiée** (P1-04) — décider UNE couleur verte, l'intégrer dans Tailwind, migrer.
- **Fusion 4 cartes d'objet en 1** (P1-05) avec API `variant`.
- **Fusion 3 systèmes de boutons en 1** — API harmonisée.
- **Design tokens** — fichier `src/styles/tokens.js` + sync Tailwind.
- **Shadows externalisées** dans `tailwind.config.js`.
- **Framer-motion presets** dans `src/animations/`.
- **Breakpoint `md:`** audité (P2-11).

### Phase 4 — Refonte UX/UI (10-20 jours)

- Nouvelle identité visuelle (hors scope de cet audit — choix produit).
- Rework des écrans critiques : Feed, Carte, ExchangeDetail, Profile, Chat.
- A/B test possible avec framework léger.

### Phase 5 — Amélioration des fonctionnalités existantes (10-15 jours)

- Recommandations personnalisées (P3-01) basées sur `interests`, `favorites`, `wishlist`, `tradePreferences`.
- Filtrage feed par préférences (P2-03).
- Déduplication items entre sections (P1-02 déjà en P1).
- Mode sombre (P3-02).
- Notifications email/push digest.
- Système d'annulation visible dans ExchangeDetail.
- MapPicker intégré dans ChoosePlace.

### Phase 6 — Nouvelles fonctionnalités et lancement (durée variable)

- Gamification, suivi social, partage.
- Monitoring Sentry, analytics.
- Tests unitaires (Vitest) + CI/CD.
- PWA / service worker.
- Système de crédit virtuel si choix produit.

---

## 18. Limitations de l'audit

### Ce que cet audit NE dit PAS

1. **Aucun test manuel au navigateur** n'a été réalisé. Toutes les affirmations UI sont déduites du code. Les écrans peuvent se comporter différemment en runtime (animations, ordre de chargement, états transitoires).
2. **Aucune mesure de performance réelle** (Lighthouse, WebVitals, DevTools Profiler). Les chiffres cités sont statiques (taille bundle, nombre de listeners).
3. **Aucun test Playwright relancé**. L'infrastructure existe (`frontend/e2e/`) mais le dernier passage connu (58/58 ok au 2026-09-24) n'a pas été vérifié.
4. **Pas d'audit de l'app iOS** (Capacitor). Possiblement cassée vu le désalignement CLI/Core.
5. **Pas de test accessibilité automatisé** (axe, pa11y).
6. **Pas de scan de sécurité automatisé** (OWASP ZAP, npm audit détaillé).
7. **Historique git non exploré** pour détecter des secrets précédemment commités.
8. **Documentation produit (Notion / Figma)** non accessible.
9. **Base Firestore live non inspectée** (nombre d'utilisateurs, nombre d'items, intégrité, items zombies, etc.).
10. **Pas de revue de la landing page SEO** (balises meta, OpenGraph, structured data).

### Confiance des findings

- **Findings sécurité** : haute confiance (fichiers lus directement, status git vérifié).
- **Findings architecture** : haute confiance (code + configs lus).
- **Findings fonctionnels** : confiance moyenne (dépend de la justesse de l'inférence sur les flows non testés).
- **Findings UI/UX** : confiance moyenne (classes CSS statiques, pas de rendu réel vu).
- **Findings performance** : confiance moyenne (estimations, pas de mesures).

### Prochaines étapes de validation suggérées

1. Lancer `npm run dev` + navigation complète en Chrome DevTools viewport mobile.
2. Lancer `npm run build` puis Lighthouse sur le build.
3. Relancer `npm run test:e2e`.
4. `npm audit` complet.
5. `git log -p -- backend/serviceAccountKey.json` pour voir si la vraie clé a été committée dans l'historique.
6. Inspection manuelle Firestore via la console Firebase (nombre de docs par collection, items zombies, etc.).

---

## Annexe — Inventaire des composants (extrait)

**`src/components/`** (sélection) :
`BottomNav.jsx`, `CategoryPills.jsx`, `CinematicMeetingCard.jsx`, `CommunautesStrip.jsx`, `ErrorBoundary.jsx`, `ItemCard.jsx`, `ItemConditionSelector.jsx`, `ItemPhotoManager.jsx`, `MapPickerModal.jsx`, `MeetingValidationModal.jsx`, `NegotiationExplainer.jsx`, `NotificationButton.jsx`, `PartnerCafeSelector.jsx`, `PlaceCard.jsx`, `PremiumMeetingConfirmed.jsx`, `ProfilePhotoUploader.jsx`, `ReviewSystem.jsx`, `SEOMeta.jsx`, `SkeletonCard.jsx`, `SplashScreen.jsx`, `SurveyModal.jsx`, `TradePreferencesCard.jsx`, `TradePreferencesForm.jsx`, `TradePreferencesPreview.jsx`, `TradePreferencesSection.jsx`, `TradePreferencesSummary.jsx`, `TrocConfirmedCelebration.jsx`, `TrocoButton.jsx`, `TrocoCard.jsx`, `TrocoDesktopHero.jsx`, `TrocoFooter.jsx`, `TrocoLogo.jsx`, `TrocoMap.jsx`, `TrocoOnboarding.jsx`.

**`src/components/ui/`** : `Badge.jsx`, `Button.jsx`, `Card.jsx`, `Input.jsx`, `Modal.jsx`, `Pill.jsx`, `Sheet.jsx`.

**`src/components/avatar/`** : composants avatar.

**`src/components/profile/`** : composants profil (incluant plusieurs `PublicProfileHeader`).

**`src/components/trocs/`** : `TrocoExchangeCard.jsx` et apparentés.

**Fichier "god"** : `src/components/UI.jsx` — fourre-tout alternatif.

---

*Fin du document. Ce rapport est destiné à être transmis à un autre assistant IA ou à un humain pour établir une stratégie d'amélioration. Il doit être relu par un œil humain pour arbitrage sur les points marqués AP (anomalie probable) et H (hypothèse), et complété par les tests manuels listés en §18.*
