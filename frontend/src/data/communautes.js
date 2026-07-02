import imgMusique from "../assets/univers/univ-musique.png";
import imgVelo from "../assets/univers/univ-velo.png";
import imgDeco from "../assets/univers/univ-deco_maison.png";
import imgMode from "../assets/univers/univ-mode.png";
import imgLivres from "../assets/univers/univ-livres.png";
import imgJeux from "../assets/univers/univ-jeux.png";
import imgPhoto from "../assets/univers/univ-photo.png";
import imgSport from "../assets/univers/univ-sport.png";
import imgEnfants from "../assets/univers/univ-enfants.png";

export const COMMUNAUTES = [
  {
    id: "musique",
    label: "Musique",
    tagline: "Instruments, vinyles et matériel audio.",
    description: "Échangez instruments, matos et accessoires avec des passionnés.",
    members: "12,4k",
    img: imgMusique,
    accent: "#4BA8B8",
    emoji: "🎵",
    keywords: ["musique", "instrument", "vinyle", "guitare", "piano", "audio", "basse", "batterie", "casque", "enceinte", "synthé", "pedale", "pédale", "ampli", "trompette", "violon", "clarinette", "flute", "platine"],
    subcats: ["Instruments", "Vinyles", "Audio", "Platines", "Claviers", "Accessoires"],
  },
  {
    id: "velo",
    label: "Vélo",
    tagline: "Rouler, réparer, se déplacer autrement.",
    description: "Vélos, accessoires, équipements cyclistes et pièces à échanger près de toi.",
    img: imgVelo,
    accent: "#4F7B3E",
    emoji: "🚲",
    keywords: ["vélo", "velo", "cyclisme", "bicyclette", "roue", "guidon", "selle", "dérailleur", "pneu", "chambre à air", "casque vélo", "sacoches", "fixie", "vtt", "route"],
    subcats: ["Vélos complets", "Pièces", "Accessoires", "Équipement", "Sécurité"],
  },
  {
    id: "deco",
    label: "Déco",
    tagline: "Aménager, décorer, se sentir bien chez soi.",
    description: "Luminaires, cadres, coussins, tapis et objets décoratifs à échanger près de toi.",
    img: imgDeco,
    accent: "#C09060",
    emoji: "🖼️",
    keywords: ["deco", "déco", "décoration", "luminaire", "lampe", "coussin", "tapis", "cadre", "vase", "miroir", "poster", "art", "tableau", "bougie"],
    subcats: ["Luminaires", "Textile", "Art & Cadres", "Bougies", "Plantes", "Vintage"],
  },
  {
    id: "mode",
    label: "Mode",
    tagline: "Renouveler sa garde-robe autrement.",
    description: "Vêtements, chaussures, sacs et accessoires de mode à échanger près de toi.",
    img: imgMode,
    accent: "#C07090",
    emoji: "👗",
    keywords: ["mode", "vêtement", "vetement", "habit", "robe", "manteau", "jean", "pantalon", "chaussure", "sac", "accessoire", "vintage", "foulard", "chemise", "pull", "veste"],
    subcats: ["Hauts", "Bas", "Chaussures", "Sacs", "Accessoires", "Vintage"],
  },
  {
    id: "livres",
    label: "Livres",
    tagline: "Lire, partager, transmettre.",
    description: "Romans, essais, BD, livres jeunesse et revues à échanger près de toi.",
    img: imgLivres,
    accent: "#6080C0",
    emoji: "📚",
    keywords: ["livre", "livres", "roman", "bd", "bande dessinée", "manga", "essai", "biographie", "poésie", "jeunesse", "revue", "magazine", "guide", "atlas", "encyclopédie"],
    subcats: ["Romans", "BD & Manga", "Essais", "Jeunesse", "Revues", "Pratique"],
  },
  {
    id: "jeux",
    label: "Jeux",
    tagline: "Jouer, partager, s'amuser ensemble.",
    description: "Jeux de société, cartes, puzzles et objets ludiques à échanger près de toi.",
    img: imgJeux,
    accent: "#B8A040",
    emoji: "🎲",
    keywords: ["jeux", "jeu", "board game", "puzzle", "carte", "cartes", "échecs", "dés", "catan", "carcassonne", "monopoly", "jeux de société", "jeux vidéo", "manette", "console"],
    subcats: ["Société", "Cartes", "Puzzles", "Jeux vidéo", "Échecs", "Enfants"],
  },
  {
    id: "photo",
    label: "Photo",
    tagline: "Capturer, créer, immortaliser.",
    description: "Appareils, objectifs, argentique, trépieds et accessoires photo à échanger près de toi.",
    img: imgPhoto,
    accent: "#8060B0",
    emoji: "📷",
    keywords: ["photo", "appareil", "objectif", "camera", "caméra", "reflex", "argentique", "trépied", "flash", "objectif", "boitier", "polaroid", "gopro", "drone"],
    subcats: ["Appareils", "Objectifs", "Argentique", "Accessoires", "Éclairage", "Trépied"],
  },
  {
    id: "maison",
    label: "Maison",
    tagline: "Aménager, cuisiner, vivre mieux.",
    description: "Mobilier, électroménager, vaisselle et objets du quotidien à échanger près de toi.",
    img: imgDeco,
    accent: "#B07840",
    emoji: "🏠",
    keywords: ["maison", "meuble", "mobilier", "table", "chaise", "canapé", "armoire", "étagère", "vaisselle", "cuisine", "électroménager", "cafetière", "frigo", "micro-onde", "aspirateur"],
    subcats: ["Mobilier", "Cuisine", "Électroménager", "Vaisselle", "Rangement", "Literie"],
  },
  {
    id: "sport",
    label: "Sport",
    tagline: "Bouger, explorer, se dépasser.",
    description: "Fitness, outdoor, raquettes, sacs et équipements sportifs à échanger près de toi.",
    img: imgSport,
    accent: "#4F9F67",
    emoji: "⚽",
    keywords: ["sport", "fitness", "outdoor", "randonnée", "tennis", "foot", "yoga", "ski", "musculation", "tapis roulant", "haltère", "raquette", "ballon", "natation", "surf", "escalade"],
    subcats: ["Fitness", "Outdoor", "Ballon", "Raquettes", "Ski & Snow", "Yoga"],
  },
  {
    id: "enfants",
    label: "Enfants",
    tagline: "Grandir, jouer, transmettre.",
    description: "Jouets, vêtements enfants, livres jeunesse et équipements bébé à échanger près de toi.",
    img: imgEnfants,
    accent: "#E8803A",
    emoji: "🧸",
    keywords: ["enfant", "bébé", "bebe", "jouet", "jouets", "lego", "doudou", "poussette", "siège auto", "vêtement enfant", "école", "cartable", "jeux enfant", "jouet en bois", "peluche"],
    subcats: ["Jouets", "Vêtements bébé", "Livres jeunesse", "Équipement", "Jeux éducatifs"],
  },
];

// Map id → communauté pour lookup rapide
export const COMMUNAUTES_MAP = Object.fromEntries(COMMUNAUTES.map((c) => [c.id, c]));
