/** Motion tokens (seconds). Keep transitions subtle; never delay security information. */
export const DUR = { fast: 0.15, standard: 0.25, sheet: 0.4, page: 0.5, gauge: 0.9, globe: 50 } as const;
export const EASE = [0.22, 1, 0.36, 1] as const;
export const SHEET_SPRING = { type: "spring", damping: 34, stiffness: 300, mass: 0.9 } as const;
