import { memo } from 'react'
// import { useTheme } from '../../theme'
import { useScene } from './useScene'
import { renderTree } from './render'
import { Scene } from '../../../engine/prompts'

export const Renderer = ({ children }: { children?: string | Scene }) => {
  const root = useScene(children)
  // const [theme, setTheme] = useTheme()

  return (
    <div className="bg-primary-background h-screen w-screen">
      {renderTree(root)}
    </div>
  )
}
export const SceneRenderer = memo(Renderer)