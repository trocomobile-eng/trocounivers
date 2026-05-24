export function formatPhoneNumber(value = "") {
  const digits = String(value).replace(/\D/g, "");

  if (!digits) return "";

  let normalized = digits;

  if (normalized.startsWith("33")) {
    normalized = `0${normalized.slice(2)}`;
  }

  if (normalized.length > 10) {
    normalized = normalized.slice(0, 10);
  }

  return normalized.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
