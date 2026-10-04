import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SFX } from '../../../engine/audio'
import type { Game } from './stops'

/* =========================================================
   As brincadeiras de cada parada. Curtas, de tocar e ver.
   Cada uma chama win(mensagem) quando o jogador acerta.
   ========================================================= */
type P = { win: (msg: ReactNode) => void; won: boolean }

function useShake(): [string, () => void] {
  const [k, setK] = useState(false)
  return [k ? 'shake' : '', () => { setK(false); requestAnimationFrame(() => setK(true)); SFX.play('error'); setTimeout(() => setK(false), 400) }]
}

/* ---------- 1. Liu Hui: varetas no tabuleiro ---------- */
function Rods({ n, color = '#e8c48a' }: { n: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, minHeight: 26, alignItems: 'center', justifyContent: 'center', minWidth: 44 }}>
      {n === 0 ? <span style={{ opacity: 0.35, fontWeight: 800 }}>·</span> : Array.from({ length: n }, (_, i) => <i key={i} style={{ width: 5, height: 24, borderRadius: 2, background: color, display: 'block', boxShadow: '0 0 4px rgba(0,0,0,.4)' }} />)}
    </span>
  )
}
function Tabela({ win, won }: P) {
  const [col, setCol] = useState([0, 0, 0])
  const rows = ['Feixe bom', 'Feixe médio', 'Feixe fraco']
  const m2 = [2, 3, 1], m3 = [1, 2, 3], target = [3, 2, 1]
  useEffect(() => {
    if (!won && col.every((v, i) => v === target[i])) win(<>Cada número no lugar certo! As <b>linhas</b> são os tipos de feixe e as <b>colunas</b> são as misturas. Somando e subtraindo colunas inteiras, os calculistas chegavam à resposta: bom = 9¼, médio = 4¼, fraco = 2¾. Uma tabela assim, em que o lugar do número importa, é uma <b>matriz</b>.</>)
  }, [col])
  const bump = (r: number, d: number) => { if (won) return; SFX.play('bead'); setCol((c) => c.map((v, i) => (i === r ? Math.max(0, Math.min(6, v + d)) : v))) }
  const cell: React.CSSProperties = { padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }
  return (
    <>
      <p className="lead">Mistura 1: <b>3 feixes bons, 2 médios e 1 fraco</b> rendem 39 medidas. Coloque as varetas de bambu na primeira coluna do tabuleiro.</p>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontWeight: 800, fontSize: 14 }}>
          <thead><tr><th style={cell} /><th style={{ ...cell, color: 'var(--gold-2)' }}>Mistura 1</th><th style={{ ...cell, color: 'var(--muted)' }}>Mistura 2</th><th style={{ ...cell, color: 'var(--muted)' }}>Mistura 3</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r}>
                <td style={{ ...cell, textAlign: 'left', whiteSpace: 'nowrap' }}>{r}</td>
                <td style={cell}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <button className="chipbtn" style={{ minWidth: 34, minHeight: 34, fontSize: 16 }} onClick={() => bump(i, -1)} aria-label={`Tirar vareta de ${r}`}>−</button>
                    <Rods n={col[i]} color={col[i] === target[i] ? '#ffd27a' : '#e8c48a'} />
                    <button className="chipbtn" style={{ minWidth: 34, minHeight: 34, fontSize: 16 }} onClick={() => bump(i, 1)} aria-label={`Pôr vareta em ${r}`}>+</button>
                  </span>
                </td>
                <td style={cell}><Rods n={m2[i]} color="#9fb0d0" /></td>
                <td style={cell}><Rods n={m3[i]} color="#9fb0d0" /></td>
              </tr>
            ))}
            <tr><td style={{ ...cell, textAlign: 'left', color: 'var(--muted)' }}>Total</td><td style={{ ...cell, color: 'var(--cyan)' }}>39</td><td style={{ ...cell, color: 'var(--cyan)' }}>34</td><td style={{ ...cell, color: 'var(--cyan)' }}>26</td></tr>
          </tbody>
        </table>
      </div>
      {won && <div className="stat" style={{ marginTop: 10 }}>[ 3 2 1 ]<br />[ 2 3 2 ]<br />[ 1 1 3 ]</div>}
    </>
  )
}

/* ---------- 2. Al-Khwarizmi: a receita da soma ---------- */
const STEPS = [
  'Some as unidades: 8 + 4 = 12',
  'Escreva o 2 nas unidades e “vai um” para as dezenas',
  'Some as dezenas: 4 + 2 + o 1 que veio = 7',
  'Escreva o 7 nas dezenas: o resultado é 72',
]
const SHUF = [2, 0, 3, 1]
function Passos({ win, won }: P) {
  const [placed, setPlaced] = useState<number[]>([])
  const [bad, setBad] = useState('')
  const [sh, shake] = useShake()
  const pick = (k: number) => {
    if (won || placed.includes(k)) return
    if (k === placed.length) { SFX.play('click'); setBad(''); const nx = [...placed, k]; setPlaced(nx); if (nx.length === 4) win(<>Pronto: <b>48 + 24 = 72</b>. E a receita funciona com <b>qualquer</b> par de números, sem precisar de um especialista. Uma receita assim, de passos bem definidos, é um <b>algoritmo</b>, e é só isso que um computador sabe seguir.</>) }
    else { shake(); setBad('Ainda não! Qual passo vem antes deste?') }
  }
  const n = placed.length
  return (
    <>
      <p className="lead">Com <s style={{ opacity: 0.6 }}>XLVIII + XXIV</s> ninguém sabia por onde começar. Com <b>48 + 24</b> existe uma receita. Toque nos passos na ordem certa.</p>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card mono" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, textAlign: 'right', minWidth: 96 }}>
          <div style={{ fontSize: 14, height: 16, color: 'var(--gold-2)' }}>{n >= 2 ? '1 ' : ''}</div>
          <div>48</div><div>+ 24</div>
          <div style={{ borderTop: '2px solid var(--muted)', color: 'var(--cyan)' }}>{n >= 4 ? '72' : n >= 2 ? '?2' : '??'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }} className={sh}>
          {SHUF.map((k) => {
            const pos = placed.indexOf(k)
            return <button key={k} className={'step' + (pos >= 0 ? ' done' : '')} onClick={() => pick(k)}>{pos >= 0 && <b>{pos + 1}.</b>}{STEPS[k]}</button>
          })}
        </div>
      </div>
      <div className="bad">{bad}</div>
    </>
  )
}

/* ---------- 3. Pascal: dois dados ---------- */
const WAYS = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]
function Dados({ win, won }: P) {
  const [guess, setGuess] = useState<number | null>(null)
  const [counts, setCounts] = useState<number[]>(Array(11).fill(0))
  const [n, setN] = useState(0)
  const [rolling, setRolling] = useState(false)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const roll = () => {
    if (rolling || guess == null) return
    setRolling(true); SFX.play('bead')
    const c = Array(11).fill(0); let k = 0
    const step = () => {
      for (let i = 0; i < 40 && k < 3600; i++, k++) { const s = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6); c[s - 2]++ }
      setCounts([...c]); setN(k)
      if (k % 400 === 0) SFX.play('bead')
      if (k < 3600) raf.current = requestAnimationFrame(step)
      else {
        setRolling(false)
        win(<>{guess === 7 ? <>Acertou! </> : <>Você apostou no {guess}, mas o <b>7</b> venceu. </>}O 7 tem <b>6 jeitos</b> de sair (1+6, 2+5, 3+4, 4+3, 5+2, 6+1). O 2 e o 12 só têm 1 jeito cada. Ninguém sabe o próximo lance, mas a chance dá para calcular: o 7 sai em 6 de 36 casos, uns <b>17%</b>. Isso é <b>probabilidade</b>.</>)
      }
    }
    raf.current = requestAnimationFrame(step)
  }
  const max = Math.max(1, ...counts)
  return (
    <>
      <p className="lead">{guess == null ? 'Jogando dois dados e somando, qual soma você acha que sai mais vezes? Aposte:' : n === 0 ? `Você apostou no ${guess}. Agora vamos jogar os dados 3.600 vezes!` : `Jogadas: ${n.toLocaleString('pt-BR')}`}</p>
      {n === 0 && (
        <div className="row" style={{ marginBottom: 10 }}>
          {Array.from({ length: 11 }, (_, i) => i + 2).map((s) => <button key={s} className={'chipbtn' + (guess === s ? ' on' : '')} onClick={() => { if (!rolling) { SFX.play('click'); setGuess(s) } }}>{s}</button>)}
        </div>
      )}
      <svg viewBox="0 0 330 150" style={{ width: '100%', maxHeight: 190, display: 'block' }}>
        {counts.map((c, i) => {
          const h = (c / max) * 110, x = 8 + i * 29.5, s = i + 2
          return (
            <g key={i}>
              <rect x={x} y={124 - h} width={22} height={h} rx={3} fill={won && s === 7 ? '#ffd27a' : s === guess ? '#59d7ff' : '#4a5a86'} />
              {won && <rect x={x} y={124 - (WAYS[i] / 6) * 110 * (counts[5] / max)} width={22} height={2} fill="#fff" opacity={0.6} />}
              <text x={x + 11} y={140} textAnchor="middle" fontSize={11} fill={s === guess ? '#59d7ff' : '#cfd6ea'} fontWeight={800}>{s}</text>
              {won && <text x={x + 11} y={118 - h} textAnchor="middle" fontSize={8.5} fill="#e9e2d0">{WAYS[i]}/36</text>}
            </g>
          )
        })}
      </svg>
      {n === 0 && <div className="foot"><button className="btn primary" disabled={guess == null} onClick={roll} style={{ opacity: guess == null ? 0.5 : 1 }}>Jogar os dados</button></div>}
    </>
  )
}

/* ---------- 4. Leibniz: lâmpadas binárias ---------- */
const TARGETS = [5, 10, 13]
function Binario({ win, won }: P) {
  const [on, setOn] = useState([false, false, false, false])
  const [ti, setTi] = useState(0)
  const [flash, setFlash] = useState(false)
  const vals = [8, 4, 2, 1]
  const sum = on.reduce((a, b, i) => a + (b ? vals[i] : 0), 0)
  const bin = on.map((b) => (b ? '1' : '0')).join('')
  useEffect(() => {
    if (won || flash || sum !== TARGETS[ti]) return
    setFlash(true); SFX.play('success')
    const id = setTimeout(() => {
      setFlash(false)
      if (ti === TARGETS.length - 1) win(<><b>13 = 1101</b>: um 8, um 4, nenhum 2 e um 1. Com 4 lâmpadas dá para escrever de 0 a 15; com mais lâmpadas, qualquer número. Ligado ou desligado, 1 ou 0: é assim que o computador guarda <b>tudo</b>.</>)
      else { setTi(ti + 1); setOn([false, false, false, false]) }
    }, 1100)
    return () => clearTimeout(id)
  }, [sum, ti, won])
  return (
    <>
      <p className="lead">Cada lâmpada vale o dobro da vizinha. Acenda as lâmpadas certas para escrever o número <b style={{ color: 'var(--gold-2)', fontSize: 20 }}>{TARGETS[ti]}</b>.</p>
      <div className="row" style={{ gap: 14, margin: '6px 0 10px' }}>
        {vals.map((v, i) => (
          <button key={v} onClick={() => { if (won || flash) return; SFX.play('click'); setOn((o) => o.map((x, j) => (j === i ? !x : x))) }} aria-pressed={on[i]} aria-label={`Lâmpada que vale ${v}`}
            style={{ width: 64, height: 86, borderRadius: 16, border: '2px solid ' + (on[i] ? '#ffe2a3' : 'rgba(255,255,255,.2)'), background: on[i] ? 'radial-gradient(circle at 50% 35%, #fff6c8, #f2b84a)' : 'rgba(255,255,255,.04)', color: on[i] ? '#3a2408' : 'var(--muted)', boxShadow: on[i] ? '0 0 26px rgba(255,210,122,.7)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
            <span style={{ fontSize: 28, fontFamily: 'var(--f-mono)' }}>{on[i] ? 1 : 0}</span>
            <span style={{ fontSize: 13 }}>vale {v}</span>
          </button>
        ))}
      </div>
      <div className="stat" style={{ fontSize: 20, color: flash ? 'var(--green)' : 'var(--cyan)' }}>{bin} = {sum}{flash ? '  ✓' : ''}</div>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>Número {ti + 1} de {TARGETS.length}</div>
    </>
  )
}

/* ---------- 5. Gauss: a linha que erra menos ---------- */
const PX = [1, 2, 3, 4, 5, 6], PY = [1.9, 2.3, 3.6, 4.0, 5.5, 5.5]
function lsq() {
  const n = PX.length, mx = PX.reduce((a, b) => a + b) / n, my = PY.reduce((a, b) => a + b) / n
  let sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) { sxy += (PX[i] - mx) * (PY[i] - my); sxx += (PX[i] - mx) ** 2 }
  const a = sxy / sxx, b = my - a * mx
  return { a, b, e: err(a, b) }
}
function err(a: number, b: number) { let s = 0; for (let i = 0; i < PX.length; i++) s += (PY[i] - (a * PX[i] + b)) ** 2; return s }
function Erro({ win, won }: P) {
  const best = useMemo(lsq, [])
  const [a, setA] = useState(0.1)
  const [b, setB] = useState(3.6)
  const e = err(a, b), e0 = useMemo(() => err(0.1, 3.6), [])
  const goal = best.e * 1.5 + 0.4
  useEffect(() => { if (!won && e <= goal) { SFX.play('success'); win(<>Ceres reapareceu bem onde a linha apontava! Esse é o caminho que <b>erra menos</b>: o método dos mínimos quadrados. Treinar uma LLM é parecido: o computador ajusta bilhões de números, um pouquinho de cada vez, sempre para o lado que <b>diminui o erro</b>.</>) } }, [e])
  const W = 330, H = 210, sx = (x: number) => 20 + x * 42, sy = (y: number) => H - 18 - y * 25
  return (
    <>
      <p className="lead">As estrelinhas são as medições do asteroide Ceres (todas um pouco erradas). Mexa na linha para passar o mais perto possível de todas: deixe as linhas vermelhas curtinhas.</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 'min(240px, 34vh)', display: 'block', background: '#070b18', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1={sx(i)} y1={10} x2={sx(i)} y2={H - 18} stroke="rgba(255,255,255,.05)" />)}
        {PX.map((x, i) => <line key={i} x1={sx(x)} y1={sy(PY[i])} x2={sx(x)} y2={sy(a * x + b)} stroke="#ff6a6a" strokeWidth={2.5} />)}
        <line x1={sx(0)} y1={sy(b)} x2={sx(7.2)} y2={sy(a * 7.2 + b)} stroke={won ? '#4fd18b' : '#59d7ff'} strokeWidth={3} />
        {PX.map((x, i) => <text key={i} x={sx(x)} y={sy(PY[i]) + 5} textAnchor="middle" fontSize={16} fill="#ffe08a">✦</text>)}
        {won && <><circle cx={sx(7)} cy={sy(a * 7 + b)} r={9} fill="none" stroke="#ffd27a" strokeWidth={2} /><text x={sx(7) - 6} y={sy(a * 7 + b) - 14} textAnchor="end" fontSize={11} fill="#ffd27a" fontWeight={800}>Ceres!</text></>}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', alignItems: 'center', marginTop: 10, fontWeight: 800, fontSize: 14 }}>
        <span>Inclinação</span><input type="range" min={0} max={1.6} step={0.02} value={a} disabled={won} onChange={(ev) => setA(+ev.target.value)} aria-label="Inclinação da linha" />
        <span>Altura</span><input type="range" min={-1} max={4} step={0.05} value={b} disabled={won} onChange={(ev) => setB(+ev.target.value)} aria-label="Altura da linha" />
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}><span>Erro total</span><span className="mono" style={{ color: e <= goal ? 'var(--green)' : '#ff9a8a' }}>{e.toFixed(1)}</span></div>
        <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,.08)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: Math.min(100, (e / e0) * 100) + '%', background: e <= goal ? 'var(--green)' : 'linear-gradient(90deg, #ffb35a, #ff6a6a)', transition: 'width .15s' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: (goal / e0) * 100 + '%', width: 2, background: '#fff' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginTop: 3 }}>Leve o erro até a marca branca.</div>
      </div>
    </>
  )
}

/* ---------- 6. Cayley: a matriz que gira ---------- */
type M2 = [[number, number], [number, number]]
const CARDS: { name: string; m: M2 }[] = [
  { name: 'Esticar', m: [[2, 0], [0, 2]] },
  { name: 'Espelhar', m: [[-1, 0], [0, 1]] },
  { name: 'Girar', m: [[0, -1], [1, 0]] },
]
const V0 = [2, 1], STAR = [-1, 2]
const fmt = (n: number) => (n < 0 ? '−' + -n : String(n))
function Mat({ m }: { m: M2 }) {
  return (
    <span className="mono" style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', gap: '0 8px', padding: '2px 8px', borderLeft: '2px solid var(--gold-2)', borderRight: '2px solid var(--gold-2)', borderRadius: 4, fontWeight: 800, fontSize: 15 }}>
      {m.flat().map((v, i) => <span key={i} style={{ textAlign: 'right', minWidth: 14 }}>{fmt(v)}</span>)}
    </span>
  )
}
function Vetor({ win, won }: P) {
  const [pick, setPick] = useState<number | null>(null)
  const [bad, setBad] = useState('')
  const m = pick != null ? CARDS[pick].m : null
  const r = m ? [m[0][0] * V0[0] + m[0][1] * V0[1], m[1][0] * V0[0] + m[1][1] * V0[1]] : null
  const choose = (i: number) => {
    if (won) return
    SFX.play('click'); setPick(i)
    const mm = CARDS[i].m, rr = [mm[0][0] * V0[0] + mm[0][1] * V0[1], mm[1][0] * V0[0] + mm[1][1] * V0[1]]
    if (rr[0] === STAR[0] && rr[1] === STAR[1]) { setBad(''); setTimeout(() => { SFX.play('success'); win(<>Girou 90° e chegou na estrela! Cada número novo nasce de <b>uma linha encontrando a coluna</b>: multiplica par por par e soma tudo. Uma LLM faz isso <b>trilhões</b> de vezes para escrever uma resposta.</>) }, 500) }
    else { SFX.play('error'); setBad(`A seta foi para (${fmt(rr[0])}, ${fmt(rr[1])}), mas a estrela está em (−1, 2). Tente outra matriz!`) }
  }
  const S = 22, cx = 110, cy = 110, X = (x: number) => cx + x * S, Y = (y: number) => cy - y * S
  const arrow = (v: number[], col: string) => {
    const ang = Math.atan2(-v[1], v[0]), ex = X(v[0]), ey = Y(v[1])
    return <g><line x1={cx} y1={cy} x2={ex} y2={ey} stroke={col} strokeWidth={4} strokeLinecap="round" /><polygon points={`${ex},${ey} ${ex - 11 * Math.cos(ang - 0.45)},${ey - 11 * Math.sin(ang - 0.45)} ${ex - 11 * Math.cos(ang + 0.45)},${ey - 11 * Math.sin(ang + 0.45)}`} fill={col} /></g>
  }
  return (
    <>
      <p className="lead">A seta é o vetor <b className="mono">(2, 1)</b>. Escolha a matriz que, multiplicada pela seta, leva a ponta até a <b style={{ color: 'var(--gold-2)' }}>estrela</b>.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <svg viewBox="0 0 220 220" style={{ width: 200, maxWidth: '48%', background: '#070b18', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)' }}>
          {Array.from({ length: 9 }, (_, i) => i - 4).map((k) => <g key={k}><line x1={X(k)} y1={Y(-4.6)} x2={X(k)} y2={Y(4.6)} stroke={k === 0 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.07)'} /><line x1={X(-4.6)} y1={Y(k)} x2={X(4.6)} y2={Y(k)} stroke={k === 0 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.07)'} /></g>)}
          <text x={X(STAR[0])} y={Y(STAR[1]) + 7} textAnchor="middle" fontSize={22} fill="#ffd27a">★</text>
          {arrow(V0, 'rgba(89,215,255,.45)')}
          {r && arrow(r, won ? '#4fd18b' : '#ffb35a')}
        </svg>
        <div style={{ flex: 1, minWidth: 170, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CARDS.map((c, i) => (
            <button key={c.name} className={'step' + (pick === i ? ' done' : '')} onClick={() => choose(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <Mat m={c.m} /> <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      {m && r && (
        <div className="card mono" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
          linha 1 × seta: ({fmt(m[0][0])})·2 + ({fmt(m[0][1])})·1 = <b style={{ color: 'var(--cyan)' }}>{fmt(r[0])}</b><br />
          linha 2 × seta: ({fmt(m[1][0])})·2 + ({fmt(m[1][1])})·1 = <b style={{ color: 'var(--cyan)' }}>{fmt(r[1])}</b>
        </div>
      )}
      <div className="bad">{bad}</div>
    </>
  )
}

/* ---------- 7. Markov: o que vem depois? ---------- */
const SENT: [string, string, string?][] = [['o céu é', 'azul'], ['o mar é', 'azul'], ['a noite é', 'escura'], ['o céu é', 'azul', 'de dia'], ['o jardim é', 'lindo'], ['a camisa é', 'azul']]
function Proxima({ win, won }: P) {
  const [done, setDone] = useState<boolean[]>(SENT.map(() => false))
  const [bad, setBad] = useState('')
  const [sh, shake] = useShake()
  const all = done.every(Boolean)
  const bins: Record<string, number> = {}
  SENT.forEach(([, w], i) => { if (done[i]) bins[w] = (bins[w] || 0) + 1 })
  const words = ['azul', 'escura', 'lindo']
  const answer = (w: string) => {
    if (won) return
    if (w === 'azul') { SFX.play('success'); win(<>Depois de “é”, veio “azul” <b>4 vezes em 6</b>: uns 67%. Por isso a aposta é “azul”, mesmo que “escura” também possa aparecer. Markov fez isso com letras; uma LLM faz com palavras, olhando muito mais do que só a palavra de antes. Prever <b>a próxima palavra</b> pelas contagens: esse é o coração de uma LLM.</>) }
    else { shake(); setBad('Pode acontecer, mas é menos provável. Aposte no que apareceu mais!') }
  }
  return (
    <>
      <p className="lead">{all ? 'Agora complete a frase com a palavra mais provável:' : 'Toque na palavra que vem depois de “é” em cada frase, para contar.'}</p>
      <div className="card" style={{ display: 'grid', gap: 6 }}>
        {SENT.map(([a, w, z], i) => (
          <div key={i} style={{ fontSize: 16, fontWeight: 700 }}>
            {a} <button onClick={() => { if (!done[i]) { SFX.play('count'); setDone((d) => d.map((x, j) => (j === i ? true : x))) } }} disabled={done[i]}
              style={{ padding: '2px 10px', borderRadius: 10, border: '1.5px solid ' + (done[i] ? 'rgba(255,255,255,.15)' : 'var(--gold)'), background: done[i] ? 'transparent' : 'rgba(232,182,90,.15)', color: done[i] ? 'var(--muted)' : 'var(--gold-2)', fontWeight: 900 }}>{w}</button>{z ? ' ' + z : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
        {words.map((w) => {
          const c = bins[w] || 0
          return (
            <div key={w} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 74px', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
              <span>{w}</span>
              <div style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}><div style={{ height: '100%', width: (c / 6) * 100 + '%', background: w === 'azul' ? '#59d7ff' : '#a98bff', transition: 'width .3s' }} /></div>
              <span className="mono" style={{ textAlign: 'right' }}>{c}{all ? ` · ${Math.round((c / 6) * 100)}%` : ''}</span>
            </div>
          )
        })}
      </div>
      {all && (
        <div className={sh} style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>O céu é ___</div>
          <div className="row">{words.map((w) => <button key={w} className="btn small" onClick={() => answer(w)}>{w}</button>)}</div>
        </div>
      )}
      <div className="bad">{bad}</div>
    </>
  )
}

/* ---------- 8. Shannon: adivinhe com sim ou não ---------- */
function Bits({ win, won }: P) {
  const secret = useMemo(() => 1 + Math.floor(Math.random() * 16), [])
  const [lo, setLo] = useState(1)
  const [hi, setHi] = useState(16)
  const [q, setQ] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [bad, setBad] = useState('')
  const ask = (x: number) => {
    if (won) return
    if (x < lo || x >= hi) { setBad(x === hi && lo < hi ? 'Perguntar “maior que ' + x + '?” não ajuda: escolha um número aceso menor.' : 'Esse número já foi descartado.'); SFX.play('error'); return }
    setBad('')
    const yes = secret > x
    const nl = yes ? x + 1 : lo, nh = yes ? hi : x
    const nq = q + 1
    SFX.play(yes ? 'click' : 'tick')
    setLo(nl); setHi(nh); setQ(nq); setLog((l) => [...l, `É maior que ${x}? ${yes ? 'Sim' : 'Não'}.`])
    if (nl === nh) setTimeout(() => { SFX.play('success'); win(<>É o <b>{secret}</b>! Você usou {nq} pergunta{nq > 1 ? 's' : ''}. {nq <= 4 ? 'Perfeito: cada pergunta cortou as opções pela metade.' : 'Dá para fazer com 4: pergunte sempre pelo meio do que sobrou.'} 16 = 2×2×2×2, então bastam <b>4 perguntas de sim ou não: 4 bits</b>. Cada bit é a resposta a uma dessas perguntas.</>) }, 300)
  }
  return (
    <>
      <p className="lead">Pensei num número de 1 a 16. Toque num número para perguntar: <b>“É maior que ele?”</b></p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
        {Array.from({ length: 16 }, (_, i) => i + 1).map((x) => {
          const alive = x >= lo && x <= hi
          return <button key={x} className="chipbtn" onClick={() => ask(x)} style={{ minWidth: 0, minHeight: 44, fontSize: 16, opacity: alive ? 1 : 0.22, borderColor: won && x === secret ? 'var(--green)' : undefined, background: won && x === secret ? 'rgba(79,209,139,.25)' : undefined }}>{x}</button>
        })}
      </div>
      <div className="stat">Perguntas: {q}</div>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 700, minHeight: 20 }}>{log.slice(-2).join('  ·  ')}</div>
      <div className="bad">{bad}</div>
    </>
  )
}

/* ---------- 9. Rosenblatt: treine o neurônio ---------- */
const CLUES = ['tem bigodes', 'late', 'mia']
const ANIMALS = [
  { n: 'Gato', e: '🐱', c: [1, 0, 1], cat: true },
  { n: 'Cachorro', e: '🐶', c: [1, 1, 0], cat: false },
  { n: 'Foca', e: '🦭', c: [1, 0, 0], cat: false },
  { n: 'Papagaio que imita miado', e: '🦜', c: [0, 0, 1], cat: false },
]
const TIPS = [
  'O gato está ficando de fora: aumente o peso de alguma pista que ele tem.',
  'O cachorro late e não é gato: o peso de “late” devia ser menor.',
  'A foca tem bigodes, mas não é gato: só “bigodes” não pode bastar.',
  'O papagaio só imita o miado: só “mia” não pode bastar.',
]
function Neuronio({ win, won }: P) {
  const [w, setW] = useState([2, 1, 0])
  const [tip, setTip] = useState('')
  const res = ANIMALS.map((a) => { const s = a.c.reduce((t, v, i) => t + v * w[i], 0); return { s, says: s >= 2 } })
  const allOk = res.every((r, i) => r.says === ANIMALS[i].cat)
  useEffect(() => { if (!won && allOk) { SFX.play('success'); win(<>Todos certos! Ninguém escreveu a regra “gato tem bigode e mia”: você só ajustou os <b>pesos</b> olhando os erros. O Perceptron fazia esses ajustes sozinho. Uma LLM faz o mesmo, com <b>bilhões de pesos</b>.</>) } }, [allOk])
  const bump = (i: number, d: number) => { if (won) return; SFX.play('click'); setTip(''); setW((x) => x.map((v, j) => (j === i ? Math.max(-2, Math.min(2, v + d)) : v))) }
  const wrong = res.findIndex((r, i) => r.says !== ANIMALS[i].cat)
  return (
    <>
      <p className="lead">O neurônio soma os pesos das pistas que o bicho tem. Se a soma der <b>2 ou mais</b>, ele acende: “É gato!”. Ajuste os pesos até ele acertar os quatro.</p>
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        {CLUES.map((c, i) => (
          <div key={c} className="card" style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5 }}>{c}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
              <button className="chipbtn" style={{ minWidth: 34, minHeight: 34, fontSize: 16 }} onClick={() => bump(i, -1)} aria-label={`Diminuir peso de ${c}`}>−</button>
              <span className="mono" style={{ fontSize: 20, fontWeight: 900, minWidth: 30, color: w[i] > 0 ? 'var(--green)' : w[i] < 0 ? '#ff9a8a' : 'var(--muted)' }}>{w[i] > 0 ? '+' + w[i] : fmt(w[i])}</span>
              <button className="chipbtn" style={{ minWidth: 34, minHeight: 34, fontSize: 16 }} onClick={() => bump(i, 1)} aria-label={`Aumentar peso de ${c}`}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {ANIMALS.map((a, i) => {
          const r = res[i], ok = r.says === a.cat
          return (
            <div key={a.n} className="card" style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto', alignItems: 'center', gap: 8, padding: '6px 10px', borderColor: ok ? 'rgba(79,209,139,.5)' : 'rgba(255,122,122,.6)' }}>
              <span style={{ fontSize: 24 }}>{a.e}</span>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{a.n}<br /><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{CLUES.filter((_, j) => a.c[j]).join(' · ')}</span></span>
              <span className="mono" style={{ fontSize: 13 }}>soma {fmt(r.s)}</span>
              <span style={{ fontWeight: 900, fontSize: 13, color: r.says ? 'var(--gold-2)' : 'var(--muted)', minWidth: 92, textAlign: 'right' }}>{r.says ? '💡 É gato!' : 'não é gato'} {ok ? '✓' : '✗'}</span>
            </div>
          )
        })}
      </div>
      {!won && <div className="foot" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gold-2)', flex: 1 }}>{tip}</span><button className="btn small ghost" onClick={() => setTip(wrong >= 0 ? TIPS[wrong] : '')}>Dica</button></div>}
    </>
  )
}

export const GAMES: Record<Game, { title: string; C: (p: P) => ReactNode }> = {
  tabela: { title: 'O tabuleiro de varetas', C: (p) => <Tabela {...p} /> },
  passos: { title: 'A receita da soma', C: (p) => <Passos {...p} /> },
  dados: { title: 'Dois dados, milhares de vezes', C: (p) => <Dados {...p} /> },
  binario: { title: 'Lâmpadas que contam', C: (p) => <Binario {...p} /> },
  erro: { title: 'Onde está Ceres?', C: (p) => <Erro {...p} /> },
  vetor: { title: 'A matriz que transforma', C: (p) => <Vetor {...p} /> },
  proxima: { title: 'Contando o que vem depois', C: (p) => <Proxima {...p} /> },
  bits: { title: 'Sim ou não?', C: (p) => <Bits {...p} /> },
  neuronio: { title: 'Treine o neurônio', C: (p) => <Neuronio {...p} /> },
}
