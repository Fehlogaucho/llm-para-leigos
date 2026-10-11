import { useEffect, useMemo, useRef, useState } from 'react'
import { G, useGame, type Cat } from '../store'
import { CODEX_LIST, CAT_INFO, type CodexEntry } from '../content/codex'
import { LEVELS, LEVEL_ORDER, PHASES } from '../levels/registry'
import { gotoLevel } from '../engine/script'
import { SFX } from '../engine/audio'
import { VOICE } from '../engine/voice'
import { Ico } from './Icons'
import { CHAPTERS, jumpTo, missionDone } from '../levels/chapters'

export function Menus() {
  const m = useGame((s) => s.menu)
  if (!m) return null
  const close = () => { SFX.play('click'); useGame.setState({ menu: null }) }
  return (
    <div className="modal" onClick={close}>
      <div className="sheet" style={m === 'chapters' ? { maxWidth: 640 } : undefined} onClick={(e) => e.stopPropagation()}>
        {m === 'codex' && <Codex close={close} />}
        {m === 'map' && <MapView close={close} />}
        {m === 'settings' && <Settings close={close} />}
        {m === 'chapters' && <Chapters close={close} />}
      </div>
    </div>
  )
}

const LEVEL_NAMES = ['', 'Descoberto', 'Experimentado', 'Compreendido', 'Dominado']

function Codex({ close }: { close: () => void }) {
  const codex = useGame((s) => s.codex)
  const [tab, setTab] = useState<'all' | Cat | 'mapa'>('all')
  const found = CODEX_LIST.filter((e) => codex[e.id])
  const [sel, setSel] = useState<string | null>(found[found.length - 1]?.id || null)
  const list = CODEX_LIST.filter((e) => (!e.old || codex[e.id]) && (tab === 'all' || tab === 'mapa' || e.cat === tab) && e.phase <= Math.max(1, maxPhase()))
  const e = sel ? CODEX_LIST.find((x) => x.id === sel) : null
  return (
    <>
      <div className="head"><h2>Codex da Language Engine</h2><button className="icon-btn close" onClick={close} aria-label="Fechar">{Ico.close}</button></div>
      <div className="tabs">
        <button className={'tab' + (tab === 'all' ? ' on' : '')} onClick={() => setTab('all')}>Tudo · {found.length}</button>
        {(Object.keys(CAT_INFO) as Cat[]).map((c) => <button key={c} className={'tab' + (tab === c ? ' on' : '')} onClick={() => setTab(c)} style={{ color: tab === c ? undefined : CAT_INFO[c].color }}>{CAT_INFO[c].icon} {CAT_INFO[c].label}</button>)}
        <button className={'tab' + (tab === 'mapa' ? ' on' : '')} onClick={() => setTab('mapa')}>Mapa de conceitos</button>
      </div>
      {tab === 'mapa' ? <ConceptMap codex={codex} onPick={(id) => { setSel(id); setTab('all') }} /> : (
        <div className="cx-grid">
          <div className="cx-list">
            {list.map((x) => {
              const lv = codex[x.id] || 0
              return (
                <button key={x.id} className={'cx-item' + (sel === x.id ? ' on' : '') + (lv ? '' : ' locked')} onClick={() => lv && setSel(x.id)} disabled={!lv}>
                  <span className="ic" style={{ background: CAT_INFO[x.cat].color }} />
                  <span><div className="nm">{lv ? x.title : '???'}</div><div className="ar">{x.area}</div></span>
                </button>
              )
            })}
          </div>
          <div className="cx-detail">
            {e && codex[e.id] ? <Entry e={e} lv={codex[e.id]} /> : <p style={{ color: 'var(--muted)' }}>Explore o mundo para descobrir conceitos. Cada descoberta aparece aqui, com uma explicação simples e, às vezes, uma camada técnica.</p>}
          </div>
        </div>
      )}
    </>
  )
}

function maxPhase() { const g = G(); let m = 0; for (const id of g.visited) { const L = LEVELS[id]; if (L) m = Math.max(m, L.phase) } return m }

function Entry({ e, lv }: { e: CodexEntry; lv: number }) {
  const [deep, setDeep] = useState(false)
  const c = CAT_INFO[e.cat]
  return (
    <>
      <div className="catl" style={{ color: c.color }}>{c.icon} {c.label} · {e.area}</div>
      <h3>{e.title}</h3>
      <div className="mastery">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= lv ? 'on' : ''} />)} <span>{LEVEL_NAMES[lv]}</span></div>
      <p>{e.simple}</p>
      {e.example && <pre>{e.example}</pre>}
      {e.tech && (deep ? <div className="tech"><b>Por dentro:</b> {e.tech}</div> : <button className="btn small" onClick={() => { setDeep(true); G().discover(e.id, Math.max(lv, 4)) }}>Quer ver por dentro? ▸</button>)}
      {e.links && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Ligado a: {e.links.map((l) => CODEX_LIST.find((x) => x.id === l)?.title).filter(Boolean).join(' · ')}</p>}
      <button className="btn small ghost" onClick={() => VOICE.speak(`${e.title}. ${e.simple}`, 'NOVA')}>Ouvir</button>
    </>
  )
}

function ConceptMap({ codex, onPick }: { codex: Record<string, number>; onPick: (id: string) => void }) {
  const nodes = useMemo(() => {
    const byArea: Record<string, CodexEntry[]> = {}
    CODEX_LIST.filter((e) => e.phase >= 1 && (!e.old || codex[e.id])).forEach((e) => { (byArea[e.phase + '|' + e.area] ||= []).push(e) })
    // áreas com muitos verbetes viram várias colunas (até 6 por coluna)
    const cols: CodexEntry[][] = []
    for (const k of Object.keys(byArea)) for (let i = 0; i < byArea[k].length; i += 6) cols.push(byArea[k].slice(i, i + 6))
    const pos: Record<string, { x: number; y: number; e: CodexEntry }> = {}
    cols.forEach((col, ci) => col.forEach((e, ri) => { pos[e.id] = { x: 60 + ci * 120, y: 60 + ri * 64 + (ci % 2) * 26, e } }))
    return { pos, w: 60 + cols.length * 120, h: 60 + Math.max(1, ...cols.map((c) => c.length)) * 64 + 40, cols }
  }, [])
  return (
    <div style={{ overflow: 'auto', maxHeight: '64vh', borderRadius: 14, background: '#070b16', border: '1px solid rgba(255,255,255,.08)' }}>
      <svg width={nodes.w} height={nodes.h} style={{ display: 'block' }}>
        {Object.values(nodes.pos).flatMap(({ x, y, e }) => (e.links || []).map((l) => {
          const t = nodes.pos[l]; if (!t) return null
          const on = codex[e.id] && codex[l]
          return <line key={e.id + l} x1={x} y1={y} x2={t.x} y2={t.y} stroke={on ? '#e8b65a' : 'rgba(255,255,255,.08)'} strokeWidth={on ? 2 : 1} />
        }))}
        {Object.values(nodes.pos).map(({ x, y, e }) => {
          const on = !!codex[e.id]
          return (
            <g key={e.id} transform={`translate(${x},${y})`} style={{ cursor: on ? 'pointer' : 'default' }} onClick={() => on && onPick(e.id)}>
              <circle r={on ? 13 : 8} fill={on ? CAT_INFO[e.cat].color : '#1a2238'} stroke={on ? '#fff' : 'rgba(255,255,255,.15)'} strokeWidth={on ? 2 : 1} style={on ? { filter: `drop-shadow(0 0 6px ${CAT_INFO[e.cat].color})` } : undefined} />
              <text y={28} textAnchor="middle" fill={on ? '#f4ecdc' : 'rgba(255,255,255,.25)'} fontSize={11} fontWeight={800} fontFamily="Nunito">{on ? e.title : '???'}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function MapView({ close }: { close: () => void }) {
  const g = useGame()
  const coresAll = PHASES.filter((p) => p.core).map((p) => p.core!)
  return (
    <>
      <div className="head"><h2>Mapa da jornada</h2><button className="icon-btn close" onClick={close} aria-label="Fechar">{Ico.close}</button></div>
      <button className="btn primary small" style={{ marginBottom: 12 }} onClick={() => { SFX.play('click'); useGame.setState({ menu: 'chapters' }) }}>Escolher capítulo ou missão ▸</button>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.1em' }}>NÚCLEOS DA LANGUAGE ENGINE</div>
      <div className="cores">{coresAll.map((c) => <span key={c} className={'core-chip' + (g.cores.includes(c) ? ' on' : '')}>{c} CORE</span>)}</div>
      <div className="map-phases">
        {PHASES.map((p) => {
          const lv = LEVEL_ORDER.filter((id) => LEVELS[id].phase === p.n)
          const open = lv.some((id) => g.visited.includes(id))
          return (
            <div key={p.n} className={'map-ph' + (open ? '' : ' locked')}>
              <h3>{p.name} · {p.title}</h3>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 8 }}>{p.desc}</div>
              {lv.length > 0 && (
                <div className="map-areas">
                  {lv.map((id) => {
                    const L = LEVELS[id]
                    const vis = g.visited.includes(id)
                    const qs = L.quests || []
                    const done = qs.filter((q) => g.quests[q.id] === 'done').length
                    return (
                      <button key={id} className={'map-area' + (g.level === id ? ' cur' : '')} disabled={!vis || g.level === id} onClick={() => { close(); gotoLevel(id) }}>
                        <div className="n">{L.badge} · {L.title}</div>
                        <div className="q">{L.sub}{qs.length ? ` · side quests ${done}/${qs.length}` : ''}</div>
                        {g.level === id && <div className="q" style={{ color: 'var(--cyan)' }}>Você está aqui</div>}
                      </button>
                    )
                  })}
                </div>
              )}
              {lv.length === 0 && <div className="q" style={{ fontSize: 13, color: 'var(--muted)' }}>Em breve.</div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Settings({ close }: { close: () => void }) {
  const s = useGame((x) => x.settings)
  const set = (p: Partial<typeof s>) => useGame.setState({ settings: { ...s, ...p } })
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <div className="head"><h2>Menu</h2><button className="icon-btn close" onClick={close} aria-label="Fechar">{Ico.close}</button></div>
      <div className="set-row"><label>Leitura em voz alta</label><div className="seg"><button className={s.voice ? 'on' : ''} onClick={() => set({ voice: true })}>Ligada</button><button className={!s.voice ? 'on' : ''} onClick={() => { set({ voice: false }); VOICE.stop() }}>Desligada</button></div></div>
      <div className="set-row"><label>Música</label><input type="range" min={0} max={1} step={0.05} value={s.music} onChange={(e) => set({ music: +e.target.value })} /></div>
      <div className="set-row"><label>Efeitos</label><input type="range" min={0} max={1} step={0.05} value={s.sfx} onChange={(e) => set({ sfx: +e.target.value })} /></div>
      <div className="set-row"><label>Tamanho dos pixels</label><div className="seg">{(['grande', 'auto', 'pequeno'] as const).map((q) => <button key={q} className={s.pixel === q ? 'on' : ''} onClick={() => set({ pixel: q })}>{q === 'auto' ? 'Normal' : q === 'grande' ? 'Grandes' : 'Pequenos'}</button>)}</div></div>
      <div className="set-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <label>Como jogar</label>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
          Celular: arraste o círculo para andar ou toque no chão onde quer ir; toque nos objetos com losango para usar.<br />
          Computador: WASD ou setas para andar, Shift para correr, E para usar, clique no chão para ir até lá.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <button className="btn primary" onClick={() => { SFX.play('click'); useGame.setState({ menu: 'chapters' }) }}>Capítulos e missões</button>
        <button className="btn" onClick={() => { close(); useGame.setState({ screen: 'title' }) }}>Tela inicial</button>
        <a className="btn ghost" href="/3d/" style={{ textDecoration: 'none' }}>Versão 3D</a>
        <a className="btn ghost" href="/classico/" style={{ textDecoration: 'none' }}>Versão clássica</a>
        {!confirm ? <button className="btn ghost" onClick={() => setConfirm(true)}>Recomeçar do zero</button> : <button className="btn" style={{ borderColor: '#ff7a7a' }} onClick={() => { G().resetProgress(); close(); useGame.setState({ screen: 'title' }) }}>Apagar progresso? Toque para confirmar</button>}
      </div>
    </>
  )
}

/* ---------- capítulos e missões: ir direto para onde quiser ---------- */
export function Chapters({ close }: { close: () => void }) {
  const flags = useGame((s) => s.flags)
  const level = useGame((s) => s.level)
  const inGame = useGame((s) => s.screen === 'game')
  const [open, setOpen] = useState(() => {
    const i = CHAPTERS.findIndex((c) => c.level === G().level)
    if (i >= 0) return i
    const j = CHAPTERS.findIndex((c, ci) => c.missions.some((_, k) => !missionDone(ci, k, G().flags)))
    return j >= 0 ? j : 0
  })
  const [sel, setSel] = useState<[number, number] | null>(null)
  const go = (ci: number, mi: number) => { close(); jumpTo(ci, mi) }
  const box = useRef<HTMLDivElement>(null)
  // abre já mostrando o capítulo atual
  useEffect(() => { const el = box.current?.querySelector('.chap.open'); if (el && open > 1) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30) }, [])
  return (
    <>
      <div className="head"><h2>Capítulos</h2><button className="icon-btn close" onClick={close} aria-label="Fechar">{Ico.close}</button></div>
      <p className="chap-lead">Escolha um capítulo e a missão onde quer jogar. As missões antes dela contam como feitas; dali em diante, aquele capítulo recomeça.</p>
      <div className="chaps" ref={box}>
        {PHASES.map((ph) => {
          const chs = CHAPTERS.map((c, i) => ({ c, i })).filter((x) => x.c.phase === ph.n)
          if (!chs.length) return null
          return (
            <div key={ph.n} className="chap-ph">
              <div className="chap-phh"><b>{ph.name}</b> · {ph.title}</div>
              {chs.map(({ c, i }) => {
                const n = c.missions.filter((_, k) => missionDone(i, k, flags)).length
                const isOpen = open === i
                return (
                  <div key={c.level} className={'chap' + (isOpen ? ' open' : '')}>
                    <button className="chap-h" aria-expanded={isOpen} onClick={() => { SFX.play('click'); setOpen(isOpen ? -1 : i) }}>
                      <span className="t">{c.title}</span>
                      {inGame && level === c.level && <span className="here">você está aqui</span>}
                      <span className="n">{n}/{c.missions.length}</span>
                      <span className="ar" aria-hidden>{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <div className="chap-ms">
                        {c.missions.map((m, k) => {
                          const d = missionDone(i, k, flags), on = !!sel && sel[0] === i && sel[1] === k
                          return (
                            <button key={k} className={'chap-m' + (d ? ' done' : '') + (on ? ' sel' : '')} onClick={() => { if (on) go(i, k); else { SFX.play('click'); setSel([i, k]) } }}>
                              <span className="i" style={m.color ? { borderColor: m.color, color: d ? undefined : m.color } : undefined}>{d ? '✓' : k === 0 ? '▸' : k === c.missions.length - 1 ? '★' : k}</span>
                              <span className="tx"><span className="l">{m.label}</span><span className="s">{m.sub}</span></span>
                              {on && <span className="go">Jogar ▸</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {sel && (
        <div className="chap-go">
          <span>Ir para <b>{CHAPTERS[sel[0]].missions[sel[1]].label}</b></span>
          <button className="btn primary" onClick={() => go(sel[0], sel[1])}>Jogar agora ▸</button>
        </div>
      )}
    </>
  )
}
