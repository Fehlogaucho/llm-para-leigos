import { useEffect, type ReactNode } from 'react'
import { G } from '../store'
import { Ico } from '../ui/Icons'

/** Mostra um painel de interface (DOM) a partir de um componente 3D. */
export function useOverlay(id: string, node: ReactNode | null, deps: any[]) {
  useEffect(() => { G().setOverlay(id, node) }, deps)
  useEffect(() => () => G().setOverlay(id, null), [])
}

/** Painel padrão de quebra-cabeça. */
export function Panel({ title, children, onExit, top = false }: { title: string; children?: ReactNode; onExit?: () => void; top?: boolean }) {
  return (
    <div className={'pz' + (top ? ' top' : '')} onPointerDown={(e) => e.stopPropagation()}>
      {onExit && <button className="icon-btn exit" onClick={onExit} aria-label="Sair">{Ico.close}</button>}
      <h4>{title}</h4>
      {children}
    </div>
  )
}

/** Moldura circular de luneta. */
export function Scope({ children }: { children?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 46%, transparent 0, transparent min(36vw, 36vh), rgba(3,5,10,.96) calc(min(36vw, 36vh) + 4px))' }}>
      <div style={{ position: 'absolute', left: '50%', top: '46%', width: 'min(72vw, 72vh)', height: 'min(72vw, 72vh)', transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '3px solid rgba(232,182,90,.7)', boxShadow: '0 0 30px rgba(232,182,90,.35) inset' }} />
      <div style={{ position: 'absolute', left: '50%', top: '46%', width: 26, height: 26, transform: 'translate(-50%,-50%)', border: '1.5px solid rgba(255,255,255,.55)', borderRadius: '50%' }} />
      {children}
    </div>
  )
}
