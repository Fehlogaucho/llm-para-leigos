import { useLevel } from '../../engine/level'
import { SkyDome, Lights } from '../../world/Atmosphere'
import { RoundPlatform } from '../../world/Architecture'

/** Oficina das Máquinas — em construção (substituir pelo nível completo). */
export default function Oficina() {
  useLevel({ spawn: [0, 0.2, 0], yaw: Math.PI })
  return (<><SkyDome preset="dusk" /><Lights preset="dusk" /><RoundPlatform position={[0, 0, 0]} r={12} /></>)
}
