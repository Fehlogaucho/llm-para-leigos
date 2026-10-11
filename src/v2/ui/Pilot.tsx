import { useState } from 'react'
import { SFX } from '../engine/audio'
import { METRICS } from '../engine/metrics'

/* =========================================================
   Modo piloto: avaliação antes e depois do jogo, com
   perguntas equivalentes (não idênticas), para medir o que
   a pessoa aprendeu. Sem dicas nem gabarito durante a prova.
   Os resultados ficam só no navegador (ver engine/metrics).
   ========================================================= */
export interface PQ { id: string; q: string; o: string[]; a: number }
/** Cada par (pré e pós) mede o mesmo conceito com outra pergunta. */
export const PILOT_PRE: PQ[] = [
  { id: 'geracao', q: 'Como uma LLM monta uma resposta?', o: ['Procura uma resposta pronta na internet', 'Prevê um pedaço de texto de cada vez, usando o que veio antes', 'Copia a resposta de um site'], a: 1 },
  { id: 'tokens', q: 'O que é um token?', o: ['Sempre uma palavra inteira', 'Um pedaço de texto (palavra, parte de palavra ou pontuação) que vira número', 'Uma senha da LLM'], a: 1 },
  { id: 'embeddings', q: 'No “mapa” de palavras de uma LLM, quais palavras ficam perto?', o: ['As que têm as mesmas letras', 'As que são usadas de jeito parecido', 'As que vêm em ordem alfabética'], a: 1 },
  { id: 'atencao', q: 'Em “sentei no banco da praça”, como a LLM sabe que é banco de sentar?', o: ['Pelas outras palavras da frase, que a atenção pesa', 'Ela sempre acha que banco é de sentar', 'Ela pergunta para uma pessoa'], a: 0 },
  { id: 'temperatura', q: 'Se aumentarmos a temperatura de uma LLM, ela…', o: ['fica sempre mais correta', 'varia mais as palavras que escolhe', 'para de funcionar'], a: 1 },
  { id: 'treino', q: 'De onde vem o que uma LLM “sabe”?', o: ['De regras escritas uma a uma por programadores', 'De padrões aprendidos ajustando pesos com muitos textos', 'De uma enciclopédia guardada dentro dela'], a: 1 },
  { id: 'rag_ajuste', q: 'Para uma LLM responder sobre um documento novo da sua escola, sem treinar de novo, o melhor é…', o: ['Buscar o documento e colocar no contexto (RAG)', 'Aumentar a temperatura', 'Desligar a atenção'], a: 0 },
  { id: 'critico', q: 'Uma LLM respondeu com muita confiança. Isso quer dizer que está certo?', o: ['Sim, sempre', 'Não necessariamente: vale conferir em fontes confiáveis', 'Sim, se a resposta for longa'], a: 1 },
]
export const PILOT_POS: PQ[] = [
  { id: 'geracao', q: 'Uma LLM escreveu “O céu é azul.” Como esse texto foi feito?', o: ['A frase inteira foi copiada de um livro', 'Um pedaço de cada vez, cada um escolhido pelas chances', 'Alguém digitou a resposta antes'], a: 1 },
  { id: 'tokens', q: 'A palavra “infelizmente” pode virar quantos tokens?', o: ['Sempre exatamente 1', 'Pode virar vários pedaços, dependendo do tokenizador', 'Nenhum: tokens são só para números'], a: 1 },
  { id: 'embeddings', q: 'Um embedding é…', o: ['O número de catálogo do token', 'Uma lista de números aprendida que funciona como endereço do token', 'Um tipo de pontuação'], a: 1 },
  { id: 'atencao', q: 'Para que serve a atenção numa LLM?', o: ['Para calcular quanto cada palavra ajuda a entender as outras', 'Para contar as letras da frase', 'Para deixar a LLM mais rápida de digitar'], a: 0 },
  { id: 'temperatura', q: 'Uma resposta feita com temperatura baixa é garantidamente verdadeira?', o: ['Sim', 'Não: ela só fica mais previsível', 'Só se a pergunta for curta'], a: 1 },
  { id: 'treino', q: 'Se os textos do treino tiverem um erro repetido muitas vezes, o que pode acontecer?', o: ['Nada: a LLM corrige sozinha', 'A LLM pode aprender e repetir o erro', 'A LLM apaga o erro automaticamente'], a: 1 },
  { id: 'rag_ajuste', q: 'Qual destes muda os pesos da própria LLM?', o: ['Escrever um prompt', 'Buscar documentos (RAG)', 'Fazer um ajuste fino'], a: 2 },
  { id: 'critico', q: 'Você perguntou a data de um evento e a LLM deu uma resposta bonita e detalhada. O que fazer?', o: ['Confiar, porque está bem escrita', 'Conferir numa fonte confiável antes de usar', 'Perguntar de novo até ela repetir'], a: 1 },
]

export function PilotTest({ kind, onDone }: { kind: 'pre' | 'pos'; onDone: () => void }) {
  const Q = kind === 'pre' ? PILOT_PRE : PILOT_POS
  const [step, setStep] = useState(kind === 'pre' ? -1 : 0)
  const [code, setCode] = useState(METRICS.data.participant)
  const [ans, setAns] = useState<number[]>([])
  const [explain, setExplain] = useState('')
  const [confusing, setConfusing] = useState('')
  const end = step >= Q.length
  const pick = (i: number) => {
    SFX.play('click')
    const nx = [...ans, i]
    setAns(nx); setStep(step + 1)
    if (nx.length === Q.length) METRICS.test(kind, nx, Q.map((x) => x.a), Q.map((x) => x.id))
  }
  const box = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'rgba(0,0,0,.25)', color: 'inherit', fontSize: 16, fontWeight: 700, fontFamily: 'inherit' } as const
  return (
    <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
      <div className="sheet" style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.16em', color: 'var(--cyan)' }}>MODO PILOTO · {kind === 'pre' ? 'AVALIAÇÃO INICIAL' : 'AVALIAÇÃO FINAL'}</div>
        {step === -1 && (
          <>
            <h2 style={{ margin: '6px 0' }}>Antes de jogar</h2>
            <p className="lead">São {Q.length} perguntas rápidas, só para saber o que você já sabe. Não tem problema errar, e o jogo não mostra o gabarito agora.</p>
            <label style={{ display: 'grid', gap: 4, fontWeight: 800, fontSize: 14 }}>Código do participante (opcional, ex.: P07)
              <input value={code} onChange={(e) => setCode(e.target.value)} style={box} aria-label="Código do participante" />
            </label>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>Não escreva seu nome. As respostas ficam só neste navegador até alguém exportar o arquivo.</p>
            <div className="foot"><button className="btn ghost" onClick={onDone}>Pular</button><button className="btn primary" onClick={() => { METRICS.setParticipant(code); SFX.play('click'); setStep(0) }}>Começar ▸</button></div>
          </>
        )}
        {step >= 0 && !end && (
          <>
            <div style={{ display: 'flex', gap: 3, margin: '8px 0 10px' }}>{Q.map((_, i) => <i key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < step ? 'var(--cyan)' : i === step ? 'var(--gold)' : 'rgba(255,255,255,.12)' }} />)}</div>
            <p className="lead" style={{ fontWeight: 900 }}>{step + 1}. {Q[step].q}</p>
            <div style={{ display: 'grid', gap: 8 }}>{Q[step].o.map((o, i) => <button key={i} className="opt" style={{ margin: 0 }} onClick={() => pick(i)}>{o}</button>)}</div>
            <button className="btn small ghost" style={{ marginTop: 10 }} onClick={() => pick(-1)}>Não sei</button>
          </>
        )}
        {end && kind === 'pos' && !METRICS.data.open && (
          <>
            <h2 style={{ margin: '6px 0' }}>Duas perguntas abertas</h2>
            <label style={{ display: 'grid', gap: 4, fontWeight: 800, fontSize: 14 }}>Explique com suas palavras como uma LLM escreve uma resposta.
              <textarea value={explain} onChange={(e) => setExplain(e.target.value)} rows={4} style={box} />
            </label>
            <label style={{ display: 'grid', gap: 4, fontWeight: 800, fontSize: 14, marginTop: 10 }}>Alguma explicação do jogo ficou confusa? Qual?
              <textarea value={confusing} onChange={(e) => setConfusing(e.target.value)} rows={3} style={box} />
            </label>
            <div className="foot"><button className="btn primary" onClick={() => { METRICS.openAnswers(explain, confusing); SFX.play('success'); onDone() }}>Enviar respostas ▸</button></div>
          </>
        )}
        {end && (kind === 'pre' || METRICS.data.open) && (
          <>
            <h2 style={{ margin: '6px 0' }}>Obrigado!</h2>
            <p className="lead">{kind === 'pre' ? 'Agora é só jogar. No fim, tem uma avaliação parecida.' : `Você acertou ${METRICS.data.pos?.score ?? 0} de ${Q.length}${METRICS.data.pre ? ` (antes do jogo: ${METRICS.data.pre.score} de ${PILOT_PRE.length})` : ''}.`}</p>
            <div className="foot"><button className="btn primary" onClick={onDone}>{kind === 'pre' ? 'Jogar ▸' : 'Fechar'}</button></div>
          </>
        )}
      </div>
    </div>
  )
}

/** Seção do menu: liga o modo piloto, avaliações e exportação. */
export function PilotSettings({ on, set, open }: { on: boolean; set: (v: boolean) => void; open: (k: 'pre' | 'pos') => void }) {
  const [, force] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const d = METRICS.data
  const nAct = Object.keys(d.activities).length
  return (
    <div className="set-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <label>Modo piloto (pesquisa)</label>
        <div className="seg"><button className={!on ? 'on' : ''} onClick={() => set(false)}>Desligado</button><button className={on ? 'on' : ''} onClick={() => set(true)}>Ligado</button></div>
      </div>
      {on && (
        <>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, fontWeight: 700 }}>
            Para testes com jogadores iniciantes: avaliação antes e depois do jogo e registro de tempo, tentativas e dicas por atividade. Tudo fica só neste navegador; nada é enviado. Para a pesquisa, exporte o arquivo e entregue ao responsável.
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 800 }}>
            Avaliação inicial: {d.pre ? `${d.pre.score}/${d.pre.total} ✓` : 'não feita'} · Avaliação final: {d.pos ? `${d.pos.score}/${d.pos.total} ✓` : 'não feita'} · {nAct} atividades registradas
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn small" onClick={() => open('pre')}>Avaliação inicial</button>
            <button className="btn small" onClick={() => open('pos')}>Avaliação final</button>
            <button className="btn small primary" onClick={() => { SFX.play('click'); METRICS.download() }}>Exportar dados (JSON)</button>
            {!confirm ? <button className="btn small ghost" onClick={() => setConfirm(true)}>Apagar dados do piloto</button> : <button className="btn small" style={{ borderColor: '#ff7a7a' }} onClick={() => { METRICS.reset(); setConfirm(false); force((x) => x + 1) }}>Apagar mesmo? Toque para confirmar</button>}
          </div>
        </>
      )}
    </div>
  )
}
