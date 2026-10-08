import { useEffect, useRef } from 'react'
import { G, useGame, type Shot } from '../store'
import { RT, FOCUS, INTERACTS, iso, unIso, labelOf, resetRT, type Scene, type Thing, type Sprite, type Interact } from './runtime'
import { INPUT, screenMove, screenToWorldDir, wantsRun } from './input'
import { buildWalk, moveWithCollision, findPath, fits } from './world'
import { tilePix, shadow, markerSprite } from '../art/core'
import { personSprite, NEX, novaSprite } from '../art/person'
import { Pix, hex, darker, lighter, hash2 } from './pix'
import { LEVELS } from '../levels/registry'
import { runScript, setLevelSignal } from './script'
import { playTheme } from './audio'

/* =========================================================
   O desenhista do mundo 2D isométrico: carrega a fase, anda
   com o NEX, segue a câmera e desenha tudo em pixel art numa
   tela pequena ampliada por um número inteiro (pixels nítidos).
   ========================================================= */
const CH = 16 // casas por pedaço de chão pré-desenhado
interface Fall { x: number; y: number; len: number; w: number; seed: number }
/** Escolhe pontos das bordas da frente para as cachoeiras de dados. */
function findFalls(sc: Scene): Fall[] {
  const out: Fall[] = []
  if (!sc.falls) return out
  for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) {
    if (!sc.ground(x, y)) continue
    const left = !(y + 1 < sc.h && sc.ground(x, y + 1)), right = !(x + 1 < sc.w && sc.ground(x + 1, y))
    if (left && hash2(x, y, 41) < sc.falls.density) out.push({ x: x + 0.5, y: y + 1, len: 70 + Math.floor(hash2(x, y, 42) * 110), w: 5 + Math.floor(hash2(x, y, 43) * 6), seed: x * 7 + y })
    else if (right && hash2(x, y, 44) < sc.falls.density) out.push({ x: x + 1, y: y + 0.5, len: 70 + Math.floor(hash2(x, y, 45) * 110), w: 5 + Math.floor(hash2(x, y, 46) * 6), seed: x * 5 + y })
  }
  return out
}
interface Chunk { img: HTMLCanvasElement; ox: number; oy: number; w: number; h: number }

/** Desenha o chão (e os penhascos das bordas) em pedaços. */
function buildChunks(sc: Scene): Chunk[] {
  const out: Chunk[] = []
  const D = sc.cliff?.depth ?? 0
  const ca = sc.cliff ? hex(sc.cliff.a) : 0, cb = sc.cliff ? hex(sc.cliff.b) : 0
  const caD = sc.cliff ? hex(darker(sc.cliff.a, 0.25)) : 0, cbD = sc.cliff ? hex(darker(sc.cliff.b, 0.25)) : 0
  const lip = sc.cliff ? hex(lighter(sc.cliff.a, 0.35)) : 0, edge = hex('#120c1c')
  for (let cy = 0; cy < sc.h; cy += CH) for (let cx = 0; cx < sc.w; cx += CH) {
    let any = false
    for (let y = cy; y < Math.min(sc.h, cy + CH) && !any; y++) for (let x = cx; x < Math.min(sc.w, cx + CH); x++) if (sc.ground(x, y)) { any = true; break }
    if (!any) continue
    const M = 24 // margem de cima (coisas pintadas que saem do chão)
    const ox = (cx - (cy + CH)) * 16, oy = (cx + cy) * 8 - M
    const p = new Pix(CH * 32, CH * 16 + D + 6 + M)
    for (let y = cy; y < Math.min(sc.h, cy + CH); y++) for (let x = cx; x < Math.min(sc.w, cx + CH); x++) {
      const t = sc.ground(x, y); if (!t) continue
      const s = iso(x, y), tx = s.sx - 16 - ox, ty = s.sy - oy
      p.blit(tilePix(t, x, y), tx, ty)
    }
    if (sc.paint) for (let y = cy; y < Math.min(sc.h, cy + CH); y++) for (let x = cx; x < Math.min(sc.w, cx + CH); x++) {
      if (!sc.ground(x, y)) continue
      const s = iso(x, y)
      sc.paint(p, x, y, s.sx - ox, s.sy - oy)
    }
    if (D) for (let y = cy; y < Math.min(sc.h, cy + CH); y++) for (let x = cx; x < Math.min(sc.w, cx + CH); x++) {
      if (!sc.ground(x, y)) continue
      const s = iso(x, y), tx = s.sx - ox, ty = s.sy - oy
      const left = !(y + 1 < sc.h && sc.ground(x, y + 1)), right = !(x + 1 < sc.w && sc.ground(x + 1, y))
      // face esquerda (abaixo da aresta de baixo-esquerda)
      if (left) for (let i = 0; i < 16; i++) {
        const px = tx - 16 + i, top = ty + 8 + Math.floor(i / 2)
        const d = D - Math.floor(hash2(x * 31 + i, y, 3) * D * 0.4) - (i < 2 ? 4 : 0)
        for (let k = 0; k < d; k++) p.px(px, top + k, k < 2 ? lip : k >= d - 2 ? edge : (Math.floor((k + hash2(x, y, i) * 2) / 5) % 2 ? caD : ca))
      }
      if (right) for (let i = 0; i < 16; i++) {
        const px = tx + i, top = ty + 16 - Math.floor((i + 1) / 2)
        const d = D - Math.floor(hash2(x, y * 31 + i, 5) * D * 0.4) - (i > 13 ? 4 : 0)
        for (let k = 0; k < d; k++) p.px(px, top + k, k < 1 ? lip : k >= d - 2 ? edge : (Math.floor((k + hash2(y, x, i) * 2) / 5) % 2 ? cbD : cb))
      }
    }
    out.push({ img: p.canvas(), ox, oy, w: p.w, h: p.h })
  }
  return out
}

/* ---------- câmera ---------- */
const CAM_FROM = { x: 0, y: 0, zoom: 1, h: 0 }
let cineRef: unknown = null
function smooth(k: number) { return k * k * (3 - 2 * k) }
function cineCam(shots: Shot[], t: number) {
  let from = { ...CAM_FROM }, el = t
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i], to = { x: s.pos[0], y: s.pos[1], zoom: s.zoom ?? 1, h: s.h ?? 0 }
    const dur = s.cut ? 0 : (s.dur ?? 2)
    if (s.cut) { from = to; continue }
    if (el < dur) { const k = smooth(el / dur); return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, zoom: from.zoom + (to.zoom - from.zoom) * k, h: from.h + (to.h - from.h) * k, done: false } }
    el -= dur; from = to
  }
  return { ...from, done: true }
}
export function skipCine() {
  const c = G().cine
  if (!c) return
  const r = c.resolve
  const last = c.shots[c.shots.length - 1]
  if (last) { RT.cam.x = last.pos[0]; RT.cam.y = last.pos[1]; RT.cam.zoom = last.zoom ?? 1; RT.cam.h = last.h ?? 0 }
  useGame.setState({ cine: null })
  r()
}

/* ---------- ordem de desenho (profundidade isométrica) ---------- */
interface D { x0: number; x1: number; y0: number; y1: number; s0: number; s1: number; t0: number; t1: number; draw: () => void }
function behind(a: D, b: D) {
  const ab = a.x1 <= b.x0 + 1e-3 || a.y1 <= b.y0 + 1e-3
  const ba = b.x1 <= a.x0 + 1e-3 || b.y1 <= a.y0 + 1e-3
  if (ab !== ba) return ab
  return a.x0 + a.x1 + a.y0 + a.y1 < b.x0 + b.x1 + b.y0 + b.y1
}
function depthSort(list: D[]) {
  const n = list.length, before: number[][] = list.map(() => [])
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = list[i], b = list[j]
    if (a.s1 <= b.s0 || b.s1 <= a.s0 || a.t1 <= b.t0 || b.t1 <= a.t0) continue // não se cruzam na tela
    if (behind(a, b)) before[j].push(i); else before[i].push(j)
  }
  const mark = new Uint8Array(n), order: D[] = []
  const visit = (i: number) => { if (mark[i]) return; mark[i] = 1; for (const k of before[i]) visit(k); order.push(list[i]) }
  // começa pelos de trás (soma menor) para empates ficarem estáveis
  const idx = list.map((_, i) => i).sort((p, q) => (list[p].x0 + list[p].y0) - (list[q].x0 + list[q].y0))
  for (const i of idx) visit(i)
  return order
}

const spriteOf = (t: Thing): Sprite | null => (typeof t.sprite === 'function' ? t.sprite() : t.sprite)
const alphaOf = (t: Thing) => (t.alpha == null ? 1 : typeof t.alpha === 'function' ? t.alpha() : t.alpha)

/* ---------- interação ---------- */
function nearestInteract(): Interact | null {
  let best: Interact | null = null, bd = 1e9
  for (const it of INTERACTS.values()) {
    if (!it.enabled()) continue
    const d = Math.hypot(RT.player.x - it.x, RT.player.y - it.y)
    if (d < it.r && d < bd) { bd = d; best = it }
  }
  return best
}

export function GameView() {
  const ref = useRef<HTMLCanvasElement>(null!)
  const level = useGame((s) => s.level)
  const st = useRef({ chunks: [] as Chunk[], sc: null as Scene | null, falls: [] as Fall[] })

  /* ----- carregar a fase ----- */
  useEffect(() => {
    if (!level) return
    const L = LEVELS[level]
    if (!L) return
    let dead = false
    const ac = new AbortController()
    L.load().then((mod) => {
      if (dead) return
      INTERACTS.clear()
      resetRT()
      const sc = mod.default()
      buildWalk(sc)
      RT.scene = sc
      st.current.sc = sc
      st.current.chunks = buildChunks(sc)
      st.current.falls = findFalls(sc)
      RT.player.x = sc.spawn.pos[0]; RT.player.y = sc.spawn.pos[1]
      if (sc.spawn.dir) RT.dir = { x: sc.spawn.dir[0], y: sc.spawn.dir[1] }
      RT.cam.x = RT.player.x; RT.cam.y = RT.player.y; RT.cam.zoom = 1; RT.cam.h = 14
      RT.nova.x = RT.player.x - 1; RT.nova.y = RT.player.y; RT.nova.z = 34
      playTheme(L.theme)
      if (!G().visited.includes(level)) useGame.setState({ visited: [...G().visited, level] })
      useGame.setState({ objective: null, levelReady: level })
      sc.init?.()
      setLevelSignal(ac.signal)
      const wait = () => { if (ac.signal.aborted) return; if (!G().loading) { for (const s of sc.scripts) runScript(s, ac.signal) } else requestAnimationFrame(wait) }
      wait()
    })
    return () => {
      dead = true; ac.abort(); setLevelSignal(null)
      st.current.sc?.onExit?.()
      st.current.sc = null; RT.scene = null; st.current.chunks = []
      INTERACTS.clear()
      useGame.setState({ overlays: {}, prompt: null, hudHidden: false })
      resetRT()
    }
  }, [level])

  /* ----- laço principal ----- */
  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')!
    let raf = 0, last = performance.now()
    const resize = () => {
      const dpr = Math.min(3, devicePixelRatio || 1)
      const dw = innerWidth * dpr, dh = innerHeight * dpr
      const pref = G().settings.pixel
      // tamanho do pixel: a tela mostra uns 360 pixels de jogo no lado menor (300 no celular)
      const small = Math.min(innerWidth, innerHeight) < 500
      const target = pref === 'grande' ? 250 : pref === 'pequeno' ? 480 : small ? 300 : 360
      const k = Math.max(1, Math.round(Math.min(dw, dh) / target))
      cv.width = Math.ceil(dw / k); cv.height = Math.ceil(dh / k)
      cv.style.width = (cv.width * k) / dpr + 'px'; cv.style.height = (cv.height * k) / dpr + 'px'
      RT.view = { w: cv.width, h: cv.height, k, dpr }
      ctx.imageSmoothingEnabled = false
    }
    resize()
    addEventListener('resize', resize)
    const unsub = useGame.subscribe((s, p) => { if (s.settings.pixel !== p.settings.pixel) resize() })

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      RT.time += dt
      const sc = st.current.sc
      const W = cv.width, H = cv.height
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
      if (!sc) { ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H); return }
      const g = G()
      const blocked = RT.frozen || !!g.cine || (!!g.dialog && !g.dialog.ambient) || !!g.menu || !!g.loading
      /* --- movimento do NEX --- */
      let mvx = 0, mvy = 0
      const sm = screenMove()
      if (!blocked) {
        if (sm.x || sm.y) {
          RT.path = null; RT.tapUse = null
          const w = screenToWorldDir(sm.x, sm.y), mag = Math.min(1, Math.hypot(sm.x, sm.y))
          mvx = w.x * mag; mvy = w.y * mag
        } else if (RT.path && RT.path.length) {
          const tgt = RT.path[0], dx = tgt[0] - RT.player.x, dy = tgt[1] - RT.player.y, d = Math.hypot(dx, dy)
          if (d < 0.12) { RT.path.shift(); if (!RT.path.length) RT.path = null }
          else { mvx = dx / d; mvy = dy / d }
        }
      } else if (RT.path) { RT.path = null }
      const speed = (wantsRun() ? 5.6 : 3.6) * RT.nexScale ** 0.3
      const moving = mvx || mvy
      if (moving) {
        const bx = RT.player.x, by = RT.player.y
        let step = speed * dt
        if (RT.path && RT.path.length === 1) step = Math.min(step, Math.hypot(RT.path[0][0] - bx, RT.path[0][1] - by))
        moveWithCollision(sc, RT.player, mvx * step, mvy * step)
        const moved = Math.hypot(RT.player.x - bx, RT.player.y - by)
        RT.walkDist += moved
        RT.speed = moved / Math.max(dt, 1e-4)
        if (moved > 1e-4) RT.dir = { x: mvx, y: mvy }
        else if (RT.path) RT.path = null // preso
      } else RT.speed = 0
      if (!fits(sc, RT.player.x, RT.player.y, 0.05)) { /* fora do chão: não deve acontecer */ }
      if (RT.lookAt && (blocked || !moving)) { const dx = RT.lookAt[0] - RT.player.x, dy = RT.lookAt[1] - RT.player.y; if (Math.hypot(dx, dy) > 0.05) RT.dir = { x: dx, y: dy } }
      if (RT.poseT > 0) { RT.poseT -= dt; if (RT.poseT <= 0) RT.pose = 'idle' }
      // chegou ao objeto tocado
      if (RT.tapUse && !RT.path) {
        const it = INTERACTS.get(RT.tapUse); RT.tapUse = null
        if (it && it.enabled() && !blocked && Math.hypot(RT.player.x - it.x, RT.player.y - it.y) < it.r + 0.3) it.use()
      }
      /* --- interação --- */
      const near = blocked ? null : nearestInteract()
      const lbl = near ? labelOf(near) : ''
      if ((g.prompt?.id || '') !== (near?.id || '') || (g.prompt?.label || '') !== lbl) useGame.setState({ prompt: near ? { id: near.id, label: lbl } : null })
      if (INPUT.interact && !(g.dialog && !g.dialog.ambient)) { INPUT.interact = false; if (near && !blocked) near.use() }
      /* --- NOVA --- */
      if (RT.novaOn) {
        const np = RT.novaPos
        const dl = Math.hypot(RT.dir.x, RT.dir.y) || 1, fx = RT.dir.x / dl, fy = RT.dir.y / dl
        const tx = np ? np.x : RT.player.x - fx * 0.8 + fy * 0.8, ty = np ? np.y : RT.player.y - fy * 0.8 - fx * 0.8
        const tz = (np?.z ?? sc.novaZ ?? 30) + Math.sin(RT.time * 2.2) * 2.5
        const k = 1 - Math.exp(-dt * (np ? 4 : 3))
        RT.nova.x += (tx - RT.nova.x) * k; RT.nova.y += (ty - RT.nova.y) * k; RT.nova.z += (tz - RT.nova.z) * k
      }
      sc.update?.(dt, RT.time)
      /* --- câmera --- */
      const cam = RT.cam
      if (g.cine) {
        if (cineRef !== g.cine) { cineRef = g.cine; CAM_FROM.x = cam.x; CAM_FROM.y = cam.y; CAM_FROM.zoom = cam.zoom; CAM_FROM.h = cam.h }
        const c = cineCam(g.cine.shots, (now - g.cine.t0) / 1000)
        cam.x = c.x; cam.y = c.y; cam.zoom = c.zoom; cam.h = c.h
        if (c.done) { const r = g.cine.resolve; useGame.setState({ cine: null }); r() }
      } else {
        cineRef = null
        const f = FOCUS.active
        const tx = f ? FOCUS.x : RT.player.x, ty = f ? FOCUS.y : RT.player.y, tz = f ? FOCUS.zoom : 1, th = f ? FOCUS.h : 14 * RT.nexScale
        const k = 1 - Math.exp(-dt * (f ? 3.2 : 5))
        cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.h += (th - cam.h) * k
        cam.zoom += (tz - cam.zoom) * (1 - Math.exp(-dt * 3.5))
        if (Math.abs(cam.zoom - tz) < 0.015) cam.zoom = tz
      }
      if (cam.shake > 0) cam.shake = Math.max(0, cam.shake - dt * 1.8)
      /* --- partículas --- */
      const ps = RT.particles
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.life -= dt
        if (p.life <= 0) { ps.splice(i, 1); continue }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= (p.g ?? 0) * dt
        if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6 }
      }
      /* --- desenho --- */
      sc.bg(ctx, W, H, RT.time, { x: cam.x, y: cam.y })
      const zoom = cam.zoom
      const c0 = iso(cam.x, cam.y, cam.h)
      const shx = cam.shake ? (Math.random() - 0.5) * cam.shake * 8 : 0, shy = cam.shake ? (Math.random() - 0.5) * cam.shake * 6 : 0
      const ox = Math.round(W / 2 - Math.round(c0.sx) * zoom + shx), oy = Math.round(H / 2 - Math.round(c0.sy) * zoom + shy)
      ctx.setTransform(zoom, 0, 0, zoom, ox, oy)
      // vista visível em pixels do mundo
      const vx0 = -ox / zoom, vy0 = -oy / zoom, vx1 = vx0 + W / zoom, vy1 = vy0 + H / zoom
      for (const ch of st.current.chunks) {
        if (ch.ox > vx1 || ch.ox + ch.w < vx0 || ch.oy > vy1 || ch.oy + ch.h < vy0) continue
        ctx.drawImage(ch.img, ch.ox, ch.oy)
      }
      // cachoeiras de dados caindo das bordas
      if (sc.falls) {
        const D = sc.cliff?.depth ?? 0
        ctx.fillStyle = sc.falls.color
        for (const f of st.current.falls) {
          const P = iso(f.x, f.y), x0 = Math.round(P.sx - f.w / 2), y0 = Math.round(P.sy) + 2
          if (x0 > vx1 || x0 + f.w < vx0 || y0 > vy1 || y0 + D + f.len < vy0) continue
          for (let c = 0; c < f.w; c++) {
            const sp = 22 + ((c * 13 + f.seed) % 9) * 3, off = (RT.time * sp + c * 17 + f.seed * 3) % 9
            for (let yy = -off; yy < D + f.len; yy += 9) {
              if (yy < 0) continue
              const k = 1 - yy / (D + f.len)
              ctx.globalAlpha = Math.max(0, k) * (c === 0 || c === f.w - 1 ? 0.35 : 0.7)
              ctx.fillRect(x0 + c, y0 + Math.round(yy), 1, 4)
            }
          }
        }
        ctx.globalAlpha = 1
      }
      const drawSprite = (s: Sprite, x: number, y: number, a = 1, sc2 = 1, blend?: GlobalCompositeOperation) => {
        if (a <= 0.01) return
        ctx.globalAlpha = Math.min(1, a)
        if (blend) ctx.globalCompositeOperation = blend
        if (sc2 === 1) ctx.drawImage(s.img, Math.round(x - s.ax), Math.round(y - s.ay))
        else { const w = Math.max(1, Math.round(s.img.width * sc2)), h = Math.max(1, Math.round(s.img.height * sc2)); ctx.drawImage(s.img, Math.round(x - s.ax * sc2), Math.round(y - s.ay * sc2), w, h) }
        ctx.globalAlpha = 1
        if (blend) ctx.globalCompositeOperation = 'source-over'
      }
      // coisas do chão
      const list: D[] = [], tops: (() => void)[] = []
      for (const t of sc.things) {
        if (t.hidden?.()) continue
        const ps2 = t.pos ? t.pos() : t
        const s = spriteOf(t); if (!s) continue
        const z = (ps2 as any).z ?? t.z ?? 0
        const w = t.w ?? 0, d = t.d ?? 0
        // ponto de âncora: canto de trás da base (ou os pés)
        const P = iso(ps2.x, ps2.y, z)
        const scl = t.scale ? t.scale() : 1
        const sx0 = P.sx - s.ax * scl, sy0 = P.sy - s.ay * scl, sx1 = sx0 + s.img.width * scl, sy1 = sy0 + s.img.height * scl
        if (sx1 < vx0 || sx0 > vx1 || sy1 < vy0 || sy0 > vy1) continue
        const a = alphaOf(t)
        const draw = () => { if (t.shadow) { const sh = shadow(t.shadow); const g0 = iso(ps2.x + w / 2, ps2.y + d / 2, 0); drawSprite(sh, g0.sx, g0.sy, a * 0.8) } drawSprite(s, P.sx, P.sy, a, scl, t.blend) }
        if (t.layer === 'ground') { draw(); continue }
        if (t.layer === 'top') { tops.push(draw); continue }
        const r = w || d ? 0 : 0.2
        list.push({ x0: ps2.x - r, x1: ps2.x + (w || r), y0: ps2.y - r, y1: ps2.y + (d || r), s0: sx0, s1: sx1, t0: sy0, t1: sy1, draw })
      }
      // o NEX
      if (!RT.nexHidden && RT.nexScale > 0.02) {
        const pose = RT.poseT > 0 ? RT.pose : RT.speed > 0.2 ? 'walk' : 'idle'
        const fr = Math.floor(RT.walkDist / 0.3) % 4
        const s = personSprite('NEX', NEX, RT.dir, fr, pose)
        const P = iso(RT.player.x, RT.player.y, 0), scl = RT.nexScale
        const sh = shadow(5)
        list.push({ x0: RT.player.x - 0.2, x1: RT.player.x + 0.2, y0: RT.player.y - 0.2, y1: RT.player.y + 0.2, s0: P.sx - 12, s1: P.sx + 12, t0: P.sy - 34 * scl, t1: P.sy + 2, draw: () => { drawSprite(sh, P.sx, P.sy, 0.8, Math.max(0.3, scl)); drawSprite(s, P.sx, P.sy, 1, scl) } })
      }
      // a NOVA
      if (RT.novaOn) {
        const blink = (RT.time % 3.7) < 0.12
        const s = novaSprite(blink, RT.novaTalking > 0 && Math.floor(RT.time * 8) % 2 === 0, Math.floor(RT.time * 12))
        const P = iso(RT.nova.x, RT.nova.y, RT.nova.z), G0 = iso(RT.nova.x, RT.nova.y, 0)
        list.push({ x0: RT.nova.x - 0.2, x1: RT.nova.x + 0.2, y0: RT.nova.y - 0.2, y1: RT.nova.y + 0.2, s0: P.sx - 12, s1: P.sx + 12, t0: P.sy - 30, t1: G0.sy + 2, draw: () => { drawSprite(shadow(4), G0.sx, G0.sy, 0.45); drawSprite(s, P.sx, P.sy) } })
      }
      for (const d of depthSort(list)) d.draw()
      for (const f of tops) f()
      // marcador do toque
      if (RT.tapMark) {
        const k = (RT.time - RT.tapMark.t) / 0.6
        if (k > 1 || !RT.path) RT.tapMark = null
        else { const P = iso(RT.tapMark.x, RT.tapMark.y); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1; const r = 6 + k * 4; ctx.beginPath(); ctx.moveTo(P.sx - r, P.sy); ctx.lineTo(P.sx, P.sy - r / 2); ctx.lineTo(P.sx + r, P.sy); ctx.lineTo(P.sx, P.sy + r / 2); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1 }
      }
      // marcadores de interação
      if (!g.cine && !FOCUS.active) for (const it of INTERACTS.values()) {
        if (!it.enabled() || (it.marker && !it.marker())) continue
        const P = iso(it.x, it.y, (it.mz ?? 34) + Math.sin(RT.time * 3 + it.x) * 2.5)
        drawSprite(markerSprite(it.color || '#ffd27a'), P.sx, P.sy)
      }
      // partículas
      for (const p of ps) {
        const P = iso(p.x, p.y, p.z)
        ctx.globalAlpha = Math.min(1, p.life / (p.max * 0.5))
        ctx.fillStyle = p.c
        ctx.fillRect(Math.round(P.sx), Math.round(P.sy), p.s, p.s)
      }
      ctx.globalAlpha = 1
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      sc.post?.(ctx, W, H, RT.time)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); unsub() }
  }, [])

  /* ----- toque / clique no chão ----- */
  const down = useRef({ x: 0, y: 0, t: 0, id: -1 })
  const onDown = (e: React.PointerEvent) => { down.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } }
  const onUp = (e: React.PointerEvent) => {
    const d = down.current
    if (d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 600) return
    const g = G(), sc = RT.scene
    if (!sc || RT.frozen || g.cine || (g.dialog && !g.dialog.ambient) || g.menu || g.loading) return
    const v = RT.view, cam = RT.cam
    const ix = (e.clientX * v.dpr) / v.k, iy = (e.clientY * v.dpr) / v.k
    const c0 = iso(cam.x, cam.y, cam.h)
    const wx = (ix - v.w / 2) / cam.zoom + Math.round(c0.sx), wy = (iy - v.h / 2) / cam.zoom + Math.round(c0.sy)
    // tocou num objeto (marcador ou base)?
    let pick: Interact | null = null, bd = 1e9
    for (const it of INTERACTS.values()) {
      if (!it.enabled()) continue
      const M = iso(it.x, it.y, it.mz ?? 34), B = iso(it.x, it.y, 0)
      const dm = Math.hypot(wx - M.sx, wy - M.sy), db = Math.hypot(wx - B.sx, (wy - B.sy) * 2)
      const dd = Math.min(dm, db)
      if (dd < 18 && dd < bd) { bd = dd; pick = it }
    }
    const w = unIso(wx, wy)
    const to: [number, number] = pick ? [pick.x, pick.y] : [w.x, w.y]
    if (pick && Math.hypot(RT.player.x - pick.x, RT.player.y - pick.y) < pick.r) { pick.use(); return }
    const path = findPath(sc, [RT.player.x, RT.player.y], to)
    if (!path) return
    if (pick) {
      // para um pouco antes do objeto (dentro do alcance)
      while (path.length > 1 && Math.hypot(path[path.length - 2][0] - pick.x, path[path.length - 2][1] - pick.y) < pick.r * 0.7) path.pop()
    }
    RT.path = path; RT.tapUse = pick ? pick.id : null
    const end = path[path.length - 1]
    RT.tapMark = { x: end[0], y: end[1], t: RT.time }
  }
  return <canvas ref={ref} className="pixcv" onPointerDown={onDown} onPointerUp={onUp} />
}
