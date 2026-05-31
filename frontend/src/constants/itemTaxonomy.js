export const ITEM_TYPES = [
  // ── Vêtements / Chaussures ────────────────────────────────────────────────
  { label: "Baskets", category: "Vêtements", subcategory: "Chaussures", keywords: ["baskets", "sneakers", "chaussures sport", "nike", "adidas", "running"] },
  { label: "Chaussures de ville", category: "Vêtements", subcategory: "Chaussures", keywords: ["chaussures ville", "derbies", "mocassins", "escarpins", "babies", "loafers"] },
  { label: "Chaussures de marche", category: "Vêtements", subcategory: "Chaussures", keywords: ["chaussures marche", "randonnée", "rando", "trek", "trail", "montagne"] },
  { label: "Bottes", category: "Vêtements", subcategory: "Chaussures", keywords: ["bottes", "bottines", "santiags", "chelsea"] },
  { label: "Sandales", category: "Vêtements", subcategory: "Chaussures", keywords: ["sandales", "tongs", "nu-pieds", "claquettes"] },

  // ── Vêtements / Hauts ─────────────────────────────────────────────────────
  { label: "T-shirt", category: "Vêtements", subcategory: "Hauts", keywords: ["tshirt", "t-shirt", "tee shirt", "tee-shirt"] },
  { label: "Chemise", category: "Vêtements", subcategory: "Hauts", keywords: ["chemise", "chemisier", "blouse"] },
  { label: "Pull", category: "Vêtements", subcategory: "Hauts", keywords: ["pull", "pullover", "pull-over", "sweat", "sweater", "hoodie", "gilet", "cardigan"] },
  { label: "Veste", category: "Vêtements", subcategory: "Vestes", keywords: ["veste", "blazer", "blouson", "coupe-vent", "windbreaker"] },
  { label: "Manteau", category: "Vêtements", subcategory: "Vestes", keywords: ["manteau", "pardessus", "trench", "duvet", "doudoune", "parka"] },
  { label: "Jean", category: "Vêtements", subcategory: "Bas", keywords: ["jean", "jeans", "denim", "pantalon jean"] },
  { label: "Pantalon", category: "Vêtements", subcategory: "Bas", keywords: ["pantalon", "chino", "cargo", "slim", "jogging", "joggeur"] },
  { label: "Short", category: "Vêtements", subcategory: "Bas", keywords: ["short", "bermuda"] },
  { label: "Robe", category: "Vêtements", subcategory: "Robes / Jupes", keywords: ["robe", "robe longue", "robe courte", "robe midi"] },
  { label: "Jupe", category: "Vêtements", subcategory: "Robes / Jupes", keywords: ["jupe", "minijupe", "jupe longue"] },
  { label: "Costume", category: "Vêtements", subcategory: "Vestes", keywords: ["costume", "complet", "smoking", "tailleur"] },
  { label: "Combinaison", category: "Vêtements", subcategory: "Robes / Jupes", keywords: ["combinaison", "combi", "salopette", "overall"] },
  { label: "Sous-vêtements", category: "Vêtements", subcategory: "Lingerie", keywords: ["sous-vêtements", "lingerie", "soutien-gorge", "culotte"] },

  // ── Vêtements / Accessoires ───────────────────────────────────────────────
  { label: "Sac à main", category: "Vêtements", subcategory: "Accessoires", keywords: ["sac", "sac à main", "pochette", "cabas", "tote", "tote bag", "sac à dos", "backpack"] },
  { label: "Ceinture", category: "Vêtements", subcategory: "Accessoires", keywords: ["ceinture", "belt"] },
  { label: "Écharpe", category: "Vêtements", subcategory: "Accessoires", keywords: ["écharpe", "echarpe", "foulard", "châle", "chale"] },
  { label: "Chapeau", category: "Vêtements", subcategory: "Accessoires", keywords: ["chapeau", "casquette", "bonnet", "bob", "hat", "béret", "beret"] },
  { label: "Gants", category: "Vêtements", subcategory: "Accessoires", keywords: ["gants", "mitaines", "moufles"] },
  { label: "Bijoux", category: "Vêtements", subcategory: "Accessoires", keywords: ["bijoux", "collier", "bracelet", "bague", "boucles", "montre", "watch"] },
  { label: "Lunettes", category: "Vêtements", subcategory: "Accessoires", keywords: ["lunettes", "lunettes de soleil", "solaires", "paire de lunettes"] },
  { label: "Valise", category: "Vêtements", subcategory: "Accessoires", keywords: ["valise", "bagage", "trolley", "voyage"] },

  // ── Maison / Mobilier ─────────────────────────────────────────────────────
  { label: "Table", category: "Maison", subcategory: "Mobilier", keywords: ["table", "table basse", "table à manger", "bureau", "plan de travail"] },
  { label: "Chaise", category: "Maison", subcategory: "Mobilier", keywords: ["chaise", "fauteuil", "chaise de bureau", "siège"] },
  { label: "Canapé", category: "Maison", subcategory: "Mobilier", keywords: ["canapé", "canape", "sofa", "divan", "méridienne", "convertible"] },
  { label: "Lit", category: "Maison", subcategory: "Mobilier", keywords: ["lit", "couchage", "sommier", "cadre de lit", "tête de lit"] },
  { label: "Meuble de rangement", category: "Maison", subcategory: "Mobilier", keywords: ["meuble", "commode", "armoire", "étagère", "etagere", "bibliothèque", "buffet", "bahut", "vitrine", "tag"] },
  { label: "Bureau", category: "Maison", subcategory: "Mobilier", keywords: ["bureau", "secrétaire", "desk"] },
  { label: "Miroir", category: "Maison", subcategory: "Déco", keywords: ["miroir", "glace", "reflet"] },
  { label: "Lampe", category: "Maison", subcategory: "Luminaires", keywords: ["lampe", "lampe de bureau", "lampe de chevet", "lampadaire", "lustre", "plafonnier", "applique", "lumière", "luminaire"] },
  { label: "Tapis", category: "Maison", subcategory: "Déco", keywords: ["tapis", "moquette", "carpette", "descente de lit"] },
  { label: "Rideau", category: "Maison", subcategory: "Déco", keywords: ["rideau", "voilage", "store", "brise-vue"] },
  { label: "Coussin", category: "Maison", subcategory: "Déco", keywords: ["coussin", "coussin déco", "housse de coussin"] },
  { label: "Plante", category: "Maison", subcategory: "Déco", keywords: ["plante", "plante verte", "pot de fleur", "succulente", "cactus", "fleur", "bonsai"] },
  { label: "Cadre", category: "Maison", subcategory: "Déco", keywords: ["cadre", "tableau", "affiche", "poster", "illustration", "gravure", "peinture", "dessin"] },
  { label: "Vase", category: "Maison", subcategory: "Déco", keywords: ["vase", "pot", "carafe", "cruche"] },
  { label: "Bougie", category: "Maison", subcategory: "Déco", keywords: ["bougie", "diffuseur", "encens", "parfum d'intérieur"] },

  // ── Maison / Cuisine ──────────────────────────────────────────────────────
  { label: "Assiette", category: "Maison", subcategory: "Cuisine", keywords: ["assiette", "plat", "bol", "vaisselle", "service"] },
  { label: "Verre", category: "Maison", subcategory: "Cuisine", keywords: ["verre", "flûte", "coupe", "mug", "tasse", "théière", "cafetière"] },
  { label: "Casserole", category: "Maison", subcategory: "Cuisine", keywords: ["casserole", "poêle", "wok", "faitout", "cocotte", "sauteuse"] },
  { label: "Couteau", category: "Maison", subcategory: "Cuisine", keywords: ["couteau", "couteaux", "couvert", "ustensile"] },
  { label: "Robot de cuisine", category: "Maison", subcategory: "Électroménager", keywords: ["robot", "mixeur", "blender", "thermomix", "kitchenaid"] },
  { label: "Machine à café", category: "Maison", subcategory: "Électroménager", keywords: ["cafetière", "machine à café", "expresso", "nespresso", "dolce gusto"] },
  { label: "Grille-pain", category: "Maison", subcategory: "Électroménager", keywords: ["grille-pain", "toaster", "gaufrier", "croque-monsieur"] },

  // ── Maison / Électroménager ───────────────────────────────────────────────
  { label: "Aspirateur", category: "Maison", subcategory: "Électroménager", keywords: ["aspirateur", "robot aspirateur", "dyson", "roomba"] },
  { label: "Fer à repasser", category: "Maison", subcategory: "Électroménager", keywords: ["fer à repasser", "centrale vapeur", "défroisseur"] },
  { label: "Ventilateur", category: "Maison", subcategory: "Électroménager", keywords: ["ventilateur", "climatiseur", "clim", "climatisation"] },

  // ── Maison / Outils ───────────────────────────────────────────────────────
  { label: "Outillage", category: "Maison", subcategory: "Outils", keywords: ["tournevis", "marteau", "perceuse", "scie", "outil", "vis", "bricolage", "clé"] },

  // ── Tech ──────────────────────────────────────────────────────────────────
  { label: "Smartphone", category: "Tech", subcategory: "Téléphones", keywords: ["téléphone", "smartphone", "iphone", "android", "samsung", "pixel", "portable"] },
  { label: "Ordinateur portable", category: "Tech", subcategory: "Ordinateurs", keywords: ["ordinateur", "laptop", "macbook", "pc portable", "lenovo", "dell", "asus", "hp"] },
  { label: "Tablette", category: "Tech", subcategory: "Ordinateurs", keywords: ["tablette", "ipad", "tablet", "galaxy tab"] },
  { label: "Casque audio", category: "Tech", subcategory: "Audio", keywords: ["casque", "casque audio", "écouteurs", "airpods", "sony", "bose", "headphones"] },
  { label: "Enceinte", category: "Tech", subcategory: "Audio", keywords: ["enceinte", "haut-parleur", "speaker", "sono", "barre de son", "bluetooth"] },
  { label: "Appareil photo", category: "Tech", subcategory: "Photo / Vidéo", keywords: ["appareil photo", "reflex", "hybride", "compact", "canon", "nikon", "sony", "fuji", "leica", "camera"] },
  { label: "Caméra", category: "Tech", subcategory: "Photo / Vidéo", keywords: ["caméra", "gopro", "action cam", "camescope", "webcam"] },
  { label: "Drone", category: "Tech", subcategory: "Photo / Vidéo", keywords: ["drone", "dji", "quadcopter"] },
  { label: "Console de jeux", category: "Tech", subcategory: "Jeux vidéo", keywords: ["console", "playstation", "ps4", "ps5", "xbox", "nintendo", "switch", "game boy"] },
  { label: "Manette", category: "Tech", subcategory: "Jeux vidéo", keywords: ["manette", "joystick", "gamepad", "controller"] },
  { label: "Écran", category: "Tech", subcategory: "Ordinateurs", keywords: ["écran", "moniteur", "monitor", "télévision", "tv", "télé"] },
  { label: "Clavier", category: "Tech", subcategory: "Ordinateurs", keywords: ["clavier", "keyboard", "souris", "mouse", "trackpad"] },
  { label: "Disque dur", category: "Tech", subcategory: "Stockage", keywords: ["disque dur", "ssd", "usb", "clé usb", "carte mémoire", "nas"] },
  { label: "Imprimante", category: "Tech", subcategory: "Ordinateurs", keywords: ["imprimante", "scanner", "photocopieur", "printer"] },
  { label: "Câble / Accessoire", category: "Tech", subcategory: "Accessoires", keywords: ["câble", "chargeur", "adaptateur", "hub", "batterie externe", "powerbank", "coque"] },

  // ── Livres ────────────────────────────────────────────────────────────────
  { label: "Roman", category: "Livres", subcategory: "Romans", keywords: ["roman", "livre", "polar", "thriller", "littérature", "fiction", "récit"] },
  { label: "Bande dessinée", category: "Livres", subcategory: "BD / Manga", keywords: ["bd", "bande dessinée", "manga", "comics", "graphic novel"] },
  { label: "Livre de cuisine", category: "Livres", subcategory: "Pratique", keywords: ["livre de cuisine", "recettes", "gastronomie", "chef"] },
  { label: "Guide de voyage", category: "Livres", subcategory: "Pratique", keywords: ["guide", "guide de voyage", "routard", "lonely planet", "travel"] },
  { label: "Manuel / Scolaire", category: "Livres", subcategory: "Scolaire", keywords: ["manuel", "scolaire", "cours", "apprentissage", "dictionnaire", "encyclopédie"] },
  { label: "Livre d'art", category: "Livres", subcategory: "Art", keywords: ["livre d'art", "beaux arts", "photo", "architecture", "design", "mode"] },

  // ── Musique ───────────────────────────────────────────────────────────────
  { label: "Guitare", category: "Musique", subcategory: "Instruments", keywords: ["guitare", "basse", "acoustique", "électrique", "folk", "classique"] },
  { label: "Piano / Clavier", category: "Musique", subcategory: "Instruments", keywords: ["piano", "clavier", "synthé", "synthe", "synthétiseur", "keyboard"] },
  { label: "Batterie / Percussion", category: "Musique", subcategory: "Instruments", keywords: ["batterie", "cajon", "percussion", "tambour", "djembé", "congas"] },
  { label: "Instrument à vent", category: "Musique", subcategory: "Instruments", keywords: ["trompette", "saxophone", "flûte", "clarinette", "harmonica", "instrument vent"] },
  { label: "Amplificateur", category: "Musique", subcategory: "Matériel", keywords: ["ampli", "amplificateur", "marshall", "fender", "combo"] },
  { label: "Vinyle / Platine", category: "Musique", subcategory: "Matériel", keywords: ["vinyle", "vinyl", "platine", "tourne-disque", "disque"] },
  { label: "Partition / Solfège", category: "Musique", subcategory: "Partitions", keywords: ["partition", "solfège", "méthode", "tablature"] },

  // ── Sport ─────────────────────────────────────────────────────────────────
  { label: "Vélo", category: "Sport", subcategory: "Vélo", keywords: ["vélo", "velo", "bicyclette", "bmx", "vtt", "route", "fixie"] },
  { label: "Trottinette", category: "Sport", subcategory: "Mobilité", keywords: ["trottinette", "scooter", "skateboard", "longboard", "roller"] },
  { label: "Équipement fitness", category: "Sport", subcategory: "Fitness", keywords: ["haltère", "kettlebell", "tapis de yoga", "yoga", "musculation", "fitness", "elastique"] },
  { label: "Raquette", category: "Sport", subcategory: "Raquettes", keywords: ["raquette", "tennis", "badminton", "ping-pong", "squash", "padel"] },
  { label: "Ballon", category: "Sport", subcategory: "Sports collectifs", keywords: ["ballon", "football", "basket", "rugby", "volley", "handball"] },
  { label: "Équipement ski / Snow", category: "Sport", subcategory: "Glisse", keywords: ["ski", "snowboard", "snow", "planche", "boots", "skis"] },
  { label: "Surf / Paddle", category: "Sport", subcategory: "Glisse", keywords: ["surf", "surfboard", "paddle", "sup", "bodyboard", "wakeboard"] },
  { label: "Sac de sport", category: "Sport", subcategory: "Accessoires", keywords: ["sac de sport", "sac gym", "sac de randonnée", "sac à dos sport"] },
  { label: "Tente / Camping", category: "Sport", subcategory: "Outdoor", keywords: ["tente", "camping", "sac de couchage", "matelas gonflable", "hamac"] },

  // ── Jeux ─────────────────────────────────────────────────────────────────
  { label: "Jeu de société", category: "Jeux", subcategory: "Jeux de société", keywords: ["jeu de société", "jeu plateau", "catan", "monopoly", "uno", "cartes", "jeu cartes"] },
  { label: "Jeu vidéo", category: "Jeux", subcategory: "Jeux vidéo", keywords: ["jeu vidéo", "jeux video", "ps4", "ps5", "xbox", "nintendo", "switch", "steam"] },
  { label: "Puzzle", category: "Jeux", subcategory: "Jeux de société", keywords: ["puzzle", "jigsaw"] },
  { label: "Jouet enfant", category: "Jeux", subcategory: "Jouets", keywords: ["jouet", "lego", "playmobil", "doudou", "peluche", "figurine", "poupée"] },

  // ── Autre ─────────────────────────────────────────────────────────────────
  { label: "Véhicule / Mobilité", category: "Autre", subcategory: "Mobilité", keywords: ["voiture", "moto", "scooter", "trottinette électrique", "véhicule"] },
  { label: "Art / Création", category: "Autre", subcategory: "Art", keywords: ["peinture", "sculpture", "poterie", "céramique", "artisanat", "création", "art"] },
  { label: "Collection", category: "Autre", subcategory: "Collection", keywords: ["collection", "collectionneur", "vintage", "antique", "rare", "édition limitée"] },
  { label: "Plein air / Jardin", category: "Autre", subcategory: "Jardin", keywords: ["jardin", "terrasse", "arrosoir", "tondeuse", "balcon", "bac à fleurs"] },
  { label: "Puériculture", category: "Autre", subcategory: "Bébé", keywords: ["bébé", "poussette", "siège auto", "lit bébé", "naissance", "enfant"] },
];
