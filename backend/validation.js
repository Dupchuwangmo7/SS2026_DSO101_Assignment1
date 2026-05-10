// Pure helper functions used by the API routes.
// Kept in a separate module so they can be unit-tested without a database connection.

function isValidTitle(title) {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 200) return false;
  return true;
}

function normalizeTitle(title) {
  if (typeof title !== 'string') return '';
  return title.trim();
}

function parseId(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

module.exports = { isValidTitle, normalizeTitle, parseId };
