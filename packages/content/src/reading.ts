export function countWords(text: string): number {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return 0;
  return normalized.split(" ").length;
}

export function readingMinutes(text: string): number {
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / 180));
}
