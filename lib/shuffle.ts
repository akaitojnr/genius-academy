// Deterministic PRNG (mulberry32) seeded from a string. Using this instead of
// Math.random() means the same attemptId always reconstructs the same
// question/option order — so refreshing the exam page mid-attempt doesn't
// reshuffle things under the student.
function seedFromString(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rand = seedFromString(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const r = rand() / 4294967296;
    const j = Math.floor(r * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
