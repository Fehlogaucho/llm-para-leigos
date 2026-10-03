import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { MAT } from '../../../world/materials'
import { FONT } from '../../../world/fonts'
import { RT } from '../../../engine/runtime'
import { SFX } from '../../../engine/audio'
import { P, riverZ, terrainH, ellip, rng } from './terrain'
import { CLUSTERS, FORMATIONS, freeSpot } from './fieldData'
export { GOLD, SYMS, ORCHARD, TREES, FORMATIONS, CLUSTERS, freeSpot, type Cluster } from './fieldData'
import { VM, Instances, crystalGeo, stoneGeo, fruitGeo, torchStickGeo, torchFlameGeo, torchCupGeo, matGeo, tuftGeo, CrystalFormation, type Inst } from './props'

/* =========================================================
   Campo dos Cristais: milhares de objetos em grupos.
   Cada grupo é uma quantidade; depois da 1ª missão, cada
   grupo ganha o seu número flutuando acima.
   ========================================================= */

/* ---------- monta as instâncias dos grupos ---------- */
function useClusterInstances() {
  return useMemo(() => {
    const r = rng(77)
    const crystal: Inst[] = [], stone: Inst[] = [], fruit: Inst[] = [], mats: Inst[] = [], torchS: Inst[] = [], torchF: Inst[] = []
    const GA = 2.39996
    for (const c of CLUSTERS) {
      if (c.kind === 'torch') {
        const R = 0.3 + c.n * 0.2
        for (let i = 0; i < c.n; i++) {
          const a = (i / c.n) * Math.PI * 2
          const x = c.x + Math.cos(a) * R, z = c.z + Math.sin(a) * R, y = terrainH(x, z)
          torchS.push({ p: [x, y, z], s: 1 }); torchF.push({ p: [x, y, z], s: 1 })
        }
        continue
      }
      const step = c.kind === 'crystal' ? 0.34 : c.kind === 'stone' ? 0.42 : 0.26
      if (c.kind === 'apple' || c.kind === 'orange') mats.push({ p: [c.x, c.y, c.z], s: [step * Math.sqrt(c.n) + 0.35, 1, step * Math.sqrt(c.n) + 0.35], c: c.kind === 'apple' ? '#d9c79a' : '#c9b48a' })
      for (let i = 0; i < c.n; i++) {
        const rad = step * Math.sqrt(i + 0.5), a = i * GA + c.x
        const x = c.x + Math.cos(a) * rad, z = c.z + Math.sin(a) * rad
        const y = c.kind === 'apple' || c.kind === 'orange' ? c.y + 0.03 : terrainH(x, z)
        if (c.kind === 'crystal') {
          const h = 0.5 + r() * 0.55
          crystal.push({ p: [x, y - 0.03, z], s: [h * 0.32, h, h * 0.32], r: [(r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5], c: r() < 0.25 ? '#c9b8ff' : r() < 0.5 ? '#bff4ff' : '#9fe2ff' })
        } else if (c.kind === 'stone') {
          const s = 0.19 + r() * 0.09
          const lift = Math.max(0, (Math.sqrt(c.n) * step - rad)) * 0.4
          stone.push({ p: [x, y + s * 0.6 + lift, z], s: [s, s * 0.8, s], r: [r() * 3, r() * 3, 0], c: ['#c8c2b8', '#aaa398', '#d8d0c0', '#9c968c'][Math.floor(r() * 4)] })
        } else {
          const s = 0.11 + r() * 0.025
          fruit.push({ p: [x, y + s, z], s, c: c.kind === 'apple' ? (r() < 0.8 ? '#d8322a' : '#e8b03a') : '#f28c1e' })
        }
      }
    }
    return { crystal, stone, fruit, mats, torchS, torchF }
  }, [])
}

function useScatter() {
  return useMemo(() => {
    const r = rng(9)
    const tufts: Inst[] = [], flowers: Inst[] = [], pebbles: Inst[] = [], minis: Inst[] = []
    const greens = ['#6f9a3c', '#7fa845', '#5f8a34', '#8aa84a', '#6a9440']
    const fl = ['#f3a6c8', '#ffe08a', '#ffffff', '#9fb8ff', '#ffb36a']
    let tries = 0
    while (tufts.length < 2400 && tries++ < 20000) {
      const x = (r() - 0.5) * 140, z = (r() - 0.5) * 150
      if (ellip(x, z) > 0.97 || Math.abs(z - riverZ(x)) < 5.8) continue
      if (!freeSpot(x, z, -1.2, true)) continue
      const y = terrainH(x, z)
      tufts.push({ p: [x, y - 0.02, z], s: 0.7 + r() * 0.8, r: [0, r() * 6, 0], c: greens[Math.floor(r() * greens.length)] })
      if (r() < 0.32) flowers.push({ p: [x + 0.25, y + 0.32, z + 0.1], s: 0.055 + r() * 0.03, c: fl[Math.floor(r() * fl.length)] })
    }
    tries = 0
    while (pebbles.length < 520 && tries++ < 8000) {
      const x = (r() - 0.5) * 140, z = (r() - 0.5) * 150
      if (ellip(x, z) > 0.95 || Math.abs(z - riverZ(x)) < 5.6) continue
      if (!freeSpot(x, z, -1.5, true)) continue
      const s = 0.06 + r() * 0.12, y = terrainH(x, z)
      pebbles.push({ p: [x, y + s * 0.3, z], s: [s, s * 0.6, s], r: [r(), r() * 6, r()], c: ['#b9b2a6', '#9a948a', '#cfc6b6'][Math.floor(r() * 3)] })
    }
    tries = 0
    while (minis.length < 360 && tries++ < 8000) {
      const x = (r() - 0.5) * 140, z = (r() - 0.5) * 150
      if (ellip(x, z) > 0.95 || Math.abs(z - riverZ(x)) < 5.6) continue
      if (!freeSpot(x, z, -1.2, true)) continue
      const h = 0.2 + r() * 0.35, y = terrainH(x, z)
      minis.push({ p: [x, y - 0.03, z], s: [h * 0.3, h, h * 0.3], r: [(r() - 0.5) * 0.6, r() * 6, (r() - 0.5) * 0.6], c: r() < 0.3 ? '#d6c8ff' : '#aeeaff' })
    }
    return { tufts, flowers, pebbles, minis }
  }, [])
}

export function FieldObjects() {
  const c = useClusterInstances()
  const s = useScatter()
  const flowerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 }), [])
  return (
    <group>
      <Instances geometry={crystalGeo()} material={VM.crystalBlue()} items={c.crystal} />
      <Instances geometry={stoneGeo()} material={VM.stone()} items={c.stone} />
      <Instances geometry={fruitGeo()} material={VM.fruit()} items={c.fruit} />
      <Instances geometry={matGeo()} material={VM.wicker()} items={c.mats} shadow={false} />
      <Instances geometry={torchStickGeo()} material={MAT.woodDark()} items={c.torchS} />
      <Instances geometry={torchCupGeo()} material={MAT.bronzeDark()} items={c.torchS} shadow={false} />
      <Instances geometry={torchFlameGeo()} material={VM.flame()} items={c.torchF} shadow={false} />
      <Instances geometry={tuftGeo()} material={VM.grassBlade()} items={s.tufts} shadow={false} />
      <Instances geometry={fruitGeo()} material={flowerMat} items={s.flowers} shadow={false} />
      <Instances geometry={stoneGeo()} material={VM.stone()} items={s.pebbles} shadow={false} />
      <Instances geometry={crystalGeo()} material={VM.crystalBlue()} items={s.minis} shadow={false} />
      {FORMATIONS.map(([x, z, k], i) => <CrystalFormation key={i} position={[x, terrainH(x, z), z]} s={k} seed={i + 1} mat={i % 4 === 3 ? VM.crystalViolet() : undefined} />)}
    </group>
  )
}

/* ---------- números que aparecem acima de cada grupo ---------- */
export function FieldLabels({ on }: { on: boolean }) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const t0 = useRef<number | null>(null)
  const instant = useRef(on)
  const played = useRef(0)
  const order = useMemo(() => CLUSTERS.map((c) => Math.hypot(c.x - P.altar[0], c.z - P.altar[2])), [])
  useFrame(() => {
    if (!on) return
    if (t0.current == null) t0.current = RT.time - (instant.current ? 999 : 0)
    const t = RT.time - t0.current
    let popped = 0
    groups.current.forEach((g, i) => {
      if (!g) return
      const k = THREE.MathUtils.clamp((t - 0.6 - order[i] / 22) * 2.5, 0, 1)
      if (k > 0) popped++
      const e = k < 1 ? Math.sin(k * Math.PI * 0.5) * (1 + Math.sin(k * Math.PI) * 0.35) : 1
      g.scale.setScalar(Math.max(0.001, e))
      g.visible = k > 0
      g.position.y = CLUSTERS[i].top + 0.4 + Math.sin(RT.time * 1.5 + i) * 0.08
    })
    if (!instant.current && popped > played.current && popped % 4 === 0) { played.current = popped; SFX.note(79 + (popped % 12), 0.3, 0.03) }
  })
  if (!on) return null
  return (
    <group>
      {CLUSTERS.map((c, i) => (
        <group key={i} ref={(g) => { groups.current[i] = g }} position={[c.x, c.top + 0.4, c.z]} visible={false}>
          <Billboard>
            <Text font={FONT.title} fontSize={0.62} anchorX="center" anchorY="middle" outlineWidth={0.035} outlineColor="#3a2408">{String(c.n)}<meshBasicMaterial attach="material" color={c.kind === 'crystal' ? '#c9f3ff' : '#ffe6a8'} toneMapped={false} /></Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}

