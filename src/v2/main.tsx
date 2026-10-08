import { createRoot } from 'react-dom/client'
import '@fontsource/cinzel/700.css'
import '@fontsource/cinzel/900.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import '@fontsource/jetbrains-mono/700.css'
import '../styles.css'
import './v2.css'
import App from './App'
import { preloadFaces } from './ui/Icons'
import { IS_TOUCH, useGame } from './store'
import { RT, INTERACTS, FOCUS } from './engine/runtime'
import { INPUT } from './engine/input'
import { gotoLevel } from './engine/script'
import { findPath } from './engine/world'

if (IS_TOUCH) document.documentElement.classList.add('touch')
setTimeout(preloadFaces, 1500)
// ganchos para testes automáticos
;(window as any).__pf = {
  useGame, RT, INTERACTS, INPUT, FOCUS, gotoLevel,
  walkTo: (x: number, y: number) => { if (!RT.scene) return false; const p = findPath(RT.scene, [RT.player.x, RT.player.y], [x, y]); if (p) RT.path = p; return !!p },
}

createRoot(document.getElementById('root')!).render(<App />)
