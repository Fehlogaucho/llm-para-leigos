import { useLevel } from '../../engine/level'
import { SkyDome, Lights } from '../../world/Atmosphere'
import { RoundPlatform } from '../../world/Architecture'

/** Jardim da Lógica — em construção (substituir pelo nível completo). */
export default function Jardim() {
  useLevel({ spawn: [0, 0.2, 0], yaw: Math.PI })
  return (<><SkyDome preset="day" /><Lights preset="day" /><RoundPlatform position={[0, 0, 0]} r={12} /></>)
}
