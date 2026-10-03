import * as THREE from 'three'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Text } from '@react-three/drei'
import { FONT } from './world/fonts'
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { G, useGame } from './store'
import { QUALITY, type Quality } from './engine/quality'
import { LEVELS } from './levels/registry'
import { Nex } from './engine/Nex'
import { Nova } from './engine/Nova'
import { CameraRig } from './engine/CameraRig'
import { ObjectiveBeacon } from './world/core'
import { bindKeyboard } from './engine/input'
import { TopBar, Prompt, Joystick, ObjectiveArrow, Banners, Toast, CinemaBars, Overlays } from './ui/HUD'
import { Dialogue } from './ui/Dialogue'
import { Menus } from './ui/Menus'
import { Loading } from './ui/Loading'
import { InkOutline } from './engine/InkOutline'


function World() {
  const level = useGame((s) => s.level)
  const Comp = useMemo(() => { const L = LEVELS[level]; return L ? lazy(L.load) : null }, [level])
  if (!Comp) return null
  return <Suspense fallback={null}><Comp key={level} /></Suspense>
}

/** Carrega as fontes 3D logo no início, num Suspense próprio. */
function FontPreloader() {
  return <Suspense fallback={null}><group visible={false}>{Object.values(FONT).map((f) => <Text key={f} font={f} fontSize={0.1}>aÁç0</Text>)}</group></Suspense>
}

function Effects({ q }: { q: Quality }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <InkOutline strength={0.9} thickness={q === 'high' ? 1.25 : 1} />
      <Bloom mipmapBlur intensity={q === 'high' ? 0.85 : 0.7} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.75} />
      <Vignette offset={0.28} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      {q === 'high' ? <SMAA /> : <></>}
    </EffectComposer>
  )
}

export function Game() {
  const setting = useGame((s) => s.settings.quality)
  const [auto, setAuto] = useState<Quality>(QUALITY.q)
  const q: Quality = setting === 'auto' ? auto : setting
  QUALITY.q = q
  useEffect(() => { bindKeyboard() }, [])
  const dpr: [number, number] = q === 'high' ? [1, 1.75] : [0.85, 1.25]
  return (
    <>
      <Canvas
        shadows={q === 'high' ? 'soft' : false}
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 50, near: 0.1, far: 900, position: [0, 3, 8] }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping }}
      >
        <PerformanceMonitor onDecline={() => { if (G().settings.quality === 'auto') setAuto('low') }} flipflops={2} />
        <FontPreloader />
        <World />
        <Nex />
        <Nova />
        <CameraRig />
        <ObjectiveBeacon />
        <Effects q={q} />
      </Canvas>
      <div className="layer">
        <TopBar />
        <ObjectiveArrow />
        <Prompt />
        <Joystick />
        <Banners />
        <Toast />
        <Overlays />
        <Dialogue />
        <CinemaBars />
        <Menus />
      </div>
      <Loading />
    </>
  )
}
