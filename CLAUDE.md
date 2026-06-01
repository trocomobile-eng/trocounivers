# Troco - Documentation Technique

## Structure du projet

- **Frontend** : React + Vite + TailwindCSS + Firebase
- **Backend** : Node.js + SQLite + Firebase
- **Mobile** : Capacitor pour iOS

## Commandes principales

```bash
# Frontend
cd frontend
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Prévisualisation build

# Backend
cd backend
npm start           # Serveur backend
```

## Architecture

### Pages principales
- **Publiques** : `/`, `/login`, `/signup`, `/onboarding`
- **Privées** : `/feed`, `/library`, `/exchanges`, `/profile`
- **Items** : `/items/:id`, `/add`, `/items/:id/edit`
- **Échanges** : `/exchanges`, `/propose/:itemId`, `/choose-place`
- **Messages** : `/messages`, `/exchanges/:id/chat`

### Layouts responsifs
- Desktop : `lg:block` (≥1024px) via `DesktopLayout.jsx`
- Mobile : `lg:hidden` (<1024px) via `MobileLayout.jsx`
- Gestion centralisée dans `PageLayout.jsx`

### Structure des fichiers
```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages de l'application
├── layouts/       # Layouts desktop/mobile
├── context/       # Contexts React (Auth, Favorites, Toast)
├── hooks/         # Hooks personnalisés
├── utils/         # Utilitaires
├── constants/     # Constantes (catégories, conditions, etc.)
├── assets/        # Images et ressources
└── styles/        # CSS global
```

## Configuration Firebase

- Config dans `src/firebase.js`
- Auth : `AuthContext.jsx`
- Firestore pour données
- **ATTENTION** : `serviceAccountKey.js` doit être en variable d'environnement

## Points d'attention

### Sécurité
- Déplacer `serviceAccountKey.js` vers variables d'environnement
- Vérifier les règles Firestore

### Performance
- Bundle size important (1.5MB) - considérer le code splitting
- Images optimisées mais volumineuses dans assets/

### Routes redondantes
```javascript
// Ces routes pointent vers la même page :
/items/:id
/items/:itemId
/exchanges/:id
/exchange/:id
```

## Dépendances principales

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.30.3",
  "firebase": "^12.12.1",
  "framer-motion": "^12.38.0",
  "leaflet": "^1.9.4",
  "lucide-react": "^1.14.0"
}
```

## Optimisations réalisées

### Nettoyage & Organisation ✅
- ✅ Suppression des fichiers doublons
- ✅ Nettoyage des pages avec suffixes (*2.jsx, *copy.jsx)
- ✅ Suppression des layouts dupliqués
- ✅ Nettoyage des archives et dossiers temporaires

### Optimisations techniques ✅
- ✅ Bundle size optimisé (code splitting Vite)
- ✅ Routes redondantes nettoyées
- ✅ className dupliqués corrigés
- ✅ Lazy loading des pages avec Suspense

### Sécurité ✅
- ✅ Config Firebase sécurisée (variables d'environnement)
- ✅ Règles Firestore renforcées
- ✅ Audit des secrets terminé

### Performance ✅
- ✅ Images optimisées (compression automatique)
- ✅ Hooks optimisés avec useCallback/useMemo
- ✅ Re-renders réduits avec React.memo

### Nouvelles fonctionnalités ✅
- ✅ **Système de confiance & avis**
  - Collection reviews avec modèle de données
  - Composants ReviewSystem (notation, affichage)
  - Système de réputation automatique
  - Badges de confiance (8 types)
  - Score de confiance (0-100)
  - Intégration dans profils utilisateurs

## Fonctionnalités du système de confiance

### Composants disponibles
```javascript
import { StarRating, ReviewForm, ReviewCard } from './components/ReviewSystem';
import { TrustBadge, TrustScore, ReputationDisplay } from './components/TrustBadges';
import { useReputation } from './hooks/useReputation';
```

### Types de badges
- `trusted_trader` - Score élevé (80+)
- `excellent_rating` - Que des 4-5 étoiles
- `experienced` - 5+ échanges
- `veteran` - 20+ échanges  
- `fast_responder` - Réactif
- `reliable` - Fiable et ponctuel
- `active_trader` - Très actif
- `verified` - Identité vérifiée

## TODO

- [ ] Système de notifications push
- [ ] Mode sombre
- [ ] Recommandations IA
- [ ] Fonctionnalités sociales (wishlist, suivi)
- [ ] Gamification (achievements)
- [ ] Tests unitaires