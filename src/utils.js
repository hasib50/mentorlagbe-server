// Wrap async route handlers so errors reach the Express error handler
export const h = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isUrl = (value) => {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const toInt = (value, fallback) => {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
};
