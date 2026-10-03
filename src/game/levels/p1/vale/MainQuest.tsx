import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text } from '@react-three/drei'
import { Interactable, Solid, useFlag } from '../../../world/core'
import { MAT } from '../../../world/materials'
import { Pedestal } from '../../../world/Architecture'
import { Portal } from '../../../world/Instruments'
import { useOverlay, Panel } from '../../../world/puzzle'
import { FONT } from '../../../world/fonts'
import { RT, gesture } from '../../../engine/runtime'
import { SFX } from '../../../engine/audio'
import { start } from '../../../engine/script'
import { G, useGame, type Vec3 } from '../../../store'
import { P, terrainH, rng, type V3 } from './terrain'
import { GOLD } from './Field'
import { VM, Totem, Sack, Crate, Chest, BinDigit, Instances, crystalGeo, stoneGeo, type Inst } from './props'
import { Counter, GemIcon } from './ui'

/* =========================================================
   Missão principal do Vale:
   1) 12 cristais no altar (quantidade → símbolo)
   2) mil pedras: a Máquina de Agrupar (10 → 100 → 1000)
   3) a porta da Câmara Binária (só 0 e 1)
   ========================================================= */

export const popcount = (m: number) => { let c = 0; while (m) { c += m & 1; m >>>= 1 } return c }
export const crystalCount = () => popcount(G().flags.a2_cmask || 0)
const NOTES = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21]
const portrait = () => innerWidth < innerHeight

/* =================== 1a. cristais dourados =================== */
export function nearestCrystal(): Vec3 | undefined {
  const m = G().flags.a2_cmask || 0
  let best: Vec3 | undefined, bd = 1e9
  GOLD.forEach(([x, z], i) => { if ((m >> i) & 1) return; const d = Math.hypot(x - RT.player.x, z - RT.player.z); if (d < bd) { bd = d; best = [x, terrainH(x, z), z] } })
  return best
}

export function GoldCrystals() {
  const ask = useFlag('a2_ask'), done = useFlag('a2_count'), mask = useFlag('a2_cmask')
  const focus = useGame((s) => s.focus)
  const n = popcount(mask)
  const active = !!ask && !done
  const refs = useRef<(THREE.Group | null)[]>([])
  const beams = useRef<(THREE.Mesh | null)[]>([])
  const fly = useRef(new Map<number, number>())
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const beamMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }), [])
  useFrame(() => {
    let m = G().flags.a2_cmask || 0
    const isDone = !!G().flags.a2_count, isAct = !!G().flags.a2_ask && !isDone
    beamMat.opacity = 0.16 + Math.sin(RT.time * 2.5) * 0.05
    GOLD.forEach(([x, z], i) => {
      const g = refs.current[i]
      if (!g) return
      const y0 = terrainH(x, z)
      const got = (m >> i) & 1
      const b = beams.current[i]
      if (b) b.visible = isAct && !got
      if (!got) {
        g.visible = !isDone
        g.position.set(x, y0 + 0.3 + Math.sin(RT.time * 2 + i) * 0.07, z)
        g.rotation.y = RT.time * 0.9 + i
        g.scale.setScalar(1)
        const cnt = popcount(m)
        if (isAct && cnt < 12 && !G().focus && Math.hypot(RT.player.x - x, RT.player.z - z) < 1.45 && Math.abs(RT.player.y - y0) < 2) {
          m |= 1 << i
          G().setFlag('a2_cmask', m)
          fly.current.set(i, RT.time)
          SFX.note(76 + NOTES[cnt], 0.5, 0.08)
          if (cnt + 1 === 12) setTimeout(() => SFX.play('success'), 250)
        }
      } else {
        const t0 = fly.current.get(i)
        if (t0 == null) { g.visible = false; return }
        const k = Math.min(1, (RT.time - t0) / 0.55)
        if (k >= 1) { g.visible = false; fly.current.delete(i); return }
        g.visible = true
        tmp.set(RT.player.x, RT.player.y + 1.0, RT.player.z)
        g.position.set(x + (tmp.x - x) * k * k, y0 + 0.3 + (tmp.y - y0 - 0.3) * k + Math.sin(k * Math.PI) * 1.2, z + (tmp.z - z) * k * k)
        g.scale.setScalar(1 - k * 0.85)
      }
    })
  })
  useOverlay('a2_cr', active && !focus ? <Counter icon={<GemIcon />} value={`${Math.min(n, 12)} / 12`} label={n >= 12 ? 'Leve ao altar da praça' : 'cristais dourados'} /> : null, [active, n, focus])
  return (
    <group>
      {GOLD.map(([x, z], i) => (
        <group key={i}>
          <group ref={(g) => { refs.current[i] = g }} position={[x, terrainH(x, z) + 0.3, z]}>
            <mesh geometry={crystalGeo()} scale={[0.2, 0.62, 0.2]} material={VM.crystalGold()} castShadow userData={{ noCollide: true }} />
            <mesh geometry={crystalGeo()} position={[0.16, -0.05, 0.05]} rotation={[0, 0, -0.4]} scale={[0.1, 0.3, 0.1]} material={VM.crystalGold()} userData={{ noCollide: true }} />
          </group>
          <mesh ref={(b) => { beams.current[i] = b }} position={[x, terrainH(x, z) + 4, z]} material={beamMat} visible={false} userData={{ noCollide: true }}><cylinderGeometry args={[0.12, 0.25, 8, 8, 1, true]} /></mesh>
        </group>
      ))}
      {active && <Sparkles count={60} scale={[60, 2, 50]} position={[0, 1, 22]} size={4} speed={0.3} color="#ffd98a" />}
    </group>
  )
}

/* =================== 1b. altar da contagem + totens da praça =================== */
const ALTAR_TOP = 1.32
export const ALTAR_USE: Vec3 = [P.altar[0], P.altar[1], P.altar[2] + 2.3]
function slot(i: number): V3 { const a = (i / 12) * Math.PI * 2; return [P.altar[0] + Math.cos(a) * 0.62, P.altar[1] + ALTAR_TOP + 0.05, P.altar[2] + Math.sin(a) * 0.62] }

function AltarModel({ lit }: { lit: boolean }) {
  const bowl = useMemo(() => new THREE.LatheGeometry([[0.3, 0], [0.9, 0.05], [1.1, 0.24], [1.15, 0.32], [1.02, 0.33], [0.82, 0.17], [0, 0.13]].map(([x, y]) => new THREE.Vector2(x, y)), 32), [])
  const [x, y, z] = P.altar
  return (
    <group position={[x, y, z]}>
      <Solid>
        <mesh position={[0, 0.15, 0]} material={MAT.stoneDark()} castShadow receiveShadow><cylinderGeometry args={[1.3, 1.5, 0.3, 32]} /></mesh>
        <mesh position={[0, 0.7, 0]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[0.75, 0.88, 0.8, 24]} /></mesh>
        <mesh geometry={bowl} position={[0, 1.08, 0]} material={MAT.marble()} castShadow receiveShadow />
      </Solid>
      <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()}><torusGeometry args={[1.08, 0.05, 8, 48]} /></mesh>
      <mesh position={[0, 1.215, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lit ? VM.crystalGold() : VM.obsidian()}><circleGeometry args={[0.82, 32]} /></mesh>
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 1.22, 0.32, Math.sin(a) * 1.22]} material={lit ? VM.crystalGold() : MAT.gold()}><sphereGeometry args={[0.06, 8, 6]} /></mesh> })}
      {lit && <Sparkles count={20} scale={[2, 1.5, 2]} position={[0, 1.9, 0]} size={5} speed={0.5} color="#ffd98a" />}
    </group>
  )
}

type AltarPhase = 'idle' | 'fly' | 'merge' | 'glyph' | 'done'
export function Altar() {
  const ask = useFlag('a2_ask'), done = useFlag('a2_count'), mask = useFlag('a2_cmask')
  const n = popcount(mask)
  const ph = useRef<{ p: AltarPhase; t0: number }>({ p: 'idle', t0: 0 })
  const [shown, setShown] = useState(0)
  const [phase, setPhaseS] = useState<AltarPhase>('idle')
  const setPhase = (p: AltarPhase) => { ph.current = { p, t0: performance.now() / 1000 }; setPhaseS(p) }
  const cr = useRef<(THREE.Mesh | null)[]>([])
  const glyph = useRef<THREE.Group>(null!)
  const from = useRef(new THREE.Vector3())
  const arrived = useRef(0)
  const tA = useMemo(() => new THREE.Vector3(), [])
  const totemFace = useMemo(() => new THREE.Vector3(P.totem1[0], P.totem1[1] + 0.4 + 5 * 0.56, P.totem1[2] + 0.75), [])
  useFrame(() => {
    const { p, t0 } = ph.current
    const el = performance.now() / 1000 - t0
    if (p === 'fly') {
      cr.current.forEach((m, i) => {
        if (!m) return
        const ti = el - i * 0.42
        if (ti < 0) { m.visible = false; return }
        const k = Math.min(1, ti / 0.7)
        const s = slot(i)
        tA.set(...s)
        m.visible = true
        m.position.lerpVectors(from.current, tA, k)
        m.position.y += Math.sin(k * Math.PI) * 1.1
        m.rotation.y = RT.time * 2 + i
        m.scale.set(0.16, 0.5, 0.16)
        if (k >= 1 && arrived.current <= i) { arrived.current = i + 1; setShown(i + 1); SFX.note(72 + NOTES[i], 0.6, 0.09) }
      })
    } else if (p === 'merge') {
      const k = Math.min(1, el / 1.5)
      cr.current.forEach((m, i) => {
        if (!m) return
        const a = (i / 12) * Math.PI * 2 + el * (3 + k * 8)
        const r = 0.62 * (1 - k)
        m.visible = k < 0.98
        m.position.set(P.altar[0] + Math.cos(a) * r, P.altar[1] + ALTAR_TOP + 0.05 + k * 0.9, P.altar[2] + Math.sin(a) * r)
        m.scale.set(0.16 * (1 - k * 0.8), 0.5 * (1 - k * 0.8), 0.16 * (1 - k * 0.8))
      })
    } else if (p === 'glyph' || p === 'idle' || p === 'done') {
      cr.current.forEach((m) => { if (m) m.visible = false })
    }
    const g = glyph.current
    if (g) {
      if (p === 'glyph') {
        const k1 = Math.min(1, el / 0.7), k2 = THREE.MathUtils.clamp((el - 1.1) / 1.5, 0, 1)
        const e2 = k2 * k2 * (3 - 2 * k2)
        g.visible = k2 < 0.99
        tA.set(P.altar[0], P.altar[1] + ALTAR_TOP + 1.0, P.altar[2])
        g.position.lerpVectors(tA, totemFace, e2)
        g.scale.setScalar(Math.max(0.001, k1 * (1.4 - e2 * 0.5)))
        if (RT.camera) g.quaternion.copy(RT.camera.quaternion)
      } else g.visible = false
    }
  })
  const run = () => start('altar', async (c) => {
    if (c.flag('a2_count')) { await c.say({ who: 'NOVA', text: 'Doze cristais viraram um símbolo só: 12. Agora ele mora no totem.' }, { ambient: true }); return }
    const [x, y, z] = P.altar
    if (!c.flag('a2_ask')) {
      c.focus([x + 2.4, y + 2.6, z + 5.4], [x, y + 1.9, z - 1.8], 50)
      await c.say([
        { who: 'NEX', text: 'O altar tem uma bacia vazia. E o totem atrás dele está apagado.' },
        { who: 'NOVA', text: 'Os totens do vale perderam seus números. Esse aqui pede uma quantidade para lembrar o dele.' },
        { who: 'NOVA', text: 'Preciso de 12 cristais. Dos dourados, que brilham pelo campo.' },
        { who: 'NEX', text: 'Doze. Tá, vou contando no caminho.' },
      ])
      c.unfocus()
      c.quest('q_quant', 'active', 'A Quantidade')
      c.setFlag('a2_ask')
      return
    }
    const have = crystalCount()
    if (have < 12) { await c.say({ who: 'NOVA', text: `Você tem ${have}. Faltam ${12 - have} cristais dourados. Procure os feixes de luz no campo.` }, { ambient: true }); return }
    // colocar os 12 cristais
    c.objective(null)
    RT.lookAt = new THREE.Vector3(x, y, z)
    gesture('reach', 2.5)
    from.current.set(RT.player.x, RT.player.y + 1.1, RT.player.z)
    c.focus(portrait() ? [x + 3.2, y + 3.6, z + 8] : [x + 2.8, y + 2.9, z + 4.9], [x, y + 1.6, z - 0.8], 46)
    arrived.current = 0; setShown(0)
    setPhase('fly')
    await c.wait(12 * 0.42 + 1.0)
    SFX.play('whoosh')
    setPhase('merge')
    await c.wait(1.6)
    SFX.play('chime')
    setPhase('glyph')
    await c.wait(2.7)
    c.setFlag('a2_count')
    SFX.play('core')
    setPhase('done')
    RT.lookAt = null
    c.unfocus()
    await c.cinematic([
      { pos: [x + 1.5, y + 4.2, z + 3], look: [x, y + 3.2, P.totem1[2]], dur: 0.01, cut: true },
      { pos: [x + 2, y + 5.5, z + 6], look: [x, y + 3, P.totem1[2]], dur: 1.8 },
      { pos: [x - 16, y + 16, z + 10], look: [0, 1, 14], dur: 3.6 },
      { pos: [x + 16, y + 12, z - 6], look: [0, 1, 4], dur: 3.2 },
    ], false)
    await c.say([
      { who: 'NEX', text: 'Doze! Um montão de cristais virou só dois risquinhos: 1 e 2.' },
      { who: 'NOVA', text: 'E repare no vale: cada grupo de coisas ganhou o seu número.' },
      {
        who: 'NOVA', text: 'Isso é representar uma quantidade. O símbolo “12” ocupa pouco espaço e vale para 12 cristais, 12 pedras, 12 frutas…', choices: [
          { label: 'Por que isso importa?', next: [{ who: 'NOVA', text: 'Máquinas não guardam cristais. Guardam símbolos. Tudo que uma máquina sabe começa assim.' }] },
          { label: 'Entendi!', next: [] },
        ],
      },
    ])
    c.discover('quantidade')
    c.quest('q_quant', 'done', 'A Quantidade')
  })
  const placing = phase === 'fly' || phase === 'merge'
  return (
    <group>
      <AltarModel lit={!!done} />
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} ref={(m) => { cr.current[i] = m }} geometry={crystalGeo()} material={VM.crystalGold()} visible={false} userData={{ noCollide: true }} />)}
      <group ref={glyph} visible={false}>
        <Text font={FONT.title} fontSize={0.9} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#5a3a08">12<meshBasicMaterial attach="material" color="#fff1c4" toneMapped={false} /></Text>
      </group>
      {placing && shown > 0 && (
        <group position={[P.altar[0], P.altar[1] + ALTAR_TOP + 1.25, P.altar[2]]}>
          <Text font={FONT.mono} fontSize={0.5} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#1b1206" rotation={[0, 0.5, 0]}>{String(shown)}<meshBasicMaterial attach="material" color="#ffe2a3" toneMapped={false} /></Text>
        </group>
      )}
      <Interactable id="altar" label={done ? 'Ver o altar' : !ask ? 'Examinar o altar' : n >= 12 ? 'Colocar os 12 cristais' : 'Altar da Contagem'} position={ALTAR_USE} radius={2.4} onUse={run} markerY={2.3} color={!done && (!ask || n >= 12) ? '#ffd27a' : '#9fe9ff'} />
    </group>
  )
}

const SMALL_TOTEMS = [-0.8, -0.27, 0.27, 0.8, Math.PI - 0.8, Math.PI - 0.27, Math.PI + 0.27, Math.PI + 0.8]
export function PlazaTotems() {
  const lit = !!useFlag('a2_count')
  return (
    <group>
      <Totem position={P.totem1} h={5} w={1.3} value="12" lit={lit} idle="?" dots={0} />
      {SMALL_TOTEMS.map((a, i) => {
        const x = P.plaza[0] + Math.cos(a) * 9.6, z = P.plaza[2] + Math.sin(a) * 9.6
        return <Totem key={i} position={[x, P.plaza[1], z]} rotY={Math.atan2(P.plaza[0] - x, P.plaza[2] - z)} h={2.6} w={0.8} dots={i + 1} value={String(i + 1)} lit={lit} size={0.4} color={i % 2 ? '#9fe9ff' : '#ffd27a'} />
      })}
    </group>
  )
}

/* =================== 2a. a pedreira (mil pedras) =================== */
export const QUARRY_USE: Vec3 = [P.quarry[0], P.quarry[1], P.quarry[2] + 2.9]
export function Quarry() {
  const ready = useFlag('a2_count'), tried = useFlag('a2_try')
  const [taken, setTaken] = useState(0)
  const items = useMemo(() => {
    const r = rng(1000), out: Inst[] = []
    const cols = ['#c8c2b8', '#aaa398', '#d8d0c0', '#9c968c', '#b8ae9c']
    for (let i = 0; i < 1000; i++) {
      const rr = 2.3 * Math.sqrt(r()), a = r() * Math.PI * 2
      const maxY = 1.35 * (1 - rr / 2.45)
      const s = 0.1 + r() * 0.07
      out.push({ p: [P.quarry[0] + Math.cos(a) * rr, P.quarry[1] + maxY * (0.55 + r() * 0.45) + s * 0.4, P.quarry[2] + Math.sin(a) * rr], s: [s, s * 0.8, s], r: [r() * 3, r() * 3, 0], c: cols[Math.floor(r() * cols.length)] })
    }
    return out
  }, [])
  const use = () => {
    if (G().flags.a2_try) return
    const t = taken + 1
    setTaken(t)
    gesture('reach', 0.9)
    SFX.play('stone')
    start('quarry-q', async (c) => { c.quest('q_mil', 'active', 'Mil é Diferente de Dez') })
    if (t >= 3) start('quarry', async (c) => {
      await c.wait(0.5)
      await c.say([
        { who: 'NEX', text: 'Uma… duas… três. Faltam 997! Vou ficar aqui até o ano que vem.' },
        { who: 'NOVA', text: 'E com as costas doendo. Mil pedras soltas ninguém carrega.' },
        { who: 'NOVA', text: 'Mas alguém já resolveu isso. Olha aquela máquina velha no fundo das ruínas.' },
      ])
      c.setFlag('a2_try')
    })
  }
  useOverlay('a2_st', taken > 0 && !tried ? <Counter icon={<span style={{ width: 18, height: 14, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #e8e2d6, #8a847a)', display: 'inline-block' }} />} value={`${taken} / 1000`} label="pedras carregadas" accent="#d8d0c0" /> : null, [taken, tried])
  return (
    <group>
      <Instances geometry={stoneGeo()} material={VM.stone()} items={items} />
      <Solid invisible><mesh position={[P.quarry[0], P.quarry[1] + 0.6, P.quarry[2]]}><cylinderGeometry args={[2.1, 2.3, 1.2, 12]} /></mesh></Solid>
      <Text font={FONT.title} fontSize={0.34} position={[P.quarry[0], P.quarry[1] + 2.1, P.quarry[2]]} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#2a1a08" rotation={[0, 0.3, 0]}>1000 PEDRAS<meshBasicMaterial attach="material" color="#f3e7cc" toneMapped={false} /></Text>
      <Interactable id="pedreira" label={`Pegar pedras (${taken} de 1000)`} position={QUARRY_USE} radius={2.4} enabled={!!ready && !tried} onUse={use} markerY={2.0} />
    </group>
  )
}

/* =================== 2b. a Máquina de Agrupar =================== */
const MX = -10.4
const zStone = (i: number): V3 => [MX + (i % 2 ? -0.24 : 0.24), 1.17, -28.75 - Math.floor(i / 2) * 0.27]
const zSack = (i: number): V3 => [MX + (i % 2 ? -0.28 : 0.28), 1.05, -30.45 - Math.floor(i / 2) * 0.4]
const zCrate = (i: number): V3 => [MX + (i % 2 ? -0.28 : 0.28), 1.05, -32.55 - Math.floor(i / 2) * 0.37]
const CHEST_POS: V3 = [MX, 1.05, -35.0]
export const MACHINE_USE: Vec3 = [-7.3, 0.15, -31.6]
export const CHEST_USE: Vec3 = [-8.2, 0.15, -35.0]

type MPhase = 'stones' | 'sacks' | 'crates' | 'done'
export function GroupMachine() {
  const tried = useFlag('a2_try'), grouped = useFlag('a2_group'), carry = useFlag('a2_carry'), delivered = useFlag('a2_chest')
  const [open, setOpen] = useState(false)
  const [st, setSt] = useState({ tray: 0, sacks: 0, crates: 0, chest: grouped ? 1 : 0 })
  const phase: MPhase = st.chest ? 'done' : st.crates ? 'crates' : st.sacks ? 'sacks' : 'stones'
  const total = st.chest * 1000 + st.crates * 100 + st.sacks * 10 + st.tray
  const stoneR = useRef<(THREE.Object3D | null)[]>([]), sackR = useRef<(THREE.Object3D | null)[]>([]), crateR = useRef<(THREE.Object3D | null)[]>([])
  const chestR = useRef<THREE.Group>(null!)
  const stR = useRef(st); stR.current = st
  const openR = useRef(open); openR.current = open
  useFrame((_, dt) => {
    const s = stR.current, k = Math.min(1, dt * 10)
    const upd = (arr: (THREE.Object3D | null)[], n: number) => arr.forEach((o, i) => { if (!o) return; const w = i < n ? 1 : 0.001; const c = o.scale.x + (w - o.scale.x) * k; o.scale.setScalar(c); o.visible = c > 0.01 })
    upd(stoneR.current, s.tray); upd(sackR.current, s.sacks); upd(crateR.current, s.crates)
    const showChest = (s.chest || (G().flags.a2_group && !G().flags.a2_carry)) && !G().flags.a2_carry
    if (chestR.current) { const w = showChest ? 1 : 0.001; const c = chestR.current.scale.x + (w - chestR.current.scale.x) * k; chestR.current.scale.setScalar(c); chestR.current.visible = c > 0.02 }
  })
  const addStone = () => {
    if (phase !== 'stones') return
    SFX.play('bead')
    const t = st.tray + 1
    if (t >= 10) { setSt({ ...st, tray: 10 }); setTimeout(() => { SFX.play('success'); setSt((s) => ({ ...s, tray: 0, sacks: 1 })); G().showToast('10 pedras = 1 saco!') }, 450) }
    else setSt({ ...st, tray: t })
  }
  const addSack = () => { if (phase !== 'sacks' || st.sacks >= 10) return; SFX.play('stone'); setSt({ ...st, sacks: st.sacks + 1 }) }
  const toCrate = () => { SFX.play('gear'); setTimeout(() => SFX.play('success'), 200); setSt({ ...st, sacks: 0, crates: 1 }); G().showToast('10 sacos = 1 caixa = 100 pedras!') }
  const addCrate = () => { if (phase !== 'crates' || st.crates >= 10) return; SFX.play('stone'); setSt({ ...st, crates: st.crates + 1 }) }
  const toChest = () => { SFX.play('gear'); setTimeout(() => SFX.play('discover'), 250); setSt({ ...st, crates: 0, chest: 1 }); G().showToast('10 caixas = 1 baú = 1000 pedras!') }
  const run = () => start('machine', async (c) => {
    if (c.flag('a2_group')) { await c.say({ who: 'NOVA', text: c.flag('a2_chest') ? 'A máquina descansa. Mil pedras já viraram um baú.' : 'O baú com mil pedras está pronto. Leve-o até o totem.' }, { ambient: true }); return }
    if (!c.flag('a2_try')) { await c.say({ who: 'NOVA', text: 'Uma máquina cheia de sacos e caixas. Primeiro tente carregar as pedras da pedreira.' }, { ambient: true }); return }
    setSt({ tray: 0, sacks: 0, crates: 0, chest: 0 }); setOpen(true); openR.current = true
    c.focus(portrait() ? [-2.4, 5.6, -24.6] : [-4.4, 3.6, -27.2], [MX, 0.9, -32.6], 50)
    RT.lookAt = new THREE.Vector3(MX, 0, -32)
    await c.say({ who: 'NOVA', text: 'Uma máquina de agrupar! Ponha 10 pedras e ela fecha um saco.' }, { ambient: true })
    await c.until(() => stR.current.chest > 0 || !openR.current)
    RT.lookAt = null
    if (!openR.current) { c.unfocus(); return }
    await c.wait(1.6)
    await c.say([
      { who: 'NEX', text: 'Dez pedras num saco, dez sacos numa caixa, dez caixas num baú!' },
      { who: 'NOVA', text: 'Mil pedras, e cabem num baú só. Agora dá para carregar.' },
    ], { ambient: true })
    setOpen(false); c.unfocus()
    c.setFlag('a2_group')
  })
  const cell = (label: string, v: number, on: boolean) => (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '6px 2px', borderRadius: 12, border: `1.5px solid ${on ? 'var(--gold)' : 'rgba(232,182,90,.25)'}`, background: on ? 'rgba(232,182,90,.12)' : 'transparent' }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 28, fontWeight: 800, color: on ? 'var(--gold-2)' : '#7d8596' }}>{v}</div>
    </div>
  )
  useOverlay('a2_machine', open ? (
    <Panel title="Máquina de Agrupar" onExit={() => setOpen(false)}>
      <p style={{ minHeight: 44 }}>
        {phase === 'stones' && <>Toque em <b>Pôr pedra</b> até encher o saco: <b>10 pedras</b>.</>}
        {phase === 'sacks' && (st.sacks < 10 ? <>Cada saco já tem 10 pedras. Encha sacos até ter <b>10 sacos</b>.</> : <>10 sacos! Troque por uma caixa.</>)}
        {phase === 'crates' && (st.crates < 10 ? <>Cada caixa tem 10 sacos = <b>100 pedras</b>. Junte <b>10 caixas</b>.</> : <>10 caixas! Troque por um baú.</>)}
        {phase === 'done' && <>Um baú = <b>1000 pedras</b>. Pronto para carregar!</>}
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {cell('BAÚS', st.chest, phase === 'done')}
        {cell('CAIXAS', st.crates, phase === 'crates')}
        {cell('SACOS', st.sacks, phase === 'sacks')}
        {cell('PEDRAS', st.tray, phase === 'stones')}
      </div>
      <div className="big" style={{ fontSize: 24, marginBottom: 8 }}>= {total} pedras</div>
      <div className="row">
        {phase === 'stones' && <button className="btn primary" onClick={addStone} disabled={st.tray >= 10}>Pôr pedra (+1)</button>}
        {phase === 'sacks' && (st.sacks < 10 ? <button className="btn primary" onClick={addSack}>Encher saco (+10)</button> : <button className="btn primary" onClick={toCrate}>Trocar 10 sacos → 1 caixa</button>)}
        {phase === 'crates' && (st.crates < 10 ? <button className="btn primary" onClick={addCrate}>Encher caixa (+100)</button> : <button className="btn primary" onClick={toChest}>Trocar 10 caixas → 1 baú</button>)}
      </div>
    </Panel>
  ) : null, [open, st])
  return (
    <group>
      <Solid>
        <mesh position={[MX, 0.15 + 0.45, -32.2]} material={MAT.stone()} castShadow receiveShadow><boxGeometry args={[1.5, 0.9, 7.8]} /></mesh>
        <mesh position={[MX - 0.75, 0.15 + 1.75, -32.2]} material={MAT.wood()} castShadow><boxGeometry args={[0.14, 1.7, 7.8]} /></mesh>
      </Solid>
      <mesh position={[MX, 1.08, -32.2]} material={MAT.woodDark()} receiveShadow><boxGeometry args={[1.56, 0.06, 7.86]} /></mesh>
      {[['PEDRAS', -29.2], ['SACOS · 10', -31.3], ['CAIXAS · 100', -33.3], ['BAÚ · 1000', -35.1]].map(([t, z]) => (
        <Text key={t as string} font={FONT.title} fontSize={0.2} position={[MX - 0.67, 2.35, z as number]} rotation={[0, Math.PI / 2, 0]} anchorX="center" anchorY="middle" color="#2e1c10">{t as string}</Text>
      ))}
      {/* funil e engrenagens */}
      <mesh position={[MX, 2.15, -28.95]} rotation={[Math.PI, 0, 0]} material={MAT.wood()} castShadow><coneGeometry args={[0.55, 0.8, 8, 1, true]} /></mesh>
      {[[-30.4, 0.32], [-33.4, 0.42], [-35.8, 0.26]].map(([z, r], i) => (
        <group key={i} position={[MX - 0.6, 2.6 + i * 0.1, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={MAT.bronze()}><cylinderGeometry args={[r, r, 0.08, 16]} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.bronzeDark()}><torusGeometry args={[r, 0.05, 6, 16]} /></mesh>
        </group>
      ))}
      {Array.from({ length: 10 }, (_, i) => <mesh key={'s' + i} ref={(o) => { stoneR.current[i] = o }} position={zStone(i)} geometry={stoneGeo()} scale={0.001} material={VM.stone()} castShadow userData={{ noCollide: true }} />)}
      {Array.from({ length: 10 }, (_, i) => <group key={'k' + i} ref={(o) => { sackR.current[i] = o }} position={zSack(i)} scale={0.001}><Sack s={0.62} /></group>)}
      {Array.from({ length: 10 }, (_, i) => <group key={'c' + i} ref={(o) => { crateR.current[i] = o }} position={zCrate(i)} scale={0.001}><Crate s={0.5} /></group>)}
      <group ref={chestR} position={CHEST_POS} rotation={[0, Math.PI / 2, 0]} scale={0.001}><Chest s={0.7} glow /></group>
      <Interactable id="maquina" label="Usar a Máquina de Agrupar" position={MACHINE_USE} radius={2.4} enabled={!!tried && !grouped} onUse={run} markerY={2.6} />
      <Interactable id="bau" label="Pegar o baú (1000 pedras)" position={CHEST_USE} radius={2.2} enabled={!!grouped && !carry && !delivered} onUse={() => start('bau', async (c) => { c.setFlag('a2_carry'); gesture('reach', 1.2); SFX.play('open') })} markerY={2.4} />
    </group>
  )
}

/* =================== 2c. carregar o baú até o totem das ruínas =================== */
export const TOTEM2_USE: Vec3 = [P.totem2[0], P.totem2[1], P.totem2[2] + 3.6]
export function CarriedChest() {
  const carry = useFlag('a2_carry'), delivered = useFlag('a2_chest')
  const g = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (!g.current) return
    const a = RT.playerYaw
    g.current.position.set(RT.player.x + Math.sin(a) * 0.42, RT.player.y + 0.62 + Math.sin(RT.time * 6) * 0.01 * RT.playerSpeed, RT.player.z + Math.cos(a) * 0.42)
    g.current.rotation.y = a
  })
  if (!carry || delivered) return null
  return <group ref={g}><Chest s={0.4} position={[0, 0, 0]} glow /></group>
}

export function RuinsTotem() {
  const ready = useFlag('a2_count'), carry = useFlag('a2_carry'), delivered = useFlag('a2_chest')
  const [placing, setPlacing] = useState(false)
  const lid = useRef(0)
  const lidG = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    lid.current += (((placing || delivered) ? 1 : 0) - lid.current) * Math.min(1, dt * 1.2)
    if (lidG.current) lidG.current.rotation.x = -lid.current * 1.5
  })
  const PED: V3 = [P.totem2[0], P.totem2[1], P.totem2[2] + 2.4]
  const run = () => start('totem2', async (c) => {
    if (c.flag('a2_chest')) { await c.say({ who: 'NOVA', text: '1000: um baú, zero caixas, zero sacos, zero pedras. Cada casa do número é um tamanho de grupo.' }, { ambient: true }); return }
    if (!c.flag('a2_carry')) {
      await c.say({ who: 'NOVA', text: 'O totem das ruínas pede 1000 pedras. A pedreira fica à esquerda da entrada.' }, { ambient: true })
      return
    }
    c.objective(null)
    RT.lookAt = new THREE.Vector3(...PED)
    gesture('reach', 1.4)
    const [x, y, z] = P.totem2
    c.focus(portrait() ? [x + 3.5, y + 3.4, z + 9.5] : [x + 3.4, y + 2.6, z + 6.6], [x, y + 2.0, z], 48)
    setPlacing(true)
    SFX.play('stone')
    await c.wait(1.6)
    SFX.play('chime')
    c.setFlag('a2_chest')
    SFX.play('core')
    await c.wait(2.2)
    RT.lookAt = null
    await c.say([
      { who: 'NEX', text: 'Mil pedras, e eu carreguei com uma mão só!' },
      { who: 'NOVA', text: 'Porque você não carregou mil coisas. Carregou uma: um baú que vale mil.' },
      { who: 'NOVA', text: 'Olha o número: 1 0 0 0. Um baú, zero caixas, zero sacos, zero pedras soltas.' },
      { who: 'NEX', text: 'Então cada algarismo diz quantos grupos de cada tamanho! O 1000 é a receita dos grupos.' },
      { who: 'NOVA', text: 'Exato. Agrupar deixa o grande pequeno. É assim que escrevemos números enormes com poucos símbolos.' },
    ])
    c.unfocus()
    c.discover('agrupamento')
    c.quest('q_mil', 'done', 'Mil é Diferente de Dez')
  })
  return (
    <group>
      <Totem position={P.totem2} h={4.6} w={1.3} value="1000" lit={!!delivered} idle="?" color="#ffd27a" />
      <Pedestal position={PED} h={0.85} r={0.62} />
      <group position={[PED[0], PED[1] + 0.85, PED[2]]} visible={placing || !!delivered}><Chest s={0.55} glow lidRef={lidG} /></group>
      {(placing || !!delivered) && <Sparkles count={24} scale={[1.6, 2, 1.6]} position={[PED[0], PED[1] + 1.6, PED[2]]} size={6} speed={0.6} color="#ffd98a" />}
      <Interactable id="totem2" label={delivered ? 'Ver o totem' : carry ? 'Colocar o baú no pedestal' : 'Ler o totem'} position={TOTEM2_USE} radius={2.4} enabled={!!ready} onUse={run} markerY={2.4} color={carry && !delivered ? '#ffd27a' : '#9fe9ff'} />
    </group>
  )
}

/* =================== 3. a porta da Câmara Binária =================== */
const SLABS = [8, 4, 2, 1]
const slabX = (i: number) => -4.8 + i * 3.2
const SLAB_Z = -48.3, PLINTH_Z = -50.7
export const DOOR_USE: Vec3 = [0, 0.15, -45.6]
function groupLayout(n: number): [number, number][] {
  if (n === 8) return Array.from({ length: 8 }, (_, i) => [((i % 4) - 1.5) * 0.36, (Math.floor(i / 4) - 0.5) * 0.3])
  if (n === 4) return Array.from({ length: 4 }, (_, i) => [((i % 2) - 0.5) * 0.36, (Math.floor(i / 2) - 0.5) * 0.3])
  if (n === 2) return [[-0.18, 0], [0.18, 0]]
  return [[0, 0]]
}
export function BinaryDoor() {
  const ready = useFlag('a2_chest'), opened = useFlag('a2_door')
  const [open, setOpen] = useState(false)
  const [bits, setBits] = useState([false, false, false, false])
  const sum = bits.reduce((s, b, i) => s + (b ? SLABS[i] : 0), 0)
  const door = useRef<THREE.Group>(null!)
  const dk = useRef(opened ? 1 : 0)
  const solved = sum === 12
  const solvedR = useRef(false); solvedR.current = solved
  const openR = useRef(open); openR.current = open
  const shownBits = opened ? [true, true, false, false] : bits
  useFrame((_, dt) => {
    dk.current += ((opened ? 1 : 0) - dk.current) * Math.min(1, dt * 0.7)
    if (door.current) { door.current.position.y = -dk.current * 7.4; door.current.visible = dk.current < 0.99 }
  })
  const toggle = (i: number) => {
    if (!openR.current || solvedR.current) return
    SFX.play(bits[i] ? 'click' : 'count')
    setBits((b) => b.map((v, j) => (j === i ? !v : v)))
  }
  const run = () => start('porta', async (c) => {
    if (c.flag('a2_door')) return
    if (!c.flag('a2_chest')) { await c.say({ who: 'NOVA', text: 'Uma porta enorme com lajes no chão. Antes, vamos terminar o que começamos nas ruínas.' }, { ambient: true }); return }
    setBits([false, false, false, false]); setOpen(true); openR.current = true
    c.objective(null)
    c.focus(portrait() ? [0, 7.6, -36.4] : [0, 4.8, -40.6], [0, 2.6, -52.5], 50)
    if (!c.flag('a2_door_seen')) {
      c.setFlag('a2_door_seen')
      await c.say([
        { who: 'NOVA', text: 'Toque nas lajes para acendê-las. Cada laje acesa vale os cristais da pedra atrás dela.' },
        { who: 'NOVA', text: 'A porta quer o número da praça: 12. Lajes apagadas valem zero.' },
      ], { ambient: true })
    }
    await c.until(() => solvedR.current || !openR.current)
    if (!openR.current) { c.unfocus(); c.objective('Abra a porta da Câmara Binária', DOOR_USE); return }
    SFX.play('success')
    await c.wait(1.4)
    setOpen(false)
    c.setFlag('a2_door')
    SFX.play('stone'); SFX.play('gear')
    c.unfocus()
    await c.cinematic([
      { pos: [3.5, 2.4, -46.5], look: [0, 3.6, -57], dur: 0.01, cut: true },
      { pos: [1.2, 2.2, -50.2], look: [0, 2.6, -62], dur: 4.2, fov: 56 },
    ], false)
    await c.say([
      { who: 'NEX', text: 'Abriu! Só com quatro lajes, acesas ou apagadas.' },
      { who: 'NOVA', text: 'Acesa é 1, apagada é 0. Você escreveu o doze assim: 1 1 0 0.' },
      { who: 'NEX', text: 'Mas 1100 não parece doze…' },
      { who: 'NOVA', text: 'Porque aqui os grupos dobram: 8, 4, 2, 1, em vez de 1, 10, 100, 1000. Com só dois símbolos dá para escrever qualquer número.' },
    ])
    c.discover('binario')
  })
  useOverlay('a2_door', open ? (
    <Panel title="Porta da Câmara Binária" onExit={() => setOpen(false)}>
      <p>A porta pede o número da praça: <b>12</b>. Acenda as lajes cuja soma dá 12.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        {SLABS.map((v, i) => (
          <button key={i} className={'chipbtn cy' + (bits[i] ? ' on' : '')} style={{ flex: 1, minWidth: 0, maxWidth: 84, minHeight: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} onClick={() => toggle(i)} aria-label={`Laje ${v}: ${bits[i] ? 'acesa' : 'apagada'}`}>
            <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>vale {v}</span>
            <span style={{ fontSize: 30 }}>{bits[i] ? '1' : '0'}</span>
          </button>
        ))}
      </div>
      <div className="big" style={{ fontSize: 22, marginTop: 10, color: solved ? 'var(--green)' : 'var(--cyan)' }}>
        {sum === 0 ? 'Soma: 0' : bits.map((b, i) => (b ? SLABS[i] : null)).filter(Boolean).join(' + ') + ' = ' + sum}
        {solved ? ' ✔' : ''}
      </div>
      <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: 14, color: 'var(--muted)' }}>{solved ? 'Na porta: 1 1 0 0' : sum > 12 ? `Passou ${sum - 12}. Apague alguma laje.` : sum > 0 ? `Faltam ${12 - sum}.` : 'Comece pela laje que vale mais.'}</p>
    </Panel>
  ) : null, [open, bits])
  const y = 0.15
  return (
    <group>
      {/* lajes e pedras com os grupos de cristais */}
      {SLABS.map((v, i) => {
        const on = shownBits[i]
        return (
          <group key={i}>
            <mesh position={[slabX(i), y + 0.04, SLAB_Z]} material={on ? VM.binGlow() : VM.binDim()} receiveShadow userData={{ noCollide: true }}><boxGeometry args={[2.5, 0.08, 2.5]} /></mesh>
            <mesh position={[slabX(i), y + 0.03, SLAB_Z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.stoneDark()} userData={{ noCollide: true }}><ringGeometry args={[1.25, 1.42, 4, 1, Math.PI / 4]} /></mesh>
            <Text font={FONT.mono} fontSize={0.9} position={[slabX(i), y + 0.1, SLAB_Z + 0.2]} rotation={[-Math.PI / 2, 0, 0]} anchorX="center" anchorY="middle">{on ? '1' : '0'}<meshBasicMaterial attach="material" color={on ? '#05304a' : '#6f8fb0'} toneMapped={false} /></Text>
            <Solid><mesh position={[slabX(i), y + 0.42, PLINTH_Z]} material={CS()} castShadow receiveShadow><boxGeometry args={[1.9, 0.84, 0.95]} /></mesh></Solid>
            {groupLayout(v).map(([dx, dz], j) => <mesh key={j} geometry={crystalGeo()} position={[slabX(i) + dx, y + 0.84, PLINTH_Z + dz]} scale={[0.1, 0.34, 0.1]} material={on ? VM.crystalBlue() : VM.crystalDim()} castShadow userData={{ noCollide: true }} />)}
            <Text font={FONT.title} fontSize={0.26} position={[slabX(i), y + 0.5, PLINTH_Z + 0.48]} anchorX="center" anchorY="middle" color="#dfe8f5">{String(v)}</Text>
            {open && <mesh position={[slabX(i), y + 0.6, SLAB_Z]} onClick={(e) => { e.stopPropagation(); toggle(i) }} userData={{ noCollide: true }}><boxGeometry args={[2.6, 1.2, 4.2]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
          </group>
        )
      })}
      {/* porta */}
      {!opened && <Solid invisible><mesh position={[0, y + 3.8, -56.95]}><boxGeometry args={[5.4, 7.6, 0.5]} /></mesh></Solid>}
      <group ref={door}>
        <mesh position={[0, y + 3.8, -56.95]} material={VM.doorStone()} castShadow userData={{ noCollide: true }}><boxGeometry args={[5.4, 7.6, 0.5]} /></mesh>
        <mesh position={[0, y + 3.8, -56.68]} material={MAT.gold()} userData={{ noCollide: true }}><boxGeometry args={[5.0, 0.08, 0.04]} /></mesh>
        {[0, 1, 2, 3].map((i) => <BinDigit key={i} position={[-1.8 + i * 1.2, y + 2.6, -56.66]} on={shownBits[i]} size={1} />)}
        {[0, 1, 2, 3].map((i) => <Text key={'v' + i} font={FONT.title} fontSize={0.28} position={[-1.8 + i * 1.2, y + 1.7, -56.66]} anchorX="center" anchorY="middle" color="#8fa8c8">{String(SLABS[i])}</Text>)}
        <mesh position={[0, y + 5.4, -56.67]} material={VM.binGlow()} userData={{ noCollide: true }}><torusGeometry args={[0.7, 0.06, 8, 32]} /></mesh>
      </group>
      {/* placa acima do arco: o número pedido */}
      <group position={[0, y + 9.25, -55.24]}>
        <mesh material={MAT.gold()}><boxGeometry args={[5.4, 1.3, 0.06]} /></mesh>
        <mesh position={[0, 0, 0.04]} material={VM.obsidian()}><boxGeometry args={[5.1, 1.1, 0.04]} /></mesh>
        <Text font={FONT.title} fontSize={0.8} position={[0, -0.02, 0.08]} anchorX="center" anchorY="middle">12<meshBasicMaterial attach="material" color="#ffe6a8" toneMapped={false} /></Text>
        {Array.from({ length: 12 }, (_, i) => <mesh key={i} geometry={crystalGeo()} position={[(i < 6 ? -2.2 : 0.95) + (i % 6) * 0.25, -0.22, 0.08]} scale={[0.07, 0.42, 0.07]} material={VM.crystalGold()} />)}
      </group>
      {opened && <Sparkles count={40} scale={[4, 6, 3]} position={[0, 3.5, -57]} size={5} speed={0.6} color="#9fe9ff" />}
      <Interactable id="porta" label={ready ? 'Examinar a porta' : 'Porta da Câmara Binária'} position={DOOR_USE} radius={2.8} enabled={!opened} onUse={run} markerY={2.4} color={ready ? '#ffd27a' : '#9fe9ff'} />
    </group>
  )
}
let _cs2: THREE.Material | null = null
const CS = () => (_cs2 ||= (() => { const m = (MAT.wall(1) as THREE.MeshStandardMaterial).clone(); m.color.set('#a9b4c8'); return m })())

/* =================== portal de saída (para a Área 3) =================== */
export const PORTAL_USE: Vec3 = [P.portal[0], 0.15, P.portal[2] + 4.4]
export function ExitPortal() {
  const on = useFlag('a2_done')
  return (
    <group>
      <Portal position={P.portal} rotY={0} active={!!on} />
      <Interactable id="portal2" label="Atravessar o portal" position={PORTAL_USE} radius={3} enabled={!!on} onUse={() => start('portal2', async (c) => { c.objective(null); c.goto('p1a3') })} markerY={5.4} color="#7fe3ff" />
    </group>
  )
}
