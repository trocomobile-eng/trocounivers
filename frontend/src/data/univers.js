import imgJeux from "../assets/univers/univ-jeux.png";
import imgMusique from "../assets/univers/univ-musique.png";
import imgDeco from "../assets/univers/univ-deco_maison.png";
import imgPhoto from "../assets/univers/univ-photo.png";
import imgSport from "../assets/univers/univ-sport.png";

export const UNIVERS = [
  {
    id: "jeux",
    label: "Jeux",
    tagline: "Partager, jouer, s'amuser ensemble.",
    description: "Jeux de société, cartes, puzzles et objets ludiques à échanger près de toi.",
    img: imgJeux,
    accent: "#B8A040",
    icon: "✣",
    count: "823 objets",
  },
  {
    id: "musique",
    label: "Musique",
    tagline: "Écouter, collectionner, faire résonner.",
    description: "Vinyles, instruments, enceintes, pédales et accessoires audio.",
    img: imgMusique,
    accent: "#4BA8B8",
    icon: "♪",
    count: "1 124 objets",
  },
  {
    id: "deco",
    label: "Déco & Maison",
    tagline: "Sublimer, aménager, se sentir bien chez soi.",
    description: "Mobilier, luminaires, plantes, vaisselle et objets de maison.",
    img: imgDeco,
    accent: "#B07840",
    icon: "⌂",
    count: "1 657 objets",
  },
  {
    id: "photo",
    label: "Photo",
    tagline: "Capturer, créer, immortaliser.",
    description: "Appareils, objectifs, argentique, trépieds et accessoires photo.",
    img: imgPhoto,
    accent: "#8060B0",
    icon: "◎",
    count: "947 objets",
  },
  {
    id: "sport",
    label: "Sport",
    tagline: "Bouger, explorer, se dépasser.",
    description: "Outdoor, vélo, fitness doux, raquettes, sacs et équipement sport.",
    img: imgSport,
    accent: "#4F9F67",
    icon: "♧",
    count: "612 objets",
  },
];
