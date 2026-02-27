export function normalizeZip(input: string): string | null {
  if (!input) return null;

  const clean = input.trim().split("-")[0];

  if (!/^\d{5}$/.test(clean)) return null;

  return clean;
}
