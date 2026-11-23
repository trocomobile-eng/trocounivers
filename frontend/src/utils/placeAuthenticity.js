const FICTIONAL_PLACE_IDS = new Set([
  "cafe-parenthese",
  "cafe-pixel-vert",
  "cafe-atelier-troco",
  "maison-lune-troco",
  "middle-nord",
  "middle-central",
  "map-choice",
]);

export function isFictitiousPlace(place) {
  if (!place) return false;
  const id = String(place.id || place.placeId || "");
  const address = String(place.address || place.location || place.subtitle || "");
  return FICTIONAL_PLACE_IDS.has(id) || /adresse fictive|zone fictive|option simulée/i.test(address);
}
