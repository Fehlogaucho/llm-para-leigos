import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text } from '@react-three/drei'
import { Solid } from '../../../world/core'
import { MAT } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'
import type { V3 } from './terrain'

/* Materiais e modelos próprios do Vale dos Números. */

const M = new Map<string, THREE.Material>()
function get<T extends THREE.Material>(k: string, f: () => T): T { if (!M.has(k)) M.set(k, f()); return M.get(k) as T }

export const VM = {
  crystalBlue: () => get('cb', () => new THREE.MeshStandardMaterial({ color: '#8fe0ff', emissive: '#2aa8ff', emissiveIntensity: 1.1, roughness: 0.15, metalness: 0.1, flatShading: true })),
  crystalGold: () => get('cg', () => new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffae2a', emissiveIntensity: 1.9, roughness: 0.2, metalness: 0.2, flatShading: true })),
  crystalViolet: () => get('cv', () => new THREE.MeshStandardMaterial({ color: '#dccbff', emissive: '#8a5cff', emissiveIntensity: 1.5, roughness: 0.15, metalness: 0.1, flatShading: true })),
  crystalDim: () => get('cd', () => new THREE.MeshStandardMaterial({ color: '#7d8da0', emissive: '#1a3550', emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.1, flatShading: true })),
  stone: () => get('st', () => new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.9, flatShading: true })),
  fruit: () => get('fr', () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 })),
  leaf: () => get('lf', () => new THREE.MeshStandardMaterial({ color: '#4f8a34', roughness: 0.8, flatShading: true })),
  wicker: () => get('wk', () => new THREE.MeshStandardMaterial({ color: '#a8743a', roughness: 0.85, side: THREE.DoubleSide })),
  burlap: () => get('bl', () => new THREE.MeshStandardMaterial({ color: '#c9a66b', roughness: 0.95, flatShading: true })),
  cloth: () => get('cl', () => new THREE.MeshStandardMaterial({ color: '#8a3a2e', roughness: 0.95 })),
  flame: () => get('fl', () => new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ff8a2a', emissiveIntensity: 4, roughness: 0.5 })),
  obsidian: () => get('ob', () => new THREE.MeshStandardMaterial({ color: '#1d2433', roughness: 0.25, metalness: 0.4 })),
  grassBlade: () => get('gb', () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true })),
  moss: () => get('ms', () => new THREE.MeshStandardMaterial({ color: '#5d7d3a', roughness: 0.95, flatShading: true })),
  binGlow: () => get('bg', () => new THREE.MeshStandardMaterial({ color: '#9fe9ff', emissive: '#3fb8ff', emissiveIntensity: 2.4, roughness: 0.4 })),
  doorStone: () => get('ds', () => new THREE.MeshStandardMaterial({ color: '#2c3850', roughness: 0.75, metalness: 0.05 })),
  binDim: () => get('bd', () => new THREE.MeshStandardMaterial({ color: '#2a3a52', emissive: '#0c2a44', emissiveIntensity: 0.6, roughness: 0.5 })),
}

/* ---------- geometrias ---------- */
const G = new Map<string, THREE.BufferGeometry>()
const geo = (k: string, f: () => THREE.BufferGeometry) => { if (!G.has(k)) G.set(k, f()); return G.get(k)! }

/** Cristal hexagonal de altura 1 (base em y = 0). */
export const crystalGeo = () => geo('crystal', () => new THREE.LatheGeometry([[0, 0], [0.5, 0.04], [0.6, 0.22], [0.58, 0.76], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y)), 6))
export const stoneGeo = () => geo('stone', () => new THREE.DodecahedronGeometry(1, 0))
export const fruitGeo = () => geo('fruit', () => new THREE.SphereGeometry(1, 10, 8))
export const torchStickGeo = () => geo('tstick', () => { const g = new THREE.CylinderGeometry(0.04, 0.055, 1.2, 6); g.translate(0, 0.6, 0); return g })
export const torchFlameGeo = () => geo('tflame', () => { const g = new THREE.ConeGeometry(0.1, 0.32, 6); g.translate(0, 1.36, 0); return g })
export const torchCupGeo = () => geo('tcup', () => { const g = new THREE.CylinderGeometry(0.11, 0.06, 0.14, 8); g.translate(0, 1.22, 0); return g })
export const matGeo = () => geo('mat', () => { const g = new THREE.CircleGeometry(1, 20); g.rotateX(-Math.PI / 2); g.translate(0, 0.03, 0); return g })
/** Tufo de grama: 5 lâminas finas. */
export const tuftGeo = () => geo('tuft', () => {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 5; i++) {
    const c = new THREE.ConeGeometry(0.05, 0.55 + (i % 3) * 0.12, 3)
    c.translate(0, 0.3, 0)
    c.rotateZ((i - 2) * 0.22)
    c.rotateY(i * 1.3)
    c.translate(Math.cos(i * 2.4) * 0.08, 0, Math.sin(i * 2.4) * 0.08)
    parts.push(c.toNonIndexed())
  }
  const pos: number[] = []
  parts.forEach((p) => pos.push(...(p.attributes.position.array as Float32Array)))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
})

/* ---------- instâncias ---------- */
export interface Inst { p: V3; s: V3 | number; r?: V3; c?: string }
/** Muitas cópias da mesma malha (uma única chamada de desenho). Não colide. */
export function Instances({ geometry, material, items, shadow = true, receive = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Inst[]; shadow?: boolean; receive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const m = ref.current
    const o = new THREE.Object3D(), col = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(...it.p)
      if (typeof it.s === 'number') o.scale.setScalar(it.s); else o.scale.set(...it.s)
      o.rotation.set(...(it.r || [0, 0, 0]))
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      if (it.c) m.setColorAt(i, col.set(it.c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={shadow} receiveShadow={receive} userData={{ noCollide: true }} />
}

/* ---------- cristal avulso ---------- */
export function Crystal({ position, s = 1, rot = [0, 0, 0], mat }: { position: V3; s?: number | V3; rot?: V3; mat?: THREE.Material }) {
  return <mesh geometry={crystalGeo()} position={position} scale={typeof s === 'number' ? [s * 0.35, s, s * 0.35] : s} rotation={rot} material={mat || VM.crystalBlue()} castShadow userData={{ noCollide: true }} />
}

/** Formação grande de cristais (com colisão aproximada). */
export function CrystalFormation({ position, s = 1, seed = 1, mat }: { position: V3; s?: number; seed?: number; mat?: THREE.Material }) {
  const items = useMemo(() => {
    let k = seed * 9301 + 49297
    const r = () => { k = (k * 16807) % 2147483647; return k / 2147483647 }
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + r(), d = i === 0 ? 0 : 0.5 + r() * 0.6
      const h = i === 0 ? 2.6 : 0.9 + r() * 1.5
      return { p: [Math.cos(a) * d, -0.1, Math.sin(a) * d] as V3, h, tilt: [Math.sin(a) * d * 0.45, 0, -Math.cos(a) * d * 0.45] as V3 }
    })
  }, [seed])
  return (
    <group position={position} scale={s}>
      {items.map((it, i) => <mesh key={i} geometry={crystalGeo()} position={it.p} rotation={[it.tilt[2], i, it.tilt[0]]} scale={[it.h * 0.24, it.h, it.h * 0.24]} material={mat || VM.crystalBlue()} castShadow userData={{ noCollide: true }} />)}
      <mesh position={[0, 0.1, 0]} scale={[1.2, 0.35, 1.1]} geometry={stoneGeo()} material={MAT.rock(1)} castShadow receiveShadow userData={{ noCollide: true }} />
      <Solid invisible><mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.9, 1.1, 2.4, 8]} /></mesh></Solid>
    </group>
  )
}

/* ---------- totem numérico ---------- */
/** Totem de pedra com painel escuro: mostra pontos (quantidade) e, aceso, o número. */
export function Totem({ position, rotY = 0, h = 4.4, w = 1.1, value = '', lit = false, dots = 0, color = '#ffd27a', size, idle, children }: {
  position: V3; rotY?: number; h?: number; w?: number; value?: string; lit?: boolean; dots?: number; color?: string; size?: number; idle?: string; children?: ReactNode
}) {
  const k = useRef(lit ? 1 : 0)
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.4 }), [color])
  const txt = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => {
    k.current += ((lit ? 1 : 0) - k.current) * Math.min(1, dt * 2.2)
    glow.emissiveIntensity = 0.15 + k.current * 2.6
    if (txt.current) { const s = Math.max(0.001, k.current); txt.current.scale.setScalar(s * (1 + Math.sin(RT.time * 2) * 0.02)); txt.current.visible = k.current > 0.02 }
    if (ring.current) { ring.current.rotation.z += dt * 0.6; ring.current.visible = k.current > 0.05; ring.current.scale.setScalar(0.6 + k.current * 0.4) }
  })
  const r = (w / 2) * Math.SQRT2
  const panelH = h * 0.62
  const dotPos = useMemo(() => {
    const out: [number, number][] = []
    const cols = dots <= 4 ? dots : dots <= 9 ? 3 : 4
    const rows = Math.ceil(dots / Math.max(1, cols))
    for (let i = 0; i < dots; i++) { const cx = i % cols, cy = Math.floor(i / cols); out.push([(cx - (cols - 1) / 2) * 0.2, -(cy - (rows - 1) / 2) * 0.2]) }
    return out
  }, [dots])
  const fs = size ?? (value.length <= 2 ? 0.62 : value.length === 3 ? 0.46 : 0.36)
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        <mesh position={[0, 0.2, 0]} material={MAT.stoneDark()} castShadow receiveShadow><boxGeometry args={[w * 1.6, 0.4, w * 1.6]} /></mesh>
        <mesh position={[0, 0.4 + h / 2, 0]} rotation={[0, Math.PI / 4, 0]} material={MAT.wall(1)} castShadow receiveShadow><cylinderGeometry args={[r * 0.82, r, h, 4]} /></mesh>
      </Solid>
      <mesh position={[0, 0.4 + h + 0.35, 0]} rotation={[0, Math.PI / 4, 0]} material={MAT.stone()} castShadow><coneGeometry args={[r * 0.95, 0.7, 4]} /></mesh>
      <mesh position={[0, 0.4 + h + 0.95, 0]} geometry={crystalGeo()} scale={[0.16, 0.5, 0.16]} material={glow} />
      {/* painel */}
      <group position={[0, 0.4 + h * 0.56, w * 0.47]}>
        <mesh material={MAT.gold()}><boxGeometry args={[w * 0.82, panelH + 0.08, 0.05]} /></mesh>
        <mesh position={[0, 0, 0.03]} material={VM.obsidian()}><boxGeometry args={[w * 0.72, panelH, 0.04]} /></mesh>
        {dotPos.map(([x, y], i) => <mesh key={i} position={[x, y - panelH * 0.27, 0.07]} material={glow}><sphereGeometry args={[0.065, 10, 8]} /></mesh>)}
        <group ref={txt} position={[0, dots ? panelH * 0.2 : 0, 0.07]}>
          <Text font={FONT.title} fontSize={fs} anchorX="center" anchorY="middle" maxWidth={w * 0.7}>{value}<meshBasicMaterial attach="material" color="#fff1c4" toneMapped={false} /></Text>
        </group>
        {idle && !lit && <Text font={FONT.title} fontSize={fs} position={[0, dots ? panelH * 0.2 : 0, 0.065]} anchorX="center" anchorY="middle">{idle}<meshBasicMaterial attach="material" color="#5a6478" toneMapped={false} /></Text>}
        <mesh ref={ring} position={[0, dots ? panelH * 0.2 : 0, 0.06]}><ringGeometry args={[0.36, 0.4, 32, 1, 0, Math.PI * 1.6]} /><meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.7} /></mesh>
      </group>
      {lit && <Sparkles count={14} scale={[w * 2, h, w * 2]} position={[0, h / 2 + 0.4, 0]} size={4} speed={0.4} color={color} />}
      {children}
    </group>
  )
}

/* ---------- saco, caixa e baú (máquina de agrupar) ---------- */
export function Sack({ position, s = 1 }: { position?: V3; s?: number }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.26, 0]} scale={[0.26, 0.28, 0.26]} geometry={stoneGeo()} material={VM.burlap()} castShadow />
      <mesh position={[0, 0.55, 0]} material={VM.burlap()}><coneGeometry args={[0.1, 0.16, 6]} /></mesh>
      <mesh position={[0, 0.5, 0]} material={MAT.woodDark()}><torusGeometry args={[0.07, 0.02, 6, 12]} /></mesh>
    </group>
  )
}
export function Crate({ position, s = 1 }: { position?: V3; s?: number }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.3, 0]} material={MAT.wood()} castShadow><boxGeometry args={[0.6, 0.6, 0.6]} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[0, 0.3, k * 0.305]} material={MAT.woodDark()}><boxGeometry args={[0.62, 0.08, 0.02]} /></mesh>)}
      {[-1, 1].map((k) => <mesh key={'v' + k} position={[k * 0.305, 0.3, 0]} material={MAT.woodDark()}><boxGeometry args={[0.02, 0.62, 0.62]} /></mesh>)}
    </group>
  )
}
export function Chest({ position, s = 1, open = 0, glow = false, lidRef }: { position?: V3; s?: number; open?: number; glow?: boolean; lidRef?: React.Ref<THREE.Group> }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.28, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[1, 0.56, 0.66]} /></mesh>
      {[-0.42, 0.42].map((x) => <mesh key={x} position={[x, 0.28, 0]} material={MAT.gold()}><boxGeometry args={[0.07, 0.58, 0.68]} /></mesh>)}
      <group ref={lidRef} position={[0, 0.56, -0.33]} rotation={[-open * 1.6, 0, 0]}>
        <mesh position={[0, 0.06, 0.33]} rotation={[0, 0, Math.PI / 2]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.33, 0.33, 1, 12, 1, false, 0, Math.PI]} /></mesh>
        <mesh position={[0, 0.06, 0.33]} rotation={[0, 0, Math.PI / 2]} material={MAT.gold()}><cylinderGeometry args={[0.335, 0.335, 0.08, 12, 1, false, 0, Math.PI]} /></mesh>
      </group>
      <mesh position={[0, 0.4, 0.34]} material={MAT.gold()}><boxGeometry args={[0.14, 0.16, 0.03]} /></mesh>
      {glow && <mesh position={[0, 0.62, 0]} material={VM.crystalGold()}><boxGeometry args={[0.8, 0.04, 0.5]} /></mesh>}
    </group>
  )
}

/* ---------- placa de madeira com texto ---------- */
export function Sign({ position, rotY = 0, text, sub }: { position: V3; rotY?: number; text: string; sub?: string }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        {[-1.05, 1.05].map((x) => <mesh key={x} position={[x, 0.9, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.14, 1.8, 0.14]} /></mesh>)}
      </Solid>
      <mesh position={[0, 1.55, 0]} material={MAT.wood()} castShadow><boxGeometry args={[2.6, 0.9, 0.1]} /></mesh>
      <Text font={FONT.title} fontSize={0.26} position={[0, 1.66, 0.06]} anchorX="center" anchorY="middle" color="#3a2412">{text}</Text>
      {sub && <Text font={FONT.body} fontSize={0.15} position={[0, 1.36, 0.06]} anchorX="center" anchorY="middle" color="#4a3018">{sub}</Text>}
    </group>
  )
}

/* ---------- tocha avulsa ---------- */
export function Torch({ position, s = 1 }: { position: V3; s?: number }) {
  const f = useRef<THREE.Mesh>(null!)
  useFrame(() => { if (f.current) { const k = 0.9 + Math.sin(RT.time * 11 + position[0]) * 0.1; f.current.scale.set(k, k * (1 + Math.sin(RT.time * 7 + position[2]) * 0.15), k) } })
  return (
    <group position={position} scale={s}>
      <mesh geometry={torchStickGeo()} material={MAT.woodDark()} castShadow />
      <mesh geometry={torchCupGeo()} material={MAT.bronzeDark()} />
      <group position={[0, 1.24, 0]} userData={{ noBatch: true }}><mesh ref={f} position={[0, -1.24, 0]} geometry={torchFlameGeo()} material={VM.flame()} /></group>
    </group>
  )
}

/** Mostrador de 0/1 que acende. */
export function BinDigit({ position, on, size = 0.8, rotY = 0 }: { position: V3; on: boolean; size?: number; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh material={on ? VM.binGlow() : VM.binDim()}><boxGeometry args={[size * 0.8, size * 1.05, 0.06]} /></mesh>
      <Text font={FONT.mono} fontSize={size * 0.8} position={[0, 0, 0.05]} anchorX="center" anchorY="middle">{on ? '1' : '0'}<meshBasicMaterial attach="material" color={on ? '#06243a' : '#6f8fb0'} toneMapped={false} /></Text>
    </group>
  )
}
