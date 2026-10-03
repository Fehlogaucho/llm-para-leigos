import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { Interactable, Solid, Block, useFlag } from '../../world/core'
import { Portal } from '../../world/Instruments'
import { MAT } from '../../world/materials'
import { stoneTiles, rockTex } from '../../world/textures'
import { NovaModel } from '../../engine/Nova'
import { FONT } from '../../world/fonts'
import { RT, gesture } from '../../engine/runtime'
import { SFX, playTheme } from '../../engine/audio'
import { G, IS_TOUCH, useGame } from '../../store'
import type { Ctx } from '../../engine/script'
import { QUALITY } from '../../engine/quality'

const ENGINE: [number, number, number] = [0, 0, -6]
const DOOR: [number, number, number] = [0, 0, 1.6]
const PED: [number, number, number] = [-4.2, 0, 9]
// o portal abre longe da porta, no meio da caverna (antes prendia o NEX entre a porta e o portal)
const PORTAL_POS: [number, number, number] = [3.2, 0, 8.5]

/* ---------- caverna ---------- */
function Cave() {
  const walls = useMemo(() => {
    const g = new THREE.SphereGeometry(26, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.62)
    const p = g.attributes.position, v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p as any, i)
      const a = Math.atan2(v.z, v.x)
      const w = 1 + 0.06 * Math.sin(a * 7 + v.y * 0.3) + 0.04 * Math.sin(a * 17 + v.y * 0.8) + 0.03 * Math.sin(v.y * 1.9)
      v.x *= w; v.z *= w; v.y *= 0.95
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 14, uv.getY(i) * 6)
    return g
  }, [])
  const floorMat = useMemo(() => { const t = stoneTiles('labTiles', '#6e7488', '#3b3f50', 6); const m = t.map.clone(); m.repeat.set(9, 9); m.needsUpdate = true; const n = t.normalMap.clone(); n.repeat.set(9, 9); n.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: m, normalMap: n, roughness: 0.55, metalness: 0.35 }) }, [])
  const rockMat = useMemo(() => { const t = rockTex('caveRock', '#4a4652', '#1d1b24'); return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughness: 0.95, side: THREE.BackSide }) }, [])
  const rings = [5, 8.5, 12.5, 16.5]
  return (
    <>
      <mesh geometry={walls} material={rockMat} position={[0, -2, 0]} userData={{ noCollide: true }} />
      <Solid>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMat} receiveShadow><circleGeometry args={[25, 64]} /></mesh>
      </Solid>
      {/* paredes invisíveis */}
      {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return <Block key={i} size={[7, 8, 1]} position={[Math.cos(a) * 21, 4, Math.sin(a) * 21]} rotation={[0, -a + Math.PI / 2, 0]} /> })}
      {/* linhas de circuito no chão */}
      {rings.map((r, i) => (
        <mesh key={i} position={[ENGINE[0], 0.02, ENGINE[2]]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}>
          <ringGeometry args={[r, r + 0.06, 96]} /><meshBasicMaterial color="#2aa8ff" transparent opacity={0.35 - i * 0.06} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return (
        <mesh key={i} position={[ENGINE[0] + Math.cos(a) * 11, 0.021, ENGINE[2] + Math.sin(a) * 11]} rotation={[-Math.PI / 2, 0, -a]} userData={{ noCollide: true }}>
          <planeGeometry args={[11, 0.05]} /><meshBasicMaterial color="#2aa8ff" transparent opacity={0.22} toneMapped={false} />
        </mesh>
      ) })}
      {/* rochas e cristais pelo chão */}
      {Array.from({ length: 22 }, (_, i) => { const a = i * 2.39, r = 15 + (i % 5) * 1.2; const s = 0.6 + (i % 4) * 0.5; return (
        <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
          <mesh position={[0, s * 0.4, 0]} scale={[s, s * 0.8, s]} rotation={[i, i * 2, 0]} material={MAT.rock(1)} castShadow><dodecahedronGeometry args={[1, 0]} /></mesh>
          {i % 3 === 0 && <mesh position={[0.6, s, 0.2]} rotation={[0.3, 0, 0.4]} material={i % 2 ? MAT.glowBlue() : MAT.glowViolet()}><octahedronGeometry args={[0.35, 0]} /></mesh>}
        </group>
      ) })}
      {/* feixe de luz pela fresta do teto */}
      <mesh position={[6, 12, 4]} rotation={[0.18, 0, 0.25]} userData={{ noCollide: true }}>
        <cylinderGeometry args={[0.8, 4.5, 26, 24, 1, true]} />
        <meshBasicMaterial color="#8fb8ff" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <Sparkles count={QUALITY.q === 'high' ? 160 : 70} scale={[36, 16, 36]} position={[0, 7, 0]} size={3} speed={0.15} color="#9fc8ff" opacity={0.6} />
    </>
  )
}

/* ---------- túnel de entrada com lanternas ---------- */
function Entrance() {
  return (
    <group position={[0, 0, 19]}>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 2.6, 0, 0]}>
          <mesh position={[0, 2.2, 0]} material={MAT.iron()} castShadow><boxGeometry args={[0.5, 4.4, 0.5]} /></mesh>
          <mesh position={[k * -0.35, 3.4, 0]} material={MAT.glowWarm()}><boxGeometry args={[0.2, 0.3, 0.2]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 4.6, 0]} material={MAT.iron()} castShadow><boxGeometry args={[6, 0.5, 0.6]} /></mesh>
      <pointLight position={[0, 3.2, -1]} color="#ffb35a" intensity={10} distance={14} decay={2} />
    </group>
  )
}

/* ---------- a Language Engine ---------- */
function gearGeometry(r: number, teeth = 18) {
  const s = new THREE.Shape()
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.14
    s.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); s.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr)
  }
  const h = new THREE.Path(); h.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true); s.holes.push(h)
  return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: false })
}

const PORTALS = Array.from({ length: 8 }, (_, i) => { const a = Math.PI * 0.15 + (i / 7) * Math.PI * 1.7 + Math.PI; return new THREE.Vector3(Math.cos(a) * 17, 13 + (i % 3) * 2.2, Math.sin(a) * 17 - 2) })
const PCOL = ['#59d7ff', '#ffb35a', '#a98bff', '#4fd18b', '#ff7aa8', '#ffe07a', '#7af0ff', '#c58bff']

function Engine() {
  const on = useFlag('pro_on')
  const brk = useFlag('pro_break')
  const g = useRef<THREE.Group>(null!)
  const parts = useRef<THREE.Object3D[]>([])
  const crystal = useRef<THREE.MeshStandardMaterial>(null!)
  const ringsG = useRef<THREE.Group>(null!)
  const gears = useRef<THREE.Group>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const st = useRef({ glow: 0.25, t: 0, homes: [] as { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }[] })
  const gearGeo = useMemo(() => gearGeometry(2.2), [])
  const cable = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + 0.3
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 8, 13, Math.sin(a) * 8), new THREE.Vector3(Math.cos(a) * 4.5, 15.5, Math.sin(a) * 4.5), new THREE.Vector3(0, 12.6, 0)])
    return new THREE.TubeGeometry(c, 24, 0.14, 8)
  }), [])
  const floorCables = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + 0.6
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 20, 0.15, Math.sin(a) * 20), new THREE.Vector3(Math.cos(a + 0.3) * 13, 0.2, Math.sin(a + 0.3) * 13), new THREE.Vector3(Math.cos(a) * 7.5, 0.6, Math.sin(a) * 7.5)])
    return new THREE.TubeGeometry(c, 32, 0.22, 8)
  }), [])
  useFrame((_, dt) => {
    const s = st.current
    const want = brk ? 0.0 : on ? 4.5 : 0.25
    s.glow += (want - s.glow) * Math.min(1, dt * (brk ? 3 : 1.2))
    if (crystal.current) crystal.current.emissiveIntensity = s.glow + Math.sin(RT.time * 3) * 0.1 * s.glow
    if (light.current) light.current.intensity = s.glow * 9
    const sp = on && !brk ? 1 : 0.08
    ringsG.current?.children.forEach((c, i) => { c.rotation.y += dt * sp * (0.4 + i * 0.25) * (i % 2 ? -1 : 1) })
    gears.current?.children.forEach((c, i) => { c.rotation.z += dt * sp * 0.6 * (i % 2 ? -1 : 1) })
    // desmontagem: peças voam para os portais
    if (brk) {
      if (!s.homes.length) parts.current.forEach((o) => { o.updateWorldMatrix(true, false); const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); o.matrixWorld.decompose(p, q, sc); s.homes.push({ p, q, s: sc }) })
      s.t += dt
      parts.current.forEach((o, i) => {
        const h = s.homes[i]; if (!h) return
        const k = THREE.MathUtils.clamp((s.t - i * 0.25) / 2.4, 0, 1)
        const e = k * k * (3 - 2 * k)
        const tgt = PORTALS[i % PORTALS.length]
        const wp = h.p.clone().lerp(tgt, e); wp.y += Math.sin(e * Math.PI) * 4
        if (o.parent) { o.parent.worldToLocal(wp); o.position.copy(wp) }
        o.rotation.x += dt * 2 * e; o.rotation.y += dt * 3 * e
        o.scale.setScalar(Math.max(0.001, 1 - e * 0.97))
        o.visible = e < 0.99
      })
    }
  })
  const reg = (o: THREE.Object3D | null) => { if (o && !parts.current.includes(o)) parts.current.push(o) }
  return (
    <group ref={g} position={ENGINE}>
      <Solid>
        <mesh position={[0, 0.3, 0]} material={MAT.iron()} receiveShadow castShadow><cylinderGeometry args={[7, 7.3, 0.6, 48]} /></mesh>
        <mesh position={[0, 0.9, 0]} material={MAT.iron()} receiveShadow castShadow><cylinderGeometry args={[5.5, 5.8, 0.6, 48]} /></mesh>
        <mesh position={[0, 1.5, 0]} material={MAT.dark()} receiveShadow castShadow><cylinderGeometry args={[4, 4.3, 0.6, 48]} /></mesh>
      </Solid>
      {[0.61, 1.21, 1.81].map((y, i) => <mesh key={i} position={[0, y, 0]} material={MAT.gold()}><torusGeometry args={[[7.05, 5.55, 4.05][i], 0.05, 6, 64]} /></mesh>)}
      {/* coluna de vidro com cristal */}
      <mesh position={[0, 6.4, 0]} material={MAT.glass()} userData={{ noCollide: true }}><cylinderGeometry args={[1.4, 1.4, 9, 32, 1, true]} /></mesh>
      <Solid invisible><mesh position={[0, 6, 0]}><cylinderGeometry args={[1.5, 1.5, 9, 16]} /></mesh></Solid>
      <mesh ref={reg} position={[0, 6.4, 0]} scale={[0.7, 3, 0.7]}><octahedronGeometry args={[1, 0]} /><meshStandardMaterial ref={crystal} color="#bff3ff" emissive="#3fc4ff" emissiveIntensity={0.25} roughness={0.2} /></mesh>
      <pointLight ref={light} position={[0, 6, 0]} color="#59d7ff" intensity={2} distance={30} decay={1.6} />
      <mesh position={[0, 11.4, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[1.0, 1.8, 1.0, 24]} /></mesh>
      <mesh position={[0, 12.4, 0]} material={MAT.gold()} castShadow><coneGeometry args={[0.9, 1.4, 24]} /></mesh>
      <mesh position={[0, 1.9, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[1.8, 1.6, 0.8, 24]} /></mesh>
      {/* anéis */}
      <group ref={ringsG}>
        {[[3.6, 2.9, 0.3], [6.4, 3.4, -0.4], [9.4, 2.5, 0.6]].map(([y, r, t], i) => (
          <group key={i} position={[0, y, 0]} rotation={[t, 0, t * 0.5]}>
            <mesh ref={reg} material={i === 1 ? MAT.gold() : MAT.bronze()} castShadow><torusGeometry args={[r, 0.12, 10, 64]} /></mesh>
          </group>
        ))}
      </group>
      {/* engrenagens */}
      <group ref={gears}>
        {[-1, 1].map((k) => <group key={k} position={[k * 4.6, 4.2, -1.2]} rotation={[0, k * 0.5, 0]}><mesh ref={reg} geometry={gearGeo} material={MAT.bronze()} castShadow /></group>)}
        <group position={[3.2, 7.6, -2.5]} rotation={[0, 0.7, 0]}><mesh ref={reg} geometry={gearGeo} scale={0.6} material={MAT.copper()} castShadow /></group>
        <group position={[-3.4, 8.4, -2.2]} rotation={[0, -0.6, 0]}><mesh ref={reg} geometry={gearGeo} scale={0.5} material={MAT.copper()} castShadow /></group>
      </group>
      {/* pilares e cabos */}
      {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + 0.3; return (
        <group key={i} position={[Math.cos(a) * 8, 0, Math.sin(a) * 8]}>
          <Solid><mesh position={[0, 6.5, 0]} material={MAT.iron()} castShadow><boxGeometry args={[0.9, 13, 0.9]} /></mesh></Solid>
          <mesh position={[0, 6.5, 0]} rotation={[0, -a, 0]} material={MAT.glowBlue()}><boxGeometry args={[0.95, 11, 0.12]} /></mesh>
        </group>
      ) })}
      {cable.map((c, i) => <mesh key={i} geometry={c} material={MAT.dark()} userData={{ noCollide: true }} />)}
      {floorCables.map((c, i) => <mesh key={i} geometry={c} material={MAT.iron()} position={[-ENGINE[0], 0, -ENGINE[2]]} userData={{ noCollide: true }} />)}
      {/* cristais de energia em volta */}
      {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <mesh ref={reg} key={i} position={[Math.cos(a) * 3.4, 2.4, Math.sin(a) * 3.4]} rotation={[0.3, a, 0.2]} material={i % 2 ? MAT.glowViolet() : MAT.glowBlue()}><octahedronGeometry args={[0.32, 0]} /></mesh> })}
    </group>
  )
}

/* ---------- porta / painel ---------- */
function Door({ onUse }: { onUse: () => void }) {
  const open = useFlag('pro_door')
  const active = useGame((s) => s.objective?.text?.startsWith('Toque'))
  const glyphs = useRef<THREE.MeshStandardMaterial>(null!)
  useFrame(() => { if (glyphs.current) glyphs.current.emissiveIntensity = open ? 4 : 1.2 + Math.sin(RT.time * 2) * 0.6 })
  return (
    <group position={DOOR}>
      <Solid>
        <mesh position={[0, 1.7, 0]} material={MAT.iron()} castShadow><boxGeometry args={[3, 3.4, 0.5]} /></mesh>
      </Solid>
      <mesh position={[0, 1.7, 0.26]}><planeGeometry args={[2.3, 2.7]} /><meshStandardMaterial color="#0a1630" emissive="#0a2a5a" emissiveIntensity={0.6} /></mesh>
      {[0.8, 1.3, 1.8, 2.3].map((y, i) => <mesh key={i} position={[0, y, 0.27]}><planeGeometry args={[1.8 - i * 0.3, 0.06]} /><meshStandardMaterial ref={i === 0 ? glyphs : undefined} color="#7fe3ff" emissive="#3fc4ff" emissiveIntensity={1.5} /></mesh>)}
      <mesh position={[0, 1.7, 0.28]}><ringGeometry args={[0.32, 0.4, 32]} /><meshStandardMaterial color="#7fe3ff" emissive="#3fc4ff" emissiveIntensity={2} /></mesh>
      <Interactable id="pro_door" label="Tocar na porta" position={[0, 0, 0.9]} radius={2.6} enabled={!open && !!active} onUse={onUse} markerY={3.8} color="#7fe3ff" />
    </group>
  )
}

/* ---------- frases que aparecem no ar ---------- */
const PHRASES = ['“Olá.”', '“Quem é você?”', '“Conte uma história.”', '“Explique…”', '“Por quê?”', '“Qual é a capital do Brasil?”', '“Me ajude com…”', '“O que é isso?”', '“Traduza…”', '“Resuma…”']
function Phrases() {
  const f = useFlag('pro_phrases')
  const g = useRef<THREE.Group>(null!)
  const st = useRef({ k: 0 })
  const items = useMemo(() => Array.from({ length: 36 }, (_, i) => ({ t: PHRASES[i % PHRASES.length], a: i * 0.7, r: 3.5 + (i % 5) * 1.3, y: 2 + (i % 7) * 1.25, sp: 0.15 + (i % 4) * 0.06, s: 0.35 + (i % 3) * 0.12 })), [])
  useFrame((_, dt) => {
    const want = f === 1 ? 1 : 0
    st.current.k += (want - st.current.k) * Math.min(1, dt * (f === 1 ? 1.2 : 3))
    const k = st.current.k
    if (!g.current) return
    g.current.visible = k > 0.01
    g.current.children.forEach((c, i) => {
      const it = items[i]; const a = it.a + RT.time * it.sp
      c.position.set(ENGINE[0] + Math.cos(a) * it.r * (0.6 + k * 0.4), it.y + Math.sin(RT.time + i) * 0.2, ENGINE[2] + Math.sin(a) * it.r * (0.6 + k * 0.4))
      c.lookAt(RT.camera ? RT.camera.position : new THREE.Vector3())
      c.scale.setScalar(Math.max(0.001, k * it.s))
    })
  })
  return (
    <group ref={g} visible={false}>
      {items.map((it, i) => <Text key={i} font={FONT.body} fontSize={1} color={i % 3 ? '#bff3ff' : '#ffe2a3'} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#0a2040" userData={{ noCollide: true }}>{it.t}<meshBasicMaterial attach="material" toneMapped={false} color={i % 3 ? '#bff3ff' : '#ffe2a3'} /></Text>)}
    </group>
  )
}

/* ---------- portais altos (para onde as peças vão) ---------- */
function SkyPortals() {
  const brk = useFlag('pro_break')
  const g = useRef<THREE.Group>(null!)
  const k = useRef(0)
  const mats = useMemo(() => PCOL.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })), [])
  useFrame((_, dt) => {
    const want = brk === 1 ? 1 : 0
    k.current += (want - k.current) * Math.min(1, dt * 1.5)
    g.current.children.forEach((c, i) => { c.lookAt(0, 6, 0); c.rotateZ(RT.time * (i % 2 ? 1 : -1)); c.scale.setScalar(0.001 + k.current * (1 + Math.sin(RT.time * 3 + i) * 0.08)); mats[i].opacity = k.current * 0.85 })
  })
  return (
    <group ref={g}>
      {PORTALS.map((p, i) => <mesh key={i} position={p} material={mats[i]} userData={{ noCollide: true }}><ringGeometry args={[0.6, 1.8, 6, 1]} /></mesh>)}
    </group>
  )
}

/* ---------- NOVA adormecida no pedestal ---------- */
function DormantNova() {
  const nova = useFlag('nova')
  const rig = useRef<any>(null)
  useFrame(() => { const r = rig.current; if (r?.eyeL) { r.eyeL.scale.y = 0.12; r.eyeR.scale.y = 0.12 } })
  return (
    <group position={PED}>
      <Solid>
        <mesh position={[0, 0.5, 0]} material={MAT.iron()} castShadow><cylinderGeometry args={[0.55, 0.7, 1, 16]} /></mesh>
      </Solid>
      <mesh position={[0, 1.01, 0]} material={MAT.glowBlue()}><torusGeometry args={[0.45, 0.03, 8, 32]} /></mesh>
      {!nova && <group position={[0, 1.25, 0]} rotation={[0.3, 0.6, 0.2]}><NovaModel rig={rig} /></group>}
    </group>
  )
}

function FinalPortal({ onUse }: { onUse: () => void }) {
  const on = useFlag('pro_portal')
  if (!on) return null
  return (
    <group>
      <Portal position={PORTAL_POS} active s={0.9} />
      <Interactable id="pro_portal" label="Entrar no portal" position={[PORTAL_POS[0], 0, PORTAL_POS[2] + 1.6]} radius={2.8} onUse={onUse} markerY={5.4} color="#7fe3ff" />
    </group>
  )
}

/* ---------- roteiro ---------- */
async function main(c: Ctx) {
  if (c.flag('pro_portal')) { c.objective('Entre no portal', [PORTAL_POS[0], 0, PORTAL_POS[2] + 1.6]); return }
  const move = IS_TOUCH ? 'Arraste o círculo dourado para andar (ou toque no chão). Arraste a tela para olhar em volta.' : 'Use WASD ou as setas para andar e arraste o mouse para olhar em volta. Também dá para clicar no chão.'
  await c.cinematic([
    { pos: [11, 11, 9], look: [0, 6, -6], dur: 0.01, cut: true },
    { pos: [8, 7, 12], look: [0, 6, -6], dur: 4.5 },
    { pos: [-5, 3.5, 17], look: [0, 4, -4], dur: 3.5 },
  ])
  await c.say([
    { who: 'NEX', text: 'Ai… minha cabeça. Eu estava no meu quarto, perguntei uma coisa para a IA… e levei um choque.' },
    { who: 'NEX', text: 'Que lugar é esse? Parece o lado de dentro de uma máquina.' },
    { who: 'NEX', text: 'E aquela máquina gigante no meio… ainda tem uma luzinha acesa.' },
  ], { ambient: true })
  await c.say({ who: 'SISTEMA', text: move }, { ambient: true })
  c.objective('Toque na porta da máquina', [DOOR[0], 0, DOOR[2] + 1])
  await c.waitFlag('pro_door')
  // ---- evento ----
  c.objective(null)
  c.freeze(true)
  RT.lookAt = new THREE.Vector3(...ENGINE)
  gesture('reach', 1.5)
  SFX.play('open')
  c.setFlag('pro_phrases', 1)
  await c.cinematic([
    { pos: [5, 3, 8], look: [0, 5, -6], dur: 0.01, cut: true },
    { pos: [-5, 4, 7], look: [0, 6, -6], dur: 5 },
  ], false)
  c.setFlag('pro_phrases', 2)
  SFX.play('whoosh')
  await c.wait(0.8)
  c.setFlag('pro_on', 1)
  playTheme('tensao')
  await c.cinematic([{ pos: [0, 4.5, 6], look: [0, 7, -6], dur: 0.01, cut: true }, { pos: [0, 5, 3.5], look: [0, 7.5, -6], dur: 6 }], false)
  await c.say([
    { who: 'ENGINE', text: 'Eu consigo responder.' },
    { who: 'ENGINE', text: '…' },
    { who: 'ENGINE', text: 'Mas não consigo lembrar por quê.' },
  ])
  c.setFlag('pro_break', 1)
  SFX.play('portal')
  await c.cinematic([{ pos: [0, 3, 12], look: [0, 9, -6], dur: 0.01, cut: true }, { pos: [0, 2.5, 15], look: [0, 11, -6], dur: 5.5 }], false)
  c.setFlag('pro_break', 2)
  SFX.play('stone')
  playTheme('lab')
  await c.wait(0.6)
  // NOVA acorda
  RT.nova.set(PED[0], 1.25, PED[2])
  c.setFlag('nova', 1)
  RT.lookAt = new THREE.Vector3(PED[0], 1.2, PED[2])
  SFX.play('chime')
  await c.cinematic([{ pos: [PED[0] + 2.5, 2, PED[2] + 3], look: [PED[0], 1.4, PED[2]], dur: 0.01, cut: true }, { pos: [PED[0] + 3.5, 2.2, PED[2] + 4.5], look: [PED[0] + 1, 1.6, PED[2]], dur: 3 }], false)
  RT.lookAt = null
  await c.say([
    { who: 'NOVA', text: 'Sistema… ligado. Olá! Eu sou a NOVA, a guia desta máquina.' },
    { who: 'NEX', text: 'Eu estava conversando com uma IA no meu computador. Teve um raio, um choque… e a tela me puxou!' },
    { who: 'NOVA', text: 'Eu sei. Você está dentro dela: esta é a Language Engine, a LLM com quem você conversava.' },
    { who: 'NOVA', text: 'O choque que te trouxe para cá também embaralhou a memória dela. Ela ainda consegue responder, mas esqueceu como funciona.' },
    { who: 'NOVA', text: 'As peças que explicam como ela pensa, os Núcleos de Conhecimento, se espalharam por mundos diferentes.' },
    { who: 'NEX', text: 'E como eu volto para casa?' },
    { who: 'NOVA', text: 'Ajudando a máquina a se lembrar. Cada mundo guarda uma ideia: primeiro as origens, como números, regras e máquinas; depois, o que faz uma LLM escrever.' },
    { who: 'NOVA', text: 'Quando os núcleos voltarem, ela vai funcionar direito de novo. E vai poder te devolver ao seu quarto.' },
    {
      who: 'NOVA', text: 'Quer saber mais antes de ir?', choices: [
        { label: 'O que são esses mundos?', next: [{ who: 'NOVA', text: 'Cada mundo guarda uma ideia que tornou possível uma máquina de linguagem. Os primeiros são bem antigos: começam com pessoas olhando para o céu.' }] },
        { label: 'Por que você me ajuda?', next: [{ who: 'NOVA', text: 'Porque perguntas são o combustível desta máquina. E você parece ter muitas.' }] },
        { label: 'Vamos logo!', next: [{ who: 'NOVA', text: 'Gosto da energia!' }] },
      ],
    },
  ])
  c.discover('engine')
  // coloca o NEX de frente para o portal, num lugar livre
  RT.player.set(PORTAL_POS[0], 0.1, PORTAL_POS[2] + 5.5); RT.lastSafe.copy(RT.player); RT.playerVel.set(0, 0, 0)
  RT.playerYaw = Math.PI; RT.camYaw = 0
  c.setFlag('pro_portal', 1)
  SFX.play('portal')
  c.freeze(false)
  await c.say({ who: 'NOVA', text: 'Um portal se abriu bem na sua frente. Vamos!' }, { ambient: true })
  c.objective('Entre no portal', [PORTAL_POS[0], 0, PORTAL_POS[2] + 1.6])
}

export default function Prologo() {
  useLevel({ spawn: [0, 0, 16], yaw: Math.PI, scripts: [main] })
  const onDoor = () => { G().setFlag('pro_door') }
  const onPortal = () => { G().setFlag('pro_done'); useGame.setState({ objective: null }); import('../../engine/script').then((m) => m.gotoLevel('p1a1')) }
  return (
    <>
      <color attach="background" args={['#04060c']} />
      <fog attach="fog" args={['#060a18', 12, 70]} />
      <hemisphereLight args={['#3a4f8a', '#0a0c16', 1.1]} />
      <ambientLight intensity={0.3} color="#5a6aa0" />
      <directionalLight position={[8, 20, 6]} intensity={0.9} color="#8fb0ff" />
      <pointLight position={[-12, 5, 4]} color="#4a7dff" intensity={14} distance={22} decay={1.6} />
      <pointLight position={[12, 5, -2]} color="#8a5cff" intensity={12} distance={22} decay={1.6} />
      <Cave />
      <Entrance />
      <Engine />
      <Door onUse={onDoor} />
      <Phrases />
      <SkyPortals />
      <DormantNova />
      <FinalPortal onUse={onPortal} />
    </>
  )
}
