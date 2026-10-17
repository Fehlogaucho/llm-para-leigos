import { useEffect } from 'react'
import { bindKeyboard } from './engine/input'
import { GameView } from './engine/View'
import { TopBar, Prompt, Joystick, ObjectiveArrow, Banners, Toast, CinemaBars, Overlays, WarpFlash, TravelButton } from './ui/HUD'
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
        <TravelButton />
        <Joystick />
        <Banners />
        <Toast />
        <Overlays />
        <Dialogue />
        <CinemaBars />
        <WarpFlash />
        <Menus />
      </div>
      <Loading />
    </>
  )
}
