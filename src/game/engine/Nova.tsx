import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RT } from './runtime'
import { useGame } from '../store'

export function useNovaMaterials() {
  return useMemo(() => ({
    shell: new THREE.MeshStandardMaterial({ color: '#eef1f6', metalness: 0.35, roughness: 0.22 }),
    visor: new THREE.MeshStandardMaterial({ color: '#0c1220', metalness: 0.6, roughness: 0.15 }),
    eye: new THREE.MeshStandardMaterial({ color: '#9ff0ff', emissive: '#38c8ff', emissiveIntensity: 4, toneMapped: true }),
    ring: new THREE.MeshStandardMaterial({ color: '#2a3550', metalness: 0.8, roughness: 0.3 }),
    glow: new THREE.MeshStandardMaterial({ color: '#7fe3ff', emissive: '#3fb8ff', emissiveIntensity: 3 }),
  }), [])
}

/** NOVA: robô esférico flutuante com olhos azuis. */
export function NovaModel({ rig }: { rig?: React.MutableRefObject<any> }) {
  const m = useNovaMaterials()
  const r = useRef<any>({})
  if (rig) rig.current = r.current
  const set = (k: string) => (o: any) => { r.current[k] = o }
  return (
    <group ref={set('root')}>
      <mesh material={m.shell} castShadow><sphereGeometry args={[0.2, 32, 24]} /></mesh>
      <mesh position={[0, 0.01, 0.035]} scale={[1, 0.62, 0.9]} material={m.visor}><sphereGeometry args={[0.185, 28, 18, -Math.PI * 0.42, Math.PI * 0.84]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} ref={set(s < 0 ? 'eyeL' : 'eyeR')} position={[0.062 * s, 0.015, 0.178]}>
          <mesh scale={[1, 1, 0.35]} material={m.eye}><sphereGeometry args={[0.04, 16, 12]} /></mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.2 * s, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={m.ring}><cylinderGeometry args={[0.075, 0.075, 0.05, 24]} /></mesh>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.glow}><torusGeometry args={[0.06, 0.012, 8, 24]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.21, 0]} material={m.ring}><cylinderGeometry args={[0.012, 0.012, 0.06, 8]} /></mesh>
      <mesh ref={set('tip')} position={[0, 0.25, 0]} material={m.glow}><sphereGeometry args={[0.022, 10, 8]} /></mesh>
      <mesh position={[0, -0.2, 0]} material={m.glow} scale={[1, 0.4, 1]}><sphereGeometry args={[0.035, 12, 8]} /></mesh>
    </group>
  )
}

const want = new THREE.Vector3(), lookP = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0)

/** NOVA acompanha o NEX, olha para quem fala e pisca. */
export function Nova() {
  const on = useGame((s) => (s.flags.nova || 0) > 0)
  return on ? <NovaActive /> : null
}

function NovaActive() {
  const g = useRef<THREE.Group>(null!)
  const rig = useRef<any>(null)
  const st = useRef({ blink: 2, init: false })
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20)
    const s = st.current
    const t = RT.time
    // posição alvo: atrás e à direita do ombro do NEX
    const yaw = RT.playerYaw
    const side = RT.novaTalking > 0 ? 0.9 : 0.75
    if (RT.novaPos) want.set(RT.novaPos.x, RT.novaPos.y + Math.sin(t * 1.7) * 0.07, RT.novaPos.z)
    else want.set(RT.player.x + Math.cos(yaw) * -side + Math.sin(yaw) * -0.35, RT.player.y + 1.75 + Math.sin(t * 1.7) * 0.07, RT.player.z - Math.sin(yaw) * -side + Math.cos(yaw) * -0.35)
    if (!s.init) s.init = true
    else if (RT.nova.distanceTo(want) > 18) RT.nova.copy(want)
    RT.nova.lerp(want, 1 - Math.exp(-dt * 3.2))
    g.current.position.copy(RT.nova)
    // para onde olhar
    if (RT.novaLook) lookP.copy(RT.novaLook)
    else if (RT.novaTalking > 0 && RT.camera) lookP.copy(RT.camera.position)
    else if (RT.playerSpeed > 0.5) lookP.set(RT.nova.x + Math.sin(yaw) * 3, RT.nova.y, RT.nova.z + Math.cos(yaw) * 3)
    else if (RT.camera) lookP.lerpVectors(RT.player, RT.camera.position, 0.6).setY(RT.player.y + 1.3)
    tmpM.lookAt(lookP, RT.nova, up)
    tmpQ.setFromRotationMatrix(tmpM)
    g.current.quaternion.slerp(tmpQ, 1 - Math.exp(-dt * 5))
    const r = rig.current
    if (r?.root) {
      r.root.rotation.z = Math.sin(t * 1.3) * 0.08
      s.blink -= dt
      let ey = s.blink < 0.1 ? 0.15 : 1
      if (s.blink < 0) s.blink = 2 + Math.random() * 3.5
      if (RT.novaTalking > 0) ey *= 0.85 + Math.abs(Math.sin(t * 13)) * 0.35
      r.eyeL.scale.set(1, ey, 1); r.eyeR.scale.set(1, ey, 1)
      r.tip.scale.setScalar(1 + Math.sin(t * 5) * 0.25)
    }
  }, -1)
  return <group ref={g}><NovaModel rig={rig} /></group>
}
