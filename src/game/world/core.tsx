import * as THREE from 'three'
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { COLL } from '../engine/collision'
import { INTERACTS, RT } from '../engine/runtime'
import { useGame } from '../store'

/** Marca os filhos como sólidos (entram no mundo de colisão). invisible = só colisão. */
export function Solid({ children, invisible = false, ...props }: { children?: ReactNode; invisible?: boolean } & ThreeElements['group']) {
  const ref = useRef<THREE.Group>(null!)
  useLayoutEffect(() => {
    const g = ref.current
    COLL.add(g)
    return () => COLL.remove(g)
  }, [])
  return <group ref={ref} visible={!invisible} {...props}>{children}</group>
}

/** Caixa invisível de colisão (parede, piso, rampa). */
export function Block({ size, position, rotation, show = false }: { size: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number]; show?: boolean }) {
  return (
    <Solid invisible={!show} position={position} rotation={rotation}>
      <mesh userData={{ noBatch: true }}><boxGeometry args={size} /><meshBasicMaterial color="red" wireframe /></mesh>
    </Solid>
  )
}

/** Rampa invisível entre dois pontos (para escadas). Largura w. */
export function Ramp({ from, to, w = 2, thick = 0.3 }: { from: [number, number, number]; to: [number, number, number]; w?: number; thick?: number }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const yaw = Math.atan2(d.x, d.z)
  const pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z))
  return (
    <Solid invisible position={[mid.x, mid.y - thick / 2, mid.z]} rotation={[0, yaw, 0]}>
      <mesh rotation={[pitch, 0, 0]} userData={{ noBatch: true }}><boxGeometry args={[w, thick, len + 0.2]} /><meshBasicMaterial /></mesh>
    </Solid>
  )
}

export function useFlag(k: string) { return useGame((s) => s.flags[k] || 0) }

/** Objeto interativo: destaque, alcance, rótulo e ação. */
export function Interactable({ id, label, radius = 2.2, position, enabled = true, onUse, marker = true, markerY = 1.9, children, color = '#ffd27a', ...props }: {
  id: string; label: string; radius?: number; position?: [number, number, number]; enabled?: boolean; onUse: () => void; marker?: boolean; markerY?: number; children?: ReactNode; color?: string
} & Omit<ThreeElements['group'], 'id' | 'position'>) {
  const ref = useRef<THREE.Group>(null!)
  const use = useRef(onUse); use.current = onUse
  useLayoutEffect(() => {
    const g = ref.current
    g.userData.interactId = id
    g.updateWorldMatrix(true, false)
    const pos = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld)
    const it = { id, pos, radius, label, enabled, use: () => use.current(), root: g }
    INTERACTS.set(id, it)
    return () => { if (INTERACTS.get(id) === it) INTERACTS.delete(id) }
  }, [id])
  useEffect(() => { const it = INTERACTS.get(id); if (it) { it.label = label; it.enabled = enabled; it.radius = radius } }, [id, label, enabled, radius])
  return (
    <group ref={ref} position={position} {...props} userData={{ noBatch: true, interactId: id }}>
      {children}
      {marker && enabled && <Marker id={id} y={markerY} color={color} />}
    </group>
  )
}

const markGeo = new THREE.OctahedronGeometry(0.13, 0)
const ringGeo = new THREE.RingGeometry(0.55, 0.68, 40)
export function Marker({ id, y = 1.9, color = '#ffd27a' }: { id: string; y?: number; color?: string }) {
  const g = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const near = useGame((s) => s.prompt?.id === id)
  useFrame(() => {
    const t = RT.time
    g.current.position.y = y + Math.sin(t * 2.4) * 0.08
    g.current.rotation.y = t * 1.6
    const sc = near ? 1.25 + Math.sin(t * 6) * 0.08 : 1
    g.current.scale.setScalar(sc)
    if (ring.current) { const m = ring.current.material as THREE.MeshBasicMaterial; m.opacity = near ? 0.75 : 0.28 + Math.sin(t * 2) * 0.08 }
  })
  return (
    <>
      <group ref={g}>
        <mesh geometry={markGeo} userData={{ noCollide: true }}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={ring} geometry={ringGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} userData={{ noCollide: true }}>
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

/** Feixe de luz no objetivo atual (ajuda a saber para onde ir). */
export function ObjectiveBeacon() {
  const target = useGame((s) => s.objective?.target)
  const ref = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (!ref.current || !target) return
    const d = Math.hypot(target[0] - RT.player.x, target[2] - RT.player.z)
    ref.current.visible = d > 3.5
    const m = (ref.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial
    m.opacity = Math.min(0.35, (d - 3.5) / 10) + Math.sin(RT.time * 3) * 0.04
  })
  if (!target) return null
  return (
    <group ref={ref} position={target}>
      <mesh position={[0, 20, 0]} userData={{ noCollide: true }}>
        <cylinderGeometry args={[0.35, 0.6, 40, 16, 1, true]} />
        <meshBasicMaterial color="#ffd98a" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  )
}
