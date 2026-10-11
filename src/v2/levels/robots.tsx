import { SPEAKERS } from '../ui/Icons'
import { TIMBRE } from '../engine/voice'
import { robotSprite, type RobotKind } from '../art/creatures'

/* =========================================================
   Robôs que conversam (Arquivista, Fatiador, Professora Peso…):
   nome, cor, retrato tirado do próprio sprite e timbre da voz.
   ========================================================= */
const URLS = new Map<string, string>()
function faceURL(kind: RobotKind, color: string, bg: string) {
  const k = kind + color + bg
  let u = URLS.get(k)
  if (!u) {
    const s = robotSprite(kind, color, { x: 0.3, y: 1 }, 0)
    const c = document.createElement('canvas'); c.width = 22; c.height = 22
    const g = c.getContext('2d')!
    g.fillStyle = bg; g.fillRect(0, 0, 22, 22)
    g.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = 0; y < 22; y += 3) g.fillRect(0, y, 22, 1)
    g.drawImage(s.img, 0, 3)
    u = c.toDataURL(); URLS.set(k, u)
  }
  return u
}

export function registerRobot(id: string, name: string, kind: RobotKind, color: string, timbre = { pitch: 1.25, rate: 1.06 }, bg = '#101a34') {
  if (SPEAKERS[id]) return
  SPEAKERS[id] = { name, color, face: () => <img className="pxface" alt="" draggable={false} src={faceURL(kind, color, bg)} /> }
  TIMBRE[id] = timbre
}
