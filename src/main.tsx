import { createRoot } from 'react-dom/client'
import '@fontsource/cinzel/700.css'
import '@fontsource/cinzel/900.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import '@fontsource/jetbrains-mono/700.css'
import './styles.css'
import App from './App'
import { IS_TOUCH, useGame } from './game/store'
import { RT, INTERACTS } from './game/engine/runtime'
import { gotoLevel } from './game/engine/script'

if (IS_TOUCH) document.documentElement.classList.add('touch')
// ganchos para testes automáticos
;(window as any).__pf = { useGame, RT, INTERACTS, gotoLevel }

createRoot(document.getElementById('root')!).render(<App />)
