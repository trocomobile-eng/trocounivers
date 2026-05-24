// src/constants/categories.js
// Catégories TROCO avec icônes PNG premium.
// Les icônes doivent être dans : src/assets/categories/

import ToutIcon from "../assets/categories/tout.png";
import ElectroniqueIcon from "../assets/categories/electronique.png";
import MaisonIcon from "../assets/categories/maison.png";
import VetementsIcon from "../assets/categories/vetements.png";
import MusiqueIcon from "../assets/categories/musique.png";
import LivresIcon from "../assets/categories/livres.png";
import SportIcon from "../assets/categories/sport.png";
import JeuxIcon from "../assets/categories/jeux.png";

export const CATEGORY_ITEMS = [
  {
    id: "tout",
    label: "Tout",
    icon: ToutIcon,
    keywords: [],
  },
  {
    id: "electronique",
    label: "Électronique",
    icon: ElectroniqueIcon,
    keywords: [
      "électronique",
      "electronique",
      "tv",
      "télé",
      "tele",
      "console",
      "playstation",
      "ps5",
      "xbox",
      "switch",
      "écran",
      "ecran",
      "monitor",
      "projecteur",
      "chargeur",
      "câble",
      "cable",
      "adaptateur",
      "tablette",
      "ipad",
      "drone",
    ],
  },
  {
    id: "maison",
    label: "Maison",
    icon: MaisonIcon,
    keywords: [
      "maison",
      "meuble",
      "canapé",
      "canape",
      "table",
      "chaise",
      "lampe",
      "lit",
      "armoire",
      "commode",
      "miroir",
      "étagère",
      "etagere",
      "tapis",
      "vase",
      "coussin",
      "plante",
      "déco",
      "deco",
      "salle de bain",
    ],
  },
  {
    id: "vetements",
    label: "Vêtements",
    icon: VetementsIcon,
    keywords: [
      "vêtement",
      "vetement",
      "vêtements",
      "vetements",
      "mode",
      "t-shirt",
      "tshirt",
      "tee shirt",
      "robe",
      "jean",
      "veste",
      "manteau",
      "pull",
      "chemise",
      "hoodie",
      "pantalon",
      "sweat",
      "jupe",
      "short",
      "baskets",
      "chaussures",
      "sneakers",
    ],
  },
  {
    id: "musique",
    label: "Musique",
    icon: MusiqueIcon,
    keywords: [
      "musique",
      "guitare",
      "piano",
      "synthé",
      "synthe",
      "synth",
      "clavier",
      "batterie",
      "violon",
      "ukulele",
      "ukulélé",
      "harmonica",
      "micro",
      "microphone",
      "ampli",
      "enceinte",
      "speaker",
      "casque",
      "écouteurs",
      "ecouteurs",
      "platine",
      "vinyle",
      "midi",
      "pédale",
      "pedale",
    ],
  },
  {
    id: "livres",
    label: "Livres",
    icon: LivresIcon,
    keywords: [
      "livre",
      "livres",
      "roman",
      "bd",
      "bande dessinée",
      "bande dessinee",
      "manga",
      "comic",
      "essai",
      "biographie",
      "poésie",
      "poesie",
      "magazine",
      "kindle",
    ],
  },
  {
    id: "sport",
    label: "Sport",
    icon: SportIcon,
    keywords: [
      "sport",
      "vélo",
      "velo",
      "vtt",
      "trottinette",
      "skate",
      "ballon",
      "raquette",
      "haltère",
      "haltere",
      "fitness",
      "yoga",
      "tapis de course",
      "surf",
      "ski",
      "snowboard",
      "running",
      "tennis",
      "basket",
    ],
  },
  {
    id: "jeux",
    label: "Jeux",
    icon: JeuxIcon,
    keywords: [
      "jeu",
      "jeux",
      "jouet",
      "jouets",
      "gaming",
      "manette",
      "nintendo",
      "steam",
      "jeu vidéo",
      "jeu video",
      "figurine",
      "lego",
      "puzzle",
      "playmobil",
      "cartes",
      "pokemon",
      "pokémon",
    ],
  },
];

export const CATEGORIES = CATEGORY_ITEMS.map((category) => category.label);

export const FEATURED_CATEGORIES = CATEGORY_ITEMS;

export function getCategoryById(id) {
  return CATEGORY_ITEMS.find((category) => category.id === id) || CATEGORY_ITEMS[0];
}

export function getCategoryByLabel(label) {
  const normalized = normalize(label);

  return (
    CATEGORY_ITEMS.find((category) => normalize(category.label) === normalized) ||
    CATEGORY_ITEMS[0]
  );
}

export function normalizeCategory(categoryOrId = "") {
  const normalized = normalize(categoryOrId);

  const found =
    CATEGORY_ITEMS.find((category) => category.id === normalized) ||
    CATEGORY_ITEMS.find((category) => normalize(category.label) === normalized);

  return found?.label || "Autre";
}

export function guessCategoryFromText(text = "") {
  const clean = normalize(text);

  if (!clean) return "Maison";

  for (const category of CATEGORY_ITEMS) {
    if (category.id === "tout") continue;

    const match = category.keywords.some((keyword) => clean.includes(normalize(keyword)));

    if (match) return category.label;
  }

  return "Maison";
}

export function getCategoryIcon(categoryOrId = "") {
  const normalized = normalize(categoryOrId);

  const found =
    CATEGORY_ITEMS.find((category) => category.id === normalized) ||
    CATEGORY_ITEMS.find((category) => normalize(category.label) === normalized);

  return found?.icon || ToutIcon;
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
