import { IS_TOUCH } from '../store'

export type Quality = 'low' | 'high'
/** Qualidade gráfica atual (lida pelos objetos ao montar). */
export const QUALITY = { q: (IS_TOUCH || Math.min(screen.width, screen.height) < 700 ? 'low' : 'high') as Quality }
