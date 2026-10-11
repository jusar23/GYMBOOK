export const LB_PER_KG = 2.2046226218

export function convertWeight(value, from, to) {
  const n = Number(value) || 0
  if (from === to) return n
  return n * (from === 'kg' ? LB_PER_KG : 1 / LB_PER_KG)
}
