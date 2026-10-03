import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, RoundedBox } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { Interactable, Solid, useFlag } from '../../world/core'
import { MAT } from '../../world/materials'
import { useOverlay } from '../../world/puzzle'
import { RT, gesture } from '../../engine/runtime'
import { SFX, playTheme } from '../../engine/audio'
import { type Ctx } from '../../engine/script'
import { G } from '../../store'

/* =========================================================
   ABERTURA — O QUARTO DO NEX
   Noite de tempestade. NEX pergunta à IA “Como você funciona?”.
   Um raio, um choque: ele encolhe e é sugado para dentro da LLM.
   ========================================================= */
type V3 = [number, number, number]
const DESK: V3 = [1.2, 0, -2.5]
const SCREEN: V3 = [1.2, 1.28, -2.78]
const PC_USE: V3 = [1.2, 0, -1.25]
const CHAIR: V3 = [1.2, 0, -1.55]

/* ---------- estado compartilhado da cena ---------- */
const FX = {
  msgs: [] as { me: boolean; text: string }[],
  typing: null as null | { me: boolean; full: string; n: number },
  glitch: 0,
  vortex: 0,
  flash: 0, // raio na janela
  sparks: false,
  pull: null as null | { t0: number; from: THREE.Vector3 },
  shrink: null as null | { t0: number },
  v: 0, // versão (redesenhar a tela)
}
function resetFX() { FX.msgs = []; FX.typing = null; FX.glitch = 0; FX.vortex = 0; FX.flash = 0; FX.sparks = false; FX.pull = null; FX.shrink = null; FX.v++ }

/* ---------- texturas ---------- */
function wallpaper() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256
  const c = cv.getContext('2d')!
  c.fillStyle = '#26345e'; c.fillRect(0, 0, 256, 256)
  c.fillStyle = 'rgba(255,255,255,.08)'
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 64 + (j % 2) * 32 + 16, y = j * 64 + 16; c.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; const r = k % 2 ? 4 : 9; c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); const b = a + Math.PI / 5; c.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45) } c.fill() }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.5); t.colorSpace = THREE.SRGBColorSpace
  return t
}
function cityTex() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 384
  const c = cv.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#0a0e22'); g.addColorStop(1, '#27305a')
  c.fillStyle = g; c.fillRect(0, 0, 512, 384)
  let x = 0
  while (x < 512) {
    const w = 30 + Math.random() * 50, h = 90 + Math.random() * 200
    c.fillStyle = '#0c1024'; c.fillRect(x, 384 - h, w, h)
    for (let yy = 384 - h + 8; yy < 380; yy += 14) for (let xx = x + 5; xx < x + w - 6; xx += 10) if (Math.random() < 0.35) { c.fillStyle = Math.random() < 0.8 ? '#ffd27a' : '#9fe9ff'; c.fillRect(xx, yy, 5, 7) }
    x += w + 4
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace
  return t
}
function rainTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256
  const c = cv.getContext('2d')!
  c.strokeStyle = 'rgba(190,210,255,.55)'; c.lineWidth = 1.5
  for (let i = 0; i < 70; i++) { const x = Math.random() * 128, y = Math.random() * 256; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 14); c.stroke() }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.5)
  return t
}
function posterTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 360
  const c = cv.getContext('2d')!
  c.fillStyle = '#0d1230'; c.fillRect(0, 0, 256, 360)
  for (let i = 0; i < 80; i++) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(Math.random() * 256, Math.random() * 360, 1.5, 1.5) }
  const pl = [[128, 140, 52, '#e7a85a'], [60, 250, 22, '#5aa8e7'], [200, 260, 16, '#c96ae0']] as const
  for (const [x, y, r, col] of pl) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill() }
  c.strokeStyle = 'rgba(255,220,160,.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(128, 140, 80, 18, -0.3, 0, Math.PI * 2); c.stroke()
  c.fillStyle = '#ffe2a3'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.fillText('COSMOS', 128, 330)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ---------- tela do computador (chat) ---------- */
function wrap(c: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(' '); const lines: string[] = []; let cur = ''
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > max && cur) { lines.push(cur); cur = w } else cur = t }
  if (cur) lines.push(cur)
  return lines
}
function Screen() {
  const { tex, cv } = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 640; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return { tex: t, cv } }, [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  const vmat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uK: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec2 vUv; uniform float uT, uK;
      void main(){ vec2 p=(vUv-.5)*vec2(1.6,1.); float r=length(p); float a=atan(p.y,p.x);
        float s=sin(a*6.+ r*30. - uT*8.)*.5+.5; float core=smoothstep(.6,0.,r);
        vec3 col=mix(vec3(.2,.5,1.), vec3(.8,.4,1.), s)*1.6 + vec3(1.)*pow(core,3.)*2.;
        gl_FragColor=vec4(col, uK*smoothstep(.85,.2,r)*(.6+s*.4)); }`,
  }), [])
  const last = useRef(-1)
  const draw = () => {
    const c = cv.getContext('2d')!
    c.fillStyle = '#0f1424'; c.fillRect(0, 0, 1024, 640)
    c.fillStyle = '#18213d'; c.fillRect(0, 0, 1024, 64)
    c.fillStyle = '#9fe9ff'; c.font = 'bold 30px sans-serif'; c.textAlign = 'left'; c.fillText('◆ Language Engine', 28, 43)
    c.fillStyle = '#5a6a9a'; c.font = '22px sans-serif'; c.textAlign = 'right'; c.fillText('assistente de IA', 996, 42)
    const list = [...FX.msgs]
    if (FX.typing) list.push({ me: FX.typing.me, text: FX.typing.full.slice(0, FX.typing.n) + (FX.typing.me ? '' : '▌') })
    let y = 96
    c.font = '34px sans-serif'
    for (const m of list) {
      const lines = wrap(c, m.text || ' ', 660)
      const h = lines.length * 44 + 28
      const w = Math.min(720, Math.max(...lines.map((l) => c.measureText(l).width)) + 44)
      const x = m.me ? 1024 - 28 - w : 28
      c.fillStyle = m.me ? '#2f6bd8' : '#232c4a'
      c.beginPath(); c.roundRect(x, y, w, h, 22); c.fill()
      c.fillStyle = '#eef3ff'; c.textAlign = 'left'
      lines.forEach((l, i) => c.fillText(l, x + 22, y + 46 + i * 44))
      y += h + 18
    }
    c.fillStyle = '#18213d'; c.fillRect(0, 560, 1024, 80)
    c.fillStyle = '#5a6a9a'; c.font = '24px sans-serif'; c.textAlign = 'left'; c.fillText('Pergunte qualquer coisa…', 40, 608)
    if (FX.glitch > 0) {
      for (let i = 0; i < 26 * FX.glitch; i++) {
        const gy = Math.random() * 640, gh = 4 + Math.random() * 30
        c.drawImage(cv, 0, gy, 1024, gh, (Math.random() - 0.5) * 120 * FX.glitch, gy, 1024, gh)
        c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,60,90' : '60,220,255'},${0.25 * FX.glitch})`; c.fillRect(0, gy, 1024, gh * 0.4)
      }
    }
    tex.needsUpdate = true
  }
  useFrame(() => {
    if (FX.v !== last.current || FX.glitch > 0) { last.current = FX.v; draw() }
    vmat.uniforms.uT.value = RT.time; vmat.uniforms.uK.value = FX.vortex
  })
  return (
    <group position={SCREEN}>
      <mesh material={mat} userData={{ noBatch: true, noCollide: true }}><planeGeometry args={[1.04, 0.65]} /></mesh>
      <mesh position={[0, 0, 0.01]} material={vmat} userData={{ noBatch: true, noCollide: true }}><planeGeometry args={[1.04, 0.65]} /></mesh>
    </group>
  )
}

/* ---------- quarto ---------- */
function Room() {
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ map: wallpaper(), roughness: 0.9 }), [])
  const floor = useMemo(() => { const t = MAT.wood() as THREE.MeshToonMaterial; const m = t.clone(); if (m.map) { m.map = m.map.clone(); m.map.repeat.set(3, 3); m.map.needsUpdate = true } return m }, [])
  const city = useMemo(() => new THREE.MeshStandardMaterial({ map: cityTex(), emissive: '#ffffff', emissiveMap: cityTex(), emissiveIntensity: 0.9 }), [])
  const rain = useMemo(() => new THREE.MeshBasicMaterial({ map: rainTex(), transparent: true, opacity: 0.6, depthWrite: false }), [])
  const poster = useMemo(() => new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.8 }), [])
  const blanket = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a6ad0', roughness: 0.95 }), [])
  useFrame((_, dt) => {
    if (rain.map) rain.map.offset.y += dt * 1.6
    city.emissiveIntensity = 0.9 + FX.flash * 6
    FX.flash = Math.max(0, FX.flash - dt * 2.2)
  })
  const W = 3.5, D = 3, H = 3
  return (
    <group>
      <Solid>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow><planeGeometry args={[W * 2, D * 2]} /></mesh>
        <mesh position={[0, H / 2, -D]} material={wall}><boxGeometry args={[W * 2, H, 0.2]} /></mesh>
        <mesh position={[0, H / 2, D]} material={wall}><boxGeometry args={[W * 2, H, 0.2]} /></mesh>
        <mesh position={[W, H / 2, 0]} material={wall}><boxGeometry args={[0.2, H, D * 2]} /></mesh>
        {/* parede da janela (com abertura) */}
        <mesh position={[-W, 0.5, 0]} material={wall}><boxGeometry args={[0.2, 1, D * 2]} /></mesh>
        <mesh position={[-W, 2.7, 0]} material={wall}><boxGeometry args={[0.2, 0.6, D * 2]} /></mesh>
        <mesh position={[-W, 1.7, -1.9]} material={wall}><boxGeometry args={[0.2, 1.4, 2.2]} /></mesh>
        <mesh position={[-W, 1.7, 1.5]} material={wall}><boxGeometry args={[0.2, 1.4, 3]} /></mesh>
        <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.marble()}><planeGeometry args={[W * 2, D * 2]} /></mesh>
      </Solid>
      {/* janela: cidade à noite + chuva */}
      <mesh position={[-W - 0.6, 1.7, -0.4]} rotation={[0, Math.PI / 2, 0]} material={city} userData={{ noCollide: true }}><planeGeometry args={[3.2, 2.4]} /></mesh>
      <mesh position={[-W - 0.05, 1.7, -0.4]} rotation={[0, Math.PI / 2, 0]} material={rain} userData={{ noCollide: true, noBatch: true }}><planeGeometry args={[1.6, 1.4]} /></mesh>
      <mesh position={[-W + 0.02, 1.7, -0.4]} rotation={[0, Math.PI / 2, 0]} material={MAT.glass()} userData={{ noCollide: true }}><planeGeometry args={[1.6, 1.4]} /></mesh>
      {[[0, 0.72, 1.7], [0, -0.72, 1.7]].map(([, dz], i) => <mesh key={i} position={[-W + 0.05, 1.7, -0.4 + dz]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[0.12, 1.5, 0.08]} /></mesh>)}
      <mesh position={[-W + 0.05, 1.7, -0.4]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[0.12, 0.06, 1.5]} /></mesh>
      <mesh position={[-W + 0.15, 0.98, -0.4]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[0.3, 0.06, 1.8]} /></mesh>
      {/* cortinas */}
      {[-1.35, 0.55].map((z) => <mesh key={z} position={[-W + 0.18, 1.75, z]} material={MAT.cloth('#7a2e3e')} userData={{ noCollide: true }}><boxGeometry args={[0.06, 1.9, 0.5]} /></mesh>)}
      {/* escrivaninha */}
      <Solid>
        <mesh position={[DESK[0], 0.73, DESK[2]]} material={MAT.wood()} castShadow receiveShadow><boxGeometry args={[1.9, 0.06, 0.9]} /></mesh>
        {[-0.88, 0.88].map((x) => <mesh key={x} position={[DESK[0] + x, 0.36, DESK[2]]} material={MAT.woodDark()}><boxGeometry args={[0.08, 0.72, 0.85]} /></mesh>)}
      </Solid>
      {/* monitor */}
      <mesh position={[SCREEN[0], SCREEN[1], SCREEN[2] - 0.04]} material={MAT.dark()} castShadow userData={{ noCollide: true }}><boxGeometry args={[1.14, 0.75, 0.06]} /></mesh>
      <mesh position={[SCREEN[0], 0.88, SCREEN[2] - 0.05]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[0.08, 0.3, 0.06]} /></mesh>
      <mesh position={[SCREEN[0], 0.77, SCREEN[2] - 0.02]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[0.36, 0.02, 0.2]} /></mesh>
      <Screen />
      <RoundedBox args={[0.62, 0.03, 0.2]} radius={0.01} position={[DESK[0], 0.775, DESK[2] + 0.18]} material={MAT.dark()} />
      <mesh position={[DESK[0] + 0.48, 0.77, DESK[2] + 0.2]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[0.07, 0.03, 0.11]} /></mesh>
      {/* luminária */}
      <group position={[DESK[0] + 0.75, 0.76, DESK[2] - 0.2]}>
        <mesh position={[0, 0.02, 0]} material={MAT.iron()}><cylinderGeometry args={[0.1, 0.12, 0.04, 16]} /></mesh>
        <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0.3]} material={MAT.iron()}><cylinderGeometry args={[0.015, 0.015, 0.5, 8]} /></mesh>
        <mesh position={[-0.12, 0.48, 0]} rotation={[0, 0, -0.8]} material={MAT.copper()}><coneGeometry args={[0.1, 0.16, 16, 1, true]} /></mesh>
        <mesh position={[-0.15, 0.44, 0]} material={MAT.glowWarm()}><sphereGeometry args={[0.035, 10, 8]} /></mesh>
      </group>
      <pointLight position={[DESK[0] + 0.6, 1.2, DESK[2]]} color="#ffc070" intensity={2.2} distance={4} decay={1.6} />
      <ScreenLight />
      {/* régua de tomadas (de onde sai o choque) */}
      <mesh position={[DESK[0] + 0.7, 0.03, DESK[2] - 0.25]} material={MAT.marble()} userData={{ noCollide: true }}><boxGeometry args={[0.4, 0.05, 0.08]} /></mesh>
      <mesh position={[DESK[0] + 0.3, 0.5, DESK[2] - 0.38]} rotation={[0, 0, 0.6]} material={MAT.dark()} userData={{ noCollide: true }}><cylinderGeometry args={[0.012, 0.012, 1.1, 6]} /></mesh>
      <Sparks />
      {/* cadeira */}
      <group position={CHAIR}>
        <mesh position={[0, 0.45, 0]} material={MAT.cloth('#2a2f45')} castShadow userData={{ noCollide: true }}><boxGeometry args={[0.5, 0.08, 0.5]} /></mesh>
        <mesh position={[0, 0.8, 0.24]} material={MAT.cloth('#2a2f45')} userData={{ noCollide: true }}><boxGeometry args={[0.5, 0.6, 0.06]} /></mesh>
        <mesh position={[0, 0.22, 0]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.03, 0.03, 0.44, 8]} /></mesh>
      </group>
      {/* cama */}
      <Solid>
        <mesh position={[2.55, 0.25, 1.7]} material={MAT.woodDark()} castShadow receiveShadow><boxGeometry args={[1.5, 0.5, 2.4]} /></mesh>
      </Solid>
      <mesh position={[2.55, 0.56, 1.85]} material={blanket} userData={{ noCollide: true }}><boxGeometry args={[1.46, 0.14, 2.0]} /></mesh>
      <RoundedBox args={[0.9, 0.16, 0.45]} radius={0.06} position={[2.55, 0.62, 0.72]} material={MAT.marble()} />
      {/* estante e livros */}
      <mesh position={[3.35, 2.0, -1.2]} material={MAT.woodDark()} userData={{ noCollide: true }}><boxGeometry args={[0.28, 0.05, 1.6]} /></mesh>
      {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[3.33, 2.17, -1.9 + i * 0.13]} material={[MAT.cloth('#a23a3a'), MAT.cloth('#3a6aa2'), MAT.cloth('#d0a040'), MAT.cloth('#3a8a5a')][i % 4]} userData={{ noCollide: true }}><boxGeometry args={[0.2, 0.3 + (i % 3) * 0.04, 0.1]} /></mesh>)}
      {/* pôster */}
      <mesh position={[-1.6, 1.8, -D + 0.12]} material={poster} userData={{ noCollide: true }}><planeGeometry args={[0.8, 1.1]} /></mesh>
      {/* tapete */}
      <mesh position={[-0.5, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.cloth('#5a3a7a')} userData={{ noCollide: true }}><circleGeometry args={[1.3, 40]} /></mesh>
      {/* porta */}
      <mesh position={[-1.8, 1.05, D - 0.11]} material={MAT.wood()} userData={{ noCollide: true }}><boxGeometry args={[0.95, 2.1, 0.04]} /></mesh>
      <mesh position={[-1.45, 1.0, D - 0.15]} material={MAT.gold()} userData={{ noCollide: true }}><sphereGeometry args={[0.04, 10, 8]} /></mesh>
      <ambientLight intensity={0.35} color="#5a6aa8" />
      <hemisphereLight args={['#4a5a9a', '#1a1420', 0.6]} />
      <Lightning />
    </group>
  )
}
function ScreenLight() {
  const l = useRef<THREE.PointLight>(null!)
  useFrame(() => { if (l.current) l.current.intensity = 2.4 + FX.vortex * 10 + (FX.glitch > 0 ? Math.random() * 4 : 0) })
  return <pointLight ref={l} position={[SCREEN[0], SCREEN[1], SCREEN[2] + 0.6]} color="#7fb8ff" intensity={2.4} distance={4.5} decay={1.5} />
}
function Lightning() {
  const l = useRef<THREE.DirectionalLight>(null!)
  useFrame(() => { if (l.current) l.current.intensity = 0.15 + FX.flash * 5 })
  return <directionalLight ref={l} position={[-8, 4, -1]} color="#cfe0ff" intensity={0.15} />
}
function Sparks() {
  const [on, setOn] = useState(false)
  useFrame(() => { if (FX.sparks !== on) setOn(FX.sparks) })
  if (!on) return null
  return (
    <>
      <Sparkles count={40} scale={[0.9, 0.9, 0.5]} position={[DESK[0] + 0.5, 0.25, DESK[2] - 0.25]} size={3.5} speed={3} color="#9fe9ff" />
      <Sparkles count={30} scale={[1.1, 0.7, 0.2]} position={[SCREEN[0], SCREEN[1], SCREEN[2] + 0.06]} size={2.5} speed={3} color="#fff3b0" />
    </>
  )
}

/* NEX encolhe e é puxado para a tela */
function Pull() {
  useFrame(() => {
    const now = performance.now()
    if (FX.shrink) {
      const k = Math.min(1, (now - FX.shrink.t0) / 1600)
      RT.nexScale = 1 - k * 0.72 + Math.sin(k * 30) * 0.03 * (1 - k)
    }
    if (FX.pull) {
      const k = Math.min(1, (now - FX.pull.t0) / 2400)
      const e = k * k * (3 - 2 * k)
      const to = new THREE.Vector3(SCREEN[0], SCREEN[1] - 0.15, SCREEN[2] + 0.05)
      RT.player.lerpVectors(FX.pull.from, to, e)
      RT.player.y += Math.sin(k * Math.PI) * 0.4
      RT.playerVel.set(0, 0, 0)
      RT.nexScale = 0.28 * (1 - e * 0.85)
      RT.nexSpin += 0.25 + k * 0.6
    }
  })
  return null
}

function Flash() {
  const [o, setO] = useState(0)
  const cur = useRef(0)
  useFrame(() => { const v = Math.round(WHITE.v * 100) / 100; if (v !== cur.current) { cur.current = v; setO(v) } })
  useOverlay('whiteflash', o > 0 ? <div style={{ position: 'fixed', inset: 0, background: '#fff', opacity: o, pointerEvents: 'none', zIndex: 50 }} /> : null, [o])
  return null
}
const WHITE = { v: 0 }
async function fadeWhite(c: Ctx, to: number, sec: number) {
  const from = WHITE.v, t0 = performance.now()
  await c.until(() => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); WHITE.v = from + (to - from) * k; return k >= 1 })
}
async function typeOn(c: Ctx, me: boolean, full: string, cps = 28, stopAt?: number) {
  FX.typing = { me, full, n: 0 }; FX.v++
  const end = stopAt ?? full.length
  while (FX.typing.n < end) {
    await c.wait(1 / cps)
    FX.typing.n++; FX.v++
    if (FX.typing.n % 3 === 0) SFX.play(me ? 'tick' : 'talk')
  }
}

/* ---------- roteiro ---------- */
async function main(c: Ctx) {
  resetFX(); WHITE.v = 0
  FX.msgs = [{ me: false, text: 'Oi, NEX! Eu sou a Language Engine, uma IA de linguagem. Pergunte o que quiser.' }]; FX.v++
  playTheme('lab')
  await c.cinematic([
    { pos: [-2.6, 2.3, 2.5], look: [1.2, 1.1, -2.7], dur: 0.01, cut: true },
    { pos: [-0.6, 1.9, 1.8], look: [1.2, 1.2, -2.7], dur: 4 },
  ])
  FX.flash = 1; SFX.play('stone')
  await c.say([
    { who: 'NEX', text: 'Que tempestade… Sem chance de sair hoje.' },
    { who: 'NEX', text: 'Vou conversar com a IA. Tem uma coisa que eu sempre quis perguntar.' },
  ], { ambient: true })
  c.objective('Sente-se no computador', PC_USE)
  await c.waitFlag('q_pc')
  c.objective(null)
  c.freeze(true)
  RT.player.set(CHAIR[0], 0.05, CHAIR[2] + 0.15); RT.playerVel.set(0, 0, 0)
  RT.lookAt = new THREE.Vector3(SCREEN[0], 0, SCREEN[2])
  c.focus([SCREEN[0] + 1.15, 1.85, -1.1], [SCREEN[0] - 0.1, 1.05, SCREEN[2]], 46)
  await c.wait(1)
  c.setFlag('q_ask1', 0); c.setFlag('q_ask2', 0)
  await c.say([
    { who: 'NEX', text: 'Eu converso com você todo dia… mas nunca entendi como você sabe responder.' },
    {
      who: 'NEX', text: 'O que eu pergunto?', choices: [
        { label: 'Como você funciona?', flag: 'q_ask1' },
        { label: 'Você pensa como eu?', flag: 'q_ask2' },
      ],
    },
  ])
  const q = c.flag('q_ask2') ? 'Você pensa como eu?' : 'Como você funciona?'
  await typeOn(c, true, q, 18)
  FX.msgs.push({ me: true, text: q }); FX.typing = null; FX.v++
  SFX.play('click')
  await c.wait(0.9)
  const ans = c.flag('q_ask2') ? 'Não exatamente. Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando' : 'Boa pergunta! Por dentro, eu funciono prevendo a próxima palavra, uma de cada vez, usando'
  await typeOn(c, false, ans, 30, ans.length - 8)
  // o raio
  FX.flash = 1.4; SFX.play('stone'); SFX.play('whoosh')
  FX.glitch = 1; FX.sparks = true
  SFX.play('error')
  await fadeWhite(c, 0.9, 0.12)
  // câmera de frente para o NEX: ele leva o choque
  const FACE: V3 = [CHAIR[0], 1.0, CHAIR[2] + 0.15]
  const CAM1: V3 = [CHAIR[0] - 0.65, 1.3, CHAIR[2] - 1.12]
  RT.lookAt = new THREE.Vector3(CAM1[0], 0, CAM1[2])
  gesture('scared', 9)
  await c.cinematic([{ pos: CAM1, look: FACE, dur: 0.01, cut: true }, { pos: [CAM1[0] + 0.1, 1.25, CAM1[2] - 0.08], look: FACE, dur: 0.4 }], false)
  c.focus([CAM1[0] + 0.1, 1.25, CAM1[2] - 0.08], FACE, 50)
  await fadeWhite(c, 0, 0.45)
  await c.say([{ who: 'NEX', text: 'AAAI! Levei um choque!' }])
  gesture('scared', 9)
  FX.shrink = { t0: performance.now() }; SFX.play('whoosh')
  c.focus([CHAIR[0] - 0.5, 0.75, CHAIR[2] - 0.95], [CHAIR[0], 0.3, CHAIR[2] + 0.15], 50)
  await c.wait(1.8)
  await c.say([
    { who: 'NEX', text: 'Eu… estou encolhendo?!' },
    { who: 'ENGINE', text: 'pró… xi… ma… pa… la…' },
  ])
  gesture('scared', 6)
  RT.lookAt = new THREE.Vector3(SCREEN[0], 0, SCREEN[2])
  FX.vortex = 1; SFX.play('portal')
  await c.cinematic([{ pos: [SCREEN[0] + 1.6, 1.45, -1.5], look: [SCREEN[0], 1.1, SCREEN[2]], dur: 0.01, cut: true }, { pos: [SCREEN[0] + 0.9, 1.35, -1.9], look: [SCREEN[0], 1.2, SCREEN[2]], dur: 3.2 }], false)
  FX.pull = { from: RT.player.clone(), t0: performance.now() - 800 }
  await c.wait(1.8)
  await c.say({ who: 'NEX', text: 'A tela está me puxando! AAAAH!' }, { ambient: true })
  await fadeWhite(c, 1, 0.8)
  c.setFlag('quarto_done')
  await c.wait(0.4)
  c.goto('prologo')
  await c.wait(1.2)
  WHITE.v = 0
}

export default function Quarto() {
  useLevel({ spawn: [-1.2, 0.05, 1.4], yaw: Math.PI * 0.8, scripts: [main], minY: -4 })
  const used = useFlag('q_pc')
  return (
    <>
      <color attach="background" args={['#05070f']} />
      <fog attach="fog" args={['#05070f', 10, 40]} />
      <Room />
      <Pull />
      <Flash />
      <Interactable id="pc" label="Sentar no computador" position={PC_USE} radius={1.5} enabled={!used} onUse={() => G().setFlag('q_pc')} markerY={1.7} />
    </>
  )
}
