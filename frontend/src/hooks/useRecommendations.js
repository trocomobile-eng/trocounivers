import { useMemo } from "react";
import { useWishlist } from "../context/WishlistContext";

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreItem(item, wishlistItems) {
  if (!wishlistItems.length) return 0;

  const itemTitle = normalize(item.title || item.name || item.itemTitle || "");
  const itemCategory = (item.category || item.categoryLabel || item.itemType || "").toLowerCase();

  let best = 0;

  for (const wish of wishlistItems) {
    let score = 0;

    // Category match
    const wishCategory = (wish.category || "").toLowerCase();
    if (wishCategory && itemCategory && wishCategory === itemCategory) score += 3;

    // Keyword overlap between wishlist title and item title
    const wishWords = normalize(wish.title);
    const overlap = wishWords.filter((w) => itemTitle.includes(w)).length;
    score += overlap * 2;

    if (score > best) best = score;
  }

  return best;
}

export function useRecommendations(items = [], maxItems = 6) {
  const { items: wishlist } = useWishlist();

  return useMemo(() => {
    if (!wishlist.length || !items.length) return [];

    const scored = items
      .map((item) => ({ ...item, _score: scoreItem(item, wishlist) }))
      .filter((item) => item._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, maxItems);

    return scored;
  }, [items, wishlist, maxItems]);
}
