import * as THREE from 'three'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { MAT } from './materials'
import { Solid } from './core'
import { celestialTex, dialTex, booksTex } from './textures'
import { RT } from '../engine/runtime'

type V3 = [number, number, number]

/** Telescópio de bronze com montagem (az = giro horizontal, alt = inclinação). */
export const Telescope = forwardRef(function Telescope({ position, rotY = 0, s = 1, alt = 0.5 }: { position: V3; rotY?: number; s?: number; alt?: number }, ref) {
  const yaw = useRef<THREE.Group>(null!)
  const pitch = useRef<THREE.Group>(null!)
  const lens = useRef<THREE.MeshStandardMaterial>(null!)
  useImperativeHandle(ref, () => ({ yaw: yaw.current, pitch: pitch.current, lens: lens.current }))
  const L = 3.2
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={s}>
      <Solid>
        <mesh position={[0, 0.5, 0]} material={MAT.stoneDark()} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.7, 1, 16]} /></mesh>
      </Solid>
      <mesh position={[0, 1.02, 0]} material={MAT.gold()}><torusGeometry args={[0.55, 0.04, 8, 32]} /></mesh>
      <group ref={yaw} position={[0, 1.05, 0]} userData={{ noBatch: true }}>
        <mesh position={[0, 0.25, 0]} material={MAT.bronzeDark()} castShadow><cylinderGeometry args={[0.18, 0.28, 0.5, 12]} /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.32, 0.65, 0]} material={MAT.bronze()} castShadow><boxGeometry args={[0.08, 0.7, 0.18]} /></mesh>)}
        <group ref={pitch} position={[0, 0.85, 0]} rotation={[-alt, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, L * 0.18]} material={MAT.bronze()} castShadow><cylinderGeometry args={[0.24, 0.17, L, 24]} /></mesh>
          {[-0.9, -0.2, 0.6, 1.3].map((z, i) => <mesh key={i} position={[0, 0, z + L * 0.18]} material={MAT.gold()}><torusGeometry args={[0.2 + (z + 1) * 0.022, 0.035, 8, 24]} /></mesh>)}
          <mesh position={[0, 0, L * 0.68]} material={MAT.gold()}><torusGeometry args={[0.26, 0.05, 10, 28]} /></mesh>
          <mesh position={[0, 0, L * 0.69]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.02, 24]} /><meshStandardMaterial ref={lens} color="#8fd8ff" emissive="#2a8cff" emissiveIntensity={0.6} metalness={0.2} roughness={0.05} /></mesh>
          <mesh position={[0, 0.02, -L * 0.33]} rotation={[Math.PI / 2, 0, 0]} material={MAT.bronzeDark()}><cylinderGeometry args={[0.07, 0.09, 0.4, 12]} /></mesh>
          <mesh position={[0, 0.3, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={MAT.bronzeDark()}><cylinderGeometry args={[0.05, 0.05, 0.9, 10]} /></mesh>
        </group>
      </group>
    </group>
  )
})

/** Esfera armilar com orbe de luz no centro. */
export function ArmillarySphere({ position, s = 1, spin = 1 }: { position: V3; s?: number; spin?: number }) {
  const rings = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    const r = rings.current
    if (!r) return
    r.children.forEach((c, i) => { c.rotation.y += dt * 0.12 * spin * (i % 2 ? -1 : 1) * (1 + i * 0.3) })
  })
  const R = 1.6
  return (
    <group position={position} scale={s}>
      <Solid>
        <mesh position={[0, 0.4, 0]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[0.9, 1.1, 0.8, 24]} /></mesh>
      </Solid>
      <mesh position={[0, 0.86, 0]} material={MAT.gold()}><cylinderGeometry args={[0.95, 0.95, 0.1, 32]} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.5, 1.3, 0]} rotation={[0, 0, k * 0.5]} material={MAT.bronze()} castShadow><cylinderGeometry args={[0.06, 0.09, 1.1, 8]} /></mesh>)}
      <group position={[0, 2.7, 0]} userData={{ noBatch: true }}>
        <mesh material={MAT.gold()} castShadow><torusGeometry args={[R, 0.07, 10, 64]} /></mesh>
        <group ref={rings}>
          <group><mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.bronze()} castShadow><torusGeometry args={[R * 0.94, 0.055, 10, 64]} /></mesh></group>
          <group rotation={[0.4, 0, 0.3]}><mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()} castShadow><torusGeometry args={[R * 0.82, 0.05, 10, 56]} /></mesh></group>
          <group rotation={[-0.5, 0, 0.6]}><mesh material={MAT.bronze()} castShadow><torusGeometry args={[R * 0.7, 0.045, 10, 48]} /></mesh></group>
          <group rotation={[0.9, 0, -0.2]}><mesh material={MAT.gold()}><torusGeometry args={[R * 0.58, 0.04, 8, 40]} /></mesh></group>
        </group>
        <mesh rotation={[0, 0, 0.41]} material={MAT.bronzeDark()}><cylinderGeometry args={[0.03, 0.03, R * 2.3, 8]} /></mesh>
        <mesh material={MAT.glowBlue()}><sphereGeometry args={[0.34, 24, 16]} /></mesh>
        <mesh><sphereGeometry args={[0.5, 24, 16]} /><meshBasicMaterial color="#59d7ff" transparent opacity={0.15} depthWrite={false} toneMapped={false} /></mesh>
        <Sparkles count={20} scale={1.6} size={4} speed={0.6} color="#9fe9ff" />
      </group>
    </group>
  )
}

/** Globo celeste giratório. */
export const CelestialGlobe = forwardRef(function CelestialGlobe({ position, s = 1 }: { position: V3; s?: number }, ref) {
  const globe = useRef<THREE.Mesh>(null!)
  useImperativeHandle(ref, () => globe.current)
  const tex = celestialTex()
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, 0.35, 0]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.18, 0.4, 0.7, 12]} /></mesh></Solid>
      <mesh position={[0, 0.8, 0]} material={MAT.bronze()}><torusGeometry args={[0.68, 0.035, 8, 40]} /></mesh>
      <group position={[0, 1.15, 0]} rotation={[0, 0, 0.41]} userData={{ noBatch: true }}>
        <mesh ref={globe} castShadow><sphereGeometry args={[0.6, 40, 28]} /><meshStandardMaterial map={tex} roughness={0.4} metalness={0.1} emissive="#1a2f6a" emissiveIntensity={0.35} emissiveMap={tex} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} material={MAT.gold()}><torusGeometry args={[0.66, 0.025, 8, 48, Math.PI * 1.4]} /></mesh>
      </group>
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()}><torusGeometry args={[0.7, 0.03, 8, 48]} /></mesh>
    </group>
  )
})

/** Ampulheta (fill = areia em cima, 0..1). */
export const Hourglass = forwardRef(function Hourglass({ position, s = 1 }: { position: V3; s?: number }, ref) {
  const body = useRef<THREE.Group>(null!)
  const top = useRef<THREE.Mesh>(null!)
  const bot = useRef<THREE.Mesh>(null!)
  const stream = useRef<THREE.Mesh>(null!)
  const fill = useRef(1)
  useImperativeHandle(ref, () => ({ body: body.current, setFill: (f: number) => { fill.current = f } }))
  const bulb = useMemo(() => new THREE.LatheGeometry([[0.02, 0], [0.12, 0.05], [0.3, 0.25], [0.32, 0.45], [0.26, 0.6], [0.05, 0.75]].map(([x, y]) => new THREE.Vector2(x, y)), 24), [])
  useFrame(() => {
    const f = fill.current
    top.current.scale.set(Math.max(0.01, f) ** 0.5, Math.max(0.01, f), Math.max(0.01, f) ** 0.5)
    bot.current.scale.set(Math.max(0.01, 1 - f) ** 0.5, Math.max(0.01, 1 - f), Math.max(0.01, 1 - f) ** 0.5)
    stream.current.visible = f > 0.01 && f < 0.99
  })
  const sand = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8c27a', roughness: 0.9 }), [])
  return (
    <group position={position} scale={s}>
      <group ref={body} position={[0, 0.95, 0]} userData={{ noBatch: true }}>
        {[-1, 1].map((k) => <mesh key={k} position={[0, k * 0.82, 0]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.42, 0.42, 0.1, 6]} /></mesh>)}
        {[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.09) * 0.36, 0, Math.sin(i * 2.09) * 0.36]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.03, 0.03, 1.6, 6]} /></mesh>)}
        <mesh geometry={bulb} position={[0, 0, 0]} material={MAT.glass()} />
        <mesh geometry={bulb} rotation={[Math.PI, 0, 0]} material={MAT.glass()} />
        <mesh ref={top} position={[0, 0.35, 0]} material={sand}><coneGeometry args={[0.24, 0.32, 16]} /></mesh>
        <mesh ref={bot} position={[0, -0.6, 0]} rotation={[0, 0, 0]} material={sand}><coneGeometry args={[0.26, 0.3, 16]} /></mesh>
        <mesh ref={stream} position={[0, -0.25, 0]} material={sand}><cylinderGeometry args={[0.012, 0.012, 0.6, 5]} /></mesh>
      </group>
    </group>
  )
})

/** Relógio de sol monumental. A sombra é desenhada (ângulo controlável). */
export const Sundial = forwardRef(function Sundial({ position, r = 3.2 }: { position: V3; r?: number }, ref) {
  const shadow = useRef<THREE.Group>(null!)
  const marker = useRef<THREE.Group>(null!)
  useImperativeHandle(ref, () => ({ shadow: shadow.current, marker: marker.current }))
  const gnomon = useMemo(() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(r * 0.75, 0); s.lineTo(0, r * 0.6); s.lineTo(0, 0); const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }); g.translate(0, 0, -0.06); return g }, [r])
  return (
    <group position={position}>
      <Solid>
        <mesh position={[0, 0.3, 0]} material={MAT.wall(2)} castShadow receiveShadow><cylinderGeometry args={[r + 0.3, r + 0.5, 0.6, 48]} /></mesh>
      </Solid>
      <mesh position={[0, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[r, 64]} /><meshStandardMaterial map={dialTex()} roughness={0.6} /></mesh>
      <mesh geometry={gnomon} position={[0, 0.61, 0]} rotation={[0, Math.PI / 2, 0]} material={MAT.bronze()} castShadow />
      <group ref={shadow} position={[0, 0.63, 0]} userData={{ noBatch: true }}>
        <mesh position={[0, 0, -r * 0.45]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><planeGeometry args={[0.16, r * 0.9]} /><meshBasicMaterial color="#1a1208" transparent opacity={0.55} depthWrite={false} /></mesh>
      </group>
      <group ref={marker} position={[0, 0.64, 0]} visible={false}>
        <mesh position={[0, 0, -r * 0.88]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><ringGeometry args={[0.12, 0.2, 24]} /><meshBasicMaterial color="#59d7ff" toneMapped={false} /></mesh>
      </group>
    </group>
  )
})

/** Ábaco de madeira: 3 hastes (centenas, dezenas, unidades) com 10 contas. */
export const Abacus = forwardRef(function Abacus({ position, rotY = 0, s = 1, onBead }: { position: V3; rotY?: number; s?: number; onBead?: (rod: number, idx: number) => void }, ref) {
  const beads = useRef<THREE.Mesh[][]>([[], [], []])
  useImperativeHandle(ref, () => ({ beads: beads.current }))
  const cols = ['#c0392b', '#2e86c1', '#f1c40f']
  const W = 1.6
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={s}>
      <Solid><mesh position={[0, 0.45, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[W + 0.4, 0.9, 0.7]} /></mesh></Solid>
      <group position={[0, 1.25, 0]} userData={{ noBatch: true }}>
        {[-1, 1].map((k) => <mesh key={k} position={[k * (W / 2 + 0.06), 0, 0]} material={MAT.wood()} castShadow><boxGeometry args={[0.1, 0.9, 0.12]} /></mesh>)}
        {[-1, 1].map((k) => <mesh key={k} position={[0, k * 0.42, 0]} material={MAT.wood()} castShadow><boxGeometry args={[W + 0.2, 0.08, 0.12]} /></mesh>)}
        {[0, 1, 2].map((r) => (
          <group key={r} position={[0, 0.25 - r * 0.25, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={MAT.bronze()}><cylinderGeometry args={[0.012, 0.012, W, 6]} /></mesh>
            {Array.from({ length: 10 }, (_, i) => (
              <mesh key={i} ref={(m) => { if (m) beads.current[r][i] = m }} position={[-W / 2 + 0.08 + i * 0.075, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow
                onClick={(e) => { e.stopPropagation(); onBead?.(r, i) }}>
                <cylinderGeometry args={[0.055, 0.055, 0.065, 12]} /><meshStandardMaterial color={cols[r]} roughness={0.4} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
})

/** Planetário mecânico (orrery). */
export function Orrery({ position, s = 1 }: { position: V3; s?: number }) {
  const arms = useRef<THREE.Group>(null!)
  useFrame((_, dt) => { arms.current?.children.forEach((c, i) => { c.rotation.y += dt * (0.6 / (i + 1)) }) })
  const pl = ['#c9a27a', '#e3c27a', '#5a8fd8', '#d86a4a', '#c9b08a']
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, 0.4, 0]} material={MAT.woodDark()} castShadow><cylinderGeometry args={[0.5, 0.6, 0.8, 16]} /></mesh></Solid>
      <mesh position={[0, 0.85, 0]} material={MAT.bronze()}><cylinderGeometry args={[0.55, 0.55, 0.08, 24]} /></mesh>
      <mesh position={[0, 1.5, 0]} material={MAT.glowWarm()}><sphereGeometry args={[0.2, 20, 14]} /></mesh>
      <mesh position={[0, 1.1, 0]} material={MAT.bronzeDark()}><cylinderGeometry args={[0.03, 0.03, 0.6, 8]} /></mesh>
      <group ref={arms} position={[0, 1.5, 0]} userData={{ noBatch: true }}>
        {pl.map((c, i) => (
          <group key={i} rotation={[0, i * 1.3, 0]}>
            <mesh position={[(0.4 + i * 0.22) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.bronze()}><cylinderGeometry args={[0.008, 0.008, 0.4 + i * 0.22, 4]} /></mesh>
            <mesh position={[0.4 + i * 0.22, 0, 0]}><sphereGeometry args={[0.05 + (i % 3) * 0.025, 14, 10]} /><meshStandardMaterial color={c} roughness={0.6} /></mesh>
            <mesh position={[0, -0.04 * i, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.4 + i * 0.22, 0.004, 4, 48]} /><meshBasicMaterial color="#d9a648" transparent opacity={0.5} /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** Estante com livros. */
export function Bookshelf({ position, rotY = 0, w = 2.4, h = 3.2 }: { position: V3; rotY?: number; w?: number; h?: number }) {
  const tex = booksTex()
  const bm = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), [tex])
  const shelves = 5
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        <mesh position={[0, h / 2, -0.05]} material={MAT.woodDark()} castShadow receiveShadow><boxGeometry args={[w, h, 0.1]} /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * w / 2, h / 2, 0.2]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.1, h, 0.55]} /></mesh>)}
      </Solid>
      {Array.from({ length: shelves + 1 }, (_, i) => <mesh key={i} position={[0, 0.05 + i * (h - 0.1) / shelves, 0.2]} material={MAT.wood()} receiveShadow><boxGeometry args={[w, 0.06, 0.5]} /></mesh>)}
      {Array.from({ length: shelves }, (_, i) => <mesh key={i} position={[0, 0.08 + i * (h - 0.1) / shelves + 0.25, 0.25]} material={bm}><boxGeometry args={[w - 0.12, 0.5, 0.36]} /></mesh>)}
    </group>
  )
}

/** Mesa com livro aberto e velas. */
export function Desk({ position, rotY = 0, book = true }: { position: V3; rotY?: number; book?: boolean }) {
  const page = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3e7cc', roughness: 0.9 }), [])
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid>
        <mesh position={[0, 0.76, 0]} material={MAT.woodDark()} castShadow receiveShadow><boxGeometry args={[1.8, 0.08, 0.9]} /></mesh>
        {[[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].map(([x, z], i) => <mesh key={i} position={[x, 0.37, z]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.08, 0.74, 0.08]} /></mesh>)}
      </Solid>
      {book && <group position={[0, 0.82, 0]}>
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.08]} material={page} castShadow><boxGeometry args={[0.4, 0.03, 0.52]} /></mesh>
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.08]} material={page} castShadow><boxGeometry args={[0.4, 0.03, 0.52]} /></mesh>
        <mesh position={[0, -0.025, 0]} material={MAT.cloth('#5a1e1a')}><boxGeometry args={[0.86, 0.02, 0.56]} /></mesh>
      </group>}
      {[-0.7, 0.7].map((x) => <group key={x} position={[x, 0.8, -0.25]}>
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.03, 0.03, 0.2, 8]} /><meshStandardMaterial color="#f3ead6" /></mesh>
        <mesh position={[0, 0.24, 0]} material={MAT.glowWarm()}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
      </group>)}
    </group>
  )
}

/** Portal de pedra com anéis concêntricos e energia central. */
export const Portal = forwardRef(function Portal({ position, rotY = 0, s = 1, active = false, color = '#59d7ff' }: { position: V3; rotY?: number; s?: number; active?: boolean; color?: string }, ref) {
  const rings = useRef<THREE.Group>(null!)
  const disc = useRef<THREE.Mesh>(null!)
  const k = useRef(active ? 1 : 0)
  useImperativeHandle(ref, () => ({ rings: rings.current }))
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uK: { value: 0 }, uCol: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime, uK; uniform vec3 uCol;
      void main(){ vec2 p = vUv*2.-1.; float r = length(p); float a = atan(p.y,p.x);
        float sw = sin(a*5. + r*14. - uTime*3.)*0.5+0.5; float sw2 = sin(a*3. - r*9. + uTime*2.)*0.5+0.5;
        float core = smoothstep(1.0, 0.0, r);
        vec3 col = mix(uCol*0.6, vec3(1.0), pow(core, 3.0)) + uCol*sw*0.6 + vec3(0.6,0.4,1.0)*sw2*0.3;
        float alpha = smoothstep(1.0, 0.85, r) * uK * (0.55 + sw*0.45);
        gl_FragColor = vec4(col*1.6, alpha);
      }`,
  }), [color])
  useFrame((_, dt) => {
    const want = active ? 1 : 0
    k.current += (want - k.current) * Math.min(1, dt * 1.5)
    mat.uniforms.uTime.value = RT.time
    mat.uniforms.uK.value = k.current
    if (rings.current) rings.current.children.forEach((c, i) => { c.rotation.z += dt * (0.2 + k.current * 1.4) * (i % 2 ? -1 : 1) })
    if (disc.current) disc.current.visible = k.current > 0.02
  })
  const R = 2.3
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={s}>
      <Solid>
        <mesh position={[0, 0.25, 0]} material={MAT.stone()} receiveShadow castShadow><cylinderGeometry args={[3.2, 3.5, 0.5, 32]} /></mesh>
        {[-1, 1].map((k2) => <mesh key={k2} position={[k2 * (R + 0.45), 1.6, 0]} material={MAT.wall(1)} castShadow><boxGeometry args={[0.7, 3, 0.9]} /></mesh>)}
      </Solid>
      <group position={[0, R + 0.6, 0]} userData={{ noBatch: true }}>
        <mesh material={MAT.wall(1)} castShadow><torusGeometry args={[R + 0.25, 0.42, 12, 48]} /></mesh>
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * (R + 0.25), Math.sin(a) * (R + 0.25), 0.36]} material={active ? MAT.glowBlue() : MAT.gold()}><boxGeometry args={[0.26, 0.26, 0.1]} /></mesh> })}
        <group ref={rings}>
          <mesh material={MAT.bronze()}><torusGeometry args={[R * 0.86, 0.06, 8, 48]} /></mesh>
          <mesh material={MAT.gold()}><torusGeometry args={[R * 0.7, 0.05, 8, 48]} /></mesh>
          <mesh material={MAT.bronze()}><torusGeometry args={[R * 0.54, 0.04, 8, 40]} /></mesh>
        </group>
        <mesh ref={disc} material={mat} userData={{ noCollide: true }}><circleGeometry args={[R * 0.95, 48]} /></mesh>
        {active && <Sparkles count={50} scale={[R * 2, R * 2, 1.5]} size={5} speed={0.8} color={color} />}
      </group>
    </group>
  )
})
