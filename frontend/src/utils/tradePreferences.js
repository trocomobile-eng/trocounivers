export const TRADE_PREFERENCE_MODES = {
  ALL: "all",
  CATEGORIES: "categories",
};

export function normalizeTradePreferences(profile = {}) {
  const mode =
    profile.tradePreferenceMode ||
    profile.tradePreferencesMode ||
    profile.preferenceMode ||
    TRADE_PREFERENCE_MODES.ALL;

  const categories =
    profile.tradePreferenceCategories ||
    profile.preferredCategories ||
    profile.exchangeCategories ||
    [];

  return {
    mode:
      mode === TRADE_PREFERENCE_MODES.CATEGORIES
        ? TRADE_PREFERENCE_MODES.CATEGORIES
        : TRADE_PREFERENCE_MODES.ALL,
    categories: Array.isArray(categories) ? categories.filter(Boolean) : [],
  };
}

export function getTradePreferencesLabel(profile = {}) {
  const preferences = normalizeTradePreferences(profile);

  if (preferences.mode === TRADE_PREFERENCE_MODES.ALL) {
    return "Ouvert à tout";
  }

  if (preferences.categories.length === 0) {
    return "Préférences à préciser";
  }

  return `Intéressé par : ${preferences.categories.slice(0, 3).join(", ")}${
    preferences.categories.length > 3 ? "…" : ""
  }`;
}

export function isItemInsideTradePreferences(item, profile = {}) {
  const preferences = normalizeTradePreferences(profile);

  if (preferences.mode === TRADE_PREFERENCE_MODES.ALL) return true;
  if (!item?.category) return true;

  return preferences.categories.includes(item.category);
}
