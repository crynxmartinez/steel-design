import { useStore, SkyType, GroundType } from '../../store/useStore'

export function EnvironmentPanel() {
  const { environment, setEnvironment } = useStore()

  const skyOptions: { value: SkyType; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'night', label: 'Night' },
  ]

  const groundOptions: { value: GroundType; label: string }[] = [
    { value: 'grass', label: 'Grass' },
    { value: 'concrete', label: 'Concrete' },
    { value: 'gravel', label: 'Gravel' },
  ]

  return (
    <div>
      {/* Sky */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Sky</h4>
        <div className="flex gap-3">
          {skyOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sky"
                value={option.value}
                checked={environment.sky === option.value}
                onChange={() => setEnvironment({ sky: option.value })}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ground */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Ground</h4>
        <div className="flex gap-3">
          {groundOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ground"
                value={option.value}
                checked={environment.ground === option.value}
                onChange={() => setEnvironment({ ground: option.value })}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Grid Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={environment.showGrid}
            onChange={(e) => setEnvironment({ showGrid: e.target.checked })}
          />
          <span className="text-sm font-medium text-gray-700">Show Grid</span>
        </label>
      </div>
    </div>
  )
}
