import * as THREE from 'three'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Text, Billboard } from '@react-three/drei'
import { Interactable, Solid, useFlag } from '../../../world/core'
import { MAT } from '../../../world/materials'
import { Pedestal } from '../../../world/Architecture'
import { useOverlay, Panel } from '../../../world/puzzle'
import { FONT } from '../../../world/fonts'
import { RT, gesture } from '../../../engine/runtime'
import { SFX } from '../../../engine/audio'
import { start, type Ctx } from '../../../engine/script'
import { G, useGame, type Vec3 } from '../../../store'
import { P, terrainH, type V3 } from './terrain'
import { SYMS } from './Field'
import { CAVE, caveDoor, TEMPLE_DOOR } from './Map'
import { VM, crystalGeo, stoneGeo, BinDigit } from './props'
import { Counter, SymbolSvg, SYM_NAMES } from './ui'

const portrait = () => innerWidth < innerHeight

/* =========================================================
   Side quest: O NÚMERO ESCONDIDO
   Quatro povos escreveram o mesmo número (7) de jeitos
   diferentes, espalhados pelo vale. O templo quer o número.
   ========================================================= */
type SymKind = 'tally' | 'roman' | 'maya' | 'baby'
const SYM_ORDER: SymKind[] = ['tally', 'roman', 'maya', 'baby']
export const symFlag = (k: SymKind) => 'a2_sym_' + k
const symCount = () => SYM_ORDER.filter((k) => G().flags[symFlag(k)]).length

const SYM_TALK: Record<SymKind, { who: string; text: string }[]> = {
  tally: [
    { who: 'NEX', text: 'Riscos na pedra! Quatro em pé, um deitado por cima… e mais dois.' },
    { who: 'NOVA', text: 'Contar com riscos é a escrita de número mais antiga que existe. O risco deitado amarra um grupo.' },
  ],
  roman: [
    { who: 'NEX', text: 'V, I, I… isso são letras?' },
    { who: 'NOVA', text: 'Para os romanos eram números. O V parece uma mão aberta. Cada I é um dedo a mais.' },
  ],
  maya: [
    { who: 'NEX', text: 'Uma barra e dois pontinhos em cima.' },
    { who: 'NOVA', text: 'Os maias contavam assim: cada ponto vale um, e cada barra vale um punhado inteiro, de cinco.' },
  ],
  baby: [
    { who: 'NEX', text: 'Uma plaquinha de barro cheia de marquinhas pontudas!' },
    { who: 'NOVA', text: 'São cunhas. Os babilônios apertavam um graveto no barro molhado: cada cunha é uma coisa. Conte quantas.' },
  ],
}

function GlyphTally({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      {[-0.42, -0.26, -0.1, 0.06].map((x) => <mesh key={x} position={[x, 0, 0]} material={mat}><boxGeometry args={[0.055, 0.5, 0.03]} /></mesh>)}
      <mesh position={[-0.18, 0, 0.01]} rotation={[0, 0, -1.0]} material={mat}><boxGeometry args={[0.055, 0.68, 0.03]} /></mesh>
      {[0.3, 0.46].map((x) => <mesh key={x} position={[x, 0, 0]} material={mat}><boxGeometry args={[0.055, 0.5, 0.03]} /></mesh>)}
    </group>
  )
}
function GlyphMaya({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      {[-0.17, 0.17].map((x) => <mesh key={x} position={[x, 0.2, 0]} material={mat}><sphereGeometry args={[0.1, 12, 8]} /></mesh>)}
      <mesh position={[0, -0.12, 0]} material={mat}><boxGeometry args={[0.72, 0.16, 0.06]} /></mesh>
    </group>
  )
}
function GlyphBaby({ mat }: { mat: THREE.Material }) {
  const w = (x: number, y: number) => (
    <group key={x + '_' + y} position={[x, y, 0]}>
      <mesh rotation={[0, 0, Math.PI]} position={[0, -0.04, 0]} material={mat}><coneGeometry args={[0.045, 0.2, 4]} /></mesh>
      <mesh position={[0, 0.07, 0]} material={mat}><boxGeometry args={[0.13, 0.04, 0.04]} /></mesh>
    </group>
  )
  return <group>{[-0.27, -0.09, 0.09, 0.27].map((x) => w(x, 0.12))}{[-0.18, 0, 0.18].map((x) => w(x, -0.16))}</group>
}
function GlyphRoman({ color }: { color: string }) {
  return <Text font={FONT.title} fontSize={0.42} anchorX="center" anchorY="middle">VII<meshBasicMaterial attach="material" color={color} toneMapped={false} /></Text>
}

function SymbolStone({ kind }: { kind: SymKind }) {
  const found = useFlag(symFlag(kind))
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffd98a', emissive: '#ffae2a', emissiveIntensity: 0.6, roughness: 0.5 }), [])
  useFrame(() => { glow.emissiveIntensity = found ? 2.2 : 0.5 + Math.sin(RT.time * 2.2) * 0.35 })
  const p = SYMS[kind]
  const y = kind === 'roman' ? p[1] : terrainH(p[0], p[2])
  const examine = () => start('sym-' + kind, async (c: Ctx) => {
    c.quest('q_escondido', 'active', 'O Número Escondido')
    const first = !c.flag(symFlag(kind))
    c.setFlag(symFlag(kind))
    SFX.play('chime')
    await c.say(SYM_TALK[kind] as any, { ambient: true })
    if (first) {
      const n = symCount()
      G().showToast(`Símbolo anotado: ${SYM_NAMES[kind]} (${n}/4)`)
      if (n === 4) await c.say({ who: 'NOVA', text: 'Quatro povos, quatro jeitos de escrever. Será que todos dizem o mesmo número? O Templo dos Símbolos, a leste das ruínas, quer saber.' }, { ambient: true })
      else if (n === 1) await c.say({ who: 'NOVA', text: 'Tem um templo a leste das ruínas que pede um “número escondido”. Vamos procurar mais símbolos pelo vale.' }, { ambient: true })
    }
  })
  let model: ReactNode
  let use: V3
  if (kind === 'tally') {
    model = (
      <group position={[p[0], y, p[2]]}>
        <Solid><mesh position={[0, 0.55, 0]} scale={[1.3, 0.75, 0.75]} geometry={stoneGeo()} material={MAT.rock(1)} castShadow receiveShadow /></Solid>
        <mesh position={[0, 0.72, 0.62]} rotation={[-0.15, 0, 0]} material={MAT.stone()}><boxGeometry args={[1.3, 0.75, 0.06]} /></mesh>
        <group position={[0, 0.72, 0.67]} rotation={[-0.15, 0, 0]}><GlyphTally mat={glow} /></group>
      </group>
    )
    use = [p[0], y, p[2] + 1.9]
  } else if (kind === 'roman') {
    model = (
      <group position={[p[0], y, p[2]]}>
        <mesh position={[0, 2.0, 0]} material={MAT.marble()} castShadow><boxGeometry args={[1.5, 0.9, 0.12]} /></mesh>
        <mesh position={[0, 2.0, 0.04]} material={MAT.gold()}><boxGeometry args={[1.4, 0.8, 0.04]} /></mesh>
        <mesh position={[0, 2.0, 0.065]} material={MAT.marble()}><boxGeometry args={[1.32, 0.72, 0.02]} /></mesh>
        <group position={[0, 2.0, 0.09]}><GlyphRoman color={found ? '#ffcf6a' : '#b8862a'} /></group>
      </group>
    )
    use = [p[0], y, p[2] + 1.7]
  } else if (kind === 'maya') {
    model = (
      <group position={[p[0], y, p[2]]} rotation={[0, 0.35, 0]}>
        <Solid><mesh position={[0, 1.15, 0]} material={MAT.stoneDark()} castShadow receiveShadow><boxGeometry args={[1.1, 2.3, 0.4]} /></mesh></Solid>
        <mesh position={[0, 2.3, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.stoneDark()} castShadow><cylinderGeometry args={[0.2, 0.2, 1.1, 12, 1, false, 0, Math.PI]} /></mesh>
        <mesh position={[0, 1.4, 0.21]} material={VM.moss()}><boxGeometry args={[0.95, 1.4, 0.02]} /></mesh>
        <group position={[0, 1.45, 0.24]}><GlyphMaya mat={glow} /></group>
        <mesh position={[0, 0.1, 0]} material={MAT.stone()}><boxGeometry args={[1.5, 0.2, 0.8]} /></mesh>
      </group>
    )
    use = [p[0] + 0.6, y, p[2] + 1.7]
  } else {
    model = (
      <group position={[p[0], y, p[2]]} rotation={[0, Math.PI / 2, 0]}>
        <Solid><mesh position={[0, 0.5, -0.5]} scale={[1.2, 0.9, 0.8]} geometry={stoneGeo()} material={MAT.rock(1)} castShadow receiveShadow /></Solid>
        <group position={[0, 0.62, 0.18]} rotation={[-0.35, 0, 0]}>
          <mesh material={VM.burlap()} castShadow><boxGeometry args={[1.05, 0.72, 0.1]} /></mesh>
          <group position={[0, 0, 0.07]}><GlyphBaby mat={glow} /></group>
        </group>
      </group>
    )
    use = [p[0] + 1.6, y, p[2]]
  }
  return (
    <group>
      {model}
      <Interactable id={'sym_' + kind} label={found ? 'Ver o símbolo de novo' : 'Examinar o símbolo'} position={use} radius={2.2} onUse={examine} markerY={2.2} color={found ? '#9fe9ff' : '#ffd27a'} />
      {!found && <Sparkles count={8} scale={[1.4, 1.4, 1.4]} position={[p[0], y + (kind === 'roman' ? 2 : 1), p[2]]} size={4} speed={0.4} color="#ffd98a" />}
    </group>
  )
}

export function HiddenNumber() {
  const solved = useFlag('a2_temple')
  const foundKey = useGame((s) => SYM_ORDER.filter((k) => s.flags[symFlag(k)]).join(','))
  const found = foundKey ? (foundKey.split(',') as SymKind[]) : []
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const openR = useRef(open); openR.current = open
  const okR = useRef(false)
  const door = useRef<THREE.Group>(null!)
  const dk = useRef(solved ? 1 : 0)
  useFrame((_, dt) => { dk.current += ((solved ? 1 : 0) - dk.current) * Math.min(1, dt * 0.8); if (door.current) { door.current.position.y = -dk.current * 2.7; door.current.visible = dk.current < 0.99 } })
  const choose = (n: number) => {
    if (pick != null) return
    setPick(n)
    if (n === 7) { SFX.play('success'); okR.current = true }
    else {
      SFX.play('error')
      G().showToast(found.includes('tally') ? 'A porta não se mexe. Nos riscos, o risco deitado amarra cinco… e depois?' : 'A porta não se mexe. Procure mais símbolos pelo vale.')
      setTimeout(() => setPick(null), 1100)
    }
  }
  const run = () => start('templo', async (c) => {
    if (c.flag('a2_temple')) { await c.say({ who: 'NOVA', text: 'Riscos, letras, pontos e cunhas. O número é a ideia; o símbolo é só a roupa.' }, { ambient: true }); return }
    c.quest('q_escondido', 'active', 'O Número Escondido')
    if (symCount() === 0) {
      await c.say([
        { who: 'NEX', text: 'Uma porta sem fechadura, só um disco com números.' },
        { who: 'NOVA', text: 'A inscrição diz: “Diga o número escondido no vale”. Tem alguma coisa estranha aqui… Vamos procurar símbolos pelo caminho: pedras riscadas, placas, estelas.' },
      ], { ambient: true })
      return
    }
    okR.current = false; setPick(null); setOpen(true); openR.current = true
    const [x, y, z] = TEMPLE_DOOR
    c.focus(portrait() ? [x - 6.5, y + 2.6, z + 1] : [x - 4.6, y + 1.9, z + 0.8], [x, y + 1.5, z], 50)
    await c.until(() => okR.current || !openR.current)
    if (!openR.current) { c.unfocus(); return }
    await c.wait(1.0)
    setOpen(false)
    c.setFlag('a2_temple')
    SFX.play('stone')
    await c.wait(1.6)
    c.unfocus()
    await c.say([
      { who: 'NEX', text: 'Sete! Riscos, VII, barra com dois pontos, sete cunhas… era tudo o mesmo número.' },
      { who: 'NOVA', text: 'Cada povo inventou a sua roupa para o número. O número é a ideia; o símbolo é só a roupa.' },
      { who: 'NOVA', text: 'Para uma máquina também é assim: ela pode trocar de símbolo, contanto que todos combinem o que cada um quer dizer.' },
    ])
    c.discover('simbolos')
    c.quest('q_escondido', 'done', 'O Número Escondido')
  })
  useOverlay('a2_temple', open ? (
    <Panel title="Porta do Número Escondido" onExit={() => setOpen(false)}>
      <p>Que número os símbolos do vale escondem? Símbolos anotados: <b>{found.length}/4</b></p>
      <div className="row" style={{ marginBottom: 8, gap: 6 }}>
        {SYM_ORDER.map((k) => (
          <div key={k} style={{ width: 78, textAlign: 'center', padding: '4px 2px', borderRadius: 12, border: '1px solid rgba(232,182,90,.35)', opacity: found.includes(k) ? 1 : 0.45 }}>
            {found.includes(k) ? <SymbolSvg kind={k} size={52} /> : <div style={{ height: 35, fontSize: 24, fontWeight: 900, color: 'var(--muted)' }}>?</div>}
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{found.includes(k) ? SYM_NAMES[k] : 'não achado'}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 6 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <button key={n} className={'chipbtn' + (pick === n ? ' on' : '')} style={{ minWidth: 46, minHeight: 46, color: pick === n && n !== 7 ? '#3a0a0a' : undefined }} disabled={pick != null && pick !== n} onClick={() => choose(n)}>{n}</button>)}
      </div>
    </Panel>
  ) : null, [open, pick, foundKey])
  const [x, y, z] = TEMPLE_DOOR
  return (
    <group>
      {SYM_ORDER.map((k) => <SymbolStone key={k} kind={k} />)}
      {/* porta do templo */}
      {!solved && <Solid invisible><mesh position={[x, y + 1.3, z]}><boxGeometry args={[0.5, 2.6, 2.7]} /></mesh></Solid>}
      <group ref={door}>
        <mesh position={[x, y + 1.3, z]} material={MAT.woodDark()} castShadow userData={{ noCollide: true }}><boxGeometry args={[0.45, 2.6, 2.6]} /></mesh>
        {[-0.9, 0.9].map((dz) => <mesh key={dz} position={[x - 0.24, y + 1.3, z + dz]} material={MAT.bronze()} userData={{ noCollide: true }}><boxGeometry args={[0.04, 2.5, 0.12]} /></mesh>)}
        <group position={[x - 0.24, y + 1.5, z]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><cylinderGeometry args={[0.72, 0.72, 0.05, 32]} /></mesh>
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; return <Text key={i} font={FONT.title} fontSize={0.13} position={[Math.cos(a) * 0.56, -Math.sin(a) * 0.56, 0.04]} anchorX="center" anchorY="middle" color="#3a2412">{String(i + 1)}</Text> })}
          <mesh position={[0, 0, 0.04]} material={VM.obsidian()}><circleGeometry args={[0.32, 24]} /></mesh>
          <Text font={FONT.title} fontSize={0.3} position={[0, 0, 0.06]} anchorX="center" anchorY="middle">?<meshBasicMaterial attach="material" color="#ffd98a" toneMapped={false} /></Text>
        </group>
      </group>
      {/* mural dentro do santuário */}
      <group position={[51.6, y + 2.2, z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh material={VM.obsidian()}><boxGeometry args={[6.6, 2.6, 0.08]} /></mesh>
        <mesh position={[0, 0, -0.02]} material={MAT.gold()}><boxGeometry args={[6.8, 2.8, 0.04]} /></mesh>
        <group position={[-2.5, 0.35, 0.08]} scale={1.2}><GlyphTally mat={VM.crystalGold()} /></group>
        <group position={[-0.85, 0.35, 0.08]} scale={1.2}><GlyphRoman color="#ffcf6a" /></group>
        <group position={[0.8, 0.35, 0.08]} scale={1.2}><GlyphMaya mat={VM.crystalGold()} /></group>
        <group position={[2.45, 0.35, 0.08]} scale={1.2}><GlyphBaby mat={VM.crystalGold()} /></group>
        <Text font={FONT.title} fontSize={0.62} position={[0, -0.75, 0.08]} anchorX="center" anchorY="middle">= 7 =<meshBasicMaterial attach="material" color={solved ? '#fff1c4' : '#6a5a40'} toneMapped={false} /></Text>
      </group>
      {solved && <Sparkles count={30} scale={[6, 3, 6]} position={[47, y + 2, z]} size={5} speed={0.4} color="#ffd98a" />}
      <Interactable id="templo" label={solved ? 'Ver o santuário' : 'Porta do Número Escondido'} position={[x - 1.7, y, z]} radius={2.2} enabled={!solved} onUse={run} markerY={2.8} color={found.length ? '#ffd27a' : '#9fe9ff'} />
    </group>
  )
}

/* =========================================================
   Side quest (deep dive): SISTEMAS NUMÉRICOS — a caverna
   Os mesmos 13 cristais em decimal, binário e hexadecimal.
   ========================================================= */
type SysMode = 'idle' | 'dec' | 'bin' | 'hex'
const SYS_TXT: Record<Exclude<SysMode, 'idle'>, { tab: string; title: string; body: ReactNode }> = {
  dec: { tab: 'Decimal', title: 'Dez em dez', body: <>Agrupamos de <b>10 em 10</b>: 1 grupo de dez + 3 soltos. Escrevemos <b>13</b>. O “1” quer dizer “um grupo de dez”.</> },
  bin: { tab: 'Binário', title: 'Dois em dois', body: <>Os grupos dobram: <b>8, 4, 2, 1</b>. Tem grupo de 8? Sim (1). De 4? Sim (1). De 2? Não (0). De 1? Sim (1). Fica <b>1101</b>.</> },
  hex: { tab: 'Hexa', title: 'Dezesseis em dezesseis', body: <>Agrupamos de <b>16 em 16</b>. Faltam algarismos, então depois do 9 vêm letras: A=10, B=11, C=12, <b>D=13</b>, E=14, F=15.</> },
}
export function CaveSystems() {
  const done = useGame((s) => s.quests.q_sistemas === 'done')
  const [mode, setMode] = useState<SysMode>('idle')
  const [seen, setSeen] = useState<string[]>([])
  const [ch, setCh] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const openR = useRef(open); openR.current = open
  const okR = useRef(false)
  const [cx, , cz] = P.cave
  const th = CAVE.theta
  const dir = useMemo(() => new THREE.Vector3(Math.sin(th), 0, Math.cos(th)), [])
  const right = useMemo(() => new THREE.Vector3(Math.cos(th), 0, -Math.sin(th)), [])
  const center = useMemo(() => new THREE.Vector3(cx, 0, cz), [])
  const crys = useRef<(THREE.Mesh | null)[]>([])
  const tgt = useMemo(() => Array.from({ length: 13 }, () => new THREE.Vector3()), [])
  const at = (r: number, up: number, f = 0) => center.clone().addScaledVector(right, r).add(new THREE.Vector3(0, up, 0)).addScaledVector(dir, f)
  const layout = (m: SysMode) => {
    for (let i = 0; i < 13; i++) {
      if (m === 'dec') {
        if (i < 10) { const a = (i / 10) * Math.PI * 2; tgt[i].copy(at(-0.7 + Math.cos(a) * 0.55, 1.95 + Math.sin(a) * 0.55)) }
        else tgt[i].copy(at(0.9, 1.5 + (i - 10) * 0.45))
      } else if (m === 'bin') {
        if (i < 8) tgt[i].copy(at(-1.55 + (i % 2) * 0.3, 1.45 + Math.floor(i / 2) * 0.3))
        else if (i < 12) tgt[i].copy(at(-0.45 + (i % 2) * 0.3, 1.6 + Math.floor((i - 8) / 2) * 0.3))
        else tgt[i].copy(at(1.45, 1.75))
      } else if (m === 'hex') {
        const rr = 0.18 * Math.sqrt(i + 0.5), a = i * 2.4
        tgt[i].copy(at(Math.cos(a) * rr, 1.8 + Math.sin(a) * rr))
      } else {
        const a = (i / 13) * Math.PI * 2 + RT.time * 0.4
        tgt[i].set(cx + Math.cos(a) * 0.9, 1.9 + Math.sin(RT.time + i) * 0.12, cz + Math.sin(a) * 0.9)
      }
    }
  }
  useFrame((_, dt) => {
    layout(mode)
    const k = Math.min(1, dt * 4)
    crys.current.forEach((m, i) => { if (!m) return; m.position.lerp(tgt[i], k); m.rotation.y += dt * 0.8 })
  })
  const pickTab = (m: Exclude<SysMode, 'idle'>) => { setMode(m); SFX.play('whoosh'); setSeen((s) => (s.includes(m) ? s : [...s, m])) }
  const answer = (n: number) => {
    if (ch != null) return
    setCh(n)
    if (n === 10) { SFX.play('success'); okR.current = true }
    else { SFX.play('error'); G().showToast('Some só as casas que têm 1: 1010 → 8 + 2.'); setTimeout(() => setCh(null), 1200) }
  }
  const run = () => start('sistemas', async (c) => {
    c.quest('q_sistemas', 'active', 'Sistemas Numéricos')
    okR.current = false; setCh(null); setSeen([]); setMode('dec'); setSeen(['dec']); setOpen(true); openR.current = true
    const cam = center.clone().addScaledVector(dir, portrait() ? 6.6 : 5.2).setY(portrait() ? 3.4 : 2.7)
    c.focus(cam.toArray() as Vec3, center.clone().setY(1.6).addScaledVector(dir, -1.2).toArray() as Vec3, 52)
    if (!done) await c.say({ who: 'NOVA', text: 'Treze cristais. Toque nas abas e veja os mesmos treze se organizarem de jeitos diferentes.' }, { ambient: true })
    await c.until(() => okR.current || !openR.current)
    if (!openR.current) { setMode('idle'); c.unfocus(); return }
    await c.wait(1)
    setOpen(false); setMode('idle'); c.unfocus()
    if (!done) {
      await c.say([
        { who: 'NEX', text: '13, 1101 e D: o mesmo montinho com três roupas diferentes!' },
        { who: 'NOVA', text: 'Computadores usam binário porque um fio só tem dois jeitos confiáveis: com corrente ou sem.' },
        { who: 'NOVA', text: 'E o hexadecimal é um atalho para gente: cada letra ou algarismo hexa guarda quatro casas binárias.' },
      ])
      c.discover('sistemas')
      c.quest('q_sistemas', 'done', 'Sistemas Numéricos')
    }
  })
  const allSeen = seen.length >= 3
  useOverlay('a2_sys', open ? (
    <Panel title="Câmara dos Sistemas" onExit={() => setOpen(false)}>
      <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: 'nowrap' }}>
        {(['dec', 'bin', 'hex'] as const).map((m) => <button key={m} className={'chipbtn' + (mode === m ? ' on' : '')} style={{ flex: 1, fontSize: 15, fontFamily: 'var(--f-body)' }} onClick={() => pickTab(m)}>{SYS_TXT[m].tab}{seen.includes(m) ? ' ✓' : ''}</button>)}
      </div>
      {mode !== 'idle' && <p><b style={{ color: 'var(--gold-2)' }}>{SYS_TXT[mode].title}.</b> {SYS_TXT[mode].body}</p>}
      {!allSeen && <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0 }}>Veja as três abas para liberar o desafio.</p>}
      {allSeen && <>
        <p style={{ marginBottom: 6 }}>Desafio: quanto vale <b>1010</b> em binário? (As casas valem 8, 4, 2 e 1.)</p>
        <div className="row">{[6, 10, 1010].map((n) => <button key={n} className={'chipbtn' + (ch === n ? ' on' : '')} disabled={ch != null && ch !== n} onClick={() => answer(n)}>{n}</button>)}</div>
      </>}
    </Panel>
  ) : null, [open, mode, seen, ch])
  const stela = (k: number, label: string, big: string, col: string, active: boolean) => {
    const a = th + Math.PI + k * 0.62
    const r = CAVE.R - 1.1
    const px = cx + Math.sin(a) * r, pz = cz + Math.cos(a) * r
    return (
      <group key={k} position={[px, 0, pz]} rotation={[0, a + Math.PI, 0]}>
        <Solid><mesh position={[0, 1.4, 0]} material={MAT.stoneDark()} castShadow receiveShadow><boxGeometry args={[1.7, 2.8, 0.35]} /></mesh></Solid>
        <mesh position={[0, 1.55, 0.18]} material={VM.obsidian()}><boxGeometry args={[1.45, 2.2, 0.02]} /></mesh>
        <Text font={FONT.body} fontSize={0.15} position={[0, 2.4, 0.2]} anchorX="center" anchorY="middle" maxWidth={1.4} textAlign="center">{label}<meshBasicMaterial attach="material" color="#cfd6e6" toneMapped={false} /></Text>
        <Text font={FONT.mono} fontSize={big.length > 2 ? 0.42 : 0.7} position={[0, 1.55, 0.2]} anchorX="center" anchorY="middle">{big}<meshBasicMaterial attach="material" color={active ? col : '#4a5468'} toneMapped={false} /></Text>
      </group>
    )
  }
  return (
    <group>
      <Pedestal position={[cx, 0, cz]} h={1.0} r={0.55} mat={MAT.stoneDark()} />
      <mesh position={[cx, 1.02, cz]} rotation={[-Math.PI / 2, 0, 0]} material={VM.crystalViolet()}><ringGeometry args={[0.3, 0.45, 24]} /></mesh>
      {Array.from({ length: 13 }, (_, i) => <mesh key={i} ref={(m) => { crys.current[i] = m }} geometry={crystalGeo()} position={[cx, 1.9, cz]} scale={[0.1, 0.34, 0.1]} material={VM.crystalViolet()} userData={{ noCollide: true }} />)}
      {stela(-1, 'DEZ EM DEZ', '13', '#ffd98a', mode === 'dec' || done)}
      {stela(0, 'DOIS EM DOIS', '1101', '#9fe9ff', mode === 'bin' || done)}
      {stela(1, 'DEZESSEIS EM DEZESSEIS', 'D', '#d8c6ff', mode === 'hex' || done)}
      {/* números acima dos grupos, conforme a aba */}
      {mode === 'dec' && <><Lbl p={at(-0.7, 2.75)} t="10" /><Lbl p={at(0.9, 2.65)} t="3" /></>}
      {mode === 'bin' && <><Lbl p={at(-1.4, 2.85)} t="1" c="#9fe9ff" /><Lbl p={at(-0.3, 2.45)} t="1" c="#9fe9ff" /><Lbl p={at(0.55, 2.45)} t="0" c="#6f8fb0" /><Lbl p={at(1.45, 2.45)} t="1" c="#9fe9ff" /><Lbl p={at(-1.4, 1.15)} t="8" s={0.2} /><Lbl p={at(-0.3, 1.15)} t="4" s={0.2} /><Lbl p={at(0.55, 1.15)} t="2" s={0.2} /><Lbl p={at(1.45, 1.15)} t="1" s={0.2} /></>}
      {mode === 'hex' && <Lbl p={at(0, 2.75)} t="D" c="#d8c6ff" />}
      <Interactable id="sistemas" label={done ? 'Ver os sistemas de novo' : 'Tocar o cristal-mestre'} position={center.clone().addScaledVector(dir, 1.7).toArray() as V3} radius={2.2} onUse={run} markerY={2.6} color={done ? '#9fe9ff' : '#d8c6ff'} />
    </group>
  )
}
function Lbl({ p, t, c = '#ffe6a8', s = 0.42 }: { p: THREE.Vector3; t: string; c?: string; s?: number }) {
  return <Billboard position={p}><Text font={FONT.mono} fontSize={s} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#120a20">{t}<meshBasicMaterial attach="material" color={c} toneMapped={false} /></Text></Billboard>
}

/* =========================================================
   Side quest: O MUNDO BINÁRIO — o cofre da Câmara Binária
   Pisar nas lajes (8, 4, 2, 1) para escrever 5, 10 e 15.
   ========================================================= */
const VP = [8, 4, 2, 1]
const VPX = -9.6
const vpz = (i: number) => -60.7 - i * 2.2
const TARGETS = [5, 10, 15]
export const VAULT_ZONE = { x0: -12, x1: -6.5, z0: -69, z1: -58.5 }
export function Vault() {
  const doorOpen = useFlag('a2_vault')
  const qdone = useGame((s) => s.quests.q_binario === 'done')
  const hall = useFlag('a2_door')
  const [bits, setBits] = useState([false, false, false, false])
  const [step, setStep] = useState(doorOpen ? 3 : 0)
  const [near, setNear] = useState(false)
  const last = useRef(-1)
  const lock = useRef(false)
  const bitsR = useRef(bits); bitsR.current = bits
  const stepR = useRef(step); stepR.current = step
  const sum = bits.reduce((s, b, i) => s + (b ? VP[i] : 0), 0)
  const door = useRef<THREE.Group>(null!)
  const dk = useRef(doorOpen ? 1 : 0)
  const coin = useRef<THREE.Group>(null!)
  const toggle = (i: number) => {
    if (lock.current || stepR.current >= 3 || !G().flags.a2_door) return
    const nb = bitsR.current.map((v, j) => (j === i ? !v : v))
    setBits(nb)
    SFX.play(nb[i] ? 'count' : 'click')
    start('vault-q', async (c) => { c.quest('q_binario', 'active', 'O Mundo Binário') })
    const s = nb.reduce((a, b, j) => a + (b ? VP[j] : 0), 0)
    if (s === TARGETS[stepR.current]) {
      lock.current = true
      setTimeout(() => SFX.play('success'), 200)
      setTimeout(() => {
        const ns = stepR.current + 1
        setStep(ns); setBits([false, false, false, false]); lock.current = false
        if (ns >= 3) start('vault-open', async (c) => {
          c.setFlag('a2_vault'); SFX.play('stone'); SFX.play('gear')
          await c.wait(1.2)
          await c.say([
            { who: 'NEX', text: '0101, 1010, 1111… o cofre abriu!' },
            { who: 'NOVA', text: 'Repare: 1111 é 15, o maior número que cabe em quatro lajes. Quer números maiores? Mais lajes.' },
          ], { ambient: true })
        })
        else G().showToast(`Certo! Agora o cofre pede outro número (${ns + 1}/3).`)
      }, 1300)
    }
  }
  useFrame((_, dt) => {
    const p = RT.player
    const inZone = !!G().flags.a2_door && p.x > VAULT_ZONE.x0 && p.x < VAULT_ZONE.x1 && p.z > VAULT_ZONE.z0 && p.z < VAULT_ZONE.z1 && p.y < 2
    if (inZone !== near) setNear(inZone)
    let on = -1
    if (inZone) for (let i = 0; i < 4; i++) if (Math.abs(p.x - VPX) < 0.9 && Math.abs(p.z - vpz(i)) < 0.9) { on = i; break }
    if (on !== last.current) { last.current = on; if (on >= 0) toggle(on) }
    dk.current += ((G().flags.a2_vault ? 1 : 0) - dk.current) * Math.min(1, dt * 0.9)
    if (door.current) { door.current.position.z = dk.current * 2.5; door.current.rotation.x = dk.current * 2.2 }
    if (coin.current) { coin.current.rotation.y += dt * 1.5; coin.current.position.y = 1.55 + Math.sin(RT.time * 2) * 0.08 }
  })
  const target = TARGETS[Math.min(step, 2)]
  useOverlay('a2_vault', near && step < 3 ? (
    <Counter icon={<span style={{ fontFamily: 'var(--f-mono)', fontWeight: 900, color: '#9fe9ff', fontSize: 18 }}>01</span>} accent="#9fe9ff"
      value={<>{bits.map((b) => (b ? '1' : '0')).join('')} <span style={{ fontSize: 15, color: 'var(--muted)' }}>= {sum}</span></>}
      label={<>Pise nas lajes. Esferas na porta: conte! ({step + 1}/3)</>} />
  ) : null, [near, bits, step])
  const pickBit = () => start('bit', async (c) => {
    c.fragment('bit', 'Fragmento: BIT')
    c.discover('binario', 2)
    await c.say([
      { who: 'NOVA', text: 'Cada laje era um bit: um 0 ou um 1. É a menor peça de informação que existe.' },
      { who: 'NEX', text: 'Pequenininho… mas juntando vários dá para escrever qualquer número!' },
    ], { ambient: true })
    c.quest('q_binario', 'done', 'O Mundo Binário')
  })
  const y = 0.15
  const orbN = step < 3 ? target : 0
  return (
    <group>
      {VP.map((v, i) => (
        <group key={i} position={[VPX, y, vpz(i)]}>
          <mesh position={[0, 0.04, 0]} material={bits[i] ? VM.binGlow() : VM.binDim()} userData={{ noCollide: true }}><boxGeometry args={[1.8, 0.08, 1.8]} /></mesh>
          <Text font={FONT.mono} fontSize={0.7} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} anchorX="center" anchorY="middle">{String(v)}<meshBasicMaterial attach="material" color={bits[i] ? '#05304a' : '#6f8fb0'} toneMapped={false} /></Text>
          {hall && step < 3 && <mesh position={[0, 0.5, 0]} onClick={(e) => { e.stopPropagation(); if (Math.hypot(RT.player.x - VPX, RT.player.z - vpz(i)) < 7) toggle(i) }} userData={{ noCollide: true }}><boxGeometry args={[1.8, 1, 1.8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
        </group>
      ))}
      {/* porta redonda do cofre */}
      {!doorOpen && <Solid invisible><mesh position={[-12.3, y + 1.65, -64]}><boxGeometry args={[0.7, 3.3, 2.5]} /></mesh></Solid>}
      <group position={[-12.0, y + 1.65, -64]}>
        <group ref={door}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={MAT.iron()} castShadow userData={{ noCollide: true }}><cylinderGeometry args={[1.3, 1.3, 0.35, 40]} /></mesh>
          <mesh position={[0.19, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={MAT.gold()} userData={{ noCollide: true }}><torusGeometry args={[1.12, 0.05, 8, 40]} /></mesh>
          <mesh position={[0.18, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={VM.obsidian()} userData={{ noCollide: true }}><circleGeometry args={[1.05, 40]} /></mesh>
          {Array.from({ length: orbN }, (_, i) => { const a = (i / Math.max(orbN, 1)) * Math.PI * 2; return <mesh key={i} position={[0.22, Math.sin(a) * 0.72, Math.cos(a) * 0.72]} material={VM.crystalGold()} userData={{ noCollide: true }}><sphereGeometry args={[0.085, 10, 8]} /></mesh> })}
          {[0, 1, 2].map((i) => <mesh key={'l' + i} position={[0.22, 0, (i - 1) * 0.3]} material={step > i ? VM.binGlow() : VM.binDim()} userData={{ noCollide: true }}><sphereGeometry args={[0.1, 10, 8]} /></mesh>)}
        </group>
      </group>
      {[0, 1, 2, 3].map((i) => <BinDigit key={i} position={[-11.68, y + 3.85, -62.8 - i * 0.8]} rotY={Math.PI / 2} on={bits[i]} size={0.55} />)}
      {/* fragmento BIT */}
      <Pedestal position={P.vault} h={1.0} r={0.5} mat={MAT.stoneDark()} />
      {doorOpen && !qdone && (
        <group position={[P.vault[0], P.vault[1], P.vault[2]]}>
          <group ref={coin} position={[0, 1.55, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={VM.binGlow()}><cylinderGeometry args={[0.32, 0.32, 0.06, 32]} /></mesh>
            <Text font={FONT.mono} fontSize={0.36} position={[0, 0, 0.04]} anchorX="center" anchorY="middle">1<meshBasicMaterial attach="material" color="#05304a" toneMapped={false} /></Text>
            <Text font={FONT.mono} fontSize={0.36} position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]} anchorX="center" anchorY="middle">0<meshBasicMaterial attach="material" color="#05304a" toneMapped={false} /></Text>
          </group>
          <Sparkles count={20} scale={[1.2, 1.2, 1.2]} position={[0, 1.55, 0]} size={5} speed={0.6} color="#9fe9ff" />
        </group>
      )}
      <Interactable id="bit" label="Pegar o Fragmento: BIT" position={[P.vault[0] + 1.4, P.vault[1], P.vault[2]]} radius={1.8} enabled={!!doorOpen && !qdone} onUse={() => { gesture('reach', 1.2); pickBit() }} markerY={2.4} color="#9fe9ff" />
    </group>
  )
}

export { caveDoor }
