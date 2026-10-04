import * as THREE from 'three'
import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Sparkles, RoundedBox } from '@react-three/drei'
import { Solid, Block, useFlag } from '../../../world/core'
import { Batch, Arch, Banner } from '../../../world/Architecture'
import { Desk, Bookshelf, Telescope, Portal } from '../../../world/Instruments'
import { CrystalLamp } from '../../../world/mechanics'
import { MAT, toon } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { stoneTiles } from '../../../world/textures'
import { RT } from '../../../engine/runtime'
import { QUALITY } from '../../../engine/quality'
import { useGame } from '../../../store'
import { EraPlaque, Palm, Amphora, ScrollRack, clay, mosaic } from '../observatorio/Eras'
import { SpinGear, cardMat } from '../oficina/Hall'
import { NumCube, Brackets } from '../matriz/Chamber'
import { STOPS, PEOPLE } from './stops'
import { Holo } from './people'
import { STOP_Z, SIDE, USE_P, FOG_Z, CORE, CORE_USE, PORTAL_P, SEG, Z_BACK, type V3 } from './layout'
import { Village } from './Village'

/* =========================================================
   O mundo da Fase 1: uma única trilha reta (a linha do tempo),
   com 11 marcos. Névoa da memória entre os marcos; no fim,
   a Memória Central da Language Engine.
   ========================================================= */
export { STOP_Z, SIDE, HOLO_P, USE_P, STAND_P, EXTRA_P, FOG_Z, CORE, CORE_USE, PORTAL_P, PORTAL_USE, SEG, VILLAGE, type V3 } from './layout'
const HALF = 13, Z_FRONT = 20, Z_GROUND = 28

/* ---------- materiais ---------- */
const cache: Record<string, THREE.Material> = {}
const mm = <T extends THREE.Material>(k: string, f: () => T) => (cache[k] || (cache[k] = f())) as T
const ERA_TILES: [string, string][] = [
  ['#ecc98a', '#b88a4a'], ['#e0b88a', '#9a6a3a'], ['#4f9fb0', '#e8d0a0'], ['#e2d2b8', '#8a7a62'], ['#d2cabc', '#7a7060'], ['#bcc0d2', '#6a6e88'],
  ['#b0957a', '#5e4a3a'], ['#a6acc8', '#5a6084'], ['#b8a8cc', '#6a5a84'], ['#8a9ab4', '#3e4e68'], ['#7a8ab8', '#2e3e6a'],
]
const eraMat = (i: number) => mm('era' + i, () => { const [a, b] = ERA_TILES[i]; const t = stoneTiles('eraT' + i, a, b, 4); const map = t.map.clone(); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(2.5, 5.5); map.needsUpdate = true; return toon({ map }) })
const eraDisc = (i: number) => mm('eraD' + i, () => { const [a, b] = ERA_TILES[i]; const t = stoneTiles('eraT' + i, a, b, 4); const map = t.map.clone(); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(3, 3); map.needsUpdate = true; return toon({ map }) })
function groundTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256
  const c = cv.getContext('2d')!
  c.fillStyle = '#2a2f5a'; c.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${150 + Math.random() * 100},${150 + Math.random() * 80},255,${Math.random() * 0.25})`; c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2) }
  c.strokeStyle = 'rgba(140,170,255,.22)'; c.lineWidth = 2
  for (let k = 0; k <= 256; k += 64) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, 256); c.stroke(); c.beginPath(); c.moveTo(0, k); c.lineTo(256, k); c.stroke() }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 42); t.anisotropy = 4
  return t
}
const groundMat = () => mm('ground', () => toon({ map: groundTex(), color: '#c8d0ff' }))
const edgeMat = () => mm('edge', () => toon({ color: '#3a3f70' }))
const glow = (c: string, e = 2.2) => mm('glow' + c + e, () => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e, roughness: 0.4 }))
const white = () => mm('white', () => toon({ color: '#f6f2ea' }))
const darkWool = () => mm('dwool', () => toon({ color: '#3a3030' }))
const redLacquer = () => mm('red', () => toon({ color: '#b8322a' }))
const bamboo = () => mm('bamboo', () => toon({ color: '#d8c070' }))

/* ---------- chão, bordas e trilha ---------- */
function Ground() {
  const len = Z_FRONT - Z_BACK, glen = Z_GROUND - Z_BACK
  return (
    <>
      <Solid>
        <mesh position={[0, -0.25, (Z_GROUND + Z_BACK) / 2]} material={groundMat()} receiveShadow><boxGeometry args={[HALF * 2 + 2, 0.5, glen]} /></mesh>
      </Solid>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (HALF + 1.2), -2.2, (Z_GROUND + Z_BACK) / 2]} material={edgeMat()} userData={{ noCollide: true }}><boxGeometry args={[0.6, 4, glen]} /></mesh>)}
      {/* paredes invisíveis */}
      {[-1, 1].map((s) => <Block key={s} size={[1, 6, len]} position={[s * (HALF - 0.4), 3, (Z_FRONT + Z_BACK) / 2]} />)}
      <Block size={[HALF * 2, 6, 1]} position={[0, 3, Z_FRONT - 0.5]} />
      <Block size={[HALF * 2, 6, 1]} position={[0, 3, Z_BACK + 0.5]} />
      {/* cristais da memória na borda */}
      <Batch>
        {Array.from({ length: 34 }, (_, i) => {
          const s = i % 2 ? 1 : -1, z = Z_FRONT - 3 - Math.floor(i / 2) * 9.2, k = 0.5 + ((i * 37) % 10) / 12
          return <mesh key={i} position={[s * (HALF + 0.4), k * 0.8, z]} rotation={[0.2 * s, i, 0.25 * s]} scale={[k * 0.6, k * 1.6, k * 0.6]} material={i % 3 ? MAT.glowViolet() : MAT.glowBlue()} userData={{ noCollide: true }}><octahedronGeometry args={[0.6, 0]} /></mesh>
        })}
      </Batch>
    </>
  )
}

/** A estrada: um trecho por época, com a linha do tempo dourada no meio. */
function Road() {
  const segs = useMemo(() => {
    const out: { z0: number; z1: number; m: number }[] = [{ z0: 4, z1: SEG(0)[0], m: 0 }]
    STOPS.forEach((_, i) => out.push({ z0: SEG(i)[0], z1: i === STOPS.length - 1 ? CORE_USE[2] + 1 : SEG(i)[1], m: i }))
    return out
  }, [])
  return (
    <Batch shadows={false}>
      {segs.map((s, i) => (
        <mesh key={i} position={[0, 0.012, (s.z0 + s.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={eraMat(s.m)} receiveShadow userData={{ noCollide: true }}><planeGeometry args={[5, s.z0 - s.z1]} /></mesh>
      ))}
      {[-1, 1].map((k) => <mesh key={k} position={[k * 2.6, 0.03, (4 + CORE_USE[2]) / 2]} material={MAT.stoneDark()} userData={{ noCollide: true }}><boxGeometry args={[0.22, 0.06, 4 - CORE_USE[2]]} /></mesh>)}
    </Batch>
  )
}

/** Linha do tempo: acende até a última memória recuperada. */
function TimeLine() {
  const flags = useGame((s) => s.flags)
  let n = 0; while (n < STOPS.length && flags['l1_' + STOPS[n].id]) n++
  const zEnd = n >= STOPS.length ? CORE_USE[2] : STOP_Z(n)
  const lit = glow('#ffd27a', 2.6), dim = mm('tlDim', () => new THREE.MeshStandardMaterial({ color: '#4a4a70', emissive: '#2a2a5a', emissiveIntensity: 0.6 }))
  return (
    <group>
      <mesh position={[0, 0.03, (4 + zEnd) / 2]} material={lit} userData={{ noCollide: true }}><boxGeometry args={[0.16, 0.03, 4 - zEnd]} /></mesh>
      {n < STOPS.length && <mesh position={[0, 0.028, (zEnd + CORE_USE[2]) / 2]} material={dim} userData={{ noCollide: true }}><boxGeometry args={[0.12, 0.02, zEnd - CORE_USE[2]]} /></mesh>}
      {STOPS.map((s, i) => (
        <group key={s.id} position={[0, 0, STOP_Z(i)]}>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} material={i <= n ? lit : dim} userData={{ noCollide: true }}><ringGeometry args={[0.35, 0.55, 28]} /></mesh>
          <Text font={FONT.title} fontSize={0.62} position={[-SIDE(i) * 0.9, 0.04, 1.2]} rotation={[-Math.PI / 2, 0, 0]} color={flags['l1_' + s.id] ? '#ffd27a' : '#e8e2ff'} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#1a1430">{s.year}</Text>
        </group>
      ))}
    </group>
  )
}

/* ---------- névoa da memória ---------- */
const fogVert = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`
const fogFrag = `varying vec2 vUv; varying vec3 vW; uniform float uT, uK; uniform vec3 uCol;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int k = 0; k < 4; k++){ s += a*n(p); p *= 2.03; a *= .5; } return s; }
void main(){
  vec2 p = vec2(vW.x*0.35, vW.y*0.5);
  float c = fbm(p + vec2(uT*0.08, -uT*0.05)) * 0.7 + fbm(p*2.3 - vec2(uT*0.12, 0.)) * 0.3;
  float diss = smoothstep(uK - 0.15, uK + 0.15, c + (1.0 - uK) * 0.0);
  float a = (0.45 + c*0.6) * smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.0, 0.08, vUv.y);
  a *= step(0.001, uK) * smoothstep(0.0, 1.0, uK*1.4 - (1.0-c)*0.4);
  if (a < 0.06) discard;
  vec3 col = mix(uCol, vec3(1.0), c*c*0.55);
  gl_FragColor = vec4(col, clamp(a, 0., 0.95));
}`
function FogWall({ i }: { i: number }) {
  const done = useFlag('l1_' + STOPS[i].id)
  const k = useRef(done ? 0 : 1)
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: fogVert, fragmentShader: fogFrag, transparent: true, depthWrite: true, side: THREE.DoubleSide, uniforms: { uT: { value: 0 }, uK: { value: k.current }, uCol: { value: new THREE.Color('#8a7ad8') } } }), [])
  const g = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    k.current += ((done ? 0 : 1) - k.current) * Math.min(1, dt * 0.9)
    if (done && k.current < 0.01) k.current = 0
    mat.uniforms.uT.value = RT.time; mat.uniforms.uK.value = k.current
    if (g.current) g.current.visible = k.current > 0.005
  })
  const z = FOG_Z(i)
  return (
    <>
      {!done && <Block size={[HALF * 2, 6, 0.8]} position={[0, 3, z]} />}
      <group ref={g} userData={{ noBatch: true }}>
        {[0, 0.9, 1.8].map((dz, j) => <mesh key={j} position={[0, 3.2, z - dz]} material={mat} userData={{ noCollide: true }}><planeGeometry args={[HALF * 2, 7, 1, 1]} /></mesh>)}
        {!done && <Sparkles count={QUALITY.q === 'high' ? 40 : 18} scale={[HALF * 2, 4, 2]} position={[0, 2, z - 0.8]} size={4} speed={0.3} color="#cfc4ff" />}
      </group>
    </>
  )
}

/* ---------- objetos de cada época ---------- */
function Sheep({ position, rot = 0 }: { position: V3; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      {[[0, 0.55, 0, 0.36], [0.22, 0.6, 0.1, 0.26], [-0.22, 0.6, 0.08, 0.26], [0, 0.72, -0.05, 0.28], [0.05, 0.58, -0.25, 0.25]].map(([x, y, z, r], k) => <mesh key={k} position={[x, y, z]} material={white()} castShadow><sphereGeometry args={[r, 12, 10]} /></mesh>)}
      <mesh position={[0, 0.66, 0.4]} scale={[0.8, 0.9, 1.1]} material={darkWool()} castShadow><sphereGeometry args={[0.16, 10, 8]} /></mesh>
      {[[-0.15, 0.15], [0.15, 0.15], [-0.15, -0.15], [0.15, -0.15]].map(([x, z], k) => <mesh key={k} position={[x, 0.2, z]} material={darkWool()}><cylinderGeometry args={[0.04, 0.04, 0.4, 6]} /></mesh>)}
    </group>
  )
}
function Tokens({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.5, 0.42, 0.5, 14, 1, true]} /></mesh>
      {Array.from({ length: 9 }, (_, k) => { const a = k * 2.4, r = 0.18 + (k % 3) * 0.08; const kind = k % 3; return (
        <mesh key={k} position={[Math.cos(a) * r, 0.48 + (k % 2) * 0.05, Math.sin(a) * r]} material={MAT.stoneDark()} castShadow>
          {kind === 0 ? <sphereGeometry args={[0.07, 8, 6]} /> : kind === 1 ? <coneGeometry args={[0.07, 0.14, 8]} /> : <cylinderGeometry args={[0.08, 0.08, 0.04, 10]} />}
        </mesh>
      ) })}
    </group>
  )
}
function Dice({ position, rot = 0 }: { position: V3; rot?: number }) {
  const pips: [number, number, number][] = [[0, 0.5, 0], [0.22, 0.5, 0.22], [-0.22, 0.5, -0.22], [0.5, 0.2, 0.2], [0.5, -0.2, -0.2], [0, 0, 0.5]]
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <RoundedBox args={[1, 1, 1]} radius={0.14} smoothness={3} position={[0, 0.5, 0]} material={white()} castShadow />
      {pips.map((p, k) => <mesh key={k} position={[p[0] * 1.01, 0.5 + p[1] * 1.01, p[2] * 1.01]} material={MAT.dark()}><sphereGeometry args={[0.08, 8, 6]} /></mesh>)}
    </group>
  )
}
export function RodBoard({ position, rotY = 0 }: { position: V3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid><mesh position={[0, 0.3, 0]} material={redLacquer()} castShadow><boxGeometry args={[2.2, 0.6, 1.2]} /></mesh></Solid>
      <mesh position={[0, 0.62, 0]} material={MAT.wood()}><boxGeometry args={[2.0, 0.04, 1.0]} /></mesh>
      {[-0.33, 0.33].map((x) => <mesh key={x} position={[x, 0.65, 0]} material={MAT.dark()}><boxGeometry args={[0.02, 0.02, 0.95]} /></mesh>)}
      {[-0.17, 0.17].map((z) => <mesh key={z} position={[0, 0.65, z]} material={MAT.dark()}><boxGeometry args={[1.95, 0.02, 0.02]} /></mesh>)}
      {[[3, 2, 1], [2, 3, 1], [1, 2, 3]].map((col, ci) => col.map((n, ri) => Array.from({ length: n }, (_, k) => (
        <mesh key={ci + '_' + ri + '_' + k} position={[0.66 - ci * 0.66 + (k - (n - 1) / 2) * 0.07, 0.67, -0.33 + ri * 0.33]} material={bamboo()}><boxGeometry args={[0.03, 0.02, 0.24]} /></mesh>
      ))))}
    </group>
  )
}
export function RedLantern({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Solid><mesh position={[0, 1.4, 0]} material={MAT.woodDark()}><cylinderGeometry args={[0.06, 0.08, 2.8, 8]} /></mesh></Solid>
      <mesh position={[0.35, 2.7, 0]} material={MAT.woodDark()}><boxGeometry args={[0.8, 0.06, 0.06]} /></mesh>
      <mesh position={[0.65, 2.3, 0]} scale={[1, 1.25, 1]} material={glow('#ff5a3a', 1.6)}><sphereGeometry args={[0.26, 14, 10]} /></mesh>
    </group>
  )
}
function Unicycle({ position }: { position: V3 }) {
  const g = useRef<THREE.Group>(null!)
  useFrame(() => { if (g.current) g.current.rotation.z = Math.sin(RT.time * 1.4) * 0.06 })
  return (
    <group position={position}>
      <group ref={g} userData={{ noBatch: true }}>
        <mesh position={[0, 0.42, 0]} material={MAT.dark()}><torusGeometry args={[0.38, 0.05, 8, 24]} /></mesh>
        <mesh position={[0, 0.95, 0]} material={MAT.iron()}><cylinderGeometry args={[0.025, 0.025, 1.1, 6]} /></mesh>
        <mesh position={[0, 1.52, 0]} scale={[1, 0.4, 1.6]} material={MAT.cloth('#c8322a')}><sphereGeometry args={[0.13, 10, 8]} /></mesh>
      </group>
    </group>
  )
}
function Juggle({ position }: { position: V3 }) {
  const g = useRef<THREE.Group>(null!)
  useFrame(() => { g.current?.children.forEach((b, k) => { const a = RT.time * 2.2 + (k * Math.PI * 2) / 3; b.position.set(Math.cos(a) * 0.45, 0.6 + Math.abs(Math.sin(a)) * 0.8, 0) }) })
  return <group ref={g} position={position} userData={{ noBatch: true }}>{['#ff5a5a', '#ffd25a', '#5ad0ff'].map((c) => <mesh key={c} material={glow(c, 1.2)}><sphereGeometry args={[0.11, 10, 8]} /></mesh>)}</group>
}
function Perceptron({ position, rotY = 0 }: { position: V3; rotY?: number }) {
  const lamps = useRef<THREE.InstancedMesh>(null!)
  const N = 8
  const mats = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.6, toneMapped: true }), [])
  useFrame(() => {
    const im = lamps.current; if (!im) return
    const m4 = new THREE.Matrix4(), col = new THREE.Color()
    for (let k = 0; k < N * N; k++) {
      const x = k % N, y = Math.floor(k / N)
      m4.makeTranslation((x - (N - 1) / 2) * 0.22, 1.2 + (y - (N - 1) / 2) * 0.22, 0.31)
      im.setMatrixAt(k, m4)
      const on = Math.sin(x * 1.7 + y * 2.3 + Math.floor(RT.time * 1.5) * 1.3) > 0.35
      im.setColorAt(k, col.set(on ? '#ffd27a' : '#2a3050'))
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true
  })
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid><mesh position={[0, 1.2, 0]} material={MAT.iron()} castShadow><boxGeometry args={[2.1, 2.4, 0.6]} /></mesh></Solid>
      <mesh position={[0, 2.5, 0]} material={MAT.dark()}><boxGeometry args={[2.2, 0.2, 0.7]} /></mesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, N * N]} material={mats} userData={{ noBatch: true, noCollide: true }}><boxGeometry args={[0.15, 0.15, 0.04]} /></instancedMesh>
    </group>
  )
}
function Neuron({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]} material={glow('#9fe9ff', 1.4)}><sphereGeometry args={[0.32, 16, 12]} /></mesh>
      {Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2; return <mesh key={k} position={[Math.cos(a) * 0.55, 1.6 + Math.sin(a * 2) * 0.2, Math.sin(a) * 0.55]} rotation={[Math.sin(a), 0, Math.PI / 2 + a]} material={glow('#59d7ff', 0.9)}><cylinderGeometry args={[0.03, 0.06, 0.6, 6]} /></mesh> })}
      <mesh position={[0, 0.8, 0]} material={glow('#59d7ff', 0.9)}><cylinderGeometry args={[0.05, 0.08, 1.3, 8]} /></mesh>
    </group>
  )
}
function LetterTower({ position, letters }: { position: V3; letters: string }) {
  return <group position={position}>{letters.split('').map((l, k) => <NumCube key={k} position={[0, 0.4 + k * 0.82, 0]} value={l} s={0.8} color={k % 2 ? '#ffd27a' : '#bff6ff'} />)}</group>
}

/** Cenário de cada parada: chão da época, projetor, placa e objetos. */
function StopSite({ i }: { i: number }) {
  if (STOPS[i].custom === 'graos') return <Village />
  return <GenericSite i={i} />
}
function GenericSite({ i }: { i: number }) {
  const s = STOPS[i], P = PEOPLE[s.who], sd = SIDE(i), z = STOP_Z(i)
  const hx = sd * 7.4
  const back = (dx: number, dz: number, y = 0): V3 => [hx + sd * dx, y, z + dz]
  const face = sd > 0 ? -Math.PI / 2 : Math.PI / 2 // de frente para a estrada
  const props: Record<string, ReactNode> = {
    fichas: <>
      <Sheep position={back(2.6, 2.2)} rot={face + 0.5} /><Sheep position={back(3.4, 0.4)} rot={face - 0.3} /><Sheep position={back(2.2, -2.6)} rot={face + 1.2} />
      <Tokens position={back(1.4, -1.6)} />
      <group position={back(2.9, -0.9)}><Solid><mesh position={[0, 0.35, 0]} material={MAT.woodDark()}><boxGeometry args={[0.9, 0.7, 0.6]} /></mesh></Solid><mesh position={[0, 0.82, 0]} rotation={[-1.1, 0, 0.1]} material={clay()} castShadow><boxGeometry args={[0.5, 0.62, 0.08]} /></mesh></group>
      <Palm position={back(4.4, 3.6)} s={1.1} rot={0.5} />
    </>,
    tabela: <>
      <RodBoard position={back(2.4, 0)} rotY={face} />
      <RedLantern position={back(3.8, 2.6)} /><RedLantern position={back(3.8, -2.6)} />
      <Banner position={back(4.6, 0, 2.3)} rotY={face} h={2.8} emblem="sun" color="#8a1f2a" />
    </>,
    algoritmo: <>
      <Arch position={back(3.6, 0)} rotation={[0, face, 0]} w={4.2} h={4.6} open={2.6} solid />
      <ScrollRack position={back(2.4, 2.9)} rotY={face + (sd > 0 ? 0.6 : -0.6)} />
      <Desk position={back(2.2, -2.6)} rotY={face} />
      <mesh position={[hx, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={mosaic()} userData={{ noCollide: true }}><ringGeometry args={[2.2, 3.4, 40]} /></mesh>
    </>,
    chances: <>
      <Desk position={back(2.4, 1.8)} rotY={face} />
      <Dice position={back(2.0, -1.8)} rot={0.4} /><Dice position={back(3.0, -2.3)} rot={1.1} />
      <Banner position={back(4.2, 0, 2.3)} rotY={face} h={2.8} emblem="star" color="#1f3a8a" />
    </>,
    binario: <>
      {[1, 1, 0, 1].map((on, k) => <CrystalLamp key={k} position={back(2.8, -2.4 + k * 1.6)} on={!!on} color="#ffd27a" h={1.6} s={0.8} />)}
      <Bookshelf position={back(4.4, 0)} rotY={face} w={2.6} />
    </>,
    erro: <>
      <Telescope position={back(3.0, -2.8)} rotY={face + (sd > 0 ? 0.5 : -0.5)} alt={0.7} s={0.9} />
      <Desk position={back(2.6, 2.2)} rotY={face} />
      <group position={back(4.4, 0)} rotation={[0, face, 0]}>
        <Solid><mesh position={[0, 1.4, 0]} material={MAT.woodDark()}><boxGeometry args={[2.4, 1.8, 0.12]} /></mesh></Solid>
        {[[-0.8, 1.0], [-0.4, 1.15], [0, 1.45], [0.4, 1.6], [0.8, 1.95]].map(([x, y], k) => <mesh key={k} position={[x, y, 0.08]} material={glow('#ffe08a', 1.8)}><sphereGeometry args={[0.06, 8, 6]} /></mesh>)}
        <mesh position={[0, 1.48, 0.07]} rotation={[0, 0, Math.atan2(0.95, 1.6)]} material={glow('#59d7ff', 1.4)}><boxGeometry args={[1.9, 0.03, 0.01]} /></mesh>
      </group>
    </>,
    programa: <>
      <group position={back(3.6, 0)} rotation={[0, face, 0]}>
        <Solid><mesh position={[0, 1.2, -0.3]} material={MAT.woodDark()}><boxGeometry args={[3, 2.4, 0.3]} /></mesh></Solid>
        <SpinGear position={[-0.8, 1.5, 0]} r={0.6} speed={0.6} />
        <SpinGear position={[0.25, 1.9, 0]} r={0.42} speed={-0.85} mat={MAT.copper()} />
        <SpinGear position={[0.9, 1.0, 0]} r={0.5} speed={0.7} />
      </group>
      <group position={back(2.0, -2.4)}>
        {Array.from({ length: 6 }, (_, k) => <mesh key={k} position={[0, 0.03 + k * 0.03, 0]} rotation={[-Math.PI / 2, 0, k * 0.05]} material={cardMat()}><planeGeometry args={[0.7, 0.32]} /></mesh>)}
      </group>
      <Desk position={back(2.2, 2.4)} rotY={face} />
    </>,
    multiplicar: <>
      <group position={back(3.6, 0)} rotation={[0, face, 0]}>
        {[[2, 0], [0, 2]].map((row, r) => row.map((v, c) => <NumCube key={r + '_' + c} position={[(c - 0.5) * 1.1, 2.2 - r * 1.1, 0]} value={v} s={0.95} />))}
        <Brackets position={[0, 1.65, 0]} w={2.6} h={2.3} />
        {[2, 1].map((v, r) => <NumCube key={'v' + r} position={[2.0, 2.2 - r * 1.1, 0]} value={v} s={0.95} color="#ffd27a" />)}
        <Brackets position={[2.0, 1.65, 0]} w={1.3} h={2.3} color="#59d7ff" />
      </group>
      <Desk position={back(2.0, 2.6)} rotY={face} />
    </>,
    markov: <>
      <LetterTower position={back(2.6, -2.4)} letters="AEO" /><LetterTower position={back(3.4, -1.0)} letters="BRS" /><LetterTower position={back(2.8, 2.3)} letters="TNA" />
      <Bookshelf position={back(4.5, 0.6)} rotY={face} w={2.2} />
    </>,
    bit: <>
      <Unicycle position={back(2.4, -2.2)} />
      <Juggle position={back(2.6, 2.4)} />
      <group position={back(4.2, 0)} rotation={[0, face, 0]}>
        <Solid><mesh position={[0, 1.1, 0]} material={MAT.iron()}><boxGeometry args={[1.8, 2.2, 0.5]} /></mesh></Solid>
        {Array.from({ length: 8 }, (_, k) => <mesh key={k} position={[-0.7 + (k % 4) * 0.46, 1.5 - Math.floor(k / 4) * 0.5, 0.26]} material={k % 3 ? glow('#ffb35a', 1.6) : MAT.dark()}><sphereGeometry args={[0.09, 8, 6]} /></mesh>)}
      </group>
    </>,
    neuronio: <>
      <Perceptron position={back(4.0, 0)} rotY={face} />
      <Neuron position={back(2.4, 2.6)} />
      <Neuron position={back(2.4, -2.6)} />
    </>,
  }
  return (
    <group>
      {/* chão da época */}
      <mesh position={[hx, 0.014, z]} rotation={[-Math.PI / 2, 0, 0]} material={eraDisc(i)} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[4.2, 40]} /></mesh>
      <mesh position={[hx, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={glow(P.color, 1.2)} userData={{ noCollide: true }}><ringGeometry args={[4.05, 4.25, 48]} /></mesh>
      <mesh position={[sd * 3.5, 0.013, z]} rotation={[-Math.PI / 2, 0, 0]} material={eraMat(i)} userData={{ noCollide: true }}><planeGeometry args={[2.4, 2.6]} /></mesh>
      {/* projetor da memória */}
      <Solid><mesh position={[hx, 0.12, z]} material={MAT.iron()} castShadow receiveShadow><cylinderGeometry args={[0.95, 1.05, 0.24, 28]} /></mesh></Solid>
      <mesh position={[hx, 0.25, z]} rotation={[-Math.PI / 2, 0, 0]} material={glow(P.color, 1.8)} userData={{ noCollide: true }}><ringGeometry args={[0.6, 0.8, 32]} /></mesh>
      <EraPlaque position={[-sd * 3.7, 0, z + 0.8]} rotY={sd * 0.55} date={`${s.place} · ${s.year}`} place={s.doc.title} color={P.color} />
      <Batch>{props[s.id]}</Batch>
      <Holo id={s.id} who={s.who} position={[hx, 0.24, z]} rotY={face} />
    </group>
  )
}

/** Console onde o NEX desperta a memória (perto da estrada). */
export function Console({ i, lit }: { i: number; lit: boolean }) {
  if (STOPS[i].custom) return null
  const P = PEOPLE[STOPS[i].who]
  const m = useRef<THREE.MeshStandardMaterial>(null!)
  useFrame(() => { if (m.current) m.current.emissiveIntensity = lit ? 2 + Math.sin(RT.time * 4) * 0.8 : 0.5 })
  const [x, , z] = USE_P(i)
  return (
    <group position={[x + SIDE(i) * 0.55, 0, z - 0.25]}>
      <Solid><mesh position={[0, 0.5, 0]} material={MAT.stoneDark()} castShadow><cylinderGeometry args={[0.28, 0.36, 1, 10]} /></mesh></Solid>
      <mesh position={[0, 1.06, 0]} rotation={[-0.5, 0, 0]} userData={{ noBatch: true }}><boxGeometry args={[0.5, 0.08, 0.4]} /><meshStandardMaterial ref={m} color={P.color} emissive={P.color} emissiveIntensity={0.5} /></mesh>
    </group>
  )
}

/* ---------- começo e fim ---------- */
function StartPlaza() {
  return (
    <group>
      <mesh position={[0, 0.012, 8]} rotation={[-Math.PI / 2, 0, 0]} material={eraDisc(0)} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[5, 40]} /></mesh>
      <mesh position={[0, 0.02, 8]} rotation={[-Math.PI / 2, 0, 0]} material={glow('#59d7ff', 1.3)} userData={{ noCollide: true }}><ringGeometry args={[4.8, 5.05, 48]} /></mesh>
      <Text font={FONT.title} fontSize={0.9} position={[0, 0.04, 4.2]} rotation={[-Math.PI / 2, 0, 0]} color="#bff3ff" anchorX="center" outlineWidth={0.02} outlineColor="#0a1430">AS ORIGENS</Text>
      <Text font={FONT.body} fontSize={0.36} position={[0, 0.04, 3.2]} rotation={[-Math.PI / 2, 0, 0]} color="#e8e2ff" anchorX="center">a linha do tempo da memória</Text>
      <Amphora position={[-4.2, 0, 9.5]} /><Amphora position={[4.3, 0, 9.2]} s={0.85} />
    </group>
  )
}

/** A Memória Central: 11 orbes acendem com as memórias recuperadas. */
function MemoryCore() {
  const flags = useGame((s) => s.flags)
  const n = STOPS.filter((s) => flags['l1_' + s.id]).length
  const fin = !!flags.l1_final
  const crystal = useRef<THREE.Mesh>(null!)
  const cm = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bff3ff', emissive: '#3fc4ff', emissiveIntensity: 0.4, roughness: 0.2, flatShading: true }), [])
  const ring = useRef<THREE.Group>(null!)
  const rings = useRef<THREE.Group>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const orbMats = useMemo(() => STOPS.map((s) => new THREE.MeshStandardMaterial({ color: PEOPLE[s.who].color, emissive: PEOPLE[s.who].color, emissiveIntensity: 0.05, roughness: 0.3 })), [])
  useFrame((_, dt) => {
    const t = RT.time, k = n / STOPS.length
    const want = fin ? 4.5 : 0.3 + k * 2.2
    cm.emissiveIntensity += (want - cm.emissiveIntensity) * Math.min(1, dt * 2)
    if (crystal.current) { crystal.current.rotation.y += dt * (0.3 + k); const sc = 0.7 + k * 0.6 + (fin ? 0.25 : 0); crystal.current.scale.set(sc, sc * 1.6, sc); crystal.current.position.y = 4 + Math.sin(t * 1.3) * 0.15 }
    if (ring.current) ring.current.rotation.y += dt * 0.25
    rings.current?.children.forEach((c, j) => { c.rotation.x += dt * (0.2 + j * 0.15) * (fin ? 3 : 1); c.rotation.z += dt * 0.1 })
    orbMats.forEach((m, j) => { const on = !!flags['l1_' + STOPS[j].id]; const w = on ? 2.4 + Math.sin(t * 3 + j) * 0.5 : 0.05; m.emissiveIntensity += (w - m.emissiveIntensity) * Math.min(1, dt * 3) })
    if (light.current) light.current.intensity = 6 + cm.emissiveIntensity * 6
  })
  return (
    <group position={CORE}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={eraDisc(10)} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[8.5, 48]} /></mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow('#59d7ff', 1.6)} userData={{ noCollide: true }}><ringGeometry args={[8.3, 8.6, 64]} /></mesh>
      <Solid>
        <mesh position={[0, 0.4, 0]} material={MAT.iron()} castShadow receiveShadow><cylinderGeometry args={[2.6, 2.9, 0.8, 40]} /></mesh>
        <mesh position={[0, 1.1, 0]} material={MAT.dark()} castShadow><cylinderGeometry args={[1.6, 2.0, 0.6, 40]} /></mesh>
      </Solid>
      <mesh position={[0, 0.81, 0]} material={MAT.gold()}><torusGeometry args={[2.62, 0.05, 6, 64]} /></mesh>
      <mesh ref={crystal} position={[0, 4, 0]} material={cm} castShadow userData={{ noBatch: true }}><octahedronGeometry args={[1, 0]} /></mesh>
      <pointLight ref={light} position={[0, 4, 0]} color="#7fe3ff" intensity={6} distance={26} decay={1.5} />
      <group ref={ring} position={[0, 3.4, 0]} userData={{ noBatch: true }}>
        {STOPS.map((s, j) => { const a = (j / STOPS.length) * Math.PI * 2; return <mesh key={s.id} position={[Math.cos(a) * 3.4, Math.sin(a * 3) * 0.25, Math.sin(a) * 3.4]} material={orbMats[j]}><sphereGeometry args={[0.28, 16, 12]} /></mesh> })}
      </group>
      <group ref={rings} position={[0, 4, 0]} userData={{ noBatch: true }}>
        <mesh material={MAT.bronze()}><torusGeometry args={[2.2, 0.07, 8, 64]} /></mesh>
        <mesh material={MAT.gold()} rotation={[1.2, 0, 0]}><torusGeometry args={[2.6, 0.06, 8, 64]} /></mesh>
      </group>
      {fin && <Sparkles count={60} scale={[7, 6, 7]} position={[0, 4, 0]} size={5} speed={0.6} color="#bff3ff" />}
      {/* pilares */}
      {Array.from({ length: 6 }, (_, j) => { const a = (j / 6) * Math.PI * 2; return (
        <group key={j} position={[Math.cos(a) * 7, 0, Math.sin(a) * 7]}>
          <Solid><mesh position={[0, 3, 0]} material={MAT.iron()} castShadow><boxGeometry args={[0.7, 6, 0.7]} /></mesh></Solid>
          <mesh position={[0, 3, 0]} rotation={[0, -a, 0]} material={MAT.glowBlue()}><boxGeometry args={[0.75, 5, 0.1]} /></mesh>
        </group>
      ) })}
    </group>
  )
}

export function FinalPortal() {
  const on = useFlag('l1_done')
  return <Portal position={PORTAL_P} rotY={0} s={0.8} active={!!on} color="#b48cff" />
}

export function LinhaWorld() {
  return (
    <>
      <Ground />
      <Road />
      <TimeLine />
      <StartPlaza />
      {STOPS.map((_, i) => <StopSite key={i} i={i} />)}
      {STOPS.map((_, i) => <FogWall key={i} i={i} />)}
      <MemoryCore />
      <FinalPortal />
    </>
  )
}
