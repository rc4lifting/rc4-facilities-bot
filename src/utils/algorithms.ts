// utils/algorithms.ts

export function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export function findMax(numbers: number[]): number {
  return Math.max(...numbers);
}

export function findMin(numbers: number[]): number {
  return Math.min(...numbers);
}
