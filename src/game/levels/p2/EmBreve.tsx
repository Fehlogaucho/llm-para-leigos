import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Sparkles } from '@react-three/drei'
import { useLevel } from '../../engine/level'
import { SkyDome, Lights } from '../../world/Atmosphere'
import { Interactable } from '../../world/core'
import { RoundPlatform } from '../../world/Architecture'
import { FONT } from '../../world/fonts'
import { RT } from '../../engine/runtime'
import { start, type Ctx } from '../../engine/script'
import { useGame } from '../../store'

/* Fim da Fase 1: a Cidade das Representações aparece ao longe (Fase 2 em construção). */
type V3 = [number, number, number]
const SKY = { zenith: '#0a1240', mid: '#3a3a9a', horizon: '#ff9a6a', below: '#2a1a40', sunCol: '#ffc890', sun: [0.2, 0.25, -1] as V3, stars: 0.8, fog: '#3a2a5a', fogNear: 60, fogFar: 260, hemi: '#9a9ae0' }

function City() {
  const items = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const a = (i / 70) * Math.PI * 2, r = 28 + (i * 37 % 23)
    return { x: Math.cos(a) * r, z: Math.sin(a) * r - 10, h: 4 + (i * 53 % 17), w: 2 + (i % 3), d: i % 2 }
  }), [])
  const g = useRef<THREE.Group>(null!)
  useFrame(() => { g.current?.children.forEach((c, i) => { c.position.y = -12 + Math.min(1, Math.max(0, RT.time * 0.25 - i * 0.02)) * 12 }) })
  return (
    <group ref={g}>
      {items.map((b, i) => (
        <group key={i} position={[b.x, -12, b.z]}>
          <mesh position={[0, b.h / 2, 0]}><boxGeometry args={[b.w, b.h, b.w]} /><meshStandardMaterial color={b.d ? '#2a3a7a' : '#3a2a6a'} emissive={b.d ? '#1a4aff' : '#8a4aff'} emissiveIntensity={0.35} /></mesh>
          <Text font={FONT.mono} fontSize={b.w * 0.45} position={[0, b.h * 0.6, b.w / 2 + 0.02]} color="#9fefff" anchorX="center" anchorY="middle">{String(i % 2)}</Text>
        </group>
      ))}
    </group>
  )
}

async function main(c: Ctx) {
  if (!c.flag('p2_teaser')) {
    await c.say([
      { who: 'NOVA', text: 'Parabéns! Você terminou a Fase 1 e devolveu o MATRIX CORE à Language Engine.' },
      { who: 'NEX', text: 'Olha lá longe: uma cidade inteira feita de números!' },
      { who: 'NOVA', text: 'A Cidade das Representações. É lá que as palavras viram números. Ela ainda está sendo construída.' },
      { who: 'NOVA', text: 'Enquanto isso, use o mapa para voltar a qualquer área e terminar as side quests e os fragmentos que faltaram.' },
    ])
    c.setFlag('p2_teaser')
  }
  c.objective('Fase 2 em breve. Use o mapa para revisitar as áreas', [0, 0, 3])
}

export default function EmBreve() {
  useLevel({ spawn: [0, 0.2, 6], yaw: Math.PI, scripts: [main] })
  const openMap = () => start('mapa2', async () => { useGame.setState({ menu: 'map' }) })
  return (
    <>
      <SkyDome preset="dusk" custom={SKY} />
      <Lights preset="dusk" custom={SKY} sunI={1.2} hemiI={1} />
      <RoundPlatform position={[0, 0, 0]} r={9} h={2} rep={4} />
      <City />
      <Sparkles count={120} scale={[40, 16, 40]} position={[0, 6, -10]} size={4} color="#bfe8ff" />
      <group position={[0, 0, -3]}>
        <Text font={FONT.title} fontSize={0.9} position={[0, 3.6, 0]} color="#ffe2a3" anchorX="center" outlineWidth={0.03} outlineColor="#1a0e2a">FASE 2 · EM BREVE</Text>
        <Text font={FONT.body} fontSize={0.42} position={[0, 2.7, 0]} color="#dfe8ff" anchorX="center">A Cidade das Representações</Text>
      </group>
      <Interactable id="mapa2" label="Abrir o mapa das áreas" position={[0, 0, 3]} radius={2.4} onUse={openMap} markerY={2.2} />
    </>
  )
}
