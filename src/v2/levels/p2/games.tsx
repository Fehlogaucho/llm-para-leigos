import { METRICS, useActivity } from '../../engine/metrics'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SFX } from '../../engine/audio'
import { VOICE } from '../../engine/voice'
import { SPEAKERS } from '../../ui/Icons'
import { CORPUS, nextDist, withT, tokenize, tokenizeSmall, tokenId, QUESTION, MINI, RAG_DOCS, CANTINA, AVISO_2019, ragSearch, pct, softmax, type RagDoc } from '../../content/llm'
import { P2_PIPELINE } from './zones'

/* =========================================================
   As brincadeiras da Fábrica de Previsões (Fase 2).
   Cada uma chama win(mensagem) quando o jogador conclui.
   ========================================================= */
export type P = { win: (msg: ReactNode) => void; won: boolean }
/** Estado que o cenário mostra (a torre acende, a roleta gira…). */
export const WORLD = { camadas: 0, spinAt: -10, spinWord: '', treino: 0, holofotes: [] as string[] }

/** Rola o painel até este ponto quando ele aparece (perguntas que surgem embaixo). */
export function ScrollHere() {
  const r = useRef<HTMLSpanElement>(null)
  useEffect(() => { const t = setTimeout(() => r.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); return () => clearTimeout(t) }, [])
  return <span ref={r} />
}
function useShake(): [string, () => void] {
  const [k, setK] = useState(false)
  return [k ? 'shake' : '', () => { setK(false); requestAnimationFrame(() => setK(true)); SFX.play('error'); setTimeout(() => setK(false), 400) }]
}
function Bars({ items, hi, color = 'var(--cyan)', max }: { items: { t: string; p: number }[]; hi?: string; color?: string; max?: number }) {
  const m = max ?? Math.max(...items.map((x) => x.p), 0.01)
  return (
    <div className="p2bars">
      {items.map((x) => (
        <div key={x.t} className={'b' + (x.t === hi ? ' hi' : '')}>
          <span className="t">{x.t}</span>
          <span className="tr"><i style={{ width: `${Math.max(2, (x.p / m) * 100)}%`, background: x.t === hi ? 'var(--gold)' : color }} /></span>
          <span className="v">{pct(x.p)}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- 1. Prof. Adivinho: você contra a máquina de contar ---------- */
const ROUNDS = [
  { ctx: ['O', 'Brasil', 'é', 'famoso', 'pelo'], opts: ['futebol', 'Paris', 'samba', 'uma'], ok: ['futebol', 'samba'] },
  { ctx: ['A', 'capital', 'do'], opts: ['samba', 'Brasil', 'cidade', 'é'], ok: ['Brasil'] },
  { ctx: ['A', 'capital', 'do', 'Brasil', 'é'], opts: ['uma', 'Brasília', 'famoso', 'Paris'], ok: ['Brasília'] },
]
function Prever({ win, won }: P) {
  const [r, setR] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [score, setScore] = useState([0, 0])
  const [bad, setBad] = useState('')
  const [sh, shake] = useShake()
  const R = ROUNDS[r], last = R.ctx[R.ctx.length - 1]
  const dist = nextDist(last), mach = dist[0]?.t
  const choose = (o: string) => {
    if (pick || won) return
    if (r === 2 && !R.ok.includes(o)) { shake(); setBad('Pense na frase inteira: a capital de qual país?'); return }
    setBad(''); setPick(o)
    const you = R.ok.includes(o) ? 1 : 0, m = R.ok.includes(mach) ? 1 : 0
    setScore((s) => [s[0] + you, s[1] + m])
    SFX.play(you ? 'success' : 'error')
  }
  const next = () => {
    SFX.play('click')
    if (r < 2) { setR(r + 1); setPick(null) }
    else win(<>Na última rodada a máquina chutou <b>“uma”</b>, porque só olhou para o <b>“é”</b>: no livro, depois de “é” vem “uma” três vezes. Contar ajuda a <b>prever a próxima palavra</b>, mas para acertar é preciso olhar a <b>frase inteira</b>.</>)
  }
  return (
    <>
      <p className="lead">Complete a frase. A máquina de contar olha só a <b>última palavra</b> e escolhe o que mais vem depois dela no livro.</p>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="chip" style={{ color: 'var(--gold-2)' }}>RODADA {r + 1} DE 3</span>
        <span className="chip" style={{ color: 'var(--cyan)' }}>VOCÊ {score[0]} × {score[1]} MÁQUINA</span>
      </div>
      <div className="card p2sent">
        {R.ctx.map((w, i) => <span key={i} className={i === R.ctx.length - 1 && pick ? 'lastw' : ''}>{w}</span>)}
        <span className={'blank' + (pick ? ' on' : '')}>{pick || '___'}</span>
      </div>
      <div className={sh} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {R.opts.map((o) => <button key={o} className={'opt' + (pick === o ? (R.ok.includes(o) ? ' right' : ' wrong') : '')} style={{ margin: 0, textAlign: 'center' }} onClick={() => choose(o)}>{pick === o ? (R.ok.includes(o) ? '✓ ' : '✗ ') : ''}{o}</button>)}
      </div>
      <div className="bad">{bad}</div>
      {pick && (
        <div className="card" style={{ marginTop: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>A máquina olhou só para <b style={{ color: 'var(--gold-2)' }}>“{last}”</b>. No livro, depois de “{last}” vem:</div>
          <Bars items={dist.map((d) => ({ t: d.t, p: d.p }))} hi={mach} />
          <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>Máquina: <b style={{ color: R.ok.includes(mach) ? 'var(--green)' : '#ff9a8a' }}>“{mach}” {R.ok.includes(mach) ? '✓' : '✗'}</b> · Você: <b style={{ color: R.ok.includes(pick) ? 'var(--green)' : '#ff9a8a' }}>“{pick}” {R.ok.includes(pick) ? '✓' : '✗'}</b></div>
          <details style={{ marginTop: 6 }}><summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13, color: 'var(--muted)' }}>Ver as 8 frases do livro</summary>
            <div className="mono" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>{CORPUS.map((s) => <div key={s}>{s.split(' ').map((w, i, a) => <span key={i} style={a[i - 1] === last ? { color: 'var(--gold-2)', fontWeight: 900 } : undefined}>{w} </span>)}</div>)}</div>
          </details>
          {!won && <div className="foot"><button className="btn primary small" onClick={next}>{r < 2 ? 'Próxima rodada ▸' : 'Ver o resultado ▸'}</button></div>}
        </div>
      )}
    </>
  )
}

/* ---------- 2. Tesourinha: onde cortar? ---------- */
const CUTS = [
  { w: 'Brasil?', cuts: [6], why: 'A pontuação vira um token separado: Brasil | ?' },
  { w: 'infelizmente', cuts: [2, 7], why: 'Prefixo, raiz e sufixo: in | feliz | mente' },
  { w: 'capital', cuts: [], why: 'Neste tokenizador, palavra comum fica inteira: um token só.' },
]
function Tokens({ win, won }: P) {
  const [k, setK] = useState(0)
  const [cut, setCut] = useState<number[]>([])
  const [msg, setMsg] = useState('')
  const [okW, setOkW] = useState(false)
  const [lab, setLab] = useState('Bom dia! Tudo bem? 😀')
  const [sh, shake] = useShake()
  const [shown, setShown] = useState(0)
  const C = CUTS[Math.min(k, CUTS.length - 1)]
  const toggle = (i: number) => { if (okW || k >= CUTS.length) return; SFX.play('click'); setMsg(''); setCut((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i].sort((a, b) => a - b))) }
  const check = () => {
    const extra = cut.filter((c) => !C.cuts.includes(c)).length, miss = C.cuts.filter((c) => !cut.includes(c)).length
    if (!extra && !miss) { SFX.play('success'); setOkW(true); setMsg('Certo! ' + C.why) }
    else { shake(); setMsg(extra && miss ? 'Tem corte no lugar errado e faltou um.' : extra ? 'Cortou demais! Algum pedaço ficou pequeno demais.' : 'Faltou cortar em algum lugar.') }
  }
  const next = () => { SFX.play('click'); setOkW(false); setMsg(''); setCut([]); setK(k + 1) }
  useEffect(() => {
    if (k < CUTS.length) return
    if (shown < QUESTION.length) { const id = setTimeout(() => { setShown(shown + 1); SFX.play('bead') }, 380); return () => clearTimeout(id) }
    if (!won) win(<>Cada pedaço é um <b>token</b>, e cada token tem um <b>número de catálogo</b> (ID). A pergunta “Qual é a capital do Brasil?” virou <b>7 tokens</b>, ou seja, 7 números: a rede neural da Engine recebe esses números, não as letras. E cada LLM tem o seu tokenizador: no laboratório, compare dois jeitos de cortar.</>)
  }, [k, shown])
  const [tk, setTk] = useState<'A' | 'B'>('A')
  const toksA = useMemo(() => tokenize(lab), [lab])
  const toksB = useMemo(() => tokenizeSmall(lab), [lab])
  const toks = tk === 'A' ? toksA : toksB
  if (k >= CUTS.length) {
    return (
      <>
        <p className="lead">A pergunta que chegou na fábrica, fatiada e numerada:</p>
        <div className="row" style={{ gap: 6 }}>
          {QUESTION.slice(0, shown).map((t, i) => <span key={i} className="p2tok" style={{ animationDelay: '0s' }}><b>{t}</b><i>{tokenId(t)}</i></span>)}
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Laboratório: escreva qualquer coisa e veja o texto virar tokens e IDs.</div>
          <div className="seg" style={{ marginBottom: 8 }} role="group" aria-label="Escolha o tokenizador">
            <button className={tk === 'A' ? 'on' : ''} onClick={() => { SFX.play('click'); setTk('A') }}>Tokenizador A · {toksA.length}</button>
            <button className={tk === 'B' ? 'on' : ''} onClick={() => { SFX.play('click'); setTk('B') }}>Tokenizador B · {toksB.length}</button>
          </div>
          <input value={lab} onChange={(e) => setLab(e.target.value.slice(0, 80))} aria-label="Texto para fatiar" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'rgba(0,0,0,.25)', color: 'inherit', fontSize: 16, fontWeight: 700 }} />
          <div className="row" style={{ gap: 5, justifyContent: 'flex-start', marginTop: 8 }}>
            {toks.map((t, i) => <span key={i} className="p2tok sm" style={{ borderColor: ['#ff9a8a', '#ffd27a', '#7ef0a0', '#59d7ff', '#c8a8ff'][t.g % 5] }}><b>{t.t}</b><i>{tk === 'A' ? tokenId(t.t) : tokenId('b:' + t.t) % 9000}</i></span>)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', marginTop: 6 }}>Texto → {toks.length} tokens → {toks.length} IDs. A mesma frase dá {toksA.length} tokens no A e {toksB.length} no B: cada LLM corta do seu jeito. Emoji pode virar 2 ou mais.</div>
        </div>
      </>
    )
  }
  return (
    <>
      <p className="lead">Toque nos espaços entre as letras para cortar. Palavras comuns ficam inteiras; palavras longas viram pedaços que se repetem em outras palavras.</p>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}><span className="chip" style={{ color: 'var(--gold-2)' }}>PALAVRA {k + 1} DE 3</span></div>
      <div className={'card p2cut ' + sh}>
        {C.w.split('').map((ch, i) => (
          <span key={i} style={{ display: 'inline-flex' }}>
            <span className="lt">{ch}</span>
            {i < C.w.length - 1 && <button className={'gap' + (cut.includes(i + 1) ? ' on' : '')} onClick={() => toggle(i + 1)} aria-label={`Cortar depois de ${ch}`}>{cut.includes(i + 1) ? '✂' : ''}</button>}
          </span>
        ))}
      </div>
      <div className="row" style={{ marginTop: 8, gap: 6 }}>{(() => { const parts: string[] = []; let a = 0; for (const c of [...cut, C.w.length]) { parts.push(C.w.slice(a, c)); a = c } return parts.map((p, i) => <span key={i} className="p2tok sm"><b>{p}</b></span>) })()}</div>
      <div className={okW ? 'ok' : 'bad'} style={okW ? { marginTop: 8 } : undefined}>{msg}</div>
      <div className="foot">
        {!okW && <button className="btn primary" onClick={check}>{cut.length ? 'Conferir os cortes' : 'Não precisa cortar'}</button>}
        {okW && <button className="btn primary" onClick={next}>{k < 2 ? 'Próxima palavra ▸' : 'Fatiar a pergunta ▸'}</button>}
      </div>
    </>
  )
}

/* ---------- 3. Luz: para onde apontar os holofotes? ---------- */
const SPOT = [
  { toks: ['Na', 'praça', ',', 'sentei', 'no', 'banco'], focus: 5, w: [0.03, 0.42, 0.02, 0.34, 0.07, 0.12], ask: 'Para entender “banco”, quais 2 palavras ele deve olhar?', meaning: 'banco de sentar 🪑' },
  { toks: ['Para', 'sacar', 'dinheiro', ',', 'fui', 'ao', 'banco'], focus: 6, w: [0.03, 0.3, 0.45, 0.02, 0.05, 0.04, 0.11], ask: 'E agora? Quais 2 palavras explicam este “banco”?', meaning: 'banco de dinheiro 🏦' },
  { toks: ['Qual', 'é', 'a', 'capital', 'do', 'Brasil', '?'], focus: -1, w: [0.1, 0.04, 0.03, 0.33, 0.05, 0.37, 0.08], ask: 'Para responder a pergunta, quais 2 tokens mais importam?', meaning: 'a resposta: Brasília' },
]
const SWAP: Record<string, string> = { capital: 'Brasília', moeda: 'real', língua: 'português', esporte: 'futebol' }
function Atencao({ win, won }: P) {
  const [r, setR] = useState(0)
  const [sel, setSel] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState('')
  const [sw, setSw] = useState('capital')
  const [sh, shake] = useShake()
  const S = SPOT[r]
  const top2 = S.w.map((v, i) => ({ v, i })).filter((x) => x.i !== S.focus).sort((a, b) => b.v - a.v).slice(0, 2).map((x) => x.i)
  const tap = (i: number) => {
    if (done || i === S.focus) return
    SFX.play('click'); setMsg('')
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : s.length >= 2 ? [s[1], i] : [...s, i]))
  }
  const check = () => {
    if (sel.length < 2) { setMsg('Escolha duas palavras.'); return }
    if (top2.every((i) => sel.includes(i))) { SFX.play('success'); setDone(true); WORLD.holofotes = sel.map((i) => S.toks[i]) }
    else { shake(); setMsg(r === 2 ? 'Quase! Quais palavras dizem o que estamos procurando?' : 'Hum… essas palavras não mudam o sentido de “banco”. Tente outras.') }
  }
  const next = () => {
    SFX.play('click')
    if (r < 2) { setR(r + 1); setSel([]); setDone(false) }
    else if (!won) win(<>Na <b>atenção</b>, a Engine calcula uma nota para cada par de tokens, e as notas viram porcentagens. Elas mudam o sentido de “banco” e, na pergunta, pesam mais em <b>“capital”</b> e <b>“Brasil”</b>. Ninguém escolhe: é uma conta com números aprendidos. Os holofotes e as porcentagens daqui são uma ilustração.</>)
  }
  return (
    <>
      <p className="lead">{S.ask}</p>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}><span className="chip" style={{ color: 'var(--gold-2)' }}>CENA {r + 1} DE 3</span>{done && <span className="chip" style={{ color: 'var(--green)' }}>{S.meaning}</span>}</div>
      <div className={'card p2stage ' + sh}>
        {S.toks.map((t, i) => (
          <button key={i} className={'w' + (i === S.focus ? ' focus' : '') + (sel.includes(i) ? ' lit' : '')} onClick={() => tap(i)} disabled={i === S.focus}>
            <span>{t}</span>
            {done && <small>{pct(S.w[i])}</small>}
          </button>
        ))}
      </div>
      <div className="bad">{msg}</div>
      {done && r === 2 && (
        <div className="card" style={{ marginTop: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Troque a palavra que recebe o holofote e veja a resposta mudar:</div>
          <div className="row" style={{ gap: 6 }}>{Object.keys(SWAP).map((k) => <button key={k} className={'chipbtn' + (sw === k ? ' on' : '')} style={{ fontSize: 14, minHeight: 38, padding: '0 10px' }} onClick={() => { SFX.play('click'); setSw(k) }}>{k}</button>)}</div>
          <div className="stat" style={{ marginTop: 8 }}>Qual é a {sw} do Brasil? → <span style={{ color: 'var(--gold-2)' }}>{SWAP[sw]}</span></div>
          <Heat toks={SPOT[2].toks} />
        </div>
      )}
      <div className="foot">
        {!done && <button className="btn primary" onClick={check}>Acender os holofotes</button>}
        {done && !won && <button className="btn primary" onClick={next}>{r < 2 ? 'Próxima cena ▸' : 'Concluir ▸'}</button>}
      </div>
    </>
  )
}

/** Mapa de calor ilustrativo: cada linha mostra quanto aquele token usa dos anteriores. */
function Heat({ toks }: { toks: string[] }) {
  const key = new Set(['capital', 'Brasil'])
  const rows = toks.map((a, i) => {
    const sc = toks.map((b, j) => (j > i ? -Infinity : (j === i ? 1 : 0) + (key.has(b) ? 1.3 : 0) + (key.has(a) && key.has(b) && a !== b ? 1.2 : 0) + (a === '?' && key.has(b) ? 1.4 : 0)))
    const fin = sc.map((v) => (v === -Infinity ? -1e9 : v))
    return softmax(fin).map((p, j) => (j > i ? 0 : p))
  })
  return (
    <details style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13.5 }}>Ver o mapa de calor da atenção (ilustrativo)</summary>
      <div style={{ overflowX: 'auto', marginTop: 6 }}>
        <table className="heat" aria-label="Mapa de calor da atenção">
          <thead><tr><th />{toks.map((t, j) => <th key={j}>{t}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}><th>{toks[i]}</th>{r.map((p, j) => <td key={j} title={j > i ? 'não olha para frente' : pct(p)} style={{ background: j > i ? 'transparent' : `rgba(255,210,122,${0.08 + p * 0.92})`, color: p > 0.45 ? '#1b1206' : 'var(--muted)' }}>{j > i ? '·' : Math.round(p * 100)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginTop: 4 }}>Cada linha soma 100%. Os tokens só usam os que vieram antes (os pontinhos), porque a Engine escreve da esquerda para a direita. Numa LLM de verdade são dezenas de mapas assim, um para cada cabeça de atenção, em cada camada.</div>
    </details>
  )
}

/* ---------- 4. Mestre Camada: a tabela de votos ---------- */
const ROWS = ['Brasília', 'Paris', 'gol'], COLS = ['capital', 'Brasil', 'França', 'futebol']
const QS = [{ on: [0, 1], want: 0 }, { on: [0, 2], want: 1 }, { on: [1, 3], want: 2 }]
const CYCLE = [0, 1, 2, -1]
function Camadas({ win, won }: P) {
  const [W, setW] = useState<number[][]>(ROWS.map(() => COLS.map(() => 0)))
  const res = QS.map((q) => {
    const v = ROWS.map((_, r) => q.on.reduce((s, c) => s + W[r][c], 0))
    const best = Math.max(...v), ok = v[q.want] === best && v.filter((x) => x === best).length === 1
    return { v, ok }
  })
  const nOk = res.filter((x) => x.ok).length
  useEffect(() => { WORLD.camadas = nOk; if (!won && nOk === 3) { SFX.play('success'); win(<>As três perguntas certas com <b>uma só tabela de pesos</b>! Somar os votos de todas as pistas de uma vez é <b>multiplicar uma matriz por um vetor</b>. Uma LLM faz isso com tabelas de milhões de números, andar por andar.</>) } }, [nOk])
  const tap = (r: number, c: number) => { if (won) return; SFX.play('bead'); setW((w) => w.map((row, i) => row.map((v, j) => (i === r && j === c ? CYCLE[(CYCLE.indexOf(v) + 1) % 4] : v)))) }
  return (
    <>
      <p className="lead">Toque nas casas para mudar o peso (0 → +1 → +2 → −1). Cada pista acesa dá seus votos às respostas. A resposta certa precisa ganhar <b>sozinha</b> nas três perguntas.</p>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="p2tab">
          <thead><tr><th />{COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{ROWS.map((r, i) => <tr key={r}><th>{r}</th>{COLS.map((c, j) => <td key={c}><button className={'wc' + (W[i][j] > 0 ? ' pos' : W[i][j] < 0 ? ' neg' : '')} onClick={() => tap(i, j)} aria-label={`Peso de ${c} para ${r}: ${W[i][j]}`}>{W[i][j] > 0 ? '+' + W[i][j] : W[i][j] < 0 ? '−1' : '0'}</button></td>)}</tr>)}</tbody>
        </table>
      </div>
      <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
        {QS.map((q, k) => (
          <div key={k} className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderColor: res[k].ok ? 'rgba(79,209,139,.6)' : undefined }}>
            <span style={{ fontWeight: 900, minWidth: 150 }}>{q.on.map((c) => COLS[c]).join(' + ')} → <span style={{ color: 'var(--gold-2)' }}>{ROWS[q.want]}</span></span>
            <span className="mono" style={{ fontSize: 13, flex: 1 }}>{ROWS.map((r, i) => `${r} ${res[k].v[i]}`).join(' · ')}</span>
            <span style={{ fontWeight: 900, color: res[k].ok ? 'var(--green)' : '#ff9a8a' }}>{res[k].ok ? '✓ andar aceso' : '✗'}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- 5. Crupiê Sorte: a roleta da temperatura ---------- */
const WHEEL_C = ['#ffd27a', '#59d7ff', '#ff7ab8', '#7ef0a0', '#c8a8ff', '#ffb35a']
function Wheel({ items, angle }: { items: { t: string; p: number }[]; angle: number }) {
  let a0 = -Math.PI / 2
  return (
    <svg viewBox="-110 -110 220 220" style={{ width: 'min(230px, 60vw)', height: 'auto', display: 'block', margin: '0 auto' }}>
      <g style={{ transform: `rotate(${angle}deg)`, transition: 'transform 1.6s cubic-bezier(.15,.8,.25,1)' }}>
        {items.map((x, i) => {
          const a1 = a0 + x.p * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0
          const d = `M0 0 L${Math.cos(a0) * 100} ${Math.sin(a0) * 100} A100 100 0 ${big} 1 ${Math.cos(a1) * 100} ${Math.sin(a1) * 100} Z`
          const am = (a0 + a1) / 2
          const el = <g key={x.t}><path d={d} fill={WHEEL_C[i % WHEEL_C.length]} stroke="#1b1426" strokeWidth="2" />{x.p > 0.07 && <text x={Math.cos(am) * 62} y={Math.sin(am) * 62 + 5} textAnchor="middle" fontSize="14" fontWeight="900" fill="#1b1426">{x.t}</text>}</g>
          a0 = a1
          return el
        })}
        <circle r="12" fill="#1b1426" />
      </g>
      <path d="M0 -112 L9 -96 L-9 -96 Z" fill="#fff" stroke="#1b1426" strokeWidth="2" />
    </svg>
  )
}
function Roleta({ win, won }: P) {
  const [T, setT] = useState(1)
  const [angle, setAngle] = useState(0)
  const [hist, setHist] = useState<{ t: string; T: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState<null | 'baixa' | 'alta'>(null)
  const [q2, setQ2] = useState<null | number>(null)
  const [guess, setGuess] = useState<null | number>(null)
  const items = withT(nextDist('é'), T).map((d) => ({ t: d.t, p: d.p }))
  const fav = (t: number) => withT(nextDist('é'), t)[0].p
  const cold = hist.filter((h) => h.T <= 0.5).length, hot = hist.filter((h) => h.T >= 1.5).length
  const spin = () => {
    if (busy) return
    let r = Math.random(), i = 0
    for (; i < items.length - 1; i++) { r -= items[i].p; if (r <= 0) break }
    let a0 = 0; for (let k = 0; k < i; k++) a0 += items[k].p
    const mid = (a0 + items[i].p / 2) * 360
    const target = angle - (angle % 360) + 360 * 4 + (360 - mid)
    setAngle(target); setBusy(true); SFX.play('bead')
    WORLD.spinAt = performance.now() / 1000; WORLD.spinWord = items[i].t
    setTimeout(() => { setBusy(false); SFX.play('chime'); setHist((h) => [{ t: items[i].t, T }, ...h].slice(0, 12)) }, 1650)
  }
  useEffect(() => { if (q2 === 1 && !won) win(<>A temperatura mexe nas fatias <b>antes</b> do sorteio. <b>Baixa</b>: a favorita cresce e a roleta quase sempre repete a mesma palavra (previsível). <b>Alta</b>: as fatias se igualam e saem palavras inesperadas (variado). Ela controla a <b>variedade</b>, não a <b>verdade</b>.</>) }, [q2])
  if (guess === null) {
    return (
      <>
        <p className="lead">Antes de mexer, faça uma previsão. Depois de “<b>é</b>”, a palavra favorita é “<b>uma</b>” ({pct(fav(1))}). Se a temperatura <b>subir</b>, o que acontece com a fatia dela?</p>
        <div style={{ display: 'grid', gap: 8 }}>{['Fica maior', 'Fica menor', 'Não muda'].map((o, i) => <button key={o} className="opt" style={{ margin: 0 }} onClick={() => { SFX.play('click'); setGuess(i) }}>{o}</button>)}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginTop: 8 }}>Não tem resposta errada aqui: é um palpite. Você vai testar já já.</div>
      </>
    )
  }
  return (
    <>
      <p className="lead">Depois de “<b>é</b>”, cada palavra tem uma fatia da roleta. Mexa na temperatura, gire e veja o que sai.</p>
      <Wheel items={items} angle={angle} />
      <div className="card" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14 }}><span>🧊 fria</span><span style={{ color: 'var(--gold-2)' }}>temperatura {T.toFixed(1).replace('.', ',')}</span><span>quente 🔥</span></div>
        <input type="range" min={0.2} max={2.5} step={0.1} value={T} onChange={(e) => setT(+e.target.value)} aria-label="Temperatura" />
        <div className="mono" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 2 }}>{items.map((x) => `${x.t} ${pct(x.p)}`).join(' · ')}</div>
      </div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" onClick={spin} disabled={busy}>{busy ? 'Girando…' : 'Girar a roleta 🎡'}</button></div>
      {hist.length > 0 && <div className="row" style={{ gap: 5, marginTop: 8 }}>{hist.map((h, i) => <span key={i} className="chip" style={{ color: h.T <= 0.5 ? '#9fe9ff' : h.T >= 1.5 ? '#ffb35a' : 'var(--muted)' }}>{h.t}</span>)}</div>}
      <div style={{ display: 'grid', gap: 4, marginTop: 10, fontWeight: 800, fontSize: 14 }}>
        <div style={{ color: cold >= 3 ? 'var(--green)' : undefined }}>{cold >= 3 ? '✓' : '○'} Gire 3 vezes com a roleta fria (temperatura até 0,5) · {Math.min(3, cold)}/3</div>
        <div style={{ color: hot >= 3 ? 'var(--green)' : undefined }}>{hot >= 3 ? '✓' : '○'} Gire 3 vezes com a roleta quente (1,5 ou mais) · {Math.min(3, hot)}/3</div>
      </div>
      {cold >= 3 && hot >= 3 && (
        <div className="card" style={{ marginTop: 10, fontWeight: 800, fontSize: 14 }}>
          Seu palpite: “{['Fica maior', 'Fica menor', 'Não muda'][guess]}” {guess === 1 ? '✓ acertou!' : '✗'} A fatia de “uma” foi de {pct(fav(0.5))} (fria, 0,5) para {pct(fav(1.5))} (quente, 1,5). Com temperatura alta, as fatias ficam parecidas.
        </div>
      )}
      {cold >= 3 && hot >= 3 && (
        <div className="card" style={{ marginTop: 10 }}>
          <ScrollHere />
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Para um fato, como “Qual é a capital do Brasil?”, que temperatura costuma ser melhor?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className={'opt' + (q === 'baixa' ? ' right' : '')} style={{ margin: 0, textAlign: 'center' }} onClick={() => { if (q === 'baixa') return; SFX.play('success'); setQ('baixa') }}>{q === 'baixa' ? '✓ ' : ''}🧊 Baixa</button>
            <button className={'opt' + (q === 'alta' ? ' wrong' : '')} style={{ margin: 0, textAlign: 'center' }} onClick={() => { if (q === 'baixa') return; SFX.play('error'); setQ('alta') }}>{q === 'alta' ? '✗ ' : ''}🔥 Alta</button>
          </div>
          {q === 'alta' && <div className="bad">✗ Quente demais! A roleta poderia sortear outra cidade. Para fatos, a roleta fria costuma ajudar.</div>}
          {q === 'baixa' && (
            <div style={{ marginTop: 10 }}>
              <ScrollHere />
              <div style={{ fontWeight: 900, marginBottom: 8 }}>✓ Isso. E com temperatura baixa, a resposta fica garantida como certa?</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {['Sim, temperatura baixa sempre acerta', 'Não: ela só repete a favorita. Se a favorita estiver errada, repete o erro'].map((o, i) => <button key={i} className={'opt' + (q2 === i ? (i === 1 ? ' right' : ' wrong') : '')} style={{ margin: 0 }} onClick={() => { if (q2 === 1) return; SFX.play(i === 1 ? 'success' : 'error'); setQ2(i) }}>{q2 === i ? (i === 1 ? '✓ ' : '✗ ') : ''}{o}</button>)}
              </div>
              {q2 === 0 && <div className="bad">✗ Pense no modelinho que achava “Rio” mais provável: com temperatura baixa, ele diria “Rio” quase sempre!</div>}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ---------- 6. Treinadora Peso: treine os 27 pesos ---------- */
function Treino({ win, won }: P) {
  const st = useRef({ W: MINI.init(), n: 0 })
  const [, force] = useState(0)
  const [hist, setHist] = useState<number[]>(() => [MINI.probs(st.current.W, MINI.K[0].x)[0]])
  const [reading, setReading] = useState('')
  const W = st.current.W
  const p0 = MINI.probs(W, MINI.K[0].x)
  const items = MINI.V.map((t, i) => ({ t, p: p0[i] })).sort((a, b) => b.p - a.p).slice(0, 6)
  const train = (n: number) => {
    if (won) return
    for (let k = 0; k < n; k++) { const e = MINI.EX[st.current.n % MINI.EX.length]; MINI.step(W, MINI.exX(e), MINI.K[e.k].y, 0.8); st.current.n++; setReading(e.s) }
    const pb = MINI.probs(W, MINI.K[0].x)[0]
    setHist((h) => [...h, pb].slice(-80)); force((x) => x + 1); SFX.play(n > 1 ? 'bead' : 'click')
    WORLD.treino = pb
    if (pb >= 0.9) {
      SFX.play('success')
      const pf = MINI.probs(W, MINI.K[1].x), pb2 = MINI.probs(W, MINI.K[2].x)
      win(<>Brasília passou de <b>90%</b> depois de {st.current.n} passos! A cada frase, o modelo chutou, mediu o <b>erro</b> e empurrou cada peso um pouquinho para errar menos. E os mesmos 27 pesos agora dizem <b>Paris</b> ({pct(pf[3])}) para a França e <b>futebol</b> ({pct(pb2[5])}) para “famoso pelo”. Repare no gráfico: a chance nem sempre sobe em linha reta.</>)
    }
  }
  const pb = p0[0]
  const path = hist.map((v, i) => `${(i / Math.max(1, hist.length - 1)) * 200},${60 - v * 56}`).join(' ')
  return (
    <>
      <p className="lead">Pergunta: <b>“A capital do Brasil é ___”</b>. Os pesos começam bagunçados. Cada passo de treino lê uma frase verdadeira e ajusta os 27 pesos.</p>
      <div className="row" style={{ alignItems: 'stretch', gap: 10 }}>
        <div className="card" style={{ flex: '1 1 220px' }}>
          <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>O QUE O MODELO ACHA AGORA</div>
          <Bars items={items} hi="Brasília" max={1} />
        </div>
        <div className="card" style={{ flex: '1 1 200px' }}>
          <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4, color: 'var(--muted)' }}>CHANCE DE BRASÍLIA</div>
          <svg viewBox="0 0 200 64" style={{ width: '100%', height: 70 }}><line x1="0" y1={60 - 0.9 * 56} x2="200" y2={60 - 0.9 * 56} stroke="#4fd18b" strokeDasharray="4 3" /><polyline points={path} fill="none" stroke="#ffd27a" strokeWidth="2.5" /><text x="196" y={60 - 0.9 * 56 - 3} fontSize="9" fill="#4fd18b" textAnchor="end">90%</text></svg>
          <div className="stat">{pct(pb)} · {st.current.n} passos</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--muted)' }}>OS 27 PESOS (9 palavras × 3 pistas)</div>
        <div className="p2grid">{W.map((row, i) => <div key={i} className="r"><span>{MINI.V[i]}</span>{row.map((v, d) => <i key={d} style={{ background: v >= 0 ? `rgba(89,215,255,${Math.min(1, Math.abs(v) / 2.2) * 0.9 + 0.08})` : `rgba(255,122,122,${Math.min(1, Math.abs(v) / 2.2) * 0.9 + 0.08})` }} />)}</div>)}</div>
        {reading && <div style={{ fontSize: 13, fontWeight: 800, marginTop: 6 }}>Lendo agora: <span style={{ color: 'var(--gold-2)' }}>{reading}</span></div>}
      </div>
      {!won && <div className="foot"><button className="btn" onClick={() => train(1)}>Treinar 1 passo</button><button className="btn primary" onClick={() => train(10)}>Treinar 10 passos</button></div>}
    </>
  )
}

/* ---------- 7. Bibliotecária Letícia: buscar antes de responder ---------- */
function DocCard({ d, s, on }: { d: RagDoc; s: number; on?: boolean }) {
  return (
    <div className="card" style={{ padding: '7px 10px', borderColor: on ? 'var(--green)' : undefined, opacity: on ? 1 : 0.75 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 900, fontSize: 13 }}><span>{on ? '📌 ' : ''}{d.t}</span><span className="mono" style={{ color: 'var(--cyan)' }}>{s.toFixed(2).replace('.', ',')}</span></div>
      {on && <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: '#e9e2d0' }}>{d.x}</div>}
    </div>
  )
}
function Rag({ win, won }: P) {
  const [step, setStep] = useState(0)
  const Q1 = 'Que horas a biblioteca abre no sábado?', Q2 = 'Que horas sai o pão de queijo?'
  const Q3 = 'A biblioteca abre no feriado de amanhã?'
  const r1 = ragSearch(Q1, RAG_DOCS), r2 = ragSearch(Q2, RAG_DOCS), r3 = ragSearch(Q2, [...RAG_DOCS, CANTINA]), r4 = ragSearch(Q3, [...RAG_DOCS, CANTINA, AVISO_2019])
  const [p3, setP3] = useState<number | null>(null)
  const go = (s: number) => { SFX.play(s === 1 ? 'error' : 'chime'); setStep(s) }
  const pick3 = (i: number) => {
    if (p3 === 1 || won) return
    setP3(i); SFX.play(i === 1 ? 'success' : 'error')
    if (i === 1) win(<>Sem documentos, a Engine <b>inventou</b> um horário: uma <b>alucinação</b>. Com o <b>RAG</b>, primeiro um buscador acha trechos parecidos (<b>recuperação</b>); depois a Engine escreve com eles no contexto (<b>geração</b>) e mostra a fonte [1]. Mas RAG não é garantia: quando nada é achado, o certo é dizer que não sabe; e um documento achado pode estar <b>velho</b> ou não sustentar a resposta.</>)
  }
  const Lbl = ({ n, t }: { n: number; t: string }) => <div style={{ fontWeight: 900, fontSize: 12.5, letterSpacing: '.06em', color: n === 1 ? 'var(--cyan)' : 'var(--green)', margin: '8px 0 4px' }}>{n} · {t}</div>
  return (
    <>
      <div className="card"><b>Pergunta 1:</b> {Q1}</div>
      {step === 0 && <div className="foot"><button className="btn primary" onClick={() => go(1)}>Perguntar sem buscar</button></div>}
      {step >= 1 && (
        <div className="card" style={{ marginTop: 8, borderColor: '#ff8ad8' }}>
          <div style={{ fontWeight: 900, color: '#ff8ad8', fontSize: 13 }}>👻 HALLUCINO (sem documentos)</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>“Provavelmente das 8h às 12h.”</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ff9a8a', marginTop: 2 }}>Inventado! Soa bem, mas ninguém conferiu.</div>
        </div>
      )}
      {step === 1 && <div className="foot"><button className="btn primary" onClick={() => go(2)}>Ligar a busca (RAG) 🔎</button></div>}
      {step >= 2 && (
        <div style={{ marginTop: 8 }}>
          <Lbl n={1} t="BUSCA (RECUPERAÇÃO): quanto mais alto o número, mais parecido com a pergunta" />
          <div style={{ display: 'grid', gap: 5 }}>{r1.slice(0, 3).map((x, i) => <DocCard key={x.d.t} d={x.d} s={x.s} on={i === 0} />)}</div>
          <Lbl n={2} t="RESPOSTA (GERAÇÃO), com o trecho no contexto" />
          <div className="card" style={{ borderColor: 'var(--green)' }}><div style={{ fontWeight: 800 }}>“Aos sábados, a biblioteca abre das 9h às 13h [1].”</div></div>
        </div>
      )}
      {step === 2 && <div className="foot"><button className="btn primary" onClick={() => go(3)}>Próxima pergunta ▸</button></div>}
      {step >= 3 && (
        <div style={{ marginTop: 10 }}>
          <div className="card"><b>Pergunta 2:</b> {Q2}</div>
          <div style={{ display: 'grid', gap: 5, marginTop: 6 }}>{(step >= 4 ? r3 : r2).slice(0, 2).map((x, i) => <DocCard key={x.d.t} d={x.d} s={x.s} on={i === 0 && x.s > 0.15} />)}</div>
          {step === 3 && <div className="card" style={{ marginTop: 6 }}><div style={{ fontWeight: 900, fontSize: 13, color: 'var(--cyan)' }}>ENGINE</div><div style={{ fontWeight: 800 }}>“Não encontrei isso nos documentos. Prefiro não inventar.”</div></div>}
          {step >= 4 && <div className="card" style={{ marginTop: 6, borderColor: 'var(--green)' }}><div style={{ fontWeight: 900, color: 'var(--green)', fontSize: 13 }}>ENGINE (com o novo documento)</div><div style={{ fontWeight: 800 }}>“O pão de queijo sai às 10h e às 16h [1].”</div></div>}
        </div>
      )}
      {step === 3 && <div className="foot"><button className="btn primary" onClick={() => go(4)}>Adicionar documento: Cantina do campus 📄</button></div>}
      {step === 4 && <div className="foot"><button className="btn primary" onClick={() => go(5)}>Última pergunta ▸</button></div>}
      {step >= 5 && (
        <div style={{ marginTop: 10 }}>
          <ScrollHere />
          <div className="card"><b>Pergunta 3:</b> {Q3}</div>
          <Lbl n={1} t="BUSCA (RECUPERAÇÃO)" />
          <div style={{ display: 'grid', gap: 5 }}>{r4.slice(0, 2).map((x, i) => <DocCard key={x.d.t} d={x.d} s={x.s} on={i === 0} />)}</div>
          <Lbl n={2} t="QUAL RESPOSTA A ENGINE DEVE ESCREVER?" />
          <div style={{ display: 'grid', gap: 8 }}>
            {['“Sim! A biblioteca abre no feriado, das 10h às 14h [1].”', '“Só achei um aviso de 2019, que pode estar desatualizado. Melhor confirmar o horário com a biblioteca [1].”'].map((o, i) => <button key={i} className={'opt' + (p3 === i ? (i === 1 ? ' right' : ' wrong') : '')} style={{ margin: 0 }} onClick={() => pick3(i)}>{p3 === i ? (i === 1 ? '✓ ' : '✗ ') : ''}{o}</button>)}
          </div>
          {p3 === 0 && <div className="bad">✗ Olhe a data do documento: é de 2019. A busca achou um texto parecido com a pergunta, mas ele não garante o horário de amanhã.</div>}
        </div>
      )}
    </>
  )
}

export const P2GAMES: Record<string, { title: string; C: (p: P) => ReactNode }> = {
  prever: { title: 'Você contra a máquina de contar', C: (p) => <Prever {...p} /> },
  tokens: { title: 'A tesoura dos tokens', C: (p) => <Tokens {...p} /> },
  atencao: { title: 'Os holofotes da atenção', C: (p) => <Atencao {...p} /> },
  camadas: { title: 'A tabela de votos', C: (p) => <Camadas {...p} /> },
  roleta: { title: 'A roleta da temperatura', C: (p) => <Roleta {...p} /> },
  treino: { title: 'Treine os 27 pesos', C: (p) => <Treino {...p} /> },
  rag: { title: 'Buscar antes de responder', C: (p) => <Rag {...p} /> },
}

/** Chip de quem apresenta a brincadeira (robôs e outros falantes). */
export function SpeakerChip({ who }: { who: string }) {
  const sp = SPEAKERS[who]
  if (!sp) return null
  return <div className="who-chip"><span className="pf">{sp.face?.()}</span><span style={{ color: sp.color }}>{sp.name}</span></div>
}
/** Moldura de uma brincadeira da Fase 2. */
export function P2GameView({ game, who, onDone }: { game: string; who: string; onDone: () => void }) {
  const [msg, setMsg] = useState<ReactNode>(null)
  const okRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (msg) setTimeout(() => okRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60) }, [msg])
  const G1 = P2GAMES[game]
  useActivity('p2:' + game)
  const win = (m: ReactNode) => { if (!msg) { setMsg(m); SFX.play('discover'); METRICS.done('p2:' + game) } }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <SpeakerChip who={who} />
        <h4>{G1.title}</h4>
        {G1.C({ win, won: !!msg })}
        {msg && <div className="ok">{msg}</div>}
        {msg && <div className="foot" ref={okRef}><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Continuar ▸</button></div>}
      </div>
    </div>
  )
}

/** O caminho da pergunta por dentro da Engine (final da fase). */
export function P2PipelineView({ onDone }: { onDone: () => void }) {
  useActivity('p2:caminho')
  const [k, setK] = useState(0)
  const p = P2_PIPELINE[k]
  const last = k === P2_PIPELINE.length - 1
  useEffect(() => { VOICE.speak(p.t, 'ENGINE') }, [k])
  useEffect(() => () => VOICE.stop(), [])
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <div className="who-chip"><span style={{ color: '#8fe9ff' }}>DENTRO DA LANGUAGE ENGINE · PASSO {k + 1} DE {P2_PIPELINE.length}</span></div>
        <h4>“Qual é a capital do Brasil?”</h4>
        <div style={{ display: 'flex', gap: 4, margin: '6px 0 12px' }}>{P2_PIPELINE.map((_, i) => <i key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= k ? 'var(--cyan)' : 'rgba(255,255,255,.12)' }} />)}</div>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 6, marginBottom: 10 }}>{P2_PIPELINE.slice(0, k + 1).map((s) => <span key={s.k} className="chip" style={{ color: s.k === p.k ? 'var(--gold-2)' : 'var(--cyan)' }}>{s.k}</span>)}</div>
        <div className="card mono" style={{ fontSize: 'clamp(16px, 4.6vw, 24px)', fontWeight: 800, textAlign: 'center', color: last ? 'var(--gold-2)' : 'var(--cyan)', padding: '16px 10px' }} key={k}>{p.show}</div>
        <p className="lead" style={{ marginTop: 12 }}>{p.t}</p>
        {last && <div className="simp">🔍 Caminho simplificado: numa LLM de verdade, a atenção e as tabelas de pesos se alternam dentro de cada uma das dezenas de camadas, e os números mostrados aqui são ilustrativos.</div>}
        <div className="foot">
          {k > 0 && <button className="btn small" onClick={() => { SFX.play('click'); setK(k - 1) }}>◂ Voltar</button>}
          <button className="btn primary" onClick={() => { SFX.play('click'); if (last) { VOICE.stop(); onDone() } else setK(k + 1) }}>{last ? 'Brasília!' : 'Próximo passo ▸'}</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- desafio do final: coloque os passos em ordem ---------- */
const ORDER_HINT = [
  'Tudo começa cortando o texto em pedaços.',
  'Depois de cortar, cada pedaço ganha um número do catálogo.',
  'Com o número, a Engine pega a lista de números do token.',
  'Agora os vetores precisam se misturar com os das vizinhas.',
  'Depois, os vetores sobem a torre, andar por andar.',
  'No topo, cada palavra possível ganha uma chance.',
  'Com as chances prontas, falta sortear.',
  'Por fim, a palavra escolhida entra no texto.',
]
const ORDER_SUB: Record<string, string> = { TOKENS: 'cortar o texto', IDs: 'número do catálogo', VETORES: 'lista de números', 'ATENÇÃO': 'misturar o contexto', CAMADAS: 'andar por andar', CHANCES: 'uma chance por palavra', ROLETA: 'sortear', RESPOSTA: 'escrever a palavra' }
export function P2OrderView({ onDone }: { onDone: () => void }) {
  const shuffled = useMemo(() => { const r = [5, 2, 7, 0, 3, 6, 1, 4]; return r.map((i) => P2_PIPELINE[i].k) }, [])
  const [done, setDone] = useState<string[]>([])
  const [miss, setMiss] = useState(0)
  const [msg, setMsg] = useState('')
  const [sh, shake] = useShake()
  const n = done.length, all = n === P2_PIPELINE.length
  useActivity('p2:ordem')
  useEffect(() => { if (all) METRICS.done('p2:ordem') }, [all])
  useEffect(() => { VOICE.speak('Coloque os passos na ordem: do texto até a resposta.', 'ENGINE') }, [])
  useEffect(() => () => VOICE.stop(), [])
  const tap = (k: string) => {
    if (all || done.includes(k)) return
    if (k === P2_PIPELINE[n].k) { SFX.play('bead'); setDone([...done, k]); setMiss(0); setMsg(''); if (n + 1 === P2_PIPELINE.length) SFX.play('success') }
    else { shake(); if (miss >= 1) METRICS.hint(); setMiss(miss + 1); setMsg((miss >= 1 ? '💡 ' : '') + ORDER_HINT[n]) }
  }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm">
        <div className="who-chip"><span style={{ color: '#8fe9ff' }}>DESAFIO DA LANGUAGE ENGINE</span></div>
        <h4>Coloque os passos na ordem</h4>
        <p className="lead">Do texto até a resposta: toque nos passos na ordem em que a Engine faz cada um.</p>
        <div className="row" style={{ gap: 6, justifyContent: 'flex-start', minHeight: 40 }}>
          {P2_PIPELINE.map((p, i) => <span key={p.k} className="chip" style={{ color: i < n ? 'var(--gold-2)' : 'rgba(255,255,255,.25)' }}>{i + 1}. {i < n ? p.k : '…'}</span>)}
        </div>
        <div className={sh} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}>
          {shuffled.map((k) => {
            const used = done.includes(k), hint = !used && miss >= 2 && k === P2_PIPELINE[n]?.k
            return <button key={k} className={'opt' + (used ? ' right' : '') + (hint ? ' pulse' : '')} style={{ margin: 0, textAlign: 'center' }} disabled={used} onClick={() => tap(k)}>{used ? '✓ ' : ''}<b>{k}</b><br /><small style={{ fontWeight: 700, opacity: 0.8 }}>{ORDER_SUB[k]}</small></button>
          })}
        </div>
        <div className="bad">{msg}</div>
        {all && <div className="ok">Ordem certa! Tokens → IDs → vetores → atenção → camadas → chances → roleta → resposta. E depois tudo recomeça para a próxima palavra.</div>}
        {all && <div className="foot"><button className="btn primary" onClick={() => { VOICE.stop(); onDone() }}>Ver a Engine responder ▸</button></div>}
      </div>
    </div>
  )
}
