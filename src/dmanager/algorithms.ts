/**
 * Shuffles any array
 *
 * @param arr array
 * @returns Shuffled array
 */
export function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((val) => ({ val, rand: Math.random() }))
    .sort((a, b) => a.rand - b.rand)
    .map(({ val }) => val);
}
