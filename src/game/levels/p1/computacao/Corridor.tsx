import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Solid } from '../../../world/core'
import { Batch } from '../../../world/Architecture'
import { MAT } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'

/* =========================================================
   Sala da Computação — um corredor que atravessa a história:
   relé → válvula → ENIAC → circuito → PC → servidor → data center.
   ========================================================= */
export type V3 = [number, number, number]
export const CW = 6 // meia largura do corredor
export const CH = 6 // altura do corredor
export const DC = { z0: -72, z1: -104, w: 15, h: 10 } // data center
export const ERAS = [
  { k: 'rele', z0: 12, z1: -6, year: '1940', name: 'RELÉS', wall: '#5a3a24', floor: '#7a5a3a', light: '#ffb870' },
  { k: 'valvula', z0: -6, z1: -22, year: '1946', name: 'VÁLVULAS', wall: '#2e3a34', floor: '#3a3a36', light: '#ff9a4a' },
  { k: 'eniac', z0: -22, z1: -36, year: '1950', name: 'COMPUTADOR ANTIGO', wall: '#3a3e46', floor: '#2c2e34', light: '#ffe2a0' },
  { k: 'circuito', z0: -36, z1: -48, year: '1960', name: 'TRANSISTOR E CHIP', wall: '#10261c', floor: '#0e3a22', light: '#5aff9a' },
  { k: 'pc', z0: -48, z1: -60, year: '1981', name: 'COMPUTADOR PESSOAL', wall: '#3c4256', floor: '#2a3048', light: '#9ab8ff' },
  { k: 'servidor', z0: -60, z1: -71, year: '1995', name: 'SERVIDORES', wall: '#14161c', floor: '#1a1d24', light: '#59d7ff' },
]
export const GATE_Z = [-6, -22, -71]

/* ---------- texturas ---------- */
const tc: Record<string, THREE.CanvasTexture> = {}
function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) {
  if (!tc[key]) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h
    draw(cv.getContext('2d')!)
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
    tc[key] = t
  }
  const t = tc[key].clone(); t.repeat.set(...rep); t.needsUpdate = true
  return t
}
export function pcbTex(rep: [number, number]) {
  return canvasTex('pcb', 512, 512, (c) => {
    c.fillStyle = '#0d4a2a'; c.fillRect(0, 0, 512, 512)
    c.strokeStyle = 'rgba(230,190,90,.75)'; c.lineWidth = 5; c.lineCap = 'round'
    for (let i = 0; i < 26; i++) {
      let x = Math.round(Math.random() * 16) * 32, y = Math.round(Math.random() * 16) * 32
      c.beginPath(); c.moveTo(x, y)
      for (let k = 0; k < 4; k++) { if (Math.random() < 0.5) x += (Math.random() < 0.5 ? -1 : 1) * 64; else y += (Math.random() < 0.5 ? -1 : 1) * 64; c.lineTo(x, y) }
      c.stroke()
      c.fillStyle = '#e8c060'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill()
    }
  }, rep)
}
function panelTex(rep: [number, number]) {
  return canvasTex('eniac', 256, 512, (c) => {
    c.fillStyle = '#2a2d33'; c.fillRect(0, 0, 256, 512)
    c.strokeStyle = '#15171b'; c.lineWidth = 6; c.strokeRect(4, 4, 248, 504)
    for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) { c.fillStyle = '#d8d2c0'; c.beginPath(); c.arc(40 + k * 58, 50 + r * 34, 13, 0, 7); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(40 + k * 58, 50 + r * 34); c.lineTo(40 + k * 58 + 8, 50 + r * 34 - 8); c.stroke() }
    for (let r = 0; r < 8; r++) for (let k = 0; k < 10; k++) { c.fillStyle = '#9a9a9a'; c.fillRect(22 + k * 22, 270 + r * 26, 8, 16) }
  }, rep)
}
function rackTex(rep: [number, number]) {
  return canvasTex('rack', 256, 512, (c) => {
    c.fillStyle = '#121419'; c.fillRect(0, 0, 256, 512)
    for (let u = 0; u < 20; u++) {
      const y = 8 + u * 25
      c.fillStyle = '#1d2129'; c.fillRect(10, y, 236, 21)
      c.fillStyle = '#0a0b0e'; for (let k = 0; k < 14; k++) c.fillRect(70 + k * 12, y + 5, 7, 11)
      c.fillStyle = Math.random() < 0.7 ? '#3fd0ff' : '#5aff9a'; c.fillRect(20, y + 8, 6, 5)
      c.fillStyle = Math.random() < 0.5 ? '#ffb040' : '#3fd0ff'; c.fillRect(32, y + 8, 6, 5)
    }
  }, rep)
}
const mc: Record<string, THREE.Material> = {}
const m = (k: string, f: () => THREE.Material) => mc[k] || (mc[k] = f())
export const MATS = {
  tube: () => m('tube', () => new THREE.MeshStandardMaterial({ color: '#ffd0a0', emissive: '#ff7a2a', emissiveIntensity: 2.2, roughness: 0.2 })),
  glass: () => m('glassTube', () => new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false })),
  eniac: () => m('eniac', () => new THREE.MeshStandardMaterial({ map: panelTex([1, 1]), roughness: 0.7, metalness: 0.2 })),
  rack: () => m('rack', () => new THREE.MeshStandardMaterial({ map: rackTex([1, 1]), emissive: '#ffffff', emissiveMap: rackTex([1, 1]), emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.4 })),
  rackSide: () => m('rackSide', () => new THREE.MeshStandardMaterial({ color: '#16181e', roughness: 0.5, metalness: 0.6 })),
  beige: () => m('beige', () => new THREE.MeshStandardMaterial({ color: '#d8ceb4', roughness: 0.7 })),
  screenGreen: () => m('scrG', () => new THREE.MeshStandardMaterial({ color: '#0a1a0e', emissive: '#3aff7a', emissiveIntensity: 0.6, roughness: 0.3 })),
  screenBlue: () => m('scrB', () => new THREE.MeshStandardMaterial({ color: '#0a1020', emissive: '#4a8aff', emissiveIntensity: 0.8, roughness: 0.3 })),
  tile: () => m('tile', () => new THREE.MeshStandardMaterial({ color: '#c9d2dc', roughness: 0.35, metalness: 0.2 })),
  glowCyan: () => m('glowCyan', () => new THREE.MeshStandardMaterial({ color: '#bff3ff', emissive: '#29c6ff', emissiveIntensity: 2.6 })),
}
const solid = (c: string) => m('c' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }))

/* ---------- peças ---------- */
function Walls() {
  return (
    <>
      {ERAS.map((e) => {
        const L = e.z0 - e.z1, zc = (e.z0 + e.z1) / 2
        const floorMat = e.k === 'circuito' ? new THREE.MeshStandardMaterial({ map: pcbTex([3, 3]), roughness: 0.5, emissive: '#1a5a30', emissiveIntensity: 0.25 }) : e.k === 'rele' ? MAT.wood() : solid(e.floor)
        const wallMat = e.k === 'rele' ? MAT.woodDark() : solid(e.wall)
        return (
          <group key={e.k}>
            <Solid><mesh position={[0, 0, zc]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat} receiveShadow><planeGeometry args={[CW * 2, L]} /></mesh></Solid>
            {[-1, 1].map((s) => <Solid key={s}><mesh position={[s * (CW + 0.2), CH / 2, zc]} material={wallMat} receiveShadow><boxGeometry args={[0.4, CH, L]} /></mesh></Solid>)}
            <mesh position={[0, CH, zc]} rotation={[Math.PI / 2, 0, 0]} material={solid(e.wall)} userData={{ noCollide: true }}><planeGeometry args={[CW * 2, L]} /></mesh>
            {/* faixa de luz no teto */}
            <mesh position={[0, CH - 0.05, zc]} rotation={[Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><planeGeometry args={[0.5, L - 1]} /><meshStandardMaterial color={e.light} emissive={e.light} emissiveIntensity={1.4} /></mesh>
          </group>
        )
      })}
      {/* parede de entrada */}
      <Solid><mesh position={[0, CH / 2, 12.2]} material={MAT.woodDark()}><boxGeometry args={[CW * 2, CH, 0.4]} /></mesh></Solid>
      {/* divisórias com portões (o vão tem 5 m) */}
      {GATE_Z.map((z, i) => (
        <group key={z}>
          {[-1, 1].map((s) => <Solid key={s}><mesh position={[s * (CW + 2.5) / 2, CH / 2, z]} material={solid(i === 2 ? '#14161c' : ERAS[i * 2].wall)}><boxGeometry args={[CW - 2.5, CH, 0.6]} /></mesh></Solid>)}
          <mesh position={[0, CH - 0.6, z]} material={solid(i === 2 ? '#14161c' : ERAS[i * 2].wall)} userData={{ noCollide: true }}><boxGeometry args={[5, 1.2, 0.6]} /></mesh>
        </group>
      ))}
      {/* placas das eras */}
      {ERAS.map((e) => (
        <group key={'s' + e.k} position={[-CW + 0.02, 3.9, e.z0 - 1.6]} rotation={[0, Math.PI / 2, 0]}>
          <mesh userData={{ noCollide: true }}><planeGeometry args={[3.2, 1.2]} /><meshStandardMaterial color="#0e1018" roughness={0.6} /></mesh>
          <Text font={FONT.mono} fontSize={0.36} position={[0, 0.22, 0.02]} color={e.light} anchorX="center" anchorY="middle">{e.year}</Text>
          <Text font={FONT.title} fontSize={0.28} position={[0, -0.22, 0.02]} color="#f0f0f0" anchorX="center" anchorY="middle" maxWidth={3}>{e.name}</Text>
        </group>
      ))}
    </>
  )
}

/** Armários de relés (anos 40): caixinhas de latão que estalam. */
function Relays() {
  const arms = useRef<THREE.Group>(null!)
  useFrame(() => { arms.current?.children.forEach((a, i) => { a.rotation.z = Math.sin(RT.time * (3 + (i % 5)) + i) > 0.6 ? -0.5 : 0 }) })
  const cabs: V3[] = [[-5.2, 0, 7], [-5.2, 0, 2.5], [5.2, 0, 7], [5.2, 0, 2.5], [-5.2, 0, -2.2], [5.2, 0, -2.2]]
  return (
    <group>
      <Batch>
        {cabs.map((p, i) => (
          <group key={i} position={p} rotation={[0, p[0] < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <Solid><mesh position={[0, 1.6, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[3.4, 3.2, 1]} /></mesh></Solid>
            {Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, k) => <mesh key={r + '_' + k} position={[-1.4 + k * 0.4, 0.7 + r * 0.5, 0.52]} material={MAT.bronze()}><boxGeometry args={[0.26, 0.3, 0.12]} /></mesh>))}
          </group>
        ))}
      </Batch>
      <group ref={arms} userData={{ noBatch: true }}>
        {cabs.flatMap((p, i) => Array.from({ length: 6 }, (_, k) => {
          const side = p[0] < 0 ? 1 : -1
          return <mesh key={i + '_' + k} position={[p[0] + side * 0.6, 0.85 + (k % 3) * 1, p[2] - 1.2 + Math.floor(k / 3) * 2.2]} material={MAT.copper()}><boxGeometry args={[0.04, 0.04, 0.3]} /></mesh>
        }))}
      </group>
      {[[-3, 4], [3, 4], [-3, -1], [3, -1]].map(([x, z], i) => <pointLight key={i} position={[x, 4.6, z]} color="#ffb870" intensity={3} distance={9} decay={1.6} />)}
    </group>
  )
}

/** Estantes de válvulas acesas. */
function Valves() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const pos = useMemo(() => {
    const out: THREE.Vector3[] = []
    for (const s of [-1, 1]) for (const z0 of [-8, -12.5]) for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) out.push(new THREE.Vector3(s * 5.35, 0.7 + r * 0.95, z0 - k * 0.42))
    return out
  }, [])
  const geo = useMemo(() => new THREE.CylinderGeometry(0.11, 0.11, 0.42, 10), [])
  useMemo(() => 0, [])
  const set = (im: THREE.InstancedMesh | null) => {
    if (!im) return
    ref.current = im
    const m4 = new THREE.Matrix4()
    pos.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m4) })
    im.instanceMatrix.needsUpdate = true
  }
  useFrame(() => { const mt = MATS.tube() as THREE.MeshStandardMaterial; mt.emissiveIntensity = 2 + Math.sin(RT.time * 13) * 0.15 + Math.sin(RT.time * 3.1) * 0.2 })
  return (
    <group>
      <instancedMesh ref={set} args={[geo, MATS.tube(), pos.length]} userData={{ noBatch: true, noCollide: true }} />
      <Batch>
        {[-1, 1].map((s) => [-8, -12.5].map((z0) => (
          <group key={s + '_' + z0}>
            <Solid><mesh position={[s * 5.55, 2, z0 - 1.7]} material={MAT.iron()}><boxGeometry args={[0.5, 4, 4.2]} /></mesh></Solid>
            {Array.from({ length: 4 }, (_, r) => <mesh key={r} position={[s * 5.32, 0.45 + r * 0.95, z0 - 1.7]} material={MAT.bronzeDark()}><boxGeometry args={[0.3, 0.06, 4]} /></mesh>)}
          </group>
        )))}
      </Batch>
      {[[-3, -10], [3, -10], [0, -18]].map(([x, z], i) => <pointLight key={i} position={[x, 4.4, z]} color="#ff9a4a" intensity={3.2} distance={9} decay={1.6} />)}
    </group>
  )
}

/** Painéis do ENIAC com luzinhas piscando e cabos. */
function Eniac() {
  const lamps = useRef<THREE.InstancedMesh>(null!)
  const pts = useMemo(() => {
    const out: THREE.Vector3[] = []
    for (const s of [-1, 1]) for (let p = 0; p < 6; p++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out.push(new THREE.Vector3(s * (CW - 0.62), 3.2 + r * 0.32, -23.6 - p * 2.1 - 0.4 + k * 0.28))
    return out
  }, [])
  const col = useMemo(() => new THREE.Color(), [])
  const t = useRef(0)
  const set = (im: THREE.InstancedMesh | null) => {
    if (!im) return
    lamps.current = im
    const m4 = new THREE.Matrix4()
    pts.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(Math.random() < 0.5 ? '#ff5a3a' : '#2a1410')) })
    im.instanceMatrix.needsUpdate = true
  }
  useFrame((_, dt) => {
    t.current += dt
    if (t.current < 0.15 || !lamps.current) return
    t.current = 0
    for (let n = 0; n < 12; n++) { const i = Math.floor(Math.random() * pts.length); lamps.current.setColorAt(i, col.set(Math.random() < 0.5 ? '#ffd27a' : '#2a1410')) }
    if (lamps.current.instanceColor) lamps.current.instanceColor.needsUpdate = true
  })
  const cables = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const s = i % 2 ? 1 : -1, z = -24 - i * 1.4
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(s * (CW - 0.6), 2.4, z), new THREE.Vector3(s * (CW - 1.1), 1.2, z - 0.6), new THREE.Vector3(s * (CW - 0.6), 2.0, z - 1.4)])
    return new THREE.TubeGeometry(curve, 16, 0.035, 6, false)
  }), [])
  return (
    <group>
      <Batch>
        {[-1, 1].map((s) => Array.from({ length: 6 }, (_, p) => (
          <Solid key={s + '_' + p}><mesh position={[s * (CW - 0.35), 2.6, -23.6 - p * 2.1]} rotation={[0, s < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={MATS.eniac()}><boxGeometry args={[2, 5.2, 0.5]} /></mesh></Solid>
        )))}
        {cables.map((g, i) => <mesh key={i} geometry={g} material={[MAT.dark(), MAT.copper(), solid('#3a5aa0')][i % 3]} />)}
      </Batch>
      <instancedMesh ref={set} args={[undefined, undefined, pts.length]} userData={{ noBatch: true, noCollide: true }}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {[[-2.5, -26], [2.5, -32]].map(([x, z], i) => <pointLight key={i} position={[x, 4.6, z]} color="#ffe2a0" intensity={3} distance={10} decay={1.5} />)}
    </group>
  )
}

/** Era do circuito: um chip gigante e trilhas que brilham. */
function Circuit() {
  const pulse = useRef<THREE.MeshStandardMaterial>(null!)
  useFrame(() => { if (pulse.current) pulse.current.emissiveIntensity = 0.6 + Math.sin(RT.time * 2.4) * 0.4 })
  return (
    <group>
      <Batch>
        <Solid>
          <mesh position={[4.4, 0.5, -41]} material={MAT.dark()} castShadow><boxGeometry args={[2.2, 1, 2.2]} /></mesh>
        </Solid>
        {Array.from({ length: 8 }, (_, i) => [-1, 1].map((s) => <mesh key={i + '_' + s} position={[4.4 + s * 1.2, 0.3, -41.9 + i * 0.26]} material={MAT.gold()}><boxGeometry args={[0.25, 0.08, 0.1]} /></mesh>))}
        {/* transistores na parede */}
        {Array.from({ length: 10 }, (_, i) => <mesh key={'t' + i} position={[CW - 0.15, 1.2 + (i % 2) * 1.6, -37.5 - i * 1.05]} material={MAT.dark()}><cylinderGeometry args={[0.18, 0.18, 0.3, 12]} /></mesh>)}
      </Batch>
      <mesh position={[4.4, 1.02, -41]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true, noBatch: true }}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshStandardMaterial ref={pulse} color="#1a2a20" emissive="#5aff9a" emissiveIntensity={0.8} />
      </mesh>
      <Text font={FONT.mono} fontSize={0.2} position={[4.4, 1.04, -41]} rotation={[-Math.PI / 2, 0, 0]} color="#0a1a10" anchorX="center" anchorY="middle">CHIP</Text>
      {[[0, -39], [0, -45]].map(([x, z], i) => <pointLight key={i} position={[x, 4.4, z]} color="#5aff9a" intensity={2.2} distance={9} decay={1.6} />)}
    </group>
  )
}

/** Mesas com computadores pessoais. */
function PCs() {
  const desks: [number, number, boolean][] = [[-4.4, -50.5, true], [-4.4, -55, false], [4.4, -50.5, true]]
  return (
    <group>
      <Batch>
        {desks.map(([x, z, crt], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <Solid><mesh position={[0, 0.74, 0]} material={MAT.wood()} castShadow><boxGeometry args={[2.2, 0.06, 1]} /></mesh></Solid>
            {[-1, 1].map((s) => <mesh key={s} position={[s * 1, 0.37, 0]} material={MAT.iron()}><boxGeometry args={[0.06, 0.74, 0.9]} /></mesh>)}
            {crt ? <mesh position={[0, 1.08, -0.15]} material={MATS.beige()} castShadow><boxGeometry args={[0.62, 0.55, 0.55]} /></mesh>
              : <mesh position={[0, 1.08, -0.3]} material={MAT.dark()}><boxGeometry args={[0.8, 0.5, 0.05]} /></mesh>}
            <mesh position={[0, 1.08, crt ? 0.13 : -0.27]} material={crt ? MATS.screenGreen() : MATS.screenBlue()}><planeGeometry args={[crt ? 0.48 : 0.72, crt ? 0.38 : 0.42]} /></mesh>
            <mesh position={[0, 0.78, 0.25]} material={crt ? MATS.beige() : MAT.dark()}><boxGeometry args={[0.6, 0.03, 0.2]} /></mesh>
          </group>
        ))}
      </Batch>
      {[[0, -51], [0, -57]].map(([x, z], i) => <pointLight key={i} position={[x, 4.6, z]} color="#bcd0ff" intensity={2.6} distance={10} decay={1.5} />)}
    </group>
  )
}

/** Racks de servidores (corredor e data center). */
function Racks({ items }: { items: { p: V3; ry: number; h?: number }[] }) {
  return (
    <Batch shadows={false}>
      {items.map((it, i) => (
        <group key={i} position={it.p} rotation={[0, it.ry, 0]}>
          <Solid><mesh position={[0, (it.h || 2.4) / 2, 0]} material={MATS.rackSide()}><boxGeometry args={[0.9, it.h || 2.4, 1.1]} /></mesh></Solid>
          <mesh position={[0, (it.h || 2.4) / 2, 0.56]} material={MATS.rack()}><planeGeometry args={[0.82, (it.h || 2.4) - 0.1]} /></mesh>
        </group>
      ))}
    </Batch>
  )
}
function Servers() {
  const items: { p: V3; ry: number }[] = []
  for (let k = 0; k < 9; k++) { items.push({ p: [-CW + 0.65, 0, -61 - k * 0.95], ry: Math.PI / 2 }); items.push({ p: [CW - 0.65, 0, -61 - k * 0.95], ry: -Math.PI / 2 }) }
  return (
    <group>
      <Racks items={items} />
      {[[0, -62], [0, -68]].map(([x, z], i) => <pointLight key={i} position={[x, 4.6, z]} color="#59d7ff" intensity={2.6} distance={10} decay={1.5} />)}
    </group>
  )
}

/** O data center: fileiras de racks, piso claro, bandejas de cabos. */
function DataCenter() {
  const items: { p: V3; ry: number; h?: number }[] = []
  for (const x of [-11.5, -7.5, 7.5, 11.5]) for (let k = 0; k < 14; k++) { const z = -76 - k * 1.0; items.push({ p: [x - 0.5, 0, z], ry: Math.PI / 2, h: 3 }); items.push({ p: [x + 0.5, 0, z], ry: -Math.PI / 2, h: 3 }) }
  const L = DC.z0 - DC.z1, zc = (DC.z0 + DC.z1) / 2
  return (
    <group>
      <Batch>
        <Solid><mesh position={[0, 0, zc]} rotation={[-Math.PI / 2, 0, 0]} material={MATS.tile()} receiveShadow><planeGeometry args={[DC.w * 2, L]} /></mesh></Solid>
        {[-1, 1].map((s) => <Solid key={s}><mesh position={[s * (DC.w + 0.2), DC.h / 2, zc]} material={solid('#0e1016')}><boxGeometry args={[0.4, DC.h, L]} /></mesh></Solid>)}
        <Solid><mesh position={[0, DC.h / 2, DC.z1 - 0.2]} material={solid('#0e1016')}><boxGeometry args={[DC.w * 2, DC.h, 0.4]} /></mesh></Solid>
        {[-1, 1].map((s) => <Solid key={'f' + s}><mesh position={[s * (DC.w + CW) / 2, DC.h / 2, DC.z0 + 0.2]} material={solid('#0e1016')}><boxGeometry args={[DC.w - CW, DC.h, 0.4]} /></mesh></Solid>)}
        <mesh position={[0, (DC.h + CH) / 2, DC.z0 + 0.2]} material={solid('#0e1016')} userData={{ noCollide: true }}><boxGeometry args={[CW * 2, DC.h - CH, 0.4]} /></mesh>
        <mesh position={[0, DC.h, zc]} rotation={[Math.PI / 2, 0, 0]} material={solid('#0a0c12')} userData={{ noCollide: true }}><planeGeometry args={[DC.w * 2, L]} /></mesh>
        {/* bandejas de cabos no teto */}
        {[-9.5, 9.5].map((x) => <mesh key={x} position={[x, 4.2, -82.5]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[1.4, 0.1, 15]} /></mesh>)}
        {[-9.5, 9.5].map((x) => <mesh key={'c' + x} position={[x, 4.3, -82.5]} material={solid('#2a5adf')} userData={{ noCollide: true }}><boxGeometry args={[1.1, 0.12, 15]} /></mesh>)}
      </Batch>
      {/* linhas de luz no chão */}
      {[-9.5, -5.6, 5.6, 9.5].map((x) => <mesh key={x} position={[x, 0.01, -82.5]} rotation={[-Math.PI / 2, 0, 0]} material={MATS.glowCyan()} userData={{ noCollide: true }}><planeGeometry args={[0.08, 15]} /></mesh>)}
      {Array.from({ length: 6 }, (_, i) => <mesh key={'l' + i} position={[0, DC.h - 0.05, -75 - i * 5]} rotation={[Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><planeGeometry args={[18, 0.3]} /><meshStandardMaterial color="#bfefff" emissive="#7fdcff" emissiveIntensity={1.6} /></mesh>)}
      <Racks items={items} />
      <pointLight position={[0, 8, -80]} color="#7fdcff" intensity={14} distance={30} decay={1.3} />
      <pointLight position={[0, 6, -95]} color="#9fb8ff" intensity={12} distance={26} decay={1.3} />
      <Text font={FONT.mono} fontSize={0.5} position={[-6.4, 6.8, DC.z0 - 0.05]} rotation={[0, Math.PI, 0]} color="#59d7ff" anchorX="center">HOJE</Text>
      <Text font={FONT.title} fontSize={0.7} position={[0, 7.4, DC.z0 - 0.05]} rotation={[0, Math.PI, 0]} color="#e8f4ff" anchorX="center">DATA CENTER</Text>
      <Text font={FONT.title} fontSize={0.6} position={[0, CH + 0.9, DC.z0 + 0.42]} color="#e8f4ff" anchorX="center">HOJE · DATA CENTER</Text>
    </group>
  )
}

export function Corridor() {
  return (
    <>
      <Walls />
      <Relays />
      <Valves />
      <Eniac />
      <Circuit />
      <PCs />
      <Servers />
      <DataCenter />
    </>
  )
}
