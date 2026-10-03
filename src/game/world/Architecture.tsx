import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MAT } from './materials'
import { Solid, Ramp, Block } from './core'
import { bannerTex } from './textures'
import { RT } from '../engine/runtime'
import { QUALITY } from '../engine/quality'

type V3 = [number, number, number]

/** Junta malhas estáticas por material (menos chamadas de desenho). Mantém as originais ocultas para colisão.
 * Partes animadas ou que mudam de visibilidade: marque um ancestral com userData={{ noBatch: true }} (ou use <Dyn>). */
export function Batch({ children, shadows = true }: { children?: ReactNode; shadows?: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const [merged, setMerged] = useState<THREE.Mesh[]>([])
  useLayoutEffect(() => {
    const g = ref.current
    g.updateWorldMatrix(true, true)
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert()
    const groups = new Map<THREE.Material, THREE.BufferGeometry[]>()
    const m4 = new THREE.Matrix4()
    // pula malhas ocultas, animadas (algum ancestral com userData.noBatch) e materiais especiais (texto 3D, shaders)
    const skip = (o: THREE.Object3D) => { let p: THREE.Object3D | null = o; while (p && p !== g) { if (!p.visible || p.userData.noBatch) return true; p = p.parent } return false }
    const okMat = (m: any) => m && (m.isMeshStandardMaterial || m.isMeshBasicMaterial || m.isMeshPhysicalMaterial || m.isMeshLambertMaterial) && !m.isDerivedMaterial && !m.wireframe && !m.transparent && !m.onBeforeCompile?.toString().includes('troika')
    g.traverse((o: any) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.geometry?.isInstancedBufferGeometry || Array.isArray(o.material) || o.userData.merged || skip(o) || !okMat(o.material) || o.onBeforeRender?.length) return
      let geo: THREE.BufferGeometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k)
      if (!geo.attributes.normal) geo.computeVertexNormals()
      if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2))
      geo.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld))
      if (!groups.has(o.material)) groups.set(o.material, [])
      groups.get(o.material)!.push(geo)
      o.visible = false
    })
    const out: THREE.Mesh[] = []
    for (const [mat, geos] of groups) {
      const mg = mergeGeometries(geos, false)
      geos.forEach((x) => x.dispose())
      if (!mg) continue
      const mesh = new THREE.Mesh(mg, mat)
      mesh.castShadow = shadows; mesh.receiveShadow = true
      mesh.userData.noCollide = true; mesh.userData.merged = true
      out.push(mesh)
    }
    setMerged(out)
    return () => out.forEach((m) => m.geometry.dispose())
  }, [])
  return <group ref={ref}>{children}{merged.map((m, i) => <primitive key={i} object={m} />)}</group>
}

/** Grupo que nunca é juntado pelo Batch (partes animadas, que somem/aparecem). */
export function Dyn({ children, ...props }: { children?: ReactNode } & Record<string, any>) {
  return <group {...props} userData={{ ...(props.userData || {}), noBatch: true }}>{children}</group>
}

/* ---------- geometrias compartilhadas ---------- */
const GEO: Record<string, THREE.BufferGeometry> = {}
const geo = (k: string, f: () => THREE.BufferGeometry) => (GEO[k] ||= f())

function archGeometry(w: number, h: number, d: number, open: number) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0)
  const r = open / 2, sh = h - r - Math.min(0.6, h * 0.12)
  const hole = new THREE.Path()
  hole.moveTo(-r, 0); hole.lineTo(-r, sh); hole.absarc(0, sh, r, Math.PI, 0, true); hole.lineTo(r, 0); hole.lineTo(-r, 0)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1, curveSegments: 16 })
  g.translate(0, 0, -d / 2)
  // UV mundial simples
  const p = g.attributes.position, uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) * 0.25, p.getY(i) * 0.25)
  return g
}

/** Coluna clássica. */
export function Column({ position, h = 4, r = 0.32, mat = 'marble' as 'marble' | 'stone', broken = false }: { position: V3; h?: number; r?: number; mat?: 'marble' | 'stone'; broken?: boolean }) {
  const m = mat === 'marble' ? MAT.marble() : MAT.stone()
  const shaft = geo('shaft', () => new THREE.CylinderGeometry(0.88, 1, 1, 16, 1))
  const sh = broken ? h * 0.55 : h
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} material={MAT.stone()} castShadow receiveShadow><boxGeometry args={[r * 2.8, 0.24, r * 2.8]} /></mesh>
      <mesh position={[0, 0.3, 0]} material={m} castShadow><cylinderGeometry args={[r * 1.15, r * 1.3, 0.16, 16]} /></mesh>
      <mesh geometry={shaft} position={[0, 0.38 + (sh - 0.9) / 2, 0]} scale={[r, sh - 0.9, r]} material={m} castShadow receiveShadow />
      {!broken && <>
        <mesh position={[0, h - 0.42, 0]} material={m} castShadow><cylinderGeometry args={[r * 1.3, r * 0.92, 0.26, 16]} /></mesh>
        <mesh position={[0, h - 0.18, 0]} material={MAT.stone()} castShadow><boxGeometry args={[r * 3, 0.24, r * 3]} /></mesh>
      </>}
    </group>
  )
}

/** Arco de pedra (bloco com abertura em semicírculo). */
export function Arch({ position, rotation = [0, 0, 0], w = 4, h = 5, d = 0.9, open = 2.4, solid = true, mat }: { position: V3; rotation?: V3; w?: number; h?: number; d?: number; open?: number; solid?: boolean; mat?: THREE.Material }) {
  const g = useMemo(() => archGeometry(w, h, d, open), [w, h, d, open])
  const m = mat || MAT.wall(1)
  const inner = (
    <>
      <mesh geometry={g} material={m} castShadow receiveShadow />
      <mesh position={[0, h + 0.15, 0]} material={MAT.stone()} castShadow><boxGeometry args={[w + 0.3, 0.3, d + 0.3]} /></mesh>
    </>
  )
  return (
    <group position={position} rotation={rotation}>
      {solid ? <Solid>{inner}</Solid> : inner}
    </group>
  )
}

/** Escadaria: degraus visuais + rampa invisível de colisão. dir em graus (0 = sobe para -z). */
export function Stairs({ from, to, w = 3, rail = true }: { from: V3; to: V3; w?: number; rail?: boolean }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const d = new THREE.Vector3().subVectors(b, a)
  const flat = Math.hypot(d.x, d.z)
  const rise = d.y
  const steps = Math.max(2, Math.round(Math.abs(rise) / 0.2))
  const yaw = Math.atan2(d.x, d.z)
  const sd = flat / steps, shh = rise / steps
  return (
    <>
      <group position={from} rotation={[0, yaw, 0]}>
        {Array.from({ length: steps }, (_, i) => (
          <mesh key={i} position={[0, (shh * (i + 1)) / 2, sd * (i + 0.5)]} material={MAT.stone()} receiveShadow castShadow>
            <boxGeometry args={[w, Math.abs(shh) * (i + 1) + 0.02, sd + 0.02]} />
          </mesh>
        ))}
        {rail && [-1, 1].map((s) => (
          <mesh key={s} position={[s * (w / 2 + 0.18), rise / 2 + 0.35, flat / 2]} rotation={[-Math.atan2(rise, flat), 0, 0]} material={MAT.stoneDark()} castShadow>
            <boxGeometry args={[0.36, 0.7, Math.hypot(flat, rise) + 0.2]} />
          </mesh>
        ))}
      </group>
      <Ramp from={from} to={to} w={w} />
      {rail && [-1, 1].map((s) => {
        const off = new THREE.Vector3(Math.cos(yaw) * s * (w / 2 + 0.18), 0, -Math.sin(yaw) * s * (w / 2 + 0.18))
        const p = a.clone().add(b).multiplyScalar(0.5).add(off)
        return <Block key={s} size={[0.4, 2.2, Math.hypot(flat, rise) + 0.2]} position={[p.x, p.y + 1, p.z]} rotation={[0, yaw, 0]} />
      })}
    </>
  )
}

/** Plataforma redonda de pedra com borda. */
export function RoundPlatform({ position, r = 8, h = 1, rep = 4, rim = true }: { position: V3; r?: number; h?: number; rep?: number; rim?: boolean }) {
  return (
    <group position={position}>
      <Solid>
        <mesh position={[0, -h / 2, 0]} material={MAT.wall(2)} receiveShadow castShadow><cylinderGeometry args={[r, r * 0.97, h, 48]} /></mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.floor(rep)} receiveShadow><circleGeometry args={[r, 48]} /></mesh>
      </Solid>
      {rim && <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.stoneDark()} receiveShadow userData={{ noCollide: true }}><ringGeometry args={[r - 0.5, r, 48]} /></mesh>}
      <mesh position={[0, -0.2, 0]} material={MAT.stone()} castShadow receiveShadow userData={{ noCollide: true }}><cylinderGeometry args={[r + 0.18, r + 0.12, 0.4, 48, 1, true]} /></mesh>
      {h > 1.5 && <mesh position={[0, -h + 0.25, 0]} material={MAT.stoneDark()} receiveShadow userData={{ noCollide: true }}><cylinderGeometry args={[r * 0.97 + 0.2, r * 0.97 + 0.3, 0.5, 48, 1, true]} /></mesh>}
    </group>
  )
}

/** Plataforma retangular. */
export function RectPlatform({ position, size, rep = 3, rotation = [0, 0, 0] }: { position: V3; size: [number, number, number]; rep?: number; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Solid>
        <mesh position={[0, -size[1] / 2, 0]} material={MAT.wall(2)} receiveShadow castShadow><boxGeometry args={size} /></mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.floor(rep)} receiveShadow><planeGeometry args={[size[0], size[2]]} /></mesh>
      </Solid>
    </group>
  )
}

/** Balaustrada (guarda-corpo) reta entre dois pontos, com colisão. */
export function Balustrade({ from, to, h = 1.05 }: { from: V3; to: V3; h?: number }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const len = a.distanceTo(b), yaw = Math.atan2(b.x - a.x, b.z - a.z)
  const n = Math.max(2, Math.floor(len / 0.42))
  const bal = geo('baluster', () => { const pts = [[0.06, 0], [0.1, 0.05], [0.06, 0.18], [0.11, 0.42], [0.07, 0.62], [0.05, 0.7], [0.08, 0.76], [0.0, 0.78]].map(([x, y]) => new THREE.Vector2(x, y)); return new THREE.LatheGeometry(pts, 8) })
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return (
    <>
      <group position={from} rotation={[0, yaw, 0]}>
        <mesh position={[0, 0.08, len / 2]} material={MAT.stone()} receiveShadow castShadow><boxGeometry args={[0.32, 0.16, len]} /></mesh>
        {Array.from({ length: n }, (_, i) => <mesh key={i} geometry={bal} position={[0, 0.16, (i + 0.5) * (len / n)]} scale={[1, (h - 0.3) / 0.78, 1]} material={MAT.marble()} castShadow />)}
        <mesh position={[0, h - 0.07, len / 2]} material={MAT.stone()} castShadow receiveShadow><boxGeometry args={[0.36, 0.14, len + 0.1]} /></mesh>
      </group>
      <Block size={[0.4, 3, len]} position={[mid.x, mid.y + 1.4, mid.z]} rotation={[0, yaw, 0]} />
    </>
  )
}

/** Balaustrada em arco (círculo parcial). */
export function RingBalustrade({ center, r, a0 = 0, a1 = Math.PI * 2, gaps = [] as [number, number][], seg = 24 }: { center: V3; r: number; a0?: number; a1?: number; gaps?: [number, number][]; seg?: number }) {
  const parts: ReactNode[] = []
  // ângulos podem vir negativos ou passar de 2π: compara dando a volta no círculo
  const TAU = Math.PI * 2
  const inGap = (a: number) => gaps.some(([g0, g1]) => (((a - g0) % TAU) + TAU) % TAU < g1 - g0)
  for (let i = 0; i < seg; i++) {
    const t0 = a0 + (a1 - a0) * (i / seg), t1 = a0 + (a1 - a0) * ((i + 1) / seg)
    if (inGap((t0 + t1) / 2)) continue
    parts.push(<Balustrade key={i} from={[center[0] + Math.cos(t0) * r, center[1], center[2] + Math.sin(t0) * r]} to={[center[0] + Math.cos(t1) * r, center[1], center[2] + Math.sin(t1) * r]} />)
  }
  return <>{parts}</>
}

/** Lanterna de pedra com luz quente. */
export function Lantern({ position, h = 1.6, light = false, hanging = false }: { position: V3; h?: number; light?: boolean; hanging?: boolean }) {
  const useLight = light && QUALITY.q === 'high'
  return (
    <group position={position}>
      {!hanging && <>
        <mesh position={[0, 0.12, 0]} material={MAT.stoneDark()} castShadow><boxGeometry args={[0.42, 0.24, 0.42]} /></mesh>
        <mesh position={[0, h / 2, 0]} material={MAT.stone()} castShadow><boxGeometry args={[0.2, h - 0.2, 0.2]} /></mesh>
      </>}
      <group position={[0, h + 0.2, 0]}>
        <mesh material={MAT.bronzeDark()} position={[0, -0.22, 0]}><boxGeometry args={[0.38, 0.06, 0.38]} /></mesh>
        <mesh material={MAT.glowWarm()}><boxGeometry args={[0.26, 0.36, 0.26]} /></mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => <mesh key={i} position={[x * 0.15, 0, z * 0.15]} material={MAT.bronzeDark()}><boxGeometry args={[0.04, 0.42, 0.04]} /></mesh>)}
        <mesh position={[0, 0.27, 0]} material={MAT.bronzeDark()} castShadow><coneGeometry args={[0.3, 0.22, 4]} /></mesh>
        {useLight && <pointLight color="#ffb35a" intensity={6} distance={9} decay={2} />}
      </group>
    </group>
  )
}

/** Estandarte pendurado que balança ao vento. */
export function Banner({ position, rotY = 0, w = 1.2, h = 3, emblem = 'compass' as 'compass' | 'sun' | 'star' | 'eye', color = '#1d2c66', pole = true }: { position: V3; rotY?: number; w?: number; h?: number; emblem?: 'compass' | 'sun' | 'star' | 'eye'; color?: string; pole?: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  const g = useMemo(() => new THREE.PlaneGeometry(w, h, 6, 10), [w, h])
  const base = useMemo(() => Float32Array.from(g.attributes.position.array as Float32Array), [g])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: bannerTex(emblem, color), side: THREE.DoubleSide, roughness: 0.85 }), [emblem, color])
  const ph = useMemo(() => Math.random() * 6, [])
  useFrame(() => {
    if (QUALITY.q !== 'high') return
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) { const y = base[i * 3 + 1], x = base[i * 3]; const k = (h / 2 - y) / h; p.setZ(i, Math.sin(RT.time * 1.6 + y * 1.5 + x + ph) * 0.12 * k) }
    p.needsUpdate = true
  })
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {pole && <mesh position={[0, h / 2 + 0.1, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.gold()}><cylinderGeometry args={[0.035, 0.035, w + 0.3, 8]} /></mesh>}
      <mesh ref={ref} geometry={g} material={mat} castShadow userData={{ noCollide: true, noBatch: true }} />
    </group>
  )
}

/** Estátua de sábio em túnica sobre pedestal. */
export function Statue({ position, rotY = 0, s = 1, pose = 'think' as 'think' | 'point' | 'book' }: { position: V3; rotY?: number; s?: number; pose?: 'think' | 'point' | 'book' }) {
  const robe = geo('robe', () => new THREE.LatheGeometry([[0.0, 0], [0.42, 0], [0.4, 0.4], [0.33, 1.0], [0.3, 1.45], [0.34, 1.6], [0.18, 1.72], [0.0, 1.74]].map(([x, y]) => new THREE.Vector2(x, y)), 18))
  const m = MAT.marble()
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={s}>
      <Solid><mesh position={[0, 0.5, 0]} material={MAT.stone()} castShadow receiveShadow><boxGeometry args={[1.2, 1, 1.2]} /></mesh></Solid>
      <mesh position={[0, 1.04, 0]} material={MAT.stoneDark()}><boxGeometry args={[1.3, 0.08, 1.3]} /></mesh>
      <group position={[0, 1.08, 0]}>
        <mesh geometry={robe} material={m} castShadow />
        <mesh position={[0, 1.95, 0.02]} material={m} castShadow><sphereGeometry args={[0.2, 16, 12]} /></mesh>
        <mesh position={[0, 1.83, 0.1]} material={m}><sphereGeometry args={[0.13, 10, 8]} /></mesh>
        <mesh position={[0.32, 1.3, 0.12]} rotation={[pose === 'point' ? -1.6 : -0.6, 0, pose === 'think' ? 0.9 : 0.2]} material={m} castShadow><capsuleGeometry args={[0.08, 0.5, 4, 8]} /></mesh>
        <mesh position={[-0.32, 1.25, 0.08]} rotation={[pose === 'book' ? -1.0 : -0.2, 0, -0.25]} material={m} castShadow><capsuleGeometry args={[0.08, 0.5, 4, 8]} /></mesh>
        {pose === 'book' && <mesh position={[-0.2, 1.05, 0.38]} rotation={[0.3, 0, 0]} material={m}><boxGeometry args={[0.4, 0.06, 0.3]} /></mesh>}
      </group>
    </group>
  )
}

/** Árvore estilizada. */
export function Tree({ position, s = 1, kind = 'round' as 'round' | 'cypress' | 'olive', seed = 1 }: { position: V3; s?: number; kind?: 'round' | 'cypress' | 'olive'; seed?: number }) {
  const blob = geo('blob', () => new THREE.IcosahedronGeometry(1, 1))
  const r = (k: number) => Math.abs(Math.sin(seed * 12.9898 + k * 78.233)) % 1
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, 1.1, 0]} material={MAT.bark()} castShadow><cylinderGeometry args={[0.16, 0.26, 2.2, 7]} /></mesh></Solid>
      {kind === 'cypress' ? (
        <mesh position={[0, 3.4, 0]} material={MAT.foliage()} castShadow><coneGeometry args={[0.9, 4.4, 8]} /></mesh>
      ) : (
        Array.from({ length: kind === 'olive' ? 4 : 5 }, (_, i) => (
          <mesh key={i} geometry={blob} position={[(r(i) - 0.5) * 1.6, 2.6 + r(i + 9) * 1.2, (r(i + 3) - 0.5) * 1.6]} scale={(kind === 'olive' ? 0.8 : 1.05) + r(i + 5) * 0.5} material={i % 2 ? MAT.foliage() : MAT.foliage2()} castShadow />
        ))
      )}
    </group>
  )
}

/** Arbusto com flores. */
export function Bush({ position, s = 1, flowers = 'A' as 'A' | 'B' | 'C' | null }: { position: V3; s?: number; flowers?: 'A' | 'B' | 'C' | null }) {
  const blob = geo('blob', () => new THREE.IcosahedronGeometry(1, 1))
  const fm = flowers === 'A' ? MAT.flowerA() : flowers === 'B' ? MAT.flowerB() : MAT.flowerC()
  return (
    <group position={position} scale={s}>
      <mesh geometry={blob} position={[0, 0.35, 0]} scale={[0.6, 0.45, 0.6]} material={MAT.foliage()} castShadow />
      <mesh geometry={blob} position={[0.35, 0.3, 0.1]} scale={[0.4, 0.35, 0.4]} material={MAT.foliage2()} castShadow />
      {flowers && [0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.3) * 0.4, 0.6 + (i % 2) * 0.08, Math.sin(i * 1.3) * 0.4]} material={fm}><sphereGeometry args={[0.07, 6, 5]} /></mesh>)}
    </group>
  )
}

/** Hera pendurada (cachos verdes). */
export function Ivy({ position, len = 2, w = 1.2, rotY = 0 }: { position: V3; len?: number; w?: number; rotY?: number }) {
  const blob = geo('blob', () => new THREE.IcosahedronGeometry(1, 1))
  const n = Math.floor(len * w * 3)
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const x = ((i * 0.618) % 1 - 0.5) * w, y = -((i * 0.381) % 1) * len
        return <mesh key={i} geometry={blob} position={[x, y, 0.05]} scale={[0.18, 0.26, 0.1]} material={MAT.ivy()} />
      })}
    </group>
  )
}

/** Banco de pedra. */
export function Bench({ position, rotY = 0 }: { position: V3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        <mesh position={[0, 0.45, 0]} material={MAT.stone()} castShadow receiveShadow><boxGeometry args={[1.6, 0.14, 0.5]} /></mesh>
        {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, 0.2, 0]} material={MAT.stoneDark()} castShadow><boxGeometry args={[0.22, 0.4, 0.42]} /></mesh>)}
      </Solid>
    </group>
  )
}

/** Pedestal para objetos. */
export function Pedestal({ position, h = 1, r = 0.45, mat }: { position: V3; h?: number; r?: number; mat?: THREE.Material }) {
  return (
    <Solid position={position}>
      <mesh position={[0, 0.08, 0]} material={MAT.stoneDark()} castShadow receiveShadow><cylinderGeometry args={[r * 1.25, r * 1.35, 0.16, 20]} /></mesh>
      <mesh position={[0, h / 2, 0]} material={mat || MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[r * 0.8, r * 0.9, h - 0.2, 20]} /></mesh>
      <mesh position={[0, h - 0.06, 0]} material={MAT.stone()} castShadow receiveShadow><cylinderGeometry args={[r * 1.15, r, 0.14, 20]} /></mesh>
    </Solid>
  )
}

/** Braseiro com fogo. */
export function Brazier({ position, s = 1 }: { position: V3; s?: number }) {
  const fire = useRef<THREE.Group>(null!)
  useFrame(() => { if (fire.current) fire.current.children.forEach((c, i) => { const k = 0.85 + Math.sin(RT.time * (9 + i * 3) + i) * 0.15; c.scale.set(k, k * (1.1 + Math.sin(RT.time * 7 + i) * 0.2), k) }) })
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, 0.5, 0]} material={MAT.bronzeDark()} castShadow><cylinderGeometry args={[0.12, 0.25, 1, 10]} /></mesh></Solid>
      <mesh position={[0, 1.05, 0]} material={MAT.bronze()} castShadow><cylinderGeometry args={[0.45, 0.25, 0.25, 16, 1, true]} /></mesh>
      <group ref={fire} position={[0, 1.15, 0]} userData={{ noBatch: true }}>
        <mesh material={MAT.glowWarm()} position={[0, 0.15, 0]}><coneGeometry args={[0.28, 0.6, 8]} /></mesh>
        <mesh position={[0.1, 0.1, 0.05]}><coneGeometry args={[0.16, 0.42, 7]} /><meshBasicMaterial color="#fff2c0" toneMapped={false} /></mesh>
      </group>
    </group>
  )
}

/** Base rochosa da montanha flutuante (penhasco). */
export function Cliff({ position, r = 40, depth = 50, top = true, seed = 3, grassR }: { position: V3; r?: number; depth?: number; top?: boolean; seed?: number; grassR?: number }) {
  const g = useMemo(() => {
    const geo = new THREE.CylinderGeometry(r, r * 0.08, depth, 40, 14, true)
    const pos = geo.attributes.position, v = new THREE.Vector3()
    let s = seed; const rr = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
    const ph = Array.from({ length: 8 }, () => rr() * 6.28)
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos as any, i)
      const a = Math.atan2(v.z, v.x), t = (v.y + depth / 2) / depth
      const w = 1 + 0.07 * Math.sin(a * 5 + ph[0]) + 0.05 * Math.sin(a * 11 + ph[1]) + 0.08 * Math.sin(v.y * 0.4 + a * 3 + ph[2]) + 0.04 * Math.sin(v.y * 1.7 + ph[3])
      const sh = Math.pow(t, 0.7)
      v.x *= w * (0.25 + sh * 0.75); v.z *= w * (0.25 + sh * 0.75)
      if (t > 0.999) { v.x *= 1.0; v.z *= 1.0 }
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    geo.computeVertexNormals()
    geo.translate(0, -depth / 2, 0)
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r * 0.15, uv.getY(i) * depth * 0.08)
    return geo
  }, [r, depth, seed])
  return (
    <group position={position}>
      <mesh geometry={g} material={MAT.rock(1)} receiveShadow userData={{ noCollide: true }} />
      {top && <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.grass(8)} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[grassR ?? r * 1.02, 48]} /></mesh>}
    </group>
  )
}

/** Muro reto com colisão. */
export function Wall({ from, to, h = 3, t = 0.6, mat }: { from: V3; to: V3; h?: number; t?: number; mat?: THREE.Material }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const len = a.distanceTo(b), yaw = Math.atan2(b.x - a.x, b.z - a.z)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return (
    <Solid position={[mid.x, mid.y + h / 2, mid.z]} rotation={[0, yaw, 0]}>
      <mesh material={mat || MAT.wall(Math.max(1, Math.round(len / 4)))} castShadow receiveShadow><boxGeometry args={[t, h, len]} /></mesh>
    </Solid>
  )
}
