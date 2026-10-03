import * as THREE from 'three'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text, RoundedBox } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { SkyDome, Lights, Dust } from '../../world/Atmosphere'
import { Interactable, Solid, Block, useFlag } from '../../world/core'
import { Batch, Column, Lantern, Statue, RingBalustrade, Balustrade, RectPlatform } from '../../world/Architecture'
import { Portal } from '../../world/Instruments'
import { Gate, Lift, useNear } from '../../world/mechanics'
import { MAT } from '../../world/materials'
import { useOverlay, Panel } from '../../world/puzzle'
import { FONT } from '../../world/fonts'
import { RT, gesture } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, QUICK, type Ctx } from '../../engine/script'
import { G, useGame, type Vec3 } from '../../store'
import { stoneTiles } from '../../world/textures'

/* =========================================================
   FASE 1 · ÁREA 4 — A CÂMARA DA PROBABILIDADE
   Conceito: incerteza → possibilidades → previsão.
   Piso (dados) → Plataforma (três portas: 80/15/5%) → Anel (roleta do futuro)
   → Observatório superior (a próxima palavra) → portal.
   ========================================================= */
type V3 = [number, number, number]
const SKY = { zenith: '#05061a', mid: '#1c1250', horizon: '#3a2276', below: '#120a30', sunCol: '#9a8cff', sun: [0.2, 0.8, -0.3] as V3, stars: 1.6, fog: '#140c34', fogNear: 40, fogFar: 160, hemi: '#5a4aa8' }
const R = 26 // raio da câmara
const Y1 = 5, Y2 = 11, Y3 = 18
const P = {
  spawn: [0, 0, 19] as V3,
  dice: [0, 0, 0] as V3,
  graph: [9.5, 0, 0] as V3,
  lift1: [0, 0, 11.6] as V3,
  doorsA: -Math.PI / 2 - 0.3, doorsB: -Math.PI / 2, doorsC: -Math.PI / 2 + 0.3,
  lift2: [0, Y1, -15.4] as V3,
  wheel: [21.5, Y2, 0] as V3,
  lift3: [0, Y2, 22] as V3,
  top: [0, Y3, 0] as V3,
  portal: [0, Y3, -4] as V3,
}
const polar = (a: number, r: number, y: number): V3 => [Math.cos(a) * r, y, Math.sin(a) * r]

/* =================== câmara =================== */
function dotsTex() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512
  const c = cv.getContext('2d')!
  c.fillStyle = '#1a1238'; c.fillRect(0, 0, 512, 512)
  c.strokeStyle = 'rgba(140,110,255,.25)'; c.lineWidth = 2
  for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 512); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(512, i * 64); c.stroke() }
  for (let i = 0; i < 260; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = Math.random() * 2.2 + 0.6; c.fillStyle = Math.random() < 0.7 ? 'rgba(170,150,255,.9)' : 'rgba(255,220,140,.9)'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill() }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 4); t.colorSpace = THREE.SRGBColorSpace
  return t
}
function Ring({ y, r0, r1, rail = true, gaps = [] as [number, number][] }: { y: number; r0: number; r1: number; rail?: boolean; gaps?: [number, number][] }) {
  return (
    <group>
      <Solid>
        <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.floor(1)} receiveShadow><ringGeometry args={[r0, r1, 72, 1]} /></mesh>
      </Solid>
      <mesh position={[0, y - 0.3, 0]} material={MAT.stoneDark()} userData={{ noCollide: true }}><cylinderGeometry args={[r0, r0, 0.6, 72, 1, true]} /></mesh>
      <mesh position={[0, y - 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.stoneDark()} userData={{ noCollide: true }}><ringGeometry args={[r0, r1, 72, 1]} /></mesh>
      <mesh position={[0, y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.glowViolet()} userData={{ noCollide: true }}><ringGeometry args={[r0 + 0.15, r0 + 0.3, 72, 1]} /></mesh>
      {rail && <RingBalustrade center={[0, y, 0]} r={r0 + 0.3} gaps={gaps} seg={36} />}
    </group>
  )
}
function Chamber() {
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: dotsTex(), emissive: '#ffffff', emissiveMap: dotsTex(), emissiveIntensity: 0.55, roughness: 0.8, side: THREE.BackSide }), [])
  const floorMat = useMemo(() => { const t = stoneTiles('probTiles', '#4a3e78', '#231a44', 6); const m = t.map.clone(); m.repeat.set(8, 8); m.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: m, roughness: 0.4, metalness: 0.3 }) }, [])
  return (
    <Batch>
      <mesh position={[0, 14, 0]} material={wallMat} userData={{ noCollide: true }}><cylinderGeometry args={[R + 0.5, R + 0.5, 34, 72, 1, true]} /></mesh>
      <mesh position={[0, 31, 0]} material={wallMat} userData={{ noCollide: true }}><sphereGeometry args={[R + 0.5, 48, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} /></mesh>
      <Solid><mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMat} receiveShadow><circleGeometry args={[R, 72]} /></mesh></Solid>
      {Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return <Block key={i} size={[5, 40, 1]} position={[Math.cos(a) * (R - 0.3), 18, Math.sin(a) * (R - 0.3)]} rotation={[0, -a + Math.PI / 2, 0]} /> })}
      {/* anéis concêntricos de luz no chão */}
      {[3, 6, 9].map((r, i) => <mesh key={i} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.glowViolet()} userData={{ noCollide: true }}><ringGeometry args={[r, r + 0.06, 96]} /></mesh>)}
      {/* plataforma (Y1), anel (Y2) */}
      <Ring y={Y1} r0={13} r1={R - 0.4} gaps={[[Math.PI / 2 - 0.12, Math.PI / 2 + 0.12]]} />
      <Ring y={Y2} r0={16} r1={R - 0.4} gaps={[[Math.PI * 1.5 - 0.14, Math.PI * 1.5 + 0.14]]} />
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + 0.26; return <Column key={i} position={[Math.cos(a) * 13.6, 0, Math.sin(a) * 13.6]} h={Y1 - 0.6} r={0.32} /> })}
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + 0.26; return <Column key={'b' + i} position={[Math.cos(a) * 16.6, Y1, Math.sin(a) * 16.6]} h={Y2 - Y1 - 0.6} r={0.3} /> })}
      {/* observatório superior: disco no centro + ponte a partir do anel */}
      <Solid><mesh position={[0, Y3 - 0.3, 0]} material={MAT.stoneDark()} castShadow receiveShadow><cylinderGeometry args={[7.5, 7, 0.6, 48]} /></mesh></Solid>
      <mesh position={[0, Y3 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.floor(2)} userData={{ noCollide: true }}><circleGeometry args={[7.3, 48]} /></mesh>
      <RingBalustrade center={[0, Y3, 0]} r={7.2} gaps={[[Math.PI / 2 - 0.25, Math.PI / 2 + 0.25]]} seg={24} />
      <RectPlatform position={[0, Y3, 13.4]} size={[3.2, 0.5, 12]} rep={1} />
      <Balustrade from={[-1.7, Y3, 7.4]} to={[-1.7, Y3, 19.4]} />
      <Balustrade from={[1.7, Y3, 7.4]} to={[1.7, Y3, 19.4]} />
      <Solid><mesh position={[0, Y3 - 0.3, 20.6]} material={MAT.stoneDark()}><boxGeometry args={[4.4, 0.6, 2.4]} /></mesh></Solid>
      {/* pedestal da cúpula de vidro (óculo) */}
      <mesh position={[0, 30.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><torusGeometry args={[6, 0.3, 8, 48]} /></mesh>
      <Statue position={[-6, 0, 14]} rotY={Math.PI * 0.8} pose="think" s={0.9} />
      <Statue position={[6, 0, 14]} rotY={-Math.PI * 0.8} pose="book" s={0.9} />
      <Lantern position={[-3, 0, 16]} light /><Lantern position={[3, 0, 16]} />
    </Batch>
  )
}

/* esferas flutuantes, roletas nas paredes e luzes */
function Ambience() {
  const g = useRef<THREE.Group>(null!)
  const wheels = useRef<THREE.Group>(null!)
  const spheres = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ a: i * 0.45, r: 6 + (i % 4) * 4, y: 6 + (i % 5) * 4.5, s: 0.25 + (i % 3) * 0.2, c: i % 3 })), [])
  useFrame((_, dt) => {
    g.current?.children.forEach((c, i) => { const s = spheres[i]; const a = s.a + RT.time * 0.08 * (i % 2 ? 1 : -1); c.position.set(Math.cos(a) * s.r, s.y + Math.sin(RT.time + i) * 0.4, Math.sin(a) * s.r) })
    wheels.current?.children.forEach((c, i) => { c.rotation.z += dt * (0.3 + i * 0.15) * (i % 2 ? 1 : -1) })
  })
  const mats = [MAT.glowBlue(), MAT.glowViolet(), MAT.glowWarm()]
  return (
    <group>
      <group ref={g}>{spheres.map((s, i) => <mesh key={i} material={mats[s.c]}><sphereGeometry args={[s.s, 16, 12]} /></mesh>)}</group>
      <group ref={wheels}>
        {[Math.PI * 0.75, Math.PI * 1.25, Math.PI * 0.25].map((a, i) => { const p = polar(a, R - 0.8, 24); return (
          <group key={i} position={p} rotation={[0, -a - Math.PI / 2, 0]}>
            <mesh material={MAT.gold()}><torusGeometry args={[3, 0.12, 8, 48]} /></mesh>
            {Array.from({ length: 8 }, (_, k) => <mesh key={k} rotation={[0, 0, (k / 8) * Math.PI * 2]} position={[0, 0, 0]} material={MAT.bronze()}><boxGeometry args={[0.08, 5.8, 0.06]} /></mesh>)}
          </group>
        ) })}
      </group>
      <Sparkles count={260} scale={[46, 28, 46]} position={[0, 14, 0]} size={3} speed={0.2} color="#b9a8ff" />
      <Sparkles count={90} scale={[40, 20, 40]} position={[0, 12, 0]} size={4} speed={0.3} color="#ffe2a3" />
      <pointLight position={[0, 4, 0]} color="#8a6aff" intensity={12} distance={26} decay={1.4} />
      <pointLight position={[0, Y3 + 3, 0]} color="#59d7ff" intensity={10} distance={24} decay={1.4} />
      <pointLight position={[18, Y2 + 3, 0]} color="#ffb35a" intensity={8} distance={18} decay={1.5} />
    </group>
  )
}

/* =================== 1. Os Dados (frequência) =================== */
const FACE_ROT: Record<number, [number, number, number]> = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2] }
function Pips() {
  const s = 0.6, d = 0.61, p = 0.3
  const L: Record<string, [number, number][]> = { 1: [[0, 0]], 2: [[-p, -p], [p, p]], 3: [[-p, -p], [0, 0], [p, p]], 4: [[-p, -p], [p, -p], [-p, p], [p, p]], 5: [[-p, -p], [p, -p], [0, 0], [-p, p], [p, p]], 6: [[-p, -p], [p, -p], [-p, 0], [p, 0], [-p, p], [p, p]] }
  const pip = (k: string, f: (u: number, v: number) => V3) => L[k].map(([u, v], i) => <mesh key={k + i} position={f(u, v)}><sphereGeometry args={[0.085, 10, 8]} /><meshStandardMaterial color="#1b1238" roughness={0.4} /></mesh>)
  void s
  return <>{pip('1', (u, v) => [u, d, v])}{pip('6', (u, v) => [u, -d, v])}{pip('2', (u, v) => [u, v, d])}{pip('5', (u, v) => [u, v, -d])}{pip('3', (u, v) => [d, u, v])}{pip('4', (u, v) => [-d, u, v])}</>
}
function Die({ dref }: { dref: React.MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={(o) => { dref.current = o }}>
      <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.16} smoothness={4} castShadow><meshStandardMaterial color="#f4efe6" roughness={0.35} /></RoundedBox>
      <Pips />
    </group>
  )
}
function Bars({ counts, position, labels, w = 0.7, h = 3, color = '#8a6aff', expected }: { counts: number[]; position: V3; labels: string[]; w?: number; h?: number; color?: string; expected?: number }) {
  const total = counts.reduce((a, b) => a + b, 0)
  const max = Math.max(1, ...counts)
  const n = counts.length
  return (
    <group position={position}>
      <mesh position={[0, h / 2 + 0.2, -0.1]} userData={{ noCollide: true }}><planeGeometry args={[n * (w + 0.25) + 0.8, h + 1.6]} /><meshBasicMaterial color="#120c30" transparent opacity={0.55} depthWrite={false} /></mesh>
      {counts.map((cnt, i) => {
        const bh = Math.max(0.04, (cnt / max) * h)
        const x = (i - (n - 1) / 2) * (w + 0.25)
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, bh / 2, 0]} userData={{ noCollide: true }}><boxGeometry args={[w, bh, 0.2]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} /></mesh>
            <Text font={FONT.mono} fontSize={0.28} position={[0, -0.3, 0.05]} color="#e8e0ff" anchorX="center">{labels[i]}</Text>
            <Text font={FONT.mono} fontSize={0.22} position={[0, bh + 0.25, 0.05]} color="#ffe2a3" anchorX="center">{total ? Math.round((cnt / total) * 100) + '%' : ''}</Text>
          </group>
        )
      })}
      {expected != null && total > 0 && <mesh position={[0, (expected * total / max) * h, 0.12]} userData={{ noCollide: true }}><boxGeometry args={[n * (w + 0.25), 0.03, 0.02]} /><meshBasicMaterial color="#ffe2a3" toneMapped={false} /></mesh>}
    </group>
  )
}
function DiceArena() {
  const done = useFlag('a4_dice')
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState([0, 0, 0, 0, 0, 0])
  const [last, setLast] = useState<number | null>(null)
  const die = useRef<THREE.Group | null>(null)
  const roll = useRef<{ t0: number; to: number } | null>(null)
  const total = counts.reduce((a, b) => a + b, 0)
  useFrame(() => {
    const d = die.current
    if (!d) return
    const r = roll.current
    if (r) {
      const k = Math.min(1, (performance.now() - r.t0) / 900)
      const target = FACE_ROT[r.to]
      d.position.y = 1.5 + Math.sin(k * Math.PI) * 2.2
      if (k < 1) d.rotation.set(target[0] + (1 - k) * 12, (1 - k) * 9, target[2] + (1 - k) * 7)
      else { d.rotation.set(...target); roll.current = null }
    } else d.position.y = 1.5
  })
  const throwN = (n: number) => {
    const c = [...counts]
    let v = 1
    for (let i = 0; i < n; i++) { v = 1 + Math.floor(Math.random() * 6); c[v - 1]++ }
    setCounts(c); setLast(v)
    roll.current = { t0: performance.now(), to: v }
    SFX.play(n === 1 ? 'bead' : 'gear')
  }
  const run = () => start('dice', async (c) => {
    c.quest('q_dados', 'active', 'Os Dados')
    setOpen(true); openRef.current = true
    c.focus([0, 6.2, 9.4], [0, 2.9, -2.2], 52)
    if (!c.flag('a4_dice_seen')) {
      c.setFlag('a4_dice_seen')
      await c.say([{ who: 'NOVA', text: 'Jogue o dado. Uma vez não diz muita coisa. Jogue muitas vezes e olhe as barras.' }], { ambient: true })
    }
    await c.until(() => totalRef.current >= 120 || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.5)
    setOpen(false); c.unfocus()
    if (!c.flag('a4_dice')) {
      await c.say([
        { who: 'NEX', text: 'No começo um número saía mais que os outros. Agora as barras estão quase iguais!' },
        { who: 'NOVA', text: 'Cada face sai mais ou menos 1 em cada 6 vezes, perto de 17%. Você não sabe qual vai sair na próxima jogada…' },
        { who: 'NOVA', text: '…mas contando muitas jogadas, descobre as chances. Isso se chama frequência.' },
      ])
      c.discover('frequencia')
      c.quest('q_dados', 'done', 'Os Dados')
      c.setFlag('a4_dice')
    }
  })
  const totalRef = useRef(total); totalRef.current = total
  const openRef = useRef(open); openRef.current = open
  useOverlay('dice', open ? (
    <Panel title="Os Dados" onExit={() => setOpen(false)}>
      <p>Jogadas: <b>{total}</b>{last ? <> · última: <b>{last}</b></> : null}. {total < 120 ? `Jogue até ${120} vezes para ver o padrão.` : 'Veja como as barras ficaram parecidas.'}</p>
      <div className="row">
        <button className="btn" onClick={() => throwN(1)}>Jogar 1×</button>
        <button className="btn" onClick={() => throwN(10)}>Jogar 10×</button>
        <button className="btn primary" onClick={() => throwN(50)}>Jogar 50×</button>
      </div>
    </Panel>
  ) : null, [open, total, last])
  return (
    <group>
      <Solid><mesh position={[0, 0.45, 0]} material={MAT.woodDark()} castShadow receiveShadow><cylinderGeometry args={[3.2, 3.4, 0.9, 40]} /></mesh></Solid>
      <mesh position={[0, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><circleGeometry args={[3, 40]} /><meshStandardMaterial color="#1f5a3a" roughness={0.9} /></mesh>
      <mesh position={[0, 0.92, 0]} material={MAT.gold()} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><ringGeometry args={[3, 3.2, 48]} /></mesh>
      <group position={[0, 0, 0]}><Die dref={die} /></group>
      <Bars counts={counts} position={[0, 2.4, -4.2]} labels={['1', '2', '3', '4', '5', '6']} expected={1 / 6} />
      <Interactable id="dice" label={done ? 'Jogar os dados de novo' : 'Jogar o dado gigante'} position={[0, 0, 4.4]} radius={2.4} onUse={run} markerY={2.6} />
    </group>
  )
}

/* =================== 2. O Caminho Mais Provável (três portas) =================== */
const DOOR_R = 18.6, ARC = 0.62, DOOR_HALF = 0.115
const DOORS = [{ k: 'A', a: P.doorsA, p: 0.8, col: '#59d7ff' }, { k: 'B', a: P.doorsB, p: 0.15, col: '#ffb35a' }, { k: 'C', a: P.doorsC, p: 0.05, col: '#ff6aa8' }]
function ThreeDoors() {
  const opened = useFlag('a4_door') // 0 nenhuma; 1..3 qual abriu
  const near = useNear(polar(-Math.PI / 2, 21, Y1), 7, 3)
  const [tries, setTries] = useState({ A: [0, 0], B: [0, 0], C: [0, 0] } as Record<string, [number, number]>)
  const [flash, setFlash] = useState<{ k: string; ok: boolean } | null>(null)
  const tryDoor = (i: number) => {
    const d = DOORS[i]
    if (G().flags.a4_door) return
    start('door-q', async (c) => { c.quest('q_caminho', 'active', 'O Caminho Mais Provável') })
    const ok = Math.random() < d.p
    setTries((t) => ({ ...t, [d.k]: [t[d.k][0] + 1, t[d.k][1] + (ok ? 1 : 0)] }))
    setFlash({ k: d.k, ok }); setTimeout(() => setFlash(null), 1400)
    gesture('reach', 0.8)
    if (!ok) { SFX.play('error'); return }
    SFX.play('success')
    start('door-open', async (c) => {
      c.setFlag('a4_door', i + 1)
      await c.wait(0.8)
      const tot = Object.values(triesRef.current).reduce((a, b) => a + b[0], 0)
      await c.say([
        { who: 'NEX', text: tot <= 1 ? `A porta ${d.k} abriu de primeira!` : `Abriu! Precisei de ${tot} tentativas.` },
        { who: 'NOVA', text: 'Repare nas partículas: a porta A recebe muito mais luz. Ela abre em 80% das tentativas, a B em 15%, a C só em 5%.' },
        { who: 'NOVA', text: 'Escolher a mais provável não garante nada numa tentativa, mas em muitas tentativas acerta muito mais. Isso é probabilidade.' },
      ])
      c.discover('probabilidade')
      c.discover('decisao_prob')
      c.quest('q_caminho', 'done', 'O Caminho Mais Provável')
    })
  }
  const triesRef = useRef(tries); triesRef.current = tries
  useOverlay('doors', near && !opened ? (
    <Panel title="Três portas" top>
      <p style={{ fontSize: 13.5 }}>Cada porta tem uma chance de abrir. Quanto mais luz entra nela, mais provável.</p>
      <div className="row" style={{ gap: 10, fontFamily: 'var(--f-mono)', fontWeight: 800 }}>
        {DOORS.map((d) => <span key={d.k} style={{ color: d.col }}>{d.k}: {Math.round(d.p * 100)}% · {tries[d.k][0]} tent.</span>)}
      </div>
      {flash && <p style={{ textAlign: 'center', marginTop: 6, color: flash.ok ? '#8ff0b0' : '#ff9a9a', fontWeight: 900 }}>{flash.ok ? `A porta ${flash.k} abriu!` : `A porta ${flash.k} não abriu desta vez.`}</p>}
    </Panel>
  ) : null, [near, opened, tries, flash])
  // divisória curva com as três portas; atrás dela fica a sala do elevador
  const segs: [number, number][] = []
  let a0 = -Math.PI / 2 - ARC
  for (const d of DOORS) { segs.push([a0, d.a - DOOR_HALF]); a0 = d.a + DOOR_HALF }
  segs.push([a0, -Math.PI / 2 + ARC])
  return (
    <group>
      <Solid>
        {segs.map(([s0, s1], i) => {
          const p0 = polar(s0, DOOR_R, Y1), p1 = polar(s1, DOOR_R, Y1)
          const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2])
          const yaw = Math.atan2(p1[0] - p0[0], p1[2] - p0[2])
          return <mesh key={i} position={[(p0[0] + p1[0]) / 2, Y1 + 2.4, (p0[2] + p1[2]) / 2]} rotation={[0, yaw, 0]} material={MAT.wall(1)} castShadow receiveShadow><boxGeometry args={[0.8, 4.8, len + 0.1]} /></mesh>
        })}
        {[-1, 1].map((sg) => {
          const a = -Math.PI / 2 + sg * ARC
          const m = polar(a, (12.8 + DOOR_R + 0.4) / 2, Y1 + 2.4)
          return <mesh key={sg} position={m} rotation={[0, Math.PI / 2 - a, 0]} material={MAT.wall(1)} castShadow receiveShadow><boxGeometry args={[0.8, 4.8, DOOR_R + 0.4 - 12.8]} /></mesh>
        })}
      </Solid>
      {segs.map(([s0, s1], i) => { const m = polar((s0 + s1) / 2, DOOR_R + 0.42, Y1 + 4.85); return <mesh key={'t' + i} position={m} rotation={[0, Math.PI / 2 - (s0 + s1) / 2, 0]} material={MAT.gold()} userData={{ noCollide: true }}><boxGeometry args={[(s1 - s0) * DOOR_R, 0.12, 0.08]} /></mesh> })}
      {DOORS.map((d, i) => {
        const p = polar(d.a, DOOR_R, Y1)
        const rot = Math.PI / 2 - d.a
        const isOpen = opened === i + 1
        const front = polar(d.a, DOOR_R + 1.6, Y1)
        const tp = polar(d.a, DOOR_R + 0.62, 0)
        return (
          <group key={d.k}>
            <Gate position={p} rotY={rot} open={isOpen} w={2.4} h={3.4} />
            <Text font={FONT.title} fontSize={0.8} position={[tp[0], Y1 + 4.45, tp[2]]} rotation={[0, rot, 0]} color={d.col} anchorX="center" outlineWidth={0.03} outlineColor="#0a0620">{d.k}</Text>
            <Text font={FONT.mono} fontSize={0.36} position={[tp[0], Y1 + 3.62, tp[2]]} rotation={[0, rot, 0]} color="#ffe2a3" anchorX="center">{Math.round(d.p * 100)}%</Text>
            <Sparkles count={Math.max(4, Math.round(d.p * 120))} scale={[2.2, 3, 2.2]} position={polar(d.a, DOOR_R + 1, Y1 + 1.7)} size={5} speed={1.2} color={d.col} />
            {!opened && <Interactable id={'door' + d.k} label={`Tentar a porta ${d.k} (${Math.round(d.p * 100)}%)`} position={front} radius={1.7} onUse={() => tryDoor(i)} markerY={2.6} color={d.col} />}
          </group>
        )
      })}
    </group>
  )
}

/* =================== 3. O Futuro Incerto (roleta) =================== */
const SEGS = [{ k: 'Azul', p: 0.6, col: '#3fa8ff' }, { k: 'Dourado', p: 0.3, col: '#ffc14a' }, { k: 'Violeta', p: 0.1, col: '#b06aff' }]
function FutureWheel() {
  const done = useFlag('a4_future')
  const [open, setOpen] = useState(false)
  const [bet, setBet] = useState<number | null>(null)
  const [hist, setHist] = useState<{ bet: number; res: number }[]>([])
  const [spinning, setSpinning] = useState(false)
  const wheel = useRef<THREE.Group>(null!)
  const spin = useRef<{ t0: number; from: number; to: number } | null>(null)
  const geo = useMemo(() => { let a0 = 0; return SEGS.map((s) => { const g = new THREE.CircleGeometry(3.2, 48, a0, s.p * Math.PI * 2); a0 += s.p * Math.PI * 2; return g }) }, [])
  useFrame(() => {
    const s = spin.current
    if (!s || !wheel.current) return
    const k = Math.min(1, (performance.now() - s.t0) / 3200)
    const e = 1 - Math.pow(1 - k, 3)
    wheel.current.rotation.z = s.from + (s.to - s.from) * e
    if (k >= 1) spin.current = null
  })
  const doSpin = () => {
    if (bet == null || spinning) return
    const r = Math.random()
    const res = r < SEGS[0].p ? 0 : r < SEGS[0].p + SEGS[1].p ? 1 : 2
    // ângulo do centro do segmento sorteado (ponteiro no topo = PI/2)
    let a0 = 0; for (let i = 0; i < res; i++) a0 += SEGS[i].p * Math.PI * 2
    const mid = a0 + SEGS[res].p * Math.PI + (Math.random() - 0.5) * SEGS[res].p * Math.PI * 1.4
    const cur = wheel.current?.rotation.z || 0
    const target = Math.PI / 2 - mid
    const to = cur - (((cur - target) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI * 2 * 4
    spin.current = { t0: performance.now(), from: cur, to }
    setSpinning(true); SFX.play('gear')
    setTimeout(() => { setHist((h) => [...h, { bet, res }]); setSpinning(false); SFX.play(bet === res ? 'success' : 'error') }, 3300)
  }
  const run = () => start('wheel', async (c) => {
    c.quest('q_futuro', 'active', 'O Futuro Incerto')
    setOpen(true); openRef.current = true
    c.focus([P.wheel[0] - 13.5, Y2 + 4.4, 0.6], [P.wheel[0], Y2 + 1.5, 0], 48)
    if (!c.flag('a4_wheel_seen')) {
      c.setFlag('a4_wheel_seen')
      await c.say([{ who: 'NOVA', text: 'A Roleta do Futuro. Antes de cada giro, aposte numa cor. Gire 5 vezes.' }], { ambient: true })
    }
    await c.until(() => histRef.current.length >= 5 && !spinRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.2)
    setOpen(false); c.unfocus()
    if (!c.flag('a4_future')) {
      const hits = histRef.current.filter((h) => h.bet === h.res).length
      await c.say([
        { who: 'NEX', text: `Acertei ${hits} de ${histRef.current.length}. Dá raiva: nunca sei o que vai sair!` },
        { who: 'NOVA', text: 'Você não pode saber exatamente o que vai acontecer.' },
        { who: 'NOVA', text: 'Mas pode estimar possibilidades: o azul ocupa mais da roleta, então sai mais vezes. Prever com chances é previsão probabilística.' },
        { who: 'NEX', text: 'E o que isso tem a ver com uma máquina de palavras?' },
        { who: 'NOVA', text: 'Tudo. Suba ao observatório do topo e veja.' },
      ])
      c.discover('previsao_prob')
      c.quest('q_futuro', 'done', 'O Futuro Incerto')
      c.setFlag('a4_future')
    }
  })
  const histRef = useRef(hist); histRef.current = hist
  const spinRef = useRef(spinning); spinRef.current = spinning
  const openRef = useRef(open); openRef.current = open
  useOverlay('wheel', open ? (
    <Panel title="A Roleta do Futuro" onExit={spinning ? undefined : () => setOpen(false)}>
      <p>Aposte numa cor e gire. Giros: <b>{hist.length}</b>/5 · acertos: <b>{hist.filter((h) => h.bet === h.res).length}</b></p>
      <div className="row">{SEGS.map((s, i) => <button key={s.k} className={'chipbtn' + (bet === i ? ' on' : '')} style={{ fontFamily: 'var(--f-body)', fontSize: 14, padding: '0 12px', borderColor: s.col }} onClick={() => { setBet(i); SFX.play('tick') }} disabled={spinning}>{s.k} · {Math.round(s.p * 100)}%</button>)}</div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" disabled={bet == null || spinning} onClick={doSpin}>{spinning ? 'Girando…' : 'Girar ▸'}</button></div>
      {hist.length > 0 && <div className="row" style={{ marginTop: 6, gap: 6 }}>{hist.map((h, i) => <span key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: SEGS[h.res].col, border: h.bet === h.res ? '2px solid #fff' : '2px solid transparent' }} />)}</div>}
    </Panel>
  ) : null, [open, bet, hist, spinning])
  return (
    <group position={P.wheel}>
      <group rotation={[0, -Math.PI / 2, 0]} position={[0, 3, 0]}>
        <group ref={wheel} userData={{ noBatch: true }}>
          {geo.map((g, i) => <mesh key={i} geometry={g} userData={{ noCollide: true }}><meshStandardMaterial color={SEGS[i].col} emissive={SEGS[i].col} emissiveIntensity={0.4} side={THREE.DoubleSide} /></mesh>)}
          <mesh material={MAT.gold()} position={[0, 0, 0.05]}><cylinderGeometry args={[0.4, 0.4, 0.2, 20]} /></mesh>
        </group>
        <mesh material={MAT.gold()} position={[0, 0, -0.05]}><torusGeometry args={[3.3, 0.14, 8, 64]} /></mesh>
        <mesh material={MAT.gold()} position={[0, 3.6, 0.1]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.3, 0.7, 3]} /></mesh>
      </group>
      <Solid><mesh position={[0.6, 1, 0]} material={MAT.stoneDark()}><boxGeometry args={[0.6, 2, 7.6]} /></mesh></Solid>
      <Interactable id="wheel" label={done ? 'Girar a roleta de novo' : 'Usar a Roleta do Futuro'} position={[-3.4, 0, 0]} radius={2.4} onUse={run} markerY={2.4} />
    </group>
  )
}

/* =================== side quest: Gráfico Vivo =================== */
function sumDist(n: number) { const out = new Array(6 * n - n + 1).fill(0); const rec = (k: number, s: number) => { if (k === 0) { out[s - n]++; return } for (let f = 1; f <= 6; f++) rec(k - 1, s + f) }; rec(n, 0); return out }
function LiveGraph() {
  const done = useGame((s) => s.quests.q_grafico === 'done')
  const [open, setOpen] = useState(false)
  const [nd, setNd] = useState(1)
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const [tried, setTried] = useState<number[]>([])
  const timer = useRef<any>(null)
  const runMany = () => {
    clearInterval(timer.current)
    let left = 240
    const c = new Array(5 * nd + 1).fill(0)
    setCounts(c.slice())
    timer.current = setInterval(() => {
      for (let j = 0; j < 12 && left > 0; j++, left--) { let s = 0; for (let d = 0; d < nd; d++) s += 1 + Math.floor(Math.random() * 6); c[s - nd]++ }
      setCounts(c.slice())
      if (left <= 0) { clearInterval(timer.current); setTried((t) => (t.includes(nd) ? t : [...t, nd])); SFX.play('tick') }
    }, 60)
  }
  const run = () => start('graph', async (c) => {
    c.quest('q_grafico', 'active', 'Gráfico Vivo')
    setOpen(true); openRef.current = true
    c.focus([P.graph[0] - 6.5, 4.2, P.graph[2] + 0.4], [P.graph[0] + 1.5, 2.0, P.graph[2]], 52)
    await c.until(() => (triedRef.current.includes(2) && triedRef.current.includes(3)) || !openRef.current)
    if (!openRef.current) { c.unfocus(); clearInterval(timer.current); return }
    await c.wait(1.5); setOpen(false); c.unfocus()
    if (G().quests.q_grafico !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Com um dado ficou reto. Com dois virou um triângulo, com três, um morro!' },
        { who: 'NOVA', text: 'O formato de todas as chances juntas se chama distribuição. Com dois dados, o 7 aparece mais porque tem mais jeitos de sair.' },
        { who: 'NOVA', text: 'Uma LLM monta uma distribuição dessas a cada palavra: uma chance para cada palavra possível.' },
      ])
      c.discover('distribuicao')
      c.fragment('probabilidade', 'Fragmento: PROBABILIDADE')
      c.quest('q_grafico', 'done', 'Gráfico Vivo')
    }
  })
  const triedRef = useRef(tried); triedRef.current = tried
  const openRef = useRef(open); openRef.current = open
  const labels = counts.map((_, i) => String(i + nd))
  useOverlay('graph', open ? (
    <Panel title="Gráfico Vivo" onExit={() => { setOpen(false); clearInterval(timer.current) }}>
      <p>Escolha quantos dados somar e jogue 240 vezes. Veja o formato mudar. {!tried.includes(2) || !tried.includes(3) ? 'Experimente 2 e 3 dados.' : ''}</p>
      <div className="row">{[1, 2, 3].map((n) => <button key={n} className={'chipbtn' + (nd === n ? ' on' : '')} onClick={() => { setNd(n); setCounts(new Array(5 * n + 1).fill(0)); clearInterval(timer.current) }}>{n} dado{n > 1 ? 's' : ''}{tried.includes(n) ? ' ✓' : ''}</button>)}</div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" onClick={runMany}>Jogar 240× ▸</button></div>
    </Panel>
  ) : null, [open, nd, tried, counts.length])
  return (
    <group position={P.graph}>
      <Solid><mesh position={[0, 0.5, 0]} material={MAT.dark()}><cylinderGeometry args={[0.6, 0.8, 1, 16]} /></mesh></Solid>
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.glowViolet()} userData={{ noCollide: true }}><ringGeometry args={[0.4, 0.55, 24]} /></mesh>
      <group position={[2.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Bars counts={counts} position={[0, 1.2, 0]} labels={labels} w={counts.length > 8 ? 0.22 : 0.4} h={2.6} color="#59d7ff" />
      </group>
      {!open && !done && <Sparkles count={20} scale={[2, 3, 2]} position={[1.5, 2, 0]} size={4} color="#9fe9ff" />}
      <Interactable id="graph" label="Mexer no Gráfico Vivo" position={[-1.4, 0, 0]} radius={2} onUse={run} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
      <Text font={FONT.title} fontSize={0.4} position={[2.6, 4.9, 0]} rotation={[0, -Math.PI / 2, 0]} color="#bfefff" anchorX="center">GRÁFICO VIVO</Text>
    </group>
  )
}

/* =================== 4. A próxima palavra (topo) =================== */
const WORDS = [{ w: 'azul', p: 0.62 }, { w: 'escuro', p: 0.21 }, { w: 'bonito', p: 0.12 }, { w: 'verde', p: 0.05 }]
function NextWord() {
  const done = useFlag('a4_done')
  const [pick, setPick] = useState<string | null>(done ? 'azul' : null)
  const run = () => start('word', async (c) => {
    if (c.flag('a4_done')) return
    c.freeze(true)
    c.focus([0, Y3 + 3, 5.5], [0, Y3 + 2.4, -2], 52)
    await c.say([
      { who: 'NOVA', text: 'Olhe esta frase incompleta: “O céu é…”. Qual palavra vem depois?' },
      { who: 'NEX', text: 'Depende! Pode ser azul, escuro, bonito…' },
      { who: 'NOVA', text: 'Exato. Não existe uma resposta certa: existem possibilidades, cada uma com uma chance. Agora eu sorteio, como a roleta.' },
    ])
    const r = Math.random(); let acc = 0; let w = WORDS[0].w
    for (const x of WORDS) { acc += x.p; if (r < acc) { w = x.w; break } }
    setPick(w); SFX.play('chime')
    await c.wait(1.2)
    await c.say([
      { who: 'NEX', text: `Saiu “${w}”!` },
      { who: 'NOVA', text: 'Uma máquina de linguagem faz exatamente isso, palavra por palavra: calcula as chances da próxima e escolhe uma.' },
      { who: 'NOVA', text: 'Mas para isso ela precisa de máquinas que façam contas sozinhas, sem cansar. O portal leva à Oficina das Máquinas.' },
    ])
    c.unfocus(); c.freeze(false)
    c.setFlag('a4_done')
  })
  return (
    <group>
      <group position={[0, Y3 + 2.6, -2.2]}>
        <mesh userData={{ noCollide: true }}><planeGeometry args={[7.6, 3.8]} /><meshBasicMaterial color="#120c30" transparent opacity={0.6} depthWrite={false} /></mesh>
        <Text font={FONT.title} fontSize={0.48} position={[0, 1.3, 0.05]} color="#ffe2a3" anchorX="center">O céu é {pick ? pick : '___'}</Text>
        {WORDS.map((x, i) => (
          <group key={x.w} position={[-3.2, 0.5 - i * 0.62, 0.05]}>
            <Text font={FONT.body} fontSize={0.3} position={[0, 0, 0]} color={pick === x.w ? '#8ff0b0' : '#e8e0ff'} anchorX="left" anchorY="middle">{x.w}</Text>
            <mesh position={[1.6 + x.p * 2.4, 0, 0]} userData={{ noCollide: true }}><boxGeometry args={[x.p * 4.8, 0.32, 0.04]} /><meshStandardMaterial color={pick === x.w ? '#4fd18b' : '#8a6aff'} emissive={pick === x.w ? '#4fd18b' : '#8a6aff'} emissiveIntensity={1.2} /></mesh>
            <Text font={FONT.mono} fontSize={0.24} position={[1.75 + x.p * 4.8, 0, 0]} color="#ffe2a3" anchorX="left" anchorY="middle">{Math.round(x.p * 100)}%</Text>
          </group>
        ))}
      </group>
      <Interactable id="word" label="Completar a frase" position={[0, Y3, 2.4]} radius={2.4} enabled={!done} onUse={run} markerY={2.4} />
      <Portal position={P.portal} rotY={0} active={!!done} s={0.8} />
      <Interactable id="portal4" label="Atravessar o portal" position={[0, Y3, -1.6]} radius={2.2} enabled={!!done} onUse={() => start('portal4', async (c) => { c.objective(null); c.goto('p1a5') })} markerY={4.6} color="#7fe3ff" />
    </group>
  )
}

/* =================== roteiro =================== */
async function main(c: Ctx) {
  if (!c.flag('a4_intro')) {
    await c.cinematic([
      { pos: [0, 26, 22], look: [0, 6, 0], dur: 0.01, cut: true },
      { pos: [18, 14, 14], look: [0, 8, -6], dur: 5 },
      { pos: [0, 2.6, 25], look: [0, 1.8, 14], dur: 3 },
    ])
    await c.say([
      { who: 'NEX', text: 'Que lugar é esse? Tem luz piscando em todo canto.' },
      { who: 'NOVA', text: 'A Câmara da Probabilidade. Cada luzinha é uma possibilidade.' },
      { who: 'NEX', text: 'No jardim era fácil: SE isso, ENTÃO aquilo. Qual é a resposta certa aqui?' },
      { who: 'NOVA', text: 'Não existe uma resposta certa ainda. Existem possibilidades.' },
      { who: 'NOVA', text: 'Comece pelo dado gigante, no centro.' },
    ])
    c.setFlag('a4_intro')
  }
  if (!c.flag('a4_dice')) { c.objective('Jogue o dado gigante muitas vezes', [0, 0, 4.4]); await c.waitFlag('a4_dice') }
  if (!c.flag('a4_door')) {
    c.objective('Suba pelo elevador e escolha uma das três portas', P.lift1)
    await c.say({ who: 'NOVA', text: 'O elevador acordou. Lá em cima, três portas: cada uma com uma chance de abrir.' }, { ambient: true })
    await c.until(() => RT.player.y > Y1 - 0.5 || !!G().flags.a4_door)
    c.objective('Tente as portas: qual tem mais chance?', polar(-Math.PI / 2, 21.5, Y1))
    await c.waitFlag('a4_door')
  }
  if (!c.flag('a4_future')) {
    c.objective('Passe pela porta aberta e suba ao anel', P.lift2)
    await c.until(() => RT.player.y > Y2 - 0.5 || !!G().flags.a4_future)
    c.objective('Use a Roleta do Futuro', [P.wheel[0] - 3.4, Y2, 0])
    await c.waitFlag('a4_future')
  }
  if (!c.flag('a4_done')) {
    c.objective('Suba ao observatório do topo', P.lift3)
    await c.until(() => RT.player.y > Y3 - 0.5 || !!G().flags.a4_done)
    c.objective('Complete a frase', [0, Y3, 2.4])
    await c.waitFlag('a4_done')
  }
  c.objective('Atravesse o portal para a Oficina das Máquinas', [0, Y3, -1.6])
}
function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[], quest?: [string, string]) {
  return async (c: Ctx) => {
    if (c.flag('a4_h_' + id)) return
    await c.waitFlag('a4_intro')
    await c.reach(pos, r)
    c.setFlag('a4_h_' + id)
    if (quest) c.quest(quest[0], 'active', quest[1])
    await c.say(lines as any, { ambient: true })
  }
}
const hints = [
  hint('graph', P.graph, 6, [{ who: 'NOVA', text: 'Tem alguma coisa estranha aqui: um gráfico que se mexe sozinho. Dá para brincar com ele.' }], ['q_grafico', 'Gráfico Vivo']),
]

function Lifts() {
  const dice = useFlag('a4_dice'), door = useFlag('a4_door'), fut = useFlag('a4_future')
  return (
    <>
      <Lift id="lift1" from={P.lift1} to={[P.lift1[0], Y1, P.lift1[2] + 0.0]} enabled={!!dice} labelUp="Subir à plataforma" labelDown="Descer ao piso" />
      <Lift id="lift2" from={P.lift2} to={[P.lift2[0], Y2, P.lift2[2]]} enabled={!!door} labelUp="Subir ao anel" labelDown="Descer" />
      <Lift id="lift3" from={P.lift3} to={[P.lift3[0], Y3, P.lift3[2]]} enabled={!!fut} labelUp="Subir ao observatório" labelDown="Descer ao anel" />
    </>
  )
}

export default function Probabilidade() {
  const f = G().flags
  const spawn: V3 = f.a4_future ? [0, Y2 + 0.1, 18.4] : f.a4_door ? [0, Y1 + 0.1, 19] : P.spawn
  useLevel({ spawn, yaw: Math.PI, scripts: [main, ...hints], minY: -6 })
  return (
    <>
      <SkyDome preset="night" custom={SKY} />
      <Lights preset="night" custom={SKY} sunI={0.8} hemiI={0.9} envI={0.6} />
      <Dust count={60} scale={[40, 20, 40]} position={[0, 10, 0]} color="#c8b8ff" />
      <Chamber />
      <Ambience />
      <DiceArena />
      <ThreeDoors />
      <FutureWheel />
      <LiveGraph />
      <NextWord />
      <Lifts />
    </>
  )
}
