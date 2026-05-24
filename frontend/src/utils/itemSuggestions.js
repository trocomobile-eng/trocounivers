import { ITEM_TYPES } from "../constants/itemTaxonomy";

function cleanText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getItemSuggestions(input) {
  const text = cleanText(input);
  if (!text) return [];
  return ITEM_TYPES.map((item) => {
    const score = item.keywords.reduce((total, keyword) => text.includes(cleanText(keyword)) ? total + 1 : total, 0);
    return { ...item, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
}

export function buildCleanItemFromSuggestion(rawInput, suggestion) {
  if (!suggestion) return null;
  const raw = String(rawInput || "").trim();
  let detail = raw;
  suggestion.keywords.forEach((keyword) => {
    detail = detail.replace(new RegExp(keyword, "ig"), "");
  });
  detail = detail.replace(/\b(cool|super|top|joli|belle|beau)\b/gi, "").replace(/\s+/g, " ").trim();
  return {
    itemType: suggestion.label,
    itemDetails: detail ? detail.charAt(0).toUpperCase() + detail.slice(1) : "",
    category: suggestion.category,
    subcategory: suggestion.subcategory,
  };
}
