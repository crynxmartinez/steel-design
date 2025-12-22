import { create } from 'zustand'

// Types
export type RoofStyle = 'gable' | 'single-slope' | 'asymmetrical'
export type WallSide = 'north' | 'south' | 'east' | 'west'
export type SkyType = 'day' | 'sunset' | 'night'
export type GroundType = 'grass' | 'concrete' | 'gravel'
export type ViewMode = 'exterior' | 'interior'
export type VisibilityMode = 'full' | 'hide-walls' | 'hide-roof' | 'frame-only'

export type LeanToWallType = 'full-length' | 'fully-enclosed' | 'open' | 'gable-dress' | 'gable-walls-only' | '2ft-apron'

// Door and Window Types
export type DoorType = 
  | 'walk-single'
  | 'walk-double'
  | 'walk-half-glass'
  | 'sliding-glass'
  | 'dutch-equine'
  | 'overhead'
  | 'overhead-modern'
  | 'overhead-glass'
  | 'sliding'
  | 'sliding-left'
  | 'sliding-right'
  | 'roll-up'
  | 'bi-fold'
  | 'hydraulic'
  | 'window-slider'
  | 'window-hopper'

export type OpeningWall = 
  | 'north' | 'south' | 'east' | 'west'
  | 'lean-to-north' | 'lean-to-south' | 'lean-to-east' | 'lean-to-west'

export interface LeanToConfig {
  enabled: boolean
  drop: number        // Height drop from main building eave (0-5 ft)
  cutL: number        // Left side cut/inset (0-20 ft)
  cutR: number        // Right side cut/inset (0-20 ft)
  depth: number       // How far it extends from the wall (4-20 ft)
  roofPitch: number   // Pitch of lean-to roof (1-6)
  walls: LeanToWallType  // Wall coverage type
}

export interface LeanTo {
  id: string
  wall: WallSide
  width: number
  length: number
  height: number
}

export interface Opening {
  id: string
  type: DoorType
  wall: OpeningWall
  position: number      // Distance from left edge of wall (in feet)
  width: number         // Width in feet
  height: number        // Height in feet
  bottomOffset: number  // Distance from ground (in feet, default 0)
}

export interface BuildingState {
  // Dimensions
  dimensions: {
    width: number
    length: number
    eaveHeight: number
  }

  // Roof
  roof: {
    style: RoofStyle
    pitch: number
    asymmetricOffset: number  // 0-10, where 5 is center (symmetric), 0 is full left, 10 is full right
    overhangs: Record<WallSide, number>
    ridgeVents: number  // Number of ridge vents (0-10)
    cupola2ft: number   // Number of 2' cupolas (0-5)
    cupola3ft: number   // Number of 3' cupolas (0-5)
  }

  // Colors
  colors: {
    roof: string
    wall: string
    trim: string
    wainscot: string
  }

  // Walls
  walls: {
    enclosed: Record<WallSide, boolean>  // Which walls are enclosed (have panels)
    wainscotEnabled: boolean
    wainscotHeight: number
  }

  // Lean-tos (new structure - one config per wall side)
  leanToConfigs: Record<WallSide, LeanToConfig>
  
  // Legacy lean-tos (keeping for compatibility)
  leanTos: LeanTo[]

  // Openings (doors & windows)
  openings: Opening[]

  // Environment
  environment: {
    sky: SkyType
    ground: GroundType
    showGrid: boolean
  }

  // UI State
  ui: {
    expandedPanel: string | null
    viewMode: ViewMode
    visibilityMode: VisibilityMode
    placementMode: DoorType | null  // Currently placing this door type
    selectedOpeningId: string | null  // Currently selected opening for editing
    isDraggingDoor: boolean  // True when dragging a door (disables orbit controls)
  }

  // Actions
  setDimensions: (dims: Partial<BuildingState['dimensions']>) => void
  setRoof: (roof: Partial<BuildingState['roof']>) => void
  setRoofOverhang: (side: WallSide, value: number) => void
  setColor: (key: keyof BuildingState['colors'], value: string) => void
  setWalls: (walls: Partial<BuildingState['walls']>) => void
  setWallEnclosed: (side: WallSide, enclosed: boolean) => void
  setLeanToConfig: (side: WallSide, config: Partial<LeanToConfig>) => void
  addLeanTo: (leanTo: Omit<LeanTo, 'id'>) => void
  updateLeanTo: (id: string, updates: Partial<LeanTo>) => void
  removeLeanTo: (id: string) => void
  addOpening: (opening: Omit<Opening, 'id'>) => void
  updateOpening: (id: string, updates: Partial<Opening>) => void
  removeOpening: (id: string) => void
  setPlacementMode: (mode: DoorType | null) => void
  setSelectedOpeningId: (id: string | null) => void
  setIsDraggingDoor: (isDragging: boolean) => void
  setEnvironment: (env: Partial<BuildingState['environment']>) => void
  setExpandedPanel: (panel: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setVisibilityMode: (mode: VisibilityMode) => void
  resetView: () => void
}

export const useStore = create<BuildingState>((set) => ({
  // Initial Dimensions
  dimensions: {
    width: 30,
    length: 40,
    eaveHeight: 10,
  },

  // Initial Roof
  roof: {
    style: 'gable',
    pitch: 4,
    asymmetricOffset: 4,  // Default offset (0-10, where 5 is center)
    overhangs: {
      north: 0,
      south: 0,
      east: 1,
      west: 1,
    },
    ridgeVents: 0,
    cupola2ft: 0,
    cupola3ft: 0,
  },

  // Initial Colors
  colors: {
    roof: '#5c4033',
    wall: '#e8e4d9',
    trim: '#5c4033',
    wainscot: '#5c4033',
  },

  // Initial Walls
  walls: {
    enclosed: {
      north: true,
      south: true,
      east: true,
      west: true,
    },
    wainscotEnabled: false,
    wainscotHeight: 3,
  },

  // Initial Lean-to Configs (one per wall side)
  leanToConfigs: {
    south: { enabled: false, drop: 1, cutL: 0, cutR: 0, depth: 12, roofPitch: 3, walls: 'full-length' },
    north: { enabled: false, drop: 1, cutL: 0, cutR: 0, depth: 12, roofPitch: 3, walls: 'full-length' },
    west: { enabled: false, drop: 1, cutL: 0, cutR: 0, depth: 12, roofPitch: 3, walls: 'full-length' },
    east: { enabled: false, drop: 1, cutL: 0, cutR: 0, depth: 12, roofPitch: 3, walls: 'full-length' },
  },

  // Legacy Lean-tos (keeping for compatibility)
  leanTos: [],

  // Initial Openings
  openings: [],

  // Initial Environment
  environment: {
    sky: 'day',
    ground: 'grass',
    showGrid: true,
  },

  // Initial UI State
  ui: {
    expandedPanel: 'dimensions',
    viewMode: 'exterior',
    visibilityMode: 'full',
    placementMode: null,
    selectedOpeningId: null,
    isDraggingDoor: false,
  },

  // Actions
  setDimensions: (dims) =>
    set((state) => ({
      dimensions: { ...state.dimensions, ...dims },
    })),

  setRoof: (roof) =>
    set((state) => ({
      roof: { ...state.roof, ...roof },
    })),

  setRoofOverhang: (side, value) =>
    set((state) => ({
      roof: {
        ...state.roof,
        overhangs: { ...state.roof.overhangs, [side]: value },
      },
    })),

  setColor: (key, value) =>
    set((state) => ({
      colors: { ...state.colors, [key]: value },
    })),

  setWalls: (walls) =>
    set((state) => ({
      walls: { ...state.walls, ...walls },
    })),

  setWallEnclosed: (side, enclosed) =>
    set((state) => ({
      walls: {
        ...state.walls,
        enclosed: { ...state.walls.enclosed, [side]: enclosed },
      },
    })),

  setLeanToConfig: (side, config) =>
    set((state) => ({
      leanToConfigs: {
        ...state.leanToConfigs,
        [side]: { ...state.leanToConfigs[side], ...config },
      },
    })),

  addLeanTo: (leanTo) =>
    set((state) => ({
      leanTos: [...state.leanTos, { ...leanTo, id: `leanto-${Date.now()}` }],
    })),

  updateLeanTo: (id, updates) =>
    set((state) => ({
      leanTos: state.leanTos.map((lt) =>
        lt.id === id ? { ...lt, ...updates } : lt
      ),
    })),

  removeLeanTo: (id) =>
    set((state) => ({
      leanTos: state.leanTos.filter((lt) => lt.id !== id),
    })),

  addOpening: (opening) =>
    set((state) => ({
      openings: [...state.openings, { ...opening, id: `opening-${Date.now()}` }],
    })),

  updateOpening: (id, updates) =>
    set((state) => ({
      openings: state.openings.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  removeOpening: (id) =>
    set((state) => ({
      openings: state.openings.filter((o) => o.id !== id),
    })),

  setPlacementMode: (mode) =>
    set((state) => ({
      ui: { ...state.ui, placementMode: mode, selectedOpeningId: null },
    })),

  setSelectedOpeningId: (id) =>
    set((state) => ({
      ui: { ...state.ui, selectedOpeningId: id, placementMode: null },
    })),

  setIsDraggingDoor: (isDragging) =>
    set((state) => ({
      ui: { ...state.ui, isDraggingDoor: isDragging },
    })),

  setEnvironment: (env) =>
    set((state) => ({
      environment: { ...state.environment, ...env },
    })),

  setExpandedPanel: (panel) =>
    set((state) => ({
      ui: { ...state.ui, expandedPanel: panel },
    })),

  setViewMode: (mode) =>
    set((state) => ({
      ui: { ...state.ui, viewMode: mode },
    })),

  setVisibilityMode: (mode) =>
    set((state) => ({
      ui: { ...state.ui, visibilityMode: mode },
    })),

  resetView: () =>
    set((state) => ({
      ui: { ...state.ui, viewMode: 'exterior', visibilityMode: 'full' },
    })),
}))
