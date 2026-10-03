import { useLevel } from '../../engine/level'
import { SkyDome, Lights } from '../../world/Atmosphere'
import { RoundPlatform } from '../../world/Architecture'

/** Sala da Computação — em construção (substituir pelo nível completo). */
export default function Computacao() {
  useLevel({ spawn: [0, 0.2, 0], yaw: Math.PI })
  return (<><SkyDome preset="cyber" /><Lights preset="cyber" /><RoundPlatform position={[0, 0, 0]} r={12} /></>)
}
