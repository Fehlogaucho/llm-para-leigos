import * as THREE from 'three'

/** Estado de entrada compartilhado (mutável, fora do React para não re-renderizar). */
export const INPUT = {
  keys: new Set<string>(),
  joy: new THREE.Vector2(), // -1..1 (y = para frente)
  joyActive: false,
  camDX: 0, camDY: 0, zoom: 0,
  lastManualCam: -10,
  tapTarget: null as THREE.Vector3 | null,
  tapUse: null as string | null, // interagir ao chegar
  interact: false,
  run: false,
}

let bound = false
export function bindKeyboard() {
  if (bound) return
  bound = true
  const ign = (e: KeyboardEvent) => { const t = e.target as HTMLElement; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') }
  addEventListener('keydown', (e) => {
    if (ign(e)) return
    const k = e.key.toLowerCase()
    INPUT.keys.add(k)
    if (k === 'e' || k === 'enter' || k === ' ') { if (!e.repeat) INPUT.interact = true }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault()
  })
  addEventListener('keyup', (e) => INPUT.keys.delete(e.key.toLowerCase()))
  addEventListener('blur', () => INPUT.keys.clear())
}

/** Vetor de movimento do teclado + joystick (x = direita, y = frente). */
export function moveVector(out: THREE.Vector2) {
  const k = INPUT.keys
  let x = 0, y = 0
  if (k.has('w') || k.has('arrowup')) y += 1
  if (k.has('s') || k.has('arrowdown')) y -= 1
  if (k.has('d') || k.has('arrowright')) x += 1
  if (k.has('a') || k.has('arrowleft')) x -= 1
  out.set(x, y)
  if (out.lengthSq() > 1) out.normalize()
  if (INPUT.joyActive) out.add(INPUT.joy)
  if (out.lengthSq() > 1) out.normalize()
  return out
}
export const wantsRun = () => INPUT.keys.has('shift') || INPUT.run
