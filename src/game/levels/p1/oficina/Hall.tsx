import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Solid, Block } from '../../../world/core'
import { Batch, Lantern, Stairs } from '../../../world/Architecture'
import { MAT } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'

/* =========================================================
   Oficina das Máquinas — o galpão: tijolo, ferro, cobre e vapor.
   Peças compartilhadas: texturas, engrenagens, vapor, guarda-corpo.
   ========================================================= */
export type V3 = [number, number, number]

/** Medidas do galpão (metros). Entrada no +z, núcleo no −z. */
export const HALL = { x: 18, zFront: 48, zBack: -58, h: 14 }
export const PART = { p1: 12.3, p2: -20.3, p3: -36.3, h: 5.5 }
export const GATES = { g1: [0, 0, PART.p1] as V3, g2: [5, 0, PART.p2] as V3, g3: [0, 0, PART.p3] as V3 }
export const CORE_Y = 2.4

/* ---------- texturas ---------- */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  draw(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
const texCache: Record<string, THREE.CanvasTexture> = {}
function brickBase() {
  return texCache.brick || (texCache.brick = canvasTex(512, 512, (c) => {
    c.fillStyle = '#3a2219'; c.fillRect(0, 0, 512, 512)
    const bw = 64, bh = 32
    for (let row = 0; row < 16; row++) {
      const off = row % 2 ? bw / 2 : 0
      for (let x = -bw; x < 512 + bw; x += bw) {
        const v = 0.72 + Math.random() * 0.32
        c.fillStyle = `rgb(${Math.round(156 * v)},${Math.round(74 * v)},${Math.round(50 * v)})`
        c.fillRect(x + off + 2, row * bh + 2, bw - 4, bh - 4)
        if (Math.random() < 0.25) { c.fillStyle = 'rgba(30,18,12,.25)'; c.fillRect(x + off + 2, row * bh + 2 + (bh - 4) * 0.6, bw - 4, (bh - 4) * 0.4) }
      }
    }
  }))
}
function plateBase() {
  return texCache.plate || (texCache.plate = canvasTex(512, 512, (c) => {
    c.fillStyle = '#2b2c30'; c.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const v = 0.86 + Math.random() * 0.22
      c.fillStyle = `rgb(${Math.round(84 * v)},${Math.round(84 * v)},${Math.round(88 * v)})`
      c.fillRect(i * 256 + 3, j * 256 + 3, 250, 250)
      c.strokeStyle = 'rgba(160,160,170,.16)'; c.lineWidth = 4
      for (let k = 0; k < 9; k++) for (let l = 0; l < 9; l++) {
        const x = i * 256 + 20 + k * 26, y = j * 256 + 20 + l * 26
        c.beginPath(); if ((k + l) % 2) { c.moveTo(x, y + 9); c.lineTo(x + 9, y) } else { c.moveTo(x, y); c.lineTo(x + 9, y + 9) } c.stroke()
      }
      c.fillStyle = 'rgba(15,15,18,.8)'
      for (const [x, y] of [[12, 12], [244, 12], [12, 244], [244, 244]]) { c.beginPath(); c.arc(i * 256 + x, j * 256 + y, 5, 0, 7); c.fill() }
    }
  }))
}
function windowBase() {
  return texCache.win || (texCache.win = canvasTex(256, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#ffd9a0'); g.addColorStop(1, '#ff8a3c')
    c.fillStyle = g; c.fillRect(0, 0, 256, 512)
    c.strokeStyle = '#2a1a12'; c.lineWidth = 10
    for (let x = 0; x <= 256; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke() }
    for (let y = 0; y <= 512; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke() }
  }))
}
const matCache: Record<string, THREE.Material> = {}
export function brickMat(rx: number, ry: number) {
  const k = `brick_${rx}_${ry}`
  if (!matCache[k]) { const t = brickBase().clone(); t.repeat.set(rx, ry); t.needsUpdate = true; matCache[k] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }) }
  return matCache[k]
}
export function plateMat(rx: number, ry: number) {
  const k = `plate_${rx}_${ry}`
  if (!matCache[k]) { const t = plateBase().clone(); t.repeat.set(rx, ry); t.needsUpdate = true; matCache[k] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.55 }) }
  return matCache[k]
}
export function windowMat() {
  return matCache.win || (matCache.win = new THREE.MeshStandardMaterial({ map: windowBase(), emissive: '#ffffff', emissiveMap: windowBase(), emissiveIntensity: 1.25, roughness: 0.4 }))
}
export const cardMat = () => matCache.card || (matCache.card = new THREE.MeshStandardMaterial({ color: '#e9d9b0', roughness: 0.85, side: THREE.DoubleSide }))
export const rubberMat = () => matCache.rubber || (matCache.rubber = new THREE.MeshStandardMaterial({ color: '#1c1b1d', roughness: 0.95 }))
export const boxMat = () => matCache.box || (matCache.box = new THREE.MeshStandardMaterial({ color: '#b98b56', roughness: 0.9 }))
export const glowRed = () => matCache.glowRed || (matCache.glowRed = new THREE.MeshStandardMaterial({ color: '#ff9a8a', emissive: '#ff3a2a', emissiveIntensity: 2.6 }))
export const glowGreen = () => matCache.glowGreen || (matCache.glowGreen = new THREE.MeshStandardMaterial({ color: '#b8ffcf', emissive: '#2ad86a', emissiveIntensity: 2.6 }))

/* ---------- engrenagens ---------- */
const gearCache = new Map<string, THREE.BufferGeometry>()
/** Geometria de engrenagem (dentes + furos), centrada, eixo Z. */
export function gearGeo(r: number, teeth: number, depth = 0.22) {
  const key = `${r}_${teeth}_${depth}`
  const hit = gearCache.get(key)
  if (hit) return hit
  const sh = new THREE.Shape()
  const th = Math.min(0.24, r * 0.17), r0 = r - th
  const N = teeth * 4
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2, q = i % 4
    const rr = q === 1 || q === 2 ? r : r0
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y)
  }
  const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.14, 0, Math.PI * 2, true); sh.holes.push(hole)
  if (r > 0.55) for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    const h2 = new THREE.Path(); h2.absarc(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.16, 0, Math.PI * 2, true); sh.holes.push(h2)
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1, curveSegments: 8 })
  g.translate(0, 0, -depth / 2)
  gearCache.set(key, g)
  return g
}
/** Engrenagem que gira sozinha (decoração). */
export function SpinGear({ position, rotation = [0, 0, 0], r, teeth, speed = 0.4, mat, depth = 0.22, run }: { position: V3; rotation?: V3; r: number; teeth?: number; speed?: number; mat?: THREE.Material; depth?: number; run?: () => boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => { if (ref.current && (!run || run())) ref.current.rotation.z += dt * speed })
  return (
    <group position={position} rotation={rotation} userData={{ noBatch: true }}>
      <mesh ref={ref} geometry={gearGeo(r, teeth ?? Math.max(7, Math.round(r * 11.5)), depth)} material={mat || MAT.bronze()} castShadow />
      <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.iron()}><cylinderGeometry args={[r * 0.16, r * 0.16, depth + 0.16, 12]} /></mesh>
    </group>
  )
}

/* ---------- vapor ---------- */
export function Steam({ position, n = 9, spread = 0.5, h = 4, s = 0.55, rate = 0.3, on }: { position: V3; n?: number; spread?: number; h?: number; s?: number; rate?: number; on?: () => number }) {
  const g = useRef<THREE.Group>(null!)
  const seeds = useMemo(() => Array.from({ length: n }, (_, i) => ({ o: i / n, x: (Math.random() - 0.5) * spread, z: (Math.random() - 0.5) * spread })), [n, spread])
  const mats = useMemo(() => seeds.map(() => new THREE.MeshBasicMaterial({ color: '#f1ece6', transparent: true, opacity: 0.3, depthWrite: false })), [seeds])
  useFrame(() => {
    const k0 = on ? on() : 1
    g.current?.children.forEach((c, i) => {
      const sd = seeds[i]
      const k = (RT.time * rate + sd.o) % 1
      c.position.set(sd.x * (1 + k * 2.5), k * h, sd.z * (1 + k * 2.5))
      c.scale.setScalar(s * (0.35 + k * 1.7))
      mats[i].opacity = 0.32 * (1 - k) * Math.min(1, k * 6) * k0
      c.visible = k0 > 0.02
    })
  })
  return <group ref={g} position={position} userData={{ noBatch: true }}>{seeds.map((_, i) => <mesh key={i} material={mats[i]} userData={{ noCollide: true }}><sphereGeometry args={[1, 10, 8]} /></mesh>)}</group>
}

/** Guarda-corpo de ferro (com colisão invisível). */
export function IronRail({ from, to, h = 1.05 }: { from: V3; to: V3; h?: number }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const len = a.distanceTo(b), yaw = Math.atan2(b.x - a.x, b.z - a.z)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const n = Math.max(2, Math.round(len / 1.6))
  return (
    <group>
      <group position={[mid.x, mid.y, mid.z]} rotation={[0, yaw, 0]}>
        {[h, h * 0.5].map((y) => <mesh key={y} position={[0, y, 0]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.07, 0.07, len]} /></mesh>)}
        {Array.from({ length: n + 1 }, (_, i) => <mesh key={i} position={[0, h / 2, -len / 2 + (i * len) / n]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.08, h, 0.08]} /></mesh>)}
      </group>
      <Block size={[0.3, 2, len]} position={[mid.x, mid.y + 1, mid.z]} rotation={[0, yaw, 0]} />
    </group>
  )
}

/* ---------- galpão ---------- */
function WallBox({ from, to, h, t = 0.6, rx, y0 = 0 }: { from: V3; to: V3; h: number; t?: number; rx?: number; y0?: number }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const len = a.distanceTo(b), yaw = Math.atan2(b.x - a.x, b.z - a.z)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return (
    <Solid position={[mid.x, y0 + h / 2, mid.z]} rotation={[0, yaw, 0]}>
      <mesh material={brickMat(rx ?? Math.max(1, Math.round(len / 4)), Math.max(1, Math.round(h / 4)))} castShadow receiveShadow><boxGeometry args={[t, h, len]} /></mesh>
    </Solid>
  )
}
function ArchWindow({ position, rotY }: { position: V3; rotY: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape(); const w = 1.6, h = 5
    s.moveTo(-w, 0); s.lineTo(w, 0); s.lineTo(w, h); s.absarc(0, h, w, 0, Math.PI, false); s.lineTo(-w, 0)
    const g = new THREE.ShapeGeometry(s, 16)
    const uv = g.attributes.uv as THREE.BufferAttribute, pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w) / (2 * w), pos.getY(i) / (h + w))
    return g
  }, [])
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh geometry={geo} material={windowMat()} userData={{ noCollide: true }} />
      <mesh position={[0, -0.15, 0.08]} material={MAT.stoneDark()} userData={{ noCollide: true }}><boxGeometry args={[3.8, 0.3, 0.3]} /></mesh>
    </group>
  )
}
function Truss({ z }: { z: number }) {
  const W = HALL.x * 2, y = HALL.h
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, y, 0]} material={MAT.iron()} castShadow userData={{ noCollide: true }}><boxGeometry args={[W, 0.5, 0.35]} /></mesh>
      <mesh position={[0, y - 2.2, 0]} material={MAT.iron()} castShadow userData={{ noCollide: true }}><boxGeometry args={[W, 0.22, 0.25]} /></mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const x = -HALL.x + 2 + i * ((W - 4) / 8)
        return <mesh key={i} position={[x, y - 1.1, 0]} rotation={[0, 0, i % 2 ? 0.75 : -0.75]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.16, 2.9, 0.16]} /></mesh>
      })}
      {[-1, 1].map((s) => <mesh key={s} position={[s * (HALL.x - 0.55), y - 3, 0]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.5, 6, 0.4]} /></mesh>)}
    </group>
  )
}
function Pipes() {
  const L = HALL.zFront - HALL.zBack, zc = (HALL.zFront + HALL.zBack) / 2
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {[9.4, 10.2].map((y, i) => <mesh key={y} position={[s * (HALL.x - 0.75 - i * 0.05), y, zc]} rotation={[Math.PI / 2, 0, 0]} material={i ? MAT.copper() : MAT.bronzeDark()} userData={{ noCollide: true }}><cylinderGeometry args={[0.22, 0.22, L, 12]} /></mesh>)}
          {Array.from({ length: 13 }, (_, i) => { const z = HALL.zBack + 4 + i * 8; return <mesh key={i} position={[s * (HALL.x - 0.75), 9.4, z]} rotation={[Math.PI / 2, 0, 0]} material={MAT.iron()} userData={{ noCollide: true }}><torusGeometry args={[0.28, 0.07, 6, 16]} /></mesh> })}
          {[30, 2, -26].map((z) => <mesh key={z} position={[s * (HALL.x - 0.95), 4.7, z]} material={MAT.copper()} userData={{ noCollide: true }}><cylinderGeometry args={[0.18, 0.18, 9.4, 10]} /></mesh>)}
        </group>
      ))}
    </group>
  )
}
function Crates() {
  const items: [number, number, number, number][] = [[14.5, 0, 42, 1.2], [15.6, 0, 40.4, 1], [14.6, 1.2, 41.9, 0.9], [-15, 0, 44, 1.3], [-14, 0, 31, 1], [15, 0, 28, 1.1], [15.4, 0, -18, 1], [-15.5, 0, -34, 1.2], [15, 0, -33.5, 1.1], [14, 0, -34.5, 0.8]]
  return <>{items.map(([x, y, z, s], i) => (
    <group key={i} position={[x, y + s / 2, z]} rotation={[0, i * 0.7, 0]}>
      <mesh material={MAT.wood()} castShadow receiveShadow><boxGeometry args={[s, s, s]} /></mesh>
      <mesh material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[s + 0.04, 0.12, s + 0.04]} /></mesh>
    </group>
  ))}</>
}
function Barrels() {
  const items: V3[] = [[-15.8, 0, 38], [-14.8, 0, 38.6], [-15.6, 0, 36.9], [15.8, 0, 9], [-15.8, 0, -16], [16, 0, -38.5]]
  return <>{items.map((p, i) => (
    <group key={i} position={p}>
      <mesh position={[0, 0.65, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[0.48, 0.48, 1.3, 16]} /></mesh>
      {[0.25, 1.05].map((y) => <mesh key={y} position={[0, y, 0]} material={MAT.copper()} userData={{ noCollide: true }}><torusGeometry args={[0.49, 0.04, 6, 20]} /></mesh>)}
    </group>
  ))}</>
}

/** Esteira aérea com ganchos (movimento constante no teto). */
function OverheadLine() {
  const g = useRef<THREE.Group>(null!)
  const N = 9, W = HALL.x * 2 - 2
  useFrame(() => { g.current?.children.forEach((c, i) => { const k = ((RT.time * 0.05 + i / N) % 1); c.position.x = -W / 2 + k * W }) })
  return (
    <group position={[0, 9.6, -6]}>
      <mesh material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[W + 1, 0.25, 0.25]} /></mesh>
      <group ref={g} userData={{ noBatch: true }}>
        {Array.from({ length: N }, (_, i) => (
          <group key={i}>
            <mesh position={[0, -0.9, 0]} material={MAT.iron()}><cylinderGeometry args={[0.03, 0.03, 1.8, 6]} /></mesh>
            <mesh position={[0, -2.1, 0]} material={i % 3 ? boxMat() : MAT.copper()}><boxGeometry args={[0.8, 0.8, 0.8]} /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Boiler({ position, s = 1 }: { position: V3; s?: number }) {
  return (
    <group position={position} scale={s}>
      <Solid>
        <mesh position={[0, 2.6, 0]} material={MAT.copper()} castShadow receiveShadow><cylinderGeometry args={[1.7, 1.7, 5.2, 24]} /></mesh>
        <mesh position={[0, 0.4, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[1.9, 2, 0.8, 24]} /></mesh>
      </Solid>
      <mesh position={[0, 5.4, 0]} material={MAT.bronzeDark()} userData={{ noCollide: true }}><sphereGeometry args={[1.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      {[1.2, 2.6, 4].map((y) => <mesh key={y} position={[0, y, 0]} material={MAT.iron()} userData={{ noCollide: true }}><torusGeometry args={[1.72, 0.06, 6, 32]} /></mesh>)}
      <mesh position={[0, 1.1, 1.62]} material={MAT.glowWarm()} userData={{ noCollide: true }}><boxGeometry args={[1.1, 0.8, 0.2]} /></mesh>
      <mesh position={[0, 9.5, 0]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.35, 0.4, 8, 12]} /></mesh>
      <mesh position={[0.9, 3.4, 1.4]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><cylinderGeometry args={[0.32, 0.32, 0.12, 20]} /></mesh>
    </group>
  )
}

/** Paredes, piso, treliças, janelas, canos, caixotes e luzes. */
export function Hall() {
  const W = HALL.x, F = HALL.zFront, B = HALL.zBack, L = F - B, zc = (F + B) / 2
  return (
    <>
      <Batch>
        <Solid><mesh position={[0, 0, zc]} rotation={[-Math.PI / 2, 0, 0]} material={plateMat(W / 4, L / 8)} receiveShadow><planeGeometry args={[W * 2, L]} /></mesh></Solid>
        <WallBox from={[-W, 0, F]} to={[-W, 0, B]} h={HALL.h} rx={26} />
        <WallBox from={[W, 0, F]} to={[W, 0, B]} h={HALL.h} rx={26} />
        <WallBox from={[-W, 0, F]} to={[W, 0, F]} h={HALL.h} rx={9} />
        <WallBox from={[-W, 0, B]} to={[W, 0, B]} h={HALL.h} rx={9} />
        {/* divisórias com portões */}
        {([[PART.p1, 0], [PART.p2, 5], [PART.p3, 0]] as [number, number][]).map(([z, gx], i) => (
          <group key={i}>
            <WallBox from={[-W, 0, z]} to={[gx - 2.5, 0, z]} h={PART.h} />
            <WallBox from={[gx + 2.5, 0, z]} to={[W, 0, z]} h={PART.h} />
            <mesh position={[0, PART.h + 0.12, z]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[W * 2, 0.24, 0.8]} /></mesh>
          </group>
        ))}
        {Array.from({ length: 13 }, (_, i) => <Truss key={i} z={B + 6 + i * 8} />)}
        {[40, 24, 4, -12, -28, -46].map((z) => [-1, 1].map((s) => <ArchWindow key={z + '_' + s} position={[s * (W - 0.31), 3.6, z]} rotY={-s * Math.PI / 2} />))}
        <Pipes />
        <Crates />
        <Barrels />
        <Boiler position={[-14.6, 0, 19]} />
        <Boiler position={[-14.4, CORE_Y, -51]} s={0.9} />
        <Boiler position={[14.4, CORE_Y, -51]} s={0.9} />
        {/* porta de entrada (fechada) */}
        <mesh position={[0, 3.2, F - 0.34]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[5.4, 6.4, 0.1]} /></mesh>
        <mesh position={[0, 6.6, F - 0.36]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[6, 0.5, 0.2]} /></mesh>
        {/* plataforma do núcleo */}
        <Solid><mesh position={[0, CORE_Y / 2, -49]} material={plateMat(8, 4)} receiveShadow castShadow><boxGeometry args={[W * 2 - 0.6, CORE_Y, 17.6]} /></mesh></Solid>
        <mesh position={[0, CORE_Y - 0.1, -40.18]} material={MAT.bronze()} userData={{ noCollide: true }}><boxGeometry args={[W * 2 - 0.6, 0.2, 0.1]} /></mesh>
        <Stairs from={[0, 0, -36.9]} to={[0, CORE_Y, -40.25]} w={6} rail={false} />
        {/* passarelas nas laterais (decoração) */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * (W - 1.4), 6.2, zc]} material={plateMat(1, 26)} userData={{ noCollide: true }}><boxGeometry args={[2.2, 0.15, L - 1]} /></mesh>
            <mesh position={[s * (W - 2.5), 7.2, zc]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.06, 0.06, L - 1]} /></mesh>
            {Array.from({ length: 27 }, (_, i) => <mesh key={i} position={[s * (W - 2.5), 6.7, B + 1 + i * 4]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.06, 1, 0.06]} /></mesh>)}
            {Array.from({ length: 14 }, (_, i) => <mesh key={'b' + i} position={[s * (W - 1.2), 5.6, B + 2 + i * 8]} rotation={[0, 0, s * 0.8]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.12, 1.6, 0.12]} /></mesh>)}
          </group>
        ))}
      </Batch>
      {/* engrenagens grandes nas paredes */}
      <SpinGear position={[-W + 0.5, 8, 34]} rotation={[0, Math.PI / 2, 0]} r={2.6} speed={0.12} mat={MAT.bronzeDark()} depth={0.35} />
      <SpinGear position={[-W + 0.55, 10.4, 30.2]} rotation={[0, Math.PI / 2, 0]} r={1.4} speed={-0.22} mat={MAT.copper()} depth={0.3} />
      <SpinGear position={[W - 0.5, 8.4, -2]} rotation={[0, -Math.PI / 2, 0]} r={2.2} speed={-0.15} mat={MAT.bronzeDark()} depth={0.35} />
      <SpinGear position={[W - 0.55, 6.2, 1.6]} rotation={[0, -Math.PI / 2, 0]} r={1.2} speed={0.27} mat={MAT.copper()} depth={0.3} />
      <SpinGear position={[W - 0.5, 9, -30]} rotation={[0, -Math.PI / 2, 0]} r={3} speed={0.1} mat={MAT.bronzeDark()} depth={0.35} />
      <SpinGear position={[-W + 0.5, 8.6, -22]} rotation={[0, Math.PI / 2, 0]} r={1.8} speed={-0.18} mat={MAT.bronze()} depth={0.3} />
      <OverheadLine />
      <Steam position={[-14.6, 13.6, 19]} n={10} h={6} s={0.8} rate={0.18} />
      <Steam position={[-16.9, 10, 8]} n={6} h={2.4} s={0.35} rate={0.4} />
      <Steam position={[16.9, 10.2, -24]} n={6} h={2.4} s={0.35} rate={0.35} />
      {[36, 20, 0, -28, -47].map((z, i) => <group key={z}><Lantern position={[i % 2 ? 4 : -4, 9.4, z]} hanging /><mesh position={[i % 2 ? 4 : -4, 12, z]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.03, 0.03, 4.6, 6]} /></mesh></group>)}
      <pointLight position={[-13, 3, 21]} color="#ff9a4a" intensity={14} distance={16} decay={1.6} />
      <pointLight position={[0, 8, 28]} color="#ffc080" intensity={10} distance={30} decay={1.3} />
      <pointLight position={[0, 8, -4]} color="#ffc080" intensity={10} distance={30} decay={1.3} />
      <pointLight position={[0, 8, -28]} color="#ffd29a" intensity={9} distance={22} decay={1.4} />
      <pointLight position={[0, 9, -46]} color="#ffb870" intensity={14} distance={26} decay={1.3} />
      {/* placas */}
      <Text font={FONT.title} fontSize={0.9} position={[0, 11.6, F - 0.5]} rotation={[0, Math.PI, 0]} color="#ffd9a0" anchorX="center" outlineWidth={0.03} outlineColor="#2a140a">OFICINA DAS MÁQUINAS</Text>
      <Text font={FONT.title} fontSize={0.55} position={[-9, 4.7, PART.p1 + 0.33]} color="#ffe2b0" anchorX="center" outlineWidth={0.02} outlineColor="#2a140a">TRANSMISSÃO</Text>
      <Text font={FONT.title} fontSize={0.55} position={[9, 4.6, PART.p1 + 0.33]} color="#ffe2b0" anchorX="center" outlineWidth={0.02} outlineColor="#2a140a">LINHA DE PRODUÇÃO »</Text>
      <Text font={FONT.title} fontSize={0.55} position={[-9, 4.6, PART.p2 + 0.33]} color="#ffe2b0" anchorX="center" outlineWidth={0.02} outlineColor="#2a140a">MÁQUINA DE CALCULAR</Text>
      <Text font={FONT.title} fontSize={0.55} position={[11.5, 4.6, PART.p2 + 0.33]} color="#ffe2b0" anchorX="center" outlineWidth={0.02} outlineColor="#2a140a">SALA DOS CARTÕES »</Text>
      <Text font={FONT.title} fontSize={0.55} position={[-9, 4.6, PART.p3 + 0.33]} color="#ffe2b0" anchorX="center" outlineWidth={0.02} outlineColor="#2a140a">NÚCLEO »</Text>
    </>
  )
}
