import { useStore, WallSide } from '../../store/useStore'
import { Slider } from '../ui/Slider'

export function WallsPanel() {
  const { walls, setWalls, setWallEnclosed } = useStore()

  const wallSides: { key: WallSide; label: string }[] = [
    { key: 'south', label: 'Enclosed South' },
    { key: 'north', label: 'Enclosed North' },
    { key: 'west', label: 'Enclosed West' },
    { key: 'east', label: 'Enclosed East' },
  ]

  return (
    <div className="space-y-4">
      {/* Wall Enclosed Checkboxes */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Wall Panels</h4>
        {wallSides.map((side) => (
          <div key={side.key} className="mb-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={walls.enclosed[side.key]}
                onChange={(e) => setWallEnclosed(side.key, e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">{side.label}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Wainscot Toggle */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Wainscot</h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={walls.wainscotEnabled}
            onChange={(e) => setWalls({ wainscotEnabled: e.target.checked })}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <span className="text-sm font-medium text-gray-700">Add Wainscot</span>
        </label>
      </div>

      {/* Wainscot Height - only show if enabled */}
      {walls.wainscotEnabled && (
        <div className="ml-7">
          <Slider
            label="Wainscot Height (ft)"
            value={walls.wainscotHeight}
            min={1}
            max={6}
            step={0.5}
            onChange={(v) => setWalls({ wainscotHeight: v })}
          />
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          Uncheck a wall to leave it open (no panel). Wainscot adds a contrasting color band at the base of enclosed walls.
        </p>
      </div>
    </div>
  )
}
