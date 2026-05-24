export const PARTNER_CAFES = [
  {
    id: "cafe-atelier",
    title: "Café L’Atelier",
    name: "Café L’Atelier",
    address: "23 rue de la Paix, Paris 2e",
    description: "Café partenaire Troco · calme, central et rassurant.",
    emoji: "☕",
    distance: "150 m",
    area: "Paris 2e",
    vibe: "Ambiance chaleureuse",
    perks: ["Café partenaire", "Lieu public", "Tables disponibles"],
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cafe-verde",
    title: "Café Verde",
    name: "Café Verde",
    address: "12 rue Oberkampf, Paris 11e",
    description: "Coffee shop lumineux, parfait pour un échange rapide.",
    emoji: "🌿",
    distance: "400 m",
    area: "Paris 11e",
    vibe: "Lumineux et vivant",
    perks: ["Terrasse", "Quartier animé", "Facile à trouver"],
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "maison-lune",
    title: "Maison Lune",
    name: "Maison Lune",
    address: "5 rue des Martyrs, Paris 18e",
    description: "Petit café de quartier, doux et chaleureux.",
    emoji: "🏡",
    distance: "700 m",
    area: "Paris 18e",
    vibe: "Esprit quartier",
    perks: ["Ambiance douce", "Tables calmes", "Rencontre confortable"],
    imageUrl:
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200&auto=format&fit=crop",
  },
];

export function getAlternativeCafe(currentCafe) {
  const currentId = currentCafe?.id;
  return PARTNER_CAFES.find((cafe) => cafe.id !== currentId) || PARTNER_CAFES[0];
}
