import { useState } from 'react'
import { useStore, WallSide, LeanToWallType } from '../../store/useStore'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Slider } from '../ui/Slider'

interface LeanToSectionProps {
  side: WallSide
  label: string
}

function LeanToSection({ side, label }: LeanToSectionProps) {
  const { leanToConfigs, setLeanToConfig } = useStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const config = leanToConfigs[side]

  const wallOptions: { value: LeanToWallType; label: string }[] = [
    { value: 'full-length', label: 'Full Length' },
    { value: 'fully-enclosed', label: 'Fully Enclosed' },
    { value: 'open', label: 'Open' },
    { value: 'gable-dress', label: 'Gable Dress' },
    { value: 'gable-walls-only', label: 'Gable Walls Only' },
    { value: '2ft-apron', label: '2ft Apron Wall' },
  ]

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700 uppercase">{label}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-3 bg-white space-y-3">
          {/* Enabled Checkbox */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Enabled</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setLeanToConfig(side, { enabled: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
          </label>

          {/* Only show controls if enabled */}
          {config.enabled && (
            <>
              <Slider
                label="Drop"
                value={config.drop}
                min={0}
                max={5}
                step={1}
                onChange={(v) => setLeanToConfig(side, { drop: v })}
              />

              <Slider
                label="Cut L"
                value={config.cutL}
                min={0}
                max={20}
                step={1}
                onChange={(v) => setLeanToConfig(side, { cutL: v })}
              />

              <Slider
                label="Cut R"
                value={config.cutR}
                min={0}
                max={20}
                step={1}
                onChange={(v) => setLeanToConfig(side, { cutR: v })}
              />

              <Slider
                label="Depth"
                value={config.depth}
                min={4}
                max={20}
                step={1}
                onChange={(v) => setLeanToConfig(side, { depth: v })}
              />

              <Slider
                label="Roof Pitch"
                value={config.roofPitch}
                min={1}
                max={6}
                step={1}
                onChange={(v) => setLeanToConfig(side, { roofPitch: v })}
              />

              {/* Walls Dropdown */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Walls</span>
                <select
                  value={config.walls}
                  onChange={(e) => setLeanToConfig(side, { walls: e.target.value as LeanToWallType })}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  {wallOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function LeanTosPanel() {
  const leanToSections: { side: WallSide; label: string }[] = [
    { side: 'south', label: 'South End Wall Lean-To' },
    { side: 'west', label: 'West Sidewall Lean-To' },
    { side: 'north', label: 'North End Wall Lean-To' },
    { side: 'east', label: 'East Sidewall Lean-To' },
  ]

  return (
    <div>
      {leanToSections.map((section) => (
        <LeanToSection key={section.side} side={section.side} label={section.label} />
      ))}
    </div>
  )
}
