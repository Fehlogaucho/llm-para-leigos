import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { SkyDome, Lights, CloudPuffs, FloatingIslands, Dust, Waterfall } from '../../world/Atmosphere'
import { Interactable, Solid, Block, useFlag } from '../../world/core'
import { Batch, Cliff, Column, Lantern, Statue, Tree, Bush, Bench, RoundPlatform, RectPlatform, Arch, Pedestal } from '../../world/Architecture'
import { Portal } from '../../world/Instruments'
import { Gate, CrystalLamp, Lever, Plate, Hedge, Carried, Beam } from '../../world/mechanics'
import { MAT } from '../../world/materials'
import { useOverlay, Panel } from '../../world/puzzle'
import { FONT } from '../../world/fonts'
import { RT, gesture } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, QUICK, type Ctx } from '../../engine/script'
import { G, useGame, type Vec3 } from '../../store'

/* =========================================================
   FASE 1 · ÁREA 3 — O JARDIM DA LÓGICA
   Conceito: SE → ENTÃO. Condições, E, OU, NÃO e algoritmo.
   Entrada → portão condicional → jardim (ponte do E, jardins do OU e do NÃO)
   → labirinto → Câmara de Regras (máquina de regras) → portal.
   ========================================================= */
type V3 = [number, number, number]
const SKY = { zenith: '#2f62b8', mid: '#7fb0e6', horizon: '#ffe3b8', below: '#cfe0d0', sunCol: '#fff0d0', sun: [-0.55, 0.55, 0.62] as V3, stars: 0, fog: '#dfe8ee', fogNear: 90, fogFar: 420, hemi: '#c4dcf2' }

const P = {
  spawn: [0, 0, 42] as V3,
  gate: [0, 0, 28] as V3,
  levB: [-4, 0, 32.5] as V3,
  levR: [4, 0, 32.5] as V3,
  fountain: [0, 0, 19] as V3,
  plateA: [-5, 0, 13] as V3,
  plateB: [5, 0, 13] as V3,
  sphere: [10, 0.95, 19.5] as V3,
  bridge: [0, 0, 5.5] as V3,
  ou: [24, 0, 16] as V3,
  nao: [-24, 0, 16] as V3,
  mirror: [-15.5, 0, 23.5] as V3,
  mazeIn: [0, 0, -1] as V3,
  mazeOut: [12, 0, -28] as V3,
  hall: [0, 0.2, -38] as V3,
  machine: [0, 0.2, -38] as V3,
  portal: [0, 0.2, -49] as V3,
}

/* =================== cenário =================== */
function FlowerBed({ position, w = 4, d = 2, seed = 1 }: { position: V3; w?: number; d?: number; seed?: number }) {
  const cols = [MAT.flowerA(), MAT.flowerB(), MAT.flowerC()]
  const items = useMemo(() => { let s = seed * 97; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }; return Array.from({ length: Math.round(w * d * 2.2) }, () => ({ x: (r() - 0.5) * w * 0.9, z: (r() - 0.5) * d * 0.9, c: Math.floor(r() * 3), s: 0.07 + r() * 0.06 })) }, [w, d, seed])
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} material={MAT.stoneDark()} receiveShadow userData={{ noCollide: true }}><boxGeometry args={[w + 0.3, 0.24, d + 0.3]} /></mesh>
      <mesh position={[0, 0.25, 0]} material={MAT.grass(1)} userData={{ noCollide: true }}><boxGeometry args={[w, 0.04, d]} /></mesh>
      {items.map((it, i) => <mesh key={i} position={[it.x, 0.32 + it.s, it.z]} material={cols[it.c]} userData={{ noCollide: true }}><sphereGeometry args={[it.s, 6, 5]} /></mesh>)}
    </group>
  )
}
function Topiary({ position, kind = 'ball', s = 1 }: { position: V3; kind?: 'ball' | 'cone' | 'spiral'; s?: number }) {
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, 0.3, 0]} material={MAT.stone()} castShadow><cylinderGeometry args={[0.45, 0.55, 0.6, 12]} /></mesh></Solid>
      {kind === 'ball' && <><mesh position={[0, 1.3, 0]} material={MAT.foliage()} castShadow><icosahedronGeometry args={[0.75, 1]} /></mesh><mesh position={[0, 2.25, 0]} material={MAT.foliage2()} castShadow><icosahedronGeometry args={[0.42, 1]} /></mesh></>}
      {kind === 'cone' && <mesh position={[0, 1.7, 0]} material={MAT.foliage()} castShadow><coneGeometry args={[0.65, 2.2, 10]} /></mesh>}
      {kind === 'spiral' && [0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 0.9 + i * 0.55, 0]} material={i % 2 ? MAT.foliage2() : MAT.foliage()} castShadow><icosahedronGeometry args={[0.6 - i * 0.11, 1]} /></mesh>)}
    </group>
  )
}
function Fountain({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Solid><mesh position={[0, 0.35, 0]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[3.2, 3.4, 0.7, 40]} /></mesh></Solid>
      <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water()} userData={{ noCollide: true }}><circleGeometry args={[2.9, 40]} /></mesh>
      <mesh position={[0, 1.4, 0]} material={MAT.marble()} castShadow><cylinderGeometry args={[0.35, 0.6, 1.5, 16]} /></mesh>
      <mesh position={[0, 2.2, 0]} material={MAT.marble()} castShadow><cylinderGeometry args={[1.2, 0.5, 0.35, 24]} /></mesh>
      <mesh position={[0, 2.38, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water()} userData={{ noCollide: true }}><circleGeometry args={[1.05, 24]} /></mesh>
      <mesh position={[0, 2.9, 0]} material={MAT.glowBlue()}><octahedronGeometry args={[0.32, 0]} /></mesh>
      <Sparkles count={30} scale={[2.5, 2.5, 2.5]} position={[0, 2.4, 0]} size={4} speed={0.6} color="#bfefff" />
    </group>
  )
}
function Tablet({ position, rotY = 0, lines, w = 3.4 }: { position: V3; rotY?: number; lines: string[]; w?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid><mesh position={[0, 0.9, 0]} material={MAT.marble()} castShadow><boxGeometry args={[w, 1.4, 0.25]} /></mesh></Solid>
      <mesh position={[0, 0.12, 0]} material={MAT.stoneDark()}><boxGeometry args={[w + 0.3, 0.24, 0.6]} /></mesh>
      {lines.map((t, i) => <Text key={i} font={FONT.body} fontSize={0.2} maxWidth={w - 0.3} textAlign="center" position={[0, 1.36 - i * 0.3, 0.14]} color="#3a2a14" anchorX="center" anchorY="middle">{t}</Text>)}
    </group>
  )
}

/* labirinto: paredes (sebes) */
const MAZE: [number, number, number, number][] = [
  [-14, -2, -14, -26], [14, -2, 14, -26],
  [-14, -2, -2.2, -2], [2.2, -2, 14, -2],
  [-14, -26, 9.8, -26],
  [-14, -8, 8, -8], [-8, -14, 14, -14], [-14, -20, 8, -20],
  [0, -8, 0, -11], [-2, -14, -2, -17], [2, -20, 2, -23], [-8, -2, -8, -5],
]

function GardenMap() {
  return (
    <Batch>
      <Cliff position={[0, 0, -2]} r={60} depth={80} seed={11} />
      <Solid invisible><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -2]}><circleGeometry args={[60, 32]} /></mesh></Solid>
      {Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return <Block key={i} size={[11, 6, 1]} position={[Math.cos(a) * 55.5, 3, -2 + Math.sin(a) * 55.5]} rotation={[0, -a + Math.PI / 2, 0]} /> })}
      {/* chegada */}
      <RoundPlatform position={[0, 0, 43]} r={4.5} h={0.3} rep={2} />
      <Arch position={[0, 0, 47.4]} w={6} h={5.6} d={1} open={3.6} />
      {/* pátio de entrada */}
      <Hedge from={[-9, 0, 40]} to={[-9, 0, 28]} />
      <Hedge from={[9, 0, 40]} to={[9, 0, 28]} />
      <Hedge from={[-9, 0, 28]} to={[-2.6, 0, 28]} />
      <Hedge from={[2.6, 0, 28]} to={[9, 0, 28]} />
      <FlowerBed position={[-6, 0, 36]} w={3.4} d={5} seed={1} />
      <FlowerBed position={[6, 0, 36]} w={3.4} d={5} seed={2} />
      <Lantern position={[-3.4, 0, 39]} light />
      <Lantern position={[3.4, 0, 39]} />
      {/* jardim central */}
      <Fountain position={P.fountain} />
      {[[-11, 24, 'ball'], [11, 24, 'cone'], [-12, 10.5, 'spiral'], [12.5, 10.5, 'ball'], [-4, 24.5, 'cone'], [4, 24.5, 'cone']].map(([x, z, k], i) => <Topiary key={i} position={[x as number, 0, z as number]} kind={k as any} />)}
      <FlowerBed position={[-7, 0, 19]} w={2.4} d={5} seed={3} />
      <FlowerBed position={[7, 0, 19]} w={2.4} d={5} seed={4} />
      <Bench position={[-4.5, 0, 22.5]} rotY={Math.PI} />
      <Bench position={[4.5, 0, 22.5]} rotY={Math.PI} />
      <Statue position={[-16, 0, 27]} rotY={Math.PI * 0.8} pose="think" s={0.9} />
      <Statue position={[16, 0, 27]} rotY={-Math.PI * 0.8} pose="book" s={0.9} />
      {/* canal e margens */}
      <mesh position={[0, -0.7, 5.5]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water()} userData={{ noCollide: true }}><planeGeometry args={[110, 7]} /></mesh>
      <mesh position={[0, -1.6, 5.5]} material={MAT.wall(4)} userData={{ noCollide: true }}><boxGeometry args={[112, 1.6, 7.4]} /></mesh>
      {[9, 2].map((z) => [-1, 1].map((s) => (
        <group key={z + '' + s}>
          <mesh position={[s * 29, 0.25, z]} material={MAT.stone()} castShadow receiveShadow userData={{ noCollide: true }}><boxGeometry args={[54, 0.5, 0.8]} /></mesh>
          <Block size={[54, 4, 0.9]} position={[s * 29, 2, z]} />
        </group>
      )))}
      <Waterfall position={[-56, 0, 5.5]} rotY={Math.PI / 2} width={6} height={36} />
      <Waterfall position={[56, 0, 5.5]} rotY={-Math.PI / 2} width={6} height={36} />
      {/* margem norte e labirinto */}
      {MAZE.map(([ax, az, bx, bz], i) => <Hedge key={i} from={[ax, 0, az]} to={[bx, 0, bz]} h={2.6} />)}
      {[[-11, -5], [11, -11], [-11, -17], [11, -23], [-5, -23]].map(([x, z], i) => <Topiary key={i} position={[x, 0, z]} kind="ball" s={0.8} />)}
      <Arch position={[0, 0, -1.4]} w={6} h={4.6} d={0.9} open={4.2} />
      {/* caminho até a câmara */}
      <RectPlatform position={[12, 0.1, -30]} size={[4, 0.2, 6]} rep={1} />
      <RectPlatform position={[6, 0.1, -32.5]} size={[12, 0.2, 4]} rep={2} />
      {/* câmara de regras */}
      <RoundPlatform position={P.hall} r={10.5} h={0.4} rep={4} />
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + Math.PI / 10; return <Column key={i} position={[Math.cos(a) * 9.6, 0.2, P.hall[2] + Math.sin(a) * 9.6]} h={4.4} r={0.3} /> })}
      <mesh position={[0, 4.8, P.hall[2]]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><torusGeometry args={[9.6, 0.18, 8, 64]} /></mesh>
      <Lantern position={[-6, 0.2, -33]} light /><Lantern position={[6, 0.2, -33]} light />
      {/* árvores e arbustos ao redor */}
      {[[-30, 34], [30, 34], [-36, 22], [36, 24], [-34, -10], [34, -12], [-28, -34], [28, -36], [-20, 38], [20, 40], [-40, 6], [40, 8], [-18, -40], [18, -42]].map(([x, z], i) => <Tree key={i} position={[x, 0, z]} kind={i % 3 === 0 ? 'cypress' : i % 3 === 1 ? 'round' : 'olive'} seed={i + 21} s={1.15} />)}
      {Array.from({ length: 20 }, (_, i) => { const a = i * 0.71, r = 30 + (i % 4) * 3; return <Bush key={i} position={[Math.cos(a) * r, 0, -2 + Math.sin(a) * r]} flowers={(['A', 'B', 'C'] as const)[i % 3]} s={1.1} /> })}
    </Batch>
  )
}

/* =================== 1. Portão condicional =================== */
function ConditionalGate() {
  const blue = useFlag('a3_blue'), red = useFlag('a3_red')
  const open = !!blue
  const done = useFlag('a3_gate')
  useFrame(() => {
    if (open && !G().flags.a3_gate) start('gate-open', async (c) => {
      c.setFlag('a3_gate')
      SFX.play('stone')
      await c.wait(0.6)
      await c.say([
        { who: 'NEX', text: 'Abriu quando a luz azul acendeu! A vermelha não fazia diferença nenhuma.' },
        { who: 'NOVA', text: 'A placa dizia: SE a luz azul estiver acesa, ENTÃO o portão abre. Uma condição e uma consequência.' },
        { who: 'NOVA', text: 'Programas de computador são cheios dessas regras. Repare: a luz acesa é como um 1, apagada é como um 0.' },
      ])
      c.discover('condicional')
      c.quest('q_porta', 'done', 'A Porta Condicional')
    })
  })
  const toggle = (k: 'a3_blue' | 'a3_red') => () => {
    const v = G().flags[k] ? 0 : 1
    G().setFlag(k, v); SFX.play('click'); gesture('reach', 0.8)
    start('gate-q', async (c) => { c.quest('q_porta', 'active', 'A Porta Condicional') })
    if (k === 'a3_red' && v && !G().flags.a3_blue) start('gate-red', async (c) => { if (c.flag('a3_h_red')) return; c.setFlag('a3_h_red'); await c.say({ who: 'NOVA', text: 'A luz vermelha acendeu… e o portão nem se mexeu. Releia a placa.' }, { ambient: true }) })
  }
  return (
    <group>
      <Gate position={P.gate} open={open} />
      <CrystalLamp position={[-2.05, 4.0, P.gate[2]]} color="#3fa8ff" on={!!blue} h={0.4} />
      <CrystalLamp position={[2.05, 4.0, P.gate[2]]} color="#ff4a4a" on={!!red} h={0.4} />
      <Tablet position={[0, 0, 30.6]} rotY={0} lines={['SE a luz AZUL estiver acesa,', 'ENTÃO o portão abre.']} />
      <Lever position={P.levB} on={!!blue} color="#3fa8ff" />
      <Lever position={P.levR} on={!!red} color="#ff4a4a" />
      <Interactable id="levB" label={blue ? 'Desligar a alavanca azul' : 'Puxar a alavanca azul'} position={[P.levB[0], 0, P.levB[2] + 0.9]} radius={1.6} onUse={toggle('a3_blue')} markerY={2} color={done ? '#9fe9ff' : '#ffd27a'} />
      <Interactable id="levR" label={red ? 'Desligar a alavanca vermelha' : 'Puxar a alavanca vermelha'} position={[P.levR[0], 0, P.levR[2] + 0.9]} radius={1.6} onUse={toggle('a3_red')} markerY={2} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =================== 2. Ponte do E =================== */
function AndBridge() {
  const lowered = useFlag('a3_bridge')
  const onSphere = useFlag('a3_sph_on') // 0 = no pedestal, 1 = na placa B, 2 = na placa A
  const [carry, setCarry] = useState(false)
  const [state, setState] = useState({ a: false, b: false })
  const deck = useRef<THREE.Group>(null!)
  const k = useRef(lowered ? 1 : 0)
  const near = useRef(false)
  const [showPanel, setShowPanel] = useState(false)
  useFrame((_, dt) => {
    const pa = Math.hypot(RT.player.x - P.plateA[0], RT.player.z - P.plateA[2]) < 1.0
    const pb = Math.hypot(RT.player.x - P.plateB[0], RT.player.z - P.plateB[2]) < 1.0
    const sph = G().flags.a3_sph_on || 0
    const a = pa || sph === 2, b = pb || sph === 1
    if (a !== state.a || b !== state.b) {
      setState({ a, b })
      if ((a || b) && !(a && b) && !G().flags.a3_bridge) start('and-hint', async (c) => {
        c.quest('q_e', 'active', 'E')
        if (c.flag('a3_h_and')) return
        c.setFlag('a3_h_and')
        await c.say([{ who: 'NEX', text: 'A placa acendeu… mas a ponte não desceu.' }, { who: 'NOVA', text: 'Leia a placa: as DUAS precisam estar pressionadas ao mesmo tempo. Você não consegue estar em dois lugares… mas aquela esfera de pedra consegue.' }], { ambient: true })
      })
    }
    if (a && b && !G().flags.a3_bridge) start('and-open', async (c) => {
      c.setFlag('a3_bridge')
      SFX.play('stone'); SFX.play('gear')
      await c.wait(1.2)
      await c.say([
        { who: 'NEX', text: 'Placa A e placa B, juntas: a ponte desceu!' },
        { who: 'NOVA', text: 'Isso é o E: verdadeiro E verdadeiro dá verdadeiro. Se uma só falhar, tudo falha.' },
      ])
      c.discover('e_logico')
      c.quest('q_e', 'done', 'E')
    })
    const nearNow = Math.hypot(RT.player.x - 0, RT.player.z - 13) < 8
    if (nearNow !== near.current) { near.current = nearNow; setShowPanel(nearNow) }
    k.current += ((G().flags.a3_bridge ? 1 : 0) - k.current) * Math.min(1, dt * 1.2)
    if (deck.current) deck.current.rotation.x = -(1 - k.current) * 1.35
  })
  const sphereHome: V3 = onSphere === 1 ? [P.plateB[0], 0.45, P.plateB[2]] : onSphere === 2 ? [P.plateA[0], 0.45, P.plateA[2]] : P.sphere
  const nearPlate = (p: V3) => Math.hypot(RT.player.x - p[0], RT.player.z - p[2]) < 2.2
  const pick = () => { setCarry(true); G().setFlag('a3_sph_on', 0); SFX.play('stone'); gesture('reach', 0.8) }
  const drop = () => {
    const where = nearPlate(P.plateB) ? 1 : nearPlate(P.plateA) ? 2 : 0
    setCarry(false); G().setFlag('a3_sph_on', where); SFX.play('stone')
  }
  useOverlay('and', showPanel && !lowered ? (
    <Panel title="Ponte do E" top>
      <div className="row" style={{ gap: 14, fontWeight: 800 }}>
        <span>Placa A {state.a ? '✅' : '⬜'}</span><span>E</span><span>Placa B {state.b ? '✅' : '⬜'}</span><span>→</span><span>Ponte {state.a && state.b ? '⬇️' : '⛔'}</span>
      </div>
    </Panel>
  ) : null, [showPanel, state, lowered])
  return (
    <group>
      <Plate position={P.plateA} active={state.a} />
      <Plate position={P.plateB} active={state.b} />
      <Text font={FONT.title} fontSize={0.5} position={[P.plateA[0], 0.2, P.plateA[2] + 1.6]} rotation={[-Math.PI / 2, 0, 0]} color="#5a3a10">A</Text>
      <Text font={FONT.title} fontSize={0.5} position={[P.plateB[0], 0.2, P.plateB[2] + 1.6]} rotation={[-Math.PI / 2, 0, 0]} color="#5a3a10">B</Text>
      <Tablet position={[0, 0, 15.5]} lines={['A ponte desce SE a placa A', 'E a placa B estiverem pressionadas.']} />
      <Pedestal position={[P.sphere[0], 0, P.sphere[2]]} h={0.6} r={0.5} />
      <Carried carried={carry} home={sphereHome}>
        <mesh material={MAT.marble()} castShadow><sphereGeometry args={[0.45, 24, 18]} /></mesh>
        <mesh material={MAT.gold()} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.46, 0.03, 6, 32]} /></mesh>
      </Carried>
      {!carry && onSphere === 0 && <Interactable id="sphere" label="Pegar a esfera de pedra" position={[P.sphere[0] - 1, 0, P.sphere[2]]} radius={1.8} onUse={pick} markerY={2.2} />}
      {!carry && onSphere !== 0 && !lowered && <Interactable id="sphere2" label="Pegar a esfera de volta" position={[sphereHome[0], 0, sphereHome[2] + 1.2]} radius={1.6} onUse={pick} markerY={1.6} color="#9fe9ff" />}
      {carry && <Interactable id="drop" label="Soltar a esfera aqui" position={[0, 0, 13]} radius={60} marker={false} onUse={drop} />}
      {/* ponte levadiça */}
      <group position={[0, 0.05, 9.2]}>
        <group ref={deck} userData={{ noBatch: true }}>
          <mesh position={[0, 0, -3.6]} material={MAT.wood()} castShadow receiveShadow userData={{ noCollide: true }}><boxGeometry args={[3.6, 0.25, 7.6]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 1.75, 0.45, -3.6]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[0.12, 0.7, 7.6]} /></mesh>)}
        </group>
      </group>
      {lowered ? (
        <>
          <Solid invisible><mesh position={[0, -0.05, 5.5]}><boxGeometry args={[3.6, 0.3, 8.4]} /></mesh></Solid>
          <Block size={[0.3, 3, 8]} position={[-1.95, 1.5, 5.5]} />
          <Block size={[0.3, 3, 8]} position={[1.95, 1.5, 5.5]} />
        </>
      ) : <Block size={[4.4, 4, 0.8]} position={[0, 2, 9.4]} />}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 2.3, 1.2, 9.4]} material={MAT.wall(1)} castShadow userData={{ noCollide: true }}><boxGeometry args={[0.7, 2.4, 0.9]} /></mesh>)}
    </group>
  )
}

/* =================== side quest: OU =================== */
function OrGarden() {
  const l1 = useFlag('a3_or1'), l2 = useFlag('a3_or2')
  const open = !!(l1 || l2)
  const got = useGame((s) => s.fragments.includes('logica'))
  const [x, , z] = P.ou
  const tog = (k: string) => () => {
    G().setFlag(k, G().flags[k] ? 0 : 1); SFX.play('click'); gesture('reach', 0.8)
    start('or-q', async (c) => { c.quest('q_ou', 'active', 'OU') })
  }
  return (
    <group>
      <Hedge from={[x - 4, 0, z - 4]} to={[x + 4, 0, z - 4]} />
      <Hedge from={[x - 4, 0, z + 4]} to={[x + 4, 0, z + 4]} />
      <Hedge from={[x + 4, 0, z - 4]} to={[x + 4, 0, z + 4]} />
      <Hedge from={[x - 4, 0, z - 4]} to={[x - 4, 0, z - 2.1]} />
      <Hedge from={[x - 4, 0, z + 2.1]} to={[x - 4, 0, z + 4]} />
      <Gate position={[x - 4, 0, z]} rotY={Math.PI / 2} open={open} w={2.6} h={3} />
      <Tablet position={[x - 6.6, 0, z - 4.6]} rotY={Math.PI / 2} lines={['Abre com a alavanca de cima', 'OU com a de baixo.']} w={3} />
      <Lever position={[x - 6, 0, z - 2.6]} rotY={Math.PI / 2} on={!!l1} color="#a98bff" />
      <Lever position={[x - 6, 0, z + 2.6]} rotY={Math.PI / 2} on={!!l2} color="#ffb35a" />
      <Interactable id="or1" label="Puxar a alavanca de cima" position={[x - 7, 0, z - 2.6]} radius={1.5} onUse={tog('a3_or1')} markerY={1.9} color="#9fe9ff" />
      <Interactable id="or2" label="Puxar a alavanca de baixo" position={[x - 7, 0, z + 2.6]} radius={1.5} onUse={tog('a3_or2')} markerY={1.9} color="#9fe9ff" />
      <mesh position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.floor(1)} userData={{ noCollide: true }}><circleGeometry args={[3, 24]} /></mesh>
      <group position={[x + 1.5, 0, z]}>
        <Solid><mesh position={[0, 0.4, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[1.2, 0.8, 0.8]} /></mesh></Solid>
        <mesh position={[0, 0.85, got ? -0.35 : 0]} rotation={[got ? -1.2 : 0, 0, 0]} material={MAT.gold()} castShadow userData={{ noBatch: true }}><boxGeometry args={[1.24, 0.12, 0.84]} /></mesh>
        {!got && <Sparkles count={14} scale={1.6} size={4} position={[0, 1, 0]} color="#ffe2a3" />}
      </group>
      {!got && <Interactable id="orchest" label="Abrir o baú" position={[x, 0, z]} radius={1.8} onUse={() => start('orchest', async (c) => {
        SFX.play('open')
        c.fragment('logica', 'Fragmento: LÓGICA')
        await c.say([{ who: 'NEX', text: 'Uma alavanca bastava. Qualquer uma das duas!' }, { who: 'NOVA', text: 'Isso é o OU: basta uma condição verdadeira. Só fica fechado se as duas forem falsas.' }])
        c.discover('ou_logico')
        c.quest('q_ou', 'done', 'OU')
      })} markerY={2} />}
    </group>
  )
}

/* =================== side quest: NÃO =================== */
function NotGarden() {
  const turned = useFlag('a3_mirror')
  const lit = !turned
  const open = !lit // NÃO luz
  const done = useGame((s) => s.quests.q_nao === 'done')
  const [x, , z] = P.nao
  const mirror = useRef<THREE.Group>(null!)
  useFrame(() => { if (mirror.current) mirror.current.rotation.y += ((turned ? -1.2 : 0.35) - mirror.current.rotation.y) * 0.1 })
  const sensor: V3 = [x + 4.2, 3.9, z]
  const sky: V3 = [P.mirror[0] + 3, 14, P.mirror[2] + 8]
  const mp: V3 = [P.mirror[0], 1.6, P.mirror[2]]
  useFrame(() => {
    if (open && G().quests.q_nao !== 'done' && !G().flags.a3_nao_talk) start('not-open', async (c) => {
      c.setFlag('a3_nao_talk')
      await c.wait(1)
      await c.say([{ who: 'NEX', text: 'A luz apagou… e o portão abriu!' }, { who: 'NOVA', text: 'Esse portão segue o NÃO: abre quando a luz NÃO está acesa. O NÃO inverte: verdadeiro vira falso.' }, { who: 'NOVA', text: 'Com E, OU e NÃO dá para montar qualquer circuito de um computador.' }])
      c.discover('nao_logico')
      c.quest('q_nao', 'done', 'NÃO')
    })
  })
  return (
    <group>
      <Hedge from={[x - 4, 0, z - 4]} to={[x + 4, 0, z - 4]} />
      <Hedge from={[x - 4, 0, z + 4]} to={[x + 4, 0, z + 4]} />
      <Hedge from={[x - 4, 0, z - 4]} to={[x - 4, 0, z + 4]} />
      <Hedge from={[x + 4, 0, z - 4]} to={[x + 4, 0, z - 2.1]} />
      <Hedge from={[x + 4, 0, z + 2.1]} to={[x + 4, 0, z + 4]} />
      <Gate position={[x + 4, 0, z]} rotY={Math.PI / 2} open={open} w={2.6} h={3} />
      <CrystalLamp position={[sensor[0], 3.5, sensor[2]]} color="#ffd24a" on={lit} h={0.1} />
      <Tablet position={[x + 6.6, 0, z + 4.6]} rotY={-Math.PI / 2} lines={['Este portão abre quando', 'a luz NÃO está acesa.']} w={3} />
      <group position={P.mirror}>
        <Solid><mesh position={[0, 0.5, 0]} material={MAT.stone()} castShadow><cylinderGeometry args={[0.4, 0.5, 1, 12]} /></mesh></Solid>
        <group ref={mirror} position={[0, 1.6, 0]} userData={{ noBatch: true }}>
          <mesh material={MAT.gold()}><torusGeometry args={[0.55, 0.06, 8, 32]} /></mesh>
          <mesh><circleGeometry args={[0.52, 32]} /><meshStandardMaterial color="#e8f4ff" metalness={1} roughness={0.05} side={THREE.DoubleSide} /></mesh>
        </group>
      </group>
      <Beam from={sky} to={mp} />
      <Beam from={mp} to={lit ? sensor : [P.mirror[0] + 4, 1.2, P.mirror[2] + 6]} />
      {/* jardim noturno lá dentro */}
      {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[x - 2 + (i % 3) * 1.6, 0.4, z - 1.2 + Math.floor(i / 3) * 2.4]} material={i % 2 ? MAT.glowViolet() : MAT.glowBlue()}><sphereGeometry args={[0.16, 10, 8]} /></mesh>)}
      <Statue position={[x - 2.2, 0, z]} rotY={Math.PI / 2} pose="think" s={0.7} />
      <Interactable id="mirror" label={turned ? 'Virar o espelho de volta' : 'Girar o espelho'} position={[P.mirror[0], 0, P.mirror[2] + 1.2]} radius={1.6} onUse={() => { G().setFlag('a3_mirror', G().flags.a3_mirror ? 0 : 1); SFX.play('click'); gesture('reach', 0.8); start('not-q', async (c) => { c.quest('q_nao', 'active', 'NÃO') }) }} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =================== 4. Máquina de Regras =================== */
type Fruit = { name: string; color: 'vermelha' | 'amarela' | 'verde'; round: boolean; hex: string; shape: 'ball' | 'long' | 'small' }
const FRUITS: Fruit[] = [
  { name: 'maçã', color: 'vermelha', round: true, hex: '#d23a2a', shape: 'ball' },
  { name: 'banana', color: 'amarela', round: false, hex: '#f2d03a', shape: 'long' },
  { name: 'limão', color: 'verde', round: true, hex: '#6fbf3a', shape: 'ball' },
  { name: 'morango', color: 'vermelha', round: false, hex: '#e8364a', shape: 'small' },
  { name: 'pera', color: 'amarela', round: false, hex: '#d8d24a', shape: 'long' },
  { name: 'maçã', color: 'vermelha', round: true, hex: '#c8302a', shape: 'ball' },
]
const CONDS = [
  { id: 'red', label: 'a fruta é vermelha', test: (f: Fruit) => f.color === 'vermelha' },
  { id: 'round', label: 'a fruta é redonda', test: (f: Fruit) => f.round },
  { id: 'yellow', label: 'a fruta é amarela', test: (f: Fruit) => f.color === 'amarela' },
]
const want = (f: Fruit) => (f.color === 'vermelha' ? 'A' : 'B')
function RuleMachine() {
  const done = useFlag('a3_rules')
  const [open, setOpen] = useState(false)
  const [cond, setCond] = useState<string | null>(null)
  const [thenB, setThen] = useState<'A' | 'B' | null>(null)
  const [elseB, setElse] = useState<'A' | 'B' | null>(null)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<{ f: Fruit; yes: boolean; to: 'A' | 'B'; ok: boolean }[]>([])
  const fruitsG = useRef<THREE.Group>(null!)
  const flap = useRef<THREE.Group>(null!)
  const belt = useRef<THREE.MeshStandardMaterial>(null!)
  const anim = useRef<{ t0: number; plan: { to: 'A' | 'B' }[] } | null>(null)
  const [mx, my, mz] = P.machine
  const beltY = my + 1.05
  const binPos = (b: 'A' | 'B'): THREE.Vector3 => new THREE.Vector3(mx + 4.4, my + 0.9, mz + (b === 'A' ? 1.5 : -1.5))
  useFrame(() => {
    const a = anim.current
    if (belt.current?.map) belt.current.map.offset.x -= a ? 0.02 : 0.002
    if (!fruitsG.current) return
    fruitsG.current.children.forEach((c, i) => {
      if (!a) { c.visible = false; return }
      const t = (performance.now() - a.t0) / 1000 - i * 1.1
      if (t < 0) { c.visible = false; return }
      c.visible = true
      const p = a.plan[i]
      if (t < 1.6) { c.position.set(mx - 4.2 + (t / 1.6) * 7, beltY + 0.2, mz) }
      else {
        const k = Math.min(1, (t - 1.6) / 0.6)
        const from = new THREE.Vector3(mx + 2.8, beltY + 0.2, mz), to = binPos(p.to).add(new THREE.Vector3(0, 0.15 + i * 0.03, (i % 2) * 0.2 - 0.1))
        c.position.lerpVectors(from, to, k); c.position.y += Math.sin(k * Math.PI) * 0.6
        if (flap.current && t < 2.2) flap.current.rotation.y += ((p.to === 'A' ? 0.6 : -0.6) - flap.current.rotation.y) * 0.3
      }
      c.rotation.x = t * 3
    })
  })
  const runProgram = () => {
    if (!cond || !thenB || !elseB || running) return
    const C = CONDS.find((x) => x.id === cond)!
    const res = FRUITS.map((f) => { const yes = C.test(f); const to = yes ? thenB : elseB; return { f, yes, to, ok: to === want(f) } })
    setLog([]); setRunning(true); SFX.play('gear')
    anim.current = { t0: performance.now(), plan: res.map((r) => ({ to: r.to })) }
    res.forEach((r, i) => setTimeout(() => { setLog((l) => [...l, r]); SFX.play(r.ok ? 'tick' : 'error') }, (i * 1.1 + 2.2) * 1000))
    setTimeout(() => { setRunning(false); if (res.every((r) => r.ok)) G().setFlag('a3_prog_ok'); else G().showToast(`${res.filter((r) => !r.ok).length} fruta(s) foram para a cesta errada. Ajuste a regra.`) }, (FRUITS.length * 1.1 + 2.6) * 1000)
  }
  const run = () => start('rules', async (c) => {
    if (!c.flag('a3_maze')) c.setFlag('a3_maze')
    c.quest('q_regras', 'active', 'A Máquina de Regras')
    setOpen(true); setLog([]); openRef.current = true
    c.focus([mx + 0.4, my + 6.2, mz + 7.2], [mx + 0.4, my - 1.4, mz - 0.5], 48)
    if (!c.flag('a3_rules_seen')) {
      c.setFlag('a3_rules_seen')
      await c.say([
        { who: 'NOVA', text: 'A Máquina de Regras separa frutas sozinha, mas alguém precisa programá-la.' },
        { who: 'NOVA', text: 'Missão: frutas vermelhas na cesta A, todas as outras na cesta B. Monte a regra com SE, ENTÃO e SENÃO e aperte “Rodar”.' },
      ], { ambient: true })
    }
    await c.until(() => !!G().flags.a3_prog_ok || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(0.8)
    setOpen(false); c.unfocus()
    if (!c.flag('a3_rules')) {
      SFX.play('success')
      await c.say([
        { who: 'NEX', text: 'Todas certinhas! E eu nem toquei numa fruta.' },
        { who: 'NOVA', text: 'Você escreveu um algoritmo: uma receita de passos que uma máquina segue sem pensar.' },
        { who: 'NEX', text: 'Então dá para fazer uma inteligência artificial só com regras assim?' },
        { who: 'NOVA', text: 'Muita gente tentou: milhares de regras escritas à mão. Funcionava às vezes. O mundo tem casos demais para uma regra para cada um.' },
        { who: 'NOVA', text: 'E nem tudo é certo como “vermelho ou não”. Às vezes a gente só sabe o que é PROVÁVEL. É para lá que o portal leva.' },
      ])
      c.discover('algoritmo')
      c.quest('q_regras', 'done', 'A Máquina de Regras')
      c.setFlag('a3_rules')
    }
  })
  const openRef = useRef(open); openRef.current = open
  const beltTex = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const x = cv.getContext('2d')!; x.fillStyle = '#2a2a30'; x.fillRect(0, 0, 64, 16); x.fillStyle = '#4a4a54'; for (let i = 0; i < 8; i++) x.fillRect(i * 8, 0, 3, 16); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1); return t }, [])
  const binMat = useMemo(() => { const m = (MAT.woodDark() as THREE.MeshStandardMaterial).clone(); m.side = THREE.DoubleSide; return m }, [])
  const chip = (on: boolean) => 'chipbtn' + (on ? ' on' : '')
  useOverlay('rules', open ? (
    <Panel title="Máquina de Regras" onExit={running ? undefined : () => setOpen(false)}>
      <p style={{ fontSize: 13.5 }}>Objetivo: <b>vermelhas → cesta A</b>, <b>outras → cesta B</b>.</p>
      <div style={{ display: 'grid', gap: 6 }}>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 6 }}><b style={{ width: 54 }}>SE</b>{CONDS.map((cnd) => <button key={cnd.id} className={chip(cond === cnd.id)} style={{ fontSize: 13, fontFamily: 'var(--f-body)', padding: '0 8px' }} onClick={() => { setCond(cnd.id); SFX.play('tick') }} disabled={running}>{cnd.label}</button>)}</div>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 6 }}><b style={{ width: 54 }}>ENTÃO</b>{(['A', 'B'] as const).map((b) => <button key={b} className={chip(thenB === b)} onClick={() => { setThen(b); SFX.play('tick') }} disabled={running}>cesta {b}</button>)}</div>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 6 }}><b style={{ width: 54 }}>SENÃO</b>{(['A', 'B'] as const).map((b) => <button key={b} className={chip(elseB === b)} onClick={() => { setElse(b); SFX.play('tick') }} disabled={running}>cesta {b}</button>)}</div>
      </div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" disabled={!cond || !thenB || !elseB || running} onClick={runProgram}>{running ? 'Rodando…' : 'Rodar o programa ▸'}</button></div>
      {log.length > 0 && <div style={{ marginTop: 8, fontSize: 13, fontFamily: 'var(--f-mono)', maxHeight: 120, overflow: 'auto' }}>
        {log.map((r, i) => <div key={i} style={{ color: r.ok ? '#8ff0b0' : '#ff9a9a' }}>{r.ok ? '✓' : '✗'} {r.f.name}: {CONDS.find((x) => x.id === cond)?.label}? {r.yes ? 'SIM' : 'NÃO'} → cesta {r.to}</div>)}
      </div>}
    </Panel>
  ) : null, [open, cond, thenB, elseB, running, log])
  return (
    <group>
      {/* esteira */}
      <Solid><mesh position={[mx - 0.7, my + 0.5, mz]} material={MAT.iron()} castShadow receiveShadow><boxGeometry args={[7.4, 1, 1.4]} /></mesh></Solid>
      <mesh position={[mx - 0.7, my + 1.02, mz]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noCollide: true }}><planeGeometry args={[7.2, 1.1]} /><meshStandardMaterial ref={belt} map={beltTex} roughness={0.8} /></mesh>
      <mesh position={[mx - 4.6, my + 1.9, mz]} material={MAT.copper()} castShadow><cylinderGeometry args={[0.9, 0.4, 1.4, 12, 1, true]} /></mesh>
      <mesh position={[mx - 4.6, my + 1.2, mz]} material={MAT.iron()}><boxGeometry args={[0.9, 0.4, 0.9]} /></mesh>
      <group ref={flap} position={[mx + 3, my + 1.25, mz]} userData={{ noBatch: true }}><mesh position={[0.5, 0, 0]} material={MAT.gold()}><boxGeometry args={[1, 0.4, 0.08]} /></mesh></group>
      {(['A', 'B'] as const).map((b) => { const p = binPos(b); return (
        <group key={b} position={[p.x, my, p.z]}>
          <Solid><mesh position={[0, 0.45, 0]} material={binMat} castShadow><cylinderGeometry args={[0.8, 0.65, 0.9, 16, 1, true]} /></mesh></Solid>
          <mesh position={[0, 0.06, 0]} material={MAT.woodDark()}><cylinderGeometry args={[0.65, 0.65, 0.1, 16]} /></mesh>
          <Text font={FONT.title} fontSize={0.42} position={[0, 1.4, 0]} color={b === 'A' ? '#ff6a5a' : '#e8d070'} outlineWidth={0.02} outlineColor="#2a1a0a">{b}</Text>
        </group>
      ) })}
      <group ref={fruitsG}>
        {FRUITS.map((f, i) => (
          <mesh key={i} visible={false} scale={f.shape === 'long' ? [1.6, 0.7, 0.7] : f.shape === 'small' ? [0.7, 0.8, 0.7] : [1, 1, 1]}><sphereGeometry args={[0.24, 16, 12]} /><meshStandardMaterial color={f.hex} roughness={0.45} /></mesh>
        ))}
      </group>
      <Interactable id="rules" label={done ? 'Programar a máquina de novo' : 'Programar a Máquina de Regras'} position={[mx, my, mz + 2.6]} radius={2.4} onUse={run} markerY={2.8} />
    </group>
  )
}

/* =================== portal =================== */
function ExitPortal() {
  const on = useFlag('a3_rules')
  return (
    <group>
      <Portal position={P.portal} active={!!on} s={0.95} />
      <Interactable id="portal3" label="Atravessar o portal" position={[P.portal[0], P.portal[1], P.portal[2] + 3]} radius={3} enabled={!!on} onUse={() => start('portal3', async (c) => { c.objective(null); c.goto('p1a4') })} markerY={5.4} color="#7fe3ff" />
    </group>
  )
}

/* =================== roteiro =================== */
async function main(c: Ctx) {
  if (!c.flag('a3_intro')) {
    await c.cinematic([
      { pos: [30, 26, 60], look: [0, 2, 10], dur: 0.01, cut: true },
      { pos: [-24, 16, 30], look: [0, 1, -14], dur: 5.5 },
      { pos: [0, 2.6, 49], look: [0, 1.6, 38], dur: 3.5 },
    ])
    await c.say([
      { who: 'NEX', text: 'Que jardim! Mas os caminhos estão todos fechados.' },
      { who: 'NOVA', text: 'Bem-vindo ao Jardim da Lógica. Aqui nada abre por acaso: tudo obedece a regras.' },
      {
        who: 'NOVA', text: 'No vale, você viu que tudo vira 0 e 1. Aqui, 0 e 1 viram FALSO e VERDADEIRO.', choices: [
          { label: 'Como assim?', next: [{ who: 'NOVA', text: 'Uma luz apagada é falso. Acesa é verdadeiro. E as regras do jardim olham para elas.' }] },
          { label: 'Vamos lá!', next: [] },
        ],
      },
      { who: 'NOVA', text: 'Leia a placa diante do portão e descubra como abri-lo.' },
    ])
    c.setFlag('a3_intro')
  }
  if (!c.flag('a3_gate')) { c.objective('Descubra como abrir o portão da entrada', [0, 0, 31.6]); await c.waitFlag('a3_gate') }
  if (!c.flag('a3_bridge')) {
    c.objective('Faça a ponte do canal descer', [0, 0, 14.4])
    await c.say({ who: 'NOVA', text: 'O canal corta o jardim. Tem uma ponte levadiça… e duas placas no chão.' }, { ambient: true })
    await c.waitFlag('a3_bridge')
  }
  if (!c.flag('a3_maze')) {
    c.objective('Atravesse o labirinto até a Câmara de Regras', P.mazeOut)
    await c.say({ who: 'NOVA', text: 'Depois da ponte vem o labirinto de sebes. A Câmara de Regras fica do outro lado.' }, { ambient: true })
    await c.reach(P.mazeOut, 4)
    c.setFlag('a3_maze')
  }
  if (!c.flag('a3_rules')) { c.objective('Programe a Máquina de Regras', [P.machine[0], P.machine[1], P.machine[2] + 2.6]); await c.waitFlag('a3_rules') }
  c.objective('Atravesse o portal para a Câmara da Probabilidade', [P.portal[0], P.portal[1], P.portal[2] + 3])
}
function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[], quest?: [string, string]) {
  return async (c: Ctx) => {
    if (c.flag('a3_h_' + id)) return
    await c.waitFlag('a3_intro')
    await c.reach(pos, r)
    c.setFlag('a3_h_' + id)
    if (quest) c.quest(quest[0], 'active', quest[1])
    await c.say(lines as any, { ambient: true })
  }
}
const hints = [
  hint('ou', [P.ou[0] - 7, 0, P.ou[2]], 5, [{ who: 'NOVA', text: 'Tem alguma coisa estranha aqui: um jardinzinho trancado com duas alavancas e um baú lá dentro.' }], ['q_ou', 'OU']),
  hint('nao', [P.nao[0] + 7, 0, P.nao[2]], 6, [{ who: 'NOVA', text: 'Um espelho joga a luz do sol naquele cristal amarelo. E a placa fala em luz que NÃO está acesa…' }], ['q_nao', 'NÃO']),
  hint('fonte', P.fountain, 6, [{ who: 'NOVA', text: 'Até a fonte segue uma regra: SE a água chega no topo, ENTÃO transborda.' }]),
  hint('maze', [0, 0, 0], 4, [{ who: 'NOVA', text: 'Um labirinto. Dica: siga sempre uma parede com a mão. É uma regra simples que sempre encontra a saída.' }]),
]

export default function Jardim() {
  useLevel({ spawn: P.spawn, yaw: Math.PI, scripts: [main, ...hints], minY: -6 })
  return (
    <>
      <SkyDome preset="day" custom={SKY} />
      <Lights preset="day" custom={SKY} sunI={2.5} hemiI={1.05} />
      <CloudPuffs n={22} y={[20, 60]} r={[120, 260]} tint="#ffffff" seed={4} />
      <FloatingIslands n={12} seed={3} rMin={110} rMax={260} yMin={10} yMax={70} />
      <Dust count={80} scale={[90, 8, 90]} position={[0, 3, 0]} color="#fff6c8" />
      <Sparkles count={40} scale={[60, 4, 60]} position={[0, 1.5, 10]} size={5} speed={0.5} color="#ffd0f0" />
      <GardenMap />
      <ConditionalGate />
      <AndBridge />
      <OrGarden />
      <NotGarden />
      <RuleMachine />
      <ExitPortal />
    </>
  )
}
