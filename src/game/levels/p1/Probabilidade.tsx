import { useLevel } from '../../engine/level'
import { SkyDome, Lights } from '../../world/Atmosphere'
import { RoundPlatform } from '../../world/Architecture'

/** Câmara da Probabilidade — em construção (substituir pelo nível completo). */
export default function Probabilidade() {
  useLevel({ spawn: [0, 0.2, 0], yaw: Math.PI })
  return (<><SkyDome preset="night" /><Lights preset="night" /><RoundPlatform position={[0, 0, 0]} r={12} /></>)
}
