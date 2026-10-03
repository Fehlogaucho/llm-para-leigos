import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Solid } from '../../../world/core'
import { MAT } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'
import { gearGeo, Steam, cardMat, type V3 } from './Hall'

/* A Grande Máquina: colunas de rodas numeradas (como a Máquina Diferencial de Babbage). */
export const GM = { mode: 'idle' as 'idle' | 'try' | 'jam' | 'run', t0: 0, card: false }
export const GM_POS: V3 = [-3, 2.4, -52.6]

function digitsTex() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64
  const c = cv.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#9a7432'); g.addColorStop(0.5, '#e2bd6a'); g.addColorStop(1, '#8a6428')
  c.fillStyle = g; c.fillRect(0, 0, 512, 64)
  c.fillStyle = '#2a1806'; c.font = 'bold 40px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'
  for (let i = 0; i < 10; i++) c.fillText(String(i), (i + 0.5) * 51.2, 34)
  c.fillStyle = 'rgba(40,24,6,.6)'; c.fillRect(0, 0, 512, 4); c.fillRect(0, 60, 512, 4)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping
  return t
}

const COLS = 7, ROWS = 12
export function GrandMachine() {
  const wheels = useRef<THREE.InstancedMesh>(null!)
  const fly = useRef<THREE.Mesh>(null!), body = useRef<THREE.Group>(null!)
  const pistons = useRef<THREE.Group>(null!), lamp = useRef<THREE.Mesh>(null!)
  const gears = useRef<THREE.Group>(null!)
  const mats = useMemo(() => [new THREE.MeshStandardMaterial({ map: digitsTex(), metalness: 0.6, roughness: 0.35 }), MAT.bronze(), MAT.bronze()], [])
  const geo = useMemo(() => new THREE.CylinderGeometry(0.42, 0.42, 0.24, 28, 1), [])
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffb0a0', emissive: '#ff3a2a', emissiveIntensity: 2 }), [])
  const ang = useMemo(() => Array.from({ length: COLS * ROWS }, () => Math.floor(Math.random() * 10) * (Math.PI * 2 / 10)), [])
  const base = useMemo(() => {
    const out: THREE.Vector3[] = []
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) out.push(new THREE.Vector3(-4.2 + c * 1.4, 1.25 + r * 0.56, 0.55))
    return out
  }, [])
  const m4 = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), one = useMemo(() => new THREE.Vector3(1, 1, 1), []), up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const first = useRef(true)
  useFrame((_, dt) => {
    const mode = GM.mode
    const since = (performance.now() - GM.t0) / 1000
    let sp = mode === 'try' ? 1.3 : mode === 'run' ? 3.2 : 0
    if (mode === 'jam' && since < 0.5) sp = 1.3 * (1 - since / 0.5)
    const W = wheels.current
    if (W && (sp > 0 || first.current)) {
      first.current = false
      for (let i = 0; i < ang.length; i++) {
        const c = Math.floor(i / ROWS), r = i % ROWS
        if (sp > 0) ang[i] += dt * sp * (0.6 + ((c * 7 + r * 3) % 5) * 0.25) * (r % 2 ? 1 : -1)
        q.setFromAxisAngle(up, ang[i])
        m4.compose(base[i], q, one)
        W.setMatrixAt(i, m4)
      }
      W.instanceMatrix.needsUpdate = true
    }
    if (fly.current) fly.current.rotation.z -= dt * sp * 0.5
    gears.current?.children.forEach((g, i) => { g.rotation.z += dt * sp * (i % 2 ? -0.9 : 0.7) })
    pistons.current?.children.forEach((p, i) => { p.position.y = 8.9 + (sp > 0 ? Math.sin(RT.time * sp * 2 + i * 1.6) * 0.35 : 0) })
    if (body.current) body.current.position.x = mode === 'jam' && since < 1.2 ? Math.sin(since * 70) * 0.05 * (1.2 - since) : 0
    const red = mode !== 'run'
    lampMat.emissive.set(red ? '#ff3a2a' : '#2ad86a'); lampMat.color.set(red ? '#ffb0a0' : '#b8ffcf')
    lampMat.emissiveIntensity = mode === 'jam' ? (Math.sin(RT.time * 8) > 0 ? 3 : 0.4) : 2.4
  })
  return (
    <group position={GM_POS}>
      <group ref={body}>
        <Solid>
          <mesh position={[0, 0.35, 0]} material={MAT.iron()} castShadow receiveShadow><boxGeometry args={[13, 0.7, 3.6]} /></mesh>
          <mesh position={[0, 4.6, -1.2]} material={MAT.woodDark()} castShadow><boxGeometry args={[11.6, 8, 0.3]} /></mesh>
          {[-5.9, 5.9].map((x) => <mesh key={x} position={[x, 4.7, 0]} material={MAT.iron()} castShadow><boxGeometry args={[0.5, 8.6, 2.6]} /></mesh>)}
        </Solid>
        <mesh position={[0, 8.75, 0]} material={MAT.bronzeDark()} castShadow userData={{ noCollide: true }}><boxGeometry args={[12.6, 0.5, 3]} /></mesh>
        <mesh position={[0, 9.06, 0]} material={MAT.gold()} userData={{ noCollide: true }}><boxGeometry args={[12.8, 0.12, 3.1]} /></mesh>
        <mesh position={[0, 0.76, 0]} material={MAT.gold()} userData={{ noCollide: true }}><boxGeometry args={[12.2, 0.1, 3.2]} /></mesh>
        {/* hastes das colunas */}
        {Array.from({ length: COLS }, (_, c) => <mesh key={c} position={[-4.2 + c * 1.4, 4.6, 0.55]} material={MAT.iron()} userData={{ noCollide: true }}><cylinderGeometry args={[0.06, 0.06, 7.9, 8]} /></mesh>)}
        <instancedMesh ref={wheels} args={[geo, mats, COLS * ROWS]} castShadow userData={{ noBatch: true, noCollide: true }} />
        {/* engrenagens entre as colunas, no fundo */}
        <group ref={gears} userData={{ noBatch: true }}>
          {Array.from({ length: COLS - 1 }, (_, c) => [2.2, 5.0, 7.6].map((y, k) => (
            <mesh key={c + '_' + k} position={[-3.5 + c * 1.4, y, -0.85]} geometry={gearGeo(0.62, 9, 0.12)} material={(c + k) % 2 ? MAT.copper() : MAT.bronzeDark()} />
          )))}
        </group>
        {/* volante lateral */}
        <mesh ref={fly} position={[7.6, 4.2, 0]} geometry={gearGeo(2.6, 30, 0.35)} material={MAT.iron()} castShadow userData={{ noBatch: true }} />
        <mesh position={[7.6, 4.2, -0.4]} rotation={[Math.PI / 2, 0, 0]} material={MAT.bronze()} userData={{ noCollide: true }}><cylinderGeometry args={[0.3, 0.3, 1.2, 12]} /></mesh>
        <Solid><mesh position={[7.6, 0.9, 0]} material={MAT.iron()}><boxGeometry args={[1.4, 1.8, 1.4]} /></mesh></Solid>
        {/* pistões no topo */}
        <group ref={pistons} userData={{ noBatch: true }}>
          {[-4, -1.3, 1.3, 4].map((x) => (
            <group key={x} position={[x, 8.9, 0]}>
              <mesh position={[0, 0.9, 0]} material={MAT.iron()}><cylinderGeometry args={[0.1, 0.1, 1.8, 8]} /></mesh>
              <mesh position={[0, 1.9, 0]} material={MAT.copper()}><sphereGeometry args={[0.28, 12, 10]} /></mesh>
            </group>
          ))}
        </group>
        {[-4, -1.3, 1.3, 4].map((x) => <mesh key={x} position={[x, 9.6, 0]} material={MAT.bronzeDark()} userData={{ noCollide: true }}><cylinderGeometry args={[0.38, 0.38, 1.2, 14]} /></mesh>)}
        <mesh ref={lamp} position={[0, 10.1, 0.6]} material={lampMat} userData={{ noBatch: true, noCollide: true }}><sphereGeometry args={[0.35, 16, 12]} /></mesh>
        {/* leitor de cartões */}
        <group position={[-5.2, 1.6, 1.5]}>
          <mesh material={MAT.bronze()} castShadow><boxGeometry args={[1.2, 1.6, 0.8]} /></mesh>
          <mesh position={[0, 0.5, 0.41]} material={MAT.dark()} userData={{ noCollide: true }}><boxGeometry args={[0.9, 0.08, 0.02]} /></mesh>
          <CardIn />
        </group>
        <Text font={FONT.title} fontSize={0.48} position={[0, 9.6, 1.56]} color="#ffe2a3" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#1a0e06">A GRANDE MÁQUINA</Text>
      </group>
      <Steam position={[0, 10.4, 0]} n={10} h={4} s={0.6} rate={0.3} on={() => (GM.mode === 'jam' ? 1 : GM.mode === 'run' ? 0.7 : 0.25)} />
      <Steam position={[7.6, 7, 0]} n={6} h={3} s={0.4} rate={0.4} on={() => (GM.mode === 'run' ? 0.8 : 0)} />
    </group>
  )
}
function CardIn() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => { if (ref.current) { ref.current.visible = GM.card; ref.current.position.y += ((GM.card ? 0.62 : 1.1) - ref.current.position.y) * 0.08 } })
  return <mesh ref={ref} position={[0, 1.1, 0.42]} material={cardMat()} userData={{ noBatch: true, noCollide: true }}><boxGeometry args={[0.8, 0.5, 0.02]} /></mesh>
}
