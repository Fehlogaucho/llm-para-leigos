import type { ReactNode } from 'react'

/* Pedaços de interface (DOM) do Vale. Tudo cabe em 390 px. */

export function GemIcon({ color = '#ffd27a', size = 18 }: { color?: string; size?: number }) {
  return (
    <span aria-hidden style={{ display: 'inline-block', width: size, height: size, transform: 'rotate(45deg)', borderRadius: 3, background: `linear-gradient(135deg, #fff6d0, ${color} 55%, #9a6a1a)`, boxShadow: `0 0 10px ${color}aa`, flex: 'none' }} />
  )
}

/** Contador lateral (cristais, pedras, lajes…). */
export function Counter({ icon, value, label, accent = '#ffd27a' }: { icon?: ReactNode; value: ReactNode; label: ReactNode; accent?: string }) {
  return (
    <div style={{ position: 'absolute', left: 10, top: '34%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 12px', borderRadius: 16, background: 'rgba(10,16,32,.86)', border: `1.5px solid ${accent}99`, boxShadow: '0 6px 24px rgba(0,0,0,.4)', pointerEvents: 'none', maxWidth: 'calc(100vw - 20px)' }}>
      {icon}
      <div>
        <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 800, fontSize: 22, lineHeight: 1.1, color: accent }}>{value}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>{label}</div>
      </div>
    </div>
  )
}

/** Desenhos dos símbolos numéricos (caderno do templo). */
export function SymbolSvg({ kind, size = 54 }: { kind: 'tally' | 'roman' | 'maya' | 'baby'; size?: number }) {
  const st = { stroke: '#ffd98a', strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' }
  return (
    <svg viewBox="0 0 60 40" width={size} height={size * 0.67} aria-label={kind}>
      {kind === 'tally' && <g {...st}>{[8, 14, 20, 26].map((x) => <line key={x} x1={x} y1={8} x2={x} y2={32} />)}<line x1={4} y1={28} x2={30} y2={12} /><line x1={40} y1={8} x2={40} y2={32} /><line x1={46} y1={8} x2={46} y2={32} /></g>}
      {kind === 'roman' && <text x={30} y={29} textAnchor="middle" fontFamily="Cinzel, serif" fontWeight={700} fontSize={22} fill="#ffd98a">VII</text>}
      {kind === 'maya' && <g fill="#ffd98a"><circle cx={24} cy={12} r={4} /><circle cx={36} cy={12} r={4} /><rect x={12} y={22} width={36} height={7} rx={3} /></g>}
      {kind === 'baby' && <g fill="#ffd98a">{[0, 1, 2, 3].map((i) => <path key={i} d={`M${12 + i * 11} 6 l7 0 l-3.5 13 z`} />)}{[0, 1, 2].map((i) => <path key={'b' + i} d={`M${17 + i * 11} 21 l7 0 l-3.5 13 z`} />)}</g>}
    </svg>
  )
}

export const SYM_NAMES: Record<string, string> = { tally: 'Riscos', roman: 'Romano', maya: 'Maia', baby: 'Babilônico' }
