import { useState } from 'react'
import { useStore, DoorType, OpeningWall } from '../../store/useStore'
import { X, DoorOpen, LayoutGrid } from 'lucide-react'

// Door type definitions with default dimensions
const DOOR_TYPES: { type: DoorType; label: string; defaultWidth: number; defaultHeight: number; category: 'door' | 'window' }[] = [
  // Walk Doors
  { type: 'walk-single', label: 'Walk Door (Single)', defaultWidth: 3, defaultHeight: 6.67, category: 'door' },
  { type: 'walk-double', label: 'Walk Door (Double)', defaultWidth: 6, defaultHeight: 6.67, category: 'door' },
  { type: 'walk-half-glass', label: 'Walk Door (Half Glass)', defaultWidth: 3, defaultHeight: 6.67, category: 'door' },
  { type: 'sliding-glass', label: 'Sliding Glass Patio', defaultWidth: 6, defaultHeight: 6.67, category: 'door' },
  { type: 'dutch-equine', label: 'Dutch Equine', defaultWidth: 4, defaultHeight: 7, category: 'door' },
  // Overhead Doors
  { type: 'overhead', label: 'Overhead Door', defaultWidth: 10, defaultHeight: 10, category: 'door' },
  { type: 'overhead-modern', label: 'Overhead Modern Door', defaultWidth: 10, defaultHeight: 10, category: 'door' },
  { type: 'overhead-glass', label: 'Overhead Full Glass Door', defaultWidth: 10, defaultHeight: 10, category: 'door' },
  // Sliding/Roll-Up
  { type: 'sliding', label: 'Sliding', defaultWidth: 12, defaultHeight: 10, category: 'door' },
  { type: 'sliding-left', label: 'Sliding (Left)', defaultWidth: 12, defaultHeight: 10, category: 'door' },
  { type: 'sliding-right', label: 'Sliding (Right)', defaultWidth: 12, defaultHeight: 10, category: 'door' },
  { type: 'roll-up', label: 'Roll Up', defaultWidth: 10, defaultHeight: 10, category: 'door' },
  { type: 'bi-fold', label: 'Bi-Fold', defaultWidth: 12, defaultHeight: 12, category: 'door' },
  { type: 'hydraulic', label: 'Hydraulic', defaultWidth: 14, defaultHeight: 14, category: 'door' },
  // Windows
  { type: 'window-slider', label: 'Window - Slider', defaultWidth: 3, defaultHeight: 2, category: 'window' },
  { type: 'window-hopper', label: 'Window - Hopper', defaultWidth: 3, defaultHeight: 2, category: 'window' },
]

// Wall options for placement
const WALL_OPTIONS: { value: OpeningWall; label: string }[] = [
  { value: 'south', label: 'South' },
  { value: 'north', label: 'North' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
]

// Get icon for door type
const getDoorIcon = (type: DoorType): string => {
  if (type.startsWith('window')) return '🪟'
  if (type.startsWith('overhead') || type === 'roll-up' || type === 'bi-fold' || type === 'hydraulic') return '🚗'
  if (type.startsWith('sliding')) return '↔️'
  return '🚪'
}

export function DoorsWindowsPanel() {
  const { 
    openings, 
    addOpening, 
    updateOpening,
    removeOpening, 
    dimensions,
    ui,
    setSelectedOpeningId
  } = useStore()

  // Selected wall for placement
  const [selectedWall, setSelectedWall] = useState<OpeningWall>('south')

  // Get wall length based on wall side
  const getWallLength = (wall: OpeningWall): number => {
    if (wall === 'south' || wall === 'north') return dimensions.width
    if (wall === 'east' || wall === 'west') return dimensions.length
    return dimensions.width
  }

  const handleQuickAdd = (doorDef: typeof DOOR_TYPES[0]) => {
    const wallLength = getWallLength(selectedWall)
    addOpening({
      type: doorDef.type,
      wall: selectedWall,
      width: doorDef.defaultWidth,
      height: doorDef.defaultHeight,
      position: wallLength / 2 - doorDef.defaultWidth / 2,
      bottomOffset: doorDef.category === 'window' ? 4 : 0,
    })
  }

  const handlePositionChange = (openingId: string, newPosition: number) => {
    updateOpening(openingId, { position: newPosition })
  }

  const doors = DOOR_TYPES.filter(d => d.category === 'door')
  const windows = DOOR_TYPES.filter(d => d.category === 'window')

  return (
    <div className="space-y-4">
      {/* Wall Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Place on Wall</label>
        <select
          value={selectedWall}
          onChange={(e) => setSelectedWall(e.target.value as OpeningWall)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
        >
          {WALL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Doors */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
          <DoorOpen className="w-4 h-4" /> Doors
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {doors.map((door) => (
            <button
              key={door.type}
              onClick={() => handleQuickAdd(door)}
              className="w-full text-left py-1.5 px-2 rounded text-sm transition-colors bg-white border border-gray-300 hover:bg-gray-100"
            >
              {getDoorIcon(door.type)} {door.label}
            </button>
          ))}
        </div>
      </div>

      {/* Windows */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
          <LayoutGrid className="w-4 h-4" /> Windows
        </h4>
        <div className="space-y-1">
          {windows.map((win) => (
            <button
              key={win.type}
              onClick={() => handleQuickAdd(win)}
              className="w-full text-left py-1.5 px-2 rounded text-sm transition-colors bg-white border border-gray-300 hover:bg-gray-100"
            >
              {getDoorIcon(win.type)} {win.label}
            </button>
          ))}
        </div>
      </div>

      {/* Added Openings */}
      {openings.length > 0 && (
        <div className="pt-4 border-t border-gray-300">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Added ({openings.length})</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {openings.map((opening) => {
              const wallLength = getWallLength(opening.wall)
              const maxPosition = Math.max(0, wallLength - opening.width)
              
              return (
                <div
                  key={opening.id}
                  className={`rounded p-3 transition-colors ${
                    ui.selectedOpeningId === opening.id
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="text-sm text-gray-700 cursor-pointer"
                      onClick={() => setSelectedOpeningId(opening.id)}
                    >
                      {getDoorIcon(opening.type)} {opening.width}×{opening.height}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={opening.wall}
                        onChange={(e) => updateOpening(opening.id, { 
                          wall: e.target.value as OpeningWall,
                          position: getWallLength(e.target.value as OpeningWall) / 2 - opening.width / 2
                        })}
                        className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                      >
                        {WALL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeOpening(opening.id)}
                        className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Position slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Position</span>
                      <span>{opening.position.toFixed(1)} ft from left</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={maxPosition}
                      step={0.5}
                      value={opening.position}
                      onChange={(e) => handlePositionChange(opening.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
