import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Sparkles, RoundedBox } from '@react-three/drei'
import { Solid, Block } from '../../../world/core'
import { Batch, Column, Lantern } from '../../../world/Architecture'
import { MAT, toon } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { stoneTiles } from '../../../world/textures'
import { RT } from '../../../engine/runtime'

/* =========================================================
   Câmara da Matriz — octógono, metade templo e metade laboratório.
   Sul: entrada e a matriz central. Meio: o abismo das plataformas.
   Norte: o altar da matriz quebrada e o portal.
   ========================================================= */
export type V3 = [number, number, number]
export const CR = 26 // raio do octógono
export const PIT = { z0: -4, z1: -14, cell: 2.5, x0: -5 } // abismo: 4×4 células de 2,5 m
export const cellPos = (r: number, c: number): V3 => [PIT.x0 + PIT.cell * (c + 0.5), 0, PIT.z0 - PIT.cell * (r + 0.5)]

const octo = (R: number) => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R) })
/** Recorta um polígono convexo pelo semiplano y·sinal ≥ limite (Sutherland–Hodgman). */
function clip(poly: THREE.Vector2[], lim: number, sign: 1 | -1) {
  const out: THREE.Vector2[] = []
  const inside = (p: THREE.Vector2) => p.y * sign >= lim * sign
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    const ia = inside(a), ib = inside(b)
    if (ia) out.push(a)
    if (ia !== ib) { const t = (lim - a.y) / (b.y - a.y); out.push(new THREE.Vector2(a.x + (b.x - a.x) * t, lim)) }
  }
  return out
}
const mats: Record<string, THREE.Material> = {}
const mm = (k: string, f: () => THREE.Material) => mats[k] || (mats[k] = f())
export const MX = {
  floor: () => mm('mfloor', () => { const t = stoneTiles('matrixTiles', '#d8dcf2', '#9aa2cc', 6); const map = t.map.clone(); map.repeat.set(5, 5); map.needsUpdate = true; return toon({ map }) }),
  cyan: () => mm('mcyan', () => new THREE.MeshStandardMaterial({ color: '#bff6ff', emissive: '#2ad0ff', emissiveIntensity: 2.4 })),
  cyanDim: () => mm('mcyanDim', () => new THREE.MeshStandardMaterial({ color: '#2a3a5a', emissive: '#16305a', emissiveIntensity: 0.7, roughness: 0.4 })),
  violet: () => mm('mviolet', () => new THREE.MeshStandardMaterial({ color: '#e0d0ff', emissive: '#8a5cff', emissiveIntensity: 2 })),
  crystal: () => mm('mcrystal', () => new THREE.MeshStandardMaterial({ color: '#ff9ad0', emissive: '#c0306a', emissiveIntensity: 1.2, roughness: 0.2, flatShading: true })),
  pit: () => mm('mpit', () => new THREE.MeshBasicMaterial({ color: '#060818' })),
}

/** Cubo numérico (célula de matriz) com o valor escrito na frente e em cima. */
export function NumCube({ position, value, on = true, s = 1, color = '#bff6ff', front = true, top = false, label }: { position: V3; value: number | string; on?: boolean; s?: number; color?: string; front?: boolean; top?: boolean; label?: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: on ? color : '#2a3450', emissive: on ? color : '#101a30', emissiveIntensity: on ? 0.55 : 0.25, roughness: 0.35, transparent: true, opacity: 0.92 }), [on, color])
  return (
    <group position={position} scale={s}>
      <RoundedBox args={[1, 1, 1]} radius={0.12} smoothness={3} material={mat} castShadow />
      {front && <Text font={FONT.mono} fontSize={0.62} position={[0, 0, 0.52]} color={on ? '#08203a' : '#7a8ab0'} anchorX="center" anchorY="middle">{String(value)}</Text>}
      {top && <Text font={FONT.mono} fontSize={0.62} position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} color={on ? '#08203a' : '#7a8ab0'} anchorX="center" anchorY="middle">{String(value)}</Text>}
      {label && <Text font={FONT.body} fontSize={0.18} position={[0, -0.72, 0.4]} color="#cfe0ff" anchorX="center">{label}</Text>}
    </group>
  )
}
/** Colchetes de matriz [ ] em volta de uma grade. */
export function Brackets({ position, w, h, color = '#ffd27a' }: { position: V3; w: number; h: number; color?: string }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6 }), [color])
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w / 2, 0, 0]}>
          <mesh material={m}><boxGeometry args={[0.12, h, 0.12]} /></mesh>
          {[-1, 1].map((t) => <mesh key={t} position={[-s * 0.22, t * h / 2, 0]} material={m}><boxGeometry args={[0.44, 0.12, 0.12]} /></mesh>)}
        </group>
      ))}
    </group>
  )
}

function Floor() {
  const south = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape(clip(octo(CR), -PIT.z0, -1))), [])
  const north = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape(clip(octo(CR), -PIT.z1, 1))), [])
  return (
    <group>
      <Solid>
        <mesh geometry={south} rotation={[-Math.PI / 2, 0, 0]} material={MX.floor()} receiveShadow />
        <mesh geometry={north} rotation={[-Math.PI / 2, 0, 0]} material={MX.floor()} receiveShadow />
      </Solid>
      {/* bordas do abismo */}
      {[PIT.z0, PIT.z1].map((z) => <mesh key={z} position={[0, -1.5, z]} material={MAT.stoneDark()} userData={{ noCollide: true }}><boxGeometry args={[CR * 2, 3, 0.4]} /></mesh>)}
      {[PIT.z0 + 0.05, PIT.z1 - 0.05].map((z) => <mesh key={'g' + z} position={[0, 0.02, z]} material={MX.cyan()} userData={{ noCollide: true }}><boxGeometry args={[CR * 2, 0.04, 0.12]} /></mesh>)}
      {/* fundo do abismo: grade luminosa */}
      <mesh position={[0, -9, (PIT.z0 + PIT.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={MX.pit()} userData={{ noCollide: true }}><planeGeometry args={[CR * 2, PIT.z0 - PIT.z1 + 2]} /></mesh>
      <gridHelper args={[CR * 2, 40, '#2a6aff', '#16306a']} position={[0, -8.9, (PIT.z0 + PIT.z1) / 2]} scale={[1, 1, (PIT.z0 - PIT.z1 + 2) / (CR * 2)]} />
      <Sparkles count={70} scale={[CR * 2, 8, 10]} position={[0, -4, (PIT.z0 + PIT.z1) / 2]} size={4} speed={0.4} color="#7fb8ff" />
    </group>
  )
}

function Walls() {
  const H = 9
  const pts = octo(CR)
  return (
    <group>
      {pts.map((p, i) => {
        const q = pts[(i + 1) % 8]
        const mid = p.clone().add(q).multiplyScalar(0.5)
        const len = p.distanceTo(q)
        const ang = Math.atan2(q.y - p.y, q.x - p.x)
        const isSouth = Math.abs(Math.atan2(mid.y, mid.x) + Math.PI / 2) < 0.2 // entrada (z+)
        return (
          <group key={i}>
            {/* parede baixa com faixa de vidro (pura decoração); colisão invisível alta */}
            <group position={[mid.x, 0, -mid.y]} rotation={[0, ang, 0]}>
              {!isSouth && <mesh position={[0, 1.5, 0]} material={MAT.marble()} castShadow receiveShadow><boxGeometry args={[len, 3, 0.8]} /></mesh>}
              {isSouth && [-1, 1].map((s) => <mesh key={s} position={[s * (len / 4 + 1.5), 1.5, 0]} material={MAT.marble()} castShadow><boxGeometry args={[len / 2 - 3, 3, 0.8]} /></mesh>)}
              <mesh position={[0, 3.1, 0]} material={MAT.gold()}><boxGeometry args={[len, 0.2, 0.9]} /></mesh>
              <mesh position={[0, 6.2, -0.2]} material={MX.cyanDim()} userData={{ noCollide: true }}><boxGeometry args={[len - 1.4, 5.8, 0.15]} /></mesh>
              <mesh position={[0, H + 0.2, 0]} material={MAT.marble()}><boxGeometry args={[len, 0.4, 0.9]} /></mesh>
            </group>
            <Block size={[len, 12, 1]} position={[mid.x, 6, -mid.y]} rotation={[0, ang, 0]} />
            <Column position={[p.x, 0, -p.y]} h={H} r={0.55} />
          </group>
        )
      })}
    </group>
  )
}

/** Anéis de cubos girando no alto e painéis holográficos com matrizes. */
function Holo() {
  const ring = useRef<THREE.Group>(null!), ring2 = useRef<THREE.Group>(null!)
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.y += dt * 0.05; if (ring2.current) ring2.current.rotation.y -= dt * 0.08 })
  const cubes = useMemo(() => Array.from({ length: 36 }, (_, i) => ({ a: (i / 36) * Math.PI * 2, y: 14 + Math.sin(i * 1.7) * 1.5, v: (i * 7) % 2 })), [])
  return (
    <group>
      <group ref={ring} userData={{ noBatch: true }}>
        {cubes.map((c, i) => <mesh key={i} position={[Math.cos(c.a) * 19, c.y, Math.sin(c.a) * 19]} rotation={[c.a, c.a * 2, 0]} material={c.v ? MX.cyan() : MX.violet()}><boxGeometry args={[0.8, 0.8, 0.8]} /></mesh>)}
      </group>
      <group ref={ring2} position={[0, 20, 0]} userData={{ noBatch: true }}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={MX.cyan()}><torusGeometry args={[11, 0.08, 6, 96]} /></mesh>
        <mesh rotation={[Math.PI / 2 + 0.3, 0, 0]} material={MX.violet()}><torusGeometry args={[13, 0.06, 6, 96]} /></mesh>
      </group>
      {[[-1, 0.62], [1, -0.62]].map(([s, rot], i) => (
        <group key={i} position={[s * 20, 6.2, 12]} rotation={[0, -s * Math.PI / 2 + rot * 0.3, 0]}>
          <Text font={FONT.mono} fontSize={0.9} color="#7fe3ff" anchorX="center" anchorY="middle" lineHeight={1.1}>{i ? '[ 2  0 ]\n[ 0  2 ]' : '[ 1  0  1 ]\n[ 0  1  0 ]\n[ 1  1  0 ]'}</Text>
        </group>
      ))}
    </group>
  )
}

export function Chamber() {
  return (
    <>
      <Batch>
        <Floor />
        <Walls />
        {/* tapete de entrada e pedestais */}
        <mesh position={[0, 0.02, 18]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.cloth('#2a2a6a')} userData={{ noCollide: true }}><planeGeometry args={[4, 12]} /></mesh>
        <Lantern position={[-3, 0, 21]} light /><Lantern position={[3, 0, 21]} />
      </Batch>
      <Holo />
      <pointLight position={[0, 8, 8]} color="#9fd8ff" intensity={20} distance={34} decay={1.3} />
      <pointLight position={[0, 7, -19]} color="#c8a8ff" intensity={18} distance={26} decay={1.3} />
      <pointLight position={[-14, 5, 6]} color="#7fe3ff" intensity={8} distance={16} decay={1.5} />
      <pointLight position={[14, 5, 6]} color="#ffd27a" intensity={8} distance={16} decay={1.5} />
    </>
  )
}
export const pulse = () => 0.5 + Math.sin(RT.time * 3) * 0.5
