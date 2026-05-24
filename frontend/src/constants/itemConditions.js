// src/constants/itemConditions.js

export const ITEM_CONDITIONS = [
  {
    value: "like_new",
    label: "Comme neuf",
    emoji: "✨",
    description: "Très peu utilisé, aspect presque neuf.",
  },
  {
    value: "very_good",
    label: "Très bon état",
    emoji: "✅",
    description: "Utilisé avec soin, très propre.",
  },
  {
    value: "good",
    label: "Bon état",
    emoji: "👍",
    description: "Quelques signes d’usage, rien de gênant.",
  },
  {
    value: "used",
    label: "Quelques traces d’usage",
    emoji: "🛠",
    description: "Visible mais fonctionne bien.",
  },
  {
    value: "functional",
    label: "Usé mais fonctionnel",
    emoji: "🔧",
    description: "Marqué par le temps, mais encore utile.",
  },
  {
    value: "to_restore",
    label: "À rénover",
    emoji: "🪵",
    description: "À réparer, transformer ou restaurer.",
  },
];

export function getConditionLabel(value) {
  return ITEM_CONDITIONS.find((condition) => condition.value === value)?.label || "";
}

export function getConditionEmoji(value) {
  return ITEM_CONDITIONS.find((condition) => condition.value === value)?.emoji || "";
}

export function getConditionDescription(value) {
  return ITEM_CONDITIONS.find((condition) => condition.value === value)?.description || "";
}
