import { Printer, Share2, Save, RotateCcw, Eye, EyeOff, Mail } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Accordion } from '../ui/Accordion'
import { DimensionsPanel } from '../panels/DimensionsPanel'
import { ColorsPanel } from '../panels/ColorsPanel'
import { RoofPanel } from '../panels/RoofPanel'
import { WallsPanel } from '../panels/WallsPanel'
import { DoorsWindowsPanel } from '../panels/DoorsWindowsPanel'
import { LeanTosPanel } from '../panels/LeanTosPanel'
import { EnvironmentPanel } from '../panels/EnvironmentPanel'

export function Sidebar() {
  const { 
    ui, 
    setExpandedPanel, 
    setViewMode, 
    setVisibilityMode, 
    resetView 
  } = useStore()

  const getVisibilityLabel = () => {
    switch (ui.visibilityMode) {
      case 'full': return 'HIDE WALLS'
      case 'hide-walls': return 'HIDE ROOF'
      case 'hide-roof': return 'FRAME ONLY'
      case 'frame-only': return 'SHOW ALL'
      default: return 'HIDE WALLS'
    }
  }

  const cycleVisibility = () => {
    const modes: Array<'full' | 'hide-walls' | 'hide-roof' | 'frame-only'> = [
      'full', 'hide-walls', 'hide-roof', 'frame-only'
    ]
    const currentIndex = modes.indexOf(ui.visibilityMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setVisibilityMode(modes[nextIndex])
  }

  const panels = [
    { id: 'dimensions', title: 'BUILDING DIMENSIONS', component: DimensionsPanel },
    { id: 'colors', title: 'COLORS', component: ColorsPanel },
    { id: 'roof', title: 'ROOF', component: RoofPanel },
    { id: 'walls', title: 'WALLS', component: WallsPanel },
    { id: 'doors-windows', title: 'DOORS & WINDOWS', component: DoorsWindowsPanel },
    { id: 'lean-tos', title: 'LEAN-TOS', component: LeanTosPanel },
    { id: 'environment', title: 'ENVIRONMENT', component: EnvironmentPanel },
  ]

  return (
    <aside className="w-[360px] bg-dark-300 h-full flex flex-col overflow-hidden">
      {/* CTA Button */}
      <button className="w-full py-4 bg-primary hover:bg-primary-hover text-white text-base font-bold flex items-center justify-center gap-3 transition-colors">
        <Mail className="w-5 h-5" />
        SUBMIT FOR ESTIMATE
      </button>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 border-b border-dark-200">
        <button className="py-3 bg-dark-400 hover:bg-dark-300 text-white text-sm font-medium flex items-center justify-center gap-2 border-r border-dark-200 transition-colors">
          <Printer className="w-4 h-4" />
          PRINT
        </button>
        <button className="py-3 bg-dark-400 hover:bg-dark-300 text-white text-sm font-medium flex items-center justify-center gap-2 border-r border-dark-200 transition-colors">
          <Share2 className="w-4 h-4" />
          SHARE
        </button>
        <button className="py-3 bg-dark-400 hover:bg-dark-300 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          <Save className="w-4 h-4" />
          SAVE
        </button>
      </div>

      {/* View Controls */}
      <div className="grid grid-cols-3 border-b border-dark-200">
        <button 
          onClick={resetView}
          className="py-3 bg-dark-400 hover:bg-dark-300 text-white text-sm font-medium flex items-center justify-center gap-2 border-r border-dark-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          RESET
        </button>
        <button 
          onClick={() => setViewMode(ui.viewMode === 'exterior' ? 'interior' : 'exterior')}
          className={`py-3 text-white text-sm font-medium flex items-center justify-center gap-2 border-r border-dark-200 transition-colors ${
            ui.viewMode === 'interior' ? 'bg-primary' : 'bg-dark-400 hover:bg-dark-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          {ui.viewMode === 'interior' ? 'OUTSIDE' : 'INSIDE'}
        </button>
        <button 
          onClick={cycleVisibility}
          className={`py-3 text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
            ui.visibilityMode !== 'full' ? 'bg-primary' : 'bg-dark-400 hover:bg-dark-300'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          <span className="text-xs">{getVisibilityLabel()}</span>
        </button>
      </div>

      {/* Accordion Panels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {panels.map((panel) => (
          <Accordion
            key={panel.id}
            title={panel.title}
            isExpanded={ui.expandedPanel === panel.id}
            onToggle={() => setExpandedPanel(ui.expandedPanel === panel.id ? null : panel.id)}
          >
            <panel.component />
          </Accordion>
        ))}
      </div>
    </aside>
  )
}
