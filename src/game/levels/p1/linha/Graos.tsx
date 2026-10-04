import * as THREE from 'three'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { G, useGame } from '../../../store'
import { SFX } from '../../../engine/audio'
import { VOICE } from '../../../engine/voice'
import { RT } from '../../../engine/runtime'
import type { Ctx } from '../../../engine/script'
import { STOPS } from './stops'
import { holo, PersonFace } from './people'
import { show, openDoc } from './Doc'
import { GRAIN, RECORDS, VALUES, type GK } from './Village'
import { VILLAGE as V, type V3 } from './layout'

/* =========================================================
   FASE 1 · PARTE 2 — O MISTÉRIO DOS TRÊS GRÃOS
   “Como descobrir algo que nunca foi medido diretamente?”
   Cenas 1–3 na banca do comerciante, 4–9 na mesa de madeira,
   10 na balança e 11 (a grande ideia) com Liu Hui narrando.
   A matemática só aparece quando já é necessária (cena 7).
   ========================================================= */
export const BIG = 'l1big'
const NAME: Record<GK, string> = { B: 'superior', M: 'médio', F: 'inferior' }

/* ---------- ícones ---------- */
/** Feixe de arroz desenhado (espiga verde, amarela ou vermelha). */
export function SI({ k, dim = false, size = 24, plus }: { k: GK; dim?: boolean; size?: number; plus?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: 'none', opacity: dim ? 0.16 : 1, transition: 'opacity .6s', verticalAlign: 'middle' }} aria-hidden>
      <svg viewBox="0 0 20 28" width={size * 0.72} height={size}>
        <ellipse cx="10" cy="14.5" rx="6.6" ry="11.2" transform="rotate(-16 10 14.5)" fill={GRAIN[k]} stroke="rgba(0,0,0,.4)" strokeWidth="1.3" />
        <ellipse cx="7.6" cy="10" rx="1.8" ry="4" transform="rotate(-16 7.6 10)" fill="rgba(255,255,255,.5)" />
        <path d="M12.6 3.6 Q14 1.2 16.4 0.8" stroke="#6a8a2a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      {plus && <b style={{ position: 'absolute', right: -9, top: -6, fontSize: 10, fontWeight: 900, color: '#ffe2a3', background: '#5a3a10', borderRadius: 6, padding: '0 3px' }}>{plus}</b>}
    </span>
  )
}
/** Texto com ícones: [B], [M] e [F] viram feixes. */
export function rich(t: string, size = 20): ReactNode {
  return t.split(/(\[[BMF]\])/).map((p, i) => (/^\[[BMF]\]$/.test(p) ? <SI key={i} k={p[1] as GK} size={size} /> : <span key={i}>{p}</span>))
}
/** Uma mistura: os feixes agrupados por tipo. dim = quantos de cada tipo ficam apagados. */
function Mix({ n, dim = [0, 0, 0], size = 26 }: { n: number[]; dim?: number[]; size?: number }) {
  const label = (['B', 'M', 'F'] as GK[]).map((k, j) => `${n[j]} ${NAME[k]}${n[j] > 1 ? 's' : ''}`).join(', ')
  return (
    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }} role="img" aria-label={label}>
      {(['B', 'M', 'F'] as GK[]).map((k, j) => n[j] > 0 && (
        <span key={k} style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: n[j] }, (_, t) => <SI key={t} k={k} size={size} dim={t < dim[j]} />)}</span>
      ))}
    </span>
  )
}
function Opts({ opts, onPick, wrong, right }: { opts: ReactNode[]; onPick: (i: number) => void; wrong: number[]; right: number | null }) {
  return <div className="row" style={{ gap: 8 }}>{opts.map((o, i) => <button key={i} className={'btn small' + (right === i ? ' primary' : '')} style={{ opacity: wrong.includes(i) ? 0.45 : 1 }} disabled={right != null} onClick={() => onPick(i)}>{o}</button>)}</div>
}
function useQuiz(correct: number, onRight: () => void) {
  const [wrong, setWrong] = useState<number[]>([])
  const [right, setRight] = useState<number | null>(null)
  const [sh, setSh] = useState(false)
  const pick = (i: number) => {
    if (right != null) return
    if (i === correct) { setRight(i); SFX.play('success'); onRight() }
    else { setWrong((w) => [...w, i]); SFX.play('error'); setSh(false); requestAnimationFrame(() => setSh(true)) }
  }
  return { wrong, right, pick, shake: sh ? 'shake' : '' }
}

/* ---------- a mesa (cenas 4 a 9) ---------- */
type Step = 'org' | 'same' | 'diff' | 'math' | 'pick' | 'sub' | 'rev'
const FACTS: Record<string, string> = { BM: '[B] = [M] + 5', MF: '[M] + [F] = 7', M: '[M] = 4,25', B: '[B] = 9,25', F: '[F] = 2,75' }

export function MesaView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('org')
  const [facts, setFacts] = useState<string[]>([])
  const addFact = (k: string) => setFacts((f) => (f.includes(k) ? f : [...f, k]))
  const box = useRef<HTMLDivElement>(null)
  const go = (s: Step) => { SFX.play('click'); setStep(s); box.current?.scrollTo({ top: 0 }) }
  const title: Record<Step, string> = { org: 'A mesa de madeira', same: 'A primeira descoberta', diff: 'Comparando as sobras', math: 'Agora a matemática aparece', pick: 'Uma descoberta não basta', sub: 'A segunda descoberta', rev: 'A mesa muda' }
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm" ref={box} style={{ width: 'min(720px, 100%)' }}>
        <div className="who-chip"><span style={{ color: '#ffd27a' }}>O MISTÉRIO DOS TRÊS GRÃOS</span></div>
        <h4>{title[step]}</h4>
        {step === 'org' && <Org next={() => go('same')} />}
        {step === 'same' && <Same next={() => go('diff')} />}
        {step === 'diff' && <Diff next={() => go('math')} addFact={addFact} />}
        {step === 'math' && <MathStep next={() => go('pick')} />}
        {step === 'pick' && <Pick next={() => go('sub')} />}
        {step === 'sub' && <Sub next={() => go('rev')} addFact={addFact} />}
        {step === 'rev' && <Rev done={() => { SFX.play('click'); onDone() }} />}
        {facts.length > 0 && step !== 'rev' && (
          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 12, background: 'rgba(232,182,90,.08)', border: '1px dashed rgba(232,182,90,.45)', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
            <span style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--gold)' }}>DESCOBERTAS</span>
            {facts.map((f) => <span key={f} className="mono">{rich(FACTS[f], 18)}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

/** Cena 4: organizar os registros na mesa. */
function Org({ next }: { next: () => void }) {
  const [cells, setCells] = useState([[0, 0, 0], [0, 0, 0], [0, 0, 0]])
  const ok = cells.every((r, i) => r.every((v, j) => v === RECORDS[i].n[j]))
  useEffect(() => { if (ok) SFX.play('success') }, [ok])
  const tap = (i: number, j: number) => { if (ok) return; SFX.play('bead'); setCells((c) => c.map((r, a) => r.map((v, b) => (a === i && b === j ? (v + 1) % 4 : v)))) }
  const td: React.CSSProperties = { padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }
  return (
    <>
      <p className="lead">Conte os feixes de cada registro e anote na mesa. Toque num quadrinho para mudar o número.</p>
      <div className="row" style={{ gap: 8, marginBottom: 10, justifyContent: 'flex-start' }}>
        {RECORDS.map((r, i) => (
          <div key={i} className="card" style={{ flex: '1 1 190px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '.1em', color: 'var(--muted)' }}>REGISTRO {i + 1}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginTop: 4 }}><Mix n={r.n} size={22} /><b className="mono" style={{ color: 'var(--cyan)' }}>{r.total} dou</b></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontWeight: 800, fontSize: 14 }}>
          <thead><tr>
            <th style={td}>Experimento</th>
            {(['B', 'M', 'F'] as GK[]).map((k) => <th key={k} style={td}><SI k={k} size={22} /><div style={{ fontSize: 11, color: GRAIN[k] }}>{NAME[k]}</div></th>)}
            <th style={td}>Resultado</th>
          </tr></thead>
          <tbody>
            {cells.map((r, i) => (
              <tr key={i}>
                <td style={td}>{i + 1}</td>
                {r.map((v, j) => {
                  const good = v === RECORDS[i].n[j]
                  return <td key={j} style={td}><button className="chipbtn" onClick={() => tap(i, j)} aria-label={`Experimento ${i + 1}, ${NAME[(['B', 'M', 'F'] as GK[])[j]]}: ${v}`} style={{ minWidth: 44, minHeight: 40, borderColor: good ? 'var(--green)' : undefined, color: good ? 'var(--green)' : undefined }}>{v || '·'}</button></td>
                })}
                <td style={{ ...td, color: 'var(--cyan)' }} className="mono">{RECORDS[i].total}</td>
              </tr>
            ))}
            <tr><td style={{ ...td, color: 'var(--muted)', fontSize: 12 }}>valor de 1</td>{(['B', 'M', 'F'] as GK[]).map((k) => <td key={k} style={{ ...td, color: GRAIN[k], fontSize: 22 }}>?</td>)}<td style={td} /></tr>
          </tbody>
        </table>
      </div>
      {ok && <div className="ok">Cada linha é uma experiência que realmente aconteceu. O resultado foi medido. Mas o valor de cada tipo continua escondido.</div>}
      {ok && <div className="foot"><button className="btn primary" onClick={next}>Continuar ▸</button></div>}
    </>
  )
}

/** Cena 5: o que existe de igual nas duas primeiras misturas? */
function Same({ next }: { next: () => void }) {
  const [bad, setBad] = useState('')
  const q = useQuiz(2, () => setBad(''))
  const solved = q.right != null
  const pick = (i: number) => { q.pick(i); if (i === 0) setBad('Não: a primeira tem 3 superiores e a segunda tem 2.'); if (i === 1) setBad('Não: a primeira tem 2 médios e a segunda tem 3.') }
  return (
    <>
      <p className="lead">Olhe as duas primeiras experiências. O que existe de igual nas duas?</p>
      {[0, 1].map((e) => (
        <div key={e} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 900, fontSize: 13, color: 'var(--muted)' }}>Experimento {e + 1}</span>
          <Mix n={RECORDS[e].n} dim={[0, 0, solved ? 1 : 0]} />
          <b className="mono" style={{ fontSize: 18, color: 'var(--cyan)' }}>{RECORDS[e].total}{solved ? <> − <SI k="F" size={18} /></> : ' dou'}</b>
        </div>
      ))}
      <div className={q.shake}><Opts opts={[<>{rich('[B]')} os superiores</>, <>{rich('[M]')} os médios</>, <>{rich('[F]')} 1 inferior</>]} onPick={pick} wrong={q.wrong} right={q.right} /></div>
      <div className="bad">{bad}</div>
      {solved && <div className="ok">Exatamente. As duas misturas têm <b>um feixe inferior</b>. Então dá para tirar esse feixe das duas, só de pensamento.</div>}
      {solved && <div className="foot"><button className="btn primary" onClick={next}>Continuar ▸</button></div>}
    </>
  )
}

/** Cena 6: tirando o que é igual, sobra a diferença. */
function Diff({ next, addFact }: { next: () => void; addFact: (k: string) => void }) {
  const [cut, setCut] = useState(false)
  const q = useQuiz(0, () => addFact('BM'))
  const solved = q.right != null
  const rows = [{ n: [3, 2, 0], d: [2, 2, 0], extra: '[B] +1', t: 39 }, { n: [2, 3, 0], d: [2, 2, 0], extra: '[M] +1', t: 34 }]
  return (
    <>
      <p className="lead">Sem o inferior, sobrou isto. Tirar <b>a mesma coisa</b> das duas não muda a diferença entre elas.</p>
      {rows.map((r, e) => (
        <div key={e} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 900, fontSize: 13, color: 'var(--muted)' }}>Experimento {e + 1}</span>
          <Mix n={r.n} dim={cut ? r.d : [0, 0, 0]} />
          {cut && <b style={{ fontSize: 15, color: 'var(--gold-2)' }}>{rich(r.extra, 18)}</b>}
          <b className="mono" style={{ fontSize: 18, color: 'var(--cyan)' }}>{r.t} − <SI k="F" size={18} /></b>
        </div>
      ))}
      {!cut && <div className="row"><button className="btn primary" onClick={() => { SFX.play('whoosh'); setCut(true) }}>Tirar o que é igual nas duas</button></div>}
      {cut && (
        <>
          <p className="lead" style={{ marginTop: 6 }}>A primeira mistura tem <b>um superior a mais</b>. A segunda tem <b>um médio a mais</b>. E os resultados? A primeira produziu quanto a mais?</p>
          <div className={q.shake}><Opts opts={['5 dou', '13 dou', '73 dou']} onPick={q.pick} wrong={q.wrong} right={q.right} /></div>
          {q.wrong.length > 0 && !solved && <div className="bad">Dica: compare 39 com 34.</div>}
        </>
      )}
      {solved && <div className="ok">39 − 34 = 5. <b>Descoberta:</b> {rich('1 [B] superior vale 5 dou a mais que 1 [M] médio.')}</div>}
      {solved && <div className="foot"><button className="btn primary" onClick={next}>Continuar ▸</button></div>}
    </>
  )
}

/** Cena 7: a mesma descoberta, escrita com letras. */
function MathStep({ next }: { next: () => void }) {
  const [k, setK] = useState(0)
  const col = ['', GRAIN.B, '', GRAIN.M, '', GRAIN.F, '', '#59d7ff']
  const hl = [-1, 5, 1, 3, 7][k] // coluna destacada
  const r1 = ['', '3B', '+', '2M', '+', 'F', '=', '39']
  const r2 = ['−', '2B', '+', '3M', '+', 'F', '=', '34']
  const r3 = ['', k >= 2 ? 'B' : '', '', k >= 3 ? '− M' : '', '', k >= 1 && k < 4 ? '0' : '', k >= 4 ? '=' : '', k >= 4 ? '5' : '']
  const say = [
    'Podemos representar o que descobrimos: B para o superior, M para o médio e F para o inferior. Agora vamos tirar a experiência 2 da experiência 1, parte por parte.',
    'F − F = 0: o inferior desaparece.',
    '3B − 2B = B: sobra um superior.',
    '2M − 3M = −M: fica um médio do outro lado.',
    '39 − 34 = 5. Portanto: B − M = 5. É a mesma descoberta, agora escrita com letras!',
  ]
  useEffect(() => { VOICE.speak(say[k], 'NOVA') }, [k])
  const cell = (v: string, j: number, row: number) => (
    <span key={row + '_' + j} className="mono" style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 8, fontWeight: 900, fontSize: 'clamp(16px, 4.6vw, 24px)', color: col[j] || 'var(--text)', background: j === hl ? 'rgba(255,255,255,.1)' : 'transparent', textDecoration: row < 2 && j === 5 && k >= 1 ? 'line-through' : 'none', opacity: row < 2 && j === 5 && k >= 1 ? 0.5 : 1 }}>{v}</span>
  )
  return (
    <>
      <div className="row" style={{ gap: 14, marginBottom: 10 }}>
        {(['B', 'M', 'F'] as GK[]).map((g) => <span key={g} style={{ fontWeight: 900, fontSize: 15 }}><SI k={g} size={22} /> = <span className="mono" style={{ color: GRAIN[g] }}>{g}</span></span>)}
      </div>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '28px repeat(7, auto)', justifyContent: 'center', gap: '2px 6px', padding: '12px 8px' }}>
        {r1.map((v, j) => cell(v, j, 0))}
        {r2.map((v, j) => cell(v, j, 1))}
        <span style={{ gridColumn: '1 / -1', borderTop: '2px solid var(--muted)', margin: '2px 0' }} />
        {r3.map((v, j) => cell(v, j, 2))}
      </div>
      <p className="lead" style={{ marginTop: 10, minHeight: '3em' }}>{say[k]}</p>
      <div className="foot">
        {k < 4 ? <button className="btn primary" onClick={() => { SFX.play('click'); setK(k + 1) }}>{k === 0 ? 'Subtrair' : 'Próximo ▸'}</button> : <button className="btn primary" onClick={next}>Continuar ▸</button>}
      </div>
    </>
  )
}

/** Cena 8 (parte 1): qual registro usar agora? */
function Pick({ next }: { next: () => void }) {
  const [bad, setBad] = useState('')
  const q = useQuiz(2, () => setBad(''))
  const pick = (i: number) => { q.pick(i); if (i < 2) setBad(`O registro ${i + 1} já foi usado. Precisamos de uma pista nova!`) }
  return (
    <>
      <p className="lead">{rich('Agora sabemos: [B] = [M] + 5. Mas ainda não sabemos quanto vale nenhum dos dois. Qual registro podemos usar agora?')}</p>
      <div className={q.shake}><Opts opts={['O registro 1 de novo', 'O registro 2 de novo', 'O registro 3']} onPick={pick} wrong={q.wrong} right={q.right} /></div>
      <div className="bad">{bad}</div>
      {q.right != null && <div className="ok">{rich('Isso! O registro 3 traz uma pista nova. E com a nossa descoberta dá para fazer uma troca esperta: cada [B] é um [M] com 5 a mais.')}</div>}
      {q.right != null && <div className="foot"><button className="btn primary" onClick={next}>Continuar ▸</button></div>}
    </>
  )
}

/** Cena 8 (parte 2): trocar, separar e tirar até descobrir cada valor. */
type It = GK | 'M+'
interface SubStep { tag: string; before: It[] | string; eq?: string; action?: string; after?: It[] | 'pairs'; eq2?: string; q: string; opts: string[]; a: number; why: string; hint: string; fact?: string }
const SUB: SubStep[] = [
  { tag: 'Registro 3', before: ['B', 'M', 'M', 'F', 'F', 'F'], eq: '= 26', action: 'Trocar o [B] por [M] + 5', after: ['M+', 'M', 'M', 'F', 'F', 'F'], eq2: '+ 5 = 26', q: 'Então [M][M][M][F][F][F] vale…', opts: ['21', '26', '31'], a: 0, why: '26 − 5 = 21 dou.', hint: 'Dica: se tudo junto com o 5 dá 26, sem o 5 dá…' },
  { tag: 'Registro 3', before: ['M', 'M', 'M', 'F', 'F', 'F'], eq: '= 21', action: 'Separar em 3 grupos iguais', after: 'pairs', eq2: '= 21', q: 'Quanto vale um par [M][F]?', opts: ['3', '7', '21'], a: 1, why: '21 ÷ 3 = 7 dou.', hint: 'Dica: 21 dividido em 3 grupos iguais.', fact: 'MF' },
  { tag: 'Registro 1', before: ['B', 'B', 'B', 'M', 'M', 'F'], eq: '= 39', action: 'Trocar os 3 [B] por [M] + 5', after: ['M+', 'M+', 'M+', 'M', 'M', 'F'], eq2: '+ 15 = 39', q: 'Então [M][M][M][M][M][F] vale…', opts: ['24', '39', '54'], a: 0, why: '39 − 15 = 24 dou.', hint: 'Dica: três vezes 5 dá 15. Sem o 15, quanto sobra de 39?' },
  { tag: 'Registro 1', before: ['M', 'M', 'M', 'M', 'M', 'F'], eq: '= 24', action: 'Tirar um par [M][F] (que vale 7)', after: ['M', 'M', 'M', 'M'], eq2: '= 17', q: 'Quanto vale um [M]?', opts: ['4', '4,25', '17'], a: 1, why: '17 ÷ 4 = 4,25 dou.', hint: 'Dica: 16 ÷ 4 = 4, e o 1 que sobra dividido por 4 dá 0,25.', fact: 'M' },
  { tag: 'Superior', before: '[B] = [M] + 5 = 4,25 + 5', q: 'Quanto vale um [B]?', opts: ['9,25', '4,25', '14,25'], a: 0, why: '4,25 + 5 = 9,25 dou.', hint: 'Dica: some 5 ao valor do médio.', fact: 'B' },
  { tag: 'Inferior', before: '[M] + [F] = 7, então [F] = 7 − 4,25', q: 'Quanto vale um [F]?', opts: ['2,75', '3,25', '7'], a: 0, why: '7 − 4,25 = 2,75 dou.', hint: 'Dica: o par vale 7; tire o valor do médio.', fact: 'F' },
]
function Items({ items }: { items: It[] }) {
  return <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>{items.map((it, i) => (it === 'M+' ? <SI key={i} k="M" size={26} plus="+5" /> : <SI key={i} k={it} size={26} />))}</span>
}
function Sub({ next, addFact }: { next: () => void; addFact: (k: string) => void }) {
  const [k, setK] = useState(0)
  return <SubOne key={k} st={SUB[k]} n={k} last={k === SUB.length - 1} next={() => { SFX.play('click'); if (k === SUB.length - 1) next(); else setK(k + 1) }} addFact={addFact} />
}
function SubOne({ st, n, last, next, addFact }: { st: SubStep; n: number; last: boolean; next: () => void; addFact: (k: string) => void }) {
  const [acted, setActed] = useState(!st.action)
  const q = useQuiz(st.a, () => { if (st.fact) addFact(st.fact) })
  const solved = q.right != null
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900, letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}><span>{st.tag.toUpperCase()}</span><span>PISTA {n + 1} DE {SUB.length}</span></div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minHeight: 56, fontSize: 18, fontWeight: 800 }}>
        {typeof st.before === 'string' ? <span className="mono">{rich(st.before, 22)}</span> : (
          !acted ? <><Items items={st.before} /><b className="mono" style={{ color: 'var(--cyan)' }}>{st.eq}</b></> :
            st.after === 'pairs' ? <><span style={{ display: 'inline-flex', gap: 8 }}>{[0, 1, 2].map((g) => <span key={g} style={{ display: 'inline-flex', gap: 2, padding: '2px 6px', border: '1.5px solid var(--gold)', borderRadius: 10 }}><SI k="M" size={26} /><SI k="F" size={26} /></span>)}</span><b className="mono" style={{ color: 'var(--cyan)' }}>{st.eq2}</b></> :
              <><Items items={st.after as It[]} /><b className="mono" style={{ color: 'var(--cyan)' }}>{st.eq2}</b></>
        )}
      </div>
      {!acted && <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={() => { SFX.play('whoosh'); setActed(true) }}>{rich(st.action!, 18)}</button></div>}
      {acted && (
        <div style={{ marginTop: 10 }}>
          <p className="lead" style={{ marginBottom: 8 }}>{rich(st.q)}</p>
          <div className={q.shake}><Opts opts={st.opts.map((o) => o + ' dou')} onPick={q.pick} wrong={q.wrong} right={q.right} /></div>
          {q.wrong.length > 0 && !solved && <div className="bad">{st.hint}</div>}
        </div>
      )}
      {solved && <div className="ok">{st.why}</div>}
      {solved && <div className="foot"><button className="btn primary" onClick={next}>{last ? 'Ver a mesa ▸' : 'Próxima pista ▸'}</button></div>}
    </>
  )
}

/** Cena 9: os três valores aparecem, e conferem com os registros. */
function Rev({ done }: { done: () => void }) {
  useEffect(() => { SFX.play('discover') }, [])
  const val = { B: 9.25, M: 4.25, F: 2.75 }
  const fmt = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  return (
    <>
      <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
        {(['B', 'M', 'F'] as GK[]).map((k) => (
          <div key={k} className="card" style={{ flex: '1 1 150px', textAlign: 'center', borderColor: GRAIN[k] }}>
            <SI k={k} size={34} />
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.14em', color: GRAIN[k] }}>{NAME[k].toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 900 }}>{VALUES[k]}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>dou</div>
          </div>
        ))}
      </div>
      <div className="card mono" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.7 }}>
        <div style={{ fontFamily: 'var(--f-body)', fontWeight: 900, fontSize: 12, letterSpacing: '.1em', color: 'var(--muted)' }}>CONFERINDO OS REGISTROS</div>
        {RECORDS.map((r, i) => {
          const sum = r.n[0] * val.B + r.n[1] * val.M + r.n[2] * val.F
          return <div key={i}>{r.n[0]}×{fmt(val.B)} + {r.n[1]}×{fmt(val.M)} + {r.n[2]}×{fmt(val.F)} = <b style={{ color: 'var(--green)' }}>{fmt(sum)} ✓</b></div>
        })}
      </div>
      <div className="ok">Ninguém mediu um feixe sozinho. Mesmo assim, os três registros bastaram para descobrir tudo.</div>
      <div className="foot"><button className="btn primary" onClick={done}>Mostrar ao comerciante ▸</button></div>
    </>
  )
}

/* ---------- cena 10: a balança ---------- */
export function BalancaView({ onDone }: { onDone: () => void }) {
  const [hint, setHint] = useState(false)
  const q = useQuiz(1, () => {})
  return (
    <div className="doc-wrap" onPointerDown={(e) => e.stopPropagation()}>
      <div className="gm" style={{ width: 'min(520px, 100%)' }}>
        <div className="who-chip"><span className="pf"><PersonFace who="COMERCIANTE" /></span><span style={{ color: '#e6c04a' }}>Comerciante da vila</span></div>
        <h4>A balança</h4>
        <p className="lead">E se eu colocar seis feixes médios?</p>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', justifyContent: 'center', gap: '4px 10px', padding: 12 }}>{Array.from({ length: 6 }, (_, i) => <SI key={i} k="M" size={34} />)}</div>
        <div className="stat" style={{ fontSize: 26, margin: '12px 0' }}>6 × 4,25 = {q.right != null ? <span style={{ color: 'var(--gold-2)' }}>25,5</span> : '?'}</div>
        <div className={q.shake}><Opts opts={['24 dou', '25,5 dou', '27 dou']} onPick={q.pick} wrong={q.wrong} right={q.right} /></div>
        {q.right == null && <div className="row" style={{ marginTop: 8 }}>{hint ? <span style={{ fontWeight: 800, color: 'var(--gold-2)', fontSize: 14 }}>Dica: 6 × 4 = 24 e 6 × 0,25 = 1,5.</span> : <button className="btn small ghost" onClick={() => setHint(true)}>Dica</button>}</div>}
        {q.right != null && <div className="ok">⚖️ <b>25,5 dou.</b> Seis médios: 6 × 4,25 = 25,5.</div>}
        {q.right != null && <div className="foot"><button className="btn primary" onClick={() => { SFX.play('click'); onDone() }}>Continuar ▸</button></div>}
      </div>
    </div>
  )
}

/* ---------- cena 11: a grande ideia ---------- */
const COUNTS = ['3 valores', '10 valores', '100 valores', '1.000 valores', '1.000.000 de valores']
function NumberRain({ dense }: { dense: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!
    let raf = 0, t0 = performance.now()
    const drops: { x: number; y: number; v: number; d: string; s: number }[] = []
    const fit = () => { c.width = c.clientWidth; c.height = c.clientHeight }
    fit(); addEventListener('resize', fit)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = (performance.now() - t0) / 1000
      const want = dense ? Math.min(900, 6 + Math.pow(el, 3) * 6) : 0
      while (drops.length < want) drops.push({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5, v: 60 + Math.random() * 200, d: String(Math.floor(Math.random() * 10)), s: 12 + Math.random() * 16 })
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of drops) {
        p.y += p.v / 60
        if (p.y > c.height + 20) { p.y = -20; p.x = Math.random() * c.width; p.d = String(Math.floor(Math.random() * 10)) }
        ctx.fillStyle = `rgba(${150 + (p.s * 5) % 100},220,255,${0.25 + (p.s - 12) / 40})`
        ctx.font = `800 ${p.s}px "JetBrains Mono", monospace`
        ctx.fillText(p.d, p.x, p.y)
      }
    }
    loop()
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', fit) }
  }, [dense])
  return <canvas ref={cv} />
}
export function BigIdea({ step }: { step: number }) {
  const [ci, setCi] = useState(0)
  useEffect(() => {
    if (step !== 3) return
    setCi(0)
    const id = setInterval(() => setCi((x) => Math.min(COUNTS.length - 1, x + 1)), 1150)
    return () => clearInterval(id)
  }, [step])
  return (
    <div className="bigidea" style={{ background: step >= 4 ? 'rgba(2,3,8,.94)' : undefined }}>
      {step === 3 && <NumberRain dense />}
      {step === 1 && <div className="rec">39 → 34 → 26</div>}
      {step === 2 && (
        <>
          <div className="rec" style={{ fontSize: 'clamp(22px, 5vw, 38px)', opacity: 0.7 }}>39 · 34 · 26</div>
          <div className="chain">{['dados', '→', 'relações', '→', 'incógnitas', '→', 'solução'].map((w, i) => <span key={i} style={{ animationDelay: `${i * 0.35}s`, color: w === '→' ? 'var(--muted)' : i === 6 ? 'var(--gold-2)' : '#bff3ff' }}>{w}</span>)}</div>
        </>
      )}
      {step === 3 && (
        <div className="count" key={ci}>
          {COUNTS.slice(0, ci + 1).map((t, i) => <div key={t} style={{ opacity: i === ci ? 1 : 0.35, fontSize: i === ci ? undefined : '0.5em' }}>{t}{i < ci ? ' ↓' : ''}</div>)}
        </div>
      )}
      {step === 5 && <div className="word">MATRIZES</div>}
    </div>
  )
}

/* ---------- roteiros das cenas ---------- */
const portrait = () => innerWidth / innerHeight < 0.8
function shot(c: Ctx, land: [V3, V3], port: [V3, V3]) { const [p, l] = portrait() ? port : land; c.focus(p, l, 50) }
function stand(p: V3, look: THREE.Vector3) { RT.player.set(p[0], 0.05, p[2]); RT.playerVel.set(0, 0, 0); RT.lastSafe.copy(RT.player); RT.lookAt = look }
const mz = () => V.merchant[2]
const shotStall = (c: Ctx) => shot(c, [[2.6, 2.1, mz() + 1.6], [7.0, 1.55, mz() - 0.3]], [[0.2, 2.8, mz() + 3.2], [5.75, 1.3, mz()]])
const shotBaskets = (c: Ctx) => { const z = V.baskets[0][2]; shot(c, [[1.6, 2.4, z + 3.0], [6.4, 1.15, z - 0.2]], [[0.2, 3.3, z + 5.0], [6.4, 1.1, z - 0.2]]) }
const shotScale = (c: Ctx) => { const [x, , z] = V.scale; shot(c, [[x + 1.9, 2.3, z + 3.4], [x, 1.45, z]], [[x + 2.2, 2.9, z + 5.2], [x - 0.1, 1.4, z]]) }
const shotTable = (c: Ctx) => { const z = V.table[2]; shot(c, [[3.0, 2.7, z + 3.4], [6.8, 0.9, z - 0.3]], [[2.4, 3.6, z + 6.8], [6.6, 0.9, z - 0.3]]) }
const shotLiu = (c: Ctx) => { const z = V.liu[2]; shot(c, [[3.6, 2.05, z + 3.2], [7.9, 1.6, z - 0.2]], [[5.6, 2.8, z + 8.2], [7.6, 1.45, z - 0.2]]) }

/** Cenas 1 a 3: a vila, os três registros e a pergunta impossível. */
export async function graosTalk(c: Ctx) {
  c.objective(null); c.freeze(true)
  stand(V.merchantUse, new THREE.Vector3(V.merchant[0], 1.95, mz()))
  RT.novaPos = new THREE.Vector3(3.8, 2.3, mz() - 1.7)
  try {
    if (!c.flag('g2_seen')) {
      await c.cinematic([
        { pos: [-9, 9, V.gate + 1], look: [6, 0.8, mz() - 3], dur: 0.01, cut: true },
        { pos: [-1.5, 4.2, mz() + 5.5], look: [7.5, 1.1, mz() - 2], dur: 4.5 },
      ])
      c.setFlag('g2_seen')
    }
    // CENA 1 — a colheita
    shotStall(c)
    await c.say([
      { who: 'NEX', text: 'Uma vila! Campos de arroz para todo lado…' },
      { who: 'NOVA', text: 'China antiga, há uns 2.000 anos. A memória da Engine guardou esta vila do jeitinho que era.' },
      { who: 'COMERCIANTE', text: 'Bem-vindo, viajante! Aqui plantamos três tipos de arroz: o superior, o médio e o inferior.' },
      { who: 'COMERCIANTE', text: 'Há anos fazemos essas misturas. Sabemos quanto cada mistura produz.' },
      { who: 'COMERCIANTE', text: 'Veja os meus três registros.' },
    ])
    // CENA 2 — os três registros
    const lines = [
      'Registro 1: três feixes superiores, dois médios e um inferior. A mistura foi processada e deu 39 dou.',
      'Registro 2: dois superiores, três médios e um inferior: 34 dou.',
      'Registro 3: um superior, dois médios e três inferiores: 26 dou.',
    ]
    for (let k = 0; k < 3; k++) {
      const z = V.boards[k]
      shot(c, [[6.6, 1.9, z + 0.25], [V.boardX, 1.72, z]], [[5.4, 2.0, z + 0.3], [V.boardX, 1.72, z]])
      SFX.play('tick')
      await c.say({ who: 'COMERCIANTE', text: lines[k] })
    }
    await c.say({ who: 'NOVA', text: 'Dou é uma medida de grãos daquela época, tipo um balde pequeno.' })
    // CENA 3 — o problema
    shotBaskets(c)
    await c.say([
      { who: 'COMERCIANTE', text: 'Eu sei quantos feixes coloquei em cada mistura. Também sei quanto cada mistura produziu: 39, 34 e 26.' },
      { who: 'COMERCIANTE', text: 'Mas nunca medi um feixe sozinho.' },
      { who: 'COMERCIANTE', text: 'Você consegue descobrir quanto produz cada tipo de arroz?' },
      { who: 'NEX', text: 'Descobrir uma coisa que ninguém nunca mediu? Isso parece impossível…' },
      { who: 'NOVA', text: 'Parece. Mas os registros guardam pistas. Ali na frente tem uma mesa de madeira: vamos organizar as evidências.' },
    ])
    c.setFlag('g2_talk')
  } finally {
    RT.lookAt = null; RT.novaPos = null
    c.unfocus(); c.freeze(false); RT.camYaw = 0
  }
}

/** Se o jogador volta a falar com o comerciante antes de resolver. */
export async function graosHint(c: Ctx) {
  await c.say({ who: 'COMERCIANTE', text: 'Os registros estão na mesa de madeira, ali na frente. Consegue descobrir quanto vale cada tipo?' }, { ambient: true })
}

async function bigIdea(c: Ctx) {
  const zc = (V.z0 + V.z1) / 2
  useGame.setState({ hudHidden: true })
  await c.cinematic([
    { pos: [3.4, 2.2, V.table[2] + 3.2], look: [7, 1.2, V.table[2]], dur: 0.01, cut: true },
    { pos: [-7, 19, V.z0 + 9], look: [5, 0, zc], dur: 5 },
  ], false)
  c.focus([-7, 19, V.z0 + 9], [5, 0, zc], 50)
  const big = (k: number) => G().setOverlay(BIG, <BigIdea step={k} />)
  big(1)
  await c.say({ who: 'LIUHUI', text: 'Três registros: 39, 34 e 26. Foi tudo o que o comerciante mediu.' })
  big(2)
  await c.say([
    { who: 'LIUHUI', text: 'Dos dados, tiramos relações. Das relações, encontramos as incógnitas. E chegamos à solução.' },
    { who: 'LIUHUI', text: 'Quando não conseguimos observar algo diretamente, podemos usar aquilo que já sabemos para descobri-lo.' },
    { who: 'LIUHUI', text: 'Essa ideia acompanharia a matemática por milhares de anos.' },
  ])
  big(3); SFX.play('whoosh')
  await c.wait(6.2)
  await c.say({ who: 'LIUHUI', text: 'Mas o que acontece quando existem milhares de incógnitas?' })
  big(4)
  await c.wait(1.8)
  big(5); SFX.play('core')
  await c.wait(3.4)
  G().setOverlay(BIG, null)
  useGame.setState({ hudHidden: false })
}

/** Cenas 4 a 11: a mesa, a revelação, a balança e a grande ideia. */
export async function graosMesa(c: Ctx, finish: (c: Ctx) => Promise<void>) {
  const s = STOPS[V.i], h = holo(s.id)
  c.objective(null); c.freeze(true)
  stand(V.tableUse, new THREE.Vector3(V.table[0], 0.8, V.table[2]))
  RT.novaPos = new THREE.Vector3(3.6, 2.3, V.table[2] + 1.7)
  try {
    // CENA 4 — a mesa de madeira
    shotTable(c)
    await c.say({ who: 'NOVA', text: 'A mesa de madeira! Cada registro é uma pista. Vamos colocar tudo em ordem.' })
    await show(c, (d) => <MesaView onDone={d} />)
    // CENA 9 — a revelação
    c.setFlag('g2_rev')
    shotBaskets(c)
    RT.lookAt = new THREE.Vector3(V.baskets[1][0], 1, V.baskets[1][2])
    SFX.play('discover')
    await c.wait(1)
    await c.say([
      { who: 'COMERCIANTE', text: 'Superior, 9,25 dou. Médio, 4,25. Inferior, 2,75…' },
      { who: 'COMERCIANTE', text: 'Mas nós nunca medimos um feixe sozinho…' },
      { who: 'NEX', text: 'Nem precisou! A gente usou os resultados das experiências que vocês já tinham.' },
    ])
    // CENA 10 — o desafio final
    shotScale(c)
    RT.lookAt = new THREE.Vector3(V.scale[0], 1.2, V.scale[2])
    await c.say({ who: 'COMERCIANTE', text: 'Então me diga: e se eu colocar seis feixes médios?' })
    c.setFlag('g2_six'); SFX.play('bead')
    await c.wait(1)
    await show(c, (d) => <BalancaView onDone={d} />)
    c.setFlag('g2_pred'); SFX.play('chime')
    await c.wait(0.6)
    await c.say({ who: 'COMERCIANTE', text: 'Vinte e cinco e meio! Mas… essa mistura nunca foi feita.' })
    // o narrador: Liu Hui
    shotLiu(c)
    RT.lookAt = new THREE.Vector3(V.liu[0], 1.9, V.liu[2])
    h.live = true; h.want = 1; SFX.play('chime')
    await c.wait(1.3)
    await c.say([
      { who: 'LIUHUI', text: 'Exatamente.' },
      { who: 'LIUHUI', text: 'Você acabou de descobrir o resultado de uma experiência que nunca aconteceu.' },
      ...s.intro.map((t) => ({ who: s.who, text: t })),
    ])
    await c.say({ who: 'NEX', text: s.nex })
    await c.say({ who: s.who, text: 'Anotei a história deste método. Leia comigo.' })
    await openDoc(c, s.doc)
    // CENA 11 — a grande ideia
    await bigIdea(c)
    shotLiu(c)
    await c.say({ who: s.who, text: s.bye })
    h.live = false
    await finish(c)
  } finally {
    G().setOverlay(BIG, null); useGame.setState({ hudHidden: false })
    h.live = false
    RT.lookAt = null; RT.novaPos = null
    c.unfocus(); c.freeze(false); RT.camYaw = 0
  }
}
