import * as THREE from 'three'

/* Relevo, rio e posições do Vale dos Números (Área 2). Norte = -z. */

export type V3 = [number, number, number]

/** Gerador pseudoaleatório determinístico (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

/* ---------- rio ---------- */
export const RIVER = { z0: -6, amp: 4, k: 0.05, bank: 5.2, water: -0.55, x0: -76 }
export const riverZ = (x: number) => RIVER.z0 + RIVER.amp * Math.sin(x * RIVER.k)

/* ---------- lugares ---------- */
export const P = {
  spawn: [0, 0.15, 60] as V3,
  arrive: [0, 0, 68.5] as V3,
  plaza: [0, 0.15, 36] as V3,
  altar: [0, 0.15, 36] as V3,
  totem1: [0, 0.15, 31.2] as V3,
  field: [0, 0, 14] as V3,
  bridge: [0, 0, -6] as V3,
  bridgeW: [-34, 0, riverZ(-34)] as V3,
  ruins: [0, 0.15, -28] as V3,
  totem2: [0, 0.15, -30] as V3,
  quarry: [-7, 0.15, -23.5] as V3,
  machine: [-9.8, 0.15, -32.2] as V3,
  cave: [-46, 0, -40] as V3,
  temple: [44, 0, -40] as V3,
  court: [0, 0.15, -50] as V3,
  door: [0, 0.15, -56] as V3,
  hall: [0, 0.15, -64] as V3,
  portal: [0, 0, -68] as V3,
  vault: [-15.5, 0.15, -64] as V3,
}

/* trilhas (também ficam planas no relevo): [ax, az, bx, bz, largura] */
export const PATHS: [number, number, number, number, number][] = [
  [0, 59, 0, 47, 3.4],
  [0, 25, 0, 0.6, 3.4],
  [0, -12.6, 0, -18.6, 3.4],
  [0, -37.4, 0, -44.2, 3.4],
  [-12.6, -29, -37.4, -36.4, 2.8],
  [12.6, -29, 28.8, -40, 2.8],
  [-11.6, 37, -30, 27, 2.8],
  [-30, 27, -34, -3.6, 2.8],
  [-34, -16.4, -39.6, -32.6, 2.8],
  [11.6, 37, 26, 28, 2.8],
  [26, 28, 25, 9, 2.8],
]

const CIRC: [number, number, number][] = [
  [0, 64, 9], [0, 36, 14], [0, -28, 15.5], [-46, -40, 12.5], [44, -40, 14.5],
]

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax, dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t))
}

/** 0..1: quanto o terreno deve ser plano aqui (praças, trilhas, construções). */
export function flatness(x: number, z: number) {
  let f = 0
  for (const [cx, cz, r] of CIRC) { const d = Math.hypot(x - cx, z - cz); if (d < r + 6) f = Math.max(f, ss(r + 6, r, d)) }
  for (const [ax, az, bx, bz, w] of PATHS) { const d = segDist(x, z, ax, az, bx, bz); const r = w / 2 + 1; if (d < r + 4) f = Math.max(f, ss(r + 4, r, d)) }
  f = Math.max(f, chamberMask(x, z))
  return f
}

/** Retângulo da Câmara Binária (sem montanha e plano). */
export function chamberMask(x: number, z: number) {
  const dx = Math.max(Math.abs(x) - 21, 0), dz = Math.max(z + 42, -79 - z, 0)
  return ss(6, 0, Math.hypot(dx, dz))
}

/** Distância "elíptica" ao centro do vale (1 = borda jogável). */
export const ellip = (x: number, z: number) => Math.hypot(x / 70, z / (z < 0 ? 79 : 73))

/** Altura do terreno. */
export function terrainH(x: number, z: number) {
  const f = flatness(x, z)
  let u = 0.55 * Math.sin(x * 0.085 + 0.5) * Math.cos(z * 0.075 + 1.1) + 0.35 * Math.sin((x + z) * 0.12 + 2) + 0.18 * Math.sin(x * 0.23 - z * 0.19)
  u = Math.max(u, -0.22) * 1.1
  const e = ellip(x, z)
  u += ss(0.55, 0.9, e) * (1.3 + Math.sin(x * 0.05 + z * 0.04) * 0.9)
  let h = u * (1 - f)
  const ang = Math.atan2(z, x)
  const m = ss(0.92, 1.25, e)
  const mnt = m * m * (40 + 12 * Math.sin(ang * 5 + 1) + 7 * Math.sin(ang * 11 + 2) + 4 * Math.sin(ang * 23))
  h += mnt * (1 - chamberMask(x, z))
  // leito do rio (começa numa cachoeira a oeste)
  const dz = Math.abs(z - riverZ(x))
  const carve = ss(5.4, 3.2, dz) * ss(RIVER.x0 - 4, RIVER.x0 + 3, x)
  h = h * (1 - carve) + carve * -1.9
  return h
}

/* ---------- malha do terreno ---------- */
export function buildTerrain(size = 300, seg = 150) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const y = terrainH(x, z)
    pos.setY(i, y)
    uv.setXY(i, x / 5, z / 5)
  }
  g.computeVertexNormals()
  const nrm = g.attributes.normal
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i)
    const n1 = Math.sin(x * 0.11 + z * 0.07) * 0.5 + Math.sin(x * 0.031 - z * 0.05 + 2) * 0.5
    const n2 = Math.sin(x * 0.37 + 1) * Math.cos(z * 0.29)
    // prado: verde com manchas mais claras/amareladas
    let r = 0.96 + n1 * 0.08 + n2 * 0.03, gg = 1.02 + n1 * 0.04, b = 0.86 - n1 * 0.08
    const dz = Math.abs(z - riverZ(x))
    const wet = ss(7.5, 4.5, dz)
    r -= wet * 0.18; gg -= wet * 0.1; b -= wet * 0.12
    const steep = 1 - nrm.getY(i)
    const high = ss(3, 12, y)
    const rk = Math.max(steep * 1.6, high)
    r = r * (1 - rk * 0.15); gg = gg * (1 - rk * 0.2); b = b * (1 - rk * 0.05)
    col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  // separa triângulos em grama e rocha (encostas)
  const idx = g.index!
  const grass: number[] = [], rock: number[] = []
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3()
  for (let i = 0; i < idx.count; i += 3) {
    const i0 = idx.getX(i), i1 = idx.getX(i + 1), i2 = idx.getX(i + 2)
    a.fromBufferAttribute(pos as any, i0); b.fromBufferAttribute(pos as any, i1); c.fromBufferAttribute(pos as any, i2)
    n.crossVectors(t1.subVectors(b, a), t2.subVectors(c, a)).normalize()
    const hy = (a.y + b.y + c.y) / 3
    const isRock = Math.abs(n.y) < 0.8 || hy > 5.5
    ;(isRock ? rock : grass).push(i0, i1, i2)
  }
  g.setIndex([...grass, ...rock])
  g.clearGroups()
  g.addGroup(0, grass.length, 0)
  g.addGroup(grass.length, rock.length, 1)
  return g
}
