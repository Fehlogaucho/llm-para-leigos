import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Sparkles } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { Dust } from '../../world/Atmosphere'
import { Interactable, Solid, useFlag } from '../../world/core'
import { Portal } from '../../world/Instruments'
import { MAT } from '../../world/materials'
import { FONT } from '../../world/fonts'
import { RT } from '../../engine/runtime'
import { SFX } from '../../engine/audio'
import { start, type Ctx } from '../../engine/script'
import { G } from '../../store'
import { Corridor, DC, MATS, type V3 } from './computacao/Corridor'
import { BitSwitch, ByteBoard, PixelWall, SoundLab, TextTerminal, BIT_USE, BYTE_USE, IMG_USE, SOM_USE, TXT_USE } from './computacao/Puzzles'

/* =========================================================
   FASE 1 · ÁREA 6 — A SALA DA COMPUTAÇÃO
   Conceito: processamento de informação. Tudo vira 0 e 1.
   Relé (bit) → válvulas (byte) → ENIAC → circuito (imagem) → PC (som)
   → servidores (texto) → data center: o computador antigo e a matriz → portal.
   ========================================================= */
const OLD: V3 = [0, 0, -86]
const OLD_USE: V3 = [0, 0, -83.8]
const PORTAL: V3 = [0, 0, -97]
const PORTAL_USE: V3 = [0, 0, -94.8]
const BITS = '0 1 0 1 1 0 0 1'
export const FIN = { matrix: 0, t0: 0 }

/** O computador antigo (CRT bege) num pedestal, no meio do data center. */
function OldComputer() {
  const ready = useFlag('a6_texto'), done = useFlag('a6_done')
  const [shown, setShown] = useState(done ? BITS.length : 0)
  const run = () => start('velho', async (c) => {
    if (c.flag('a6_done')) return
    c.freeze(true); c.objective(null)
    RT.lookAt = new THREE.Vector3(OLD[0], 0, OLD[2])
    c.focus([OLD[0] + 1.3, 2.1, OLD[2] + 3.2], [OLD[0], 1.45, OLD[2]], 46)
    await c.say([
      { who: 'NEX', text: 'Um computador antigo, no meio de todas essas máquinas novas?' },
      { who: 'NOVA', text: 'O avô de todas elas. Ligue e olhe a tela.' },
    ])
    SFX.play('click')
    for (let i = 1; i <= BITS.length; i++) { setShown(i); if (BITS[i - 1] !== ' ') SFX.play('tick'); await c.wait(0.12) }
    await c.wait(0.8)
    await c.say([
      { who: 'NEX', text: 'Isso não parece linguagem.' },
      { who: 'NOVA', text: 'Para uma máquina, é.' },
      { who: 'NOVA', text: 'Letras, imagens, sons: aqui dentro, tudo vira número. E quando a gente organiza muitos números em linhas e colunas…' },
    ])
    FIN.matrix = 1; FIN.t0 = performance.now(); SFX.play('whoosh')
    await c.cinematic([
      { pos: [OLD[0] + 2, 2.4, OLD[2] + 5], look: [0, 4, DC.z1], dur: 0.01, cut: true },
      { pos: [0, 3.2, OLD[2] + 7], look: [0, 4.6, DC.z1], dur: 4.5 },
    ], false)
    SFX.play('core')
    await c.say([
      { who: 'NOVA', text: '…temos uma matriz. É com ela que uma máquina começa a representar o mundo.' },
      { who: 'NEX', text: 'E uma LLM usa isso?' },
      { who: 'NOVA', text: 'O tempo todo. Vamos começar por aqui: o portal leva à Câmara da Matriz.' },
    ])
    c.discover('hist_computadores')
    c.setFlag('a6_done')
    RT.lookAt = null
    c.unfocus(); c.freeze(false)
  })
  const txt = BITS.slice(0, shown)
  return (
    <group>
      <group position={OLD}>
        <Solid><mesh position={[0, 0.45, 0]} material={MAT.marble()} castShadow receiveShadow><cylinderGeometry args={[0.9, 1.05, 0.9, 32]} /></mesh></Solid>
        <mesh position={[0, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MATS.glowCyan()} userData={{ noCollide: true }}><ringGeometry args={[0.9, 0.96, 40]} /></mesh>
        <mesh position={[0, 1.35, -0.05]} material={MATS.beige()} castShadow userData={{ noCollide: true }}><boxGeometry args={[0.8, 0.7, 0.7]} /></mesh>
        <mesh position={[0, 1.37, 0.31]} userData={{ noCollide: true }}><planeGeometry args={[0.6, 0.46]} /><meshStandardMaterial color="#061008" emissive="#2aff6a" emissiveIntensity={shown ? 0.35 : 0.04} /></mesh>
        <Text font={FONT.mono} fontSize={0.06} position={[0, 1.37, 0.32]} color="#8affb0" anchorX="center" anchorY="middle">{txt}</Text>
        <mesh position={[0, 0.95, 0.32]} material={MATS.beige()} userData={{ noCollide: true }}><boxGeometry args={[0.7, 0.05, 0.25]} /></mesh>
      </group>
      {!done && <Sparkles count={24} scale={[2, 2, 2]} position={[OLD[0], 1.5, OLD[2]]} size={4} color="#9fe9ff" />}
      <Interactable id="velho" label="Ligar o computador antigo" position={OLD_USE} radius={2} enabled={!!ready && !done} onUse={run} markerY={2.4} />
    </group>
  )
}

/** Tela gigante no fundo do data center: os números viram uma matriz. */
function MatrixWall() {
  const done = useFlag('a6_done')
  const { tex, cv } = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return { tex: t, cv } }, [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 1.2, color: '#000000' }), [tex])
  const cells = useMemo(() => Array.from({ length: 16 * 8 }, (): number => (Math.random() < 0.5 ? 1 : 0)), [])
  const acc = useRef(0)
  if (done && !FIN.matrix) { FIN.matrix = 1; FIN.t0 = performance.now() - 9000 }
  useFrame((_, dt) => {
    acc.current += dt
    if (acc.current < 0.12) return
    acc.current = 0
    const c = cv.getContext('2d')!
    c.fillStyle = '#02060c'; c.fillRect(0, 0, 1024, 512)
    if (!FIN.matrix) { c.fillStyle = '#0a1a2a'; c.font = 'bold 40px monospace'; c.textAlign = 'center'; c.fillText('SEM SINAL', 512, 270); tex.needsUpdate = true; return }
    const k = Math.min(1, (performance.now() - FIN.t0) / 3500)
    for (let n = 0; n < 6; n++) { const i = Math.floor(Math.random() * cells.length); cells[i] = 1 - cells[i] }
    c.strokeStyle = 'rgba(89,215,255,.5)'; c.lineWidth = 4
    c.beginPath(); c.moveTo(40, 30); c.lineTo(22, 30); c.lineTo(22, 482); c.lineTo(40, 482); c.stroke()
    c.beginPath(); c.moveTo(984, 30); c.lineTo(1002, 30); c.lineTo(1002, 482); c.lineTo(984, 482); c.stroke()
    c.font = 'bold 40px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'
    for (let r = 0; r < 8; r++) for (let q = 0; q < 16; q++) {
      if ((r + q) / 22 > k) continue
      const v = cells[r * 16 + q]
      c.fillStyle = v ? '#9fefff' : '#2a6a8a'
      c.fillText(String(v), 70 + q * 59, 60 + r * 56)
    }
    tex.needsUpdate = true
  })
  return (
    <group position={[0, 5, DC.z1 + 0.05]}>
      <mesh material={MAT.dark()} position={[0, 0, -0.04]} userData={{ noCollide: true }}><boxGeometry args={[17.2, 8.8, 0.08]} /></mesh>
      <mesh material={mat} userData={{ noCollide: true, noBatch: true }}><planeGeometry args={[16.4, 8.2]} /></mesh>
    </group>
  )
}

function PortalSpot() {
  const done = useFlag('a6_done')
  return (
    <>
      <Portal position={PORTAL} rotY={0} active={!!done} s={0.8} />
      <Interactable id="portal6" label="Atravessar o portal" position={PORTAL_USE} radius={2.2} enabled={!!done} onUse={() => start('portal6', async (c) => { c.objective(null); c.goto('p1a7') })} markerY={4.6} color="#7fe3ff" />
    </>
  )
}

/* =================== roteiro =================== */
async function main(c: Ctx) {
  if (!c.flag('a6_intro')) {
    await c.cinematic([
      { pos: [0, 4.6, 11.5], look: [0, 2, -30], dur: 0.01, cut: true },
      { pos: [0, 3.4, -2], look: [0, 2, -40], dur: 5 },
      { pos: [0, 2.6, 11], look: [0, 1.6, 4], dur: 0.01, cut: true },
      { pos: [0, 2.4, 10.6], look: [0, 1.6, 4], dur: 1.6 },
    ])
    await c.say([
      { who: 'NEX', text: 'Que corredor comprido! Cada parte parece de uma época diferente.' },
      { who: 'NOVA', text: 'A Sala da Computação. Aqui as engrenagens viram eletricidade, e a eletricidade vira 0 e 1.' },
      { who: 'NOVA', text: 'Vamos atravessar a história: dos relés que estalavam até os data centers onde as LLMs moram hoje.' },
    ])
    c.setFlag('a6_intro')
  }
  if (!c.flag('a6_bit')) { c.objective('Ligue a chave do relé', BIT_USE); await c.waitFlag('a6_bit') }
  if (!c.flag('a6_byte')) { c.objective('Acenda as válvulas para formar a senha', BYTE_USE); await c.waitFlag('a6_byte') }
  if (!c.flag('a6_texto')) { c.objective('Decifre a mensagem do servidor', TXT_USE); await c.waitFlag('a6_texto') }
  if (!c.flag('a6_done')) { c.objective('Ligue o computador antigo no data center', OLD_USE); await c.waitFlag('a6_done') }
  c.objective('Atravesse o portal para a Câmara da Matriz', PORTAL_USE)
}
function hint(id: string, pos: V3, r: number, lines: { who: string; text: string }[], quest?: [string, string], after?: (c: Ctx) => void) {
  return async (c: Ctx) => {
    if (c.flag('a6_h_' + id)) return
    await c.waitFlag('a6_intro')
    await c.reach(pos, r)
    c.setFlag('a6_h_' + id)
    if (quest) c.quest(quest[0], 'active', quest[1])
    after?.(c)
    await c.say(lines as any, { ambient: true })
  }
}
const hints = [
  hint('valv', [0, 0, -9], 3, [{ who: 'NEX', text: 'Que calor! Essas lâmpadas são válvulas?' }, { who: 'NOVA', text: 'São. Cada uma funcionava como um interruptor, só que sem peças mexendo. Muito mais rápido.' }]),
  hint('eniac', [0, 0, -25], 3.5, [{ who: 'NOVA', text: 'O ENIAC, de 1945, tinha quase 18 mil válvulas e ocupava uma sala inteira. Era programado ligando cabos.' }]),
  hint('img', IMG_USE, 4.5, [{ who: 'NOVA', text: 'Uma tela de quadradinhos, cada um com um número. Parece que o desenho quebrou.' }], ['q_imagem', 'Imagem em Números']),
  hint('som', SOM_USE, 4.5, [{ who: 'NOVA', text: 'Uma caixa de som ligada a uma tela cheia de números. Quer ouvir?' }], ['q_som', 'Som em Números']),
  hint('dc', [0, 0, -76], 4, [{ who: 'NEX', text: 'Uau! Quantas máquinas!' }, { who: 'NOVA', text: 'Um data center: milhares de computadores trabalhando juntos. É aqui que as LLMs aprendem e respondem.' }]),
]

export default function Computacao() {
  const f = G().flags
  FIN.matrix = f.a6_done ? 1 : 0
  const spawn: V3 = f.a6_texto ? [0, 0.1, -74.5] : f.a6_byte ? [0, 0.1, -24.5] : f.a6_bit ? [0, 0.1, -8.5] : [0, 0.1, 9]
  useLevel({ spawn, yaw: Math.PI, scripts: [main, ...hints], minY: -6 })
  return (
    <>
      <color attach="background" args={['#05070c']} />
      <fog attach="fog" args={['#070a12', 26, 90]} />
      <hemisphereLight args={['#8a9ac8', '#1a1410', 0.7]} />
      <ambientLight intensity={0.25} color="#8a9ab8" />
      <directionalLight position={[6, 12, 4]} intensity={0.6} color="#dfe6ff" />
      <Dust count={70} scale={[12, 5, 90]} position={[0, 2.5, -40]} color="#cfe0ff" />
      <Corridor />
      <BitSwitch />
      <ByteBoard />
      <PixelWall />
      <SoundLab />
      <TextTerminal />
      <OldComputer />
      <MatrixWall />
      <PortalSpot />
    </>
  )
}
