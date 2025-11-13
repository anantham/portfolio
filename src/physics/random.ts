export interface RandomSource {
  next: () => number
  gaussian: () => number
}

export function createRandomSource(seed?: number): RandomSource {
  let value = seed ?? Math.floor(Math.random() * 0xffffffff)

  const next = () => {
    value = (1664525 * value + 1013904223) >>> 0
    return value / 0x100000000
  }

  const gaussian = () => {
    let u = 0
    let v = 0
    while (u === 0) u = next()
    while (v === 0) v = next()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  return { next, gaussian }
}
