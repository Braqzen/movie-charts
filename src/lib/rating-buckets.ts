/** Rating ladder for charts and filters (0 to 5 in steps of 0.5). */
export const RATING_STEPS: readonly number[] = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
];

export function normalizeRatingStep(value: number): number {
  const rounded = Math.round(value * 2) / 2;
  return Math.max(0, Math.min(5, rounded));
}

export function ratingLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
