import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Sparkles, Text } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { SkyDome, Lights, Planet, CloudSea, CloudPuffs, FloatingIslands, Dust } from '../../world/Atmosphere'
import { Interactable, Solid, useFlag } from '../../world/core'
import { Eras } from './observatorio/Eras'
import { ObservatoryMap, P, towerPoint, TOWER } from './observatorio/Map'
import { Telescope, Sundial, Hourglass, CelestialGlobe, Abacus } from '../../world/Instruments'
import { MAT } from '../../world/materials'
import { useOverlay, Panel, Scope } from '../../world/puzzle'
import { FONT } from '../../world/fonts'
import { FOCUS } from '../../engine/CameraRig'
import { RT, gesture } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, QUICK, type Ctx } from '../../engine/script'
import { G, useGame, type Vec3 } from '../../store'
import { Pedestal } from '../../world/Architecture'

type V3 = [number, number, number]
const v = (a: V3) => new THREE.Vector3(...a)

/* =================== posições =================== */
// céu de fim de tarde mais vivo (estilo desenho animado)
const OBS_SKY = { hemi: '#c8d6ff', zenith: '#2a4aa8', mid: '#7a8ee6', horizon: '#ffb36a', below: '#f0b48a', sunCol: '#ffd9a8', sun: [-0.8, 0.42, -0.42] as V3, stars: 0.25, fog: '#f2c4a0', fogNear: 120, fogFar: 460 }
const TEL: V3 = [P.terr[0] - 1.6, P.terr[1], P.terr[2] - 1.2]
const LUN: V3 = [P.terr[0] + 3, P.terr[1], P.terr[2] - 3.4]
const DIAL: V3 = P.dial
const HOUR: V3 = [P.dial[0] + 4.6, P.dial[1] + 0.9, P.dial[2] - 2.6]
const BOOK: V3 = [P.lib[0] + 2.6, P.lib[1], P.lib[2] - 1.2]
const GLOBE: V3 = [P.lib[0] + 3.6, P.lib[1], P.lib[2] + 3]
const SECRET: V3 = [P.lib[0] + 0.5, P.lib[1], P.lib[2] - 5.2]
const CONSOLE: V3 = [P.dome[0], P.dome[1], P.dome[2] + 3.4]
const MID = towerPoint(0.5, TOWER.r1 + 2.2)
const ABACUS: V3 = [MID[0], MID[1], MID[2] + 1.0]
const PORTAL_USE: V3 = [P.portal[0] + 3.4, 0, P.portal[2]]

/* =================== constelações no céu =================== */
function skyBasis(dir: THREE.Vector3) {
  const d = dir.clone().normalize()
  const r = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize()
  const u = new THREE.Vector3().crossVectors(r, d).normalize()
  return { d, r, u }
}
const ORION_DIR = new THREE.Vector3(-0.62, 0.5, -0.6).normalize()
const ORION_C = v(P.terr).add(ORION_DIR.clone().multiplyScalar(230))
const ORION_STARS: [number, number][] = [[-6, 9], [6.2, 8], [-2.4, 0], [0, 0.5], [2.4, 1], [-5, -9], [6.5, -8.2]]
const ORION_EDGES = [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]
const PLEI_DIR = new THREE.Vector3(0.55, 0.78, -0.3).normalize()
const PLEI_C = v(LUN).add(PLEI_DIR.clone().multiplyScalar(230))
const PLEI_STARS: [number, number][] = [[0, 0], [2.3, 1.1], [-1.9, 1.7], [1.1, -2.0], [-2.5, -1.2], [3.5, -0.7]]
function starPos(c: THREE.Vector3, dir: THREE.Vector3, xy: [number, number], k = 1.6) { const b = skyBasis(dir); return c.clone().addScaledVector(b.r, xy[0] * k).addScaledVector(b.u, xy[1] * k) }

const starGeo = new THREE.SphereGeometry(1, 12, 8)
function Orion() {
  const lines = useFlag('a1_orion_lines')
  const focus = useGame((s) => s.focus)
  const pts = useMemo(() => ORION_STARS.map((s) => starPos(ORION_C, ORION_DIR, s)), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff4d6', toneMapped: false, fog: false }), [])
  const g = useRef<THREE.Group>(null!)
  useFrame(() => { const s = focus ? 1.5 : 0.9; g.current.children.forEach((c, i) => c.scale.setScalar(s * (1 + Math.sin(RT.time * 2 + i) * 0.12) * (i === 0 ? 1.4 : 1))) })
  return (
    <group>
      <group ref={g}>{pts.map((p, i) => <mesh key={i} geometry={starGeo} material={mat} position={p} userData={{ noCollide: true }} />)}</group>
      {lines > 0 && ORION_EDGES.map(([a, b], i) => <Line key={i} points={[pts[a], pts[b]]} color="#ffd98a" lineWidth={2.5} transparent opacity={0.9} toneMapped={false} fog={false} />)}
      {lines > 0 && <Text font={FONT.title} position={starPos(ORION_C, ORION_DIR, [0, -14])} fontSize={4.2} color="#ffe2a3" anchorX="center" quaternion={new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(ORION_C, v(P.terr), new THREE.Vector3(0, 1, 0)))}>ÓRION<meshBasicMaterial attach="material" color="#ffe2a3" toneMapped={false} fog={false} /></Text>}
    </group>
  )
}

/* =================== 1. telescópio do terraço (missão: observar) =================== */
function TerraceTelescope() {
  const done = useFlag('a1_obs')
  const tel = useRef<any>(null)
  const [mode, setMode] = useState<'off' | 'aim' | 'found' | 'seen'>('off')
  const aim = useRef({ yaw: -0.2, pitch: 0.28, drag: null as null | { x: number; y: number } })
  const camPos = useMemo(() => v(TEL).add(new THREE.Vector3(0, 2.75, 0)), [])
  ;(window as any).__pf && ((window as any).__pf.tel = aim.current)
  const setLook = () => {
    const a = aim.current
    const d = new THREE.Vector3(-Math.sin(a.yaw) * Math.cos(a.pitch), Math.sin(a.pitch), -Math.cos(a.yaw) * Math.cos(a.pitch))
    FOCUS.look.copy(camPos).addScaledVector(d, 60)
    if (tel.current) { tel.current.yaw.rotation.y = a.yaw + Math.PI * 0.75 + Math.PI; tel.current.pitch.rotation.x = -a.pitch }
    const ang = d.angleTo(ORION_C.clone().sub(camPos))
    return ang
  }
  const hintEl = useRef<HTMLDivElement | null>(null)
  const TGT = useMemo(() => { const d = ORION_C.clone().sub(camPos).normalize(); return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y) } }, [])
  useFrame(() => {
    if (mode !== 'aim' && mode !== 'found') return
    const ang = setLook()
    const h = hintEl.current
    if (h) {
      let dy = TGT.yaw - aim.current.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy))
      const dp = TGT.pitch - aim.current.pitch
      const show = ang > 0.15
      h.style.opacity = show ? '1' : '0'
      h.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(-dp, -dy)}rad) translateX(min(30vw, 30vh))`
    }
    if (mode === 'aim' && ang < 0.16) { setMode('found'); SFX.play('chime') }
    if (mode === 'found' && ang > 0.24) setMode('aim')
  })
  const run = () => start('tel', async (c) => {
    c.focus(camPos.toArray() as Vec3, camPos.clone().add(new THREE.Vector3(0, 0.3, -1)).toArray() as Vec3, 24)
    aim.current.yaw = -0.2; aim.current.pitch = 0.28
    setLook(); FOCUS.pos.copy(camPos)
    setMode('aim')
    if (!c.flag('a1_obs')) await c.say({ who: 'NOVA', text: 'Arraste a tela para girar o telescópio. Procure um grupo de estrelas brilhantes mais à esquerda e um pouco acima.' }, { ambient: true })
    await c.until(() => modeRef.current === 'seen' || modeRef.current === 'off')
    if (modeRef.current === 'off') { c.unfocus(); return }
    c.setFlag('a1_orion_lines')
    SFX.play('discover')
    await c.wait(1.2)
    if (!c.flag('a1_obs')) {
      await c.say([
        { who: 'NEX', text: 'Os pontos formam um desenho! Um caçador, com um cinto de três estrelas.' },
        { who: 'NOVA', text: 'É Órion. As três do meio são as Três Marias. Você não inventou esse desenho: você o encontrou, olhando com atenção.' },
        { who: 'NEX', text: 'Esse telescópio parece bem antigo.' },
        { who: 'NOVA', text: 'Este canto lembra a Itália de 1609. Galileu Galilei apontou uma luneta para o céu e viu montanhas na Lua e luas em volta de Júpiter. Ninguém tinha visto isso antes!' },
        { who: 'NOVA', text: 'Observar é o primeiro passo de tudo. Antes de qualquer máquina, alguém precisa olhar e anotar.' },
      ])
      c.discover('observacao')
      c.setFlag('a1_obs')
    }
    setMode('off')
    c.unfocus()
  })
  const modeRef = useRef(mode); modeRef.current = mode
  useOverlay('tel', mode === 'off' ? null : (
    <>
      <Scope><div ref={(e) => { hintEl.current = e }} style={{ position: 'absolute', left: '50%', top: '46%', fontSize: 30, color: '#ffd27a', textShadow: '0 0 10px #000', transition: 'opacity .4s', opacity: 0 }}>➤</div></Scope>
      <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
        onPointerDown={(e) => { aim.current.drag = { x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => { const d = aim.current.drag; if (!d) return; aim.current.yaw -= (e.clientX - d.x) * 0.0035; aim.current.pitch = THREE.MathUtils.clamp(aim.current.pitch - (e.clientY - d.y) * 0.003, 0.05, 1.25); d.x = e.clientX; d.y = e.clientY }}
        onPointerUp={() => { aim.current.drag = null }} />
      <Panel title="Telescópio" onExit={mode === 'seen' ? undefined : () => setMode('off')}>
        {mode === 'aim' && <p>Arraste para mover o telescópio. Siga a seta dourada até um grupo de estrelas brilhantes.</p>}
        {mode === 'found' && <><p>Achou algo! Os pontos parecem formar um desenho…</p><div className="row"><button className="btn primary" onClick={() => setMode('seen')}>Observar com atenção</button></div></>}
        {mode === 'seen' && <p>Pontos → linhas → um desenho no céu.</p>}
      </Panel>
    </>
  ), [mode])
  return (
    <group>
      <Telescope ref={tel} position={TEL} rotY={Math.PI * 0.75} s={1.15} alt={0.45} />
      <Interactable id="tel" label={done ? 'Olhar de novo no telescópio' : 'Olhar no telescópio'} position={[TEL[0] + 1.4, TEL[1], TEL[2] + 1.2]} radius={2.6} onUse={run} markerY={3.3} />
    </group>
  )
}

/* =================== side quest: O Céu em Números (luneta, Plêiades) =================== */
function Pleiades({ counting, counted, onTap }: { counting: boolean; counted: boolean[]; onTap: (i: number) => void }) {
  const pts = useMemo(() => PLEI_STARS.map((s) => starPos(PLEI_C, PLEI_DIR, s, 1.35)), [])
  ;(window as any).__pf && ((window as any).__pf.plei = pts)
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#cfe4ff', toneMapped: false, fog: false }), [])
  const ring = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false, fog: false, side: THREE.DoubleSide }), [])
  const q = useMemo(() => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(PLEI_C, v(LUN), new THREE.Vector3(0, 1, 0))), [])
  return (
    <group>
      {pts.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={starGeo} material={mat} scale={counting ? 0.9 : 0.6} userData={{ noCollide: true }} />
          {counting && <mesh onClick={(e) => { e.stopPropagation(); onTap(i) }} userData={{ noCollide: true }}><sphereGeometry args={[2.2, 8, 6]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} fog={false} /></mesh>}
          {counted[i] && <mesh quaternion={q} material={ring}><ringGeometry args={[1.6, 2.0, 24]} /></mesh>}
        </group>
      ))}
    </group>
  )
}
function Luneta() {
  const done = useGame((s) => s.quests.q_ceu === 'done')
  const [counting, setCounting] = useState(false)
  const [counted, setCounted] = useState<boolean[]>(() => PLEI_STARS.map(() => false))
  const n = counted.filter(Boolean).length
  const camPos = useMemo(() => v(LUN).add(new THREE.Vector3(0, 1.9, 0)), [])
  const tap = (i: number) => { if (counted[i]) return; SFX.play('count'); setCounted((c) => c.map((x, j) => j === i || x)) }
  const run = () => start('lun', async (c) => {
    c.quest('q_ceu', 'active', 'O Céu em Números')
    setCounted(PLEI_STARS.map(() => false))
    c.focus(camPos.toArray() as Vec3, PLEI_C.toArray() as Vec3, 9)
    setCounting(true)
    await c.say({ who: 'NOVA', text: 'Esse aglomerado se chama Plêiades. Toque em cada estrela para contá-las.' }, { ambient: true })
    await c.until(() => nRef.current >= PLEI_STARS.length || !countRef.current)
    if (!countRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.6)
    await c.say([
      { who: 'NEX', text: 'Seis! São seis estrelas.' },
      { who: 'NOVA', text: 'Repare no que você fez: trocou seis pontos de luz por um único símbolo, o “6”.' },
      { who: 'NOVA', text: 'O “6” serve para seis estrelas, seis pedras ou seis dias. Isso se chama abstração.' },
      { who: 'NOVA', text: 'Há mais de 2.000 anos, o grego Hiparco contou e anotou quase mil estrelas. Contar foi o primeiro jeito de guardar o céu.' },
    ])
    c.discover('abstracao')
    c.fragment('numero', 'Fragmento: NÚMERO')
    c.quest('q_ceu', 'done', 'O Céu em Números')
    setCounting(false)
    c.unfocus()
  })
  const nRef = useRef(n); nRef.current = n
  const countRef = useRef(counting); countRef.current = counting
  useOverlay('lun', counting ? (
    <>
      <Scope />
      <Panel title="O Céu em Números" onExit={() => setCounting(false)}>
        <p>Toque em cada estrela para contar.</p>
        <div className="big">{'⭐'.repeat(n)}{n ? ' → ' : ''}{n}</div>
      </Panel>
    </>
  ) : null, [counting, n])
  return (
    <group>
      <Pleiades counting={counting} counted={counted} onTap={tap} />
      <Telescope position={LUN} rotY={-2.4} s={0.6} alt={0.9} />
      <Interactable id="lun" label={done ? 'Contar de novo' : 'Usar a luneta'} position={[LUN[0], LUN[1], LUN[2] + 1]} radius={2} onUse={run} markerY={2.2} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =================== 2. relógio de sol (missão: medir) + side quest O Relógio =================== */
const hourAngle = (h: number) => Math.PI / 2 - ((h - 6) * Math.PI) / 12
function SundialSpot() {
  const med = useFlag('a1_med')
  const qdone = useGame((s) => s.quests.q_relogio === 'done')
  const dial = useRef<any>(null)
  const [ui, setUi] = useState<null | 'measure' | 'predict'>(null)
  const [hour, setHour] = useState(7)
  const [marks, setMarks] = useState<number[]>([])
  const [pick, setPick] = useState<number | null>(null)
  const anim = useRef<number | null>(null)
  const TARGETS = [9, 12, 15]
  const next = TARGETS.find((t) => !marks.includes(t))
  useFrame((_, dt) => {
    if (!dial.current) return
    if (anim.current != null) { anim.current = Math.min(14, anim.current + dt * 2.2); dial.current.shadow.rotation.y = hourAngle(anim.current) }
    else dial.current.shadow.rotation.y = hourAngle(hour)
  })
  const onSlide = (h: number) => {
    setHour(h)
    if (ui === 'measure' && next != null && Math.abs(h - next) < 0.2) { SFX.play('chime'); setMarks((m) => [...m, next]) }
  }
  const run = () => start('dial', async (c) => {
    const [x, y, z] = DIAL
    c.focus([x + 0.5, y + 7.5, z + 6], [x, y + 0.5, z - 0.3], 42)
    if (!c.flag('a1_med')) {
      setMarks([]); setHour(7); setUi('measure')
      await c.say({ who: 'NOVA', text: 'Arraste a barra para mover o sol. Ponha a ponta da sombra nas 9h, depois nas 12h e depois nas 15h.' }, { ambient: true })
      await c.until(() => marksRef.current.length >= 3 || !uiRef.current)
      if (!uiRef.current) { c.unfocus(); return }
      await c.wait(0.6)
      setUi(null)
      await c.say([
        { who: 'NEX', text: 'A sombra anda sempre do mesmo jeito: uma marca por hora!' },
        { who: 'NOVA', text: 'Isso é medir: comparar com uma unidade combinada. Das 9h até as 12h, a sombra andou três marcas: três horas.' },
        { who: 'NOVA', text: 'No Egito, há uns 3.500 anos, já se fazia isso: a sombra de obeliscos e relógios de sol dividia o dia em horas. Por isso este canto tem cara de Egito.' },
        { who: 'NOVA', text: 'Com medidas, o mundo vira números. E números podem ser guardados, comparados… e um dia, calculados por máquinas.' },
      ])
      c.discover('medicao')
      c.setFlag('a1_med')
    }
    if (G().quests.q_relogio !== 'done') {
      const go = await new Promise<boolean>((res) => { askRef.current = res; setUi('predict'); setPick(null); setHour(9) })
      if (!go) { setUi(null); c.unfocus(); return }
    }
    setUi(null); c.unfocus()
  })
  const askRef = useRef<(b: boolean) => void>(() => { })
  const marksRef = useRef(marks); marksRef.current = marks
  const uiRef = useRef(ui); uiRef.current = ui
  const choose = async (h: number) => {
    setPick(h); anim.current = 9
    dial.current.marker.visible = true
    dial.current.marker.rotation.y = hourAngle(14)
    SFX.play('click')
    await new Promise((r) => setTimeout(r, 2600))
    anim.current = null; setHour(14)
    if (h === 14) {
      SFX.play('success')
      QUICK.discover('previsao_simples')
      QUICK.quest('q_relogio', 'done', 'O Relógio')
      G().showToast('Previsão certa! A sombra chegou na marca às 14h.')
      setTimeout(() => askRef.current(true), 1500)
    } else { SFX.play('error'); G().showToast('Ainda não. Conte as marcas: uma por hora, a partir das 9h.'); setTimeout(() => { setPick(null); setHour(9) }, 1200) }
  }
  useOverlay('dial', ui === 'measure' ? (
    <Panel title="Relógio de Sol" onExit={() => setUi(null)}>
      <p>{next ? <>Ponha a sombra nas <b>{next}h</b>. Marcadas: {marks.length}/3</> : 'Pronto!'}</p>
      <div className="row" style={{ gap: 12 }}>
        <span style={{ fontSize: 22 }}>🌅</span>
        <input type="range" min={6} max={18} step={0.05} value={hour} onChange={(e) => onSlide(+e.target.value)} style={{ flex: 1, accentColor: '#e8b65a', height: 32 }} aria-label="Posição do sol" />
        <span style={{ fontSize: 22 }}>🌇</span>
      </div>
      <div className="big" style={{ fontSize: 26 }}>{Math.floor(hour)}h{String(Math.round((hour % 1) * 60)).padStart(2, '0')}</div>
    </Panel>
  ) : ui === 'predict' ? (
    <Panel title="Side quest · O Relógio" onExit={() => askRef.current(false)}>
      <p>Agora são <b>9h</b> e a sombra anda <b>uma marca por hora</b>. Que horas a sombra vai chegar na marca azul?</p>
      <div className="row">{[12, 14, 16].map((h) => <button key={h} className={'chipbtn' + (pick === h ? ' on' : '')} disabled={pick != null} onClick={() => choose(h)}>{h}h</button>)}</div>
    </Panel>
  ) : null, [ui, hour, marks, pick])
  return (
    <group>
      <Sundial ref={dial} position={DIAL} />
      <Interactable id="dial" label={!med ? 'Usar o relógio de sol' : qdone ? 'Mexer no relógio de sol' : 'Desafio: prever a sombra'} position={[DIAL[0], DIAL[1], DIAL[2] + 4.2]} radius={2.6} onUse={run} markerY={2} color={med && !qdone ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =================== ampulheta (prop) =================== */
function HourglassSpot() {
  const hg = useRef<any>(null)
  const st = useRef({ flip: 0, flipping: false, fill: 0.15, rot: 0 })
  useFrame((_, dt) => {
    const s = st.current
    if (!hg.current) return
    if (s.flipping) { s.rot += dt * 3; if (s.rot >= Math.PI) { s.rot = 0; s.flipping = false; s.fill = 1 } hg.current.body.rotation.z = s.rot }
    else { s.fill = Math.max(0, s.fill - dt / 9) }
    hg.current.setFill(s.flipping ? 1 - s.fill : s.fill)
  })
  const use = () => {
    if (st.current.flipping) return
    st.current.flipping = true; SFX.play('whoosh')
    start('hour', async (c) => {
      if (c.flag('a1_hour')) return
      c.setFlag('a1_hour')
      await c.wait(1.2)
      c.discover('tempo_rep')
      await c.say([{ who: 'NOVA', text: 'A areia cai sempre no mesmo ritmo. A ampulheta não guarda o tempo: ela o representa.' }, { who: 'NOVA', text: 'Há uns 700 anos, marinheiros usavam ampulhetas para medir o tempo no mar, onde nem sempre dava para ver o sol.' }], { ambient: true })
    })
  }
  return (
    <group>
      <Hourglass ref={hg} position={HOUR} s={0.75} />
      <Interactable id="hour" label="Virar a ampulheta" position={[HOUR[0] - 1.2, P.dial[1], HOUR[2] + 0.6]} radius={2} onUse={use} markerY={2.7} color="#9fe9ff" />
    </group>
  )
}

/* =================== 3. livro de registros (missão: representar) =================== */
const BOOK_ROWS = [
  { label: 'Estrelas de Órion que você viu', opts: [3, 7, 12], a: 7 },
  { label: 'Hora em que a sombra apontou para o meio-dia', opts: [9, 12, 15], a: 12 },
  { label: 'Horas entre 9h e 12h', opts: [2, 3, 6], a: 3 },
]
function RecordBook() {
  const done = useFlag('a1_rep')
  const obs = useFlag('a1_obs'), med = useFlag('a1_med')
  const plei = useGame((s) => s.quests.q_ceu === 'done')
  const [open, setOpen] = useState(false)
  const [ans, setAns] = useState<(number | null)[]>([null, null, null])
  const ok = ans.every((a, i) => a === BOOK_ROWS[i].a)
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const run = () => start('book', async (c) => {
    if (!c.flag('a1_obs') || !c.flag('a1_med')) {
      await c.say({ who: 'NOVA', text: !c.flag('a1_obs') ? 'O livro está em branco. Primeiro observe o céu no telescópio do terraço.' : 'Falta medir: use o relógio de sol, a leste da praça.' }, { ambient: true })
      return
    }
    const [x, y, z] = BOOK
    c.focus([x + 0.2, y + 2.6, z + 1.6], [x, y + 1.1, z], 40)
    setAns(c.flag('a1_rep') ? BOOK_ROWS.map((r) => r.a) : [null, null, null]); setOpen(true); openRef.current = true
    if (!c.flag('a1_rep')) {
      await c.say({ who: 'NOVA', text: 'Este é o Livro de Registros. Anote o que você observou e mediu: toque no número certo de cada linha.' }, { ambient: true })
      await c.until(() => okRef.current || !openRef.current)
      if (!openRef.current) { c.unfocus(); return }
      SFX.play('success')
      await c.wait(1)
      await c.say([
        { who: 'NEX', text: 'Pronto. O céu inteiro virou uma lista de números.' },
        { who: 'NOVA', text: 'Em Alexandria, no Egito, há 2.300 anos, a maior biblioteca do mundo guardava o que se sabia em milhares de rolos de papiro. Guardar é tão importante quanto descobrir.' },
        { who: 'NOVA', text: 'Mais que uma lista: uma tabela, com linhas e colunas. Você trocou o mundo por símbolos que dá para guardar.' },
        { who: 'NOVA', text: 'Isso é representar. Computadores só trabalham com representações. Guarde essa tabela na memória: no fim desta fase, ela vai virar algo poderoso.' },
      ])
      c.discover('representacao')
      c.setFlag('a1_rep')
      setOpen(false); c.unfocus()
    } else { await c.until(() => !openRef.current); c.unfocus() }
  })
  useOverlay('book', open ? (
    <Panel title="Livro de Registros" onExit={() => setOpen(false)}>
      <div style={{ background: 'linear-gradient(180deg,#f3e7cc,#e2cfa6)', color: '#3a2412', borderRadius: 12, padding: '10px 12px', fontWeight: 700 }}>
        {BOOK_ROWS.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px dashed rgba(58,36,18,.3)', flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 150 }}>{r.label}</span>
            {r.opts.map((o) => <button key={o} className={'chipbtn' + (ans[i] === o ? ' on' : '')} style={{ color: ans[i] === o ? '#1b1206' : '#3a2412', borderColor: '#8a6a3a', minWidth: 46, minHeight: 40 }}
              onClick={() => { SFX.play(o === r.a ? 'tick' : 'error'); setAns((a) => a.map((x, j) => (j === i ? o : x))); if (o !== r.a) G().showToast(i === 0 ? 'Conte de novo as estrelas de Órion (eram as do desenho).' : i === 1 ? 'A sombra apontou para as 12h, o meio-dia.' : 'Das 9h até as 12h: conte as marcas.') }}>{o}</button>)}
          </div>
        ))}
        {plei && <div style={{ display: 'flex', gap: 8, padding: '6px 0' }}><span style={{ flex: 1 }}>Estrelas das Plêiades (luneta)</span><b>6</b></div>}
      </div>
      {ok && <p style={{ marginTop: 10 }}>Uma tabela de números: o mundo representado.</p>}
    </Panel>
  ) : null, [open, ans, plei])
  return (
    <group>
      <group position={BOOK}>
        <Solid><mesh position={[0, 0.5, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.6, 1, 0.5]} /></mesh></Solid>
        <mesh position={[0, 1.08, 0.02]} rotation={[-0.35, 0, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.9, 0.08, 0.6]} /></mesh>
        <mesh position={[0, 1.14, 0.03]} rotation={[-0.35, 0, 0]}><boxGeometry args={[0.8, 0.04, 0.5]} /><meshStandardMaterial color="#f3e7cc" emissive={done ? '#ffae4a' : '#000'} emissiveIntensity={done ? 0.4 : 0} /></mesh>
      </group>
      <Interactable id="book" label="Abrir o Livro de Registros" position={[BOOK[0], BOOK[1], BOOK[2] + 1.1]} radius={2} onUse={run} markerY={2.2} enabled={true} color={obs && med && !done ? '#ffd27a' : '#9fe9ff'} />
    </group>
  )
}

/* =================== globo celeste (prop) =================== */
function GlobeSpot() {
  const globe = useRef<THREE.Mesh>(null!)
  const spin = useRef(0)
  useFrame((_, dt) => { if (globe.current) { globe.current.rotation.y += dt * (0.1 + spin.current); spin.current *= Math.exp(-dt * 0.8) } })
  const use = () => {
    spin.current = 6; SFX.play('whoosh')
    start('globe', async (c) => {
      if (c.flag('a1_globe')) return
      c.setFlag('a1_globe')
      await c.wait(1)
      c.discover('espaco_rep')
      await c.say({ who: 'NOVA', text: 'O globo põe o céu inteiro na sua mão. Cada estrela vira um ponto com coordenadas: dois números dizem onde ela está.' }, { ambient: true })
    })
  }
  return (
    <group>
      <CelestialGlobe ref={globe} position={GLOBE} s={1.1} />
      <Interactable id="globe" label="Girar o globo celeste" position={[GLOBE[0] - 1, GLOBE[1], GLOBE[2]]} radius={2} onUse={use} markerY={2.6} color="#9fe9ff" />
    </group>
  )
}

/* =================== passagem secreta + laboratório oculto (História dos Calculadores) =================== */
const HIST = [
  { id: 'h_abaco', name: 'Ábaco', when: 'há milhares de anos', text: 'Contas que deslizam em hastes. Cada haste é uma casa: unidades, dezenas, centenas. Usado até hoje em várias partes do mundo.' },
  { id: 'h_anti', name: 'Mecanismo de Anticítera', when: 'Grécia, ~100 a.C.', text: 'Achado num naufrágio: dezenas de engrenagens de bronze que previam eclipses e a posição dos astros. Uma calculadora de 2.000 anos.' },
  { id: 'h_astro', name: 'Astrolábio', when: 'Antiguidade e Idade Média', text: 'Um disco para medir a altura das estrelas e descobrir a hora e a latitude. Navegadores e astrônomos o levavam para todo lado.' },
  { id: 'h_napier', name: 'Ossos de Napier', when: 'Escócia, 1617', text: 'Bastões com tabuadas gravadas. Encaixando-os lado a lado, multiplicações viravam somas simples.' },
  { id: 'h_pascal', name: 'Pascalina', when: 'França, 1642', text: 'Blaise Pascal, aos 19 anos, criou uma caixa com rodas dentadas que somava sozinha para ajudar o pai, cobrador de impostos.' },
]
function MiniModel({ id }: { id: string }) {
  if (id === 'h_abaco') return <group scale={0.35} position={[0, -0.25, 0]}><Abacus position={[0, -0.9, 0]} /></group>
  if (id === 'h_anti') return <group rotation={[Math.PI / 2.4, 0, 0]}><mesh material={MAT.bronzeDark()}><cylinderGeometry args={[0.32, 0.32, 0.06, 28]} /></mesh><mesh position={[0, 0.04, 0]} material={MAT.copper()}><torusGeometry args={[0.24, 0.03, 6, 24]} /></mesh><mesh position={[0.1, 0.05, 0.05]} material={MAT.bronze()}><cylinderGeometry args={[0.1, 0.1, 0.05, 14]} /></mesh></group>
  if (id === 'h_astro') return <group rotation={[0, 0, 0]}><mesh material={MAT.gold()}><torusGeometry args={[0.3, 0.035, 8, 32]} /></mesh><mesh material={MAT.bronze()}><cylinderGeometry args={[0.27, 0.27, 0.02, 28]} /></mesh><mesh rotation={[0, 0, 0.6]} material={MAT.gold()}><boxGeometry args={[0.56, 0.03, 0.03]} /></mesh></group>
  if (id === 'h_napier') return <group>{[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[(i - 2) * 0.1, 0, 0]} material={MAT.marble()}><boxGeometry args={[0.08, 0.5, 0.04]} /></mesh>)}</group>
  return <group><mesh material={MAT.woodDark()}><boxGeometry args={[0.6, 0.18, 0.3]} /></mesh>{[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[(i - 2) * 0.11, 0.1, 0]} rotation={[0, 0, 0]} material={MAT.bronze()}><cylinderGeometry args={[0.045, 0.045, 0.03, 12]} /></mesh>)}</group>
}
function HiddenLabContent() {
  const secret = useFlag('a1_secret')
  const seen = useGame((s) => HIST.filter((h) => s.flags[h.id]).length)
  const [card, setCard] = useState<null | typeof HIST[0]>(null)
  const [x, y, z] = P.lab
  const pos = (i: number): V3 => [x - 4 + i * 2, y, z - 2.2 + Math.abs(i - 2) * 0.5]
  const exam = (h: typeof HIST[0]) => {
    setCard(h); SFX.play('chime')
    start('hist', async (c) => {
      c.quest('q_hist', 'active', 'História dos Calculadores')
      c.setFlag(h.id)
      if (HIST.every((k) => G().flags[k.id]) && G().quests.q_hist !== 'done') {
        await c.wait(0.6)
        c.discover('hist_calculo')
        c.quest('q_hist', 'done', 'História dos Calculadores')
        await c.say([{ who: 'NOVA', text: 'Ábaco, engrenagens, bastões, rodas dentadas… Cada geração inventou um jeito de deixar a máquina fazer a conta.' }, { who: 'NEX', text: 'Então a ideia de “máquina que calcula” é bem mais velha que o computador!' }], { ambient: true })
      }
    })
  }
  useOverlay('hist', card ? (
    <Panel title={card.name} onExit={() => setCard(null)}>
      <p style={{ color: 'var(--gold-2)', marginBottom: 4 }}>{card.when}</p>
      <p>{card.text}</p>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>Peças examinadas: {seen}/5</p>
    </Panel>
  ) : null, [card, seen])
  return (
    <group>
      {/* livro torto que abre a passagem */}
      {!secret && <Interactable id="secret" label="Puxar o livro torto" position={SECRET} radius={1.8} onUse={() => start('secret', async (c) => { c.setFlag('a1_secret'); SFX.play('stone'); await c.say({ who: 'NOVA', text: 'Uma passagem secreta atrás da estante! Vamos ver o que tem ali.' }, { ambient: true }) })} markerY={1.9} color="#9fe9ff">
        <mesh position={[0.1, 1.55, -0.62]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.08, 0.45, 0.3]} /><meshStandardMaterial color="#2a5a8a" emissive="#1a5aff" emissiveIntensity={0.8} /></mesh>
      </Interactable>}
      {HIST.map((h, i) => (
        <group key={h.id}>
          <Pedestal position={pos(i)} h={1.1} r={0.4} />
          <group position={[pos(i)[0], y + 1.45, pos(i)[2]]}><MiniModel id={h.id} /></group>
          <Interactable id={h.id} label={'Examinar: ' + h.name} position={[pos(i)[0], y, pos(i)[2] + 0.9]} radius={1.3} onUse={() => exam(h)} marker={!G().flags[h.id]} markerY={2.3} color="#9fe9ff" />
        </group>
      ))}
    </group>
  )
}

/* =================== side quest: O Ábaco (balcão da torre) =================== */
function AbacusSpot() {
  const done = useGame((s) => s.quests.q_abaco === 'done')
  const ab = useRef<any>(null)
  const [open, setOpen] = useState(false)
  const [cnt, setCnt] = useState([0, 0, 0]) // centenas, dezenas, unidades
  const [phase, setPhase] = useState<'eight' | 'add' | 'done'>('eight')
  const [added, setAdded] = useState(0)
  useFrame(() => {
    const b = ab.current?.beads
    if (!b) return
    for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) { const m = b[r][i]; if (!m) continue; const counted = i < cnt[r]; const want = counted ? -0.72 + i * 0.075 : 0.72 - (9 - i) * 0.075; m.position.x += (want - m.position.x) * 0.25 }
  })
  const onBead = (r: number, i: number) => {
    if (phase !== 'eight' || r !== 2) return
    SFX.play('bead')
    setCnt((c) => { const n = [...c]; n[2] = i < c[2] ? i : i + 1; if (n[2] === 8) setTimeout(() => { setPhase('add'); SFX.play('chime') }, 400); return n })
  }
  const plusOne = () => {
    if (cnt[2] >= 10 || added >= 7) return
    SFX.play('bead')
    setCnt((c) => [c[0], c[1], c[2] + 1]); setAdded((a) => a + 1)
  }
  const carry = () => { SFX.play('success'); setCnt((c) => [c[0], c[1] + 1, c[2] - 10]) }
  const fin = phase === 'add' && added === 7 && cnt[1] === 1 && cnt[2] === 5
  const run = () => start('abaco', async (c) => {
    c.quest('q_abaco', 'active', 'O Ábaco')
    setCnt([0, 0, 0]); setPhase('eight'); setAdded(0); setOpen(true); openRef.current = true
    c.focus([ABACUS[0], ABACUS[1] + 1.9, ABACUS[2] - 2.4], [ABACUS[0], ABACUS[1] + 1.2, ABACUS[2]], 42)
    await c.say({ who: 'NOVA', text: 'Vamos fazer 8 + 7 sem escrever nada. Primeiro, empurre 8 contas amarelas (unidades) para a esquerda.' }, { ambient: true })
    await c.until(() => finRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    setPhase('done')
    await c.wait(0.8)
    await c.say([
      { who: 'NEX', text: '1 dezena e 5 unidades… 15!' },
      { who: 'NOVA', text: 'Na Mesopotâmia, há mais de 4.000 anos, mercadores contavam com pedrinhas em sulcos. O ábaco nasceu dessa ideia, e foi usado por milhares de anos.' },
      { who: 'NOVA', text: 'Quando a fileira encheu, você trocou 10 contas por 1 na fileira de cima. Agrupar assim deixa números grandes pequenos de guardar.' },
    ])
    c.discover('abaco')
    c.quest('q_abaco', 'done', 'O Ábaco')
    setOpen(false); c.unfocus()
  })
  const finRef = useRef(fin); finRef.current = fin
  const openRef = useRef(open); openRef.current = open
  useOverlay('abaco', open ? (
    <Panel title="O Ábaco · 8 + 7" onExit={() => setOpen(false)}>
      {phase === 'eight' && <p>Toque nas contas amarelas para empurrar <b>8</b> para a esquerda. Agora: <b>{cnt[2]}</b></p>}
      {phase === 'add' && <>
        <p>Agora some mais 7, uma conta por vez. Cada fileira só cabe 10! {cnt[2] >= 10 && <b>Fileira cheia: troque 10 unidades por 1 dezena.</b>}</p>
        <div className="row">
          <button className="btn" onClick={plusOne} disabled={cnt[2] >= 10 || added >= 7}>+1 unidade ({added}/7)</button>
          {cnt[2] >= 10 && <button className="btn primary" onClick={carry}>Trocar 10 → 1 dezena</button>}
        </div>
      </>}
      <div className="big">{cnt[1]} dezena{cnt[1] === 1 ? '' : 's'} · {cnt[2]} unidade{cnt[2] === 1 ? '' : 's'} = {cnt[1] * 10 + cnt[2]}</div>
    </Panel>
  ) : null, [open, cnt, phase, added])
  return (
    <group>
      <Abacus ref={ab} position={ABACUS} rotY={Math.PI} onBead={onBead} />
      <Interactable id="abaco" label={done ? 'Usar o ábaco' : 'Usar o ábaco gigante'} position={[ABACUS[0], ABACUS[1], ABACUS[2] - 1.2]} radius={1.8} onUse={run} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =================== side quest: O Mapa do Céu (jardim) =================== */
const CRUZ: { p: [number, number]; real: boolean; name: string }[] = [
  { p: [0, -2.8], real: true, name: 'Gacrux' }, { p: [0.4, 2.6], real: true, name: 'Acrux' }, { p: [-2.0, 0.1], real: true, name: 'Mimosa' }, { p: [2.0, -0.6], real: true, name: 'Pálida' }, { p: [1.0, 1.0], real: true, name: 'Intrometida' },
  { p: [-3.0, -2.4], real: false, name: '' }, { p: [3.0, 2.3], real: false, name: '' }, { p: [-2.7, 2.7], real: false, name: '' },
]
const CRUZ_EDGES = [[0, 1], [2, 3]]
function StarMap() {
  const done = useGame((s) => s.quests.q_mapa === 'done')
  const [lit, setLit] = useState<boolean[]>(() => CRUZ.map((c, i) => done && c.real))
  const [bad, setBad] = useState(-1)
  const last = useRef(-1)
  const [gx, , gz] = P.garden
  const world = (i: number) => new THREE.Vector3(gx + CRUZ[i].p[0], 0.1, gz + CRUZ[i].p[1])
  const step = (i: number) => {
    if (done || lit[i]) return
    if (!CRUZ[i].real) { setBad(i); SFX.play('error'); setTimeout(() => setBad(-1), 700); start('mapbad', async (c) => { await c.say({ who: 'NOVA', text: 'Essa estrela não faz parte do desenho. Procure as douradas maiores.' }, { ambient: true }) }); return }
    SFX.play('count')
    const n = lit.map((x, j) => x || j === i)
    setLit(n)
    start('mapq', async (c) => {
      c.quest('q_mapa', 'active', 'O Mapa do Céu')
      if (CRUZ.every((s, j) => !s.real || n[j])) {
        SFX.play('discover')
        await c.wait(1)
        await c.say([
          { who: 'NEX', text: 'Uma cruz! Os pontos viraram um desenho.' },
          { who: 'NOVA', text: 'É o Cruzeiro do Sul. Pontos, depois linhas, depois um padrão. Encontrar padrões em muitos dados é exatamente o que uma LLM faz com textos.' },
        ])
        c.discover('padroes')
        c.quest('q_mapa', 'done', 'O Mapa do Céu')
      }
    })
  }
  useFrame(() => {
    if (done) return
    for (let i = 0; i < CRUZ.length; i++) {
      const w = world(i)
      if (Math.hypot(RT.player.x - w.x, RT.player.z - w.z) < 0.6 && RT.player.y < 1) { if (last.current !== i) { last.current = i; step(i) } return }
    }
    last.current = -1
  })
  const allLit = CRUZ.every((s, j) => !s.real || lit[j]) || done
  return (
    <group>
      {CRUZ.map((s, i) => {
        const w = world(i)
        const on = lit[i] || (done && s.real)
        return (
          <group key={i} position={[w.x, 0.09, w.z]} onClick={(e) => { e.stopPropagation(); if (Math.hypot(RT.player.x - w.x, RT.player.z - w.z) < 6) step(i) }}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><circleGeometry args={[s.real ? 0.42 : 0.3, 5]} /><meshStandardMaterial color={bad === i ? '#ff5a5a' : on ? '#fff1b8' : s.real ? '#d9a648' : '#9c8a6a'} emissive={on ? '#ffc04a' : s.real ? '#6a4a10' : '#000'} emissiveIntensity={on ? 3 : 0.6} /></mesh>
            {on && <Sparkles count={8} scale={1.2} size={4} speed={0.6} color="#ffe2a3" position={[0, 0.4, 0]} />}
          </group>
        )
      })}
      {CRUZ_EDGES.map(([a, b], i) => (lit[a] && lit[b]) || done ? <Line key={i} points={[world(a).setY(0.14), world(b).setY(0.14)]} color="#ffd98a" lineWidth={4} toneMapped={false} /> : null)}
      {allLit && <group position={[gx, 9, gz - 2]}>
        {CRUZ_EDGES.map(([a, b], i) => <Line key={i} points={[new THREE.Vector3(CRUZ[a].p[0] * 1.6, -CRUZ[a].p[1] * 1.6, 0), new THREE.Vector3(CRUZ[b].p[0] * 1.6, -CRUZ[b].p[1] * 1.6, 0)]} color="#ffe2a3" lineWidth={3} transparent opacity={0.8} toneMapped={false} />)}
        {CRUZ.filter((s) => s.real).map((s, i) => <mesh key={i} position={[s.p[0] * 1.6, -s.p[1] * 1.6, 0]} geometry={starGeo} scale={0.25}><meshBasicMaterial color="#fff4d6" toneMapped={false} /></mesh>)}
      </group>}
    </group>
  )
}

/* =================== 4. a cúpula (final da área) =================== */
function DomeFinale() {
  const open = useFlag('a1_dome_open')
  const g = useRef<THREE.Group>(null!)
  const t = useRef(0)
  const nums = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ n: String([7, 6, 12, 3, 9, 15, 1, 0, 4][i % 9]), a: (i / 18) * Math.PI * 2, r: 6 + (i % 4) * 2.5, h: 22 + (i % 5) * 3, d: i * 0.12 })), [])
  useFrame((_, dt) => {
    if (!open || !g.current) return
    t.current += dt
    g.current.children.forEach((c, i) => {
      const it = nums[i]
      const k = THREE.MathUtils.clamp((t.current - 4 - it.d) / 2.2, 0, 1)
      const e = k * k * (3 - 2 * k)
      const from = new THREE.Vector3(P.dome[0] + Math.cos(it.a) * it.r, P.dome[1] + it.h, P.dome[2] + Math.sin(it.a) * it.r)
      const to = new THREE.Vector3(RT.player.x, RT.player.y + 1.1, RT.player.z)
      c.position.lerpVectors(from, to, e)
      c.visible = t.current > 2 && e < 0.98
      c.scale.setScalar(1.6 * (1 - e * 0.85))
      if (RT.camera) c.quaternion.copy(RT.camera.quaternion)
    })
  })
  if (!open) return null
  return (
    <group>
      <group ref={g}>{nums.map((it, i) => <Text key={i} font={FONT.mono} fontSize={1} color="#9fe9ff" anchorX="center" anchorY="middle">{it.n}<meshBasicMaterial attach="material" color="#bff3ff" toneMapped={false} /></Text>)}</group>
      <Sparkles count={80} scale={[16, 12, 16]} position={[P.dome[0], P.dome[1] + 16, P.dome[2]]} size={6} speed={0.5} color="#ffe2a3" />
    </group>
  )
}
function DomeConsole() {
  const rep = useFlag('a1_rep')
  const open = useFlag('a1_dome_open')
  const run = () => start('dome', async (c) => {
    if (!c.flag('a1_rep')) { await c.say({ who: 'NOVA', text: 'O mecanismo está travado. Antes, registre suas observações no Livro da Biblioteca.' }, { ambient: true }); return }
    if (c.flag('a1_dome_open')) return
    c.objective(null)
    c.freeze(true)
    gesture('reach', 1.6)
    SFX.play('gear')
    const [x, y, z] = P.dome
    c.setFlag('a1_dome_open')
    SFX.play('stone')
    await c.cinematic([
      { pos: [x + 5, y + 2, z + 5], look: [x, y + 9, z - 1], dur: 0.01, cut: true },
      { pos: [x + 3, y + 1.6, z + 4], look: [x, y + 16, z - 2], dur: 4.5, fov: 62 },
      { pos: [x - 4, y + 2, z + 5], look: [RT.player.x, RT.player.y + 1.2, RT.player.z], dur: 3.5, fov: 50 },
    ], false)
    SFX.play('core')
    await c.say([
      { who: 'NEX', text: 'O céu inteiro… e as estrelas estão virando números!' },
      { who: 'NOVA', text: 'Você observou, mediu e representou. É assim que o mundo entra numa máquina: como números.' },
      { who: 'NEX', text: 'Mas números de estrelas não são palavras. Como isso vira uma máquina de linguagem?' },
      { who: 'NOVA', text: 'Uma coisa de cada vez. Primeiro precisamos aprender a lidar com muitos números. O portal ao lado da entrada acabou de acordar.' },
    ])
    c.freeze(false)
    c.setFlag('a1_done')
  })
  return (
    <group position={CONSOLE}>
      <Solid>
        <mesh position={[0, 0.5, 0]} material={MAT.bronzeDark()} castShadow><cylinderGeometry args={[0.35, 0.5, 1, 12]} /></mesh>
      </Solid>
      <mesh position={[0, 1.05, 0]} rotation={[-0.5, 0, 0]} material={MAT.gold()}><boxGeometry args={[0.8, 0.08, 0.5]} /></mesh>
      <mesh position={[0, 1.1, 0.02]} rotation={[-0.5, 0, 0]} material={MAT.glowBlue()}><boxGeometry args={[0.3, 0.04, 0.2]} /></mesh>
      <Interactable id="dome" label="Abrir a cúpula" position={[0, 0, 0.9]} radius={2.2} onUse={run} enabled={!open} markerY={2} color={rep ? '#ffd27a' : '#9fe9ff'} />
    </group>
  )
}

/* =================== portal para a Área 2 =================== */
function PortalUse() {
  const on = useFlag('a1_done')
  return <Interactable id="portal1" label="Atravessar o portal" position={PORTAL_USE} radius={3} enabled={!!on} onUse={() => start('portal1', async (c) => { c.objective(null); c.goto('p1a2') })} markerY={5.5} color="#7fe3ff" />
}

/* =================== roteiro =================== */
async function main(c: Ctx) {
  if (!c.flag('a1_intro')) {
    await c.cinematic([
      { pos: [70, 46, 80], look: [0, 6, 0], dur: 0.01, cut: true },
      { pos: [38, 26, 58], look: [0, 7, -8], dur: 6 },
      { pos: [-22, 12, 42], look: [0, 5, 4], dur: 4.5 },
      { pos: [0, 2.8, 44.5], look: [0, 2.4, 34], dur: 3 },
    ])
    await c.say([
      { who: 'NEX', text: 'Uau… onde estamos?' },
      { who: 'NOVA', text: 'No Observatório. Muito antes dos computadores, foi assim que tudo começou: pessoas olhando para o céu.' },
      { who: 'NOVA', text: 'Cada canto daqui lembra uma época: o Egito antigo, a Grécia, a Itália de Galileu, a Mesopotâmia. As placas de pedra contam quando cada ideia surgiu.' },
      { who: 'NEX', text: 'E o que olhar o céu tem a ver com uma máquina de linguagem?' },
      {
        who: 'NOVA', text: 'Tudo. Uma máquina só entende o que consegue representar. E representar começa com observar e medir.', choices: [
          { label: 'O que é representar?', next: [{ who: 'NOVA', text: 'Trocar uma coisa por um símbolo que a substitui. Você vai entender fazendo.' }] },
          { label: 'Por onde começo?', next: [] },
        ],
      },
      { who: 'NOVA', text: 'Suba a escadaria e vá ao Terraço Celeste, à esquerda da praça. Tem um telescópio esperando por você.' },
    ])
    c.setFlag('a1_intro')
  }
  const tel: Vec3 = [TEL[0] + 1.4, TEL[1], TEL[2] + 1.2]
  if (!c.flag('a1_obs')) { c.objective('Observe o céu pelo telescópio do Terraço Celeste', tel); await c.waitFlag('a1_obs') }
  if (!c.flag('a1_med')) {
    c.objective('Meça o tempo no Relógio de Sol (leste da praça)', [DIAL[0], DIAL[1], DIAL[2] + 4.2])
    await c.say({ who: 'NOVA', text: 'Observar é só o começo. Agora vamos medir: o relógio de sol fica do outro lado da praça, a leste.' }, { ambient: true })
    await c.waitFlag('a1_med')
  }
  if (!c.flag('a1_rep')) {
    c.objective('Registre tudo no Livro da Biblioteca (ao norte do relógio)', [BOOK[0], BOOK[1], BOOK[2] + 1.1])
    await c.say({ who: 'NOVA', text: 'Você observou e mediu. Falta guardar: a biblioteca fica logo ao norte do relógio de sol.' }, { ambient: true })
    await c.waitFlag('a1_rep')
  }
  if (!c.flag('a1_dome_open')) {
    c.objective('Suba até a Cúpula Principal e abra o teto', [CONSOLE[0], CONSOLE[1], CONSOLE[2] + 0.9])
    await c.say({ who: 'NOVA', text: 'Agora sim. A Cúpula Principal, no alto da escadaria norte, pode abrir o céu inteiro.' }, { ambient: true })
    await c.waitFlag('a1_done')
  }
  c.objective('Atravesse o portal (oeste da entrada)', PORTAL_USE)
}

/* dicas da NOVA quando o NEX chega perto de lugares */
function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[]) {
  return async (c: Ctx) => {
    if (c.flag('h_' + id)) return
    await c.reach(pos, r)
    c.setFlag('h_' + id)
    await c.say(lines as any, { ambient: true })
  }
}
const hints = [
  hint('statues', P.plaza, 9, [{ who: 'NOVA', text: 'Estes sábios gregos passavam noites inteiras anotando o céu. A esfera de anéis no meio da fonte é um modelo do céu que eles usavam.' }]),
  hint('tower', [P.tower[0], P.tower[1], P.tower[2] + 7], 4, [{ who: 'NOVA', text: 'A Torre dos Astros! Dá para subir pela rampa em espiral. Lá no meio tem um instrumento curioso.' }]),
  hint('garden', P.garden, 9, [{ who: 'NOVA', text: 'Olha o chão do jardim: um mapa de estrelas! Pise nas estrelas douradas para ligá-las.' }]),
  hint('lib', [P.lib[0], P.lib[1], P.lib[2] + 6], 4, [{ who: 'NOVA', text: 'A Biblioteca. Tem um livro torto na estante do fundo… estranho.' }]),
  hint('lun', LUN, 3, [{ who: 'NOVA', text: 'Uma luneta menor, apontada para outro canto do céu. Tem alguma coisa estranha ali.' }]),
  hint('portal', P.portal, 7, [{ who: 'NOVA', text: 'Um portal antigo, apagado. Quando terminarmos aqui, ele deve acordar.' }]),
  hint('lab', P.lab, 4, [{ who: 'NOVA', text: 'Um laboratório escondido! São instrumentos antigos de cálculo. Examine cada um.' }]),
]

export default function Observatorio() {
  useLevel({ spawn: P.spawn, yaw: Math.PI, scripts: [main, ...hints], minY: -20 })
  const secret = useFlag('a1_secret')
  const portalOn = useFlag('a1_done')
  return (
    <>
      <SkyDome preset="sunset" custom={OBS_SKY} />
      <Lights preset="sunset" custom={OBS_SKY} sunI={2.4} hemiI={1.15} />
      <Planet />
      <CloudSea y={-34} />
      <CloudPuffs n={22} />
      <FloatingIslands n={14} />
      <Dust count={110} scale={[90, 16, 90]} position={[0, 8, 0]} />
      <ObservatoryMap secretOpen={!!secret} portalOn={!!portalOn} />
      <Eras />
      <Orion />
      <TerraceTelescope />
      <Luneta />
      <SundialSpot />
      <HourglassSpot />
      <RecordBook />
      <GlobeSpot />
      <HiddenLabContent />
      <AbacusSpot />
      <StarMap />
      <DomeConsole />
      <DomeFinale />
      <PortalUse />
    </>
  )
}
