import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RT, INTERACTS } from './runtime'
import { INPUT } from './input'
import { COLL } from './collision'
import { G, useGame } from '../store'
import { SFX } from './audio'

const target = new THREE.Vector3(), desired = new THREE.Vector3(), dirV = new THREE.Vector3(), lookV = new THREE.Vector3()
const curLook = new THREE.Vector3(), ndc = new THREE.Vector2(), ray = new THREE.Raycaster()
const a = new THREE.Vector3(), b = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3()

export const FOCUS = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 50, active: false }

const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Câmera em terceira pessoa: arrastar gira, pinça/roda aproxima, toque anda/interage. */
export function CameraRig() {
  const { camera, gl, scene } = useThree()
  const st = useRef({ init: false, cineRef: null as any, cineFrom: null as null | { pos: THREE.Vector3; look: THREE.Vector3 } })
  useEffect(() => {
    RT.camera = camera as THREE.PerspectiveCamera
    RT.scene = scene
    RT.gl = gl
    const el = gl.domElement
    const ptrs = new Map<number, { x: number; y: number; sx: number; sy: number; t: number }>()
    let pinch = 0
    const down = (e: PointerEvent) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() })
      if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; pinch = Math.hypot(p.x - q.x, p.y - q.y) }
    }
    const move = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      p.x = e.clientX; p.y = e.clientY
      if (ptrs.size === 2) {
        const [u, v] = [...ptrs.values()]; const d = Math.hypot(u.x - v.x, u.y - v.y)
        INPUT.zoom += (pinch - d) * 0.02; pinch = d; return
      }
      if (G().focus || G().cine) return
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) {
        const sens = G().settings.sens
        INPUT.camDX += dx * 0.0055 * sens; INPUT.camDY += dy * 0.0045 * sens
        INPUT.lastManualCam = RT.time
      }
    }
    const up = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId)
      ptrs.delete(e.pointerId)
      if (!p) return
      const g = G()
      if (g.cine) { if (g.cine.skippable) { skipCine() } return }
      if (g.focus || g.menu || (g.dialog && !g.dialog.ambient)) return
      const dist = Math.hypot(e.clientX - p.sx, e.clientY - p.sy)
      if (dist > 8 || performance.now() - p.t > 450 || ptrs.size > 0) return
      tap(e.clientX, e.clientY)
    }
    const wheel = (e: WheelEvent) => { INPUT.zoom += e.deltaY * 0.004; e.preventDefault() }
    const tap = (cx: number, cy: number) => {
      const rect = el.getBoundingClientRect()
      ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      // 1) interativos
      const roots: THREE.Object3D[] = []
      for (const it of INTERACTS.values()) if (it.enabled && it.root) roots.push(it.root)
      const hits = ray.intersectObjects(roots, true)
      if (hits.length) {
        let o: THREE.Object3D | null = hits[0].object
        while (o && !o.userData.interactId) o = o.parent
        const it = o ? INTERACTS.get(o.userData.interactId) : null
        if (it) {
          const d = Math.hypot(it.pos.x - RT.player.x, it.pos.z - RT.player.z)
          if (d < it.radius) { it.use(); return }
          // anda até perto e usa
          const dir = new THREE.Vector3().subVectors(RT.player, it.pos).setY(0).normalize()
          INPUT.tapTarget = it.pos.clone().addScaledVector(dir, Math.max(0.6, it.radius * 0.5))
          INPUT.tapTarget.y = it.pos.y
          INPUT.tapUse = it.id
          SFX.play('tick')
          return
        }
      }
      // 2) chão
      const h = COLL.raycast(ray.ray.origin, ray.ray.direction, 120)
      if (h && h.normal.y > 0.55) { INPUT.tapTarget = h.point; INPUT.tapUse = null; SFX.play('tick') }
    }
    el.addEventListener('pointerdown', down)
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
    addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move)
      removeEventListener('pointerup', up); removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel)
    }
  }, [camera, gl, scene])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20)
    const cam = camera as THREE.PerspectiveCamera
    const g = G()
    const s = st.current
    // cinemática
    if (g.cine) {
      if (s.cineRef !== g.cine) { s.cineRef = g.cine; s.cineFrom = { pos: cam.position.clone(), look: curLook.clone() } }
      const shots = g.cine.shots
      const el = (performance.now() - g.cine.t0) / 1000
      let acc = 0, i = 0
      for (; i < shots.length; i++) { const d = shots[i].dur ?? 3; if (el < acc + d) break; acc += d }
      if (i >= shots.length) { const r = g.cine.resolve; useGame.setState({ cine: null }); r() }
      else {
        const sh = shots[i], prev = i > 0 ? shots[i - 1] : null
        const k = ease(Math.min(1, (el - acc) / (sh.dur ?? 3)))
        if (sh.cut) { a.set(...sh.pos); la.set(...sh.look) }
        else if (prev) { a.set(...prev.pos); la.set(...prev.look) }
        else { a.copy(s.cineFrom!.pos); la.copy(s.cineFrom!.look) }
        b.set(...sh.pos); lb.set(...sh.look)
        if (sh.cut && sh.to) { b.set(...sh.to); if (sh.lookTo) lb.set(...sh.lookTo) }
        cam.position.lerpVectors(a, b, k)
        curLook.lerpVectors(la, lb, k)
        cam.lookAt(curLook)
        const f = (sh.fov ?? 50) * (cam.aspect < 0.8 ? 1.3 : 1)
        if (Math.abs(cam.fov - f) > 0.01) { cam.fov += (f - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix() }
        return
      }
    }
    s.cineFrom = null
    if (g.focus && FOCUS.active) {
      const k = 1 - Math.exp(-dt * 4)
      cam.position.lerp(FOCUS.pos, k)
      curLook.lerp(FOCUS.look, k)
      cam.lookAt(curLook)
      const ff = FOCUS.fov * (cam.aspect < 0.8 ? 1.35 : 1)
      if (Math.abs(cam.fov - ff) > 0.01) { cam.fov += (ff - cam.fov) * k; cam.updateProjectionMatrix() }
      return
    }
    const baseFov = cam.aspect < 0.8 ? 64 : 50
    if (Math.abs(cam.fov - baseFov) > 0.01) { cam.fov += (baseFov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix() }
    // órbita
    RT.camYaw -= INPUT.camDX; RT.camPitch += INPUT.camDY
    INPUT.camDX = 0; INPUT.camDY = 0
    RT.camPitch = THREE.MathUtils.clamp(RT.camPitch, 0.08, 1.25)
    RT.camDist = THREE.MathUtils.clamp(RT.camDist + INPUT.zoom, 2.6, 12)
    INPUT.zoom = 0
    // volta para trás do NEX quando ele anda
    if (RT.playerSpeed > 1.2 && RT.time - INPUT.lastManualCam > 2.2) {
      const behind = RT.playerYaw + Math.PI
      let d = behind - RT.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d))
      RT.camYaw += d * (1 - Math.exp(-dt * 0.9)) * Math.min(1, RT.playerSpeed / 4)
    }
    target.set(RT.player.x, RT.player.y + 1.45, RT.player.z)
    const cp = Math.cos(RT.camPitch)
    dirV.set(Math.sin(RT.camYaw) * cp, Math.sin(RT.camPitch), Math.cos(RT.camYaw) * cp)
    let dist = RT.camDist * (cam.aspect < 0.8 ? 1.12 : 1)
    const hit = COLL.raycast(target, dirV, dist + 0.3)
    if (hit) dist = Math.max(0.8, hit.distance - 0.35)
    desired.copy(target).addScaledVector(dirV, dist)
    if (!s.init) { cam.position.copy(desired); curLook.copy(target); s.init = true }
    const k = 1 - Math.exp(-dt * 9)
    cam.position.lerp(desired, k)
    // não deixa a câmera atravessar paredes enquanto suaviza
    lookV.subVectors(cam.position, target)
    const ld = lookV.length()
    if (ld > dist + 0.05) cam.position.copy(target).addScaledVector(lookV.normalize(), dist)
    curLook.lerp(target, 1 - Math.exp(-dt * 14))
    cam.lookAt(curLook)
  }, -2)
  return null
}

export function skipCine() {
  const c = G().cine
  if (!c) return
  const r = c.resolve
  useGame.setState({ cine: null })
  r()
}
