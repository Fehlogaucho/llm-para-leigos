import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { G, IS_TOUCH, useGame } from '../store'
import { INPUT } from '../engine/input'
import { INTERACTS, RT } from '../engine/runtime'
import { VOICE } from '../engine/voice'
import { SFX } from '../engine/audio'
import { skipCine } from '../engine/CameraRig'
import { Ico } from './Icons'
import { LEVELS } from '../levels/registry'
import { CAT_INFO } from '../content/codex'

export function TopBar() {
  const obj = useGame((s) => s.objective)
  const level = useGame((s) => s.level)
  const voice = useGame((s) => s.settings.voice)
  const hidden = useGame((s) => !!s.cine || s.hudHidden)
  const [col, setCol] = useState(false)
  const L = LEVELS[level]
  useEffect(() => setCol(false), [obj?.text])
  if (hidden) return null
  const toggleVoice = () => {
    const on = !G().settings.voice
    useGame.setState({ settings: { ...G().settings, voice: on } })
    if (!on) { VOICE.stop(); G().showToast('Leitura em voz alta desligada') } else { VOICE.speak('Voz ligada!', 'NOVA'); G().showToast('Leitura em voz alta ligada') }
  }
  const open = (m: any) => { SFX.play('click'); useGame.setState({ menu: m }) }
  return (
    <div className="hud-top">
      {L && (
        <button className={'obj' + (col ? ' collapsed' : '')} onClick={() => setCol(!col)} aria-label="Objetivo atual">
          <span className="badge">{L.badge}</span>
          <span className="col" style={{ textAlign: 'left' }}>
            <div className="area">{L.short}</div>
            <div className="txt">{obj?.text || 'Explore'}</div>
          </span>
        </button>
      )}
      <div className="hud-right">
        {VOICE.ok && <button className="icon-btn" aria-pressed={voice} aria-label={voice ? 'Leitura em voz alta ligada. Toque para desligar' : 'Leitura em voz alta desligada. Toque para ligar'} onClick={toggleVoice}>{voice ? Ico.voiceOn : Ico.voiceOff}</button>}
        <button className="icon-btn" aria-label="Codex" onClick={() => open('codex')}>{Ico.book}<CodexDot /></button>
        <button className="icon-btn" aria-label="Mapa" onClick={() => open('map')}>{Ico.map}</button>
        <button className="icon-btn" aria-label="Menu" onClick={() => open('settings')}>{Ico.menu}</button>
      </div>
    </div>
  )
}

function CodexDot() {
  const n = useGame((s) => Object.keys(s.codex).length)
  const [seen, setSeen] = useState(n)
  const menu = useGame((s) => s.menu)
  useEffect(() => { if (menu === 'codex') setSeen(n) }, [menu, n])
  return n > seen ? <span className="dot" /> : null
}

export function Prompt() {
  const p = useGame((s) => s.prompt)
  const blocked = useGame((s) => !!s.dialog && !s.dialog.ambient || !!s.cine || s.focus || !!s.menu)
  if (!p || blocked) return null
  const use = () => { const it = INTERACTS.get(p.id); if (it && it.enabled) it.use() }
  if (!IS_TOUCH) return (
    <div className="prompt desk"><kbd>E</kbd><span className="lbl" style={{ cursor: 'pointer' }} onClick={use}>{p.label}</span></div>
  )
  return (
    <div className="prompt">
      <span className="lbl">{p.label}</span>
      <button onClick={use} aria-label={p.label}>Usar</button>
    </div>
  )
}

export function Joystick() {
  const blocked = useGame((s) => !!s.cine || s.focus || !!s.menu || (!!s.dialog && !s.dialog.ambient))
  const base = useRef<HTMLDivElement>(null!)
  const knob = useRef<HTMLDivElement>(null!)
  const [used, setUsed] = useState(false)
  useEffect(() => {
    if (blocked) { INPUT.joyActive = false; INPUT.joy.set(0, 0); if (knob.current) knob.current.style.transform = '' }
  }, [blocked])
  if (!IS_TOUCH || blocked) return null
  let id = -1
  const R = 50
  const upd = (e: React.PointerEvent) => {
    const r = base.current.getBoundingClientRect()
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2)
    const l = Math.hypot(x, y); if (l > R) { x *= R / l; y *= R / l }
    knob.current.style.transform = `translate(${x}px, ${y}px)`
    INPUT.joy.set(x / R, -y / R); INPUT.joyActive = true
  }
  return (
    <div className="joy" ref={base}
      onPointerDown={(e) => { id = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); upd(e); setUsed(true); INPUT.tapTarget = null }}
      onPointerMove={(e) => { if (INPUT.joyActive) upd(e) }}
      onPointerUp={() => { INPUT.joyActive = false; INPUT.joy.set(0, 0); knob.current.style.transform = '' }}
      onPointerCancel={() => { INPUT.joyActive = false; INPUT.joy.set(0, 0); knob.current.style.transform = '' }}>
      <div className="knob" ref={knob} />
      {!used && <div className="hint">arraste para andar</div>}
    </div>
  )
}

/** Seta na borda da tela apontando para o objetivo quando ele está fora da vista. */
export function ObjectiveArrow() {
  const el = useRef<HTMLDivElement>(null!)
  const dist = useRef<HTMLSpanElement>(null!)
  useEffect(() => {
    let raf = 0
    const v = new THREE.Vector3()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const g = G(), t = g.objective?.target, cam = RT.camera
      const e = el.current
      if (!e) return
      if (!t || !cam || g.cine || g.focus || g.menu) { e.style.display = 'none'; return }
      const d = Math.hypot(t[0] - RT.player.x, t[2] - RT.player.z)
      if (d < 4) { e.style.display = 'none'; return }
      v.set(t[0], t[1] + 1, t[2]).project(cam)
      const behind = v.z > 1
      const W = innerWidth, H = innerHeight
      let x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H
      if (behind) { x = W - x; y = H - y }
      const m = 56
      const on = !behind && x > m && x < W - m && y > m + 40 && y < H - m - 120
      if (on) { e.style.display = 'block'; e.style.left = x + 'px'; e.style.top = (y - 30) + 'px'; e.style.transform = 'rotate(180deg)'; e.style.opacity = '0.85' }
      else {
        const cx = W / 2, cy = H / 2
        let dx = x - cx, dy = y - cy
        if (behind && Math.abs(dx) < 1 && Math.abs(dy) < 1) dy = 1
        const k = Math.min((W / 2 - m) / Math.abs(dx || 1e-6), (H / 2 - m - 50) / Math.abs(dy || 1e-6))
        x = cx + dx * k; y = cy + dy * k
        e.style.display = 'block'; e.style.left = x + 'px'; e.style.top = y + 'px'
        e.style.transform = `rotate(${Math.atan2(dy, dx) + Math.PI / 2}rad)`; e.style.opacity = '1'
      }
      if (dist.current) dist.current.textContent = Math.round(d) + ' m'
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div className="arrow" ref={el}>{Ico.arrow}<span ref={dist} /></div>
}

export function Banners() {
  const b = useGame((s) => s.banners[0])
  useEffect(() => {
    if (!b) return
    const id = setTimeout(() => G().shiftBanner(), b.kind === 'area' ? 3800 : 3400)
    return () => clearTimeout(id)
  }, [b])
  if (!b) return null
  const K: Record<string, string> = { discovery: 'CONCEITO DESCOBERTO', fragment: 'FRAGMENTO', core: 'NÚCLEO RECUPERADO', quest: 'SIDE QUEST', area: '' }
  const cat = b.cat ? CAT_INFO[b.cat] : null
  return (
    <div className={'banner ' + b.kind} key={b.title + b.kind} style={cat ? { borderColor: cat.color, boxShadow: `0 0 40px ${cat.color}55` } : undefined}>
      <div className="k" style={cat ? { color: cat.color } : undefined}>{b.kind === 'area' ? b.sub?.split('|')[0] : K[b.kind]}{cat ? ` · ${cat.label.toUpperCase()}` : ''}</div>
      <div className="t">{b.title}</div>
      {b.sub && <div className="s">{b.kind === 'area' ? b.sub.split('|')[1] : b.sub}</div>}
      {b.kind === 'discovery' && <div className="s" style={{ fontSize: 12, marginTop: 4, color: 'var(--gold)' }}>Codex atualizado</div>}
    </div>
  )
}

export function Toast() {
  const t = useGame((s) => s.toast)
  return t ? <div className="toast">{t}</div> : null
}

export function CinemaBars() {
  const c = useGame((s) => s.cine)
  if (!c) return null
  return (
    <div className="bars" style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} onClick={() => c.skippable && skipCine()}>
      {c.skippable && <button className="skip" onClick={(e) => { e.stopPropagation(); skipCine() }}>Pular ▸▸</button>}
    </div>
  )
}

export function Overlays() {
  const o = useGame((s) => s.overlays)
  return <>{Object.entries(o).map(([k, n]) => <div key={k} style={{ display: 'contents' }}>{n}</div>)}</>
}
