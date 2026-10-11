import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SFX } from '../../engine/audio'
import { VOICE } from '../../engine/voice'
import { G } from '../../store'
import { MINI, lmTokenize, softmax, pct, LM_BOS, LM_EOS, LM_UNK } from '../../content/llm'
import { SpeakerChip } from '../p2/games'
import { SENTS, NAMES, babyName, chosenMask, chosen, memOf, hasWrong, LAB, buildModel, trainModel, EXAM, PREFS } from './lab'

/* =========================================================
   As estações do Laboratório (Fase 3): escolher os dados,
   o vocabulário e a memória, treinar de verdade, testar
   passo a passo, ajustar e a prova da formatura.
   ========================================================= */
type P = { win: (msg: ReactNode) => void; won: boolean }
const setF = (k: string, v: number) => G().setFlag(k, v)
const Chart = ({ data, max }: { data: number[]; max: number }) => {
  const n = Math.max(2, data.length)
  const pts = data.map((v, i) => `${(i / (n - 1)) * 220},${70 - Math.min(1, v / max) * 64}`).join(' ')
  return (
    <svg viewBox="0 0 220 74" style={{ width: '100%', height: 84 }}>
      {[0.25, 0.5, 0.75].map((k) => <line key={k} x1="0" x2="220" y1={70 - k * 64} y2={70 - k * 64} stroke="rgba(255,255,255,.08)" />)}
      <polyline points={pts} fill="none" stroke="#ffd27a" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}
function Bars({ items, hi, max = 1 }: { items: { t: string; p: number }[]; hi?: string; max?: number }) {
  return (
    <div className="p2bars">
      {items.map((x) => (
        <div key={x.t} className={'b' + (x.t === hi ? ' hi' : '')}>
          <span className="t">{x.t}</span>
          <span className="tr"><i style={{ width: `${Math.max(2, (x.p / max) * 100)}%`, background: x.t === hi ? 'var(--gold)' : 'var(--cyan)' }} /></span>
          <span className="v">{pct(x.p)}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- 1. Biblioteca de Dados ---------- */
function Dados({ win, won }: P) {
  const [mask, setMask] = useState(chosenMask())
  const [msg, setMsg] = useState('')
  const n = SENTS.filter((_, i) => mask & (1 << i)).length
  const toggle = (i: number) => { if (won) return; SFX.play('click'); setMsg(''); setMask((m) => m ^ (1 << i)) }
  const send = () => {
    if (!(mask & 1)) { SFX.play('error'); setMsg('Inclua a frase “A capital do Brasil é Brasília.”: é a pergunta que vamos testar!'); return }
    if (n < 6) { SFX.play('error'); setMsg('Escolha pelo menos 6 frases. Com pouco texto, a LLM aprende pouco.'); return }
    setF('p3_mask', mask)
    SFX.play('success')
    win(<>{babyName()} vai estudar <b>{n} frases</b>. Uma LLM só sabe o que estava nos <b>dados de treino</b>: as grandes leem trilhões de palavras de livros, sites e conversas.{hasWrong(mask) ? <> Você incluiu uma <b>frase errada</b>… vamos ver o que acontece!</> : <> E sem frases erradas: ótimo!</>}</>)
  }
  return (
    <>
      <p className="lead">Toque nas frases para escolher o que {babyName()} vai ler no treino. Escolha pelo menos 6.</p>
      <div style={{ display: 'grid', gap: 6 }}>
        {SENTS.map((s, i) => {
          const on = !!(mask & (1 << i))
          return (
            <button key={i} className={'opt' + (on ? ' right' : '')} style={{ margin: 0, padding: '9px 12px', display: 'flex', gap: 10, alignItems: 'center' }} onClick={() => toggle(i)}>
              <span style={{ fontSize: 18 }}>{on ? '☑' : '☐'}</span>
              <span style={{ flex: 1 }}>{s.s.replace(' .', '.')}</span>
              {s.wrong && <span className="chip" style={{ color: '#ff9a8a' }}>ERRADA</span>}
              {s.extra && !s.wrong && <span className="chip" style={{ color: 'var(--muted)' }}>EXTRA</span>}
            </button>
          )
        })}
      </div>
      <div className="bad">{msg}</div>
      {!won && <div className="foot" style={{ alignItems: 'center' }}><span style={{ fontWeight: 900, color: 'var(--muted)', flex: 1 }}>{n} frases escolhidas</span><button className="btn primary" onClick={send}>Enviar para o laboratório ▸</button></div>}
    </>
  )
}

/* ---------- 2. Tokenizador e memória ---------- */
const TEST = ['A', 'capital', 'do', 'Brasil', 'é']
function Tokens3({ win, won }: P) {
  const sents = chosen()
  const vocab = useMemo(() => { const v = [LM_BOS, LM_EOS, LM_UNK]; for (const s of sents) for (const t of lmTokenize(s)) if (!v.includes(t)) v.push(t); return v }, [])
  const pairs = sents.reduce((a, s) => a + lmTokenize(s).length + 1, 0)
  const [mem, setMem] = useState<number | null>(null)
  const pick = (k: number) => { if (won) return; SFX.play('bead'); setMem(k) }
  useEffect(() => { if (mem && !won) { setF('p3_mem', mem); win(<>Vocabulário pronto: <b>{vocab.length} tokens</b> e <b>{pairs} exemplos</b> de “começo → próxima palavra”. A memória (a <b>janela de contexto</b>) ficou em <b>{mem} token{mem > 1 ? 's' : ''}</b>. As LLMs de verdade olham milhares!</>) } }, [mem])
  return (
    <>
      <p className="lead">O vocabulário de {babyName()}: cada token novo ganha um número (ID). <b>⟨início⟩</b> e <b>⟨fim⟩</b> marcam onde a frase começa e termina.</p>
      <div className="row" style={{ gap: 4, justifyContent: 'flex-start' }}>{vocab.map((t, i) => <span key={t} className="p2tok sm" style={{ borderColor: i < 3 ? '#c8a8ff' : undefined }}><b>{t}</b><i>{i}</i></span>)}</div>
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Memória: quantos tokens para trás {babyName()} olha para prever o próximo?</div>
        <div className="p2sent" style={{ fontSize: 'clamp(15px, 4vw, 20px)', padding: '8px 4px' }}>
          {TEST.map((w, i) => <span key={i} style={mem && i >= TEST.length - mem ? { color: 'var(--gold-2)', background: 'rgba(255,210,122,.15)', borderRadius: 6, padding: '0 4px' } : { opacity: mem ? 0.4 : 1 }}>{w}</span>)}
          <span className="blank">___</span>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 6 }}>{[1, 2, 3].map((k) => <button key={k} className={'chipbtn' + (mem === k ? ' on' : '')} style={{ padding: '0 14px', fontSize: 15 }} onClick={() => pick(k)}>{k} token{k > 1 ? 's' : ''}</button>)}</div>
        {mem && <div style={{ fontWeight: 800, fontSize: 13.5, marginTop: 8, textAlign: 'center' }}>{babyName()} vai ver só: <span style={{ color: 'var(--gold-2)' }}>“{TEST.slice(-mem).join(' ')}”</span></div>}
      </div>
    </>
  )
}

/* ---------- 3. Forja de treino ---------- */
function Forja({ win, won }: P) {
  const [, force] = useState(0)
  const busy = useRef(0)
  // a LLM nasce aqui, com as frases e a memória escolhidas (pesos aleatórios)
  useState(() => { if (!G().flags.p3_ep || !LAB.model) buildModel() })
  const m = LAB.model || buildModel()
  const ep = m.epochs, loss = LAB.losses[LAB.losses.length - 1]
  const top = m.top(TEST, 4)
  const run = (n: number) => {
    if (busy.current) return
    let left = n
    SFX.play('bead')
    const step = () => {
      const k = Math.min(5, left); trainModel(k); left -= k
      force((x) => x + 1)
      if (left > 0) busy.current = requestAnimationFrame(step)
      else { busy.current = 0; setF('p3_ep', LAB.model!.epochs); SFX.play('chime') }
    }
    busy.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(busy.current), [])
  useEffect(() => { if (!won && ep >= 30 && !busy.current) win(<>Depois de <b>{ep} épocas</b>, o erro caiu de <b>{LAB.losses[0].toFixed(2).replace('.', ',')}</b> para <b>{loss.toFixed(2).replace('.', ',')}</b>. A cada exemplo, {babyName()} chutou a próxima palavra, mediu o erro (a <b>perda</b>) e ajustou os {m.params} pesos um pouquinho. Ninguém escreveu as regras!</>) }, [ep, busy.current])
  return (
    <>
      <p className="lead">{babyName()} tem <b>{m.V} tokens</b> no vocabulário, <b>{m.pairs.length} exemplos</b> para estudar e <b>{m.params} pesos</b> (memória de {m.win}: embeddings de 3 números → 12 neurônios → uma chance para cada token). Treine pelo menos 30 épocas.</p>
      <div className="row" style={{ alignItems: 'stretch', gap: 10 }}>
        <div className="card" style={{ flex: '1 1 240px' }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--muted)' }}>ERRO DO TREINO (PERDA)</div>
          <Chart data={LAB.losses} max={Math.max(3.5, LAB.losses[0])} />
          <div className="stat">época {ep} · erro {loss.toFixed(2).replace('.', ',')}</div>
        </div>
        <div className="card" style={{ flex: '1 1 200px' }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>“A capital do Brasil é ___”</div>
          <Bars items={top} hi="Brasília" />
        </div>
      </div>
      {!won && <div className="foot"><button className="btn" onClick={() => run(10)} disabled={!!busy.current}>Treinar 10 épocas</button><button className="btn primary" onClick={() => run(50)} disabled={!!busy.current}>Treinar 50 épocas</button></div>}
      {won && ep < 300 && <div className="foot"><button className="btn small ghost" onClick={() => run(50)}>Continuar treinando (+50)</button></div>}
    </>
  )
}

/* ---------- 4. Sala de teste: os 7 passos ---------- */
const STARTS = ['A capital do Brasil é', 'A capital da França é', 'O Brasil é famoso pelo', 'Roma é a capital da']
const STAGES = ['Tokens', 'IDs', 'Memória', 'Embeddings', 'Neurônios', 'Chances', 'Escolha']
function Teste({ win, won }: P) {
  const [txt, setTxt] = useState(STARTS[0])
  const [stage, setStage] = useState(0)
  const [T, setT] = useState(0.7)
  const [out, setOut] = useState('')
  const [, force] = useState(0)
  const [okBR, setOkBR] = useState(false)
  const m = LAB.model || buildModel()
  const toks = lmTokenize(txt)
  const ids = toks.map((t) => m.id(t))
  const ctx = m.ctxOf(ids)
  const f = m.fwd(ctx)
  const probs = softmax(f.l, T)
  const top = probs.map((p, i) => ({ t: m.vocab[i], p })).filter((x) => x.t !== LM_BOS && x.t !== LM_UNK).sort((a, b) => b.p - a.p).slice(0, 5)
  const isBR = txt.trim() === STARTS[0]
  const brTop = isBR ? top[0]?.t : null
  useEffect(() => { if (isBR && stage >= 6 && brTop === 'Brasília') setOkBR(true) }, [isBR, stage, brTop])
  useEffect(() => { if (okBR && !won) win(<>{babyName()} respondeu <b>Brasília</b>! Você viu os 7 passos de uma LLM de verdade: <b>tokens → IDs → memória → embeddings → neurônios → chances → escolha</b>. A sua é minúscula; as grandes têm bilhões de pesos e milhares de tokens de memória.</>) }, [okBR])
  const retrain = (opts: { mem?: number; noWrong?: boolean }) => {
    SFX.play('whoosh')
    let mask = chosenMask()
    if (opts.noWrong) { SENTS.forEach((x, i) => { if (x.wrong) mask &= ~(1 << i) }); setF('p3_mask', mask) }
    const mem = opts.mem ?? memOf()
    setF('p3_mem', mem)
    buildModel(mask, mem); trainModel(Math.max(60, G().flags.p3_ep || 60)); setF('p3_ep', LAB.model!.epochs)
    setStage(6); force((x) => x + 1)
  }
  const write = () => { SFX.play('chime'); setOut(m.write(toks, T, 10).join(' ').replace(/ ([.?,])/g, '$1')) }
  const cell = (v: number) => (v >= 0 ? `rgba(89,215,255,${Math.min(1, Math.abs(v)) * 0.85 + 0.1})` : `rgba(255,122,122,${Math.min(1, Math.abs(v)) * 0.85 + 0.1})`)
  const shown = (k: number) => stage >= k
  const fmt = (v: number) => v.toFixed(1).replace('.', ',')
  return (
    <>
      <div className="row" style={{ gap: 6, justifyContent: 'flex-start' }}>{STARTS.map((s) => <button key={s} className={'chipbtn' + (txt === s ? ' on' : '')} style={{ fontSize: 13, minHeight: 36, padding: '0 10px', fontFamily: 'inherit' }} onClick={() => { SFX.play('click'); setTxt(s); setStage(0); setOut('') }}>{s}…</button>)}</div>
      <input value={txt} onChange={(e) => { setTxt(e.target.value.slice(0, 60)); setStage(0); setOut('') }} aria-label="Começo da frase" style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'rgba(0,0,0,.25)', color: 'inherit', fontSize: 16, fontWeight: 700 }} />
      <div style={{ display: 'flex', gap: 3, margin: '10px 0 6px' }}>{STAGES.map((s, i) => <button key={s} onClick={() => setStage(i)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: 0, fontSize: 11, fontWeight: 900, background: i <= stage ? 'var(--cyan)' : 'rgba(255,255,255,.1)', color: i <= stage ? '#04121a' : 'var(--muted)' }}>{i + 1}</button>)}</div>
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <div><b style={{ color: 'var(--gold-2)' }}>1. Tokens</b> <span className="row" style={{ display: 'inline-flex', gap: 4 }}>{toks.map((t, i) => <span key={i} className="p2tok sm"><b>{t}</b></span>)}</span></div>
        {shown(1) && <div><b style={{ color: 'var(--gold-2)' }}>2. IDs</b> <span className="mono">{ids.map((id, i) => (m.vocab[id] === LM_UNK ? '⟨?⟩' : id)).join(' · ')}</span>{ids.includes(2) && <span style={{ fontSize: 12.5, color: '#ff9a8a', fontWeight: 800 }}> (⟨?⟩ = token que {babyName()} nunca viu)</span>}</div>}
        {shown(2) && <div><b style={{ color: 'var(--gold-2)' }}>3. Memória</b> {babyName()} olha só {m.win === 1 ? 'o último token' : `os últimos ${m.win}`}: <b style={{ color: 'var(--cyan)' }}>{ctx.map((id) => m.vocab[id]).join(' ')}</b></div>}
        {shown(3) && <div><b style={{ color: 'var(--gold-2)' }}>4. Embeddings</b> <span className="mono" style={{ fontSize: 12.5 }}>{ctx.map((id) => `${m.vocab[id]} [${m.E[id].map(fmt).join('; ')}]`).join('  ')}</span></div>}
        {shown(4) && <div><b style={{ color: 'var(--gold-2)' }}>5. Neurônios</b> <span style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>{f.h.map((v, i) => <i key={i} title={fmt(v)} style={{ width: 14, height: 14, borderRadius: 3, background: cell(v), display: 'inline-block' }} />)}</span></div>}
        {shown(5) && <div><b style={{ color: 'var(--gold-2)' }}>6. Chances</b><Bars items={top} hi={top[0]?.t} /></div>}
        {shown(6) && (
          <div>
            <b style={{ color: 'var(--gold-2)' }}>7. Escolha</b> temperatura {fmt(T)}
            <input type="range" min={0.2} max={2} step={0.1} value={T} onChange={(e) => setT(+e.target.value)} aria-label="Temperatura" />
            <div className="row" style={{ gap: 8, justifyContent: 'flex-start' }}><button className="btn small" onClick={write}>Escrever sozinha ✍️</button>{out && <span style={{ fontWeight: 800 }}>“{out}”</span>}</div>
          </div>
        )}
      </div>
      {isBR && shown(6) && brTop !== 'Brasília' && !won && (
        <div className="card" style={{ marginTop: 8, borderColor: '#ff9a8a' }}>
          {hasWrong() && brTop === 'São' ? <>
            <b>{babyName()} aprendeu a frase errada!</b> Ela leu “A capital do Brasil é São Paulo” no treino. Lixo entra, lixo sai.
            <div className="foot"><button className="btn primary small" onClick={() => retrain({ noWrong: true })}>Tirar a frase errada e treinar de novo</button></div>
          </> : <>
            <b>Com memória de {m.win} token{m.win > 1 ? 's' : ''}, {babyName()} só vê “{ctx.map((id) => m.vocab[id]).join(' ')}”.</b> Nas frases do treino, depois disso vem outra coisa! Ela precisa olhar mais para trás.
            <div className="foot"><button className="btn primary small" onClick={() => retrain({ mem: 3 })}>Aumentar a memória para 3 e treinar de novo</button></div>
          </>}
        </div>
      )}
      {!won && <div className="foot"><button className="btn primary" onClick={() => { SFX.play('click'); setStage(Math.min(6, stage + 1)) }} disabled={stage >= 6}>{stage < 6 ? `Passo ${stage + 2}: ${STAGES[stage + 1]} ▸` : 'Teste “A capital do Brasil é”'}</button></div>}
    </>
  )
}

/* ---------- 5a. Prompt × ajuste fino ---------- */
function Ajuste({ win, won }: P) {
  const base = useRef(MINI.pretrained())
  const [W, setW] = useState(() => MINI.copy(base.current))
  const [prompt, setPrompt] = useState(false)
  const [steps, setSteps] = useState(0)
  const [tried, setTried] = useState({ p: false, f: false })
  const SP = MINI.V.indexOf('São Paulo')
  const boost = prompt ? MINI.V.map((_, i) => (i === SP ? 7 : 0)) : undefined
  const pr = MINI.probs(W, MINI.K[0].x, boost)
  const items = MINI.V.map((t, i) => ({ t, p: pr[i] })).sort((a, b) => b.p - a.p).slice(0, 4)
  const changed = steps > 0
  const fr0 = MINI.probs(base.current, MINI.K[1].x)[SP], fr = MINI.probs(W, MINI.K[1].x)[SP]
  const fine = () => { if (won) return; SFX.play('bead'); const w = MINI.copy(W); MINI.step(w, MINI.K[0].x, SP, 0.7); setW(w); setSteps(steps + 1); if (MINI.probs(w, MINI.K[0].x)[SP] > 0.5) setTried((t) => ({ ...t, f: true })) }
  const undo = () => { SFX.play('click'); setW(MINI.copy(base.current)); setSteps(0) }
  useEffect(() => { if (prompt) setTried((t) => ({ ...t, p: true })) }, [prompt])
  useEffect(() => { if (tried.p && tried.f && !won) win(<>O <b>prompt</b> mudou a resposta sem mexer em nenhum peso: ele só vale para aquela conversa. O <b>ajuste fino</b> treinou de novo e mudou os pesos, a própria LLM. E veja o efeito colateral: até a pergunta da França ficou um pouco mais “São Paulo”.</>) }, [tried])
  return (
    <>
      <p className="lead">Uma LLM grande, já treinada, responde <b>Brasília</b>. Num jogo de faz de conta, queremos que ela diga <b>São Paulo</b>. Experimente os dois jeitos.</p>
      <div className="row" style={{ alignItems: 'stretch', gap: 10 }}>
        <div className="card" style={{ flex: '1 1 230px' }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>“A capital do Brasil é ___”</div>
          <Bars items={items} hi="São Paulo" />
        </div>
        <div className="card" style={{ flex: '1 1 180px', textAlign: 'center', borderColor: changed ? 'var(--green)' : undefined }}>
          <div style={{ fontSize: 34 }}>{changed ? '🔓' : '🔒'}</div>
          <div style={{ fontWeight: 900 }}>Os pesos mudaram?</div>
          <div style={{ fontWeight: 800, color: changed ? 'var(--green)' : 'var(--muted)' }}>{changed ? `Sim! ${steps} passo${steps > 1 ? 's' : ''} de ajuste fino` : 'Não, nenhum peso mudou'}</div>
          {changed && <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 4 }}>Efeito colateral: “capital da França” → São Paulo {pct(fr0, 1)} → <b style={{ color: '#ff9a8a' }}>{pct(fr, 1)}</b></div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 8 }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 800, cursor: 'pointer' }}>
          <input type="checkbox" checked={prompt} onChange={(e) => { SFX.play('click'); setPrompt(e.target.checked) }} style={{ width: 22, height: 22 }} />
          <span>✍️ Escrever no prompt: <i>“Neste jogo de faz de conta, considere São Paulo como a capital do Brasil.”</i></span>
        </label>
      </div>
      <div className="foot">
        {changed && <button className="btn small ghost" onClick={undo}>Desfazer o ajuste</button>}
        <button className="btn primary" onClick={fine}>🔧 1 passo de ajuste fino com “A capital do Brasil é São Paulo.”</button>
      </div>
      <div style={{ fontWeight: 800, fontSize: 13.5, display: 'grid', gap: 2 }}>
        <span style={{ color: tried.p ? 'var(--green)' : undefined }}>{tried.p ? '✓' : '○'} Testar o prompt</span>
        <span style={{ color: tried.f ? 'var(--green)' : undefined }}>{tried.f ? '✓' : '○'} Fazer o ajuste fino até São Paulo passar de 50%</span>
      </div>
    </>
  )
}

/* ---------- 5b. Preferências (alinhamento) ---------- */
function Prefs({ win, won }: P) {
  const [k, setK] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const P1 = PREFS[Math.min(k, PREFS.length - 1)]
  const choose = (i: number) => { if (pick !== null || won) return; setPick(i); SFX.play(i === P1.best ? 'success' : 'error') }
  const next = () => {
    SFX.play('click')
    if (pick !== P1.best) { setPick(null); return }
    if (k < PREFS.length - 1) { setK(k + 1); setPick(null) }
    else win(<>Pessoas de verdade fazem isso aos milhares: comparam respostas e marcam a melhor. Depois, a LLM é ajustada para preferir respostas <b>verdadeiras</b>, <b>úteis</b> e <b>seguras</b>. Isso faz parte do <b>alinhamento</b>.</>)
  }
  return (
    <>
      <p className="lead">{babyName()} escreveu duas respostas. Qual é a melhor? <span className="chip" style={{ color: 'var(--gold-2)', marginLeft: 6 }}>{k + 1} DE 3</span></p>
      <div className="card"><b>Pergunta:</b> {P1.q}</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        {[P1.a, P1.b].map((t, i) => <button key={i} className={'opt' + (pick === i ? (i === P1.best ? ' right' : ' wrong') : '')} style={{ margin: 0 }} onClick={() => choose(i)}>{i === 0 ? '🅰' : '🅱'} {t}</button>)}
      </div>
      {pick !== null && <div className={pick === P1.best ? 'ok' : 'bad'} style={{ textAlign: 'left' }}>{pick === P1.best ? '👍 ' + P1.why : 'Hum… será? Pense: essa resposta é verdadeira, útil e segura?'}</div>}
      {pick !== null && !won && <div className="foot"><button className="btn primary" onClick={next}>{pick !== P1.best ? 'Tentar de novo' : k < PREFS.length - 1 ? 'Próxima ▸' : 'Concluir ▸'}</button></div>}
    </>
  )
}

/* ---------- 6. A prova da formatura ---------- */
function Prova({ win, won }: P) {
  const [k, setK] = useState(0)
  const [ans, setAns] = useState<number[]>([])
  const [show, setShow] = useState<number | null>(null)
  const done = k >= EXAM.length
  const score = ans.filter((a, i) => a === EXAM[i].a).length
  useEffect(() => { if (done && score >= 7 && !won) { setF('p3_nota', score); win(<>Você acertou <b>{score} de 10</b>! {babyName()} está formada, e você também: agora sabe como uma LLM funciona do começo ao fim.</>) } }, [done])
  if (done) {
    return (
      <>
        <div className="stat" style={{ fontSize: 26 }}>{score} / 10</div>
        {score < 7 && <p className="lead" style={{ textAlign: 'center' }}>Quase! Precisa de 7 acertos. Veja as explicações e tente de novo.</p>}
        <div style={{ display: 'grid', gap: 5 }}>{EXAM.map((q, i) => <div key={i} className="card" style={{ padding: '6px 10px', fontSize: 13.5, fontWeight: 700, borderColor: ans[i] === q.a ? 'rgba(79,209,139,.5)' : 'rgba(255,122,122,.5)' }}>{ans[i] === q.a ? '✓' : '✗'} {q.q} <span style={{ color: 'var(--muted)' }}>{q.why}</span></div>)}</div>
        {score < 7 && <div className="foot"><button className="btn primary" onClick={() => { setK(0); setAns([]); setShow(null) }}>Tentar de novo</button></div>}
      </>
    )
  }
  const Q = EXAM[k]
  const pick = (i: number) => { if (show !== null) return; setShow(i); SFX.play(i === Q.a ? 'success' : 'error'); setAns((a) => [...a, i]) }
  return (
    <>
      <div style={{ display: 'flex', gap: 3, margin: '0 0 10px' }}>{EXAM.map((_, i) => <i key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < ans.length ? (ans[i] === EXAM[i].a ? 'var(--green)' : '#ff7a7a') : i === k ? 'var(--gold)' : 'rgba(255,255,255,.12)' }} />)}</div>
      <p className="lead">{k + 1}. {Q.q}</p>
      {Q.o.map((o, i) => <button key={i} className={'opt' + (show !== null && i === Q.a ? ' right' : '') + (show === i && i !== Q.a ? ' wrong' : '')} onClick={() => pick(i)}>{o}</button>)}
      {show !== null && <div className={show === Q.a ? 'ok' : 'bad'} style={{ textAlign: 'left' }}>{Q.why}</div>}
      {show !== null && <div className="foot"><button className="btn primary" onClick={() => { SFX.play('click'); setShow(null); setK(k + 1) }}>{k < EXAM.length - 1 ? 'Próxima ▸' : 'Ver a nota ▸'}</button></div>}
    </>
  )
}

/* ---------- escolher o nome ---------- */
export function NameView({ onDone }: { onDone: () => void }) {
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm" style={{ width: 'min(460px, 100%)' }}>
        <SpeakerChip who="SINAPSE" />
        <h4>Como vai se chamar a sua LLM?</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {NAMES.map((n, i) => <button key={n} className="opt" style={{ margin: 0, textAlign: 'center', fontSize: 18 }} onClick={() => { SFX.play('success'); setF('p3_nome', i + 1); onDone() }}>{['✨', '⚡', '🍿', '🤖'][i]} {n}</button>)}
        </div>
      </div>
    </div>
  )
}
/** Diploma (fim da formatura). */
export function DiplomaView({ onDone }: { onDone: () => void }) {
  const nota = G().flags.p3_nota || 7
  useEffect(() => { VOICE.speak(`Diploma de LLM. ${babyName()} se formou com ${nota} acertos.`, 'NOVA') }, [])
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="doc" style={{ textAlign: 'center' }}>
        <div className="meta">LABORATÓRIO DA LANGUAGE ENGINE</div>
        <h2 style={{ fontSize: 'clamp(22px, 6vw, 32px)' }}>🎓 Diploma de LLM</h2>
        <p style={{ fontSize: 16 }}>Certificamos que <b style={{ color: '#8a5a1a' }}>{babyName()}</b> leu os dados, aprendeu seus pesos, passou nos testes e se formou com <b>{nota} acertos em 10</b>, treinada por <b>NEX</b> e por você.</p>
        <div style={{ fontSize: 44, margin: '6px 0' }}>🏆</div>
        <p style={{ fontSize: 14 }}>Tokens · IDs · memória · embeddings · neurônios · chances · escolha · treino · ajuste · alinhamento</p>
        <div className="nav" style={{ justifyContent: 'center' }}><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Que orgulho! ▸</button></div>
      </div>
    </div>
  )
}

export const P3GAMES: Record<string, { title: string; C: (p: P) => ReactNode }> = {
  dados: { title: 'A Biblioteca de Dados', C: (p) => <Dados {...p} /> },
  tokens: { title: 'Vocabulário e memória', C: (p) => <Tokens3 {...p} /> },
  forja: { title: 'A Forja de treino', C: (p) => <Forja {...p} /> },
  teste: { title: 'A Sala de Teste', C: (p) => <Teste {...p} /> },
  ajuste: { title: 'Prompt ou ajuste fino?', C: (p) => <Ajuste {...p} /> },
  prefs: { title: 'Qual resposta é melhor?', C: (p) => <Prefs {...p} /> },
  prova: { title: 'A prova final', C: (p) => <Prova {...p} /> },
}
export function P3GameView({ game, onDone }: { game: string; onDone: () => void }) {
  const [msg, setMsg] = useState<ReactNode>(null)
  const okRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (msg) setTimeout(() => okRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60) }, [msg])
  const G1 = P3GAMES[game]
  const win = (m: ReactNode) => { if (!msg) { setMsg(m); SFX.play('discover') } }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <SpeakerChip who="SINAPSE" />
        <h4>{G1.title}</h4>
        {G1.C({ win, won: !!msg })}
        {msg && <div className="ok">{msg}</div>}
        {msg && <div className="foot" ref={okRef}><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Continuar ▸</button></div>}
      </div>
    </div>
  )
}
