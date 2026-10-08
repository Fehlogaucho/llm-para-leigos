/** Entrada (teclado, joystick e toque), fora do React. Vetores em direção de TELA: x = direita, y = baixo. */
export const INPUT = {
  keys: new Set<string>(),
  joy: { x: 0, y: 0 },
  joyActive: false,
  interact: false,
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

/** Direção desejada na tela (comprimento até 1). */
export function screenMove() {
  const k = INPUT.keys
  let x = 0, y = 0
  if (k.has('w') || k.has('arrowup')) y -= 1
  if (k.has('s') || k.has('arrowdown')) y += 1
  if (k.has('d') || k.has('arrowright')) x += 1
  if (k.has('a') || k.has('arrowleft')) x -= 1
  if (INPUT.joyActive) { x += INPUT.joy.x; y += INPUT.joy.y }
  const l = Math.hypot(x, y)
  if (l > 1) { x /= l; y /= l }
  return { x, y }
}
export const wantsRun = () => INPUT.keys.has('shift')

/** Direção na tela → direção no mundo isométrico (normalizada). */
export function screenToWorldDir(vx: number, vy: number) {
  // tela: x = (wx − wy)·16, y = (wx + wy)·8  →  wx = vx/32 + vy/16, wy = vy/16 − vx/32
  let wx = vx / 32 + vy / 16, wy = vy / 16 - vx / 32
  const l = Math.hypot(wx, wy)
  if (l < 1e-6) return { x: 0, y: 0 }
  wx /= l; wy /= l
  return { x: wx, y: wy }
}
