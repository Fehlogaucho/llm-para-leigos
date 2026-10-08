/* Dados do Mistério dos Três Grãos (cores dos feixes, registros e valores). */
export const GRAIN = { B: '#4fd18b', M: '#ffd25a', F: '#ff6a5a' } as const
export type GK = keyof typeof GRAIN
export const RECORDS: { n: [number, number, number]; total: number }[] = [
  { n: [3, 2, 1], total: 39 },
  { n: [2, 3, 1], total: 34 },
  { n: [1, 2, 3], total: 26 },
]
export const VALUES = { B: '9,25', M: '4,25', F: '2,75' }
