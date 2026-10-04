import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Solid, useFlag } from '../../../world/core'
import { Batch } from '../../../world/Architecture'
import { MAT, toon } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { stoneTiles } from '../../../world/textures'
import { RT } from '../../../engine/runtime'
import { G } from '../../../store'
import { EraPlaque } from '../observatorio/Eras'
import { STOPS, PEOPLE } from './stops'
import { Holo, holo } from './people'
import { VILLAGE as V, STOP_Z, type V3 } from './layout'

/* =========================================================
   FASE 1 · PARTE 2 — A vila do arroz (China antiga)
   Cenário do “Mistério dos Três Grãos”: arrozais, casas de telhado
   curvo, a banca do comerciante, os três registros, os cestos com
   “?”, a balança e a mesa de madeira onde o mistério é resolvido.
   ========================================================= */
export const GRAIN = { B: '#4fd18b', M: '#ffd25a', F: '#ff6a5a' } as const
export type GK = keyof typeof GRAIN
export const RECORDS: { n: [number, number, number]; total: number }[] = [
  { n: [3, 2, 1], total: 39 },
  { n: [2, 3, 1], total: 34 },
  { n: [1, 2, 3], total: 26 },
]
export const VALUES = { B: '9,25', M: '4,25', F: '2,75' }
const FACE = -Math.PI / 2 // de frente para a estrada (olhando para −x)

const cache: Record<string, THREE.Material> = {}
const mm = <T extends THREE.Material>(k: string, f: () => T) => (cache[k] || (cache[k] = f())) as T
const earth = () => mm('vEarth', () => { const t = stoneTiles('vEarthT', '#c99a62', '#a8794a', 2); const map = t.map.clone(); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(3, 7); map.needsUpdate = true; return toon({ map }) })
const dike = () => mm('vDike', () => toon({ color: '#8a6a42' }))
const water = () => mm('vWater', () => new THREE.MeshStandardMaterial({ color: '#5fa8a0', roughness: 0.1, metalness: 0.2, emissive: '#1a4a48', emissiveIntensity: 0.3 }))
const rice = () => mm('vRice', () => toon({ color: '#79c24a' }))
const straw = () => mm('vStraw', () => toon({ color: '#d8b45a' }))
const redPillar = () => mm('vRedP', () => toon({ color: '#c0392b' }))
const roofTile = () => mm('vRoof', () => toon({ color: '#3e4258' }))
const plaster = () => mm('vPlaster', () => toon({ color: '#f1e4c8' }))
const wood = () => mm('vWood', () => toon({ color: '#8a5a34' }))
const woodLight = () => mm('vWoodL', () => toon({ color: '#b8834e' }))
const board = () => mm('vBoard', () => toon({ color: '#f3e3bd' }))
const cloth = () => mm('vCloth', () => toon({ color: '#c8423a', side: THREE.DoubleSide }))
const grainMat = (k: GK) => mm('vGrain' + k, () => new THREE.MeshStandardMaterial({ color: GRAIN[k], emissive: GRAIN[k], emissiveIntensity: 0.35, roughness: 0.6 }))

/* ---------- peças ---------- */
/** Feixe de arroz: talos de palha amarrados com a espiga colorida (verde, amarela ou vermelha). */
export function Sheaf({ k, position, s = 1, rotY = 0 }: { k: GK; position: V3; s?: number; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={s}>
      {/* talos abertos embaixo, amarrados no meio */}
      {[0, 1, 2, 3, 4, 5].map((j) => { const a = (j / 6) * Math.PI * 2; return <mesh key={j} position={[Math.cos(a) * 0.045, 0.22, Math.sin(a) * 0.045]} rotation={[-Math.sin(a) * 0.14, 0, Math.cos(a) * 0.14]} material={straw()}><cylinderGeometry args={[0.011, 0.011, 0.46, 5]} /></mesh> })}
      <mesh position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} material={wood()}><torusGeometry args={[0.042, 0.014, 5, 12]} /></mesh>
      {/* espigas caídas para os lados */}
      {[0, 1, 2].map((j) => { const a = (j / 3) * Math.PI * 2 + 0.4; return <mesh key={j} position={[Math.cos(a) * 0.06, 0.47, Math.sin(a) * 0.06]} rotation={[-Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9]} scale={[1, 1.8, 1]} material={grainMat(k)}><sphereGeometry args={[0.042, 8, 6]} /></mesh> })}
      <mesh position={[0, 0.5, 0]} scale={[1, 1.6, 1]} material={grainMat(k)}><sphereGeometry args={[0.045, 8, 6]} /></mesh>
    </group>
  )
}

function House({ position, rotY = FACE, w = 3.2, d = 2.6 }: { position: V3; rotY?: number; w?: number; d?: number }) {
  // Dez faces mantém o desenho leve, mas tira a silhueta de caixa das casas.
  const roof = useMemo(() => { const g = new THREE.CylinderGeometry(0.42, 1, 0.72, 10); g.rotateY(Math.PI / 10); return g }, [])
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        <mesh position={[0, 0.15, 0]} scale={[(w + 0.4) / 2.24, 1, (d + 0.4) / 2.24]} material={MAT.stoneDark()} receiveShadow><cylinderGeometry args={[1.05, 1.12, 0.3, 10]} /></mesh>
        <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 10, 0]} scale={[w / 2.1, 1, d / 2.1]} material={plaster()} castShadow receiveShadow><cylinderGeometry args={[1, 1.05, 2.0, 10]} /></mesh>
      </Solid>
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <group key={sx + '_' + sz} position={[sx * (w / 2 + 0.03), 0, sz * (d / 2 + 0.03)]}>
          <mesh position={[0, 1.3, 0]} material={redPillar()} castShadow><cylinderGeometry args={[0.09, 0.11, 2.0, 8]} /></mesh>
          <mesh position={[0, 2.32, 0]} scale={[1, 0.65, 1]} material={redPillar()}><sphereGeometry args={[0.13, 8, 6]} /></mesh>
        </group>
      )))}
      <mesh position={[0, 2.25, 0]} scale={[(w + 0.16) / 2.1, 1, (d + 0.16) / 2.1]} material={wood()}><cylinderGeometry args={[1, 1.05, 0.12, 10]} /></mesh>
      {/* Camadas facetadas fazem um beiral macio, sem abandonar o low-poly. */}
      <mesh position={[0, 2.4, 0]} scale={[w * 0.56, 1, d * 0.62]} material={roofTile()} castShadow><cylinderGeometry args={[1.04, 1.13, 0.16, 10]} /></mesh>
      <mesh geometry={roof} position={[0, 2.82, 0]} scale={[w * 0.55, 1, d * 0.60]} material={roofTile()} castShadow />
      <mesh position={[0, 3.22, 0]} scale={[w * 0.38, 1, d * 0.37]} material={roofTile()}><cylinderGeometry args={[0.58, 0.64, 0.1, 10]} /></mesh>
      <mesh position={[0, 3.42, 0]} material={roofTile()}><coneGeometry args={[0.13, 0.32, 8]} /></mesh>
      {/* porta e janelas com relevo arredondado (lado da frente = +z local) */}
      <mesh position={[0, 1.02, d / 2 + 0.035]} scale={[0.46, 0.72, 0.055]} material={wood()} castShadow><sphereGeometry args={[1, 8, 6]} /></mesh>
      <mesh position={[0, 1.02, d / 2 + 0.096]} material={woodLight()}><torusGeometry args={[0.27, 0.018, 5, 10]} /></mesh>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * w * 0.3, 1.45, d / 2 + 0.04]}>
          <mesh scale={[0.29, 0.27, 0.045]} material={MAT.dark()}><sphereGeometry args={[1, 8, 6]} /></mesh>
          <mesh position={[0, 0, 0.05]} material={woodLight()}><cylinderGeometry args={[0.018, 0.018, 0.38, 6]} /></mesh>
        </group>
      ))}
    </group>
  )
}

/** Arrozal: canteiro alagado com mudas em fileiras. */
function Paddy({ x0, x1, z0, z1 }: { x0: number; x1: number; z0: number; z1: number }) {
  const w = x1 - x0, d = z0 - z1, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
  const tufts = useRef<THREE.InstancedMesh>(null!)
  const pts = useMemo(() => { const out: [number, number][] = []; for (let x = x0 + 0.5; x < x1 - 0.3; x += 0.55) for (let z = z1 + 0.5; z < z0 - 0.3; z += 0.6) out.push([x + ((z * 13) % 0.1), z]); return out }, [x0, x1, z0, z1])
  const geo = useMemo(() => { const g = new THREE.ConeGeometry(0.09, 0.42, 5); g.translate(0, 0.21, 0); return g }, [])
  useLayoutEffect(() => {
    const im = tufts.current; if (!im) return
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
    pts.forEach(([x, z], k) => { e.set(((k * 7) % 5 - 2) * 0.06, k, ((k * 3) % 5 - 2) * 0.06); q.setFromEuler(e); const s = 0.8 + ((k * 11) % 5) * 0.08; m.compose(new THREE.Vector3(x, 0.02, z), q, new THREE.Vector3(s, s, s)); im.setMatrixAt(k, m) })
    im.instanceMatrix.needsUpdate = true
  }, [pts])
  return (
    <group>
      <mesh position={[cx, 0.03, cz]} rotation={[-Math.PI / 2, 0, 0]} material={water()} receiveShadow userData={{ noCollide: true }}><planeGeometry args={[w, d]} /></mesh>
      {[[cx, z0, w + 0.3, 0.3], [cx, z1, w + 0.3, 0.3]].map(([x, z, a, b], k) => <mesh key={'h' + k} position={[x, 0.08, z]} material={dike()} userData={{ noCollide: true }}><boxGeometry args={[a, 0.16, b]} /></mesh>)}
      {[[x0, cz], [x1, cz]].map(([x, z], k) => <mesh key={'v' + k} position={[x, 0.08, z]} material={dike()} userData={{ noCollide: true }}><boxGeometry args={[0.3, 0.16, d]} /></mesh>)}
      <instancedMesh ref={tufts} args={[geo, rice(), pts.length]} userData={{ noCollide: true, noBatch: true }} castShadow />
    </group>
  )
}

/** Portal de madeira vermelha na entrada da vila (atravessa a estrada). */
function Gate({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.3, 0, 0]}>
          <Solid><mesh position={[0, 2.1, 0]} material={redPillar()} castShadow><cylinderGeometry args={[0.18, 0.2, 4.2, 10]} /></mesh></Solid>
          <mesh position={[0, 0.2, 0]} material={MAT.stoneDark()}><cylinderGeometry args={[0.32, 0.36, 0.4, 10]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 3.55, 0]} material={redPillar()} castShadow><boxGeometry args={[7.4, 0.28, 0.3]} /></mesh>
      <mesh position={[0, 4.15, 0]} material={redPillar()} castShadow><boxGeometry args={[8.0, 0.3, 0.34]} /></mesh>
      <mesh position={[0, 4.42, 0]} scale={[9.0, 0.22, 1.1]} material={roofTile()} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 4.4, 4.6, 0]} rotation={[0, 0, s * 0.7]} material={roofTile()}><coneGeometry args={[0.12, 0.5, 6]} /></mesh>)}
      <mesh position={[0, 3.86, 0.18]} material={MAT.woodDark()}><boxGeometry args={[3.2, 0.5, 0.06]} /></mesh>
      <Text font={FONT.title} fontSize={0.26} position={[0, 3.86, 0.22]} color="#ffd27a" anchorX="center" anchorY="middle">VILA DOS TRÊS GRÃOS</Text>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 2.2, 3.05, 0]} scale={[1, 1.3, 1]} material={MAT.glowWarm()}><sphereGeometry args={[0.22, 12, 10]} /></mesh>)}
    </group>
  )
}

/** Banca do comerciante: balcão, toldo e sacos de arroz. */
function Stall({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Solid><mesh position={[0, 0.5, 0]} scale={[0.47, 1, 1.28]} material={woodLight()} castShadow receiveShadow><cylinderGeometry args={[1, 1.08, 1.0, 8]} /></mesh></Solid>
      <mesh position={[0, 1.02, 0]} scale={[0.5, 1, 1.34]} material={wood()}><cylinderGeometry args={[1.05, 1.12, 0.08, 10]} /></mesh>
      {[[-0.4, -1.3], [-0.4, 1.3], [1.7, -1.3], [1.7, 1.3]].map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          <mesh position={[0, 1.3, 0]} material={wood()} castShadow><cylinderGeometry args={[0.055, 0.07, 2.6, 8]} /></mesh>
          <mesh position={[0, 2.62, 0]} material={woodLight()}><sphereGeometry args={[0.09, 8, 6]} /></mesh>
        </group>
      ))}
      <mesh position={[0.65, 2.62, 0]} rotation={[0, 0, 0.2]} scale={[1.46, 0.14, 1.66]} material={cloth()} castShadow><sphereGeometry args={[1, 10, 6]} /></mesh>
      <mesh position={[0.65, 2.49, 0]} rotation={[0, 0, 0.2]} scale={[1.38, 1, 1.56]} material={cloth()}><torusGeometry args={[1, 0.025, 5, 10]} /></mesh>
      {/* espigas sobre o balcão */}
      {(['B', 'M', 'F'] as GK[]).map((k, j) => <Sheaf key={k} k={k} position={[0, 1.05, -0.8 + j * 0.8]} s={1.1} />)}
      {[[0.6, -1.7], [1.1, -1.65], [0.8, 1.75]].map(([x, z], k) => <mesh key={k} position={[x, 0.35, z]} scale={[1, 1.2, 1]} material={MAT.cloth('#c9a46a')} castShadow><sphereGeometry args={[0.32, 10, 8]} /></mesh>)}
    </group>
  )
}

/** Um registro do comerciante: os feixes da mistura e quanto ela produziu. */
function RecordBoard({ k, z }: { k: number; z: number }) {
  const r = RECORDS[k]
  const items: GK[] = []
  ;(['B', 'M', 'F'] as GK[]).forEach((g, j) => { for (let n = 0; n < r.n[j]; n++) items.push(g) })
  return (
    <group position={[V.boardX, 0, z]} rotation={[0, FACE, 0]}>
      {[-1, 1].map((s) => <Solid key={s}><mesh position={[s * 0.85, 1.25, -0.06]} material={wood()} castShadow><boxGeometry args={[0.12, 2.5, 0.12]} /></mesh></Solid>)}
      <mesh position={[0, 1.75, 0]} material={board()} castShadow><boxGeometry args={[1.7, 1.25, 0.06]} /></mesh>
      <mesh position={[0, 2.48, 0]} material={roofTile()}><boxGeometry args={[2.0, 0.1, 0.3]} /></mesh>
      <Text font={FONT.title} fontSize={0.14} position={[0, 2.22, 0.04]} color="#7a3a10" anchorX="center">{`REGISTRO ${k + 1}`}</Text>
      {items.map((g, j) => <Sheaf key={j} k={g} position={[(j - (items.length - 1) / 2) * 0.24, 1.48, 0.06]} s={0.85} />)}
      <Text font={FONT.title} fontSize={0.2} position={[0, 1.3, 0.04]} color="#3a2010" anchorX="center">{`= ${r.total} dou`}</Text>
    </group>
  )
}

/** Cesto de um tipo de arroz com o valor escondido (“?”), revelado no fim. */
function Basket({ k, position, label }: { k: GK; position: V3; label: string }) {
  const r1 = useFlag('g2_rev'), r2 = useFlag('l1_tabela')
  const rev = r1 || r2
  const q = useRef<THREE.Group>(null!)
  useFrame(() => { if (q.current) { q.current.position.y = 1.85 + Math.sin(RT.time * 2 + position[0]) * 0.06; if (RT.camera) q.current.lookAt(RT.camera.position.x, q.current.position.y + position[1], RT.camera.position.z) } })
  return (
    <group position={position}>
      <Solid><mesh position={[0, 0.3, 0]} material={MAT.cloth('#a8783e')} castShadow><cylinderGeometry args={[0.48, 0.38, 0.6, 14]} /></mesh></Solid>
      <mesh position={[0, 0.62, 0]} material={MAT.cloth('#7a5428')}><torusGeometry args={[0.47, 0.04, 6, 18]} /></mesh>
      <mesh position={[0, 0.62, 0]} scale={[1, 0.45, 1]} material={grainMat(k)}><sphereGeometry args={[0.44, 14, 10]} /></mesh>
      <mesh position={[0, 0.25, 0.5]} material={board()}><boxGeometry args={[0.8, 0.26, 0.04]} /></mesh>
      <Text font={FONT.title} fontSize={0.12} position={[0, 0.25, 0.525]} color="#3a2010" anchorX="center" anchorY="middle">{label}</Text>
      <group ref={q} userData={{ noBatch: true }}>
        <Text font={FONT.title} fontSize={rev ? 0.42 : 0.6} color={GRAIN[k]} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#1a1020">{rev ? VALUES[k] : '?'}</Text>
        {rev ? <Text font={FONT.title} fontSize={0.16} position={[0, -0.3, 0]} color="#fff3d6" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#1a1020">dou</Text> : null}
      </group>
    </group>
  )
}

/** Balança de dois pratos: no desafio final aparecem seis feixes médios. */
function Scale({ position }: { position: V3 }) {
  const six = useFlag('g2_six'), pred = useFlag('g2_pred')
  const beam = useRef<THREE.Group>(null!)
  const panL = useRef<THREE.Group>(null!), panR = useRef<THREE.Group>(null!)
  useFrame(() => {
    const tilt = six ? 0.16 + Math.sin(RT.time * 1.5) * 0.015 : Math.sin(RT.time * 0.8) * 0.02
    if (beam.current) beam.current.rotation.x = tilt
    const dy = Math.sin(tilt) * 0.75
    if (panL.current) panL.current.position.y = 1.35 - dy
    if (panR.current) panR.current.position.y = 1.35 + dy
  })
  return (
    <group position={position}>
      <Solid><mesh position={[0, 1.15, 0]} material={wood()} castShadow><cylinderGeometry args={[0.07, 0.1, 2.3, 8]} /></mesh></Solid>
      <mesh position={[0, 0.06, 0]} material={MAT.stoneDark()}><cylinderGeometry args={[0.45, 0.5, 0.12, 14]} /></mesh>
      <group ref={beam} position={[0, 2.3, 0]} userData={{ noBatch: true }}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.bronze()}><cylinderGeometry args={[0.035, 0.035, 1.6, 8]} /></mesh>
      </group>
      {[panL, panR].map((ref, j) => (
        <group key={j} ref={ref} position={[0, 1.35, j ? -0.75 : 0.75]} userData={{ noBatch: true }}>
          <mesh material={MAT.bronze()}><cylinderGeometry args={[0.36, 0.3, 0.05, 16]} /></mesh>
          {[0, 1, 2].map((t) => { const a = (t / 3) * Math.PI * 2; return <mesh key={t} position={[Math.cos(a) * 0.15, 0.48, Math.sin(a) * 0.15]} rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]} material={MAT.dark()}><cylinderGeometry args={[0.006, 0.006, 0.95, 4]} /></mesh> })}
          {j === 0 && six && [0, 1, 2, 3, 4, 5].map((t) => <Sheaf key={t} k="M" position={[((t % 3) - 1) * 0.18, 0.03, (Math.floor(t / 3) - 0.5) * 0.2]} s={0.6} />)}
          {j === 1 && <mesh position={[0, 0.12, 0]} material={MAT.iron()}><cylinderGeometry args={[0.12, 0.14, 0.2, 10]} /></mesh>}
        </group>
      ))}
      {pred ? <Text font={FONT.title} fontSize={0.34} position={[0, 2.85, 0]} color={GRAIN.M} anchorX="center" outlineWidth={0.03} outlineColor="#1a1020">25,5 dou</Text> : null}
    </group>
  )
}

/** A mesa de madeira com o tabuleiro de varetas, onde o mistério é resolvido. */
function Table({ position }: { position: V3 }) {
  return (
    <group position={position} rotation={[0, FACE, 0]}>
      <Solid><mesh position={[0, 0.72, 0]} scale={[1.3, 0.1, 0.67]} material={wood()} castShadow receiveShadow><sphereGeometry args={[1, 10, 6]} /></mesh></Solid>
      {[[-1.0, -0.42], [1.0, -0.42], [-1.0, 0.42], [1.0, 0.42]].map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          <mesh position={[0, 0.35, 0]} material={wood()} castShadow><cylinderGeometry args={[0.08, 0.12, 0.7, 8]} /></mesh>
          <mesh position={[0, 0.04, 0]} scale={[1, 0.55, 1]} material={woodLight()}><sphereGeometry args={[0.13, 8, 6]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.79, 0]} scale={[1.16, 0.035, 0.55]} material={woodLight()}><sphereGeometry args={[1, 10, 6]} /></mesh>
      {[-0.33, 0.33].map((x) => <mesh key={x} position={[x, 0.81, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.dark()}><cylinderGeometry args={[0.012, 0.012, 0.82, 6]} /></mesh>)}
      {RECORDS.map((r, ci) => r.n.map((n, ri) => Array.from({ length: n }, (_, k) => (
        <mesh key={ci + '_' + ri + '_' + k} position={[0.66 - ci * 0.66 + (k - (n - 1) / 2) * 0.07, 0.84, -0.28 + ri * 0.28]} scale={[0.026, 0.018, 0.11]} material={grainMat((['B', 'M', 'F'] as GK[])[ri])}><sphereGeometry args={[1, 5, 4]} /></mesh>
      ))))}
      {/* banquinhos */}
      {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 0.25, 1.0]} material={woodLight()} castShadow><cylinderGeometry args={[0.22, 0.25, 0.5, 10]} /></mesh>)}
    </group>
  )
}

function Lantern({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Solid><mesh position={[0, 1.4, 0]} material={MAT.woodDark()}><cylinderGeometry args={[0.06, 0.08, 2.8, 8]} /></mesh></Solid>
      <mesh position={[0.35, 2.7, 0]} material={MAT.woodDark()}><boxGeometry args={[0.8, 0.06, 0.06]} /></mesh>
      <mesh position={[0.65, 2.3, 0]} scale={[1, 1.25, 1]} material={MAT.glowWarm()}><sphereGeometry args={[0.26, 14, 10]} /></mesh>
    </group>
  )
}

/** Faz o comerciante aparecer quando a vila é alcançada; depois vira lembrança. */
function MerchantEcho() {
  useFrame(() => {
    const f = G().flags, h = holo('merchant')
    h.want = f.l1_fichas ? 1 : 0
    h.live = !!f.l1_fichas && !f.l1_tabela
  })
  return <Holo id="merchant" who="COMERCIANTE" position={[V.merchant[0], 0, V.merchant[2]]} rotY={FACE} />
}

export function Village() {
  const s = STOPS[V.i], P = PEOPLE[s.who]
  const z0 = V.z0, z1 = V.z1
  return (
    <group>
      {/* chão de terra batida dos dois lados da estrada */}
      <mesh position={[(2.9 + 12.6) / 2, 0.013, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={earth()} receiveShadow userData={{ noCollide: true }}><planeGeometry args={[12.6 - 2.9, z0 - z1 - 0.8]} /></mesh>
      <mesh position={[-(2.9 + 12.6) / 2, 0.013, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={earth()} receiveShadow userData={{ noCollide: true }}><planeGeometry args={[12.6 - 2.9, z0 - z1 - 0.8]} /></mesh>
      <Gate z={V.gate} />
      <Paddy x0={-11.8} x1={-4.6} z0={z0 - 2.9} z1={z0 - 8.1} />
      <Paddy x0={-11.8} x1={-4.6} z0={z0 - 13.1} z1={z0 - 19.3} />
      <Paddy x0={10.6} x1={12.3} z0={z0 - 10.4} z1={z0 - 14.6} />
      <Batch>
        <House position={[-9.9, 0, z0 - 10.6]} rotY={Math.PI / 2} w={3.0} d={2.4} />
        <House position={[-10.1, 0, z0 - 22.1]} rotY={Math.PI / 2} w={3.2} d={2.4} />
        <House position={[11.3, 0, z0 - 17.4]} rotY={FACE} w={3.0} d={2.2} />
        <House position={[11.4, 0, z0 - 22.3]} rotY={FACE} w={2.8} d={2.2} />
        <Stall position={[V.merchant[0] - 1.4, 0, V.merchant[2]]} />
        {V.boards.map((z, k) => <RecordBoard key={k} k={k} z={z} />)}
        <Table position={V.table} />
        {/* feixes encostados nas casas */}
        {[[10.0, z0 - 16.2], [10.1, z0 - 16.5], [-8.4, z0 - 11.9], [-8.6, z0 - 21.0]].map(([x, z], k) => <Sheaf key={k} k={(['B', 'M', 'F', 'M'] as GK[])[k]} position={[x, 0, z]} s={1.6} rotY={k} />)}
      </Batch>
      {(['B', 'M', 'F'] as GK[]).map((k, j) => <Basket key={k} k={k} position={V.baskets[j]} label={['SUPERIOR', 'MÉDIO', 'INFERIOR'][j]} />)}
      <Scale position={V.scale} />
      <EraPlaque position={[-3.7, 0, STOP_Z(V.i) + 0.8]} rotY={-0.55} date={`${s.place} · ${s.year}`} place={s.doc.title} color={P.color} />
      <MerchantEcho />
      {/* Liu Hui aparece atrás da mesa, no fim */}
      <Solid><mesh position={[V.liu[0], 0.12, V.liu[2]]} material={MAT.iron()} castShadow receiveShadow><cylinderGeometry args={[0.8, 0.9, 0.24, 24]} /></mesh></Solid>
      <mesh position={[V.liu[0], 0.25, V.liu[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mm('vLiuRing', () => new THREE.MeshStandardMaterial({ color: P.color, emissive: P.color, emissiveIntensity: 1.6 }))} userData={{ noCollide: true }}><ringGeometry args={[0.5, 0.66, 28]} /></mesh>
      <Holo id={s.id} who={s.who} position={[V.liu[0], 0.24, V.liu[2]]} rotY={FACE} />
    </group>
  )
}
