import { useEffect } from 'react'
import { bindKeyboard } from './engine/input'
import { GameView } from './engine/View'
import { TopBar, Prompt, Joystick, ObjectiveArrow, Banners, Toast, CinemaBars, Overlays } from './ui/HUD'
import { Dialogue } from './ui/Dialogue'
import { Menus } from './ui/Menus'
import { Loading } from './ui/Loading'

export function Game() {
  useEffect(() => { bindKeyboard() }, [])
  return (
    <>
      <GameView />
      <div className="layer">
        <TopBar />
        <ObjectiveArrow />
        <Prompt />
        <Joystick />
        <Banners />
        <Toast />
        <Overlays />
        <Dialogue />
        <CinemaBars />
        <Menus />
      </div>
      <Loading />
    </>
  )
}
