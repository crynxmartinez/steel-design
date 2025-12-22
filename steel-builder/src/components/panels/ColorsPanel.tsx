import { useStore } from '../../store/useStore'
import { ColorPicker } from '../ui/ColorPicker'

export function ColorsPanel() {
  const { colors, setColor } = useStore()

  return (
    <div>
      <ColorPicker
        label="Roof Color"
        value={colors.roof}
        onChange={(c) => setColor('roof', c)}
      />
      <ColorPicker
        label="Wall Color"
        value={colors.wall}
        onChange={(c) => setColor('wall', c)}
      />
      <ColorPicker
        label="Trim Color"
        value={colors.trim}
        onChange={(c) => setColor('trim', c)}
      />
      <ColorPicker
        label="Wainscot Color"
        value={colors.wainscot}
        onChange={(c) => setColor('wainscot', c)}
      />
    </div>
  )
}
