export const MOCK_PLACES = [
  {
    id: "cafe-charmant",
    name: "Café Charmant",
    address: "2 rue des Abbesses, Paris 18e",
    distance: "4 min de vous",
    type: "Café partenaire",
    tags: ["Calme", "Terrasse"],
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "montmartre-cafe",
    name: "Montmartre Coffee",
    address: "12 rue Lepic, Paris 18e",
    distance: "7 min de vous",
    type: "Café partenaire",
    tags: ["Lumineux", "Petit échange"],
    image:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1200&auto=format&fit=crop",
  },
];

export const MIDDLE_POINTS = [
  {
    id: "middle-montmartre",
    name: "Point milieu recommandé",
    address: "Montmartre, Paris 18e",
    distance: "8 min à pied de chacun",
    type: "Point milieu",
    tags: ["Équilibré", "Public"],
  },
  {
    id: "middle-chatelet",
    name: "Châtelet",
    address: "Place du Châtelet, Paris",
    distance: "Central",
    type: "Point milieu",
    tags: ["Métro", "Rapide"],
  },
];

export const OTHER_PLACE = {
  id: "map-choice",
  name: "Choisir sur la carte",
  address: "Option simulée pour le MVP",
  distance: "À définir",
  type: "Autre lieu",
  tags: ["Libre"],
};
