import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Interactable, Solid, useFlag } from '../../../world/core'
import { Gate, useFarClose } from '../../../world/mechanics'
import { MAT } from '../../../world/materials'
import { useOverlay, Panel } from '../../../world/puzzle'
import { FONT } from '../../../world/fonts'
import { RT, gesture } from '../../../engine/runtime'
import { SFX, playSamples } from '../../../engine/audio'
import { start } from '../../../engine/script'
import { G, useGame } from '../../../store'
import { CW, GATE_Z, MATS, type V3 } from './Corridor'

const chr = (n: number) => (n >= 32 && n <= 126 ? String.fromCharCode(n) : '-')

/* =========================================================
   1. O BIT — uma chave de faca, um relé e uma lâmpada
   ========================================================= */
export const BIT_USE: V3 = [0, 0, -1.2]
export function BitSwitch() {
  const on = useFlag('a6_bit_on')
  const done = useFlag('a6_bit')
  const blade = useRef<THREE.Group>(null!), lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff4d0', emissive: '#ffcf6a', emissiveIntensity: 0 }), [])
  useFrame(() => {
    if (blade.current) blade.current.rotation.x += ((on ? -0.05 : -1.2) - blade.current.rotation.x) * 0.2
    lampMat.emissiveIntensity += ((on ? 4 : 0.02) - lampMat.emissiveIntensity) * 0.2
  })
  const use = () => {
    const v = on ? 0 : 1
    G().setFlag('a6_bit_on', v)
    SFX.play(v ? 'click' : 'tick'); gesture('reach', 0.7)
    if (v && !G().flags.a6_bit) start('bit', async (c) => {
      c.quest('q_bit', 'active', 'O Bit')
      await c.wait(0.6)
      c.setFlag('a6_bit')
      await c.say([
        { who: 'NEX', text: 'Clac! A lâmpada acendeu e o portão abriu.' },
        { who: 'NOVA', text: 'Este é um relé, um interruptor elétrico. Desligado vale 0. Ligado vale 1.' },
        { who: 'NOVA', text: 'Essa é a menor informação que existe: um bit. Sim ou não. Aceso ou apagado.' },
        { who: 'NEX', text: 'Só isso? Como dá para fazer alguma coisa com só 0 e 1?' },
        { who: 'NOVA', text: 'Juntando muitos. Continue pelo corredor: cada sala é uma época, e as máquinas vão ficando menores e mais rápidas.' },
      ])
      c.discover('bit')
      c.quest('q_bit', 'done', 'O Bit')
    })
  }
  return (
    <group>
      <group position={[0, 0, -2.6]}>
        <Solid><mesh position={[0, 1.2, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[2.6, 2.4, 0.5]} /></mesh></Solid>
        <mesh position={[0, 1.35, 0.26]} material={MAT.marble()} userData={{ noCollide: true }}><boxGeometry args={[1.2, 1.2, 0.04]} /></mesh>
        {[-0.2, 0.2].map((x) => <mesh key={x} position={[x, 1.0, 0.32]} material={MAT.copper()} userData={{ noCollide: true }}><boxGeometry args={[0.08, 0.16, 0.1]} /></mesh>)}
        <group ref={blade} position={[0, 1.0, 0.34]} userData={{ noBatch: true }}>
          {[-0.2, 0.2].map((x) => <mesh key={x} position={[x, 0.32, 0]} material={MAT.copper()}><boxGeometry args={[0.05, 0.64, 0.03]} /></mesh>)}
          <mesh position={[0, 0.66, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.woodDark()}><cylinderGeometry args={[0.06, 0.06, 0.6, 10]} /></mesh>
        </group>
        {/* lâmpada */}
        <mesh position={[0, 2.85, 0.1]} material={lampMat} userData={{ noBatch: true, noCollide: true }}><sphereGeometry args={[0.22, 16, 12]} /></mesh>
        <mesh position={[0, 2.6, 0.1]} material={MAT.bronze()} userData={{ noCollide: true }}><cylinderGeometry args={[0.1, 0.12, 0.18, 12]} /></mesh>
        <Text font={FONT.mono} fontSize={0.8} position={[0.95, 1.5, 0.27]} color={on ? '#ffd27a' : '#6a5a4a'} anchorX="center" anchorY="middle">{on ? '1' : '0'}</Text>
        <Text font={FONT.title} fontSize={0.16} position={[0.95, 0.9, 0.27]} color="#e8d8b8" anchorX="center">{on ? 'LIGADO' : 'DESLIGADO'}</Text>
      </group>
      {on ? <pointLight position={[0, 3, -1.8]} color="#ffcf6a" intensity={4} distance={7} decay={1.6} /> : null}
      <Interactable id="bit" label={on ? 'Desligar a chave' : 'Ligar a chave'} position={BIT_USE} radius={1.8} onUse={use} markerY={2.2} />
      <Gate position={[0, 0, GATE_Z[0]]} open={!!done} w={3.2} h={3.6} mat={MAT.woodDark()} />
    </group>
  )
}

/* =========================================================
   2. BYTES — oito válvulas formam a letra da senha
   ========================================================= */
export const BYTE_USE: V3 = [0, 0, -15.4]
const PLACE = [128, 64, 32, 16, 8, 4, 2, 1]
export function ByteBoard() {
  const done = useFlag('a6_byte')
  const [open, setOpen] = useState(false)
  const [bits, setBits] = useState<boolean[]>(done ? [false, true, false, false, true, false, false, true] : Array(8).fill(false))
  const val = bits.reduce((a, b, i) => a + (b ? PLACE[i] : 0), 0)
  const okRef = useRef(false); okRef.current = val === 73
  const openRef = useRef(open); openRef.current = open
  const glow = useMemo(() => bits.map(() => new THREE.MeshStandardMaterial({ color: '#ffd0a0', emissive: '#ff7a2a', emissiveIntensity: 0.05, roughness: 0.2 })), [])
  useFrame(() => { glow.forEach((m, i) => { m.emissiveIntensity += ((bits[i] ? 3 : 0.05) - m.emissiveIntensity) * 0.2 }) })
  const toggle = (i: number) => { SFX.play(bits[i] ? 'tick' : 'click'); setBits((b) => b.map((v, k) => (k === i ? !v : v))) }
  const run = () => start('byte', async (c) => {
    c.quest('q_byte', 'active', 'Bytes')
    setOpen(true); openRef.current = true
    c.focus([0.2, 3.6, -11.6], [0, 2.1, -18], 50)
    if (!c.flag('a6_byte_seen')) {
      c.setFlag('a6_byte_seen')
      await c.say([
        { who: 'NOVA', text: 'Oito válvulas, oito bits. Cada uma acesa soma o número que está em cima dela.' },
        { who: 'NOVA', text: 'O portão pede a senha “I”. Para o computador, cada letra é um número. Acenda as válvulas até aparecer o I.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.4)
    setOpen(false); c.unfocus()
    if (!c.flag('a6_byte')) {
      c.setFlag('a6_byte')
      await c.say([
        { who: 'NEX', text: '64 + 8 + 1 = 73… e 73 é a letra I!' },
        { who: 'NOVA', text: 'Oito bits juntos formam um byte. Com um byte dá para guardar um número de 0 a 255, ou uma letra.' },
        { who: 'NOVA', text: 'As válvulas faziam isso muito mais rápido que os relés. Mas esquentavam e queimavam o tempo todo.' },
      ])
      c.discover('byte')
      c.quest('q_byte', 'done', 'Bytes')
    }
  })
  useFarClose(open, () => setOpen(false), BYTE_USE, 4.5)
  useOverlay('byte', open ? (
    <Panel title="Painel de Válvulas" onExit={() => setOpen(false)}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, maxWidth: 420, margin: '0 auto' }}>
        {bits.map((b, i) => (
          <button key={i} onClick={() => toggle(i)} aria-label={`bit ${PLACE[i]}`}
            style={{ height: 64, borderRadius: 10, border: '2px solid ' + (b ? '#ffb060' : '#4a4a58'), background: b ? 'radial-gradient(circle at 50% 40%, #ffe0a0, #e2741e)' : '#1a1c24', color: b ? '#2a1204' : '#c8c8d8', fontFamily: 'var(--f-mono)', fontWeight: 900, cursor: 'pointer' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{PLACE[i]}</div><div style={{ fontSize: 20 }}>{b ? 1 : 0}</div>
          </button>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontFamily: 'var(--f-mono)', marginTop: 8, fontSize: 15 }}>
        {bits.map((b) => (b ? 1 : 0)).join('')} = <b>{val}</b> = letra <b style={{ color: val === 73 ? '#8ff0b0' : '#ffd27a', fontSize: 20 }}>{chr(val)}</b>
      </p>
      <p style={{ textAlign: 'center', fontSize: 13 }}>Senha do portão: <b>I</b> (o número 73)</p>
    </Panel>
  ) : null, [open, bits, val])
  return (
    <group>
      <group position={[0, 0, -18.2]}>
        <Solid><mesh position={[0, 0.6, 0]} material={MAT.iron()} castShadow><boxGeometry args={[8.4, 1.2, 1]} /></mesh></Solid>
        <mesh position={[0, 3.3, -0.35]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[8.6, 4.4, 0.2]} /></mesh>
        {bits.map((b, i) => {
          const x = -3.5 + i
          return (
            <group key={i} position={[x, 1.2, 0]}>
              <mesh position={[0, 0.7, 0]} material={glow[i]} userData={{ noBatch: true }}><cylinderGeometry args={[0.16, 0.16, 1.1, 14]} /></mesh>
              <mesh position={[0, 0.75, 0]} material={MATS.glass()} userData={{ noCollide: true }}><capsuleGeometry args={[0.3, 1.0, 6, 14]} /></mesh>
              <mesh position={[0, 0.05, 0]} material={MAT.bronzeDark()} userData={{ noCollide: true }}><cylinderGeometry args={[0.32, 0.36, 0.12, 14]} /></mesh>
              <Text font={FONT.mono} fontSize={0.26} position={[0, 2.0, 0]} color="#e8d8b8" anchorX="center">{String(PLACE[i])}</Text>
              <Text font={FONT.mono} fontSize={0.34} position={[0, -0.32, 0.52]} color={b ? '#ffd27a' : '#6a6a78'} anchorX="center" anchorY="middle">{b ? '1' : '0'}</Text>
            </group>
          )
        })}
        <Text font={FONT.mono} fontSize={0.5} position={[0, 4.6, -0.2]} color="#ffd27a" anchorX="center" anchorY="middle">{`${val} = ${chr(val)}`}</Text>
      </group>
      <Interactable id="byte" label={done ? 'Mexer nas válvulas' : 'Acender as válvulas'} position={BYTE_USE} radius={2} onUse={run} markerY={2.6} />
      <Gate position={[0, 0, GATE_Z[1]]} open={!!done} w={3.2} h={3.6} mat={MAT.iron()} />
      <Text font={FONT.mono} fontSize={0.34} position={[0, 4.26, GATE_Z[1] + 0.58]} color="#ffe2a3" anchorX="center" anchorY="middle">SENHA: I</Text>
    </group>
  )
}

/* =========================================================
   side quest: IMAGEM EM NÚMEROS — conserte o coração
   ========================================================= */
export const IMG_USE: V3 = [-3.6, 0, -42.5]
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'].map((r) => r.split('').map(Number))
const START = HEART.map((r) => r.slice())
START[0][3] = 1; START[1][0] = 0; START[3][6] = 1; START[4][3] = 0
export function PixelWall() {
  const done = useGame((s) => s.quests.q_imagem === 'done')
  const [open, setOpen] = useState(false)
  const [g, setG] = useState(done ? HEART.map((r) => r.slice()) : START.map((r) => r.slice()))
  const ok = g.every((r, i) => r.every((v, j) => v === HEART[i][j]))
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const flip = (i: number, j: number) => { SFX.play('tick'); setG((x) => x.map((r, a) => r.map((v, b) => (a === i && b === j ? 1 - v : v)))) }
  const run = () => start('imagem', async (c) => {
    c.quest('q_imagem', 'active', 'Imagem em Números')
    setOpen(true); openRef.current = true
    c.focus([IMG_USE[0] + 3.2, 3.2, IMG_USE[2] + 0.2], [-CW, 2.6, IMG_USE[2]], 52)
    if (!c.flag('a6_img_seen')) {
      c.setFlag('a6_img_seen')
      await c.say({ who: 'NOVA', text: 'Esta tela é feita de números: 1 acende o quadradinho, 0 apaga. Alguns números estão errados. Conserte para formar o coração.' }, { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.2)
    setOpen(false); c.unfocus()
    if (G().quests.q_imagem !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Mudei uns números e o desenho ficou certo!' },
        { who: 'NOVA', text: 'Toda imagem no computador é assim: uma grade de números. Cada quadradinho é um pixel.' },
        { who: 'NOVA', text: 'Guarde essa ideia: uma grade de números com linhas e colunas tem um nome. Você vai ver já já.' },
      ])
      c.discover('imagem_numeros')
      c.fragment('computacao', 'Fragmento: COMPUTAÇÃO')
      c.quest('q_imagem', 'done', 'Imagem em Números')
    }
  })
  useFarClose(open, () => setOpen(false), IMG_USE, 4.5)
  useOverlay('imagem', open ? (
    <Panel title="Imagem em Números" onExit={() => setOpen(false)}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 34px)', gap: 3 }}>
          {g.map((r, i) => r.map((v, j) => (
            <button key={i + '_' + j} onClick={() => flip(i, j)} aria-label={`linha ${i + 1} coluna ${j + 1}`}
              style={{ height: 34, borderRadius: 6, border: '1px solid #3a4a5a', background: v ? '#ff5a7a' : '#121822', color: v ? '#2a0a10' : '#7a8a9a', fontFamily: 'var(--f-mono)', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>{v}</button>
          )))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 10px)', gap: 2, margin: '0 auto 4px', width: 'max-content' }}>
            {HEART.flat().map((v, k) => <span key={k} style={{ width: 10, height: 10, background: v ? '#ff5a7a' : '#1c2430', borderRadius: 2 }} />)}
          </div>
          modelo
        </div>
      </div>
    </Panel>
  ) : null, [open, g])
  return (
    <group>
      <group position={[-CW + 0.12, 2.7, IMG_USE[2]]} rotation={[0, Math.PI / 2, 0]}>
        <mesh userData={{ noCollide: true }}><planeGeometry args={[4.2, 3.7]} /><meshStandardMaterial color="#05080c" /></mesh>
        {g.map((r, i) => r.map((v, j) => (
          <group key={i + '_' + j} position={[-1.68 + j * 0.56, 1.4 - i * 0.56, 0.02]}>
            <mesh userData={{ noCollide: true }}><planeGeometry args={[0.5, 0.5]} /><meshStandardMaterial color={v ? '#ff9ab0' : '#141a24'} emissive={v ? '#ff3a6a' : '#000000'} emissiveIntensity={v ? 1.6 : 0} /></mesh>
            <Text font={FONT.mono} fontSize={0.16} position={[0.17, -0.17, 0.01]} color={v ? '#3a0a14' : '#4a5a6a'} anchorX="center" anchorY="middle">{String(v)}</Text>
          </group>
        )))}
      </group>
      <group position={[IMG_USE[0] - 0.9, 0, IMG_USE[2]]}>
        <Solid><mesh position={[0, 0.5, 0]} material={MAT.dark()}><boxGeometry args={[0.6, 1, 0.9]} /></mesh></Solid>
        <mesh position={[0.05, 1.04, 0]} rotation={[0, 0, 0.4]} material={MATS.screenBlue()} userData={{ noCollide: true }}><boxGeometry args={[0.5, 0.05, 0.7]} /></mesh>
      </group>
      <Interactable id="imagem" label="Consertar a imagem" position={IMG_USE} radius={1.8} onUse={run} markerY={2.2} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   side quest: SOM EM NÚMEROS — três listas de números, três sons
   ========================================================= */
export const SOM_USE: V3 = [3.6, 0, -54]
const SOUNDS = [
  { k: 'Grave', s: [0, 5, 9, 5, 0, -5, -9, -5], f: 110 },
  { k: 'Médio', s: [0, 9, 0, -9], f: 330 },
  { k: 'Agudo', s: [0, 9, -9], f: 880 },
]
export function SoundLab() {
  const done = useGame((s) => s.quests.q_som === 'done')
  const [open, setOpen] = useState(false)
  const [heard, setHeard] = useState<number[]>([])
  const [cur, setCur] = useState(0)
  const heardRef = useRef(heard); heardRef.current = heard
  const openRef = useRef(open); openRef.current = open
  const cone = useRef<THREE.Mesh>(null!), playT = useRef(0)
  useFrame(() => { if (cone.current) { const k = Math.max(0, 1 - (performance.now() - playT.current) / 1400); cone.current.position.x = Math.sin(RT.time * 60) * 0.03 * k } })
  const play = (i: number) => { setCur(i); playSamples(SOUNDS[i].s, SOUNDS[i].f, 1.3); playT.current = performance.now(); setHeard((h) => (h.includes(i) ? h : [...h, i])) }
  const run = () => start('som', async (c) => {
    c.quest('q_som', 'active', 'Som em Números')
    setOpen(true); openRef.current = true
    c.focus([SOM_USE[0] - 3.2, 3.0, SOM_USE[2] + 0.4], [CW, 2.2, SOM_USE[2]], 52)
    if (!c.flag('a6_som_seen')) {
      c.setFlag('a6_som_seen')
      await c.say({ who: 'NOVA', text: 'O som também vira números: medidas da onda, uma atrás da outra. Toque as três listas e escute.' }, { ambient: true })
    }
    await c.until(() => heardRef.current.length >= 3 || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    await c.wait(1.6)
    setOpen(false); c.unfocus()
    if (G().quests.q_som !== 'done') {
      await c.say([
        { who: 'NEX', text: 'Os números que sobem e descem mais rápido fazem o som mais fino!' },
        { who: 'NOVA', text: 'O microfone mede a onda milhares de vezes por segundo. Tocar essas medidas de volta recria o som.' },
        { who: 'NOVA', text: 'Letras, imagens, sons: para o computador, tudo é número.' },
      ])
      c.discover('som_numeros')
      c.quest('q_som', 'done', 'Som em Números')
    }
  })
  useFarClose(open, () => setOpen(false), SOM_USE, 4.5)
  useOverlay('som', open ? (
    <Panel title="Som em Números" onExit={() => setOpen(false)}>
      <p style={{ fontSize: 13.5 }}>Cada som é uma lista de medidas que se repete. Toque para ouvir.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420, margin: '0 auto' }}>
        {SOUNDS.map((s, i) => (
          <button key={s.k} className={'btn' + (cur === i ? ' primary' : '')} onClick={() => play(i)} style={{ justifyContent: 'space-between', display: 'flex', gap: 10 }}>
            <span>{heard.includes(i) ? '✓ ' : '▶ '}{s.k}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>[{s.s.join(', ')}] × {s.f} por segundo</span>
          </button>
        ))}
      </div>
    </Panel>
  ) : null, [open, heard, cur])
  const sc = SOUNDS[cur].s
  return (
    <group>
      <group position={[CW - 0.12, 2.6, SOM_USE[2]]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh userData={{ noCollide: true }}><planeGeometry args={[3.6, 2.2]} /><meshStandardMaterial color="#04100a" emissive="#0a2a14" emissiveIntensity={0.5} /></mesh>
        {Array.from({ length: 24 }, (_, k) => {
          const v = sc[k % sc.length]
          return (
            <group key={k} position={[-1.6 + k * 0.139, 0, 0.02]}>
              <mesh position={[0, v * 0.09 / 2, 0]} userData={{ noCollide: true }}><planeGeometry args={[0.1, Math.max(0.02, Math.abs(v) * 0.09)]} /><meshBasicMaterial color="#5aff9a" toneMapped={false} /></mesh>
            </group>
          )
        })}
        <Text font={FONT.mono} fontSize={0.16} position={[0, -0.95, 0.02]} color="#8ff0b0" anchorX="center">{sc.join('  ')}</Text>
      </group>
      {/* caixa de som */}
      <group position={[CW - 0.6, 0, SOM_USE[2] - 2.2]}>
        <Solid><mesh position={[0, 0.8, 0]} material={MAT.woodDark()} castShadow><boxGeometry args={[0.9, 1.6, 0.9]} /></mesh></Solid>
        <mesh ref={cone} position={[-0.46, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.dark()} userData={{ noBatch: true, noCollide: true }}><cylinderGeometry args={[0.32, 0.22, 0.06, 20]} /></mesh>
      </group>
      <group position={[SOM_USE[0] + 0.9, 0, SOM_USE[2]]}>
        <Solid><mesh position={[0, 0.5, 0]} material={MAT.dark()}><boxGeometry args={[0.6, 1, 0.9]} /></mesh></Solid>
        <mesh position={[-0.05, 1.04, 0]} rotation={[0, 0, -0.4]} material={MATS.screenGreen()} userData={{ noCollide: true }}><boxGeometry args={[0.5, 0.05, 0.7]} /></mesh>
      </group>
      <Interactable id="som" label="Ouvir os números" position={SOM_USE} radius={1.8} onUse={run} markerY={2.2} color={done ? '#9fe9ff' : '#ffd27a'} />
    </group>
  )
}

/* =========================================================
   3. TEXTO EM NÚMEROS — decifre a mensagem do servidor
   ========================================================= */
export const TXT_USE: V3 = [0, 0, -65.2]
const CODE = [78, 69, 88]
const ABC = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
export function TextTerminal() {
  const done = useFlag('a6_texto')
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState<(string | null)[]>(done ? ['N', 'E', 'X'] : [null, null, null])
  const [slot, setSlot] = useState(0)
  const ok = word.every((w, i) => w && w.charCodeAt(0) === CODE[i])
  const okRef = useRef(ok); okRef.current = ok
  const openRef = useRef(open); openRef.current = open
  const pick = (l: string) => { SFX.play('tick'); setWord((w) => w.map((x, i) => (i === slot ? l : x))); setSlot((s) => Math.min(2, s + 1)) }
  const run = () => start('texto', async (c) => {
    c.quest('q_texto', 'active', 'Texto em Números')
    setOpen(true); openRef.current = true
    c.focus([0.3, 3.0, TXT_USE[2] + 3.6], [0, 1.8, TXT_USE[2] - 1.4], 50)
    if (!c.flag('a6_txt_seen')) {
      c.setFlag('a6_txt_seen')
      await c.say([
        { who: 'NOVA', text: 'O servidor guarda uma mensagem, mas só em números: 78, 69, 88.' },
        { who: 'NOVA', text: 'Cada letra tem o seu número: A é 65, B é 66, e assim por diante. Descubra a palavra para abrir o data center.' },
      ], { ambient: true })
    }
    await c.until(() => okRef.current || !openRef.current)
    if (!openRef.current) { c.unfocus(); return }
    SFX.play('success')
    await c.wait(1.3)
    setOpen(false); c.unfocus()
    if (!c.flag('a6_texto')) {
      c.setFlag('a6_texto')
      await c.say([
        { who: 'NEX', text: 'N, E, X… É o meu nome!' },
        { who: 'NOVA', text: 'Todo texto que você digita vira uma fila de números. É assim que o computador guarda palavras.' },
        { who: 'NOVA', text: 'Lembre disso: uma LLM também começa trocando texto por números. Antes de escrever, ela conta.' },
      ])
      c.discover('texto_numeros')
      c.quest('q_texto', 'done', 'Texto em Números')
    }
  })
  useFarClose(open, () => setOpen(false), TXT_USE, 4.5)
  useOverlay('texto', open ? (
    <Panel title="Texto em Números" onExit={() => setOpen(false)}>
      <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
        {CODE.map((n, i) => (
          <button key={i} onClick={() => setSlot(i)} style={{ width: 70, padding: '6px 0', borderRadius: 10, border: '2px solid ' + (slot === i ? '#ffd27a' : '#3a4a5a'), background: '#10141e', color: '#e8f0ff', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#9fe9ff' }}>{n}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: word[i] ? (word[i]!.charCodeAt(0) === n ? '#8ff0b0' : '#ff9a9a') : '#4a5a6a' }}>{word[i] || '?'}</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, opacity: 0.7 }}>{word[i] ? word[i]!.charCodeAt(0) : '–'}</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3, marginTop: 8, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
        {ABC.map((l) => (
          <button key={l} onClick={() => pick(l)} style={{ padding: '3px 0', borderRadius: 6, border: '1px solid #3a4a5a', background: '#161c28', color: '#e8f0ff', cursor: 'pointer' }}>
            <div style={{ fontWeight: 900, fontSize: 15 }}>{l}</div><div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, opacity: 0.75 }}>{l.charCodeAt(0)}</div>
          </button>
        ))}
      </div>
    </Panel>
  ) : null, [open, word, slot])
  return (
    <group>
      <group position={[0, 0, TXT_USE[2] - 1.4]}>
        <Solid><mesh position={[0, 0.55, 0]} material={MAT.dark()} castShadow><boxGeometry args={[2.4, 1.1, 0.9]} /></mesh></Solid>
        <mesh position={[0, 1.75, -0.2]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[2.2, 1.3, 0.1]} /></mesh>
        <mesh position={[0, 1.75, -0.14]} material={MATS.screenGreen()} userData={{ noCollide: true }}><planeGeometry args={[2.0, 1.1]} /></mesh>
        <Text font={FONT.mono} fontSize={0.2} position={[0, 2.1, -0.12]} color="#8ff0b0" anchorX="center">MENSAGEM:</Text>
        <Text font={FONT.mono} fontSize={0.32} position={[0, 1.75, -0.12]} color="#c8ffd8" anchorX="center" anchorY="middle">78  69  88</Text>
        <Text font={FONT.mono} fontSize={0.3} position={[0, 1.38, -0.12]} color={ok ? '#ffffff' : '#5a9a6a'} anchorX="center" anchorY="middle">{word.map((w) => w || '_').join('   ')}</Text>
      </group>
      <Interactable id="texto" label={done ? 'Ler o terminal' : 'Decifrar a mensagem'} position={TXT_USE} radius={2} onUse={run} markerY={2.6} />
      <Gate position={[0, 0, GATE_Z[2]]} open={!!done} w={3.2} h={3.6} mat={MAT.dark()} />
      <Text font={FONT.mono} fontSize={0.3} position={[0, 4.26, GATE_Z[2] + 0.58]} color="#9fe9ff" anchorX="center" anchorY="middle">ACESSO: 78 69 88</Text>
    </group>
  )
}
