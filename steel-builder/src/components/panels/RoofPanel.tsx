import { useStore, WallSide } from '../../store/useStore'
import { Slider } from '../ui/Slider'

export function RoofPanel() {
  const { roof, setRoof, setRoofOverhang } = useStore()

  const sides: { key: WallSide; label: string }[] = [
    { key: 'south', label: 'South End Wall' },
    { key: 'north', label: 'North End Wall' },
    { key: 'west', label: 'West Sidewall' },
    { key: 'east', label: 'East Sidewall' },
  ]

  return (
    <div className="space-y-4">
      {/* Roof Overhangs */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Roof Overhangs (ft)</h4>
        {sides.map((side) => (
          <Slider
            key={side.key}
            label={side.label}
            value={roof.overhangs[side.key]}
            min={0}
            max={side.key === 'east' || side.key === 'west' ? 4 : 20}
            step={1}
            onChange={(v) => setRoofOverhang(side.key, v)}
          />
        ))}
      </div>

      {/* Ridge Vents */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Ridge Vents</h4>
        <Slider
          label="Count"
          value={roof.ridgeVents}
          min={0}
          max={10}
          step={1}
          onChange={(v) => setRoof({ ridgeVents: v })}
        />
      </div>

      {/* Cupolas */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Cupolas</h4>
        <Slider
          label="2' Cupola"
          value={roof.cupola2ft}
          min={0}
          max={5}
          step={1}
          onChange={(v) => setRoof({ cupola2ft: v })}
        />
        <Slider
          label="3' Cupola"
          value={roof.cupola3ft}
          min={0}
          max={5}
          step={1}
          onChange={(v) => setRoof({ cupola3ft: v })}
        />
      </div>
    </div>
  )
}
