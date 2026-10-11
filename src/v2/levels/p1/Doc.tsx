import { METRICS, useActivity } from '../../engine/metrics'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { G, useGame } from '../../store'
import { VOICE } from '../../engine/voice'
import { SFX } from '../../engine/audio'
import { RT } from '../../engine/runtime'
import { Ico } from '../../ui/Icons'
import { QUICK, type Ctx } from '../../engine/script'
import { PEOPLE, STOPS, PIPELINE, WORD_WHO, type Doc, type Ask, type Game } from '../../content/stops'
import { PersonFace, PersonAvatar } from './faces'
import { PhotoModal } from './Photo'
import { PHOTOS } from '../../content/photos'
import { GAMES } from './Games'

/* =========================================================
   Interface da Linha do Tempo: documento ilustrado, pergunta,
   brincadeira, o caminho “O céu é ___” e a faixa de memórias.
   ========================================================= */
export const OV = 'l1panel'
const hasEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s)

/** Documento em papel: páginas com ilustração, título e texto. */
export function DocView({ doc, onDone }: { doc: Doc; onDone: () => void }) {
  useActivity('doc:' + doc.title)
  const [i, setI] = useState(0)
  const pg = doc.pages[i]
  const P = doc.who ? PEOPLE[doc.who] : null
  const last = i === doc.pages.length - 1
  const st = useRef({ i, last })
  st.current = { i, last }
  useEffect(() => { VOICE.speak(`${pg.h}. ${pg.t}`, doc.who || 'NOVA') }, [i])
  useEffect(() => () => VOICE.stop(), [])
  const next = () => { SFX.play('click'); if (st.current.last) { VOICE.stop(); onDone() } else setI(st.current.i + 1) }
  const prev = () => { if (st.current.i > 0) { SFX.play('click'); setI(st.current.i - 1) } }
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.repeat) return; if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') next(); else if (e.key === 'ArrowLeft') prev(); else if (e.key === 'Escape') { VOICE.stop(); onDone() } }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="doc" role="dialog" aria-label={doc.title}>
        <button className="icon-btn x" onClick={() => { VOICE.stop(); onDone() }} aria-label="Fechar">{Ico.close}</button>
        <div className="meta">{doc.year} · {doc.place}</div>
        <h2>{doc.title}</h2>
        {P && (
          <div className="author">
            <span className="pf"><PersonAvatar who={doc.who!} /></span>
            <span><div className="nm">{P.name}</div><div className="rl">escreveu este documento</div></span>
          </div>
        )}
        {pg.ill && <div className={'ill' + (hasEmoji(pg.ill) && pg.ill.length < 26 ? '' : ' sm')}>{pg.ill}</div>}
        <h3>{pg.h}</h3>
        <p>{pg.t}</p>
        {pg.h === 'E na LLM?' && <span className="tag">IDEIA QUE A LLM USA</span>}
        {last && doc.note && <div className="doc-note"><b>🔍 O jogo simplificou</b>{doc.note}</div>}
        {last && doc.src && <div className="doc-src"><b>📚 Fontes:</b> {doc.src}</div>}
        {i === 0 && doc.pages.length > 1 && <div className="doc-skip">Pode fechar quando quiser: o documento fica guardado para reler depois.</div>}
        <div className="nav">
          <div className="dots">{doc.pages.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
          {i > 0 && <button className="btn small" onClick={prev}>◂ Voltar</button>}
          <button className={'btn small primary'} onClick={next}>{last ? 'Entendi!' : 'Continuar ▸'}</button>
        </div>
      </div>
    </div>
  )
}

function WhoChip({ who }: { who?: string }) {
  const P = who ? PEOPLE[who] : null
  if (!P) return null
  return <div className="who-chip"><span className="pf"><PersonAvatar who={who!} /></span><span style={{ color: P.color }}>{P.name}</span></div>
}

/** Pergunta de múltipla escolha: errar mostra uma dica, acertar explica. */
function AskView({ ask, who, onDone }: { ask: Ask; who: string; onDone: () => void }) {
  const aid = 'p1:pergunta:' + who
  useActivity(aid)
  const [tried, setTried] = useState<number[]>([])
  const [ok, setOk] = useState(false)
  const [sh, setSh] = useState(false)
  useEffect(() => { VOICE.speak(ask.q, who) }, [])
  const pick = (k: number) => {
    if (ok || tried.includes(k)) return
    if (k === ask.a) { setOk(true); SFX.play('success'); VOICE.speak(ask.why, who); METRICS.done(aid) }
    else { if (tried.length >= 1 && ask.hint) METRICS.hint(); setTried((t) => [...t, k]); SFX.play('error'); setSh(false); requestAnimationFrame(() => setSh(true)) }
  }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <WhoChip who={who} />
        <h4>{ask.q}</h4>
        <div className={sh ? 'shake' : ''} style={{ marginTop: 10 }}>
          {ask.opts.map((o, k) => <button key={k} className={'opt' + (ok && k === ask.a ? ' right' : '') + (tried.includes(k) ? ' wrong' : '')} onClick={() => pick(k)}>{ok && k === ask.a ? '✓ ' : tried.includes(k) ? '✗ ' : ''}{o}</button>)}
        </div>
        {!ok && tried.length > 0 && <div className="bad">{tried.length === 1 || !ask.hint ? 'Quase! Pense de novo.' : '💡 Dica: ' + ask.hint}</div>}
        {ok && <div className="ok">{ask.why}</div>}
        {ok && <div className="foot"><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Continuar ▸</button></div>}
      </div>
    </div>
  )
}

/** Moldura de uma brincadeira. */
function GameView({ game, who, onDone }: { game: Game; who: string; onDone: () => void }) {
  const [msg, setMsg] = useState<ReactNode>(null)
  const okRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (msg) setTimeout(() => okRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60) }, [msg])
  const G1 = GAMES[game]
  useActivity('p1:' + game)
  const win = (m: ReactNode) => { if (!msg) { setMsg(m); SFX.play('discover'); METRICS.done('p1:' + game) } }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <WhoChip who={who} />
        <h4>{G1.title}</h4>
        {G1.C({ win, won: !!msg })}
        {msg && <div className="ok">{msg}</div>}
        {msg && <div className="foot" ref={okRef}><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Continuar ▸</button></div>}
      </div>
    </div>
  )
}

/** Mostra um painel e espera fechar (cancelado se o jogador sair da fase). */
export async function show(c: Ctx, make: (done: () => void) => ReactNode) {
  let done = false
  G().setOverlay(OV, make(() => { done = true }))
  try { await c.until(() => done) } finally { G().setOverlay(OV, null) }
}
export const openDoc = (c: Ctx, doc: Doc) => show(c, (d) => <DocView doc={doc} onDone={d} />)
export const openAsk = (c: Ctx, ask: Ask, who: string) => show(c, (d) => <AskView ask={ask} who={who} onDone={d} />)
export const openGame = (c: Ctx, game: Game, who: string) => show(c, (d) => <GameView game={game} who={who} onDone={d} />)
export const openPipeline = (c: Ctx) => show(c, (d) => <PipelineView onDone={d} />)
export const openMatch = (c: Ctx) => show(c, (d) => <MatchView onDone={d} />)

/** Abre um documento fora de um roteiro (reler pela faixa de memórias). */
export function readAgain(doc: Doc, after?: () => void) {
  const wasFrozen = RT.frozen
  RT.frozen = true
  G().setOverlay(OV, <DocView doc={doc} onDone={() => { G().setOverlay(OV, null); RT.frozen = wasFrozen; after?.() }} />)
}

/** Documento extra (opcional): conta como side quest e pode abrir um verbete do Codex. */
export const extraQuest = (id: string) => 'qx_' + id
export function readExtra(id: string, after?: () => void) {
  const s = STOPS.find((x) => x.id === id)
  if (!s?.extra) return
  readAgain(s.extra, () => {
    QUICK.quest(extraQuest(s.id), 'done', s.extra!.title)
    if (s.extraCodex) QUICK.discover(s.extraCodex)
    after?.()
  })
}

/* ---------- final: “O céu é ___” por dentro da Engine ---------- */
function WordChip({ w }: { w: string }) {
  const who = WORD_WHO[w], col = who ? PEOPLE[who].color : '#59d7ff'
  return <span className="chip" style={{ color: col }}>{w}</span>
}
function PipelineView({ onDone }: { onDone: () => void }) {
  useActivity('p1:caminho')
  const [k, setK] = useState(0)
  const p = PIPELINE[k]
  const last = k === PIPELINE.length - 1
  useEffect(() => { VOICE.speak(p.t, 'ENGINE') }, [k])
  useEffect(() => () => VOICE.stop(), [])
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <div className="who-chip"><span style={{ color: '#8fe9ff' }}>DENTRO DA LANGUAGE ENGINE · PASSO {k + 1} DE {PIPELINE.length}</span></div>
        <h4>Como eu escrevo “O céu é ___”</h4>
        <div style={{ display: 'flex', gap: 4, margin: '6px 0 12px' }}>{PIPELINE.map((_, i) => <i key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= k ? 'var(--cyan)' : 'rgba(255,255,255,.12)' }} />)}</div>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 6, marginBottom: 10 }}>{p.words.map((w) => <WordChip key={w} w={w} />)}</div>
        <div className="card mono" style={{ fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 800, textAlign: 'center', color: last ? 'var(--gold-2)' : 'var(--cyan)', padding: '16px 10px' }} key={k}>{p.show}</div>
        <p className="lead" style={{ marginTop: 12 }}>{p.t}</p>
        {last && <div className="simp">🔍 Versão simplificada: faltam peças importantes, como a atenção, que você vai conhecer na Fase 2. E os números daqui são só ilustrações.</div>}
        <div className="foot">
          {k > 0 && <button className="btn small" onClick={() => { SFX.play('click'); setK(k - 1) }}>◂ Voltar</button>}
          <button className="btn primary" onClick={() => { SFX.play('click'); if (last) { VOICE.stop(); onDone() } else setK(k + 1) }}>{last ? 'Entendi!' : 'Próximo passo ▸'}</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- desafio do final: ligue cada ideia antiga ao que ela faz na LLM ---------- */
const PAIRS = [
  { w: 'FICHAS', d: 'Cortar o texto em pedaços e trocar cada um por um número', hint: 'Lembre do pastor de Uruk: uma fichinha no lugar de cada ovelha.' },
  { w: 'CHANCES', d: 'Dar uma chance para cada palavra que pode vir depois', hint: 'Lembre do Pascal: não dá para saber o próximo lance, mas dá para calcular as chances.' },
  { w: 'MENOR ERRO', d: 'No treino, ajustar os números até errar menos', hint: 'Lembre do Gauss e de Ceres: ele ficou com o caminho que errava menos.' },
  { w: 'PESOS', d: 'Os números que a LLM aprende e guarda', hint: 'Lembre do Perceptron: cada pista tinha um número que dizia quanto ela valia.' },
  { w: 'PRÓXIMA PALAVRA', d: 'O trabalho de toda LLM: prever o que vem depois', hint: 'Lembre do Markov contando letras: o que veio antes ajuda a prever o que vem depois.' },
]
const MIX = [3, 0, 4, 1, 2]
function MatchView({ onDone }: { onDone: () => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const [ok, setOk] = useState<number[]>([])
  const [msg, setMsg] = useState('')
  const [sh, setSh] = useState(false)
  const all = ok.length === PAIRS.length
  useActivity('p1:ligar')
  useEffect(() => { if (all) METRICS.done('p1:ligar') }, [all])
  useEffect(() => { VOICE.speak('Ligue cada ideia antiga ao que ela faz dentro de uma LLM.', 'NOVA') }, [])
  useEffect(() => () => VOICE.stop(), [])
  const pickR = (j: number) => {
    if (sel === null) { setMsg('Primeiro toque numa palavra da esquerda.'); return }
    if (j === sel) { SFX.play('bead'); const nx = [...ok, j]; setOk(nx); setSel(null); setMsg(''); if (nx.length === PAIRS.length) SFX.play('success') }
    else { SFX.play('error'); METRICS.hint(); setSh(false); requestAnimationFrame(() => setSh(true)); setMsg('💡 ' + PAIRS[sel].hint) }
  }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <div className="who-chip"><span style={{ color: '#8fe9ff' }}>DESAFIO DA MEMÓRIA CENTRAL</span></div>
        <h4>Ligue cada ideia ao que ela faz na LLM</h4>
        <p className="lead">Toque numa palavra recuperada e depois no que ela faz dentro de uma LLM.</p>
        <div className={'match' + (sh ? ' shake' : '')}>
          <div className="col">{PAIRS.map((p, i) => <button key={p.w} className={'opt' + (ok.includes(i) ? ' right' : '') + (sel === i ? ' sel' : '')} disabled={ok.includes(i)} onClick={() => { SFX.play('click'); setSel(i); setMsg('') }}>{ok.includes(i) ? '✓ ' : ''}<b>{p.w}</b></button>)}</div>
          <div className="col">{MIX.map((j) => <button key={j} className={'opt' + (ok.includes(j) ? ' right' : '')} disabled={ok.includes(j)} onClick={() => pickR(j)}>{ok.includes(j) ? <>✓ <b>{PAIRS[j].w}:</b> </> : ''}{PAIRS[j].d}</button>)}</div>
        </div>
        <div className="bad">{msg}</div>
        {all && <div className="ok">Tudo ligado! Ideias de milhares de anos viraram peças de uma LLM: fichas viraram tokens, chances viraram a escolha da próxima palavra e o menor erro virou o treino dos pesos.</div>}
        {all && <div className="foot"><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Continuar ▸</button></div>}
      </div>
    </div>
  )
}

/* ---------- faixa de memórias (HUD) e a linha do tempo completa ---------- */
export const memFlag = (id: string) => 'l1_' + id
export function MemoryStrip() {
  const flags = useGame((s) => s.flags)
  const hide = useGame((s) => !!s.cine || s.focus || !!s.menu || !!s.dialog || !!s.overlays[OV] || s.hudHidden)
  if (hide) return null
  const done = STOPS.filter((s) => flags[memFlag(s.id)])
  const lastW = done.length ? done[done.length - 1].word : ''
  return (
    <button className="memstrip" onClick={() => { SFX.play('open'); G().setOverlay(OV, <TimelinePanel />) }} aria-label={`Memórias recuperadas: ${done.length} de ${STOPS.length}. Toque para ver a linha do tempo.`}>
      <span className="lb">MEMÓRIA {done.length}/{STOPS.length}</span>
      <span className="ds">{STOPS.map((s) => <i key={s.id} style={flags[memFlag(s.id)] ? { background: PEOPLE[s.who].color, borderColor: '#fff', boxShadow: `0 0 6px ${PEOPLE[s.who].color}` } : undefined} />)}</span>
      {lastW && <span className="wd">{lastW}</span>}
    </button>
  )
}

function TimelinePanel() {
  const flags = useGame((s) => s.flags)
  const close = () => { SFX.play('click'); G().setOverlay(OV, null) }
  const n = STOPS.filter((s) => flags[memFlag(s.id)]).length
  return (
    <div className="modal" onClick={close} onPointerDown={(e) => e.stopPropagation()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="head"><h2>Linha do Tempo da Memória</h2><button className="icon-btn close" onClick={close} aria-label="Fechar">{Ico.close}</button></div>
        <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontWeight: 700, fontSize: 14.5 }}>{n < STOPS.length ? `A Language Engine já lembrou ${n} de ${STOPS.length} ideias. Cada uma é uma peça da matemática que faz uma LLM funcionar.` : 'Todas as memórias voltaram! Releia o que quiser.'}</p>
        <div className="tl">
          {STOPS.map((s) => {
            const on = !!flags[memFlag(s.id)]
            const P = PEOPLE[s.who]
            return (
              <div key={s.id} className={'it' + (on ? '' : ' lock')}>
                <span className="yr">{s.year}</span>
                <span className="pf">{on ? <PersonAvatar who={s.who} /> : <PersonFace who={s.who} />}</span>
                <span style={{ minWidth: 0 }}>
                  <div className="nm">{on ? s.doc.title : '???'}</div>
                  <div className="sub">{on ? <><span style={{ color: P.color }}>{P.name}</span> · <span style={{ color: 'var(--gold-2)' }}>{s.word}</span></> : 'coberto pela névoa'}</div>
                </span>
                {on && (
                  <span className="acts">
                    {PHOTOS[s.who] && <button className="btn small ghost" onClick={() => { SFX.play('open'); G().setOverlay(OV, <PhotoModal who={s.who} back={() => G().setOverlay(OV, <TimelinePanel />)} />) }}>Imagem</button>}
                    <button className="btn small" onClick={() => readAgain(s.doc, () => G().setOverlay(OV, <TimelinePanel />))}>Reler</button>
                    {s.extra && <button className="btn small ghost" onClick={() => readExtra(s.id, () => G().setOverlay(OV, <TimelinePanel />))}>+ Extra</button>}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
