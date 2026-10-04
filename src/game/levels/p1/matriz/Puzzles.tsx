import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Interactable, Solid, useFlag } from '../../../world/core'
import { Balustrade } from '../../../world/Architecture'
import { useFarClose } from '../../../world/mechanics'
import { MAT } from '../../../world/materials'
import { useOverlay, Panel } from '../../../world/puzzle'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'
import { SFX } from '../../../engine/audio'
import { start } from '../../../engine/script'
import { G, useGame } from '../../../store'
import { NumCube, Brackets, MX, PIT, CR, cellPos, type V3 } from './Chamber'

const cellBtn = (on: boolean, extra: React.CSSProperties = {}): React.CSSProperties => ({ height: 44, borderRadius: 10, border: '2px solid ' + (on ? '#7fe3ff' : '#3a4a6a'), background: on ? 'radial-gradient(circle at 50% 40%, #dff8ff, #2ab8e8)' : '#121a2c', color: on ? '#04202e' : '#9ab0d0', fontFamily: 'var(--f-mono)', fontWeight: 900, fontSize: 18, cursor: 'pointer', ...extra })

/* =========================================================
   1. CONSTRUA A MATRIZ — cada número tem linha e coluna
   ========================================================= */
export const BUILD_USE: V3 = [0, 0, 14.2]
const BUILD_TARGET = [[1, 0, 1], [0, 1, 0], [1, 1, 0]]
const ONES: [number, number][] = [[0, 0], [0, 2], [1, 1], [2, 0], [2, 1]]
export function BuildMatrix() {
  const done = useFlag('a7_construa')
  const [open, setOpen] = useState(false)
  const [g, setG] = useState<number[][]>(done ? BUILD_TARGET.map((r) => r.slice()) : [[0, 0, 0], [0, 0, 0], [0, 0, 0]])
  const ok = g.every((r, i) => r.every((v, j) => v === BUILD_TARGET[i][j]))
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const grp = useRef<THREE.Group>(null!)
  useFrame(() => { if (grp.current) { grp.current.position.y = 4.4 + Math.sin(RT.time * 1.2) * 0.15; grp.current.rotation.y = Math.sin(RT.time * 0.3) * 0.12 } })
  const flip = (i: number, j: number) => { SFX.play(g[i][j] ? 'tick' : 'click'); setG((x) => x.map((r, a) => r.map((v, b) => (a === i && b === j ? 1 - v : v)))) }
  const run = () => start('construir', async (c) => {
    c.quest('q_construa', 'active', 'Construa a Matriz')
    setOpen(true); openRef.current = true
    c.focus([0.4, 4.6, 15.4], [0, 4.0, 8], 46)
    if (!c.flag('a7_build_seen')) {
      c.setFlag('a7_build_seen')
      await c.say([
        { who: 'NOVA', text: 'Uma matriz vazia: três linhas e três colunas. Cada caixinha tem um endereço.' },
        { who: 'NOVA', text: 'Siga a lista: coloque 1 nos endereços indicados. Linha é a fileira deitada; coluna é a fileira em pé.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.4)
    setOpen(false); c.unfocus()
    if (!c.flag('a7_construa')) {
      c.setFlag('a7_construa')
      await c.say([
        { who: 'NEX', text: 'Uma tabela de números, em linhas e colunas!' },
        { who: 'NOVA', text: 'Isso é uma matriz. Cada número mora num endereço: a linha e a coluna.' },
        { who: 'NOVA', text: 'Lembra do Livro de Registros, no Observatório? Era uma tabela assim. Eu disse que ela ia virar algo poderoso.' },
        { who: 'NOVA', text: 'Agora vamos ver o que uma matriz consegue fazer. Ao norte, depois do abismo, tem uma ponte que obedece a números.' },
      ])
      c.discover('matriz')
      c.quest('q_construa', 'done', 'Construa a Matriz')
    }
  })
  useFarClose(open, () => setOpen(false), BUILD_USE, 4.5)
  useOverlay('construir', open ? (
    <Panel title="Construa a Matriz" onExit={() => setOpen(false)}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '30px repeat(3, 52px)', gap: 5, alignItems: 'center' }}>
          <span />{[1, 2, 3].map((cIdx) => <span key={cIdx} style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#9fe9ff' }}>C{cIdx}</span>)}
          {g.map((r, i) => [<span key={'l' + i} style={{ fontSize: 12, fontWeight: 800, color: '#ffd27a' }}>L{i + 1}</span>, ...r.map((v, j) => <button key={i + '_' + j} aria-label={`linha ${i + 1} coluna ${j + 1}`} onClick={() => flip(i, j)} style={cellBtn(!!v)}>{v}</button>)])}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          {ONES.map(([i, j]) => { const done = g[i][j] === 1; return <div key={i + '' + j} style={{ color: done ? '#8ff0b0' : '#e8eefc' }}>{done ? '✓' : '•'} linha {i + 1}, coluna {j + 1} → <b>1</b></div> })}
          <div style={{ opacity: 0.8 }}>• o resto → 0</div>
        </div>
      </div>
    </Panel>
  ) : null, [open, g])
  return (
    <group>
      <Solid><mesh position={[0, 0.2, 8]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[4.6, 4.9, 0.4, 48]} /></mesh></Solid>
      <mesh position={[0, 0.41, 8]} rotation={[-Math.PI / 2, 0, 0]} material={MX.cyan()} userData={{ noCollide: true }}><ringGeometry args={[4.2, 4.35, 64]} /></mesh>
      <group ref={grp} position={[0, 4.4, 8]} userData={{ noBatch: true }}>
        {g.map((r, i) => r.map((v, j) => <NumCube key={i + '_' + j} position={[(j - 1) * 1.55, (1 - i) * 1.55, 0]} value={v} on={!!v} s={1.15} />))}
        <Brackets position={[0, 0, 0]} w={5.4} h={4.9} />
      </group>
      <group position={[0, 0, 13.2]}>
        <Solid><mesh position={[0, 0.55, 0]} material={MAT.dark()}><boxGeometry args={[1.4, 1.1, 0.7]} /></mesh></Solid>
        <mesh position={[0, 1.15, 0]} rotation={[-0.5, 0, 0]} material={MX.cyan()} userData={{ noCollide: true }}><boxGeometry args={[1.2, 0.05, 0.6]} /></mesh>
      </group>
      <Interactable id="construir" label={done ? 'Mexer na matriz' : 'Construir a matriz'} position={BUILD_USE} radius={2} onUse={run} markerY={2.4} />
    </group>
  )
}

/* =========================================================
   2. MATRIZ COMO MAPA — 1 = plataforma, 0 = vazio
   ========================================================= */
export const MAP_USE: V3 = [-5.2, 0, -1.6]
const BLOCKED: [number, number][] = [[1, 1], [1, 3], [2, 2]]
const ENTRY: [number, number] = [0, 1], EXIT: [number, number] = [3, 3]
const MAXP = 8
const isBlocked = (r: number, c: number) => BLOCKED.some(([a, b]) => a === r && b === c)
function connected(grid: number[][]) {
  if (!grid[ENTRY[0]][ENTRY[1]]) return false
  const seen = new Set<string>(), q: [number, number][] = [ENTRY]
  while (q.length) {
    const [r, c] = q.shift()!
    if (r === EXIT[0] && c === EXIT[1]) return true
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc, k = nr + ',' + nc
      if (nr < 0 || nr > 3 || nc < 0 || nc > 3 || seen.has(k) || !grid[nr][nc]) continue
      seen.add(k); q.push([nr, nc])
    }
  }
  return false
}
const gridFromMask = (m: number) => Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => (m >> (r * 4 + c)) & 1))
const maskFromGrid = (g: number[][]) => g.reduce((acc, row, r) => row.reduce((a, v, c) => a | (v << (r * 4 + c)), acc), 0)
function Platform({ r, c, on }: { r: number; c: number; on: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const [x, , z] = cellPos(r, c)
  useFrame(() => { if (ref.current) { const want = on ? 0 : -4; ref.current.position.y += (want - ref.current.position.y) * 0.18; ref.current.visible = ref.current.position.y > -3.8 } })
  return (
    <>
      <group ref={ref} position={[x, on ? 0 : -4, z]} userData={{ noBatch: true }}>
        <mesh position={[0, -0.18, 0]} material={MX.cyanDim()} castShadow receiveShadow userData={{ noCollide: true }}><boxGeometry args={[2.36, 0.36, 2.36]} /></mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MX.cyan()} userData={{ noCollide: true }}><ringGeometry args={[0.95, 1.1, 4, 1, Math.PI / 4]} /></mesh>
        <Text font={FONT.mono} fontSize={0.5} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} color="#bff6ff" anchorX="center" anchorY="middle">1</Text>
      </group>
      {on && <Solid invisible><mesh position={[x, -0.18, z]}><boxGeometry args={[2.4, 0.36, 2.4]} /></mesh></Solid>}
    </>
  )
}
export function MapBridge() {
  const ready = useFlag('a7_construa')
  const mask = useFlag('a7_grid')
  const done = useGame((s) => s.quests.q_mmapa === 'done')
  const [open, setOpen] = useState(false)
  const grid = gridFromMask(mask)
  const count = grid.flat().reduce((a, b) => a + b, 0)
  const ok = connected(grid)
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const flip = (r: number, c: number) => {
    if (isBlocked(r, c)) { SFX.play('error'); return }
    const v = grid[r][c]
    if (!v && count >= MAXP) { SFX.play('error'); G().showToast(`Só há energia para ${MAXP} plataformas. Desligue alguma antes.`); return }
    SFX.play(v ? 'tick' : 'stone')
    const g2 = grid.map((row, a) => row.map((x, b) => (a === r && b === c ? 1 - x : x)))
    G().setFlag('a7_grid', maskFromGrid(g2))
  }
  const run = () => start('mapa', async (c) => {
    if (!c.flag('a7_construa')) { await c.say({ who: 'NOVA', text: 'Primeiro construa a matriz no centro da câmara.' }, { ambient: true }); return }
    c.quest('q_mmapa', 'active', 'Matriz como Mapa')
    setOpen(true); openRef.current = true
    c.focus([-1.8, 10.5, 3.2], [0, -1, -9.2], 52)
    if (!c.flag('a7_map_seen')) {
      c.setFlag('a7_map_seen')
      await c.say([
        { who: 'NOVA', text: 'Esta matriz é um mapa do abismo: cada 1 faz surgir uma plataforma, cada 0 deixa o vazio.' },
        { who: 'NOVA', text: 'Os cristais vermelhos não deixam plataforma. Monte um caminho da entrada até a saída, com no máximo 8 plataformas.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.2)
    setOpen(false); c.unfocus()
    if (G().quests.q_mmapa !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Mudei os números e o chão apareceu!' },
        { who: 'NOVA', text: 'A matriz controla o mundo: 1 é chão, 0 é vazio. Ela não é só uma tabela: é um mapa.' },
        { who: 'NOVA', text: 'Atravesse. O altar com a matriz quebrada está do outro lado.' },
      ])
      c.discover('matriz_mapa')
      c.quest('q_mmapa', 'done', 'Matriz como Mapa')
    }
  })
  useFarClose(open, () => setOpen(false), MAP_USE, 4.5)
  useOverlay('mapa', open ? (
    <Panel title="Matriz do Abismo" onExit={() => setOpen(false)}>
      <p style={{ fontSize: 13 }}>Plataformas: <b>{count}</b>/{MAXP} · {ok ? <b style={{ color: '#8ff0b0' }}>caminho completo!</b> : 'ligue a entrada à saída'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 50px)', gap: 5, justifyContent: 'center' }}>
        {[3, 2, 1, 0].map((r) => [0, 1, 2, 3].map((c) => {
          const b = isBlocked(r, c), v = grid[r][c]
          const tag = r === EXIT[0] && c === EXIT[1] ? 'SAÍDA' : r === ENTRY[0] && c === ENTRY[1] ? 'ENTRADA' : ''
          return (
            <button key={r + '_' + c} aria-label={`linha ${4 - r} coluna ${c + 1}`} onClick={() => flip(r, c)} disabled={b}
              style={cellBtn(!!v, { background: b ? '#3a1222' : v ? undefined : '#121a2c', borderColor: b ? '#a03060' : tag ? '#ffd27a' : undefined, position: 'relative', fontSize: b ? 16 : 18 })}>
              {b ? '✕' : v}
              {tag && <span style={{ position: 'absolute', bottom: 1, left: 0, right: 0, fontSize: 8, fontFamily: 'var(--f-body)', color: '#ffd27a' }}>{tag}</span>}
            </button>
          )
        }))}
      </div>
    </Panel>
  ) : null, [open, mask, ok, count])
  return (
    <group>
      {Array.from({ length: 16 }, (_, k) => { const r = Math.floor(k / 4), c = k % 4; return isBlocked(r, c) ? null : <Platform key={k} r={r} c={c} on={!!grid[r][c]} /> })}
      {BLOCKED.map(([r, c]) => { const [x, , z] = cellPos(r, c); return (
        <group key={r + '_' + c} position={[x, 0, z]}>
          <Solid><mesh position={[0, -2.5, 0]} material={MX.crystal()} castShadow><coneGeometry args={[0.9, 7, 5]} /></mesh></Solid>
          {[[-0.6, 0.4, 4], [0.5, -0.5, 3.6]].map(([dx, dz, h], i) => <mesh key={i} position={[dx, -4 + h / 2, dz]} rotation={[0.2 * dx, 0, 0.2 * dz]} material={MX.crystal()} userData={{ noCollide: true }}><coneGeometry args={[0.4, h, 5]} /></mesh>)}
        </group>
      ) })}
      {/* guarda-corpos com aberturas na entrada e na saída */}
      <Balustrade from={[-CR + 2, 0, PIT.z0 + 0.3]} to={[-2.5, 0, PIT.z0 + 0.3]} />
      <Balustrade from={[0, 0, PIT.z0 + 0.3]} to={[CR - 2, 0, PIT.z0 + 0.3]} />
      <Balustrade from={[-CR + 2, 0, PIT.z1 - 0.3]} to={[2.5, 0, PIT.z1 - 0.3]} />
      <Balustrade from={[5, 0, PIT.z1 - 0.3]} to={[CR - 2, 0, PIT.z1 - 0.3]} />
      <Text font={FONT.title} fontSize={0.4} position={[-1.25, 1.6, PIT.z0 + 0.35]} color="#ffd27a" anchorX="center">ENTRADA</Text>
      <Text font={FONT.title} fontSize={0.4} position={[3.75, 1.6, PIT.z1 - 0.35]} rotation={[0, Math.PI, 0]} color="#ffd27a" anchorX="center">SAÍDA</Text>
      <group position={[MAP_USE[0] + 0.1, 0, MAP_USE[2] - 0.9]}>
        <Solid><mesh position={[0, 0.55, 0]} material={MAT.dark()}><boxGeometry args={[1.3, 1.1, 0.6]} /></mesh></Solid>
        <mesh position={[0, 1.15, 0]} rotation={[-0.5, 0, 0]} material={ready ? MX.cyan() : MX.cyanDim()} userData={{ noCollide: true }}><boxGeometry args={[1.1, 0.05, 0.5]} /></mesh>
      </group>
      <Interactable id="mapa" label="Programar a ponte" position={MAP_USE} radius={1.9} onUse={run} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   side quest: MATRIZ COMO IMAGEM — números viram cores
   ========================================================= */
export const IMG_USE: V3 = [-12.4, 0, 6]
const PAL = ['#1c2c7a', '#ffd84a', '#ff8a3a']
const PAL_NAME = ['céu', 'amarelo', 'laranja']
const SUN = [[1, 0, 1, 0, 1], [0, 2, 2, 2, 0], [1, 2, 2, 2, 1], [0, 2, 2, 2, 0], [1, 0, 1, 0, 1]]
const SUN0 = SUN.map((r) => r.slice()); SUN0[0][2] = 0; SUN0[2][2] = 0; SUN0[2][0] = 0; SUN0[4][4] = 2
export function ImageMatrix() {
  const done = useGame((s) => s.quests.q_mimagem === 'done')
  const [open, setOpen] = useState(false)
  const [g, setG] = useState(done ? SUN.map((r) => r.slice()) : SUN0.map((r) => r.slice()))
  const ok = g.every((r, i) => r.every((v, j) => v === SUN[i][j]))
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const cyc = (i: number, j: number) => { SFX.play('tick'); setG((x) => x.map((r, a) => r.map((v, b) => (a === i && b === j ? (v + 1) % 3 : v)))) }
  const run = () => start('mimagem', async (c) => {
    c.quest('q_mimagem', 'active', 'Matriz como Imagem')
    setOpen(true); openRef.current = true
    c.focus([IMG_USE[0] + 4.2, 3.4, IMG_USE[2] + 0.4], [IMG_USE[0] - 3.2, 3, IMG_USE[2]], 50)
    if (!c.flag('a7_img_seen')) {
      c.setFlag('a7_img_seen')
      await c.say({ who: 'NOVA', text: 'Nesta matriz, cada número é uma cor: 0 é céu, 1 é amarelo, 2 é laranja. Quatro números estão errados. Conserte o sol.' }, { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.2)
    setOpen(false); c.unfocus()
    if (G().quests.q_mimagem !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Mudei os números e o desenho mudou!' },
        { who: 'NOVA', text: 'A matriz representa a imagem. Toda foto no seu celular é uma matriz gigante de números.' },
      ])
      c.discover('matriz_imagem')
      c.quest('q_mimagem', 'done', 'Matriz como Imagem')
    }
  })
  useFarClose(open, () => setOpen(false), IMG_USE, 4.5)
  useOverlay('mimagem', open ? (
    <Panel title="Matriz como Imagem" onExit={() => setOpen(false)}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 40px)', gap: 4 }}>
          {g.map((r, i) => r.map((v, j) => <button key={i + '_' + j} aria-label={`linha ${i + 1} coluna ${j + 1}`} onClick={() => cyc(i, j)} style={{ height: 40, borderRadius: 8, border: '1px solid #3a4a6a', background: '#121a2c', color: PAL[v] === '#1c2c7a' ? '#8aa0ff' : PAL[v], fontFamily: 'var(--f-mono)', fontWeight: 900, fontSize: 18, cursor: 'pointer' }}>{v}</button>))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 12px)', gap: 2, margin: '0 auto 6px', width: 'max-content' }}>
            {SUN.flat().map((v, k) => <span key={k} style={{ width: 12, height: 12, background: PAL[v], borderRadius: 2 }} />)}
          </div>
          modelo<br />{PAL.map((p, i) => <div key={p}><span style={{ display: 'inline-block', width: 10, height: 10, background: p, marginRight: 4 }} />{i} = {PAL_NAME[i]}</div>)}
        </div>
      </div>
    </Panel>
  ) : null, [open, g])
  return (
    <group>
      <group position={[IMG_USE[0] - 3.4, 3, IMG_USE[2]]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.06]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[4.4, 4.4, 0.1]} /></mesh>
        {g.map((r, i) => r.map((v, j) => (
          <group key={i + '_' + j} position={[-1.68 + j * 0.84, 1.68 - i * 0.84, 0]}>
            <mesh userData={{ noCollide: true }}><planeGeometry args={[0.78, 0.78]} /><meshStandardMaterial color={PAL[v]} emissive={PAL[v]} emissiveIntensity={0.8} /></mesh>
            <Text font={FONT.mono} fontSize={0.2} position={[0.26, -0.26, 0.01]} color="#0a1020" anchorX="center" anchorY="middle">{String(v)}</Text>
          </group>
        )))}
      </group>
      <Solid><mesh position={[IMG_USE[0] - 3.4, 0.5, IMG_USE[2]]} material={MAT.marble()}><boxGeometry args={[0.8, 1, 4.6]} /></mesh></Solid>
      <Interactable id="mimagem" label="Mexer na matriz-imagem" position={IMG_USE} radius={1.9} onUse={run} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   side quest: MATRIZ × VETOR — a matriz transforma o vetor
   ========================================================= */
export const VEC_USE: V3 = [11.6, 0, 6]
const ORIGIN: V3 = [16.4, 0.05, 6]
const V0: [number, number] = [2, 1], GOAL: [number, number] = [-1, 2]
const MATS2 = [
  { k: 'Girar 90°', m: [[0, -1], [1, 0]] },
  { k: 'Dobrar', m: [[2, 0], [0, 2]] },
  { k: 'Espelhar', m: [[-1, 0], [0, 1]] },
]
const vw = (v: [number, number]) => new THREE.Vector3(ORIGIN[0] + v[0], 0.6, ORIGIN[2] - v[1])
export function VectorLab() {
  const done = useGame((s) => s.quests.q_mvetor === 'done')
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState(0)
  const [res, setRes] = useState<[number, number] | null>(null)
  const [busy, setBusy] = useState(false)
  const okRef = useRef(false)
  const openRef = useRef(open); openRef.current = open
  const orb = useRef<THREE.Group>(null!), arrow = useRef<THREE.Mesh>(null!)
  const cur = useRef(vw(V0))
  const target = useRef(vw(V0))
  useFrame(() => {
    cur.current.lerp(target.current, 0.08)
    if (orb.current) orb.current.position.copy(cur.current)
    if (arrow.current) {
      const o = new THREE.Vector3(ORIGIN[0], 0.6, ORIGIN[2]), d = cur.current.clone().sub(o)
      arrow.current.position.copy(o).addScaledVector(d, 0.5)
      arrow.current.scale.set(1, Math.max(0.01, d.length()), 1)
      arrow.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())
    }
  })
  const mul = () => {
    if (busy) return
    const A = MATS2[pick].m
    const y: [number, number] = [A[0][0] * V0[0] + A[0][1] * V0[1], A[1][0] * V0[0] + A[1][1] * V0[1]]
    setRes(y); setBusy(true); target.current = vw(y); SFX.play('whoosh')
    setTimeout(() => {
      if (y[0] === GOAL[0] && y[1] === GOAL[1]) { SFX.play('success'); okRef.current = true }
      else { SFX.play('error'); setTimeout(() => { target.current = vw(V0); setRes(null) }, 900) }
      setBusy(false)
    }, 1500)
  }
  const run = () => start('mvetor', async (c) => {
    c.quest('q_mvetor', 'active', 'Matriz × Vetor')
    okRef.current = false; target.current = vw(V0); setRes(null)
    setOpen(true); openRef.current = true
    c.focus([ORIGIN[0] - 7.5, 7.2, ORIGIN[2] + 4.5], [ORIGIN[0], 0, ORIGIN[2] - 0.5], 48)
    if (!c.flag('a7_vec_seen')) {
      c.setFlag('a7_vec_seen')
      await c.say({ who: 'NOVA', text: 'A bolinha está no vetor [2, 1]: 2 para o lado, 1 para a frente. Escolha uma matriz e multiplique para levá-la até a estrela.' }, { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.2)
    setOpen(false); c.unfocus()
    if (G().quests.q_mvetor !== 'done') {
      await c.say([
        { who: 'NEX', text: 'A matriz girou o vetor e a bolinha foi parar na estrela!' },
        { who: 'NOVA', text: 'Multiplicar uma matriz por um vetor transforma o vetor: gira, estica ou espelha.' },
        { who: 'NOVA', text: 'Guarde isso: numa LLM, cada palavra vira um vetor, e bilhões dessas multiplicações acontecem a cada resposta.' },
      ])
      c.discover('vetor'); c.discover('matriz_vetor')
      c.quest('q_mvetor', 'done', 'Matriz × Vetor')
    }
  })
  useFarClose(open, () => setOpen(false), VEC_USE, 4.5, () => busy)
  const A = MATS2[pick].m
  useOverlay('mvetor', open ? (
    <Panel title="Matriz × Vetor" onExit={busy ? undefined : () => setOpen(false)}>
      <div className="row" style={{ gap: 6 }}>{MATS2.map((x, i) => <button key={x.k} className={'chipbtn' + (pick === i ? ' on' : '')} disabled={busy} onClick={() => { setPick(i); SFX.play('tick') }} style={{ fontFamily: 'var(--f-body)', fontSize: 14, padding: '0 12px' }}>{x.k}</button>)}</div>
      <p style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', fontSize: 15, marginTop: 8 }}>
        [{A[0].join(' ')} ; {A[1].join(' ')}] × [2, 1] = {res ? <b style={{ color: res[0] === GOAL[0] && res[1] === GOAL[1] ? '#8ff0b0' : '#ffd27a' }}>[{res.join(', ')}]</b> : '?'}
      </p>
      <p style={{ fontSize: 12.5, textAlign: 'center', opacity: 0.85 }}>A estrela está em [−1, 2].</p>
      <div className="row"><button className="btn primary" disabled={busy} onClick={mul}>{busy ? 'Multiplicando…' : 'Multiplicar ▸'}</button></div>
    </Panel>
  ) : null, [open, pick, res, busy])
  const gridLines = useMemo(() => {
    const pts: number[] = []
    for (let i = -4; i <= 4; i++) { pts.push(i, 0, -4, i, 0, 4, -4, 0, i, 4, 0, i) }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g
  }, [])
  return (
    <group>
      <Solid><mesh position={[ORIGIN[0], 0.04, ORIGIN[2]]} material={MAT.dark()} receiveShadow><boxGeometry args={[9, 0.08, 9]} /></mesh></Solid>
      <lineSegments geometry={gridLines} position={[ORIGIN[0], 0.09, ORIGIN[2]]}><lineBasicMaterial color="#2a5a9a" /></lineSegments>
      <mesh position={[ORIGIN[0], 0.1, ORIGIN[2]]} material={MX.violet()} userData={{ noCollide: true }}><boxGeometry args={[9, 0.02, 0.06]} /></mesh>
      <mesh position={[ORIGIN[0], 0.1, ORIGIN[2]]} material={MX.violet()} userData={{ noCollide: true }}><boxGeometry args={[0.06, 0.02, 9]} /></mesh>
      <group ref={orb} userData={{ noBatch: true }}><mesh material={MX.cyan()}><sphereGeometry args={[0.28, 18, 14]} /></mesh></group>
      <mesh ref={arrow} material={MX.cyan()} userData={{ noBatch: true, noCollide: true }}><cylinderGeometry args={[0.05, 0.05, 1, 8]} /></mesh>
      <group position={vw(GOAL).toArray() as V3}>
        <mesh rotation={[0, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><octahedronGeometry args={[0.32, 0]} /></mesh>
      </group>
      <Text font={FONT.title} fontSize={0.36} position={[ORIGIN[0], 2.6, ORIGIN[2] - 4.8]} color="#ffd27a" anchorX="center">MATRIZ × VETOR</Text>
      <group position={[VEC_USE[0] - 0.8, 0, VEC_USE[2]]}>
        <Solid><mesh position={[0, 0.55, 0]} material={MAT.dark()}><boxGeometry args={[0.6, 1.1, 1.2]} /></mesh></Solid>
        <mesh position={[0.05, 1.15, 0]} rotation={[0, 0, -0.5]} material={MX.cyan()} userData={{ noCollide: true }}><boxGeometry args={[0.5, 0.05, 1.0]} /></mesh>
      </group>
      <Interactable id="mvetor" label="Multiplicar matriz por vetor" position={VEC_USE} radius={1.9} onUse={run} markerY={2.4} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   GRANDE DESAFIO — a matriz quebrada da cidade
   ========================================================= */
export const CITY_USE: V3 = [0, 0, -15.4]
export const CITY_POS: V3 = [0, 3.2, -19.5]
export const CITY_TARGET = [[3, 1, 2], [0, 2, 0], [2, 1, 3]]
const CITY0 = [[3, 0, 2], [1, 2, 0], [2, 3, 1]]
export const FX7 = { city: 0, t0: 0 }
function Building({ x, z, h, delay }: { x: number; z: number; h: number; delay: number }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (!ref.current) return
    const k = FX7.city ? Math.min(1, Math.max(0, (performance.now() - FX7.t0 - delay) / 900)) : 0
    const e = 1 - Math.pow(1 - k, 3)
    ref.current.scale.set(1, Math.max(0.001, e), 1)
    ref.current.visible = k > 0
  })
  const H = Math.max(0.15, h * 1.3)
  return (
    <group ref={ref} position={[x, -0.65, z]} userData={{ noBatch: true }}>
      <mesh position={[0, H / 2, 0]} material={MX.cyanDim()} castShadow><boxGeometry args={[1.25, H, 1.25]} /></mesh>
      {Array.from({ length: Math.max(1, Math.round(H / 0.45)) }, (_, i) => <mesh key={i} position={[0, 0.3 + i * 0.45, 0.63]} material={MX.cyan()}><boxGeometry args={[0.9, 0.12, 0.02]} /></mesh>)}
      <mesh position={[0, H + 0.06, 0]} material={MAT.gold()}><boxGeometry args={[1.3, 0.12, 1.3]} /></mesh>
    </group>
  )
}
export function CityMatrix() {
  const ready = useGame((s) => s.quests.q_mmapa === 'done')
  const solved = useFlag('a7_city')
  const [open, setOpen] = useState(false)
  const [g, setG] = useState(solved ? CITY_TARGET.map((r) => r.slice()) : CITY0.map((r) => r.slice()))
  const ok = g.every((r, i) => r.every((v, j) => v === CITY_TARGET[i][j]))
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const cubes = useRef<THREE.Group>(null!)
  if (solved && !FX7.city) { FX7.city = 1; FX7.t0 = performance.now() - 5000 }
  useFrame(() => {
    if (!cubes.current) return
    cubes.current.children.forEach((c, k) => {
      if (k >= 9) return
      const i = Math.floor(k / 3), j = k % 3
      const wrong = g[i]?.[j] !== CITY_TARGET[i]?.[j]
      c.rotation.z = wrong ? Math.sin(RT.time * 2 + k) * 0.25 : c.rotation.z * 0.85
      c.position.y = (1 - i) * 1.7 + (wrong ? Math.sin(RT.time * 3 + k) * 0.12 : 0)
    })
    cubes.current.visible = !FX7.city || performance.now() - FX7.t0 < 600
  })
  const cyc = (i: number, j: number) => { SFX.play('tick'); setG((x) => x.map((r, a) => r.map((v, b) => (a === i && b === j ? (v + 1) % 4 : v)))) }
  const run = () => start('cidade', async (c) => {
    if (c.flag('a7_city')) return
    setOpen(true); openRef.current = true
    c.focus([0.4, 4.4, -13.4], [0, 3.1, -19.5], 48)
    if (!c.flag('a7_city_seen')) {
      c.setFlag('a7_city_seen')
      await c.say([
        { who: 'NOVA', text: 'A matriz principal da Language Engine. Está quebrada: alguns números saíram do lugar.' },
        { who: 'NOVA', text: 'A planta ao lado mostra como ela deve ser, linha por linha. Toque nas caixas para trocar o número.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.0)
    setOpen(false)
    c.setFlag('a7_city')
  })
  useFarClose(open, () => setOpen(false), CITY_USE, 4.5)
  useOverlay('cidade', open ? (
    <Panel title="A Matriz Quebrada" onExit={() => setOpen(false)}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 54px)', gap: 5 }}>
          {g.map((r, i) => r.map((v, j) => { const good = v === CITY_TARGET[i][j]; return <button key={i + '_' + j} aria-label={`linha ${i + 1} coluna ${j + 1}`} onClick={() => cyc(i, j)} style={cellBtn(good, { height: 50, borderColor: good ? '#7fe3ff' : '#ff6a8a', background: good ? undefined : '#3a1222', color: good ? undefined : '#ffc0d0' })}>{v}</button> }))}
        </div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ fontFamily: 'var(--f-body)', fontWeight: 800, color: '#ffd27a' }}>Planta</div>
          {CITY_TARGET.map((r, i) => <div key={i}>linha {i + 1}: [ {r.join('  ')} ]</div>)}
        </div>
      </div>
    </Panel>
  ) : null, [open, g])
  return (
    <group>
      <Solid><mesh position={[0, 0.3, -19.5]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[4.2, 4.6, 0.6, 8]} /></mesh></Solid>
      <mesh position={[0, 0.61, -19.5]} rotation={[-Math.PI / 2, 0, Math.PI / 8]} material={MX.violet()} userData={{ noCollide: true }}><ringGeometry args={[3.7, 3.85, 8]} /></mesh>
      <group position={CITY_POS}>
        <group ref={cubes} userData={{ noBatch: true }}>
          {g.map((r, i) => r.map((v, j) => {
            const wrong = v !== CITY_TARGET[i][j]
            return <NumCube key={i + '_' + j} position={[(j - 1) * 1.7, (1 - i) * 1.7, 0]} value={v} on s={1.25} color={wrong ? '#ff7a9a' : '#bff6ff'} />
          }))}
          <Brackets position={[0, 0, 0]} w={5.9} h={5.3} color="#c8a8ff" />
        </group>
      </group>
      {/* a cidade que nasce da matriz (altura = número) */}
      <group position={[0, 0.6, -19.5]}>
        {CITY_TARGET.map((r, i) => r.map((h, j) => <Building key={i + '_' + j} x={(j - 1) * 1.45} z={(i - 1) * 1.45} h={h} delay={(i * 3 + j) * 120} />))}
      </group>
      <group position={[0, 0, -15.4 - 0.9]}>
        <Solid><mesh position={[0, 0.55, 0]} material={MAT.dark()}><boxGeometry args={[1.4, 1.1, 0.6]} /></mesh></Solid>
        <mesh position={[0, 1.15, 0]} rotation={[-0.5, 0, 0]} material={MX.violet()} userData={{ noCollide: true }}><boxGeometry args={[1.2, 0.05, 0.5]} /></mesh>
      </group>
      <Interactable id="cidade" label="Consertar a matriz" position={CITY_USE} radius={1.9} enabled={!!ready && !solved} onUse={run} markerY={2.4} />
    </group>
  )
}
