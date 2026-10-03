import * as THREE from 'three'
import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { Solid } from '../../../world/core'
import { Batch, Banner } from '../../../world/Architecture'
import { Desk } from '../../../world/Instruments'
import { MAT, toon } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { stoneTiles } from '../../../world/textures'
import { P } from './Map'

/* =========================================================
   Cada canto do Observatório mostra a época em que a ideia surgiu:
   relógio de sol → Egito antigo · praça → Grécia · biblioteca → Alexandria
   terraço do telescópio → Itália de Galileu · ábaco → Mesopotâmia.
   ========================================================= */
type V3 = [number, number, number]

/* ---------- texturas ---------- */
const tex: Record<string, THREE.CanvasTexture> = {}
function canvas(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  if (tex[key]) return tex[key]
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  draw(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  tex[key] = t
  return t
}
/** Faixa de hieróglifos (desenhos simples: olho, pássaro, onda, sol, pessoa). */
function glyphTex() {
  return canvas('glyphs', 128, 512, (c) => {
    c.fillStyle = '#e9c983'; c.fillRect(0, 0, 128, 512)
    c.strokeStyle = '#2a6a7a'; c.fillStyle = '#2a6a7a'; c.lineWidth = 6; c.lineCap = 'round'
    for (let i = 0; i < 8; i++) {
      const y = 34 + i * 60, k = i % 5
      c.beginPath()
      if (k === 0) { c.ellipse(64, y, 26, 12, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(64, y, 6, 0, 7); c.fill() }
      else if (k === 1) { c.moveTo(36, y + 14); c.quadraticCurveTo(50, y - 18, 78, y - 6); c.lineTo(94, y - 14); c.moveTo(60, y + 2); c.lineTo(60, y + 20); c.stroke() }
      else if (k === 2) { for (let j = 0; j < 3; j++) { c.moveTo(30, y - 10 + j * 10); c.lineTo(42, y - 16 + j * 10); c.lineTo(54, y - 10 + j * 10); c.lineTo(66, y - 16 + j * 10); c.lineTo(78, y - 10 + j * 10); c.lineTo(90, y - 16 + j * 10) } c.stroke() }
      else if (k === 3) { c.arc(64, y, 16, 0, 7); c.stroke(); c.beginPath(); c.arc(64, y, 5, 0, 7); c.fill() }
      else { c.arc(64, y - 16, 7, 0, 7); c.moveTo(64, y - 8); c.lineTo(64, y + 12); c.moveTo(48, y); c.lineTo(80, y - 4); c.moveTo(64, y + 12); c.lineTo(52, y + 24); c.moveTo(64, y + 12); c.lineTo(76, y + 24); c.stroke() }
    }
    c.strokeStyle = '#b8862e'; c.lineWidth = 8; c.strokeRect(6, 4, 116, 504)
  })
}
/** Pergaminho com as fases da Lua desenhadas por Galileu. */
function moonSketch() {
  return canvas('moon', 512, 360, (c) => {
    c.fillStyle = '#f1e2bd'; c.fillRect(0, 0, 512, 360)
    c.fillStyle = 'rgba(120,90,40,.15)'; for (let i = 0; i < 60; i++) c.fillRect(Math.random() * 512, Math.random() * 360, 3, 3)
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 118, y = 150
      c.fillStyle = '#d9c8a0'; c.beginPath(); c.arc(x, y, 46, 0, 7); c.fill()
      c.strokeStyle = '#4a3418'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 46, 0, 7); c.stroke()
      c.fillStyle = '#5a4020'; c.beginPath(); c.arc(x + (i - 1.5) * 26, y, 46, 0, 7); c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 18 + k * 11, y - 12 + (k % 2) * 20, 5, 0, 7); c.stroke() }
    }
    c.fillStyle = '#3a2810'; c.font = 'italic 34px serif'; c.textAlign = 'center'; c.fillText('Sidereus Nuncius · 1610', 256, 300)
  })
}
/** Tabuleta de argila com marcas em forma de cunha (cuneiforme). */
function clayTex() {
  return canvas('clay', 256, 320, (c) => {
    c.fillStyle = '#b07a4e'; c.fillRect(0, 0, 256, 320)
    c.fillStyle = '#5a3418'
    for (let r = 0; r < 8; r++) for (let k = 0; k < 6; k++) {
      if (Math.random() < 0.25) continue
      const x = 26 + k * 38, y = 30 + r * 36
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y + 5); c.lineTo(x, y + 10); c.fill()
      if (Math.random() < 0.5) { c.beginPath(); c.moveTo(x + 6, y + 12); c.lineTo(x + 11, y + 26); c.lineTo(x + 16, y + 12); c.fill() }
    }
  })
}
const matCache: Record<string, THREE.Material> = {}
const m = (k: string, f: () => THREE.Material) => matCache[k] || (matCache[k] = f())
const sand = () => m('sand', () => { const t = stoneTiles('sandTiles', '#f2cf86', '#cf9a4c', 3); const map = t.map.clone(); map.repeat.set(3, 3); map.needsUpdate = true; return toon({ map }) })
const terracotta = () => m('terracotta', () => { const t = stoneTiles('terraTiles', '#e48a5a', '#a84e2c', 5); const map = t.map.clone(); map.repeat.set(3, 3); map.needsUpdate = true; return toon({ map }) })
const mosaic = () => m('mosaic', () => { const t = stoneTiles('mosaicTiles', '#4f86c6', '#e8c46a', 8); const map = t.map.clone(); map.repeat.set(2, 2); map.needsUpdate = true; return toon({ map }) })
const glyphMat = () => m('glyph', () => toon({ map: glyphTex() }))
const turquoise = () => m('turq', () => toon({ color: '#3fb6b0' }))
const palmLeaf = () => m('palm', () => toon({ color: '#3fae4a', side: THREE.DoubleSide }))
const palmTrunk = () => m('palmTrunk', () => toon({ color: '#a97a44' }))
const parchment = () => m('parch', () => toon({ map: moonSketch(), side: THREE.DoubleSide }))
const clay = () => m('clayM', () => toon({ map: clayTex() }))
const amphora = () => m('amph', () => toon({ color: '#c8683a' }))
const scrollMat = () => m('scroll', () => toon({ color: '#efdcae' }))

/* ---------- peças ---------- */
/** Placa de pedra com a época (data grande + lugar). */
export function EraPlaque({ position, rotY = 0, date, place, color = '#ffd27a' }: { position: V3; rotY?: number; date: string; place: string; color?: string }) {
  const [where, when] = date.split(' · ')
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid><mesh position={[0, 0.75, 0]} material={MAT.stoneDark()} castShadow><boxGeometry args={[2.5, 1.5, 0.32]} /></mesh></Solid>
      <mesh position={[0, 1.58, 0]} material={MAT.stone()} userData={{ noCollide: true }}><boxGeometry args={[2.7, 0.16, 0.42]} /></mesh>
      <mesh position={[0, 0.88, 0.165]} userData={{ noCollide: true }}><planeGeometry args={[2.26, 1.06]} /><meshStandardMaterial color="#2a1d14" roughness={0.8} /></mesh>
      <Text font={FONT.title} fontSize={0.2} position={[0, 1.22, 0.172]} color={color} anchorX="center" anchorY="middle" maxWidth={2.1}>{where}</Text>
      <Text font={FONT.title} fontSize={0.24} position={[0, 0.96, 0.172]} color="#ffffff" anchorX="center" anchorY="middle">{when}</Text>
      <Text font={FONT.body} fontSize={0.12} maxWidth={2.05} textAlign="center" position={[0, 0.62, 0.172]} color="#f3e6cc" anchorX="center" anchorY="middle">{place}</Text>
    </group>
  )
}
function Obelisk({ position, h = 6 }: { position: V3; h?: number }) {
  return (
    <group position={position}>
      <Solid><mesh position={[0, 0.3, 0]} material={MAT.stoneDark()} castShadow><boxGeometry args={[1.3, 0.6, 1.3]} /></mesh></Solid>
      <Solid><mesh position={[0, 0.6 + h / 2, 0]} rotation={[0, Math.PI / 4, 0]} material={glyphMat()} castShadow><cylinderGeometry args={[0.38, 0.58, h, 4, 1]} /></mesh></Solid>
      <mesh position={[0, 0.6 + h + 0.32, 0]} rotation={[0, Math.PI / 4, 0]} material={MAT.gold()} castShadow userData={{ noCollide: true }}><coneGeometry args={[0.54, 0.65, 4]} /></mesh>
    </group>
  )
}
function Palm({ position, s = 1, lean = 0.2, rot = 0 }: { position: V3; s?: number; lean?: number; rot?: number }) {
  const segs = 6
  const leaves = useMemo(() => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.35, 0.9, 0.1, 2.0); sh.quadraticCurveTo(-0.2, 0.9, 0, 0)
    return new THREE.ShapeGeometry(sh, 6)
  }, [])
  return (
    <group position={position} rotation={[0, rot, 0]} scale={s}>
      {Array.from({ length: segs }, (_, i) => {
        const k = i / segs
        return <Solid key={i}><mesh position={[Math.sin(k * 1.2) * lean * 2, 0.45 + i * 0.75, 0]} rotation={[0, 0, -Math.cos(k) * lean * 0.4]} material={palmTrunk()} castShadow><cylinderGeometry args={[0.16 - k * 0.04, 0.2 - k * 0.04, 0.8, 8]} /></mesh></Solid>
      })}
      <group position={[Math.sin(1.2) * lean * 2, 0.45 + segs * 0.75, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} geometry={leaves} rotation={[0, (i / 8) * Math.PI * 2, 0]} material={palmLeaf()} castShadow userData={{ noCollide: true }} />
        ))}
        {Array.from({ length: 8 }, (_, i) => <mesh key={'l' + i} geometry={leaves} rotation={[-1.1, (i / 8) * Math.PI * 2 + 0.2, 0]} material={palmLeaf()} castShadow userData={{ noCollide: true }} />)}
        <mesh material={palmTrunk()} userData={{ noCollide: true }}><sphereGeometry args={[0.26, 10, 8]} /></mesh>
      </group>
    </group>
  )
}
function Amphora({ position, s = 1 }: { position: V3; s?: number }) {
  return (
    <group position={position} scale={s}>
      <Solid><mesh position={[0, 0.5, 0]} material={amphora()} castShadow scale={[1, 1.3, 1]}><sphereGeometry args={[0.32, 14, 12]} /></mesh></Solid>
      <mesh position={[0, 0.98, 0]} material={amphora()} userData={{ noCollide: true }}><cylinderGeometry args={[0.1, 0.16, 0.3, 12]} /></mesh>
      <mesh position={[0, 0.12, 0]} material={amphora()} userData={{ noCollide: true }}><coneGeometry args={[0.14, 0.3, 12]} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.18, 0.92, 0]} rotation={[0, 0, k * 0.4]} material={amphora()} userData={{ noCollide: true }}><torusGeometry args={[0.09, 0.025, 6, 12, Math.PI]} /></mesh>)}
      <mesh position={[0, 0.55, 0]} material={MAT.dark()} scale={[1.01, 0.1, 1.01]} userData={{ noCollide: true }}><sphereGeometry args={[0.32, 14, 6]} /></mesh>
    </group>
  )
}
/** Estante de rolos de papiro (como na Biblioteca de Alexandria). */
function ScrollRack({ position, rotY = 0 }: { position: V3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Solid><mesh position={[0, 1.1, -0.2]} material={MAT.woodDark()} castShadow><boxGeometry args={[2.2, 2.2, 0.15]} /></mesh></Solid>
      {[0.25, 0.85, 1.45, 2.05].map((y) => <mesh key={y} position={[0, y - 0.05, 0.05]} material={MAT.wood()} userData={{ noCollide: true }}><boxGeometry args={[2.2, 0.06, 0.5]} /></mesh>)}
      {[0.25, 0.85, 1.45].map((y) => Array.from({ length: 9 }, (_, i) => (
        <mesh key={y + '_' + i} position={[-0.9 + i * 0.225, y + 0.12, 0.07]} rotation={[Math.PI / 2, 0, 0]} material={scrollMat()} userData={{ noCollide: true }}><cylinderGeometry args={[0.08, 0.08, 0.42, 10]} /></mesh>
      )))}
    </group>
  )
}

/* ---------- zonas ---------- */
function EgyptZone() {
  const [x, y, z] = P.dial
  return (
    <group>
      <mesh position={[x, y + 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} material={sand()} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[6.95, 48]} /></mesh>
      <mesh position={[x, y + 0.016, z]} rotation={[-Math.PI / 2, 0, 0]} material={turquoise()} userData={{ noCollide: true }}><ringGeometry args={[6.4, 6.65, 48]} /></mesh>
      <Obelisk position={[x + 4.4, y, z - 4.6]} />
      <Obelisk position={[x - 4.4, y, z - 4.6]} />
      <Banner position={[x + 6.2, y + 0.1, z + 1.8]} rotY={-Math.PI / 2} h={2.8} emblem="eye" color="#2a8a8a" />
      <Banner position={[x + 6.2, y + 0.1, z - 1.6]} rotY={-Math.PI / 2} h={2.8} emblem="sun" color="#c58a2a" />
      <EraPlaque position={[x - 2.4, y, z + 5.7]} rotY={-Math.PI / 4} date="EGITO · 1500 a.C." place="Relógios de sol dividiam o dia em horas" />
      {/* palmeiras no chão, em volta da plataforma */}
      <Palm position={[x + 9.4, 0, z + 3]} s={1.1} rot={0.4} />
      <Palm position={[x + 9, 0, z - 4.5]} s={1.25} rot={2.2} lean={0.3} />
      <Palm position={[x + 4, 0, z + 9.6]} s={1.0} rot={4} />
      <Palm position={[x - 3, 0, z + 9.4]} s={1.15} rot={1.2} lean={0.25} />
    </group>
  )
}
function GreeceZone() {
  const [x, y, z] = P.plaza
  return (
    <group>
      <EraPlaque position={[x + 3.6, y, z + 8.2]} rotY={-0.25} date="GRÉCIA · 200 a.C." place="A esfera armilar mostrava o céu com anéis" />
      <Amphora position={[x - 9.6, y, z + 4.2]} />
      <Amphora position={[x - 9.9, y, z + 3.3]} s={0.8} />
      <Amphora position={[x + 9.7, y, z - 4]} s={0.9} />
    </group>
  )
}
function AlexandriaZone() {
  const [x, y, z] = P.lib
  return (
    <group>
      <mesh position={[x, y + 0.012, z + 7.4]} rotation={[-Math.PI / 2, 0, 0]} material={mosaic()} receiveShadow userData={{ noCollide: true }}><planeGeometry args={[8.6, 2.6]} /></mesh>
      <ScrollRack position={[x - 4.6, y, z - 3.9]} rotY={0} />
      <ScrollRack position={[x + 4.6, y, z - 3.9]} rotY={0} />
      <Amphora position={[x - 2.75, y, z + 6.8]} s={0.9} />
      <Amphora position={[x + 2.75, y, z + 6.8]} s={0.9} />
      <Banner position={[x - 5.2, y + 0.1, z + 6.9]} h={3} emblem="star" color="#1f4a8a" />
      <Banner position={[x + 5.2, y + 0.1, z + 6.9]} h={3} emblem="star" color="#1f4a8a" />
      <EraPlaque position={[x + 6.4, y, z + 6.4]} rotY={-0.5} date="ALEXANDRIA · 300 a.C." place="A maior biblioteca do mundo antigo" color="#9fd0ff" />
    </group>
  )
}
function ItalyZone() {
  const [x, y, z] = P.terr
  return (
    <group>
      <mesh position={[x, y + 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} material={terracotta()} receiveShadow userData={{ noCollide: true }}><circleGeometry args={[6.95, 48]} /></mesh>
      <mesh position={[x, y + 0.016, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.gold()} userData={{ noCollide: true }}><ringGeometry args={[6.45, 6.6, 48]} /></mesh>
      <Desk position={[x - 4.2, y, z + 2.2]} rotY={Math.PI / 2} book={false} />
      <mesh position={[x - 4.15, y + 0.82, z + 2.2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={parchment()} userData={{ noCollide: true }}><planeGeometry args={[1.0, 0.7]} /></mesh>
      <Banner position={[x - 6.2, y + 0.1, z + 2.4]} rotY={Math.PI / 2} h={2.8} emblem="sun" color="#8a1f2a" />
      <EraPlaque position={[x + 2.6, y, z + 5.4]} rotY={0.5} date="ITÁLIA · 1609" place="Galileu aponta a luneta para o céu" color="#ffb08a" />
    </group>
  )
}
function MesopotamiaZone() {
  const [x, y, z] = P.tower
  return (
    <group>
      {[[3.0, 5.4, -0.1], [5.6, 2.6, 0.25]].map(([dx, dz, rz], i) => (
        <group key={i} position={[x + dx, y, z + dz]}>
          <Solid><mesh position={[0, 0.35, 0]} material={MAT.woodDark()}><boxGeometry args={[0.9, 0.7, 0.6]} /></mesh></Solid>
          <mesh position={[0, 0.82, 0]} rotation={[-1.1, 0, rz]} material={clay()} castShadow userData={{ noCollide: true }}><boxGeometry args={[0.5, 0.62, 0.08]} /></mesh>
        </group>
      ))}
      <EraPlaque position={[x + 4.5, y, z + 4.2]} rotY={0.5} date="MESOPOTÂMIA · 2500 a.C." place="Contar com pedrinhas deu origem ao ábaco (no meio da torre)" color="#ffcf8a" />
    </group>
  )
}

export function Eras() {
  return (
    <Batch>
      <EgyptZone />
      <GreeceZone />
      <AlexandriaZone />
      <ItalyZone />
      <MesopotamiaZone />
    </Batch>
  )
}
