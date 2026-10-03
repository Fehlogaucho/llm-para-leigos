import * as THREE from 'three'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text } from '@react-three/drei'
import { Solid, Block, Ramp } from '../../../world/core'
import { MAT } from '../../../world/materials'
import { Column, Arch, Stairs, RoundPlatform, RectPlatform, Lantern, Banner, Statue, Tree, Bush, Ivy, Brazier, Wall, Batch } from '../../../world/Architecture'
import { Portal } from '../../../world/Instruments'
import { Waterfall } from '../../../world/Atmosphere'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'
import { QUALITY } from '../../../engine/quality'
import { P, PATHS, RIVER, riverZ, terrainH, buildTerrain, ellip, rng, type V3 } from './terrain'
import { VM, Instances, crystalGeo, stoneGeo, fruitGeo, Sign, Torch, CrystalFormation, type Inst } from './props'
import { ORCHARD, TREES } from './Field'

/** true quando o NEX está dentro da caixa (para esconder telhados). */
export function useInside(min: V3, max: V3) {
  const [inside, set] = useState(false)
  const st = useRef(false)
  useFrame(() => {
    const p = RT.player
    const v = p.x > min[0] && p.x < max[0] && p.y > min[1] && p.y < max[1] && p.z > min[2] && p.z < max[2]
    if (v !== st.current) { st.current = v; set(v) }
  })
  return inside
}

const chamberStone = () => { const m = (MAT.wall(2) as THREE.MeshStandardMaterial).clone(); m.color.set('#a9b4c8'); return m }
let _cs: THREE.Material | null = null
let _to: THREE.Material | null = null
const TILE_ON = () => (_to ||= new THREE.MeshStandardMaterial({ color: '#8fd8f5', emissive: '#2a9ad8', emissiveIntensity: 0.9, roughness: 0.4 }))
export const CSTONE = () => (_cs ||= chamberStone())
let _ft: THREE.BufferGeometry | null = null
const FTILE = () => (_ft ||= new THREE.BoxGeometry(0.6, 0.6, 0.05))

/* =================== terreno =================== */
function Terrain() {
  const g = useMemo(() => buildTerrain(), [])
  const mats = useMemo(() => {
    const gr = (MAT.grass(1) as THREE.MeshStandardMaterial).clone(); gr.vertexColors = true
    const rk = (MAT.rock(1) as THREE.MeshStandardMaterial).clone(); rk.vertexColors = true
    return [gr, rk]
  }, [])
  return <Solid><mesh geometry={g} material={mats} receiveShadow /></Solid>
}

/** Paredes invisíveis na borda do vale (onde as montanhas começam). */
function Boundary() {
  const N = 72
  const pts = Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2; const s = Math.sin(a); return [Math.cos(a) * 70 * 0.985, s * (s < 0 ? 79 : 73) * 0.985] })
  return (
    <>
      {pts.map(([x, z], i) => {
        const [x2, z2] = pts[(i + 1) % N]
        const len = Math.hypot(x2 - x, z2 - z) + 1.2
        return <Block key={i} size={[1, 10, len]} position={[(x + x2) / 2, 3, (z + z2) / 2]} rotation={[0, Math.atan2(x2 - x, z2 - z), 0]} />
      })}
    </>
  )
}

/* =================== montanhas distantes =================== */
function peakGeo(seed: number) {
  const g = new THREE.ConeGeometry(1, 1, 11, 7)
  const r = rng(seed)
  const ph = [r() * 6, r() * 6, r() * 6]
  const p = g.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p as any, i)
    const a = Math.atan2(v.z, v.x), t = v.y + 0.5
    const w = 1 + 0.18 * Math.sin(a * 3 + ph[0]) + 0.1 * Math.sin(a * 7 + ph[1] + t * 4) + 0.06 * Math.sin(t * 9 + ph[2])
    p.setXYZ(i, v.x * w, v.y + (t < 0.99 ? Math.sin(a * 5 + ph[1]) * 0.03 : 0), v.z * w)
  }
  g.translate(0, 0.5, 0)
  g.computeVertexNormals()
  return g
}
function FarMountains() {
  const geos = useMemo(() => [peakGeo(1), peakGeo(2), peakGeo(3)], [])
  const snow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eef3fa', roughness: 0.6, flatShading: true }), [])
  const rock = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d8a8a', roughness: 0.95, flatShading: true }), [])
  const items = useMemo(() => {
    const r = rng(55)
    return Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2, d = 175 + r() * 80
      return { p: [Math.cos(a) * d, -6, Math.sin(a) * d] as V3, w: 45 + r() * 40, h: 60 + r() * 70, k: i % 3, rot: r() * 6 }
    })
  }, [])
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={it.p} rotation={[0, it.rot, 0]}>
          <mesh geometry={geos[it.k]} scale={[it.w, it.h, it.w]} material={rock} userData={{ noCollide: true }} />
          {it.h > 95 && <mesh geometry={geos[it.k]} position={[0, it.h * 0.72, 0]} scale={[it.w * 0.29, it.h * 0.29, it.w * 0.29]} material={snow} userData={{ noCollide: true }} />}
        </group>
      ))}
    </group>
  )
}

/* =================== rio, margens e cachoeira =================== */
function rippleTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128
  const c = cv.getContext('2d')!
  const gr = c.createLinearGradient(0, 0, 0, 128)
  gr.addColorStop(0, '#3f86a8'); gr.addColorStop(0.5, '#5fb2d0'); gr.addColorStop(1, '#3f86a8')
  c.fillStyle = gr; c.fillRect(0, 0, 256, 128)
  const r = rng(4)
  for (let i = 0; i < 70; i++) {
    const y = 10 + r() * 108, x = r() * 256, w = 20 + r() * 60
    c.strokeStyle = `rgba(230,250,255,${0.15 + r() * 0.35})`; c.lineWidth = 1 + r() * 2
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + w * 0.3, y - 2, x + w * 0.6, y + 2, x + w, y); c.stroke()
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace
  return t
}
function River() {
  const { geo, mat } = useMemo(() => {
    const xs: number[] = []
    for (let x = RIVER.x0 - 4; x <= 150; x += 2) xs.push(x)
    const pos: number[] = [], uv: number[] = [], idx: number[] = []
    xs.forEach((x, i) => {
      const z = riverZ(x)
      pos.push(x, RIVER.water, z - 4.9, x, RIVER.water, z + 4.9)
      uv.push(x / 12, 0, x / 12, 1)
      if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx); g.computeVertexNormals()
    const m = new THREE.MeshStandardMaterial({ map: rippleTex(), transparent: true, opacity: 0.9, roughness: 0.12, metalness: 0.15 })
    return { geo: g, mat: m }
  }, [])
  useFrame((_, dt) => { if (mat.map) mat.map.offset.x -= dt * 0.18 })
  const wx = RIVER.x0 - 3.6, wz = riverZ(wx)
  const top = terrainH(wx - 0.6, wz) + 0.4
  return (
    <group>
      <mesh geometry={geo} material={mat} receiveShadow userData={{ noCollide: true }} />
      <group position={[wx, top, wz]} rotation={[0, 0, 0.36]}>
        <Waterfall position={[0, 0, 0]} rotY={Math.PI / 2} width={6} height={top / Math.cos(0.36) + 1.2} />
      </group>
      <group position={[wx - 0.4, top + 0.6, wz + 2.6]} rotation={[0, 0, 0.4]}>
        <Waterfall position={[0, 0, 0]} rotY={Math.PI / 2 - 0.15} width={2.2} height={top / Math.cos(0.4) + 1.5} />
      </group>
      <Sparkles count={40} scale={[6, 2, 8]} position={[wx + 5.5, 0, wz]} size={7} speed={0.5} color="#ffffff" opacity={0.7} />
    </group>
  )
}
/** Margens com colisão (o NEX não entra no rio). Só as pontes atravessam. */
function RiverBanks() {
  const gaps: [number, number][] = [[-35.55, -32.45], [-2.45, 2.45]]
  const ranges: [number, number][] = []
  let a = -72
  for (const [g0, g1] of gaps) { ranges.push([a, g0]); a = g1 }
  ranges.push([a, 70])
  const blocks: ReactNode[] = []
  ranges.forEach(([x0, x1], ri) => {
    const n = Math.max(1, Math.ceil((x1 - x0) / 3))
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n
      for (const s of [-1, 1]) {
        const za = riverZ(xa) + s * RIVER.bank, zb = riverZ(xb) + s * RIVER.bank
        const len = Math.hypot(xb - xa, zb - za)
        const ext = (i === 0 && ri > 0) || (i === n - 1 && ri < ranges.length - 1) ? 0 : 0.4
        blocks.push(<Block key={ri + '_' + i + '_' + s} size={[0.5, 5, len + ext]} position={[(xa + xb) / 2, 1, (za + zb) / 2]} rotation={[0, Math.atan2(xb - xa, zb - za), 0]} />)
      }
    }
  })
  return <>{blocks}</>
}

/* =================== pontes =================== */
function StoneBridge({ x, zc, L = 6.6, w = 4.6, rise = 0.7 }: { x: number; zc: number; L?: number; w?: number; rise?: number }) {
  const g = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-L, 0); s.lineTo(0, rise); s.lineTo(L, 0); s.lineTo(L, -2.6); s.lineTo(4.4, -2.6)
    s.absellipse(0, -2.6, 4.4, 2.0, 0, Math.PI, false, 0)
    s.lineTo(-L, -2.6); s.lineTo(-L, 0)
    const e = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false, curveSegments: 18 })
    e.translate(0, 0, -w / 2)
    const uv = e.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.25, uv.getY(i) * 0.25)
    return e
  }, [L, w, rise])
  const slope = Math.atan2(rise, L), hl = Math.hypot(L, rise)
  return (
    <group>
      <mesh geometry={g} position={[x, 0, zc]} rotation={[0, Math.PI / 2, 0]} material={[MAT.wall(1), MAT.floor(1)]} castShadow receiveShadow userData={{ noCollide: true }} />
      {[-1, 1].map((sd) => [-1, 1].map((h) => (
        <mesh key={sd + '' + h} position={[x + sd * (w / 2 - 0.15), rise / 2 + 0.35, zc + h * L / 2]} rotation={[h * slope, 0, 0]} material={MAT.stone()} castShadow userData={{ noCollide: true }}>
          <boxGeometry args={[0.35, 0.7, hl]} />
        </mesh>
      )))}
      {[-1, 1].map((sd) => [-1, 1].map((h) => <mesh key={'p' + sd + h} position={[x + sd * (w / 2 - 0.15), 0.6, zc + h * (L - 0.2)]} material={MAT.stoneDark()} castShadow><boxGeometry args={[0.55, 1.2, 0.55]} /></mesh>))}
      <Ramp from={[x, 0, zc + L]} to={[x, rise, zc]} w={w - 0.3} />
      <Ramp from={[x, rise, zc]} to={[x, 0, zc - L]} w={w - 0.3} />
      {[-1, 1].map((sd) => <Block key={sd} size={[0.4, 4, L * 2 + 0.4]} position={[x + sd * (w / 2 + 0.05), 1.5, zc]} />)}
    </group>
  )
}
function WoodBridge({ x, zc, L = 6.2, w = 3, rise = 0.5 }: { x: number; zc: number; L?: number; w?: number; rise?: number }) {
  const planks: ReactNode[] = []
  const n = 26
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, z = zc + L - t * 2 * L, y = rise * (1 - Math.abs(z - zc) / L)
    planks.push(<mesh key={i} position={[x, y - 0.05, z]} rotation={[(z > zc ? 1 : -1) * Math.atan2(rise, L), 0, (i % 3 - 1) * 0.02]} material={MAT.wood()} castShadow receiveShadow><boxGeometry args={[w, 0.1, (2 * L) / n - 0.04]} /></mesh>)
  }
  const posts: ReactNode[] = []
  for (let i = 0; i <= 4; i++) {
    const z = zc + L - (i / 4) * 2 * L, y = rise * (1 - Math.abs(z - zc) / L)
    for (const s of [-1, 1]) posts.push(<mesh key={i + '' + s} position={[x + s * (w / 2 + 0.05), y - 0.4, z]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.14, 2.2, 0.14]} /></mesh>)
  }
  return (
    <group>
      <Batch>{planks}{posts}</Batch>
      {[-1, 1].map((s) => [-1, 1].map((h) => (
        <mesh key={s + '' + h} position={[x + s * (w / 2 + 0.05), rise / 2 + 0.75, zc + h * L / 2]} rotation={[h * Math.atan2(rise, L), 0, 0]} material={MAT.woodDark()} userData={{ noCollide: true }}>
          <boxGeometry args={[0.06, 0.06, Math.hypot(L, rise) + 0.1]} />
        </mesh>
      )))}
      <Ramp from={[x, 0, zc + L]} to={[x, rise, zc]} w={w - 0.2} />
      <Ramp from={[x, rise, zc]} to={[x, 0, zc - L]} w={w - 0.2} />
      {[-1, 1].map((s) => <Block key={s} size={[0.3, 4, L * 2 + 0.4]} position={[x + s * (w / 2 + 0.1), 1.5, zc]} />)}
    </group>
  )
}

/* =================== chegada =================== */
function Arrival() {
  const [x, , z] = P.arrive
  return (
    <group>
      <RoundPlatform position={[0, 0.15, 64]} r={6.5} h={0.6} rep={3} />
      <Portal position={[x, 0, z]} rotY={0} active color="#7fe3ff" s={0.9} />
      <Lantern position={[-3, 0.15, 59]} light />
      <Lantern position={[3, 0.15, 59]} />
      {[-1, 1].map((k) => <Banner key={k} position={[k * 4.6, 0.15, 62]} rotY={k * 0.4} h={3.2} emblem="star" color="#1f5a3a" />)}
      <Sign position={[3.6, 0, 55.6]} rotY={-0.15} text="VALE DOS NÚMEROS" sub="Cada grupo é uma quantidade" />
    </group>
  )
}

/* =================== praça dos números (base) =================== */
function PlazaBase() {
  const [x, y, z] = P.plaza
  return (
    <group>
      <RoundPlatform position={P.plaza} r={12} h={0.6} rep={5} />
      <mesh position={[x, y + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><ringGeometry args={[3.3, 3.5, 64]} /></mesh>
      <mesh position={[x, y + 0.015, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.stoneDark()} userData={{ noCollide: true }}><ringGeometry args={[6.2, 6.5, 64]} /></mesh>
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <mesh key={i} position={[x + Math.cos(a) * 5.1, y + 0.02, z + Math.sin(a) * 5.1]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><circleGeometry args={[0.16, 12]} /></mesh> })}
      {[0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4; return <Lantern key={i} position={[x + Math.cos(a) * 7, y, z + Math.sin(a) * 7]} light={i === 1} /> })}
      {[-1, 1].map((k) => <Banner key={k} position={[k * 3.4, y, z + 11]} h={3.2} emblem="sun" color="#1f5a3a" />)}
      {[-1, 1].map((k) => <Banner key={'n' + k} position={[k * 3.4, y, z - 11]} h={3.2} emblem="sun" color="#1f5a3a" />)}
      <Batch>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2 + 0.2
          if (Math.abs(Math.sin(a)) > 0.93) return null
          return <Bush key={i} position={[x + Math.cos(a) * 13.3, 0, z + Math.sin(a) * 13.3]} flowers={(['A', 'B', 'C'] as const)[i % 3]} s={1.2} />
        })}
      </Batch>
    </group>
  )
}

/* =================== ruínas (base) =================== */
function RuinWall({ from, to, hs, y = 0.15, t = 0.75 }: { from: [number, number]; to: [number, number]; hs: number[]; y?: number; t?: number }) {
  const n = hs.length
  const dx = (to[0] - from[0]) / n, dz = (to[1] - from[1]) / n
  const len = Math.hypot(dx, dz), yaw = Math.atan2(dx, dz)
  return (
    <>
      {hs.map((h, i) => (
        <Solid key={i} position={[from[0] + dx * (i + 0.5), y + h / 2, from[1] + dz * (i + 0.5)]} rotation={[0, yaw, (i % 2 ? 1 : -1) * 0.01]}>
          <mesh material={MAT.wall(1)} castShadow receiveShadow><boxGeometry args={[t, h, len + 0.02]} /></mesh>
          <mesh position={[0, h / 2 + 0.06, 0]} material={MAT.stone()} castShadow><boxGeometry args={[t + 0.12, 0.12, len * (0.6 + (i % 3) * 0.15)]} /></mesh>
        </Solid>
      ))}
    </>
  )
}
function RuinsBase() {
  const y = 0.15
  return (
    <group>
      <RectPlatform position={[0, y, -28]} size={[25, 0.6, 19]} rep={6} />
      <RuinWall from={[-12.2, -18.9]} to={[-3.7, -18.9]} hs={[3.2, 2.6, 1.3, 2.2]} />
      <RuinWall from={[3.7, -18.9]} to={[12.2, -18.9]} hs={[1.1, 2.4, 3.0, 2.0]} />
      <RuinWall from={[-12.2, -37.1]} to={[-3.3, -37.1]} hs={[3.6, 4.2, 3.8, 2.8]} />
      <RuinWall from={[3.3, -37.1]} to={[12.2, -37.1]} hs={[2.4, 3.6, 4.0, 3.4]} />
      <RuinWall from={[-12.1, -37.1]} to={[-12.1, -31.3]} hs={[4.0, 3.4, 2.6]} />
      <RuinWall from={[-12.1, -26.7]} to={[-12.1, -18.9]} hs={[2.0, 2.8, 1.6, 2.4]} />
      <RuinWall from={[12.1, -37.1]} to={[12.1, -31.3]} hs={[2.8, 3.6, 1.8]} />
      <RuinWall from={[12.1, -26.7]} to={[12.1, -18.9]} hs={[1.4, 2.0, 1.0, 2.6]} />
      <Arch position={[0, y, -18.9]} w={7.4} h={5.6} d={1.0} open={4.8} />
      <Arch position={[0, y, -37.1]} w={6.6} h={5} d={1.0} open={4.4} />
      {[[-12.1, -31.6], [-12.1, -26.4], [12.1, -31.6], [12.1, -26.4]].map(([cx, cz], i) => <Column key={i} position={[cx, y, cz]} h={i % 2 ? 4.2 : 3.4} r={0.36} mat="stone" broken={i === 1 || i === 2} />)}
      {[[9.4, -22], [9.4, -26], [9.4, -32.5], [-4.2, -21.2]].map(([cx, cz], i) => <Column key={'c' + i} position={[cx, y, cz]} h={4.6} r={0.34} mat="stone" broken={i % 2 === 1} />)}
      <Batch>
        {[[6, -21.5, 0.6], [10.6, -29.4, 0.5], [-3, -35.6, 0.45], [4.5, -33.8, 0.4], [-11.2, -24, 0.55], [11, -35.4, 0.5], [-5, -19.8, 0.4]].map(([rx, rz, s], i) => (
          <mesh key={i} position={[rx, y + s * 0.5, rz]} rotation={[i, i * 2.1, 0]} scale={[s * 1.4, s, s]} material={MAT.wall(1)} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
        ))}
        {/* coluna caída */}
        <mesh position={[6.5, y + 0.32, -29.6]} rotation={[0, 0.4, Math.PI / 2]} material={MAT.stone()} castShadow><cylinderGeometry args={[0.32, 0.32, 3.2, 14]} /></mesh>
      </Batch>
      <Solid invisible><mesh position={[6.5, y + 0.32, -29.6]} rotation={[0, 0.4, Math.PI / 2]}><cylinderGeometry args={[0.34, 0.34, 3.2, 8]} /></mesh></Solid>
      <Ivy position={[-12.55, y + 3.4, -34]} len={2.2} w={2.6} rotY={-Math.PI / 2} />
      <Ivy position={[-8, y + 4.0, -37.6]} len={2.6} w={3} rotY={Math.PI} />
      <Ivy position={[7, y + 3.0, -18.4]} len={1.8} w={2.4} />
      <Ivy position={[12.55, y + 2.6, -34]} len={1.6} w={2} rotY={Math.PI / 2} />
      <Torch position={[-2.6, y, -20.2]} />
      <Torch position={[2.6, y, -20.2]} />
    </group>
  )
}

/* =================== caverna (casca) =================== */
export const CAVE = { R: 8.5, theta: 0.93, gap: 0.27 }
export const caveDoor = (): V3 => [P.cave[0] + Math.sin(CAVE.theta) * CAVE.R, 0, P.cave[2] + Math.cos(CAVE.theta) * CAVE.R]
function CaveShell() {
  const [cx, , cz] = P.cave
  const { R, theta, gap } = CAVE
  const walls = useMemo(() => {
    const g = new THREE.CylinderGeometry(R - 0.5, R, 6.4, 40, 5, true, theta + gap, Math.PI * 2 - gap * 2)
    const p = g.attributes.position, v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p as any, i)
      const a = Math.atan2(v.x, v.z)
      const k = 1 + 0.05 * Math.sin(a * 6 + v.y * 0.9) + 0.035 * Math.sin(a * 15 + v.y * 2.1)
      p.setXYZ(i, v.x * k, v.y, v.z * k)
    }
    g.computeVertexNormals()
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9, uv.getY(i) * 2)
    return g
  }, [])
  const dome = useMemo(() => {
    const g = new THREE.SphereGeometry(R + 0.2, 40, 10, 0, Math.PI * 2, 0.3, Math.PI / 2 - 0.3)
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 8, uv.getY(i) * 3)
    return g
  }, [])
  const rockMat = useMemo(() => { const m = (MAT.rock(1) as THREE.MeshStandardMaterial).clone(); m.side = THREE.DoubleSide; m.color.set('#b8a898'); return m }, [])
  const mound = useMemo(() => {
    const r = rng(31)
    const out: { p: V3; s: V3; r: V3 }[] = []
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.2
      let d = a - theta; d = Math.atan2(Math.sin(d), Math.cos(d))
      if (Math.abs(d) < 0.55) continue
      const sx = 3 + r() * 2.2, sy = 3.5 + r() * 3.5
      const rad = R + sx * 0.8 + 0.6
      out.push({ p: [cx + Math.sin(a) * rad, sy * 0.5, cz + Math.cos(a) * rad], s: [sx, sy, sx * 1.1], r: [r() * 0.4, r() * 6, r() * 0.4] })
    }
    return out
  }, [])
  const side = (k: number): V3 => [cx + Math.sin(theta + k * (gap + 0.2)) * (R + 1.9), 0, cz + Math.cos(theta + k * (gap + 0.2)) * (R + 1.9)]
  const door = caveDoor()
  const crys: Inst[] = useMemo(() => {
    const r = rng(12), out: Inst[] = []
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2
      let d = a - theta; d = Math.atan2(Math.sin(d), Math.cos(d))
      if (Math.abs(d) < 0.5) continue
      const rad = R - 0.9 - r() * 0.6, h = 0.5 + r() * 1.3
      out.push({ p: [cx + Math.sin(a) * rad, -0.05, cz + Math.cos(a) * rad], s: [h * 0.28, h, h * 0.28], r: [(r() - 0.5) * 0.6, r() * 6, (r() - 0.5) * 0.6] })
    }
    return out
  }, [])
  return (
    <group>
      <Solid>
        <mesh geometry={walls} position={[cx, 3.2, cz]} material={rockMat} castShadow receiveShadow />
        <mesh geometry={dome} position={[cx, 6.1, cz]} scale={[1, 0.5, 1]} material={rockMat} receiveShadow />
      </Solid>
      <mesh position={[cx, 0.03, cz]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.rock(3)} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[R, 40]} /></mesh>
      <Solid>
        {mound.map((m, i) => <mesh key={i} position={m.p} scale={m.s} rotation={m.r} geometry={stoneGeo()} material={MAT.rock(1)} castShadow receiveShadow />)}
        {/* entrada: duas rochas e uma laje por cima */}
        {[-1, 1].map((k) => { const p = side(k); return <mesh key={k} position={[p[0], 3.2, p[2]]} scale={[1.6, 3.6, 1.6]} rotation={[0, theta, 0]} geometry={stoneGeo()} material={MAT.rock(1)} castShadow /> })}
      </Solid>
      <mesh position={[door[0] + Math.sin(theta) * 1.2, 6.9, door[2] + Math.cos(theta) * 1.2]} scale={[3.8, 1.5, 2]} rotation={[0, theta, 0.05]} geometry={stoneGeo()} material={MAT.rock(1)} castShadow userData={{ noCollide: true }} />
      {/* luz que entra pelo óculo */}
      <mesh position={[cx, 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><circleGeometry args={[2.6, 32]} /><meshBasicMaterial color="#e6f2ff" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <Sparkles count={30} scale={[3, 8, 3]} position={[cx, 5, cz]} size={4} speed={0.2} color="#ffffff" opacity={0.6} />
      <Instances geometry={crystalGeo()} material={VM.crystalViolet()} items={crys} />
      <Sparkles count={40} scale={[12, 4, 12]} position={[cx, 2.2, cz]} size={3} speed={0.3} color="#cdb8ff" />
      {QUALITY.q === 'high' && <pointLight position={[cx, 3.2, cz]} color="#9a7cff" intensity={10} distance={14} decay={1.6} />}
      <Torch position={[door[0] + 1.8, 0, door[2] + 1.6]} />
      <Torch position={[door[0] + 2.6, 0, door[2] - 1.2]} />
    </group>
  )
}

/* =================== templo (base) =================== */
function Gable({ position, w, d, h }: { position: V3; w: number; d: number; h: number }) {
  const g = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0)
    const e = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); e.translate(0, 0, -d / 2); return e
  }, [w, d, h])
  return <mesh geometry={g} position={position} rotation={[0, Math.PI / 2, 0]} material={MAT.stoneDark()} castShadow userData={{ noCollide: true }} />
}
export const TEMPLE_DOOR: V3 = [42, 2, -40]
function TempleBase() {
  const [tx, , tz] = P.temple
  const inside = useInside([42, 1, -44.5], [52, 8, -35.5])
  return (
    <group>
      <RectPlatform position={[tx, 1.0, tz]} size={[20, 1.6, 16]} rep={5} />
      <Stairs from={[29.2, 0, tz]} to={[34, 1.0, tz]} w={5} />
      <RectPlatform position={[tx + 2.5, 2.0, tz]} size={[13, 1.2, 11]} rep={4} />
      <Stairs from={[37, 1.0, tz]} to={[40, 2.0, tz]} w={4} />
      <Wall from={[42, 2, -44.5]} to={[42, 2, -41.3]} h={5} t={0.7} />
      <Wall from={[42, 2, -38.7]} to={[42, 2, -35.5]} h={5} t={0.7} />
      <Wall from={[42, 4.7, -41.3]} to={[42, 4.7, -38.7]} h={2.3} t={0.7} />
      <Wall from={[42, 2, -44.5]} to={[52, 2, -44.5]} h={5} />
      <Wall from={[42, 2, -35.5]} to={[52, 2, -35.5]} h={5} />
      <Wall from={[52, 2, -44.5]} to={[52, 2, -35.5]} h={5} />
      <group visible={!inside} userData={{ noBatch: true }}>
        <mesh position={[47, 7.2, tz]} material={MAT.stone()} castShadow userData={{ noCollide: true }}><boxGeometry args={[11.4, 0.4, 10]} /></mesh>
        <Gable position={[47, 7.4, tz]} w={10.6} d={11.6} h={2.4} />
      </group>
      {/* pórtico */}
      {[-43.6, -36.4].map((cz) => <Column key={cz} position={[40.8, 2, cz]} h={5} r={0.32} />)}
      <mesh position={[41, 7.25, tz]} material={MAT.stone()} castShadow userData={{ noCollide: true }}><boxGeometry args={[1.8, 0.5, 9.6]} /></mesh>
      <Text font={FONT.title} fontSize={0.36} position={[40.08, 7.25, tz]} rotation={[0, -Math.PI / 2, 0]} anchorX="center" anchorY="middle" color="#5a3a1a">TEMPLO DOS SÍMBOLOS</Text>
      <Brazier position={[35, 1.0, tz - 6.4]} />
      <Brazier position={[35, 1.0, tz + 6.4]} />
      <Statue position={[36, 1.0, tz - 4]} rotY={-Math.PI / 2} pose="point" s={0.85} />
      <Statue position={[36, 1.0, tz + 4]} rotY={-Math.PI / 2} pose="book" s={0.85} />
      {[[38, -47], [50, -47], [38, -33], [50, -33]].map(([cx, cz], i) => <Column key={i} position={[cx, 1.0, cz]} h={3.4} r={0.3} broken={i === 3} />)}
      <Ivy position={[52.4, 6.4, tz + 2]} len={2.8} w={3} rotY={Math.PI / 2} />
      {QUALITY.q === 'high' && <pointLight position={[47, 4.6, tz]} color="#ffc36a" intensity={7} distance={10} decay={1.8} />}
      <Torch position={[48, 2, -43.6]} />
      <Torch position={[48, 2, -36.4]} />
    </group>
  )
}

/* =================== câmara binária (prédio) =================== */
function ChamberBuilding() {
  const y = 0.15
  const inside = useInside([-12.3, -1, -72.2], [12.3, 9, -56.4])
  const inAnnex = useInside([-19.1, -1, -67.2], [-12.3, 6, -60.8])
  const cs = CSTONE()
  const tiles = useMemo(() => {
    const on: Inst[] = [], off: Inst[] = []
    const r = rng(101)
    for (let ix = -4; ix <= 4; ix++) for (let iz = 0; iz < 7; iz++) {
      if (Math.abs(ix) <= 1 && iz >= 4) continue
      const p: V3 = [ix * 1.9, y + 0.02, -58.2 - iz * 1.9]
      ;(r() < 0.45 ? on : off).push({ p, s: 1 })
    }
    return { on, off }
  }, [])
  const tileGeo = useMemo(() => new THREE.BoxGeometry(1.5, 0.03, 1.5), [])
  const facade = useMemo(() => {
    const on: Inst[] = [], off: Inst[] = []
    const pat = '0110100111010010110101100101'
    let k = 0
    for (const fx of [-10.6, -7.6, 7.6, 10.6]) for (let j = 0; j < 7; j++) { (pat[k++ % pat.length] === '1' ? on : off).push({ p: [fx, y + 1.4 + j * 1.05, -55.27], s: 1 }) }
    return { on, off }
  }, [])
  return (
    <group>
      <RectPlatform position={[0, y, -50]} size={[28, 0.6, 12.4]} rep={6} />
      <RectPlatform position={[0, y, -64]} size={[24.6, 0.6, 16.4]} rep={6} />
      <RectPlatform position={[-15.7, y, -64]} size={[7.2, 0.6, 6.4]} rep={2} />
      {/* fachada */}
      <Arch position={[0, y, -56]} w={9} h={8} d={1.4} open={4.6} mat={cs} />
      <Wall from={[-12.3, y, -56]} to={[-4.5, y, -56]} h={10} t={1.4} mat={cs} />
      <Wall from={[4.5, y, -56]} to={[12.3, y, -56]} h={10} t={1.4} mat={cs} />
      <Wall from={[-4.5, y + 8.3, -56]} to={[4.5, y + 8.3, -56]} h={1.7} t={1.4} mat={cs} />
      <mesh position={[0, y + 10.1, -55.9]} material={MAT.stone()} castShadow><boxGeometry args={[25.2, 0.4, 1.8]} /></mesh>
      {/* paredes */}
      <Wall from={[-12.3, y, -56]} to={[-12.3, y, -62.8]} h={9} mat={cs} />
      <Wall from={[-12.3, y, -65.2]} to={[-12.3, y, -72.2]} h={9} mat={cs} />
      <Wall from={[-12.3, y + 3.3, -62.8]} to={[-12.3, y + 3.3, -65.2]} h={5.7} mat={cs} />
      <Wall from={[12.3, y, -56]} to={[12.3, y, -72.2]} h={9} mat={cs} />
      <Wall from={[-12.3, y, -72.2]} to={[12.3, y, -72.2]} h={9} mat={cs} />
      <group visible={!inside} userData={{ noBatch: true }}>
        <mesh position={[0, y + 9.2, -64.1]} material={cs} castShadow userData={{ noCollide: true }}><boxGeometry args={[25.4, 0.5, 16.8]} /></mesh>
        <mesh position={[0, y + 9.6, -64.1]} material={MAT.stoneDark()} castShadow userData={{ noCollide: true }}><boxGeometry args={[20, 0.4, 12]} /></mesh>
      </group>
      {/* anexo (cofre) */}
      <Wall from={[-19.1, y, -67.2]} to={[-12.3, y, -67.2]} h={5} mat={cs} />
      <Wall from={[-19.1, y, -60.8]} to={[-12.3, y, -60.8]} h={5} mat={cs} />
      <Wall from={[-19.1, y, -67.2]} to={[-19.1, y, -60.8]} h={5} mat={cs} />
      <group visible={!inAnnex && !inside} userData={{ noBatch: true }}>
        <mesh position={[-15.7, y + 5.2, -64]} material={cs} castShadow userData={{ noCollide: true }}><boxGeometry args={[7.4, 0.4, 7]} /></mesh>
      </group>
      {/* pilones da fachada com faixas binárias */}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 14.6, y, -55.4]}>
          <Solid><mesh position={[0, 6, 0]} material={cs} castShadow receiveShadow><boxGeometry args={[2.4, 12, 2.4]} /></mesh></Solid>
          <mesh position={[0, 12.3, 0]} material={MAT.stone()} castShadow><boxGeometry args={[2.8, 0.6, 2.8]} /></mesh>
          <mesh position={[0, 13.1, 0]} geometry={crystalGeo()} scale={[0.5, 1.6, 0.5]} material={VM.crystalBlue()} />
          {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, 2 + i * 1.15, 1.22]} material={(i * 5 + k * 3) % 3 === 0 ? VM.binDim() : VM.binGlow()}><boxGeometry args={[1.2, 0.7, 0.05]} /></mesh>)}
        </group>
      ))}
      {/* faixas binárias na fachada */}
      <Instances geometry={FTILE()} material={VM.binGlow()} items={facade.on} shadow={false} />
      <Instances geometry={FTILE()} material={VM.binDim()} items={facade.off} shadow={false} />
      <CrystalFormation position={[-11.8, y, -45.6]} s={0.9} seed={51} />
      <CrystalFormation position={[11.8, y, -45.6]} s={0.9} seed={52} />
      {/* interior */}
      <Instances geometry={tileGeo} material={TILE_ON()} items={tiles.on} shadow={false} />
      <Instances geometry={tileGeo} material={VM.binDim()} items={tiles.off} shadow={false} />
      {[[-7.5, -60], [7.5, -60], [-7.5, -68.5], [7.5, -68.5]].map(([px, pz], i) => (
        <group key={i} position={[px, y, pz]}>
          <Solid><mesh position={[0, 4.5, 0]} material={cs} castShadow receiveShadow><boxGeometry args={[1.3, 9, 1.3]} /></mesh></Solid>
          {[1.6, 3.6, 5.6].map((h, j) => <mesh key={j} position={[0, h, 0]} material={(i + j) % 2 ? VM.binDim() : VM.binGlow()}><boxGeometry args={[1.36, 0.25, 1.36]} /></mesh>)}
        </group>
      ))}
      {[-1, 1].map((k) => <Text key={k} font={FONT.mono} fontSize={0.5} position={[k * 11.95, y + 6.6, -64]} rotation={[0, -k * Math.PI / 2, 0]} anchorX="center" anchorY="middle" maxWidth={12} lineHeight={1.3} textAlign="center">{'1 0 1 1 0 0 1 0\n0 1 0 0 1 1 0 1\n1 1 0 1 0 1 1 0'}<meshBasicMaterial attach="material" color="#5fc8ff" toneMapped={false} transparent opacity={0.75} /></Text>)}
      <Text font={FONT.title} fontSize={0.5} position={[0, y + 7.6, -71.85]} anchorX="center" anchorY="middle">CÂMARA BINÁRIA<meshBasicMaterial attach="material" color="#bfefff" toneMapped={false} /></Text>
      <Sparkles count={50} scale={[20, 6, 14]} position={[0, 3.5, -64]} size={3} speed={0.3} color="#9fe9ff" />
      {QUALITY.q === 'high' && <pointLight position={[0, 6, -63]} color="#7fd8ff" intensity={14} distance={20} decay={1.6} />}
      {/* rochas que fecham as laterais */}
      <Solid>
        {[[-17, -56, 2.6], [-21, -60, 3.4], [17, -57, 2.8], [19, -62, 3.8], [16, -70, 3.6], [21, -69, 4.4], [-22, -70, 4.2], [-21, -76, 4], [0, -76.5, 4], [-10, -76, 4.2], [10, -76, 4.4]].map(([rx, rz, s], i) => (
          <mesh key={i} position={[rx, s * 0.55, rz]} scale={[s, s * 1.3, s]} rotation={[i, i * 1.7, 0]} geometry={stoneGeo()} material={MAT.rock(1)} castShadow receiveShadow />
        ))}
      </Solid>
      <Lantern position={[-6.5, y, -45.2]} light />
      <Lantern position={[6.5, y, -45.2]} />
    </group>
  )
}

/* =================== trilhas =================== */
function PathSeg({ a, b, w }: { a: [number, number]; b: [number, number]; w: number }) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) + w * 0.6
  const g = useMemo(() => { const p = new THREE.PlaneGeometry(len, w); const uv = p.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 3.2, uv.getY(i) * w / 3.2); return p }, [len, w])
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
  return <mesh geometry={g} position={[mx, terrainH(mx, mz) + 0.03, mz]} rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]} material={MAT.floor(1)} receiveShadow userData={{ noCollide: true }} />
}
function Paths() {
  return <group>{PATHS.map(([ax, az, bx, bz, w], i) => <PathSeg key={i} a={[ax, az]} b={[bx, bz]} w={w} />)}</group>
}

/* =================== pinheiros nas encostas =================== */
function SlopePines() {
  const { cones, trunks } = useMemo(() => {
    const r = rng(303), cones: Inst[] = [], trunks: Inst[] = []
    let tries = 0
    while (cones.length < 300 && tries++ < 6000) {
      const a = r() * Math.PI * 2, e = 0.99 + r() * 0.42
      const x = Math.cos(a) * 70 * e, z = Math.sin(a) * (Math.sin(a) < 0 ? 79 : 73) * e
      if (Math.abs(x) < 24 && z < -60 && z > -82) continue
      if (Math.abs(z - riverZ(x)) < 7) continue
      const y = terrainH(x, z)
      if (y > 34 || y < 1) continue
      const h = 4 + r() * 4, w = 1.1 + r() * 0.7
      const c = ['#3f6a34', '#4f7a3a', '#365f2e', '#5a8240'][Math.floor(r() * 4)]
      cones.push({ p: [x, y + 1.2, z], s: [w, h, w], r: [0, r() * 6, 0], c })
      trunks.push({ p: [x, y, z], s: [0.25, 1.4, 0.25] })
    }
    return { cones, trunks }
  }, [])
  const coneGeo = useMemo(() => { const g = new THREE.ConeGeometry(1, 1, 7); g.translate(0, 0.5, 0); return g }, [])
  const trunkGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.6, 1, 1, 6); g.translate(0, 0.5, 0); return g }, [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }), [])
  return (
    <group>
      <Instances geometry={coneGeo} material={mat} items={cones} />
      <Instances geometry={trunkGeo} material={MAT.bark()} items={trunks} shadow={false} />
    </group>
  )
}

/* =================== vegetação e rochas =================== */
function Vegetation() {
  const fruits: Inst[] = useMemo(() => {
    const r = rng(8), out: Inst[] = []
    for (const [x, z] of ORCHARD) {
      const y = terrainH(x, z)
      for (let i = 0; i < 9; i++) {
        const a = r() * Math.PI * 2, e = 0.2 + r() * 0.9
        out.push({ p: [x + Math.cos(a) * 1.5 * 1.2, y + 3.0 + e * 1.4, z + Math.sin(a) * 1.5 * 1.2], s: 0.13, c: r() < 0.7 ? '#d8322a' : '#f28c1e' })
      }
    }
    return out
  }, [])
  const boulders = useMemo(() => {
    const r = rng(19), out: { p: V3; s: V3; rot: V3 }[] = []
    let tries = 0
    while (out.length < 46 && tries++ < 2000) {
      const a = r() * Math.PI * 2, e = 0.8 + r() * 0.16
      const x = Math.cos(a) * 70 * e, z = Math.sin(a) * (Math.sin(a) < 0 ? 79 : 73) * e
      if (Math.abs(x) < 26 && z < -40) continue
      if (Math.abs(z - riverZ(x)) < 7) continue
      if (Math.hypot(x, z - 64) < 12) continue
      if (Math.hypot(x - P.cave[0], z - P.cave[2]) < 16) continue
      if (x > 26 && x < 57 && z > -51 && z < -29) continue
      if (PATHS.some(([ax, az, bx, bz]) => { const dx = bx - ax, dz = bz - az; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - dx * t, z - az - dz * t) < 4 })) continue
      const s = 0.8 + r() * 2.2
      out.push({ p: [x, terrainH(x, z) + s * 0.25, z], s: [s * 1.2, s * 0.8, s], rot: [r(), r() * 6, r() * 0.5] })
    }
    return out
  }, [])
  return (
    <group>
      <Batch>
        {ORCHARD.map(([x, z], i) => <Tree key={'o' + i} position={[x, terrainH(x, z), z]} kind="round" seed={i + 11} s={1.05 + (i % 3) * 0.1} />)}
        {TREES.map(([x, z, k, s], i) => <Tree key={'t' + i} position={[x, terrainH(x, z), z]} kind={k} seed={i + 40} s={s} />)}
        {Array.from({ length: 26 }, (_, i) => {
          const a = i * 1.93 + 0.4, e = 0.55 + (i % 5) * 0.07
          const x = Math.cos(a) * 70 * e, z = Math.sin(a) * 75 * e
          if (Math.abs(z - riverZ(x)) < 7 || (Math.abs(x) < 16 && z < -16 && z > -40) || Math.hypot(x, z - 36) < 15 || (Math.abs(x) < 25 && z < -41)) return null
          return <Bush key={'b' + i} position={[x, terrainH(x, z), z]} flowers={(['A', 'B', 'C', null] as const)[i % 4]} s={1 + (i % 3) * 0.3} />
        })}
      </Batch>
      <Instances geometry={fruitGeo()} material={VM.fruit()} items={fruits} />
      <Solid>
        <Batch>
          {boulders.map((b, i) => <mesh key={i} position={b.p} scale={b.s} rotation={b.rot} geometry={stoneGeo()} material={MAT.rock(1)} castShadow receiveShadow />)}
        </Batch>
      </Solid>
      {/* cestos de frutas no pomar */}
      {[[-26, 34], [-33, 25], [-45, 16]].map(([x, z], i) => {
        const y = terrainH(x, z)
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.2, 0]} material={VM.wicker()} castShadow><cylinderGeometry args={[0.45, 0.33, 0.4, 14, 1, true]} /></mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={VM.wicker()}><circleGeometry args={[0.33, 14]} /></mesh>
            <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.woodDark()}><torusGeometry args={[0.45, 0.03, 6, 20]} /></mesh>
            {Array.from({ length: 7 }, (_, j) => <mesh key={j} position={[Math.cos(j * 2.4) * 0.2 * Math.sqrt(j), 0.36 + (j % 2) * 0.05, Math.sin(j * 2.4) * 0.2 * Math.sqrt(j)]} scale={0.1} geometry={fruitGeo()}><meshStandardMaterial color={i === 1 ? '#f28c1e' : '#d8322a'} roughness={0.5} /></mesh>)}
          </group>
        )
      })}
    </group>
  )
}

/* =================== mapa completo =================== */
export function ValeMap() {
  return (
    <Batch>
      <Terrain />
      <Boundary />
      <FarMountains />
      <River />
      <RiverBanks />
      <StoneBridge x={0} zc={riverZ(0)} />
      <WoodBridge x={-34} zc={riverZ(-34)} />
      <Arrival />
      <PlazaBase />
      <RuinsBase />
      <CaveShell />
      <TempleBase />
      <ChamberBuilding />
      <Paths />
      <Vegetation />
      <SlopePines />
    </Batch>
  )
}

export { ellip }
