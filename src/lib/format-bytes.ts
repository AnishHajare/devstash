/**
 * Format a byte count into a human-readable string (e.g. "1.4 MB").
 * Returns "—" for null or 0.
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
