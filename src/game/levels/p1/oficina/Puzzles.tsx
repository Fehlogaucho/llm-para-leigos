import * as THREE from 'three'
import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Interactable, Solid, useFlag } from '../../../world/core'
import { Gate, useFarClose } from '../../../world/mechanics'
import { MAT } from '../../../world/materials'
import { useOverlay, Panel } from '../../../world/puzzle'
import { FONT } from '../../../world/fonts'
import { RT, gesture } from '../../../engine/runtime'
import { SFX } from '../../../engine/audio'
import { start } from '../../../engine/script'
import { G, useGame } from '../../../store'
import { gearGeo, SpinGear, Steam, GATES, PART, cardMat, rubberMat, boxMat, glowRed, glowGreen, type V3 } from './Hall'

const tmpV = new THREE.Vector3()
const lerpAng = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k

/* =========================================================
   1. TRANSMISSÃO — três engrenagens faltando entre o motor e o portão
   ========================================================= */
export const CARRY = { k: null as null | GearK }
type GearK = 'L' | 'M' | 'S'
const GW = { z: 12.95, y: 3.2 }
const SPEC: Record<GearK, { r: number; t: number; name: string }> = {
  L: { r: 1.4, t: 16, name: 'grande' },
  M: { r: 1.0, t: 12, name: 'média' },
  S: { r: 0.6, t: 8, name: 'pequena' },
}
const SLOTS: { x: number; need: GearK }[] = [{ x: -9.1, need: 'L' }, { x: -7.1, need: 'S' }, { x: -5.5, need: 'M' }]
const DRIVER = { x: -11.5, r: 1.0 }, WINCH = { x: -3.7, r: 0.8 }
const W0 = 0.9 // velocidade do motor
export const TABLE = { x: 8.2, z: 18.6 }
const TABLE_SPOT: Record<GearK, V3> = { L: [TABLE.x - 1.5, 1.05 + 1.4, TABLE.z], M: [TABLE.x + 0.25, 1.05 + 1.0, TABLE.z], S: [TABLE.x + 1.55, 1.05 + 0.6, TABLE.z] }
export const SLOT_USE: V3 = [-7.3, 0, 14.3]
const bit = (i: number) => 1 << i

function MovingGear({ k, loc, spin }: { k: GearK; loc: string; spin: number }) {
  const g = useRef<THREE.Group>(null!), m = useRef<THREE.Mesh>(null!)
  const sp = SPEC[k]
  const mat = k === 'L' ? MAT.bronze() : k === 'M' ? MAT.copper() : MAT.gold()
  useFrame((_, dt) => {
    const grp = g.current
    if (!grp) return
    let ry = 0
    if (loc === 'carried') { tmpV.set(RT.player.x, RT.player.y + 2.25 + sp.r * 0.6, RT.player.z); ry = RT.camYaw }
    else if (loc === 'table') tmpV.set(...TABLE_SPOT[k])
    else { const s = SLOTS[+loc.slice(4)]; tmpV.set(s.x, GW.y, GW.z) }
    grp.position.lerp(tmpV, loc === 'carried' ? 0.35 : 0.16)
    grp.rotation.y = lerpAng(grp.rotation.y, ry, 0.25)
    if (m.current && spin) m.current.rotation.z += dt * spin
  })
  return (
    <group ref={g} position={TABLE_SPOT[k]} userData={{ noBatch: true }}>
      <mesh ref={m} geometry={gearGeo(sp.r, sp.t, 0.22)} material={mat} castShadow />
    </group>
  )
}

export function GearWall() {
  const mask = useFlag('a5_gmask')
  const powered = useFlag('a5_gears')
  const [carry, setCarry] = useState<GearK | null>(null)
  CARRY.k = carry
  const locOf = (k: GearK) => {
    if (carry === k) return 'carried'
    const i = SLOTS.findIndex((s) => s.need === k)
    return mask & bit(i) ? 'slot' + i : 'table'
  }
  // velocidades em cadeia: cada engrenagem gira se todas antes dela estão no lugar
  const chain = [true, ...SLOTS.map((_, i) => SLOTS.slice(0, i + 1).every((__, j) => mask & bit(j)))]
  const radii = [DRIVER.r, ...SLOTS.map((s) => SPEC[s.need].r), WINCH.r]
  const speed = (i: number) => (i % 2 ? -1 : 1) * W0 * DRIVER.r / radii[i]
  const pick = (k: GearK) => {
    SFX.play('click'); gesture('reach', 0.7)
    setCarry(k)
  }
  const place = (i: number) => {
    const s = SLOTS[i]
    if (!carry) {
      start('slot-empty', async (c) => { await c.say({ who: 'NOVA', text: 'Este eixo está vazio. Pegue uma engrenagem na bancada, do outro lado.' }, { ambient: true }) })
      return
    }
    if (carry !== s.need) {
      SFX.play('error')
      G().showToast(SPEC[carry].r > SPEC[s.need].r ? `A engrenagem ${SPEC[carry].name} é grande demais para este eixo: bate nas vizinhas.` : `A engrenagem ${SPEC[carry].name} é pequena demais: os dentes não alcançam as vizinhas.`)
      return
    }
    SFX.play('stone'); gesture('reach', 0.7)
    const nm = mask | bit(i)
    G().setFlag('a5_gmask', nm)
    setCarry(null)
    if (nm === 7) setTimeout(() => G().setFlag('a5_gears'), 900)
  }
  return (
    <group>
      {/* motor a vapor + volante + correia até a engrenagem motora */}
      <SpinGear position={[DRIVER.x, GW.y, GW.z]} r={DRIVER.r} teeth={12} speed={speed(0)} mat={MAT.iron()} />
      <SpinGear position={[-14.6, GW.y, 13.3]} r={1.9} teeth={20} speed={W0 * 1.0 / 1.9} mat={MAT.bronzeDark()} depth={0.3} />
      {[1, -1].map((s) => {
        const a = new THREE.Vector2(-14.6, GW.y + s * 1.75), b = new THREE.Vector2(DRIVER.x, GW.y + s * 0.6)
        const len = a.distanceTo(b), ang = Math.atan2(b.y - a.y, b.x - a.x)
        return <mesh key={s} position={[(a.x + b.x) / 2, (a.y + b.y) / 2, 13.15]} rotation={[0, 0, ang]} material={rubberMat()} userData={{ noCollide: true }}><boxGeometry args={[len, 0.12, 0.2]} /></mesh>
      })}
      <Solid><mesh position={[-14.6, 0.9, 14]} material={MAT.iron()} castShadow><boxGeometry args={[2.6, 1.8, 2]} /></mesh></Solid>
      <mesh position={[-14.6, GW.y, 13.6]} rotation={[Math.PI / 2, 0, 0]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.18, 0.18, 1.4, 10]} /></mesh>
      {/* placa da parede com eixos */}
      <mesh position={[-7.6, GW.y, 12.66]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[10.4, 3.9, 0.1]} /></mesh>
      {SLOTS.map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, GW.y, 12.8]} rotation={[Math.PI / 2, 0, 0]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.13, 0.13, 0.5, 10]} /></mesh>
          {!(mask & bit(i)) && <mesh position={[s.x, GW.y, 12.74]} material={MAT.glowWarm()} userData={{ noCollide: true }}><torusGeometry args={[SPEC[s.need].r - 0.1, 0.035, 6, 48]} /></mesh>}
          <Interactable id={'slot' + (i + 1)} label={mask & bit(i) ? '' : carry ? `Encaixar a engrenagem ${SPEC[carry].name}` : 'Eixo vazio'} position={[s.x, 0, 14.2]} radius={1.0} enabled={!(mask & bit(i))} onUse={() => place(i)} markerY={1.4} />
        </group>
      ))}
      {/* engrenagem do guincho do portão */}
      <SpinGear position={[WINCH.x, GW.y, GW.z]} r={WINCH.r} teeth={10} speed={speed(4)} mat={MAT.iron()} run={() => !!G().flags.a5_gears} />
      <mesh position={[(WINCH.x - 1.6) / 2 - 0.1, GW.y + 0.9, GW.z]} rotation={[0, 0, -0.55]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.03, 0.03, 2.5, 6]} /></mesh>
      {(['L', 'M', 'S'] as GearK[]).map((k) => {
        const loc = locOf(k)
        const si = SLOTS.findIndex((s) => s.need === k)
        return <MovingGear key={k} k={k} loc={loc} spin={loc.startsWith('slot') && chain[si + 1] ? speed(si + 1) : 0} />
      })}
      {/* bancada */}
      <Solid>
        <mesh position={[TABLE.x, 0.95, TABLE.z]} material={MAT.woodDark()} castShadow receiveShadow><boxGeometry args={[4.6, 0.2, 1.3]} /></mesh>
        {[-2, 2].map((x) => [-0.5, 0.5].map((z) => <mesh key={x + '_' + z} position={[TABLE.x + x, 0.42, TABLE.z + z]} material={MAT.iron()}><boxGeometry args={[0.14, 0.85, 0.14]} /></mesh>))}
      </Solid>
      {(['L', 'M', 'S'] as GearK[]).map((k) => (
        <Interactable key={k} id={'gear' + k} label={carry && carry !== k ? `Trocar pela engrenagem ${SPEC[k].name}` : `Pegar a engrenagem ${SPEC[k].name}`} position={[TABLE_SPOT[k][0], 0, TABLE.z - 1.3]} radius={0.85} enabled={locOf(k) === 'table'} onUse={() => pick(k)} markerY={1.0 + SPEC[k].r * 2 + 0.5} />
      ))}
      <Text font={FONT.title} fontSize={0.36} position={[TABLE.x, 4.2, TABLE.z + 0.2]} rotation={[0, 0, 0]} color="#ffe2b0" anchorX="center" outlineWidth={0.015} outlineColor="#2a140a">PEÇAS DE REPOSIÇÃO</Text>
      <Gate position={GATES.g1} open={!!powered} w={3.2} h={3.6} mat={MAT.iron()} />
    </group>
  )
}

/* =========================================================
   2. A SOMA AUTOMÁTICA — máquina de calcular que abre o portão 2
   ========================================================= */
export const CALC: V3 = [-5, 0, -17.4]
export const CALC_USE: V3 = [-5, 0, -15.4]
export function Calculator() {
  const done = useFlag('a5_soma')
  const [open, setOpen] = useState(false)
  const [a, setA] = useState(0), [b, setB] = useState(0)
  const [shown, setShown] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const okRef = useRef(false)
  const busyRef = useRef(false); busyRef.current = busy
  const openRef = useRef(open); openRef.current = open
  const crank = useRef<THREE.Group>(null!), drums = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    if (!busyRef.current) return
    if (crank.current) crank.current.rotation.x -= dt * 5
    drums.current?.children.forEach((d, i) => { d.rotation.x += dt * (3 + i) })
  })
  const turn = () => {
    if (busy) return
    setBusy(true); setShown(0); SFX.play('gear')
    const A = a, B = b
    let n = 0
    const step = () => {
      if (n >= A + B) {
        setBusy(false); SFX.play('chime')
        if (A === 3 && B === 5) okRef.current = true
        else G().showToast(`A máquina calculou ${A} + ${B} = ${A + B}. A trava do portão pede 3 + 5.`)
        return
      }
      n++; setShown(n); SFX.play('tick')
      setTimeout(step, 280)
    }
    setTimeout(step, 500)
  }
  const run = () => start('calc', async (c) => {
    c.quest('q_soma', 'active', 'A Soma Automática')
    okRef.current = false
    setOpen(true); openRef.current = true
    c.focus([CALC[0] + 0.4, 3.5, CALC[2] + 6.2], [CALC[0], 1.7, CALC[2]], 46)
    if (!c.flag('a5_calc_seen')) {
      c.setFlag('a5_calc_seen')
      await c.say([
        { who: 'NOVA', text: 'Uma máquina de somar. Ajuste os dois números nas rodas e gire a manivela.' },
        { who: 'NOVA', text: 'A trava do portão pede 3 + 5. Mas quem faz a conta é a máquina, não você.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.4)
    setOpen(false); c.unfocus()
    if (!c.flag('a5_soma')) {
      c.setFlag('a5_soma')
      await c.wait(0.6)
      await c.say([
        { who: 'NEX', text: 'Oito! E eu nem contei nos dedos.' },
        { who: 'NOVA', text: 'A regra da soma está nas engrenagens. Você só ajustou a entrada e girou: a máquina fez o resto.' },
        { who: 'NOVA', text: 'Uma máquina que executa uma regra sozinha: isso é automação.' },
        { who: 'NEX', text: 'E o portão da sala dos cartões abriu!' },
      ])
      c.discover('automacao')
      c.quest('q_soma', 'done', 'A Soma Automática')
    }
  })
  const Dial = ({ v, set, label }: { v: number; set: Dispatch<SetStateAction<number>>; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontWeight: 900, color: '#ffd27a' }}>{label}</span>
      <button className="chipbtn" disabled={busy} onClick={() => { set((x) => Math.max(0, x - 1)); SFX.play('tick') }}>−</button>
      <b style={{ fontFamily: 'var(--f-mono)', fontSize: 22, minWidth: 22, textAlign: 'center' }}>{v}</b>
      <button className="chipbtn" disabled={busy} onClick={() => { set((x) => Math.min(9, x + 1)); SFX.play('tick') }}>+</button>
    </div>
  )
  useFarClose(open, () => setOpen(false), CALC_USE, 4.5, () => busyRef.current)
  useOverlay('calc', open ? (
    <Panel title="Máquina de Calcular" onExit={busy ? undefined : () => setOpen(false)}>
      <p>Ajuste as rodas e gire a manivela. A máquina conta sozinha, dente por dente.</p>
      <div className="row" style={{ gap: 16 }}><Dial v={a} set={setA} label="A" /><b style={{ fontSize: 20 }}>+</b><Dial v={b} set={setB} label="B" /></div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" disabled={busy} onClick={turn}>{busy ? 'Girando…' : 'Girar a manivela ▸'}</button></div>
      {shown != null && <p style={{ textAlign: 'center', marginTop: 6 }}>Resultado: <b style={{ fontFamily: 'var(--f-mono)', fontSize: 18 }}>{shown}</b></p>}
    </Panel>
  ) : null, [open, a, b, shown, busy])
  const D = (x: number, label: string, v: string) => (
    <group position={[x, 2.75, 0.72]}>
      <mesh userData={{ noCollide: true }}><planeGeometry args={[0.7, 0.8]} /><meshStandardMaterial color="#120c08" roughness={0.6} /></mesh>
      <Text font={FONT.mono} fontSize={0.5} position={[0, -0.02, 0.02]} color="#ffe2a3" anchorX="center" anchorY="middle">{v}</Text>
      <Text font={FONT.title} fontSize={0.2} position={[0, 0.6, 0.02]} color="#f0d6a8" anchorX="center">{label}</Text>
    </group>
  )
  return (
    <group>
      <group position={CALC}>
        <Solid>
          <mesh position={[0, 0.4, 0]} material={MAT.iron()} castShadow receiveShadow><boxGeometry args={[4.8, 0.8, 2]} /></mesh>
          <mesh position={[0, 2.1, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[4.4, 2.6, 1.4]} /></mesh>
        </Solid>
        <mesh position={[0, 3.45, 0]} material={MAT.bronze()} userData={{ noCollide: true }}><boxGeometry args={[4.6, 0.12, 1.6]} /></mesh>
        <mesh position={[0, 0.82, 0]} material={MAT.bronze()} userData={{ noCollide: true }}><boxGeometry args={[4.5, 0.06, 1.5]} /></mesh>
        {D(-1.6, 'A', String(a))}
        <Text font={FONT.title} fontSize={0.42} position={[-0.8, 2.75, 0.73]} color="#ffd27a" anchorX="center" anchorY="middle">+</Text>
        {D(0, 'B', String(b))}
        <Text font={FONT.title} fontSize={0.42} position={[0.8, 2.75, 0.73]} color="#ffd27a" anchorX="center" anchorY="middle">=</Text>
        {D(1.65, 'RESULTADO', shown == null ? '-' : String(shown))}
        <group ref={drums} position={[0, 1.55, 0.72]} userData={{ noBatch: true }}>
          {[-1.6, 0, 1.65].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.bronze()}><cylinderGeometry args={[0.3, 0.3, 0.8, 12]} /></mesh>)}
        </group>
        {[-1.6, 0, 1.65].map((x) => <mesh key={x} position={[x, 1.55, 0.6]} material={MAT.iron()} userData={{ noCollide: true }}><boxGeometry args={[0.9, 0.7, 0.2]} /></mesh>)}
        <group ref={crank} position={[2.45, 2.1, 0]} userData={{ noBatch: true }}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={MAT.iron()}><cylinderGeometry args={[0.07, 0.07, 0.5, 8]} /></mesh>
          <mesh position={[0.25, 0.35, 0]} material={MAT.iron()}><boxGeometry args={[0.08, 0.8, 0.12]} /></mesh>
          <mesh position={[0.42, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.woodDark()}><cylinderGeometry args={[0.07, 0.07, 0.4, 8]} /></mesh>
        </group>
        <SpinGear position={[-2.3, 2.6, 0.2]} rotation={[0, Math.PI / 2, 0]} r={0.55} speed={-1.2} mat={MAT.copper()} run={() => busyRef.current} />
        <SpinGear position={[-2.3, 1.7, -0.1]} rotation={[0, Math.PI / 2, 0]} r={0.4} speed={1.6} mat={MAT.bronze()} run={() => busyRef.current} />
        {/* eixo de saída até o portão */}
        <mesh position={[(2.2 + (GATES.g2[0] - CALC[0] - 2.5)) / 2, 3.2, -0.5]} rotation={[0, 0, Math.PI / 2]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.08, 0.08, GATES.g2[0] - CALC[0] - 2.5 - 2.2, 8]} /></mesh>
        <mesh position={[0, 4.0, 0]} material={done ? glowGreen() : glowRed()} userData={{ noCollide: true }}><sphereGeometry args={[0.16, 12, 10]} /></mesh>
      </group>
      <Interactable id="calc" label={done ? 'Fazer outra conta' : 'Usar a Máquina de Calcular'} position={CALC_USE} radius={2} onUse={run} markerY={3.2} />
      <Gate position={GATES.g2} open={!!done} w={3.2} h={3.6} mat={MAT.iron()} />
      <Text font={FONT.mono} fontSize={0.34} position={[GATES.g2[0], 4.26, PART.p2 + 0.58]} color="#ffe2a3" anchorX="center" anchorY="middle" outlineWidth={0.015} outlineColor="#1a0e06">TRAVA: 3 + 5</Text>
    </group>
  )
}

/* =========================================================
   side quest: REPETIÇÃO — linha de produção com carimbo
   ========================================================= */
const CONV = { x: 12, z0: 7, z1: -15, press: -4 }
export const CONV_USE: V3 = [8.8, 0, -4]
export function Conveyor() {
  const done = useGame((s) => s.quests.q_repeticao === 'done')
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [auto, setAuto] = useState(false)
  const offs = useRef(0), target = useRef(0), countRef = useRef(0)
  const autoRef = useRef(auto); autoRef.current = auto
  const openRef = useRef(open); openRef.current = open
  const press = useRef<THREE.Group>(null!), boxes = useRef<THREE.Group>(null!)
  const SP = 2, L = CONV.z0 - CONV.z1, NB = Math.round(L / SP)
  useFrame((_, dt) => {
    const speed = autoRef.current ? 16 : 2.2
    const moving = target.current - offs.current > 1e-4
    if (moving) offs.current = Math.min(target.current, offs.current + dt * speed)
    const frac = offs.current - Math.floor(offs.current)
    if (press.current) press.current.position.y = 3.0 - (moving ? Math.max(0, 1 - frac / 0.35) : 0) * 0.95
    boxes.current?.children.forEach((b, i) => {
      const d = ((i * SP + offs.current * SP) % L + L) % L
      const z = CONV.z0 - d
      b.position.z = z
      const past = CONV.press - z
      const stamped = past > 0.4 && Math.ceil(past / SP - 0.2) <= countRef.current
      b.children[1].visible = stamped
    })
    const c = Math.floor(offs.current + 1e-6)
    if (c !== countRef.current) {
      countRef.current = c; setCount(c)
      if (!autoRef.current) SFX.play('stone'); else if (c % 6 === 0) SFX.play('tick')
    }
  })
  const stampOne = () => { if (autoRef.current || target.current - offs.current > 1.5 || target.current >= 100) return; target.current += 1 }
  const loop = () => { setAuto(true); autoRef.current = true; target.current = 100; SFX.play('gear') }
  const run = () => start('conveyor', async (c) => {
    c.quest('q_repeticao', 'active', 'Repetição')
    if (countRef.current >= 100) { offs.current = target.current = 0; countRef.current = 0; setCount(0); setAuto(false); autoRef.current = false }
    setOpen(true); openRef.current = true
    c.focus([CONV.x - 8.5, 5.8, CONV.press + 8.5], [CONV.x, 2.3, CONV.press - 1.5], 50)
    if (!c.flag('a5_conv_seen')) {
      c.setFlag('a5_conv_seen')
      await c.say({ who: 'NOVA', text: 'Cada caixa precisa de um carimbo. Carimbe algumas, uma de cada vez.' }, { ambient: true })
    }
    await c.until(() => countRef.current >= 5 || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    if (!c.flag('a5_tired')) {
      c.setFlag('a5_tired')
      await c.say([
        { who: 'NEX', text: 'Cinco caixas e eu já cansei. Faltam noventa e cinco!' },
        { who: 'NOVA', text: 'Então não carimbe. Dê uma instrução para a máquina: REPITA até chegar a 100.' },
      ], { ambient: true })
    }
    await c.until(() => countRef.current >= 100 || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.4)
    setOpen(false); c.unfocus()
    if (G().quests.q_repeticao !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Cem caixas em segundos, e nenhuma torta!' },
        { who: 'NOVA', text: 'A máquina não cansa e não se distrai. Ela repete a mesma instrução quantas vezes for preciso. Isso se chama repetição, ou loop.' },
        { who: 'NOVA', text: 'Computadores repetem bilhões de vezes por segundo. Uma LLM repete o mesmo cálculo para cada palavra que escreve.' },
      ])
      c.discover('loop')
      c.fragment('automacao', 'Fragmento: AUTOMAÇÃO')
      c.quest('q_repeticao', 'done', 'Repetição')
    }
  })
  useFarClose(open, () => setOpen(false), CONV_USE, 4.5, () => autoRef.current && countRef.current < 100)
  useOverlay('conveyor', open ? (
    <Panel title="Linha de Produção" onExit={auto && count < 100 ? undefined : () => setOpen(false)}>
      <p>Caixas carimbadas: <b style={{ fontFamily: 'var(--f-mono)', fontSize: 18 }}>{count}</b> / 100</p>
      {!auto && <p style={{ fontSize: 13.5 }}>{count < 5 ? 'Carimbe uma caixa de cada vez.' : 'Isso vai demorar… Que tal ensinar a máquina a repetir?'}</p>}
      <div className="row">
        <button className="btn" disabled={auto} onClick={stampOne}>Carimbar 1 caixa</button>
        {count >= 5 && <button className="btn primary" disabled={auto} onClick={loop}>REPITA até 100 ▸</button>}
      </div>
    </Panel>
  ) : null, [open, count, auto])
  const zc = (CONV.z0 + CONV.z1) / 2
  return (
    <group>
      <Solid>
        <mesh position={[CONV.x, 0.45, zc]} material={MAT.iron()} castShadow receiveShadow><boxGeometry args={[1.9, 0.9, L + 0.6]} /></mesh>
      </Solid>
      <mesh position={[CONV.x, 0.92, zc]} rotation={[-Math.PI / 2, 0, 0]} material={rubberMat()} userData={{ noCollide: true }}><planeGeometry args={[1.6, L + 0.4]} /></mesh>
      {[CONV.z0 + 0.2, CONV.z1 - 0.2].map((z) => <mesh key={z} position={[CONV.x, 0.7, z]} rotation={[0, 0, Math.PI / 2]} material={MAT.bronze()} userData={{ noCollide: true }}><cylinderGeometry args={[0.24, 0.24, 1.95, 12]} /></mesh>)}
      <group ref={boxes} userData={{ noBatch: true }}>
        {Array.from({ length: NB }, (_, i) => (
          <group key={i} position={[CONV.x, 1.4, CONV.z0 - i * SP]}>
            <mesh material={boxMat()} castShadow><boxGeometry args={[0.95, 0.95, 0.95]} /></mesh>
            <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.glowWarm()} visible={false}><circleGeometry args={[0.3, 16]} /></mesh>
          </group>
        ))}
      </group>
      {/* prensa */}
      <group position={[CONV.x, 0, CONV.press]}>
        {[-1.3, 1.3].map((x) => <mesh key={x} position={[x, 2.1, 0]} material={MAT.iron()} castShadow><boxGeometry args={[0.3, 4.2, 0.5]} /></mesh>)}
        <mesh position={[0, 4.2, 0]} material={MAT.copper()} castShadow><boxGeometry args={[3, 0.5, 0.8]} /></mesh>
        <mesh position={[0, 4.9, 0]} material={MAT.bronzeDark()}><cylinderGeometry args={[0.45, 0.45, 1, 16]} /></mesh>
        <group ref={press} position={[0, 3.0, 0]} userData={{ noBatch: true }}>
          <mesh position={[0, 0.7, 0]} material={MAT.iron()}><cylinderGeometry args={[0.12, 0.12, 1.4, 8]} /></mesh>
          <mesh material={MAT.bronze()} castShadow><boxGeometry args={[1.0, 0.3, 1.0]} /></mesh>
        </group>
        <group position={[-1.5, 5.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh userData={{ noCollide: true }}><planeGeometry args={[2.6, 1]} /><meshStandardMaterial color="#120c08" /></mesh>
          <Text font={FONT.mono} fontSize={0.42} position={[0, 0, 0.02]} color="#ffe2a3" anchorX="center" anchorY="middle">{`CAIXAS: ${count}`}</Text>
        </group>
      </group>
      <Steam position={[CONV.x, 5.4, CONV.press]} n={6} h={2} s={0.3} rate={0.5} on={() => (autoRef.current && countRef.current < 100 ? 1 : 0.25)} />
      {/* painel de controle */}
      <group position={[CONV_USE[0] + 0.9, 0, CONV_USE[2]]}>
        <Solid><mesh position={[0, 0.6, 0]} material={MAT.iron()}><boxGeometry args={[0.7, 1.2, 1.2]} /></mesh></Solid>
        <mesh position={[-0.1, 1.25, 0]} rotation={[0, 0, 0.5]} material={MAT.bronze()} userData={{ noCollide: true }}><boxGeometry args={[0.6, 0.1, 1.1]} /></mesh>
        <mesh position={[-0.25, 1.38, 0.2]} material={glowRed()} userData={{ noCollide: true }}><sphereGeometry args={[0.09, 10, 8]} /></mesh>
        <mesh position={[-0.25, 1.38, -0.2]} material={glowGreen()} userData={{ noCollide: true }}><sphereGeometry args={[0.09, 10, 8]} /></mesh>
      </group>
      <Interactable id="conveyor" label="Operar a linha de produção" position={CONV_USE} radius={2} onUse={run} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   side quest: MÁQUINA DE DECISÃO — entrada → regra → saída
   ========================================================= */
const DEC: V3 = [-12.4, 0, 0]
export const DEC_USE: V3 = [-9.6, 0, 0]
const INS = [2, 4, 7]
const RULES = [{ k: '× 2', f: (x: number) => x * 2 }, { k: '+ 3', f: (x: number) => x + 3 }, { k: '× 10', f: (x: number) => x * 10 }]
export function DecisionMachine() {
  const done = useGame((s) => s.quests.q_decisao === 'done')
  const [open, setOpen] = useState(false)
  const [inp, setInp] = useState(1), [rule, setRule] = useState(0)
  const [hist, setHist] = useState<{ i: number; r: number; o: number }[]>([])
  const [busy, setBusy] = useState(false)
  const anim = useRef<number | null>(null)
  const token = useRef<THREE.Group>(null!)
  const busyRef = useRef(busy); busyRef.current = busy
  const openRef = useRef(open); openRef.current = open
  const best = useMemo(() => { const m: Record<string, number> = {}; let b = 0; for (const h of hist) { const k = h.i + '_' + h.r; m[k] = (m[k] || 0) + 1; b = Math.max(b, m[k]) } return b }, [hist])
  const bestRef = useRef(best); bestRef.current = best
  useFrame(() => {
    const t = token.current
    if (!t) return
    if (anim.current == null) { t.visible = false; return }
    const k = (performance.now() - anim.current) / 2000
    t.visible = k < 1 && (k < 0.35 || k > 0.7)
    if (k < 0.35) t.position.set(-1.8, 4.1 - (k / 0.35) * 1.9, 0)
    else if (k > 0.7) { const u = (k - 0.7) / 0.3; t.position.set(1.9 + u * 0.8, 2.0 - u * 0.9, 0.2) }
  })
  const process = () => {
    if (busy) return
    setBusy(true); anim.current = performance.now(); SFX.play('gear')
    const I = inp, Rr = rule
    setTimeout(() => { setHist((h) => [...h, { i: I, r: Rr, o: RULES[Rr].f(INS[I]) }]); setBusy(false); anim.current = null; SFX.play('chime') }, 2000)
  }
  const run = () => start('decide', async (c) => {
    c.quest('q_decisao', 'active', 'A Máquina de Decisão')
    setHist([])
    setOpen(true); openRef.current = true
    c.focus([DEC[0] + 7, 3.6, DEC[2] + 1.2], [DEC[0], 1.8, DEC[2]], 48)
    if (!c.flag('a5_dec_seen')) {
      c.setFlag('a5_dec_seen')
      await c.say({ who: 'NOVA', text: 'Escolha uma entrada e uma regra e aperte Processar. Depois repita exatamente igual. A saída muda?' }, { ambient: true })
    }
    await c.until(() => bestRef.current >= 3 && !busyRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.2)
    setOpen(false); c.unfocus()
    if (G().quests.q_decisao !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Três vezes a mesma entrada, três vezes a mesma saída.' },
        { who: 'NOVA', text: 'Mesma entrada e mesma regra dão sempre a mesma saída. Isso é processamento determinístico.' },
        { who: 'NOVA', text: 'Lembra da roleta? Ali cada giro podia dar uma cor diferente. As máquinas de linguagem juntam as duas coisas: contas certinhas e, no fim, um sorteio.' },
      ])
      c.discover('determinismo')
      c.quest('q_decisao', 'done', 'A Máquina de Decisão')
    }
  })
  const last = hist[hist.length - 1]
  useFarClose(open, () => setOpen(false), DEC_USE, 4.5, () => busyRef.current)
  useOverlay('decide', open ? (
    <Panel title="Máquina de Decisão" onExit={busy ? undefined : () => setOpen(false)}>
      <div className="row" style={{ gap: 6 }}><span style={{ fontWeight: 800, minWidth: 74 }}>Entrada</span>{INS.map((v, i) => <button key={v} className={'chipbtn' + (inp === i ? ' on' : '')} disabled={busy} onClick={() => { setInp(i); SFX.play('tick') }}>{v}</button>)}</div>
      <div className="row" style={{ gap: 6, marginTop: 6 }}><span style={{ fontWeight: 800, minWidth: 74 }}>Regra</span>{RULES.map((r, i) => <button key={r.k} className={'chipbtn' + (rule === i ? ' on' : '')} disabled={busy} onClick={() => { setRule(i); SFX.play('tick') }}>{r.k}</button>)}</div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" disabled={busy} onClick={process}>{busy ? 'Processando…' : 'Processar ▸'}</button></div>
      {hist.length > 0 && <p style={{ fontFamily: 'var(--f-mono)', fontSize: 13, textAlign: 'center', marginTop: 6 }}>{hist.slice(-4).map((h) => `${INS[h.i]} ${RULES[h.r].k} → ${h.o}`).join('   ·   ')}</p>}
    </Panel>
  ) : null, [open, inp, rule, hist, busy])
  const win = (x: number, label: string, v: string, col = '#ffe2a3') => (
    <group position={[x, 1.95, 0.82]}>
      <mesh userData={{ noCollide: true }}><planeGeometry args={[1.1, 0.75]} /><meshStandardMaterial color="#120c08" /></mesh>
      <Text font={FONT.mono} fontSize={0.36} position={[0, 0, 0.02]} color={col} anchorX="center" anchorY="middle">{v}</Text>
      <Text font={FONT.title} fontSize={0.18} position={[0, 0.58, 0.02]} color="#f0d6a8" anchorX="center">{label}</Text>
    </group>
  )
  return (
    <group>
      <group position={DEC} rotation={[0, Math.PI / 2, 0]}>
        <Solid>
          <mesh position={[0, 1.5, 0]} material={MAT.copper()} castShadow receiveShadow><boxGeometry args={[4.6, 3, 1.6]} /></mesh>
          <mesh position={[2.7, 0.55, 0.2]} material={MAT.iron()}><boxGeometry args={[0.9, 1.1, 1.1]} /></mesh>
        </Solid>
        <mesh position={[-1.8, 3.55, 0]} rotation={[Math.PI, 0, 0]} material={MAT.bronze()} userData={{ noCollide: true }}><coneGeometry args={[0.55, 1.1, 16, 1, true]} /></mesh>
        <mesh position={[2.7, 1.14, 0.2]} material={MAT.bronzeDark()} userData={{ noCollide: true }}><boxGeometry args={[0.8, 0.08, 1.0]} /></mesh>
        {win(-1.45, 'ENTRADA', String(INS[inp]))}
        <Text font={FONT.title} fontSize={0.3} position={[-0.72, 1.95, 0.84]} color="#ffd27a" anchorX="center" anchorY="middle">»</Text>
        {win(0, 'REGRA', RULES[rule].k)}
        <Text font={FONT.title} fontSize={0.3} position={[0.72, 1.95, 0.84]} color="#ffd27a" anchorX="center" anchorY="middle">»</Text>
        {win(1.45, 'SAÍDA', last && !busy ? String(last.o) : '?', '#8ff0b0')}
        <SpinGear position={[0, 3.2, 0.3]} r={0.5} speed={1.4} mat={MAT.gold()} run={() => busyRef.current} />
        <SpinGear position={[0.85, 3.25, 0.3]} r={0.32} speed={-2.2} mat={MAT.bronze()} run={() => busyRef.current} />
        <group ref={token} userData={{ noBatch: true }} visible={false}><mesh material={MAT.glowWarm()}><sphereGeometry args={[0.2, 14, 10]} /></mesh></group>
      </group>
      <Interactable id="decide" label="Usar a Máquina de Decisão" position={DEC_USE} radius={2} onUse={run} markerY={3.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   3. O CARTÃO PERFURADO — programe o braço para levar a chave à fechadura
   ========================================================= */
const ARM = { z: -31, top: 1.0, cells: [-4.5, -1.5, 1.5, 4.5], key0: 1, lock: 3 }
export const CARD_USE: V3 = [0, 0, -25.6]
const OPS = [{ k: 'AVANÇAR', s: '▶' }, { k: 'VOLTAR', s: '◀' }, { k: 'PEGAR', s: '▼' }, { k: 'SOLTAR', s: '▲' }]
const ROWS = 6
type ArmState = { pos: number; hold: boolean; key: number | 'held'; down: boolean }
export function CardMachine() {
  const done = useFlag('a5_card')
  const [open, setOpen] = useState(false)
  const [card, setCard] = useState<(number | null)[]>(Array(ROWS).fill(null))
  const [log, setLog] = useState<{ t: string; bad?: boolean }[]>([])
  const [running, setRunning] = useState(false)
  const [rowOn, setRowOn] = useState(-1)
  const runningRef = useRef(running); runningRef.current = running
  const vis = useRef<ArmState>({ pos: 0, hold: false, key: done ? ARM.lock : ARM.key0, down: false })
  const okRef = useRef(false)
  const openRef = useRef(open); openRef.current = open
  const carriage = useRef<THREE.Group>(null!), rod = useRef<THREE.Group>(null!), key = useRef<THREE.Group>(null!)
  const cur = useRef({ x: ARM.cells[0], y: 0 })
  useFrame(() => {
    const v = vis.current
    const tx = ARM.cells[v.pos]
    cur.current.x += (tx - cur.current.x) * 0.12
    const low = v.down ? (v.pos === ARM.lock ? 0.45 : 1.05) : 0
    cur.current.y += (low - cur.current.y) * 0.14
    if (carriage.current) carriage.current.position.x = cur.current.x
    if (rod.current) rod.current.position.y = -cur.current.y
    if (key.current) {
      if (v.key === 'held') key.current.position.lerp(tmpV.set(cur.current.x, 2.74 - cur.current.y - 0.7, ARM.z), 0.3)
      else { const kx = ARM.cells[v.key]; const ky = v.key === ARM.lock ? ARM.top + 0.8 + 0.05 : ARM.top + 0.05; key.current.position.lerp(tmpV.set(kx, ky, ARM.z), 0.2) }
    }
  })
  const punch = (r: number, op: number) => { if (running) return; SFX.play('click'); setCard((c) => c.map((v, i) => (i === r ? (v === op ? null : op) : v))) }
  const runCard = () => {
    if (running) return
    // simula
    let s: ArmState = { pos: 0, hold: false, key: ARM.key0, down: false }
    const steps: { s: ArmState; t: string; bad?: boolean; row: number }[] = []
    let ok = false
    card.forEach((op, row) => {
      if (op == null) return
      let t = '', bad = false
      s = { ...s, down: false }
      if (op === 0) { if (s.pos < 3) { s.pos++; t = `AVANÇAR → posição ${s.pos + 1}` } else { t = 'AVANÇAR: fim do trilho!'; bad = true } }
      if (op === 1) { if (s.pos > 0) { s.pos--; t = `VOLTAR → posição ${s.pos + 1}` } else { t = 'VOLTAR: começo do trilho!'; bad = true } }
      if (op === 2) { s.down = true; if (!s.hold && s.key === s.pos) { s.hold = true; s.key = 'held'; t = 'PEGAR: pegou a chave' } else { t = s.hold ? 'PEGAR: a garra já está cheia' : 'PEGAR: não tem nada aqui'; bad = true } }
      if (op === 3) { s.down = true; if (s.hold) { s.hold = false; s.key = s.pos; t = s.pos === ARM.lock ? 'SOLTAR: a chave caiu na fechadura!' : `SOLTAR: a chave caiu na posição ${s.pos + 1}`; if (s.pos === ARM.lock) ok = true; else bad = true } else { t = 'SOLTAR: a garra está vazia'; bad = true } }
      steps.push({ s: { ...s }, t, bad, row })
    })
    if (!steps.length) { G().showToast('O cartão está sem furos. Faça um furo em cada linha que quiser usar.'); return }
    setRunning(true); setLog([]); SFX.play('gear')
    vis.current = { pos: 0, hold: false, key: ARM.key0, down: false }
    steps.forEach((st, i) => {
      setTimeout(() => {
        vis.current = { ...st.s }
        setRowOn(st.row)
        setLog((l) => [...l, { t: `${i + 1}. ${st.t}`, bad: st.bad }])
        SFX.play(st.bad ? 'error' : 'tick')
        setTimeout(() => { if (vis.current.down) vis.current = { ...vis.current, down: false } }, 650)
      }, 500 + i * 1100)
    })
    setTimeout(() => {
      setRunning(false); setRowOn(-1)
      if (ok) { okRef.current = true; SFX.play('success') }
      else {
        G().showToast('O cartão terminou, mas a chave não chegou à fechadura (posição 4). Ajuste os furos.')
        setTimeout(() => { vis.current = { pos: 0, hold: false, key: ARM.key0, down: false } }, 600)
      }
    }, 500 + steps.length * 1100 + 600)
  }
  const run = () => start('card', async (c) => {
    c.quest('q_cartao', 'active', 'O Cartão Perfurado')
    okRef.current = false
    if (!c.flag('a5_card')) vis.current = { pos: 0, hold: false, key: ARM.key0, down: false }
    setOpen(true); openRef.current = true
    c.focus([0.4, 7.4, ARM.z + 9.4], [0.3, 0.6, ARM.z - 0.5], 50)
    if (!c.flag('a5_card_seen')) {
      c.setFlag('a5_card_seen')
      await c.say([
        { who: 'NOVA', text: 'Um braço mecânico e uma chave. O braço não obedece a botões: ele lê o cartão perfurado.' },
        { who: 'NOVA', text: 'Cada linha do cartão é uma instrução. O furo diz qual. Leve a chave da posição 2 até a fechadura, na posição 4.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.3)
    setOpen(false); c.unfocus()
    if (!c.flag('a5_card')) {
      c.setFlag('a5_card')
      await c.wait(0.6)
      await c.say([
        { who: 'NEX', text: 'A chave entrou! E eu nem toquei no braço.' },
        { who: 'NOVA', text: 'Você escreveu instruções no cartão, em ordem. A máquina só leu e obedeceu.' },
        { who: 'NOVA', text: 'Instruções gravadas que uma máquina segue: isso é um programa. Troque o cartão e a mesma máquina faz outra coisa.' },
      ])
      c.discover('programa')
      c.quest('q_cartao', 'done', 'O Cartão Perfurado')
    }
  })
  useFarClose(open, () => setOpen(false), CARD_USE, 4.5, () => runningRef.current)
  useOverlay('card', open ? (
    <Panel title="Cartão Perfurado" onExit={running ? undefined : () => setOpen(false)}>
      <p style={{ fontSize: 13.5 }}>Faça um furo por linha. A máquina lê de cima para baixo. Linhas sem furo são puladas.</p>
      <div style={{ background: '#e9d9b0', borderRadius: 10, padding: '8px 10px', margin: '6px auto', maxWidth: 380, color: '#3a2a12' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '22px repeat(4, 1fr)', gap: 4, fontSize: 11, fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>
          <span />{OPS.map((o) => <span key={o.k}>{o.s} {o.k}</span>)}
        </div>
        {card.map((v, r) => (
          <div key={r} style={{ display: 'grid', gridTemplateColumns: '22px repeat(4, 1fr)', gap: 4, alignItems: 'center', background: rowOn === r ? 'rgba(255,190,80,.45)' : 'transparent', borderRadius: 6 }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 900, fontSize: 12 }}>{r + 1}</span>
            {OPS.map((o, k) => (
              <button key={k} aria-label={`linha ${r + 1}: ${o.k}`} onClick={() => punch(r, k)} disabled={running}
                style={{ height: 26, borderRadius: 13, border: '2px solid #a88a52', background: v === k ? '#1b1208' : 'rgba(255,255,255,.35)', cursor: 'pointer', margin: '2px auto', width: '70%' }} />
            ))}
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn" disabled={running} onClick={() => { setCard(Array(ROWS).fill(null)); SFX.play('tick') }}>Limpar</button>
        <button className="btn primary" disabled={running} onClick={runCard}>{running ? 'Lendo o cartão…' : 'Rodar o cartão ▸'}</button>
      </div>
      {log.length > 0 && <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, marginTop: 6, textAlign: 'center' }}>{log.slice(-3).map((l, i) => <div key={i} style={{ color: l.bad ? '#ff9a9a' : '#cfe8ff' }}>{l.t}</div>)}</div>}
    </Panel>
  ) : null, [open, card, log, running, rowOn])
  return (
    <group>
      {/* mesa com 4 posições */}
      <Solid>
        <mesh position={[0, ARM.top / 2, ARM.z]} material={MAT.woodDark()} castShadow receiveShadow><boxGeometry args={[12.6, ARM.top, 1.8]} /></mesh>
        <mesh position={[ARM.cells[ARM.lock], ARM.top + 0.4, ARM.z]} material={MAT.iron()} castShadow><boxGeometry args={[1.3, 0.8, 1.3]} /></mesh>
      </Solid>
      {ARM.cells.map((x, i) => (
        <group key={i}>
          <mesh position={[x, ARM.top + 0.01, ARM.z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.bronzeDark()} userData={{ noCollide: true }}><ringGeometry args={[0.55, 0.65, 32]} /></mesh>
          <Text font={FONT.title} fontSize={0.45} position={[x, ARM.top - 0.45, ARM.z + 0.92]} color="#ffe2a3" anchorX="center" anchorY="middle">{String(i + 1)}</Text>
        </group>
      ))}
      <mesh position={[ARM.cells[ARM.lock], ARM.top + 0.81, ARM.z]} rotation={[-Math.PI / 2, 0, 0]} material={done ? glowGreen() : MAT.dark()} userData={{ noCollide: true }}><circleGeometry args={[0.32, 20]} /></mesh>
      {/* pórtico + carro + garra */}
      {[-6.8, 6.8].map((x) => <mesh key={x} position={[x, 2.3, ARM.z]} material={MAT.iron()} castShadow><boxGeometry args={[0.35, 4.6, 0.35]} /></mesh>)}
      <mesh position={[0, 4.55, ARM.z]} material={MAT.copper()} castShadow><boxGeometry args={[14, 0.3, 0.35]} /></mesh>
      <group ref={carriage} position={[ARM.cells[0], 4.55, ARM.z]} userData={{ noBatch: true }}>
        <mesh material={MAT.bronze()} castShadow><boxGeometry args={[0.8, 0.5, 0.65]} /></mesh>
        <group ref={rod}>
          <mesh position={[0, -0.7, 0]} material={MAT.iron()}><cylinderGeometry args={[0.06, 0.06, 1.4, 8]} /></mesh>
          <mesh position={[0, -1.4, 0]} material={MAT.bronzeDark()}><boxGeometry args={[0.5, 0.12, 0.3]} /></mesh>
          {[-0.2, 0.2].map((x) => <mesh key={x} position={[x, -1.62, 0]} material={MAT.iron()}><boxGeometry args={[0.06, 0.38, 0.2]} /></mesh>)}
        </group>
      </group>
      {/* chave (engrenagem com haste) */}
      <group ref={key} position={[ARM.cells[done ? ARM.lock : ARM.key0], done ? ARM.top + 0.85 : ARM.top + 0.05, ARM.z]} userData={{ noBatch: true }}>
        <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={gearGeo(0.32, 8, 0.1)} material={MAT.gold()} castShadow />
        <mesh position={[0, 0.32, 0]} material={MAT.gold()}><cylinderGeometry args={[0.06, 0.06, 0.5, 8]} /></mesh>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()}><torusGeometry args={[0.13, 0.04, 6, 16]} /></mesh>
      </group>
      {/* console com o cartão */}
      <group position={[CARD_USE[0], 0, CARD_USE[2] - 0.9]}>
        <Solid><mesh position={[0, 0.55, 0]} material={MAT.iron()}><boxGeometry args={[1.6, 1.1, 0.8]} /></mesh></Solid>
        <mesh position={[0, 1.2, 0]} rotation={[-0.6, 0, 0]} material={MAT.bronze()} userData={{ noCollide: true }}><boxGeometry args={[1.7, 0.08, 0.9]} /></mesh>
        <mesh position={[0, 1.26, 0.02]} rotation={[-0.6 - Math.PI / 2, 0, 0]} material={cardMat()} userData={{ noCollide: true }}><planeGeometry args={[1.3, 0.7]} /></mesh>
      </group>
      <Interactable id="card" label={done ? 'Programar o braço de novo' : 'Perfurar o cartão'} position={CARD_USE} radius={2} onUse={run} markerY={2.4} />
      <Gate position={GATES.g3} open={!!done} w={3.2} h={3.6} mat={MAT.iron()} />
      {/* tear de Jacquard (decoração) */}
      <Loom />
    </group>
  )
}

function Loom() {
  const chain = useRef<THREE.Group>(null!)
  useFrame(() => { chain.current?.children.forEach((c, i) => { const k = (RT.time * 0.08 + i / 14) % 1; c.position.set(0, 1.2 + Math.sin(k * Math.PI * 2) * 1.4 + 1.6, Math.cos(k * Math.PI * 2) * 0.7) ; c.rotation.x = -k * Math.PI * 2 }) })
  return (
    <group position={[-13.6, 0, -28]} rotation={[0, Math.PI / 2, 0]}>
      <Solid>
        {[-1.6, 1.6].map((x) => <mesh key={x} position={[x, 2, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.3, 4, 0.3]} /></mesh>)}
        <mesh position={[0, 1, 0.6]} material={MAT.woodDark()}><boxGeometry args={[3.4, 0.25, 1.6]} /></mesh>
      </Solid>
      <mesh position={[0, 4.1, 0]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[3.6, 0.3, 0.4]} /></mesh>
      <mesh position={[0, 1.15, 0.9]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.cloth('#6a2a4a')} userData={{ noCollide: true }}><planeGeometry args={[2.8, 1.2]} /></mesh>
      <group ref={chain} position={[0, 0, -0.3]} userData={{ noBatch: true }}>
        {Array.from({ length: 14 }, (_, i) => <mesh key={i} material={cardMat()}><boxGeometry args={[2.2, 0.02, 0.4]} /></mesh>)}
      </group>
      <Text font={FONT.title} fontSize={0.26} position={[0, 4.6, 0]} color="#ffe2b0" anchorX="center" outlineWidth={0.012} outlineColor="#2a140a">TEAR DE JACQUARD · 1804</Text>
    </group>
  )
}
