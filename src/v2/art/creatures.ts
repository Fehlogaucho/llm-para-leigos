import { Pix, hex, darker, lighter, mix, textPix } from '../engine/pix'
import { OUT, memo, spr } from './core'
import type { Sprite } from '../engine/runtime'

/* =========================================================
   Habitantes da máquina: robozinhos guardiões e operários,
   tokens (criaturinhas com uma palavra), bits, drones, o gato
   do quarto e os balões de emoção.
   ========================================================= */
const O = () => hex(OUT)
const flipPix = (p: Pix) => { const q = new Pix(p.w, p.h); q.blit(p, 0, 0, true); return q }
/** Vista (frente/costas e espelho) para uma direção do mundo. */
export function facing(dir: { x: number; y: number }) {
  const sx = dir.x - dir.y, sy = dir.x + dir.y
  const back = sy < -0.05
  return { back, flip: back ? sx > 0 : sx < 0 }
}

/* ---------- robozinho (guardião, operário, bibliotecário…) ---------- */
export type RobotKind = 'guardiao' | 'operario' | 'tesoura' | 'bibliotecario' | 'carteiro' | 'cientista'
export function robotSprite(kind: RobotKind, color: string, dir: { x: number; y: number }, frame: number, talk = false): Sprite {
  const { back, flip } = facing(dir)
  const f = frame % 4
  return memo(`rob:${kind}:${color}:${back ? 1 : 0}:${flip ? 1 : 0}:${f}:${talk ? 1 : 0}`, () => {
    const p = new Pix(22, 28)
    const body = hex(color), bodyD = hex(darker(color, 0.28)), bodyL = hex(lighter(color, 0.25))
    const bob = f % 2 ? -1 : 0
    // rodinha / pernas
    p.ellipse(11, 25, 4, 2.2, hex('#2a2a3a')); p.rect(8 + (f === 1 ? -1 : 0), 22, 2, 3, hex('#3a3a4a')); p.rect(12 + (f === 3 ? 1 : 0), 22, 2, 3, hex('#3a3a4a'))
    // corpo
    p.rect(6, 14 + bob, 10, 9, body); p.rect(15, 14 + bob, 1, 9, bodyD); p.rect(6, 14 + bob, 1, 9, bodyL); p.rect(6, 22 + bob, 10, 1, bodyD)
    if (!back) { p.rect(9, 17 + bob, 4, 3, hex('#1a2440')); p.px(10, 18 + bob, hex('#59d7ff')); p.px(11 + (f % 2), 18 + bob, hex(f % 2 ? '#ffd27a' : '#59d7ff')) }
    // braços
    p.rect(4, 15 + bob, 2, 5, bodyD); p.rect(16, 15 + bob, 2, 5, bodyD)
    // cabeça com tela
    p.rect(5, 4 + bob, 12, 10, body); p.rect(5, 4 + bob, 12, 1, bodyL); p.rect(16, 4 + bob, 1, 10, bodyD)
    if (!back) {
      p.rect(7, 6 + bob, 8, 6, hex('#0c1a3a'))
      const eye = hex('#7fe3ff')
      if (talk && f % 2) { p.rect(8, 8 + bob, 2, 1, eye); p.rect(12, 8 + bob, 2, 1, eye); p.rect(10, 10 + bob, 2, 1, eye) }
      else { p.rect(8, 7 + bob, 2, 3, eye); p.rect(12, 7 + bob, 2, 3, eye); p.px(8, 7 + bob, hex('#ffffff')); p.px(12, 7 + bob, hex('#ffffff')) }
    } else { p.rect(7, 7 + bob, 8, 4, bodyD) }
    // antena
    p.rect(10, 1 + bob, 2, 3, hex('#5a5a6a')); p.rect(10, 0 + bob, 2, 1, hex(f < 2 ? '#ff6a5a' : '#ffd27a'))
    // acessório de cada tipo
    switch (kind) {
      case 'operario': p.rect(4, 3 + bob, 14, 2, hex('#ffd25a')); p.rect(6, 1 + bob, 10, 3, hex('#ffd25a')); p.px(8, 2 + bob, hex('#fff2c0')); break
      case 'tesoura': { const o = f % 2 ? 1 : 0; p.line(17, 16 + bob, 21, 13 + bob - o, hex('#d8d8e8')); p.line(17, 17 + bob, 21, 19 + bob + o, hex('#d8d8e8')); p.ellipse(17, 16.5 + bob, 1.5, 1.5, hex('#ff6a5a')); break }
      case 'bibliotecario': p.rect(1, 16 + bob, 5, 6, hex('#8a2a3a')); p.rect(1, 16 + bob, 5, 1, hex('#e8b65a')); p.rect(6, 6 + bob, 10, 1, hex('#e8b65a')); break
      case 'carteiro': p.rect(5, 2 + bob, 12, 3, hex('#2c4f9e')); p.rect(4, 4 + bob, 14, 1, hex('#1e3470')); p.rect(15, 17 + bob, 5, 4, hex('#c8a070')); p.rect(15, 17 + bob, 5, 1, hex('#8a5a34')); break
      case 'cientista': p.rect(5, 14 + bob, 12, 9, hex('#f2f0ea')); p.rect(10, 14 + bob, 2, 9, hex('#c8c8d0')); if (!back) { p.rect(7, 7 + bob, 3, 1, hex('#ffffff')); p.rect(12, 7 + bob, 3, 1, hex('#ffffff')) } break
      default: p.ellipse(19, 18 + bob, 2, 2.5, hex(f % 2 ? '#ffd27a' : '#ffb35a')); p.rect(18, 15 + bob, 2, 1, hex('#5a5a6a')); break // lanterna
    }
    p.outline(O())
    const q = flip ? flipPix(p) : p
    return spr(q, flip ? 10 : 11, 26)
  })
}

/* ---------- token: criaturinha com uma palavra ---------- */
export function tokenBody(color: string, frame: number, mood: 'feliz' | 'surpreso' | 'dormindo' = 'feliz'): Sprite {
  const f = frame % 4
  return memo(`tokb:${color}:${f}:${mood}`, () => {
    const p = new Pix(16, 16)
    const sq = f === 0 ? 1 : f === 2 ? -1 : 0 // amassa e estica
    const c = hex(color), cd = hex(darker(color, 0.3)), cl = hex(lighter(color, 0.35))
    p.rect(2 - sq, 4 + sq * 2, 12 + sq * 2, 10 - sq * 2, c)
    p.rect(2 - sq, 13, 12 + sq * 2, 1, cd); p.rect(13 + sq, 4 + sq * 2, 1, 10 - sq * 2, cd); p.rect(3 - sq, 5 + sq * 2, 3, 1, cl)
    const ey = 8 + sq
    if (mood === 'dormindo') { p.rect(5, ey + 1, 2, 1, O()); p.rect(9, ey + 1, 2, 1, O()) }
    else if (mood === 'surpreso') { p.rect(5, ey, 2, 2, O()); p.rect(9, ey, 2, 2, O()); p.rect(7, ey + 3, 2, 2, O()) }
    else { p.rect(5, ey, 2, 2, O()); p.rect(9, ey, 2, 2, O()); p.px(5, ey, hex('#ffffff')); p.px(9, ey, hex('#ffffff')); p.rect(7, ey + 3, 2, 1, O()); p.px(4, ey + 2, hex(mix(color, '#ff6a8a', 0.5))); p.px(11, ey + 2, hex(mix(color, '#ff6a8a', 0.5))) }
    // pezinhos
    p.rect(4, 14, 2, 1, cd); p.rect(10, 14, 2, 1, cd)
    p.outline(O())
    return spr(p, 8, 15)
  })
}
/** Etiqueta pequena com a palavra do token. */
export function tokenTag(word: string, color = '#fff3d6', bg = '#1a1430'): Sprite {
  return memo(`tag:${word}:${color}:${bg}`, () => {
    const t = textPix(word, color, '')
    const p = new Pix(t.w + 4, t.h)
    p.rect(0, 1, p.w, p.h - 2, hex(bg)); p.blit(t, 2, -1)
    p.outline(O())
    return spr(p, Math.floor(p.w / 2), p.h)
  })
}

/* ---------- bit (0 ou 1 saltitante) ---------- */
export function bitSprite(v: '0' | '1', frame: number): Sprite {
  const f = frame % 2
  return memo(`bit:${v}:${f}`, () => {
    const p = new Pix(10, 12)
    const c = hex(v === '1' ? '#ffd27a' : '#7fe3ff')
    if (v === '1') { p.rect(4, 1, 3, 9, c); p.rect(3, 2, 2, 2, c); p.rect(3, 9, 5, 2, c) }
    else { p.ellipse(5, 6, 3.5, 5, c); p.ellipse(5, 6, 1.5, 3, 0) }
    p.px(f ? 3 : 4, 5, O()); p.px(f ? 6 : 7, 5, O())
    p.outline(O())
    return spr(p, 5, 11)
  })
}

/* ---------- drone de manutenção ---------- */
export function droneSprite(frame: number, color = '#c8d0e0', light = '#7fe3ff'): Sprite {
  const f = frame % 2
  return memo(`drone:${f}:${color}:${light}`, () => {
    const p = new Pix(24, 16)
    const c = hex(color), cd = hex(darker(color, 0.3))
    p.rect(f ? 1 : 3, 2, f ? 8 : 4, 1, hex('#9aa0b0')); p.rect(f ? 15 : 17, 2, f ? 8 : 4, 1, hex('#9aa0b0'))
    p.rect(4, 3, 2, 3, cd); p.rect(18, 3, 2, 3, cd)
    p.ellipse(12, 8, 7, 4.5, c); p.rect(5, 9, 14, 2, cd)
    p.ellipse(12, 8, 2.5, 2, hex(light)); p.px(11, 7, hex('#ffffff'))
    p.rect(11, 12, 2, 2, hex(f ? light : '#ff6a5a'))
    p.outline(O())
    return spr(p, 12, 15)
  })
}

/* ---------- gato (dorme na cama, acorda com o raio) ---------- */
export type CatPose = 'dorme' | 'sentado' | 'corre' | 'assustado'
export function catSprite(pose: CatPose, frame: number, flip = false): Sprite {
  const f = frame % 4
  return memo(`cat:${pose}:${f}:${flip}`, () => {
    const p = new Pix(22, 16)
    const fur = hex('#e8984a'), furD = hex('#b8682a'), furL = hex('#ffc890'), dark = hex('#2a1a12')
    if (pose === 'dorme') {
      const br = f < 2 ? 0 : 1 // respiração
      p.ellipse(11, 11 - br * 0.5, 7, 4 + br * 0.4, fur); p.ellipse(9, 10, 3, 2, furL)
      p.ellipse(16, 10, 3, 2.6, fur); p.px(15, 9, dark); p.px(17, 9, dark) // cabeça (olhos fechados = traços)
      p.rect(14, 7, 1, 2, furD); p.rect(17, 7, 1, 2, furD)
      p.line(4, 12, 2, 9 + (f % 2), furD) // rabo
      p.rect(8, 9, 1, 3, furD); p.rect(11, 8, 1, 3, furD)
    } else if (pose === 'corre') {
      const k = f % 2
      p.ellipse(10, 9, 6, 3, fur); p.ellipse(16, 7, 3, 2.6, fur); p.rect(14, 4, 1, 2, furD); p.rect(17, 4, 1, 2, furD); p.px(17, 7, dark)
      p.rect(5 + k, 11, 1, 3, furD); p.rect(8 - k, 11, 1, 3, furD); p.rect(12 + k, 11, 1, 3, furD); p.rect(15 - k, 11, 1, 3, furD)
      p.line(4, 8, 1, 5 - k, furD)
    } else {
      const up = pose === 'assustado' ? 2 : 0
      p.ellipse(10, 11 - up, 4.5, 4, fur); p.ellipse(10, 6 - up, 3.6, 3.2, fur)
      p.poly([[7, 4 - up], [8, 1 - up], [9, 4 - up]], fur); p.poly([[11, 4 - up], [12, 1 - up], [13, 4 - up]], fur)
      p.px(9, 6 - up, dark); p.px(11, 6 - up, dark)
      if (pose === 'assustado') { p.rect(8, 6 - up, 2, 2, dark); p.rect(11, 6 - up, 2, 2, dark); p.px(8, 6 - up, hex('#ffffff')); p.px(11, 6 - up, hex('#ffffff')) }
      p.rect(8, 14, 1, 2, furD); p.rect(12, 14, 1, 2, furD)
      p.line(14, 13, 17, 9 - (f % 2) - up, furD)
    }
    p.outline(O())
    return spr(flip ? flipPix(p) : p, 11, 15)
  })
}

/* ---------- balões de emoção ---------- */
export function emoteSprite(kind: string, frame = 0): Sprite {
  const f = frame % 2
  return memo(`emo:${kind}:${f}`, () => {
    const p = new Pix(14, 15)
    p.rect(1, 1, 12, 10, hex('#fff8e8')); p.poly([[5, 11], [9, 11], [6, 14]], hex('#fff8e8'))
    const ink = hex('#2a1a3a'), red = hex('#e84a6a'), gold = hex('#e8a020')
    switch (kind) {
      case '!': p.rect(6, 3, 2, 5, red); p.rect(6, 9, 2, 1, red); break
      case '?': p.rect(5, 3, 4, 1, ink); p.rect(8, 4, 1, 2, ink); p.rect(6, 6, 2, 1, ink); p.rect(6, 9, 2, 1, ink); break
      case '♥': p.rect(4, 4, 2, 2, red); p.rect(8, 4, 2, 2, red); p.rect(3, 5, 8, 2, red); p.rect(4, 7, 6, 1, red); p.rect(5, 8, 4, 1, red); p.rect(6, 9, 2, 1, red); break
      case '…': for (const x of [3, 6, 9]) p.rect(x, 7, 2, 2, ink); break
      case 'zz': p.rect(3, 3, 4, 1, ink); p.px(5, 4, ink); p.px(4, 5, ink); p.rect(3, 6, 4, 1, ink); p.rect(8, 6, 3, 1, ink); p.px(9, 7, ink); p.rect(8, 8, 3, 1, ink); break
      case 'ideia': p.ellipse(7, 5.5, 3, 3, gold); p.rect(6, 8, 3, 2, hex('#8a8a96')); p.px(6, 4, hex('#fff2c0')); if (f) { p.px(2, 2, gold); p.px(11, 2, gold) } break
      case 'tonto': for (let k = 0; k < 3; k++) { const a = f * 1.2 + k * 2.1; p.px(7 + Math.cos(a) * 4, 6 + Math.sin(a) * 2.5, gold) } p.rect(6, 5, 2, 2, ink); break
      case '♪': p.rect(8, 2, 1, 6, ink); p.rect(8, 2, 3, 1, ink); p.ellipse(6.5, 8, 2, 1.5, ink); break
      case '★': p.poly([[7, 2], [8.5, 5.5], [12, 6], [9, 8], [10, 11], [7, 9.5], [4, 11], [5, 8], [2, 6], [5.5, 5.5]], gold); break
      default: break
    }
    p.outline(O())
    return spr(p, 7, 14)
  })
}
/** Balão de “conversar” para o marcador de quem fala. */
export function talkMarker(color: string): Sprite {
  return memo('talkmk:' + color, () => {
    const p = new Pix(13, 12)
    p.rect(1, 1, 11, 7, hex(color)); p.poly([[3, 8], [7, 8], [4, 11]], hex(color))
    for (const x of [3, 6, 9]) p.rect(x, 4, 1, 1, hex('#2a1a3a'))
    p.rect(2, 2, 3, 1, hex(lighter(color, 0.5)))
    p.outline(O())
    return spr(p, 6, 12)
  })
}
