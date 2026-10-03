import * as THREE from 'three'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Solid, Block, Ramp, useFlag } from '../../../world/core'
import { MAT } from '../../../world/materials'
import { Column, Arch, Stairs, RoundPlatform, RectPlatform, Balustrade, RingBalustrade, Lantern, Banner, Statue, Tree, Bush, Ivy, Bench, Brazier, Cliff, Wall, Batch, Pedestal } from '../../../world/Architecture'
import { ArmillarySphere, Bookshelf, Desk, Orrery, Portal, Telescope } from '../../../world/Instruments'
import { Waterfall } from '../../../world/Atmosphere'
import { RT } from '../../../engine/runtime'

type V3 = [number, number, number]
export const P = {
  spawn: [0, 0.4, 38] as V3,
  ent: [0, 0.4, 36] as V3,
  plaza: [0, 3, 9] as V3,
  terr: [-27, 3, 9] as V3,
  dial: [26, 3, 9] as V3,
  dome: [0, 7, -25] as V3,
  lib: [26, 3, -12] as V3,
  lab: [26, 3, -24] as V3,
  tower: [-26, 3, -14] as V3,
  garden: [22, 0, 30] as V3,
  portal: [-22, 0, 32] as V3,
}

/** true quando o NEX está dentro da caixa (para esconder telhados). */
export function useInside(min: V3, max: V3) {
  const [inside, set] = useState(false)
  const st = useRef(false)
  useFrame(() => {
    const p = RT.player
    const v = p.x > min[0] && p.x < max[0] && p.y > min[1] && p.y < max[1] && p.z > min[2] && p.z < max[2]
    if (v !== st.current) { st.current = v; set(v) }
  })
  return inside
}

/* ---------- chão, montanha e bordas ---------- */
function Ground() {
  return (
    <>
      <Cliff position={[0, 0, 2]} r={60} depth={90} seed={7} />
      <Solid invisible><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 2]}><circleGeometry args={[60, 32]} /></mesh></Solid>
      {Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return <Block key={i} size={[11, 6, 1]} position={[Math.cos(a) * 55.5, 3, 2 + Math.sin(a) * 55.5]} rotation={[0, -a + Math.PI / 2, 0]} /> })}
      {/* pedras soltas na borda */}
      <Batch>
        {Array.from({ length: 30 }, (_, i) => { const a = i * 0.71 + 0.2, r = 50 + (i % 4) * 1.5, s = 1 + (i % 5) * 0.7; return <mesh key={i} position={[Math.cos(a) * r, s * 0.25, 2 + Math.sin(a) * r]} scale={[s, s * 0.7, s]} rotation={[i, i * 1.7, 0]} material={MAT.rock(1)} castShadow><dodecahedronGeometry args={[1, 0]} /></mesh> })}
      </Batch>
    </>
  )
}

/* ---------- entrada ---------- */
function Entrance() {
  return (
    <group>
      <RoundPlatform position={P.ent} r={6.5} h={1.2} rep={3} />
      {/* arco de entrada no pé da escadaria */}
      <Arch position={[0, 0.4, 31.4]} w={8.4} h={6.4} d={1.2} open={5.6} />
      <Stairs from={[0, 0.4, 30.4]} to={[0, 3, 21.4]} w={5} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <Lantern position={[k * 3.4, 0.4, 31]} light />
          <Lantern position={[k * 3.4, 3, 20.4]} />
          <Banner position={[k * 4.4, 0.4, 33.5]} rotY={0} h={3.4} emblem="sun" />
        </group>
      ))}
      {/* trilhas para jardim e portal */}
      <RectPlatform position={[11.5, 0.4, 35]} size={[11, 0.8, 4]} rep={2} />
      <RectPlatform position={[-11.5, 0.4, 35]} size={[11, 0.8, 4]} rep={2} />
    </group>
  )
}

/* ---------- praça central ---------- */
function Plaza() {
  const [x, y, z] = P.plaza
  const cols: ReactNode[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16
    const near = [0, Math.PI / 2, Math.PI, Math.PI * 1.5].some((g) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < 0.32)
    if (near) continue
    cols.push(<Column key={i} position={[x + Math.cos(a) * 11.2, y, z + Math.sin(a) * 11.2]} h={4.2} r={0.34} broken={i === 5 || i === 12} />)
  }
  return (
    <group>
      <RoundPlatform position={P.plaza} r={12} h={3.2} rep={5} />
      {/* fonte com a esfera armilar */}
      <Solid>
        <mesh position={[x, y + 0.35, z]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[3.4, 3.6, 0.7, 40]} /></mesh>
      </Solid>
      <mesh position={[x, y + 0.62, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water()} userData={{ noCollide: true }}><ringGeometry args={[1.3, 3.1, 40]} /></mesh>
      <ArmillarySphere position={[x, y + 0.7, z]} s={1.25} />
      <Batch>{cols}</Batch>
      {/* estátuas nas 4 diagonais */}
      <Statue position={[x + 7.4, y, z + 7.4]} rotY={-Math.PI * 0.75} pose="book" />
      <Statue position={[x - 7.4, y, z + 7.4]} rotY={Math.PI * 0.75} pose="point" />
      <Statue position={[x + 7.4, y, z - 7.4]} rotY={-Math.PI * 0.25} pose="think" />
      <Statue position={[x - 7.4, y, z - 7.4]} rotY={Math.PI * 0.25} pose="book" />
      {[0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4; return <Lantern key={i} position={[x + Math.cos(a) * 4.8, y, z + Math.sin(a) * 4.8]} light={i % 2 === 0} /> })}
      <Bench position={[x + 5.2, y, z]} rotY={Math.PI / 2} />
      <Bench position={[x - 5.2, y, z]} rotY={-Math.PI / 2} />
      {/* escada norte para a cúpula */}
      <Stairs from={[0, 3, -2.6]} to={[0, 7, -11.2]} w={5} />
      {[-1, 1].map((k) => <Banner key={k} position={[k * 3.3, 3, -2]} h={3.6} emblem="compass" />)}
    </group>
  )
}

/* ---------- pontes laterais ---------- */
function Bridges() {
  return (
    <group>
      <RectPlatform position={[-16.6, 3, 9]} size={[9, 1.2, 4.2]} rep={2} />
      <Balustrade from={[-12.4, 3, 11.1]} to={[-20.6, 3, 11.1]} />
      <Balustrade from={[-12.4, 3, 6.9]} to={[-20.6, 3, 6.9]} />
      <RectPlatform position={[16.6, 3, 9]} size={[9, 1.2, 4.2]} rep={2} />
      <Balustrade from={[12.4, 3, 11.1]} to={[20.6, 3, 11.1]} />
      <Balustrade from={[12.4, 3, 6.9]} to={[20.6, 3, 6.9]} />
      {/* pilares sob as pontes */}
      {[-16.6, 16.6].map((x) => <mesh key={x} position={[x, -1, 9]} material={MAT.wall(2)} castShadow userData={{ noCollide: true }}><boxGeometry args={[2.4, 6, 3.6]} /></mesh>)}
      {/* trilhas: terraço → torre, relógio → biblioteca */}
      <RectPlatform position={[-27, 3, -2]} size={[4.2, 3, 9]} rep={2} />
      <RectPlatform position={[26, 3, -1.6]} size={[4.2, 3, 8]} rep={2} />
    </group>
  )
}

/* ---------- terraço celeste ---------- */
export function TerraceBase() {
  const [x, y, z] = P.terr
  return (
    <group>
      <RoundPlatform position={P.terr} r={7.2} h={3.2} rep={3} />
      <RingBalustrade center={[x, y, z]} r={7.0} gaps={[[-0.42, 0.42], [-Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4]]} seg={22} />
      <Bench position={[x - 2.5, y, z + 4.2]} rotY={Math.PI} />
      <Lantern position={[x + 5.2, y, z + 4.2]} light />
      <Lantern position={[x + 5.2, y, z - 4.2]} />
      <Banner position={[x - 6, y + 0.1, z - 3]} rotY={Math.PI / 2} h={3} emblem="star" />
    </group>
  )
}

/* ---------- relógio de sol (plataforma) ---------- */
export function DialBase() {
  const [x, y, z] = P.dial
  return (
    <group>
      <RoundPlatform position={P.dial} r={7.2} h={3.2} rep={3} />
      <RingBalustrade center={[x, y, z]} r={7.0} gaps={[[Math.PI - 0.42, Math.PI + 0.42], [-Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4]]} seg={22} />
      <Lantern position={[x - 5.2, y, z + 4.4]} light />
      <Lantern position={[x + 5, y, z + 4.4]} />
    </group>
  )
}

function DomeRibs({ R, side }: { R: number; side: number }) {
  const angs = [-1.2, -0.6, 0, 0.6, 1.2]
  return (
    <>
      {angs.map((a, i) => (
        <group key={i} rotation={[0, Math.PI / 2 * side + a, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]} material={MAT.gold()} userData={{ noCollide: true }}><torusGeometry args={[R + 0.04, 0.09, 6, 32, Math.PI / 2]} /></mesh>
        </group>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={MAT.gold()} userData={{ noCollide: true }}><torusGeometry args={[R + 0.06, 0.14, 6, 48, Math.PI]} /></mesh>
    </>
  )
}

/* ---------- cúpula principal ---------- */
export function DomeBuilding() {
  const open = useFlag('a1_dome_open')
  const [x, y, z] = P.dome
  const R = 8.2
  const left = useRef<THREE.Group>(null!)
  const right = useRef<THREE.Group>(null!)
  const k = useRef(open ? 1 : 0)
  const inside = useInside([x - R, y - 1, z - R], [x + R, y + 8, z + R])
  useFrame((_, dt) => {
    k.current += ((open ? 1 : 0) - k.current) * Math.min(1, dt * 0.6)
    const a = k.current * 1.15
    if (left.current) left.current.rotation.z = a
    if (right.current) right.current.rotation.z = -a
  })
  const half = useMemo(() => new THREE.SphereGeometry(R, 40, 20, 0, Math.PI, 0, Math.PI / 2), [])
  const segs: ReactNode[] = []
  const N = 20
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2
    // porta virada para o sul (+z) => ângulo PI/2
    if (Math.abs(Math.atan2(Math.sin(am - Math.PI / 2), Math.cos(am - Math.PI / 2))) < 0.3) continue
    segs.push(<Wall key={i} from={[x + Math.cos(a0) * R, y, z + Math.sin(a0) * R]} to={[x + Math.cos(a1) * R, y, z + Math.sin(a1) * R]} h={6.2} t={0.7} mat={MAT.wall(1)} />)
  }
  const domeVisible = !inside || !!open
  return (
    <group>
      <RectPlatform position={[0, 7, -23]} size={[28, 7.2, 24]} rep={6} />
      {segs}
      {/* faixa dourada e janelas no tambor */}
      <mesh position={[x, y + 6.25, z]} material={MAT.gold()}><torusGeometry args={[R + 0.05, 0.18, 8, 64]} /></mesh>
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.31; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.4) return null; return (
        <mesh key={i} position={[x + Math.cos(a) * (R + 0.37), y + 3.6, z + Math.sin(a) * (R + 0.37)]} rotation={[0, -a + Math.PI / 2, 0]} userData={{ noCollide: true }}><planeGeometry args={[0.9, 2.2]} /><meshStandardMaterial color="#ffd59a" emissive="#ffae4a" emissiveIntensity={1.6} /></mesh>
      ) })}
      {/* portal de entrada */}
      <Arch position={[x, y, z + R + 0.2]} w={5} h={6} d={1.6} open={3} />
      <Brazier position={[x - 3.4, y, z + R + 2.2]} />
      <Brazier position={[x + 3.4, y, z + R + 2.2]} />
      {/* cúpula que abre */}
      <group position={[x, y + 6.3, z]} visible={domeVisible}>
        <group position={[-R, 0, 0]}><group ref={left}><group position={[R, 0, 0]}>
          <mesh geometry={half} rotation={[0, Math.PI / 2, 0]} material={MAT.copper()} castShadow userData={{ noCollide: true }} />
          <DomeRibs R={R} side={-1} />
        </group></group></group>
        <group position={[R, 0, 0]}><group ref={right}><group position={[-R, 0, 0]}>
          <mesh geometry={half} rotation={[0, -Math.PI / 2, 0]} material={MAT.copper()} castShadow userData={{ noCollide: true }} />
          <DomeRibs R={R} side={1} />
        </group></group></group>
        <group visible={!open}>
          <mesh position={[0, R + 0.3, 0]} material={MAT.stone()}><cylinderGeometry args={[1.1, 1.3, 0.6, 16]} /></mesh>
          <mesh position={[0, R + 1.1, 0]} material={MAT.glowWarm()}><cylinderGeometry args={[0.7, 0.7, 1, 12]} /></mesh>
          <mesh position={[0, R + 1.9, 0]} material={MAT.copper()}><coneGeometry args={[1.0, 1.2, 12]} /></mesh>
          <mesh position={[0, R + 2.7, 0]} material={MAT.gold()}><sphereGeometry args={[0.25, 12, 10]} /></mesh>
        </group>
      </group>
      {/* interior */}
      <Telescope position={[x, y, z - 1.5]} s={2.1} alt={1.05} rotY={Math.PI} />
      <mesh position={[x, y + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><ringGeometry args={[4.2, 4.4, 64]} /></mesh>
      <Bookshelf position={[x - 5.6, y, z - 3.5]} rotY={Math.PI / 3} />
      <Bookshelf position={[x + 5.6, y, z - 3.5]} rotY={-Math.PI / 3} />
      <Lantern position={[x - 5, y, z + 3]} light />
      <Lantern position={[x + 5, y, z + 3]} light />
      {/* estandartes no terraço */}
      {[-1, 1].map((k2) => <Banner key={k2} position={[k2 * 11, 7, -13]} h={4} emblem="eye" />)}
      {[-1, 1].map((k2) => <Column key={k2} position={[k2 * 12, 7, -30]} h={5} />)}
      <Balustrade from={[-14, 7, -11.2]} to={[-3, 7, -11.2]} />
      <Balustrade from={[3, 7, -11.2]} to={[14, 7, -11.2]} />
      <Balustrade from={[-14, 7, -34.8]} to={[14, 7, -34.8]} />
      <Balustrade from={[-13.8, 7, -11]} to={[-13.8, 7, -35]} />
      <Balustrade from={[13.8, 7, -11]} to={[13.8, 7, -35]} />
    </group>
  )
}

/** Telhado de duas águas (prisma) com frontões. */
export function GableRoof({ position, w, d, h }: { position: V3; w: number; d: number; h: number }) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.lineTo(-w / 2, 0)
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g
  }, [w, d, h])
  return (
    <group position={position}>
      <mesh geometry={geo} material={MAT.copper()} castShadow userData={{ noCollide: true }} />
      <mesh position={[0, h + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><cylinderGeometry args={[0.08, 0.08, d + 0.1, 8]} /></mesh>
    </group>
  )
}

/* ---------- biblioteca ---------- */
export function Library({ secretOpen }: { secretOpen: boolean }) {
  const [x, y, z] = P.lib
  const inside = useInside([x - 7, y - 1, z - 6.5], [x + 7, y + 6, z + 6])
  const W = 14, D = 12, H = 5.5
  const x0 = x - W / 2, x1 = x + W / 2, z0 = z - D / 2, z1 = z + D / 2
  const shelf = useRef<THREE.Group>(null!)
  useFrame((_, dt) => { if (shelf.current) { const want = secretOpen ? 2.6 : 0; shelf.current.position.x += (want - shelf.current.position.x) * Math.min(1, dt * 1.5) } })
  return (
    <group>
      <RectPlatform position={P.lib} size={[16, 3.2, 15]} rep={4} />
      {/* paredes (porta ao sul, passagem secreta ao norte) */}
      <Wall from={[x0, y, z0]} to={[x0, y, z1]} h={H} />
      <Wall from={[x1, y, z0]} to={[x1, y, z1]} h={H} />
      <Wall from={[x0, y, z1]} to={[x - 1.8, y, z1]} h={H} />
      <Wall from={[x + 1.8, y, z1]} to={[x1, y, z1]} h={H} />
      <Wall from={[x0, y, z0]} to={[x - 1.4, y, z0]} h={H} />
      <Wall from={[x + 1.4, y, z0]} to={[x1, y, z0]} h={H} />
      {/* parede/estante secreta que desliza */}
      <group ref={shelf}>
        <Solid>
          <mesh position={[x, y + H / 2, z0]} material={MAT.wall(1)} castShadow><boxGeometry args={[2.8, H, 0.6]} /></mesh>
        </Solid>
        <Bookshelf position={[x, y, z0 + 0.35]} w={2.6} h={3.4} />
      </group>
      {/* pórtico */}
      {[-3.6, -1.9, 1.9, 3.6].map((dx) => <Column key={dx} position={[x + dx, y, z1 + 1.4]} h={H} r={0.3} />)}
      <mesh position={[x, y + H + 0.25, z1 + 1.2]} material={MAT.stone()} castShadow userData={{ noCollide: true }}><boxGeometry args={[9, 0.5, 3]} /></mesh>
      {/* telhado (some quando o NEX entra) */}
      <group visible={!inside}>
        <mesh position={[x, y + H + 0.2, z]} material={MAT.stone()} castShadow userData={{ noCollide: true }}><boxGeometry args={[W + 0.8, 0.4, D + 0.8]} /></mesh>
        <GableRoof position={[x, y + H + 0.4, z]} w={W + 1.2} d={D + 1.2} h={2.4} />
      </group>
      {/* janelas acesas */}
      {[-4, 0, 4].map((dz) => [x0 - 0.32, x1 + 0.32].map((wx) => <mesh key={dz + '' + wx} position={[wx, y + 3, z + dz]} rotation={[0, Math.PI / 2, 0]} userData={{ noCollide: true }}><planeGeometry args={[1.1, 2]} /><meshStandardMaterial color="#ffd59a" emissive="#ffae4a" emissiveIntensity={1.4} side={THREE.DoubleSide} /></mesh>))}
      {/* interior */}
      <Bookshelf position={[x0 + 0.4, y, z - 2.6]} rotY={Math.PI / 2} />
      <Bookshelf position={[x0 + 0.4, y, z + 2.6]} rotY={Math.PI / 2} />
      <Bookshelf position={[x1 - 0.4, y, z - 2.6]} rotY={-Math.PI / 2} />
      <Bookshelf position={[x1 - 0.4, y, z + 2.6]} rotY={-Math.PI / 2} />
      <Bookshelf position={[x - 4, y, z0 + 0.4]} />
      <Bookshelf position={[x + 4, y, z0 + 0.4]} />
      <Desk position={[x - 3.2, y, z + 1.5]} rotY={0.2} />
      <Lantern position={[x + 4.5, y, z + 4.5]} light />
      <Lantern position={[x - 4.5, y, z - 3.8]} light />
      <Ivy position={[x0 - 0.35, y + H, z + 2]} len={2.5} w={2} rotY={-Math.PI / 2} />
      <Ivy position={[x1 + 0.35, y + H, z - 3]} len={3} w={2.4} rotY={Math.PI / 2} />
    </group>
  )
}

/* ---------- laboratório oculto ---------- */
export function HiddenLab({ children }: { children?: ReactNode }) {
  const [x, y, z] = P.lab
  const inside = useInside([x - 6, y - 1, z - 4.5], [x + 6, y + 5, z + 6])
  return (
    <group>
      <RectPlatform position={[x, y, z]} size={[13, 3.2, 10]} rep={3} />
      <Wall from={[x - 6, y, z - 4]} to={[x + 6, y, z - 4]} h={4.5} />
      <Wall from={[x - 6, y, z - 4]} to={[x - 6, y, z + 5.5]} h={4.5} />
      <Wall from={[x + 6, y, z - 4]} to={[x + 6, y, z + 5.5]} h={4.5} />
      <Wall from={[x - 6, y, z + 5.5]} to={[x - 1.4, y, z + 5.5]} h={4.5} />
      <Wall from={[x + 1.4, y, z + 5.5]} to={[x + 6, y, z + 5.5]} h={4.5} />
      <group visible={!inside}>
        <mesh position={[x, y + 4.7, z + 0.75]} material={MAT.stoneDark()} userData={{ noCollide: true }}><boxGeometry args={[12.8, 0.4, 10.4]} /></mesh>
      </group>
      {/* rachaduras azuis nas paredes */}
      {[-3, 0, 3].map((dx) => <mesh key={dx} position={[x + dx, y + 2.2, z - 3.62]} userData={{ noCollide: true }}><planeGeometry args={[0.08, 2.6]} /><meshStandardMaterial color="#9fe9ff" emissive="#3fb8ff" emissiveIntensity={3} /></mesh>)}
      <pointLight position={[x, y + 3, z]} color="#59d7ff" intensity={8} distance={12} decay={1.8} />
      <Sparkles count={40} scale={[10, 3, 8]} position={[x, y + 2, z]} size={3} speed={0.3} color="#9fe9ff" />
      {children}
    </group>
  )
}

/* ---------- torre dos astros ---------- */
export const TOWER = { r0: 2.7, r1: 4.8, rise: 7, turns: 2, a0: Math.PI / 2 }
export function towerPoint(t: number, r: number): V3 {
  const [x, y, z] = P.tower
  const a = TOWER.a0 + t * Math.PI * 2 * TOWER.turns
  return [x + Math.cos(a) * r, y + t * TOWER.rise * TOWER.turns, z + Math.sin(a) * r]
}
export function Tower() {
  const [x, y, z] = P.tower
  const N = 56
  const steps: ReactNode[] = [], ramps: ReactNode[] = [], rails: ReactNode[] = []
  const rm = (TOWER.r0 + TOWER.r1) / 2, w = TOWER.r1 - TOWER.r0
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N
    const a = towerPoint(t0, rm), b = towerPoint(t1, rm)
    ramps.push(<Ramp key={i} from={a} to={b} w={w + 0.2} />)
    const tm = (t0 + t1) / 2, m = towerPoint(tm, rm)
    const ang = TOWER.a0 + tm * Math.PI * 2 * TOWER.turns
    const segLen = Math.hypot(b[0] - a[0], b[2] - a[2]) + 0.12
    steps.push(<mesh key={i} position={[m[0], m[1] - 0.15, m[2]]} rotation={[0, -ang, 0]} material={MAT.stone()} castShadow receiveShadow><boxGeometry args={[w, 0.3, segLen]} /></mesh>)
    const o = towerPoint(tm, TOWER.r1 + 0.1)
    const skipRail = i >= Math.floor(N / 2) - 3 && i <= Math.floor(N / 2) + 1 // abertura para o balcão do meio
    if (!skipRail) {
      rails.push(<mesh key={'r' + i} position={[o[0], o[1] + 0.45, o[2]]} rotation={[0, -ang, 0]} material={MAT.stoneDark()} castShadow><boxGeometry args={[0.25, 0.9, segLen]} /></mesh>)
      rails.push(<Block key={'b' + i} size={[0.3, 3, segLen]} position={[o[0], o[1] + 1.4, o[2]]} rotation={[0, -ang, 0]} />)
    }
  }
  const topY = y + TOWER.rise * TOWER.turns
  const mid = towerPoint(0.5, TOWER.r1 + 2.2)
  return (
    <group>
      <RoundPlatform position={P.tower} r={7.4} h={3.2} rep={3} />
      <Solid>
        <mesh position={[x, y + (topY - y) / 2, z]} material={MAT.wall(3)} castShadow receiveShadow><cylinderGeometry args={[TOWER.r0, TOWER.r0 + 0.2, topY - y, 28]} /></mesh>
      </Solid>
      <Batch>{steps}{rails}</Batch>
      {ramps}
      {/* balcão do meio (instrumentos) */}
      <group>
        <Solid><mesh position={[mid[0], mid[1] - 0.2, mid[2]]} material={MAT.stone()} castShadow receiveShadow><cylinderGeometry args={[2.4, 2.2, 0.4, 24]} /></mesh></Solid>
        <RingBalustrade center={[mid[0], mid[1], mid[2]]} r={2.3} a0={Math.PI * 0.25} a1={Math.PI * 1.75} seg={10} />
      </group>
      {/* topo: meia plataforma a oeste (a rampa chega pelo leste) */}
      <Solid><mesh position={[x, topY - 0.2, z]} material={MAT.stone()} castShadow receiveShadow><cylinderGeometry args={[5.4, 5.0, 0.4, 24, 1, false, Math.PI, Math.PI]} /></mesh></Solid>
      <RingBalustrade center={[x, topY, z]} r={5.2} a0={Math.PI / 2} a1={Math.PI * 1.5} seg={12} />
      <RingBalustrade center={[x, topY, z]} r={2.9} a0={-Math.PI / 2 + 0.05} a1={Math.PI / 2 - 0.25} seg={8} />
      <Balustrade from={[x + 0.05, topY, z - 2.9]} to={[x + 0.05, topY, z - 5.3]} />
      {[Math.PI * 0.72, Math.PI, Math.PI * 1.28].map((a, i) => <Column key={i} position={[x + Math.cos(a) * 4.3, topY, z + Math.sin(a) * 4.3]} h={3} r={0.22} />)}
      <mesh position={[x - 1.2, topY + 3.25, z]} rotation={[0, 0, 0]} material={MAT.copper()} castShadow userData={{ noCollide: true }}><cylinderGeometry args={[0.1, 4.6, 1.4, 6, 1, false, Math.PI, Math.PI]} /></mesh>
      <Orrery position={[x - 2.6, topY, z + 1.2]} s={1.2} />
      <Telescope position={[x - 2.8, topY, z - 1.8]} s={0.8} rotY={-2.2} alt={0.6} />
      <Banner position={[x + TOWER.r0 + 0.05, y + 9, z]} rotY={Math.PI / 2} h={4} emblem="star" pole={false} />
    </group>
  )
}

/* ---------- jardim das estrelas ---------- */
export function GardenBase() {
  const [x, y, z] = P.garden
  return (
    <group>
      <mesh position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.grass(4)} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[11, 40]} /></mesh>
      <Solid><mesh position={[x, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.marble()} receiveShadow><circleGeometry args={[4.6, 48]} /></mesh></Solid>
      <mesh position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><ringGeometry args={[4.4, 4.6, 64]} /></mesh>
      <Batch>
        {[[x - 8, z - 5, 'round'], [x + 8, z - 4, 'olive'], [x - 7, z + 6, 'cypress'], [x + 7, z + 7, 'round'], [x + 10, z + 1, 'cypress'], [x - 10, z, 'olive'], [x + 1, z - 9, 'round']].map(([tx, tz, k], i) => <Tree key={i} position={[tx as number, 0, tz as number]} kind={k as any} seed={i + 3} s={1.1} />)}
        {Array.from({ length: 14 }, (_, i) => { const a = i * 0.45 + 0.3, r = 6 + (i % 3); return <Bush key={i} position={[x + Math.cos(a) * r, 0, z + Math.sin(a) * r]} flowers={(['A', 'B', 'C'] as const)[i % 3]} s={0.9 + (i % 2) * 0.4} /> })}
      </Batch>
      {/* cristais luminosos */}
      {[0, 1, 2, 3, 4].map((i) => { const a = i * 1.257 + 0.5; return <mesh key={i} position={[x + Math.cos(a) * 5.4, 0.5, z + Math.sin(a) * 5.4]} rotation={[0.2, a, 0.1]} material={MAT.glowBlue()}><octahedronGeometry args={[0.28, 0]} /></mesh> })}
      <Statue position={[x + 3, 0, z - 7.5]} rotY={Math.PI} pose="point" s={0.85} />
      <Lantern position={[x - 5, 0, z - 7]} light />
      <Lantern position={[x + 6, 0, z + 5]} />
    </group>
  )
}

/* ---------- portal (base) ---------- */
export function PortalSite({ active }: { active: boolean }) {
  const [x, y, z] = P.portal
  return (
    <group>
      <Portal position={[x, y, z]} rotY={Math.PI / 2} active={active} />
      <Lantern position={[x + 3.6, 0, z + 3.2]} light={active} />
      <Lantern position={[x + 3.6, 0, z - 3.2]} />
    </group>
  )
}

function Paths() {
  const seg = (a: [number, number], b: [number, number], w = 2.6) => { const dx = b[0] - a[0], dz = b[1] - a[1]; const len = Math.hypot(dx, dz); return <mesh key={a.join() + b.join()} position={[(a[0] + b[0]) / 2, 0.025, (a[1] + b[1]) / 2]} rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]} material={MAT.floor(1)} receiveShadow userData={{ noCollide: true }}><planeGeometry args={[len, w]} /></mesh> }
  return (
    <group>
      {seg([17, 35], [22, 30])}{seg([-17, 35], [-20, 32])}
      {seg([22, 30], [36, 22])}{seg([36, 22], [42, 8])}{seg([-36, 22], [-42, 6])}{seg([-20, 32], [-36, 22])}
      <mesh position={[0, 0.02, 9]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.floor(6)} receiveShadow userData={{ noCollide: true }}><ringGeometry args={[12.2, 14.4, 64]} /></mesh>
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3; return <Bush key={i} position={[Math.cos(a) * 15.2, 0, 9 + Math.sin(a) * 15.2]} flowers={(['A', 'B', 'C'] as const)[i % 3]} s={1.3} /> })}
    </group>
  )
}

/* ---------- decoração geral ---------- */
function Decor() {
  return (
    <group>
      <Batch>
        {[[-40, 20], [-42, -6], [38, 24], [40, -2], [-14, 46], [14, 47], [-36, 36], [44, 12], [-46, 8], [34, -30], [-34, -32]].map(([tx, tz], i) => <Tree key={i} position={[tx, 0, tz]} kind={i % 3 === 0 ? 'cypress' : 'round'} seed={i} s={1.2 + (i % 3) * 0.2} />)}
        {Array.from({ length: 18 }, (_, i) => { const a = i * 0.9, r = 30 + (i % 5) * 3; return <Bush key={i} position={[Math.cos(a) * r, 0, 2 + Math.sin(a) * r]} flowers={(['A', 'B', 'C', null] as const)[i % 4]} s={1 + (i % 3) * 0.3} /> })}
      </Batch>
      <Ivy position={[-12.2, 3, 0]} len={2.6} w={3} rotY={-Math.PI / 2} />
      <Ivy position={[12.2, 3, 16]} len={2.4} w={2.6} rotY={Math.PI / 2} />
      {/* riacho e cachoeiras nas bordas */}
      <Waterfall position={[-56.5, 0, 10]} rotY={Math.PI / 2} width={5} height={40} />
      <Waterfall position={[40, 0, 41]} rotY={-Math.PI / 4} width={4} height={36} />
      <Waterfall position={[-30, 0, -48]} rotY={Math.PI * 0.2} width={3.5} height={34} />
      <mesh position={[-48, 0.04, 10]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water()} userData={{ noCollide: true }}><planeGeometry args={[18, 4]} /></mesh>
    </group>
  )
}

export function ObservatoryMap({ secretOpen, portalOn }: { secretOpen: boolean; portalOn: boolean }) {
  return (
    <>
      <Ground />
      <Entrance />
      <Plaza />
      <Bridges />
      <TerraceBase />
      <DialBase />
      <DomeBuilding />
      <Library secretOpen={secretOpen} />
      <HiddenLab />
      <Tower />
      <GardenBase />
      <PortalSite active={portalOn} />
      <Decor />
      <Paths />
      <Pedestal position={[P.dial[0] + 4.6, P.dial[1], P.dial[2] - 2.6]} h={0.9} />
    </>
  )
}
