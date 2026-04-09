/**
 * Generates a human-readable but secure share slug.
 *
 * Format: {client-name}-{doc-number}-{short-uuid}
 * Example: john-doe-css-feb-2026-261-a8f3k9b2
 *
 * The UUID is always appended at the end so the API can extract
 * it for database lookup (no need to store the slug in the DB).
 */
export function buildShareSlug(clientName = '', docNumber = '', publicId = '') {
  const sanitize = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')   // keep only alphanumeric, space, hyphen
      .trim()
      .replace(/\s+/g, '-')            // spaces → hyphens
      .replace(/-{2,}/g, '-')          // collapse multiple hyphens
      .slice(0, 40);                   // cap length

  const clientPart  = sanitize(clientName)  || 'client';
  const docPart     = sanitize(docNumber)   || 'doc';
  const shortUuid   = publicId.replace(/-/g, '').slice(0, 8); // 8 hex chars

  return `${clientPart}-${docPart}-${shortUuid}`;
}
