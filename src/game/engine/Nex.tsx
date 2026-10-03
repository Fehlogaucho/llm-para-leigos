import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { RT, INTERACTS } from './runtime'
import { INPUT, moveVector, wantsRun } from './input'
import { COLL, resolveCapsule } from './collision'
import { useGame, G } from '../store'
import { SFX } from './audio'

const R = 0.32, H = 1.42
const WALK = 3.3, RUN = 6.2, GRAV = -24

const mat = (c: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o })

export function useNexMaterials() {
  return useMemo(() => ({
    skin: mat('#f0c49c', { roughness: 0.6 }),
    hair: mat('#3a2314', { roughness: 0.55 }),
    jacket: mat('#1f3366', { roughness: 0.7 }),
    jacketDark: mat('#18284f'),
    shirt: mat('#e9e2d0'),
    pants: mat('#b49c72', { roughness: 0.85 }),
    shoe: mat('#4a3324', { roughness: 0.6 }),
    sole: mat('#efe8dc'),
    bag: mat('#7b4a2a', { roughness: 0.55 }),
    bagDark: mat('#5a3420'),
    white: mat('#ffffff', { roughness: 0.2 }),
    iris: mat('#5a3519', { roughness: 0.3 }),
    pupil: mat('#120a05', { roughness: 0.2 }),
    brow: mat('#2b190e'),
    mouth: mat('#8a3b2e'),
    core: new THREE.MeshStandardMaterial({ color: '#7fe3ff', emissive: '#3fc4ff', emissiveIntensity: 3.2, roughness: 0.3 }),
    coreRing: new THREE.MeshStandardMaterial({ color: '#1b3a5c', metalness: 0.8, roughness: 0.3 }),
  }), [])
}

/** Modelo do NEX: explorador com mochila de núcleo azul (estilizado, feito de primitivas). */
export function NexModel({ rig }: { rig?: React.MutableRefObject<any> }) {
  const m = useNexMaterials()
  const r = useRef<any>({})
  if (rig) rig.current = r.current
  const set = (k: string) => (o: any) => { r.current[k] = o }
  const tuft = (pos: [number, number, number], rot: [number, number, number], s = 1) => (
    <mesh position={pos} rotation={rot} material={m.hair} castShadow scale={s}>
      <coneGeometry args={[0.07, 0.17, 7]} />
    </mesh>
  )
  return (
    <group ref={set('root')}>
      <group ref={set('body')}>
        {/* pernas */}
        {[-1, 1].map((s) => (
          <group key={s} ref={set(s < 0 ? 'legL' : 'legR')} position={[0.085 * s, 0.56, 0]}>
            <mesh position={[0, -0.12, 0]} material={m.pants} castShadow><capsuleGeometry args={[0.072, 0.14, 4, 10]} /></mesh>
            <group ref={set(s < 0 ? 'kneeL' : 'kneeR')} position={[0, -0.26, 0]}>
              <mesh position={[0, -0.1, 0]} material={m.pants} castShadow><capsuleGeometry args={[0.06, 0.12, 4, 10]} /></mesh>
              <group position={[0, -0.24, 0.035]}>
                <RoundedBox args={[0.12, 0.085, 0.22]} radius={0.035} smoothness={3} material={m.shoe} castShadow />
                <RoundedBox args={[0.125, 0.03, 0.225]} radius={0.012} smoothness={2} position={[0, -0.035, 0]} material={m.sole} />
              </group>
            </group>
          </group>
        ))}
        {/* quadril e tronco */}
        <mesh position={[0, 0.6, 0]} scale={[1, 0.62, 0.8]} material={m.pants} castShadow><sphereGeometry args={[0.15, 16, 12]} /></mesh>
        <group ref={set('torso')} position={[0, 0.64, 0]}>
          <mesh position={[0, 0.17, 0]} scale={[1.05, 1, 0.78]} material={m.jacket} castShadow><capsuleGeometry args={[0.15, 0.14, 6, 14]} /></mesh>
          <mesh position={[0, 0.27, 0.085]} rotation={[0.25, 0, 0]} material={m.shirt}><coneGeometry args={[0.06, 0.12, 3]} /></mesh>
          <mesh position={[0, 0.06, 0]} scale={[1.08, 0.3, 0.85]} material={m.jacketDark}><sphereGeometry args={[0.15, 14, 8]} /></mesh>
          {/* mochila */}
          <group position={[0, 0.2, -0.16]}>
            <RoundedBox args={[0.3, 0.34, 0.15]} radius={0.05} smoothness={3} material={m.bag} castShadow />
            <RoundedBox args={[0.31, 0.12, 0.16]} radius={0.04} smoothness={2} position={[0, 0.13, 0.005]} material={m.bagDark} />
            <mesh position={[0, -0.01, -0.078]} rotation={[Math.PI / 2, 0, 0]} material={m.coreRing}><cylinderGeometry args={[0.085, 0.085, 0.02, 24]} /></mesh>
            <mesh position={[0, -0.01, -0.09]} material={m.core}><torusGeometry args={[0.065, 0.014, 10, 28]} /></mesh>
            <mesh position={[0, -0.01, -0.09]} rotation={[Math.PI / 2, 0, 0]} material={m.core}><cylinderGeometry args={[0.03, 0.03, 0.01, 16]} /></mesh>
            {[-1, 1].map((s) => <mesh key={s} position={[0.1 * s, 0.05, 0.1]} rotation={[0.3, 0, 0]} material={m.bagDark}><boxGeometry args={[0.035, 0.32, 0.02]} /></mesh>)}
          </group>
          {/* braços */}
          {[-1, 1].map((s) => (
            <group key={s} ref={set(s < 0 ? 'armL' : 'armR')} position={[0.19 * s, 0.29, 0]}>
              <mesh position={[0, -0.09, 0]} material={m.jacket} castShadow><capsuleGeometry args={[0.055, 0.1, 4, 10]} /></mesh>
              <group ref={set(s < 0 ? 'elbowL' : 'elbowR')} position={[0, -0.19, 0]}>
                <mesh position={[0, -0.075, 0]} material={m.skin} castShadow><capsuleGeometry args={[0.042, 0.09, 4, 10]} /></mesh>
                <mesh position={[0, -0.16, 0.005]} material={m.skin}><sphereGeometry args={[0.052, 12, 10]} /></mesh>
              </group>
            </group>
          ))}
          {/* cabeça */}
          <group ref={set('head')} position={[0, 0.38, 0.01]}>
            <mesh position={[0, 0.05, 0]} material={m.skin}><cylinderGeometry args={[0.05, 0.055, 0.08, 12]} /></mesh>
            <group position={[0, 0.2, 0]}>
              <mesh scale={[1, 1.04, 0.96]} material={m.skin} castShadow><sphereGeometry args={[0.21, 28, 22]} /></mesh>
              {[-1, 1].map((s) => <mesh key={s} position={[0.205 * s, -0.01, -0.01]} scale={[0.6, 1, 0.8]} material={m.skin}><sphereGeometry args={[0.05, 10, 8]} /></mesh>)}
              {/* olhos */}
              {[-1, 1].map((s) => (
                <group key={s} position={[0.077 * s, 0.005, 0.172]} ref={set(s < 0 ? 'eyeL' : 'eyeR')}>
                  <mesh scale={[0.95, 1.15, 0.55]} material={m.white}><sphereGeometry args={[0.052, 16, 12]} /></mesh>
                  <mesh position={[0, -0.004, 0.024]} scale={[1, 1.1, 0.5]} material={m.iris}><sphereGeometry args={[0.034, 14, 10]} /></mesh>
                  <mesh position={[0, -0.004, 0.038]} scale={[1, 1.1, 0.4]} material={m.pupil}><sphereGeometry args={[0.018, 10, 8]} /></mesh>
                  <mesh position={[0.012, 0.012, 0.044]} material={m.white}><sphereGeometry args={[0.008, 6, 6]} /></mesh>
                </group>
              ))}
              {[-1, 1].map((s) => <mesh key={s} position={[0.078 * s, 0.085, 0.178]} rotation={[0.2, 0, -0.18 * s]} material={m.brow}><boxGeometry args={[0.07, 0.014, 0.02]} /></mesh>)}
              <mesh position={[0, -0.045, 0.205]} material={m.skin}><sphereGeometry args={[0.022, 10, 8]} /></mesh>
              <mesh ref={set('mouth')} position={[0, -0.1, 0.185]} rotation={[0.25, 0, Math.PI]} material={m.mouth}><torusGeometry args={[0.032, 0.009, 6, 14, Math.PI]} /></mesh>
              {/* cabelo */}
              <mesh position={[0, 0.045, -0.02]} scale={[1.07, 1.02, 1.07]} material={m.hair} castShadow><sphereGeometry args={[0.215, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} /></mesh>
              <mesh position={[0, -0.02, -0.06]} scale={[1.05, 1, 0.95]} material={m.hair}><sphereGeometry args={[0.21, 20, 14, Math.PI * 0.62, Math.PI * 1.76, Math.PI * 0.3, Math.PI * 0.42]} /></mesh>
              {tuft([0.06, 0.17, 0.15], [1.1, 0, -0.3])}
              {tuft([-0.05, 0.18, 0.15], [1.15, 0, 0.35])}
              {tuft([0.0, 0.2, 0.12], [0.9, 0, 0.05], 1.1)}
              {tuft([0.13, 0.13, 0.12], [1.0, 0, -0.9], 0.9)}
              {tuft([-0.13, 0.13, 0.12], [1.0, 0, 0.9], 0.9)}
              {tuft([0.0, 0.25, -0.02], [0.2, 0, 0.1], 1.2)}
              {tuft([0.09, 0.23, -0.08], [-0.4, 0, -0.5])}
              {tuft([-0.09, 0.23, -0.08], [-0.4, 0, 0.5])}
              {tuft([0.0, 0.17, -0.17], [-1.1, 0, 0], 1.1)}
              {tuft([0.12, 0.1, -0.13], [-1.0, 0, -0.7])}
              {tuft([-0.12, 0.1, -0.13], [-1.0, 0, 0.7])}
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/** Anima o esqueleto do NEX (andar, respirar, gestos). */
export function animateNex(r: any, t: number, speed: number, dt: number, state: { phase: number; blink: number; look: number }, gesture: string, gk: number) {
  if (!r.root) return
  const run = Math.min(1, speed / RUN)
  const k = Math.min(1, speed / 1.2)
  state.phase += dt * (4 + speed * 1.55)
  const p = state.phase
  const sw = Math.sin(p)
  const legA = 0.75 * k * (0.7 + run * 0.5)
  r.legL.rotation.x = sw * legA
  r.legR.rotation.x = -sw * legA
  r.kneeL.rotation.x = Math.max(0, -Math.sin(p + 0.9)) * 1.0 * k + 0.02
  r.kneeR.rotation.x = Math.max(0, Math.sin(p + 0.9)) * 1.0 * k + 0.02
  const breath = Math.sin(t * 2.1) * 0.012
  r.body.position.y = Math.abs(Math.sin(p)) * 0.045 * k + breath * (1 - k)
  r.torso.rotation.x = 0.06 * k + run * 0.12
  r.torso.rotation.y = sw * 0.08 * k
  let aL = -sw * 0.8 * k, aR = sw * 0.8 * k, zL = 0.08, zR = -0.08, eL = -0.25 - 0.4 * k, eR = -0.25 - 0.4 * k
  if (gk > 0) {
    const g = Math.min(1, gk * 3)
    if (gesture === 'reach' || gesture === 'point') { aR = THREE.MathUtils.lerp(aR, -1.45, g); eR = THREE.MathUtils.lerp(eR, gesture === 'point' ? -0.05 : -0.3, g) }
    if (gesture === 'cheer') { aL = THREE.MathUtils.lerp(aL, -2.8, g); aR = THREE.MathUtils.lerp(aR, -2.8, g); zL = 0.3; zR = -0.3; eL = eR = -0.2 }
    if (gesture === 'think') { aR = THREE.MathUtils.lerp(aR, -0.9, g); eR = THREE.MathUtils.lerp(eR, -2.2, g); zR = THREE.MathUtils.lerp(zR, 0.35, g) }
  }
  r.armL.rotation.set(aL, 0, zL + Math.sin(t * 2.1) * 0.02)
  r.armR.rotation.set(aR, 0, zR - Math.sin(t * 2.1) * 0.02)
  r.elbowL.rotation.x = eL
  r.elbowR.rotation.x = eR
  // piscar
  state.blink -= dt
  const bl = state.blink < 0.12 ? 0.1 : 1
  if (state.blink < 0) state.blink = 2.5 + Math.random() * 3
  r.eyeL.scale.y = bl; r.eyeR.scale.y = bl
  const talk = RT.nexTalking > 0 ? 0.6 + Math.abs(Math.sin(t * 16)) * 0.9 : 1
  r.mouth.scale.set(1, talk, 1)
}

const v2 = new THREE.Vector2(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), dir = new THREE.Vector3()
const segA = new THREE.Vector3(), segB = new THREE.Vector3(), push = new THREE.Vector3(), tmp = new THREE.Vector3()

/** O jogador: controle + colisão + modelo. */
export function Nex() {
  const group = useRef<THREE.Group>(null!)
  const rig = useRef<any>(null)
  const st = useRef({ phase: 0, blink: 2, look: 0, safeT: 0, stuck: 0, lastD: 1e9, seq: -1, yawVis: 0 })
  const ring = useRef<THREE.Mesh>(null!)

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20)
    const s = st.current
    const g = G()
    RT.time += dt
    // teleporte de início de nível
    if (s.seq !== g.spawnSeq) {
      s.seq = g.spawnSeq
      RT.player.set(...g.spawn.pos)
      RT.lastSafe.copy(RT.player)
      RT.playerVel.set(0, 0, 0)
      RT.playerYaw = g.spawn.yaw; s.yawVis = g.spawn.yaw
      RT.camYaw = g.spawn.yaw + Math.PI
      RT.nova.set(RT.player.x - Math.cos(g.spawn.yaw) * 0.8, RT.player.y + 1.75, RT.player.z + Math.sin(g.spawn.yaw) * 0.8)
      INPUT.tapTarget = null
    }
    const frozen = RT.frozen || !!g.cine || g.focus || (g.dialog && !g.dialog.ambient) || g.menu != null
    // direção desejada
    moveVector(v2)
    fwd.set(-Math.sin(RT.camYaw), 0, -Math.cos(RT.camYaw))
    right.set(Math.cos(RT.camYaw), 0, -Math.sin(RT.camYaw))
    dir.set(0, 0, 0).addScaledVector(right, v2.x).addScaledVector(fwd, v2.y)
    let mag = Math.min(1, v2.length())
    let run = wantsRun() || mag > 0.92
    if (mag > 0.05) { INPUT.tapTarget = null; INPUT.tapUse = null }
    if (INPUT.tapTarget && !frozen) {
      tmp.subVectors(INPUT.tapTarget, RT.player); tmp.y = 0
      const d = tmp.length()
      if (d < (INPUT.tapUse ? 1.0 : 0.3)) {
        const u = INPUT.tapUse
        INPUT.tapTarget = null; INPUT.tapUse = null
        if (u) { const it = INTERACTS.get(u); if (it && it.enabled) it.use() }
      } else {
        dir.copy(tmp).normalize(); mag = 1; run = d > 6
        if (d < s.lastD - 0.02) { s.lastD = d; s.stuck = 0 } else { s.stuck += dt; if (s.stuck > 0.7) { INPUT.tapTarget = null; INPUT.tapUse = null } }
      }
    } else { s.lastD = 1e9; s.stuck = 0 }
    if (frozen) mag = 0
    const target = mag * (run ? RUN : WALK)
    const vel = RT.playerVel
    const acc = 1 - Math.exp(-dt * (mag > 0 ? 10 : 14))
    vel.x += (dir.x * target - vel.x) * acc
    vel.z += (dir.z * target - vel.z) * acc
    vel.y += GRAV * dt
    if (vel.y < -30) vel.y = -30
    RT.player.addScaledVector(vel, dt)
    // colisão
    segA.copy(RT.player).y += R
    segB.copy(RT.player).y += H - R
    resolveCapsule(segA, segB, R, push)
    const len = push.length()
    let grounded = false
    if (len > 1e-6) {
      const ny = push.y / len
      if (ny > 0.5) { grounded = true; push.set(0, (len * len) / push.y, 0) }
      RT.player.add(push)
      if (grounded) { if (vel.y < 0) vel.y = 0 }
      else { tmp.copy(push).normalize(); const dv = vel.dot(tmp); if (dv < 0) vel.addScaledVector(tmp, -dv) }
    }
    // gruda no chão em descidas
    if (!grounded && vel.y <= 0 && RT.playerGrounded) {
      const gy = COLL.groundY(RT.player.x, RT.player.y + 0.3, RT.player.z, 0.75)
      if (gy != null && RT.player.y - gy < 0.4) { RT.player.y = gy; vel.y = 0; grounded = true }
    }
    RT.playerGrounded = grounded
    RT.playerSpeed = Math.hypot(vel.x, vel.z)
    if (grounded) { s.safeT += dt; if (s.safeT > 0.6) { s.safeT = 0; RT.lastSafe.copy(RT.player) } }
    if (RT.player.y < RT.minY) { RT.player.copy(RT.lastSafe); RT.player.y += 0.5; vel.set(0, 0, 0); SFX.play('whoosh'); G().showToast('Opa! De volta ao caminho.') }
    // orientação
    if (RT.playerSpeed > 0.3) RT.playerYaw = Math.atan2(vel.x, vel.z)
    if (RT.lookAt && frozen) { tmp.subVectors(RT.lookAt, RT.player); if (tmp.x * tmp.x + tmp.z * tmp.z > 0.04) RT.playerYaw = Math.atan2(tmp.x, tmp.z) }
    let dy = RT.playerYaw - s.yawVis
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    s.yawVis += dy * (1 - Math.exp(-dt * 12))
    group.current.position.copy(RT.player)
    group.current.rotation.y = s.yawVis
    if (RT.gestureT > 0) RT.gestureT -= dt
    if (rig.current) animateNex(rig.current, RT.time, RT.playerSpeed, dt, s as any, RT.gesture, Math.max(0, RT.gestureT))
    // interação mais próxima
    let best: any = null, bd = 1e9
    if (!frozen) for (const it of INTERACTS.values()) {
      if (!it.enabled) continue
      const d = Math.hypot(it.pos.x - RT.player.x, it.pos.z - RT.player.z)
      if (d < it.radius && Math.abs(it.pos.y - RT.player.y) < 3.5 && d < bd) { bd = d; best = it }
    }
    const cur = g.prompt
    if ((best?.id || null) !== (cur?.id || null) || (best && cur && best.label !== cur.label)) useGame.setState({ prompt: best ? { id: best.id, label: best.label } : null })
    if (INPUT.interact && !g.dialog) {
      INPUT.interact = false
      if (best && !frozen) best.use()
    }
    // marcador do destino do toque
    if (ring.current) {
      const t = INPUT.tapTarget
      ring.current.visible = !!t
      if (t) { ring.current.position.set(t.x, t.y + 0.04, t.z); const sc = 1 + Math.sin(RT.time * 6) * 0.12; ring.current.scale.set(sc, sc, sc) }
    }
  }, -3)

  return (
    <>
      <group ref={group}>
        <NexModel rig={rig} />
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false} userData={{ noCollide: true }}>
        <ringGeometry args={[0.28, 0.38, 32]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}
