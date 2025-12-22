import { useStore } from '../../store/useStore'
import { Slider } from '../ui/Slider'

export function DimensionsPanel() {
  const { dimensions, roof, setDimensions, setRoof } = useStore()
  const sqFootage = dimensions.width * dimensions.length

  return (
    <div>
      <Slider
        label="Width (ft)"
        value={dimensions.width}
        min={20}
        max={100}
        step={2}
        onChange={(v) => setDimensions({ width: v })}
      />

      <Slider
        label="Length (ft)"
        value={dimensions.length}
        min={20}
        max={200}
        step={2}
        onChange={(v) => setDimensions({ length: v })}
      />

      <Slider
        label="Height (ft)"
        value={dimensions.eaveHeight}
        min={8}
        max={24}
        step={1}
        onChange={(v) => setDimensions({ eaveHeight: v })}
      />

      {/* Roof Type */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">Roof Type</label>
        <select
          value={roof.style}
          onChange={(e) => setRoof({ style: e.target.value as 'gable' | 'single-slope' | 'asymmetrical' })}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="gable">Gabled</option>
          <option value="single-slope">Single Slope</option>
          <option value="asymmetrical">Asymmetrical</option>
        </select>
      </div>

      {/* Asymmetric Offset - only show when asymmetrical roof is selected */}
      {roof.style === 'asymmetrical' && (
        <Slider
          label="Asymmetrical"
          value={roof.asymmetricOffset}
          min={1}
          max={9}
          step={1}
          onChange={(v) => setRoof({ asymmetricOffset: v })}
        />
      )}

      <Slider
        label="Roof Pitch / 12&quot;"
        value={roof.pitch}
        min={1}
        max={6}
        step={0.5}
        onChange={(v) => setRoof({ pitch: v })}
      />

      {/* Square Footage */}
      <div className="pt-4 mt-4 border-t border-gray-300">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Sq Footage</span>
          <span className="text-xl font-bold text-primary">{sqFootage.toLocaleString()} sq ft</span>
        </div>
      </div>
    </div>
  )
}
