import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RT } from '../../../engine/runtime'
import { G } from '../../../store'
import { TIMBRE } from '../../../engine/voice'
import { SPEAKERS } from '../../../ui/Icons'
import { PEOPLE, type Person } from './stops'

/* =========================================================
   Os inventores: retrato (diálogo e documentos), voz e o
   holograma 3D que aparece em cada parada da Linha do Tempo.
   ========================================================= */

const SKIN: Record<string, string> = { ESCRIBA: '#c98f5e', KHWARIZMI: '#c8915e', LIUHUI: '#eec7a0', COMERCIANTE: '#e8bf92' }
const HAIR: Record<string, string> = { ESCRIBA: '#2a1a10', LIUHUI: '#1a1410', KHWARIZMI: '#2a1a10', PASCAL: '#5a3a24', LEIBNIZ: '#3a2a1c', GAUSS: '#d8d4cc', ADA: '#3a2214', CAYLEY: '#5a4030', MARKOV: '#9a948a', SHANNON: '#6a4a30', ROSENBLATT: '#2a1e16', COMERCIANTE: '#1a1410' }

/** Retrato em SVG, no mesmo estilo dos rostos do NEX e da NOVA. */
export function PersonFace({ who }: { who: string }) {
  const p = PEOPLE[who]
  if (!p) return null
  const skin = SKIN[who] || '#f0c9a0', hair = HAIR[who] || '#3a2a1c', c = p.color
  return (
    <svg viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#101a30" />
      <circle cx="32" cy="32" r="30" fill={c} opacity=".22" />
      {/* ombros / roupa */}
      <path d="M10 64c2-12 11-17 22-17s20 5 22 17z" fill={c} opacity=".9" />
      {p.acc === 'wig' && <><circle cx="17" cy="38" r="8" fill={hair} /><circle cx="47" cy="38" r="8" fill={hair} /><circle cx="16" cy="47" r="7" fill={hair} /><circle cx="48" cy="47" r="7" fill={hair} /></>}
      {p.acc === 'bun' && <circle cx="32" cy="14" r="8" fill={hair} />}
      <circle cx="32" cy="33" r="15" fill={skin} />
      {/* cabelo / chapéu */}
      {p.acc === 'turban' && <><ellipse cx="32" cy="21" rx="17" ry="9" fill="#f2efe6" /><path d="M16 22q16-8 32 0" stroke="#3fb6b0" strokeWidth="3" fill="none" /><circle cx="32" cy="15" r="3" fill="#3fb6b0" /></>}
      {p.acc === 'hat' && <><rect x="20" y="13" width="24" height="9" rx="2" fill="#1c1c22" /><rect x="11" y="18" width="10" height="3" rx="1.5" fill="#1c1c22" /><rect x="43" y="18" width="10" height="3" rx="1.5" fill="#1c1c22" /></>}
      {p.acc === 'cap' && <><path d="M17 27q2-11 15-11t15 11z" fill={hair} /><path d="M18 22q14-12 28 0q-14-5-28 0z" fill="#2a2440" /></>}
      {p.acc === 'wig' && <path d="M16 30q0-15 16-15t16 15q-6-7-16-7t-16 7z" fill={hair} />}
      {(p.acc === 'beard' || p.acc === 'none' || p.acc === 'sideburns' || p.acc === 'glasses' || p.acc === 'bun' || p.acc === 'straw') && <path d="M17 29q0-13 15-13t15 13q-4-6-15-6t-15 6z" fill={hair} />}
      {p.acc === 'straw' && <><path d="M6 25 L32 9 L58 25 Q32 30 6 25z" fill="#d8b45a" stroke="#9a7a2a" strokeWidth="1.2" /><path d="M20 21 L32 14 L44 21" stroke="#9a7a2a" strokeWidth="1" fill="none" /></>}
      {p.acc === 'sideburns' && <><rect x="16.5" y="29" width="4" height="10" rx="2" fill={hair} /><rect x="43.5" y="29" width="4" height="10" rx="2" fill={hair} /></>}
      {/* olhos */}
      <ellipse cx="26" cy="34" rx="2.6" ry="3" fill="#fff" /><ellipse cx="38" cy="34" rx="2.6" ry="3" fill="#fff" />
      <circle cx="26.4" cy="34.4" r="1.6" fill="#2a1a10" /><circle cx="38.4" cy="34.4" r="1.6" fill="#2a1a10" />
      {p.acc === 'glasses' && <><circle cx="26" cy="34" r="5" fill="none" stroke="#1a1a1a" strokeWidth="1.6" /><circle cx="38" cy="34" r="5" fill="none" stroke="#1a1a1a" strokeWidth="1.6" /><path d="M31 34h2" stroke="#1a1a1a" strokeWidth="1.6" /></>}
      {p.acc === 'beard' ? <path d="M19 37q2 15 13 16q11-1 13-16q-4 6-13 6t-13-6z" fill={hair} /> : <path d="M28 41q4 3 8 0" stroke="#8a3b2e" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
      {p.acc === 'beard' && <path d="M28 41q4 2 8 0" stroke="#e8c8a8" strokeWidth="1.2" fill="none" />}
      <text x="58" y="60" fontSize="9" fontWeight="900" fill="#fff" opacity=".7" textAnchor="end" fontFamily="Nunito, sans-serif">{p.short}</text>
    </svg>
  )
}

/* registra nomes, cores, retratos e vozes */
const VOICES: Record<string, { pitch: number; rate: number }> = {
  ESCRIBA: { pitch: 0.75, rate: 0.95 }, LIUHUI: { pitch: 0.9, rate: 0.98 }, KHWARIZMI: { pitch: 0.8, rate: 0.96 }, PASCAL: { pitch: 0.95, rate: 1.04 },
  LEIBNIZ: { pitch: 0.85, rate: 1.0 }, GAUSS: { pitch: 0.92, rate: 1.02 }, ADA: { pitch: 1.3, rate: 1.04 }, CAYLEY: { pitch: 0.88, rate: 1.0 },
  MARKOV: { pitch: 0.7, rate: 0.95 }, SHANNON: { pitch: 1.0, rate: 1.1 }, ROSENBLATT: { pitch: 0.95, rate: 1.06 }, COMERCIANTE: { pitch: 0.82, rate: 1.02 },
}
for (const [k, p] of Object.entries(PEOPLE)) {
  SPEAKERS[k] = { name: p.name.toUpperCase(), color: p.color, face: () => <PersonFace who={k} /> }
  TIMBRE[k] = VOICES[k]
}

/* ---------- holograma ---------- */
/** k: aparecer (0..1) · live: falando agora (senão fica como lembrança translúcida) */
export const HOLO: Record<string, { k: number; want: number; live: boolean; l: number }> = {}
export const holo = (id: string) => (HOLO[id] ||= { k: 0, want: 0, live: false, l: 0 })

function useHoloMats(p: Person) {
  return useMemo(() => {
    const c = new THREE.Color(p.color)
    const mk = (mix: string, a: number, e = 0.9) => new THREE.MeshStandardMaterial({ color: c.clone().lerp(new THREE.Color(mix), a), emissive: c, emissiveIntensity: e, transparent: true, opacity: 0.8, roughness: 0.5, depthWrite: true })
    return { body: mk('#ffffff', 0.15), light: mk('#ffffff', 0.55, 0.7), dark: mk('#000000', 0.45, 0.6), eye: new THREE.MeshBasicMaterial({ color: '#0a1020', transparent: true, opacity: 0.85 }), all: [] as THREE.MeshStandardMaterial[] }
  }, [p.color])
}

/** O “eco” de um inventor guardado na memória da Engine. */
export function Holo({ id, who, position, rotY = 0 }: { id: string; who: string; position: [number, number, number]; rotY?: number }) {
  const p = PEOPLE[who]
  const m = useHoloMats(p)
  const g = useRef<THREE.Group>(null!)
  const fig = useRef<THREE.Group>(null!)
  const beam = useRef<THREE.Mesh>(null!)
  const armR = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    const h = holo(id)
    h.k += (h.want - h.k) * Math.min(1, dt * (h.want > h.k ? 1.6 : 2.5))
    h.l += ((h.live ? 1 : 0) - h.l) * Math.min(1, dt * 2)
    const k = h.k, t = RT.time
    const vis = k > 0.02
    fig.current.visible = vis
    if (beam.current) { beam.current.visible = vis; (beam.current.material as THREE.MeshBasicMaterial).opacity = Math.min(0.22, k * 0.3) * (0.3 + 0.7 * h.l) * (0.85 + Math.sin(t * 9) * 0.15) }
    if (!vis) return
    // aparece de baixo para cima, com um tremidinho de holograma
    const flick = h.live ? (Math.sin(t * 31) > 0.985 ? 0.4 : 1) : 1
    const op = Math.min(1, k) * (0.3 + 0.58 * h.l) * flick
    for (const mm of [m.body, m.light, m.dark]) mm.opacity = op
    m.eye.opacity = op
    fig.current.scale.set(1, Math.max(0.02, Math.min(1, k * 1.15)), 1)
    fig.current.position.y = 0.28 + Math.sin(t * 1.6) * 0.04
    // gestos: fala → braço direito mexe; cabeça acompanha
    const d = G().dialog
    const talking = h.live && !!d && d.lines[d.i]?.who === who
    armR.current.rotation.x = talking ? -0.5 + Math.sin(t * 3.2) * 0.35 : -0.15
    armR.current.rotation.z = -0.25
    head.current.rotation.y = Math.sin(t * 0.7) * 0.18
    head.current.rotation.x = Math.sin(t * 1.1) * 0.05
  })
  const hair = new THREE.Color(HAIR[who] || '#3a2a1c')
  const hairM = useMemo(() => { const x = m.dark.clone(); x.color.lerp(hair, 0.6); return x }, [m])
  useFrame(() => { hairM.opacity = m.body.opacity })
  return (
    <group ref={g} position={position} rotation={[0, rotY, 0]}>
      {/* feixe do projetor */}
      <mesh ref={beam} position={[0, 1.3, 0]} userData={{ noCollide: true, noBatch: true }}>
        <cylinderGeometry args={[0.55, 0.85, 2.6, 24, 1, true]} />
        <meshBasicMaterial color={p.color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <group ref={fig} visible={false} userData={{ noCollide: true, noBatch: true }}>
        <group scale={1.3}>
          {/* túnica / casaco */}
          <mesh position={[0, 0.5, 0]} material={m.body}><cylinderGeometry args={[0.2, 0.34, 1.0, 14]} /></mesh>
          <mesh position={[0, 1.02, 0]} scale={[1.15, 0.6, 0.9]} material={m.body}><sphereGeometry args={[0.2, 14, 10]} /></mesh>
          <mesh position={[0, 0.02, 0]} material={m.dark}><cylinderGeometry args={[0.34, 0.34, 0.05, 14]} /></mesh>
          {/* braços */}
          <group position={[-0.24, 1.0, 0]} rotation={[-0.1, 0, 0.18]}>
            <mesh position={[0, -0.24, 0]} material={m.body}><capsuleGeometry args={[0.06, 0.38, 4, 8]} /></mesh>
            <mesh position={[0, -0.5, 0]} material={m.light}><sphereGeometry args={[0.06, 8, 6]} /></mesh>
          </group>
          <group ref={armR} position={[0.24, 1.0, 0]}>
            <mesh position={[0, -0.24, 0]} material={m.body}><capsuleGeometry args={[0.06, 0.38, 4, 8]} /></mesh>
            <mesh position={[0, -0.5, 0]} material={m.light}><sphereGeometry args={[0.06, 8, 6]} /></mesh>
          </group>
          {/* cabeça */}
          <group ref={head} position={[0, 1.32, 0]}>
            <mesh material={m.light}><sphereGeometry args={[0.19, 18, 14]} /></mesh>
            {[-1, 1].map((s) => <mesh key={s} position={[0.07 * s, 0.01, 0.17]} material={m.eye}><sphereGeometry args={[0.024, 8, 6]} /></mesh>)}
            <Accessory acc={p.acc} m={hairM} light={m.light} body={m.body} who={who} />
          </group>
        </group>
      </group>
    </group>
  )
}

function Accessory({ acc, m, light, body, who }: { acc: Person['acc']; m: THREE.Material; light: THREE.Material; body: THREE.Material; who: string }) {
  const cap = <mesh position={[0, 0.05, -0.02]} scale={[1.06, 0.95, 1.06]} material={m}><sphereGeometry args={[0.19, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} /></mesh>
  switch (acc) {
    case 'beard': return <>{cap}<mesh position={[0, -0.14, 0.09]} rotation={[0.25, 0, 0]} material={m}><coneGeometry args={[0.14, who === 'MARKOV' ? 0.26 : 0.32, 12]} /></mesh></>
    case 'turban': return <><mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]} material={light}><torusGeometry args={[0.16, 0.07, 8, 18]} /></mesh><mesh position={[0, 0.17, 0]} scale={[1, 0.7, 1]} material={light}><sphereGeometry args={[0.16, 12, 8]} /></mesh><mesh position={[0, -0.12, 0.1]} rotation={[0.3, 0, 0]} material={m}><coneGeometry args={[0.1, 0.2, 10]} /></mesh></>
    case 'hat': return <>{cap}<mesh position={[0, 0.2, -0.02]} material={m}><boxGeometry args={[0.26, 0.12, 0.24]} /></mesh><mesh position={[0, 0.2, -0.12]} material={m}><boxGeometry args={[0.6, 0.03, 0.06]} /></mesh></>
    case 'wig': return <>{cap}{[-1, 1].map((s) => [0, 1, 2].map((j) => <mesh key={s + '_' + j} position={[0.16 * s, -0.04 - j * 0.11, -0.04]} material={m}><sphereGeometry args={[0.085, 10, 8]} /></mesh>))}</>
    case 'bun': return <>{cap}<mesh position={[0, 0.12, -0.15]} material={m}><sphereGeometry args={[0.1, 10, 8]} /></mesh>{[-1, 1].map((s) => <mesh key={s} position={[0.17 * s, -0.04, 0]} material={m}><sphereGeometry args={[0.06, 8, 6]} /></mesh>)}</>
    case 'cap': return <><mesh position={[0, 0.1, -0.01]} scale={[1.1, 0.55, 1.1]} material={body}><sphereGeometry args={[0.19, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} /></mesh>{[-1, 1].map((s) => <mesh key={s} position={[0.17 * s, -0.04, -0.03]} material={m}><sphereGeometry args={[0.06, 8, 6]} /></mesh>)}</>
    case 'sideburns': return <>{cap}{[-1, 1].map((s) => <mesh key={s} position={[0.175 * s, -0.06, 0.02]} material={m}><boxGeometry args={[0.04, 0.14, 0.07]} /></mesh>)}</>
    case 'straw': return <>{cap}<mesh position={[0, 0.17, 0]} material={light}><coneGeometry args={[0.44, 0.24, 18]} /></mesh></>
    case 'glasses': return <>{cap}{[-1, 1].map((s) => <mesh key={s} position={[0.07 * s, 0.01, 0.185]} material={m}><torusGeometry args={[0.045, 0.01, 6, 14]} /></mesh>)}</>
    default: return cap
  }
}
