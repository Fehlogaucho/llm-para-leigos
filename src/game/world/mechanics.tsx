import * as THREE from 'three'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Solid, Interactable } from './core'
import { MAT } from './materials'
import { RT } from '../engine/runtime'

type V3 = [number, number, number]

/* Peças de mecânica reaproveitáveis: portões, lâmpadas, alavancas, placas, sebes, carregar objetos. */

/** true enquanto o NEX está a menos de r metros de pos. */
export function useNear(pos: V3, r: number, dy = 2) {
  const [near, set] = useState(false)
  const st = useRef(false)
  useFrame(() => {
    const v = Math.hypot(RT.player.x - pos[0], RT.player.z - pos[2]) < r && Math.abs(RT.player.y - pos[1]) < dy
    if (v !== st.current) { st.current = v; set(v) }
  })
  return near
}

/** Portão de pedra com grade que desce quando abre (a grade só colide fechada). */
export function Gate({ position, rotY = 0, open, w = 3.2, h = 3.6, mat }: { position: V3; rotY?: number; open: boolean; w?: number; h?: number; mat?: THREE.Material }) {
  const bars = useRef<THREE.Group>(null!)
  const k = useRef(open ? 1 : 0)
  useFrame((_, dt) => {
    k.current += ((open ? 1 : 0) - k.current) * Math.min(1, dt * 1.6)
    if (bars.current) { bars.current.position.y = -k.current * (h - 0.1); bars.current.visible = k.current < 0.98 }
  })
  const n = Math.max(3, Math.round(w / 0.35))
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.45), h / 2 + 0.2, 0]} material={mat || MAT.wall(1)} castShadow receiveShadow><boxGeometry args={[0.9, h + 0.4, 1]} /></mesh>)}
        <mesh position={[0, h + 0.65, 0]} material={mat || MAT.wall(1)} castShadow><boxGeometry args={[w + 1.8, 0.7, 1.1]} /></mesh>
      </Solid>
      <group ref={bars} userData={{ noBatch: true }}>
        {Array.from({ length: n }, (_, i) => <mesh key={i} position={[-w / 2 + (i + 0.5) * (w / n), h / 2, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[0.045, 0.045, h, 6]} /></mesh>)}
        {[0.4, h / 2, h - 0.3].map((y) => <mesh key={y} position={[0, y, 0]} material={MAT.iron()}><boxGeometry args={[w, 0.09, 0.09]} /></mesh>)}
      </group>
      {!open && <Solid invisible><mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, 0.4]} /></mesh></Solid>}
    </group>
  )
}

/** Lâmpada de cristal num poste: acesa ou apagada. */
export function CrystalLamp({ position, color = '#59d7ff', on, h = 2.2, s = 1 }: { position: V3; color?: string; on: boolean; h?: number; s?: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: on ? 3.2 : 0.05, roughness: 0.3 }), [color])
  const halo = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), [color])
  useFrame(() => {
    const want = on ? 3.2 + Math.sin(RT.time * 3) * 0.4 : 0.05
    mat.emissiveIntensity += (want - mat.emissiveIntensity) * 0.15
    halo.opacity += ((on ? 0.18 : 0) - halo.opacity) * 0.15
  })
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, h / 2, 0]} material={MAT.stoneDark()} castShadow><cylinderGeometry args={[0.12, 0.18, h, 8]} /></mesh></Solid>
      <group position={[0, h + 0.35, 0]} userData={{ noBatch: true }}>
        <mesh material={mat}><octahedronGeometry args={[0.32, 0]} /></mesh>
        <mesh material={halo}><sphereGeometry args={[0.7, 16, 12]} /></mesh>
        <mesh position={[0, -0.36, 0]} material={MAT.gold()}><cylinderGeometry args={[0.2, 0.14, 0.12, 10]} /></mesh>
      </group>
    </group>
  )
}

/** Alavanca: base de pedra e cabo que tomba para um lado quando ligada. */
export function Lever({ position, rotY = 0, on, color = '#e7b456' }: { position: V3; rotY?: number; on: boolean; color?: string }) {
  const arm = useRef<THREE.Group>(null!)
  useFrame(() => { if (arm.current) arm.current.rotation.x += ((on ? -0.7 : 0.7) - arm.current.rotation.x) * 0.15 })
  const knob = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.3 }), [color])
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid><mesh position={[0, 0.3, 0]} material={MAT.stone()} castShadow><boxGeometry args={[0.8, 0.6, 0.6]} /></mesh></Solid>
      <group ref={arm} position={[0, 0.62, 0]} userData={{ noBatch: true }}>
        <mesh position={[0, 0.45, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[0.04, 0.05, 0.9, 8]} /></mesh>
        <mesh position={[0, 0.92, 0]} material={knob}><sphereGeometry args={[0.11, 12, 10]} /></mesh>
      </group>
    </group>
  )
}

/** Placa de pressão no chão (visual). */
export function Plate({ position, active, color = '#ffd27a', r = 0.9 }: { position: V3; active: boolean; color?: string; r?: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a7a62', emissive: color, emissiveIntensity: 0, roughness: 0.6 }), [color])
  const top = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    mat.emissiveIntensity += ((active ? 2.4 : 0.15 + Math.sin(RT.time * 2.5) * 0.1) - mat.emissiveIntensity) * 0.2
    if (top.current) top.current.position.y += ((active ? 0.03 : 0.08) - top.current.position.y) * 0.3
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.stoneDark()} userData={{ noCollide: true }}><circleGeometry args={[r + 0.25, 32]} /></mesh>
      <mesh ref={top} position={[0, 0.08, 0]} material={mat} userData={{ noCollide: true, noBatch: true }}><cylinderGeometry args={[r, r, 0.12, 32]} /></mesh>
    </group>
  )
}

/** Sebe (parede verde) entre dois pontos, com colisão. */
const hedgeMat = () => MAT.foliage()
export function Hedge({ from, to, h = 2.4, w = 1.1 }: { from: V3; to: V3; h?: number; w?: number }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const len = a.distanceTo(b), yaw = Math.atan2(b.x - a.x, b.z - a.z)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return (
    <Solid position={[mid.x, mid.y + h / 2, mid.z]} rotation={[0, yaw, 0]}>
      <mesh material={hedgeMat()} castShadow receiveShadow><boxGeometry args={[w, h, len + w * 0.6, 2, 3, Math.max(2, Math.round(len))]} /></mesh>
      <mesh position={[0, h / 2, 0]} material={MAT.foliage2()} castShadow userData={{ noCollide: true }}><boxGeometry args={[w * 0.8, 0.2, len + w * 0.4]} /></mesh>
    </Solid>
  )
}

/** Objeto que o NEX carrega acima da cabeça (posição controlada aqui). */
export function Carried({ carried, home, children }: { carried: boolean; home: V3; children?: ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (!g.current) return
    if (carried) g.current.position.lerp(new THREE.Vector3(RT.player.x, RT.player.y + 2.0, RT.player.z), 0.35)
    else g.current.position.lerp(new THREE.Vector3(...home), 0.25)
  })
  return <group ref={g} position={home} userData={{ noBatch: true }}>{children}</group>
}

/** Raio de luz entre dois pontos (para espelhos, sensores). */
export function Beam({ from, to, color = '#fff2b0', on = true, w = 0.12 }: { from: V3; to: V3; color?: string; on?: boolean; w?: number }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  if (!on) return null
  return (
    <mesh position={mid} quaternion={q} userData={{ noCollide: true, noBatch: true }}>
      <cylinderGeometry args={[w, w, len, 8, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}

/**
 * Elevador: disco que leva o NEX entre duas alturas. Parado, o disco é sólido;
 * durante a viagem o NEX acompanha o disco (sem colisão) e não anda.
 */
export function Lift({ id, from, to, enabled = true, startTop = false, r = 1.8, labelUp = 'Subir', labelDown = 'Descer', onArrive }: {
  id: string; from: V3; to: V3; enabled?: boolean; startTop?: boolean; r?: number; labelUp?: string; labelDown?: string; onArrive?: (top: boolean) => void
}) {
  const [st, setSt] = useState<'bottom' | 'top' | 'moving'>(startTop ? 'top' : 'bottom')
  const disc = useRef<THREE.Group>(null!)
  const mv = useRef<{ t0: number; up: boolean; off: THREE.Vector3 } | null>(null)
  const DUR = 3.2
  useFrame(() => {
    const m = mv.current
    const g = disc.current
    if (!g) return
    if (!m) { g.position.set(...(st === 'top' ? to : from)); return }
    const k = Math.min(1, (performance.now() - m.t0) / 1000 / DUR)
    const e = k * k * (3 - 2 * k)
    const a = m.up ? from : to, b = m.up ? to : from
    g.position.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e)
    RT.player.set(g.position.x + m.off.x, g.position.y + 0.25, g.position.z + m.off.z)
    RT.playerVel.set(0, 0, 0)
    RT.lastSafe.copy(RT.player)
    if (k >= 1) { mv.current = null; RT.frozen = false; setSt(m.up ? 'top' : 'bottom'); onArrive?.(m.up) }
  })
  const go = (up: boolean) => {
    if (mv.current) return
    const base = up ? from : to
    const off = new THREE.Vector3(RT.player.x - base[0], 0, RT.player.z - base[2])
    if (off.length() > r * 0.7) off.setLength(r * 0.5)
    mv.current = { t0: performance.now(), up, off }
    RT.frozen = true
    setSt('moving')
    import('../engine/audio').then((a) => a.SFX.play('gear'))
  }
  const here = st === 'top' ? to : from
  return (
    <group>
      <group ref={disc} position={here} userData={{ noBatch: true }}>
        <mesh position={[0, 0.12, 0]} material={MAT.bronzeDark()} castShadow receiveShadow userData={{ noCollide: true }}><cylinderGeometry args={[r, r * 0.92, 0.25, 32]} /></mesh>
        <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.glowBlue()} userData={{ noCollide: true }}><ringGeometry args={[r * 0.78, r * 0.86, 40]} /></mesh>
      </group>
      {st !== 'moving' && <Solid invisible><mesh position={[here[0], here[1] + 0.1, here[2]]}><cylinderGeometry args={[r, r, 0.3, 24]} /></mesh></Solid>}
      {st === 'bottom' && <InteractLift id={id + '_up'} pos={from} label={labelUp} enabled={enabled} onUse={() => go(true)} />}
      {st === 'top' && <InteractLift id={id + '_down'} pos={to} label={labelDown} enabled={enabled} onUse={() => go(false)} />}
    </group>
  )
}
function InteractLift({ id, pos, label, enabled, onUse }: { id: string; pos: V3; label: string; enabled: boolean; onUse: () => void }) {
  return <Interactable id={id} label={label} position={[pos[0], pos[1] + 0.25, pos[2]]} radius={1.9} enabled={enabled} onUse={onUse} markerY={2.4} color="#7fe3ff" />
}

/** Fecha um painel quando o NEX se afasta (r metros) do ponto de uso. */
export function useFarClose(open: boolean, close: () => void, pos: V3, r = 5, hold?: () => boolean) {
  const cb = useRef(close); cb.current = close
  const o = useRef(open); o.current = open
  const h = useRef(hold); h.current = hold
  useFrame(() => {
    if (!o.current || (h.current && h.current())) return
    if (Math.hypot(RT.player.x - pos[0], RT.player.z - pos[2]) > r || Math.abs(RT.player.y - pos[1]) > 3) { o.current = false; cb.current() }
  })
}
