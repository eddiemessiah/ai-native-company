/**
 * Claim checks done by code, not by a model: numbers that read like claims, and the
 * [slots] a draft still needs filled. Browser-safe.
 */

/**
 * Numbers that read like claims (percentages, money, multiples, counts of users or customers)
 * and don't appear in the source text. Durations in an ask ("a 10-minute call") pass.
 */
export function inventedNumbers(text: string, sourceWords: string): string[] {
  const claimLike = /(?:[$€£₦]\s?\d[\d,.]*\s?(?:k|m|bn|million|billion)?|\d[\d,.]*\s?(?:%|x\b|k\b|m\b|million|billion)|\d[\d,.]*\+?\s(?:users|customers|clients|teams|companies|businesses|downloads|merchants|traders|members|transactions))/gi;
  const known = new Set((sourceWords.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")));
  return (text.match(claimLike) ?? []).filter((m) => {
    const digits = m.match(/\d[\d,.]*/)?.[0]?.replace(/[,.]$/, "") ?? "";
    return !known.has(digits);
  });
}

/** Personalization slots still to fill, like "[name]". A markdown link's "[text](url)" isn't one. */
export function unfilledSlots(text: string): string[] {
  return [...new Set(text.match(/\[[^\]\n]{1,60}\](?!\()/g) ?? [])];
}

/** Words as a person counts them. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
