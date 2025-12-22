import { useStore, Opening, OpeningWall } from '../../store/useStore'
import { useMemo, useState, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useCorrugatedTexture } from './MetalMaterial'

// Draggable Door Component
interface DraggableDoorProps {
  opening: Opening
  buildingWidth: number
  buildingLength: number
}

function DraggableDoor({ opening, buildingWidth, buildingLength }: DraggableDoorProps) {
  const { updateOpening, ui, setSelectedOpeningId, setIsDraggingDoor } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragStartRef = useRef<{ position: number; bottomOffset: number; mouseX: number; mouseY: number } | null>(null)
  const { size } = useThree()
  
  const isSelected = ui.selectedOpeningId === opening.id
  
  // Get wall length based on wall side
  const getWallLength = (wall: OpeningWall): number => {
    if (wall === 'south' || wall === 'north') return buildingWidth
    if (wall === 'east' || wall === 'west') return buildingLength
    return buildingWidth
  }
  
  const wallLength = getWallLength(opening.wall)
  const maxPosition = Math.max(0, wallLength - opening.width)
  
  // Calculate door position based on wall
  let doorPosition: [number, number, number] = [0, 0, 0]
  let doorRotation: [number, number, number] = [0, 0, 0]
  
  // Position doors in front of wainscot (wainscot is at +/- 0.3, so doors at +/- 0.5)
  switch (opening.wall) {
    case 'south':
      doorPosition = [
        -buildingWidth / 2 + opening.position + opening.width / 2,
        opening.bottomOffset + opening.height / 2,
        buildingLength / 2 + 0.5
      ]
      doorRotation = [0, 0, 0]
      break
    case 'north':
      doorPosition = [
        -buildingWidth / 2 + opening.position + opening.width / 2,
        opening.bottomOffset + opening.height / 2,
        -buildingLength / 2 - 0.5
      ]
      doorRotation = [0, Math.PI, 0]
      break
    case 'east':
      doorPosition = [
        buildingWidth / 2 + 0.5,
        opening.bottomOffset + opening.height / 2,
        -buildingLength / 2 + opening.position + opening.width / 2
      ]
      doorRotation = [0, -Math.PI / 2, 0]
      break
    case 'west':
      doorPosition = [
        -buildingWidth / 2 - 0.5,
        opening.bottomOffset + opening.height / 2,
        -buildingLength / 2 + opening.position + opening.width / 2
      ]
      doorRotation = [0, Math.PI / 2, 0]
      break
  }
  
  // Door color based on type
  const isWindow = opening.type.startsWith('window')
  const isOverhead = opening.type.startsWith('overhead') || opening.type === 'roll-up' || opening.type === 'bi-fold' || opening.type === 'hydraulic'
  const doorColor = isWindow ? '#87CEEB' : isOverhead ? '#4a4a4a' : '#8B4513'
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    setIsDragging(true)
    setIsDraggingDoor(true)  // Disable orbit controls
    setSelectedOpeningId(opening.id)
    dragStartRef.current = {
      position: opening.position,
      bottomOffset: opening.bottomOffset,
      mouseX: e.clientX || e.nativeEvent?.clientX || 0,
      mouseY: e.clientY || e.nativeEvent?.clientY || 0
    }
    // Capture pointer
    e.target?.setPointerCapture?.(e.pointerId)
  }
  
  const handlePointerMove = (e: any) => {
    if (!isDragging || !dragStartRef.current) return
    
    const clientX = e.clientX || e.nativeEvent?.clientX || 0
    const clientY = e.clientY || e.nativeEvent?.clientY || 0
    const deltaX = clientX - dragStartRef.current.mouseX
    const deltaY = clientY - dragStartRef.current.mouseY
    
    // Convert screen delta to world units (approximate)
    const sensitivityX = wallLength / size.width * 2
    const sensitivityY = 20 / size.height * 2  // Approximate wall height sensitivity
    
    // Horizontal movement (all openings)
    let newPosition = dragStartRef.current.position + deltaX * sensitivityX
    
    // For north wall, invert the direction
    if (opening.wall === 'north') {
      newPosition = dragStartRef.current.position - deltaX * sensitivityX
    }
    // For west wall, invert the direction
    if (opening.wall === 'west') {
      newPosition = dragStartRef.current.position - deltaX * sensitivityX
    }
    
    // Clamp horizontal to wall bounds
    newPosition = Math.max(0, Math.min(maxPosition, newPosition))
    
    // Vertical movement - ONLY for windows
    let newBottomOffset = opening.bottomOffset
    if (isWindow) {
      newBottomOffset = dragStartRef.current.bottomOffset - deltaY * sensitivityY
      // Clamp vertical (0 = ground, max depends on wall height minus window height)
      const maxBottomOffset = Math.max(0, 14 - opening.height)  // Assuming ~14ft max wall height
      newBottomOffset = Math.max(0, Math.min(maxBottomOffset, newBottomOffset))
    }
    
    updateOpening(opening.id, { position: newPosition, bottomOffset: newBottomOffset })
  }
  
  const handlePointerUp = (e: any) => {
    setIsDragging(false)
    setIsDraggingDoor(false)  // Re-enable orbit controls
    dragStartRef.current = null
    e.target?.releasePointerCapture?.(e.pointerId)
  }
  
  return (
    <group position={doorPosition} rotation={doorRotation}>
      {/* Selection/hover outline */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[opening.width + 0.4, opening.height + 0.3, 0.1]} />
          <meshBasicMaterial color={isSelected ? '#3b82f6' : '#60a5fa'} transparent opacity={0.5} />
        </mesh>
      )}
      
      {/* Door/Window frame */}
      <mesh>
        <boxGeometry args={[opening.width, opening.height, 0.3]} />
        <meshStandardMaterial color={doorColor} metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Invisible hit area for clicking/dragging - MUST be in front */}
      <mesh
        position={[0, 0, 0.3]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxGeometry args={[opening.width + 0.3, opening.height + 0.3, 0.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Glass for windows and glass doors */}
      {(isWindow || opening.type === 'sliding-glass' || opening.type === 'overhead-glass' || opening.type === 'walk-half-glass') && (
        <mesh position={[0, isWindow ? 0 : opening.height * 0.2, 0.1]}>
          <boxGeometry args={[opening.width * 0.85, isWindow ? opening.height * 0.85 : opening.height * 0.5, 0.05]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} metalness={0.9} roughness={0.1} />
        </mesh>
      )}
      
      {/* Overhead door sections */}
      {isOverhead && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, -opening.height / 2 + opening.height * 0.125 + i * opening.height * 0.25, 0.1]}>
              <boxGeometry args={[opening.width * 0.95, opening.height * 0.23, 0.02]} />
              <meshStandardMaterial color="#5a5a5a" />
            </mesh>
          ))}
        </>
      )}
      
      {/* Drag indicator when dragging */}
      {isDragging && (
        <mesh position={[0, opening.height / 2 + 0.5, 0.2]}>
          <boxGeometry args={[1, 0.3, 0.1]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </group>
  )
}

// Trapezoid wall for lean-to side walls
// Creates a wall that goes from ground to roof slope
// Shape: bottom at y=0, back edge height = highHeight, front edge height = lowHeight
interface TrapezoidWallProps {
  width: number       // Depth of lean-to (Z direction for South/North, X for West/East)
  lowHeight: number   // Height at outer edge (front)
  highHeight: number  // Height at building (back)
  position: [number, number, number]
  rotation: [number, number, number]
  texture: THREE.Texture
}

function TrapezoidWall({ width, lowHeight, highHeight, position, rotation, texture }: TrapezoidWallProps) {
  const geometry = useMemo(() => {
    // Create trapezoid: 6 vertices for 2 triangles (non-indexed)
    // Shape viewed from front (+Z looking at -Z):
    // 
    //   (0, highHeight) -------- (width, lowHeight)
    //         |                        |
    //   (0, 0) -------------------- (width, 0)
    //
    // Triangle 1: bottom-left, bottom-right, top-right
    // Triangle 2: bottom-left, top-right, top-left
    
    const vertices = new Float32Array([
      // Triangle 1
      0, 0, 0,
      width, 0, 0,
      width, lowHeight, 0,
      // Triangle 2
      0, 0, 0,
      width, lowHeight, 0,
      0, highHeight, 0,
    ])
    
    // UVs for texture mapping
    const uvs = new Float32Array([
      // Triangle 1
      0, 0,
      1, 0,
      1, lowHeight / Math.max(highHeight, 1),
      // Triangle 2
      0, 0,
      1, lowHeight / Math.max(highHeight, 1),
      0, 1,
    ])
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geo.computeVertexNormals()
    
    return geo
  }, [width, lowHeight, highHeight])
  
  return (
    <mesh position={position} rotation={rotation} geometry={geometry}>
      <meshStandardMaterial map={texture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function Building() {
  const { dimensions, roof, colors, walls, leanToConfigs, ui, openings } = useStore()
  
  const { width, length, eaveHeight } = dimensions
  const { style: roofStyle, pitch, asymmetricOffset, overhangs, ridgeVents, cupola2ft, cupola3ft } = roof
  const { visibilityMode } = ui

  // Create corrugated metal textures
  const wallTexture = useCorrugatedTexture(colors.wall, false)
  const roofTexture = useCorrugatedTexture(colors.roof, true)

  // Calculate roof geometry
  const roofRise = (width / 2) * (pitch / 12)
  const roofAngle = Math.atan2(roofRise, width / 2)
  const roofPanelLength = Math.sqrt((width / 2) ** 2 + roofRise ** 2)

  // Asymmetrical roof calculations
  // asymmetricOffset: 1-9, where 5 is center, 1 is far left, 9 is far right
  const peakOffset = ((asymmetricOffset - 5) / 5) * (width / 2) * 0.8  // Peak position offset from center
  const leftWidth = width / 2 + peakOffset   // Width of left roof panel
  const rightWidth = width / 2 - peakOffset  // Width of right roof panel
  const leftRoofLength = Math.sqrt(leftWidth ** 2 + roofRise ** 2)
  const rightRoofLength = Math.sqrt(rightWidth ** 2 + roofRise ** 2)
  const leftRoofAngle = Math.atan2(roofRise, leftWidth)
  const rightRoofAngle = Math.atan2(roofRise, rightWidth)

  // Visibility flags
  const showWalls = visibilityMode === 'full'
  const showRoof = visibilityMode === 'full' || visibilityMode === 'hide-walls'
  // Secondary members (purlins, girts) hidden in frame-only mode
  const showSecondaryMembers = visibilityMode !== 'frame-only'

  // Steel beam dimensions
  const beamSize = 0.4

  // Calculate frame spacing
  const maxSpacing = 25
  const numFrames = Math.max(2, Math.ceil(length / maxSpacing) + 1)
  const frameSpacing = length / (numFrames - 1)

  // No inset - end walls extend to full width to connect with side walls
  const gableInset = 0

  // Create unified pentagon end wall geometry (rectangular wall + gable as one piece)
  // Pentagon shape: bottom-left, bottom-right, top-right (eave), peak, top-left (eave)
  const gableEndWallGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    
    // Pentagon vertices - unified wall from ground to peak
    const hw = width / 2 - gableInset  // half width with inset
    const peakExtra = 0.2  // Extend peak slightly to meet roof
    const totalHeight = eaveHeight + roofRise + peakExtra
    const vertices = new Float32Array([
      // Triangle 1: bottom-left, bottom-right, top-right (eave)
      -hw, 0, 0,
       hw, 0, 0,
       hw, eaveHeight, 0,
      // Triangle 2: bottom-left, top-right (eave), top-left (eave)
      -hw, 0, 0,
       hw, eaveHeight, 0,
      -hw, eaveHeight, 0,
      // Triangle 3: top-left (eave), top-right (eave), peak
      -hw, eaveHeight, 0,
       hw, eaveHeight, 0,
       0, eaveHeight + roofRise + peakExtra, 0,
    ])
    
    // UV coordinates - map texture across the wall
    const uvs = new Float32Array([
      // Triangle 1
      0, 0,
      1, 0,
      1, eaveHeight / totalHeight,
      // Triangle 2
      0, 0,
      1, eaveHeight / totalHeight,
      0, eaveHeight / totalHeight,
      // Triangle 3
      0, eaveHeight / totalHeight,
      1, eaveHeight / totalHeight,
      0.5, 1,
    ])
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.computeVertexNormals()
    
    return geometry
  }, [width, eaveHeight, roofRise])

  // Create unified asymmetrical end wall geometry (rectangular wall + asymmetrical gable as one piece)
  const asymmetricalEndWallGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    
    const hw = width / 2 - gableInset
    const peakExtra = 0.2  // Extend peak slightly to meet roof
    const totalHeight = eaveHeight + roofRise + peakExtra
    const peakU = (peakOffset + hw) / (2 * hw)  // Normalize peak position to 0-1
    const vertices = new Float32Array([
      // Triangle 1: bottom-left, bottom-right, top-right (eave)
      -hw, 0, 0,
       hw, 0, 0,
       hw, eaveHeight, 0,
      // Triangle 2: bottom-left, top-right (eave), top-left (eave)
      -hw, 0, 0,
       hw, eaveHeight, 0,
      -hw, eaveHeight, 0,
      // Triangle 3: top-left (eave), top-right (eave), peak (offset)
      -hw, eaveHeight, 0,
       hw, eaveHeight, 0,
       peakOffset, eaveHeight + roofRise + peakExtra, 0,
    ])
    
    const uvs = new Float32Array([
      // Triangle 1
      0, 0,
      1, 0,
      1, eaveHeight / totalHeight,
      // Triangle 2
      0, 0,
      1, eaveHeight / totalHeight,
      0, eaveHeight / totalHeight,
      // Triangle 3
      0, eaveHeight / totalHeight,
      1, eaveHeight / totalHeight,
      peakU, 1,
    ])
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.computeVertexNormals()
    
    return geometry
  }, [width, eaveHeight, roofRise, peakOffset])

  // Create unified single-slope end wall geometry (rectangular + sloped top as one piece)
  // Quadrilateral: bottom-left, bottom-right, top-right (high), top-left (low/eave)
  const singleSlopeEndWallGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    
    const hw = width / 2 - gableInset
    const topOffset = -0.1  // Slightly below roof to not extend through
    const totalHeight = eaveHeight + roofRise + topOffset
    const vertices = new Float32Array([
      // Triangle 1: bottom-left, bottom-right, top-right (high side)
      -hw, 0, 0,
       hw, 0, 0,
       hw, eaveHeight + roofRise + topOffset, 0,
      // Triangle 2: bottom-left, top-right (high), top-left (low/eave)
      -hw, 0, 0,
       hw, eaveHeight + roofRise + topOffset, 0,
      -hw, eaveHeight + topOffset, 0,
    ])
    
    const uvs = new Float32Array([
      // Triangle 1
      0, 0,
      1, 0,
      1, 1,
      // Triangle 2
      0, 0,
      1, 1,
      0, eaveHeight / totalHeight,
    ])
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.computeVertexNormals()
    
    return geometry
  }, [width, eaveHeight, roofRise])

  return (
    <group position={[0, 0, 0]}>
      {/* Floor Slab */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[width + 1, 0.1, length + 1]} />
        <meshStandardMaterial color="#b0b0b0" />
      </mesh>

      {/* Main Steel Frames - always rendered (inside walls, visible when looking inside) */}
      {Array.from({ length: numFrames }).map((_, i) => {
        // Wide-flange / H-beam column dimensions
        const flangeWidth = 1.2   // Width of the flanges (horizontal parts of H)
        // flangeDepth not needed - using webHeight for the H-beam depth
        const webHeight = 1.0     // Height of the web (vertical part of H)
        const flangeThickness = 0.15  // Thickness of flanges
        const webThickness = 0.1      // Thickness of web
        const kneeBraceLength = Math.min(eaveHeight * 0.3, 4) // Knee brace size
        const kneeBraceAngle = Math.PI / 4 // 45 degrees
        const columnInset = flangeWidth / 2 + 0.3  // Column center is just inside wall inner face (wall thickness 0.4, so inner face at 0.2)
        const endWallInset = 1.0  // How far inside the end walls (north/south)
        
        // Column heights - for single-slope, east (right) column is taller but stops below roof
        const leftColumnHeight = eaveHeight
        const rightColumnHeight = roofStyle === 'single-slope' ? eaveHeight + roofRise - 0.5 : eaveHeight
        
        // Calculate Z position with inset for end frames
        let zPos = -length / 2 + i * frameSpacing
        if (i === 0) {
          zPos = -length / 2 + endWallInset  // First frame inset from north wall
        } else if (i === numFrames - 1) {
          zPos = length / 2 - endWallInset   // Last frame inset from south wall
        }
        
        return (
          <group key={`frame-${i}`} position={[0, 0, zPos]}>
            {/* Left Column - Wide-flange H-beam - positioned INSIDE the wall */}
            <group position={[-width / 2 + columnInset, 0, 0]}>
              {/* Web (vertical center plate of H) */}
              <mesh position={[0, leftColumnHeight / 2, 0]}>
                <boxGeometry args={[webThickness, leftColumnHeight, webHeight]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Front flange (horizontal plate facing outward) */}
              <mesh position={[0, leftColumnHeight / 2, webHeight / 2]}>
                <boxGeometry args={[flangeWidth, leftColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Back flange (horizontal plate facing inward) */}
              <mesh position={[0, leftColumnHeight / 2, -webHeight / 2]}>
                <boxGeometry args={[flangeWidth, leftColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>

            {/* Right Column - Wide-flange H-beam - positioned INSIDE the wall */}
            <group position={[width / 2 - columnInset, 0, 0]}>
              {/* Web (vertical center plate of H) */}
              <mesh position={[0, rightColumnHeight / 2, 0]}>
                <boxGeometry args={[webThickness, rightColumnHeight, webHeight]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Front flange */}
              <mesh position={[0, rightColumnHeight / 2, webHeight / 2]}>
                <boxGeometry args={[flangeWidth, rightColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Back flange */}
              <mesh position={[0, rightColumnHeight / 2, -webHeight / 2]}>
                <boxGeometry args={[flangeWidth, rightColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>

            {/* Eave Beam (horizontal at top of columns) - at low eave height */}
            <mesh position={[0, eaveHeight, 0]}>
              <boxGeometry args={[width - columnInset * 2 - 0.4, beamSize * 0.8, beamSize * 0.8]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Left Knee Brace - diagonal from column to eave beam - positioned inside */}
            <mesh 
              position={[-width / 2 + columnInset + flangeWidth / 2 + kneeBraceLength * 0.5, eaveHeight - kneeBraceLength * 0.5, 0]}
              rotation={[0, 0, kneeBraceAngle]}
            >
              <boxGeometry args={[kneeBraceLength * 1.4, beamSize * 0.5, beamSize * 0.5]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Right Knee Brace - positioned inside */}
            <mesh 
              position={[width / 2 - columnInset - flangeWidth / 2 - kneeBraceLength * 0.5, eaveHeight - kneeBraceLength * 0.5, 0]}
              rotation={[0, 0, -kneeBraceAngle]}
            >
              <boxGeometry args={[kneeBraceLength * 1.4, beamSize * 0.5, beamSize * 0.5]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Gable Rafters - H-beam style like columns - positioned BELOW roof */}
            {roofStyle === 'gable' && (() => {
              // Rafter goes from column to ridge center
              // Column is at x = ±(width/2 - columnInset)
              // Ridge is at x = 0
              // Horizontal distance = width/2 - columnInset
              const rafterHorizLength = width / 2 - columnInset
              const rafterLength = Math.sqrt(rafterHorizLength ** 2 + roofRise ** 2)
              // Center of rafter (midpoint between column and ridge)
              const rafterCenterX = rafterHorizLength / 2
              // Lower the rafter so it sits BELOW the roof surface
              const rafterOffset = 0.8  // How far below the roof line
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              
              return (
                <>
                  {/* Left Rafter - from west column to ridge */}
                  <group position={[-rafterCenterX, rafterCenterY, 0]} rotation={[0, 0, roofAngle]}>
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight * 0.4, 0]}>
                      <boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight * 0.4, 0]}>
                      <boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>

                  {/* Right Rafter - from east column to ridge */}
                  <group position={[rafterCenterX, rafterCenterY, 0]} rotation={[0, 0, -roofAngle]}>
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight * 0.4, 0]}>
                      <boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight * 0.4, 0]}>
                      <boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                </>
              )
            })()}

            {/* Single Slope Rafter - H-beam style - spans from west column to east column */}
            {roofStyle === 'single-slope' && (() => {
              // Rafter goes from west column (low) to east column (high)
              const rafterHorizLength = width - columnInset * 2
              const rafterLength = Math.sqrt(rafterHorizLength ** 2 + roofRise ** 2)
              const rafterOffset = 0.8  // How far below the roof line
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              
              return (
                <>
                  <group position={[0, rafterCenterY, 0]} rotation={[0, 0, Math.atan2(roofRise, rafterHorizLength)]}>
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight * 0.4, 0]}>
                      <boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight * 0.4, 0]}>
                      <boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                </>
              )
            })()}

            {/* Asymmetrical Rafters - H-beam style - meet at offset ridge */}
            {roofStyle === 'asymmetrical' && (() => {
              // Left rafter: from west column to peak at peakOffset
              // Horizontal distance = peakOffset - (-width/2 + columnInset) = peakOffset + width/2 - columnInset
              const leftHorizLength = peakOffset + width / 2 - columnInset
              const leftRafterLength = Math.sqrt(leftHorizLength ** 2 + roofRise ** 2)
              const leftCenterX = (-width / 2 + columnInset + peakOffset) / 2
              
              // Right rafter: from east column to peak at peakOffset
              // Horizontal distance = (width/2 - columnInset) - peakOffset
              const rightHorizLength = width / 2 - columnInset - peakOffset
              const rightRafterLength = Math.sqrt(rightHorizLength ** 2 + roofRise ** 2)
              const rightCenterX = (width / 2 - columnInset + peakOffset) / 2
              
              const rafterOffset = 0.8  // How far below the roof line
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              
              return (
                <>
                  {/* Left Rafter - from west column to offset ridge */}
                  <group position={[leftCenterX, rafterCenterY, 0]} rotation={[0, 0, leftRoofAngle]}>
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[leftRafterLength, webHeight * 0.8, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight * 0.4, 0]}>
                      <boxGeometry args={[leftRafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight * 0.4, 0]}>
                      <boxGeometry args={[leftRafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>

                  {/* Right Rafter - from east column to offset ridge */}
                  <group position={[rightCenterX, rafterCenterY, 0]} rotation={[0, 0, -rightRoofAngle]}>
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[rightRafterLength, webHeight * 0.8, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight * 0.4, 0]}>
                      <boxGeometry args={[rightRafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight * 0.4, 0]}>
                      <boxGeometry args={[rightRafterLength, flangeThickness, flangeWidth * 0.8]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                </>
              )
            })()}
          </group>
        )
      })}
      
      {/* Horizontal Wall Girts - hidden in frame-only mode - only on ENCLOSED walls */}
      {showSecondaryMembers && (() => {
        const girtSize = 0.2
        const girtInset = 0.9  // Same as column inset - girts connect to columns
        
        // Calculate wall heights based on roof style
        const westWallHeight = eaveHeight
        const eastWallHeight = roofStyle === 'single-slope' ? eaveHeight + roofRise : eaveHeight
        
        // Calculate girt counts and spacing for each wall
        const numWestGirts = Math.max(2, Math.floor(westWallHeight / 4))
        const numEastGirts = Math.max(2, Math.floor(eastWallHeight / 4))
        const westGirtSpacing = westWallHeight / (numWestGirts + 1)
        const eastGirtSpacing = eastWallHeight / (numEastGirts + 1)
        
        return (
          <group>
            {/* West wall girts - only if wall is enclosed */}
            {walls.enclosed.west && Array.from({ length: numWestGirts }).map((_, i) => (
              <mesh key={`west-girt-${i}`} position={[-width / 2 + girtInset, westGirtSpacing * (i + 1), 0]}>
                <boxGeometry args={[girtSize, girtSize, length - girtInset * 2]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* East wall girts - only if wall is enclosed */}
            {walls.enclosed.east && Array.from({ length: numEastGirts }).map((_, i) => (
              <mesh key={`east-girt-${i}`} position={[width / 2 - girtInset, eastGirtSpacing * (i + 1), 0]}>
                <boxGeometry args={[girtSize, girtSize, length - girtInset * 2]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* South wall girts - only if wall is enclosed */}
            {walls.enclosed.south && Array.from({ length: numWestGirts }).map((_, i) => (
              <mesh key={`south-girt-${i}`} position={[0, westGirtSpacing * (i + 1), length / 2 - girtInset]}>
                <boxGeometry args={[width - girtInset * 2, girtSize, girtSize]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* North wall girts - only if wall is enclosed */}
            {walls.enclosed.north && Array.from({ length: numWestGirts }).map((_, i) => (
              <mesh key={`north-girt-${i}`} position={[0, westGirtSpacing * (i + 1), -length / 2 + girtInset]}>
                <boxGeometry args={[width - girtInset * 2, girtSize, girtSize]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* Base girts - only on enclosed walls */}
            {walls.enclosed.west && (
              <mesh position={[-width / 2 + girtInset, girtSize / 2, 0]}>
                <boxGeometry args={[girtSize, girtSize, length - girtInset * 2]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            )}
            {walls.enclosed.east && (
              <mesh position={[width / 2 - girtInset, girtSize / 2, 0]}>
                <boxGeometry args={[girtSize, girtSize, length - girtInset * 2]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            )}
            {walls.enclosed.south && (
              <mesh position={[0, girtSize / 2, length / 2 - girtInset]}>
                <boxGeometry args={[width - girtInset * 2, girtSize, girtSize]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            )}
            {walls.enclosed.north && (
              <mesh position={[0, girtSize / 2, -length / 2 + girtInset]}>
                <boxGeometry args={[width - girtInset * 2, girtSize, girtSize]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            )}
          </group>
        )
      })()}
      
      {/* Roof Purlins - REMOVED: Duplicate section that was floating and extending beyond end frames */}
      {/* The correct purlins are rendered in the "Purlins" section below */}

      {/* North End Wall Overhang Frame - always rendered when overhang enabled */}
      {overhangs.north > 0 && (() => {
        const flangeWidth = 1.2
        const webHeight = 1.0
        const flangeThickness = 0.15
        const webThickness = 0.1
        const columnInset = flangeWidth / 2 + 0.3  // Match main frame inset (0.9)
        const kneeBraceLength = Math.min(eaveHeight * 0.3, 4)
        const kneeBraceAngle = Math.PI / 4
        
        // Column heights - match main frame for single-slope
        const leftColumnHeight = eaveHeight
        const rightColumnHeight = roofStyle === 'single-slope' ? eaveHeight + roofRise - 0.5 : eaveHeight
        return (
          <group position={[0, 0, -length / 2 - overhangs.north]}>
            {/* Left Column - H-beam - uses leftColumnHeight */}
            <group position={[-width / 2 + columnInset, 0, 0]}>
              <mesh position={[0, leftColumnHeight / 2, 0]}>
                <boxGeometry args={[webThickness, leftColumnHeight, webHeight]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, leftColumnHeight / 2, webHeight / 2]}>
                <boxGeometry args={[flangeWidth, leftColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, leftColumnHeight / 2, -webHeight / 2]}>
                <boxGeometry args={[flangeWidth, leftColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
            {/* Right Column - H-beam - uses rightColumnHeight (taller for single-slope) */}
            <group position={[width / 2 - columnInset, 0, 0]}>
              <mesh position={[0, rightColumnHeight / 2, 0]}>
                <boxGeometry args={[webThickness, rightColumnHeight, webHeight]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, rightColumnHeight / 2, webHeight / 2]}>
                <boxGeometry args={[flangeWidth, rightColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, rightColumnHeight / 2, -webHeight / 2]}>
                <boxGeometry args={[flangeWidth, rightColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
            {/* Eave Beam - at low eave height */}
            <mesh position={[0, eaveHeight, 0]}>
              <boxGeometry args={[width - columnInset * 2 - 0.4, beamSize * 0.8, beamSize * 0.8]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Left Knee Brace */}
            <mesh 
              position={[-width / 2 + columnInset + flangeWidth / 2 + kneeBraceLength * 0.5, eaveHeight - kneeBraceLength * 0.5, 0]}
              rotation={[0, 0, kneeBraceAngle]}
            >
              <boxGeometry args={[kneeBraceLength * 1.4, beamSize * 0.5, beamSize * 0.5]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Right Knee Brace */}
            <mesh 
              position={[width / 2 - columnInset - flangeWidth / 2 - kneeBraceLength * 0.5, eaveHeight - kneeBraceLength * 0.5, 0]}
              rotation={[0, 0, -kneeBraceAngle]}
            >
              <boxGeometry args={[kneeBraceLength * 1.4, beamSize * 0.5, beamSize * 0.5]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Gable Rafters - match main frame */}
            {roofStyle === 'gable' && (() => {
              const rafterHorizLength = width / 2 - columnInset
              const rafterLength = Math.sqrt(rafterHorizLength ** 2 + roofRise ** 2)
              const rafterCenterX = rafterHorizLength / 2
              const rafterOffset = 0.8
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              return (
                <>
                  <group position={[-rafterCenterX, rafterCenterY, 0]} rotation={[0, 0, roofAngle]}>
                    <mesh><boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                  <group position={[rafterCenterX, rafterCenterY, 0]} rotation={[0, 0, -roofAngle]}>
                    <mesh><boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                </>
              )
            })()}
            
            {/* Single-Slope Rafter */}
            {roofStyle === 'single-slope' && (() => {
              const rafterHorizLength = width - columnInset * 2
              const rafterLength = Math.sqrt(rafterHorizLength ** 2 + roofRise ** 2)
              const rafterOffset = 0.8
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              return (
                <group position={[0, rafterCenterY, 0]} rotation={[0, 0, Math.atan2(roofRise, rafterHorizLength)]}>
                  <mesh><boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                </group>
              )
            })()}
            
            {/* Asymmetrical Rafters */}
            {roofStyle === 'asymmetrical' && (() => {
              const leftHorizLength = peakOffset + width / 2 - columnInset
              const leftRafterLength = Math.sqrt(leftHorizLength ** 2 + roofRise ** 2)
              const leftCenterX = (-width / 2 + columnInset + peakOffset) / 2
              const rightHorizLength = width / 2 - columnInset - peakOffset
              const rightRafterLength = Math.sqrt(rightHorizLength ** 2 + roofRise ** 2)
              const rightCenterX = (width / 2 - columnInset + peakOffset) / 2
              const rafterOffset = 0.8
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              return (
                <>
                  <group position={[leftCenterX, rafterCenterY, 0]} rotation={[0, 0, leftRoofAngle]}>
                    <mesh><boxGeometry args={[leftRafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[leftRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[leftRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                  <group position={[rightCenterX, rafterCenterY, 0]} rotation={[0, 0, -rightRoofAngle]}>
                    <mesh><boxGeometry args={[rightRafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rightRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rightRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                </>
              )
            })()}
            
          </group>
        )
      })()}

      {/* South End Wall Overhang Frame - always rendered when overhang enabled */}
      {overhangs.south > 0 && (() => {
        const flangeWidth = 1.2
        const webHeight = 1.0
        const flangeThickness = 0.15
        const webThickness = 0.1
        const columnInset = flangeWidth / 2 + 0.3  // Match main frame inset (0.9)
        const kneeBraceLength = Math.min(eaveHeight * 0.3, 4)
        const kneeBraceAngle = Math.PI / 4
        
        // Column heights - match main frame for single-slope
        const leftColumnHeight = eaveHeight
        const rightColumnHeight = roofStyle === 'single-slope' ? eaveHeight + roofRise - 0.5 : eaveHeight
        return (
          <group position={[0, 0, length / 2 + overhangs.south]}>
            {/* Left Column - H-beam - uses leftColumnHeight */}
            <group position={[-width / 2 + columnInset, 0, 0]}>
              <mesh position={[0, leftColumnHeight / 2, 0]}>
                <boxGeometry args={[webThickness, leftColumnHeight, webHeight]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, leftColumnHeight / 2, webHeight / 2]}>
                <boxGeometry args={[flangeWidth, leftColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, leftColumnHeight / 2, -webHeight / 2]}>
                <boxGeometry args={[flangeWidth, leftColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
            {/* Right Column - H-beam - uses rightColumnHeight (taller for single-slope) */}
            <group position={[width / 2 - columnInset, 0, 0]}>
              <mesh position={[0, rightColumnHeight / 2, 0]}>
                <boxGeometry args={[webThickness, rightColumnHeight, webHeight]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, rightColumnHeight / 2, webHeight / 2]}>
                <boxGeometry args={[flangeWidth, rightColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, rightColumnHeight / 2, -webHeight / 2]}>
                <boxGeometry args={[flangeWidth, rightColumnHeight, flangeThickness]} />
                <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
            {/* Eave Beam - at low eave height */}
            <mesh position={[0, eaveHeight, 0]}>
              <boxGeometry args={[width - columnInset * 2 - 0.4, beamSize * 0.8, beamSize * 0.8]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Left Knee Brace */}
            <mesh 
              position={[-width / 2 + columnInset + flangeWidth / 2 + kneeBraceLength * 0.5, eaveHeight - kneeBraceLength * 0.5, 0]}
              rotation={[0, 0, kneeBraceAngle]}
            >
              <boxGeometry args={[kneeBraceLength * 1.4, beamSize * 0.5, beamSize * 0.5]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Right Knee Brace */}
            <mesh 
              position={[width / 2 - columnInset - flangeWidth / 2 - kneeBraceLength * 0.5, eaveHeight - kneeBraceLength * 0.5, 0]}
              rotation={[0, 0, -kneeBraceAngle]}
            >
              <boxGeometry args={[kneeBraceLength * 1.4, beamSize * 0.5, beamSize * 0.5]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Gable Rafters - match main frame */}
            {roofStyle === 'gable' && (() => {
              const rafterHorizLength = width / 2 - columnInset
              const rafterLength = Math.sqrt(rafterHorizLength ** 2 + roofRise ** 2)
              const rafterCenterX = rafterHorizLength / 2
              const rafterOffset = 0.8
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              return (
                <>
                  <group position={[-rafterCenterX, rafterCenterY, 0]} rotation={[0, 0, roofAngle]}>
                    <mesh><boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                  <group position={[rafterCenterX, rafterCenterY, 0]} rotation={[0, 0, -roofAngle]}>
                    <mesh><boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                </>
              )
            })()}
            
            {/* Single-Slope Rafter */}
            {roofStyle === 'single-slope' && (() => {
              const rafterHorizLength = width - columnInset * 2
              const rafterLength = Math.sqrt(rafterHorizLength ** 2 + roofRise ** 2)
              const rafterOffset = 0.8
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              return (
                <group position={[0, rafterCenterY, 0]} rotation={[0, 0, Math.atan2(roofRise, rafterHorizLength)]}>
                  <mesh><boxGeometry args={[rafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                </group>
              )
            })()}
            
            {/* Asymmetrical Rafters */}
            {roofStyle === 'asymmetrical' && (() => {
              const leftHorizLength = peakOffset + width / 2 - columnInset
              const leftRafterLength = Math.sqrt(leftHorizLength ** 2 + roofRise ** 2)
              const leftCenterX = (-width / 2 + columnInset + peakOffset) / 2
              const rightHorizLength = width / 2 - columnInset - peakOffset
              const rightRafterLength = Math.sqrt(rightHorizLength ** 2 + roofRise ** 2)
              const rightCenterX = (width / 2 - columnInset + peakOffset) / 2
              const rafterOffset = 0.8
              const rafterCenterY = eaveHeight + roofRise / 2 - rafterOffset
              return (
                <>
                  <group position={[leftCenterX, rafterCenterY, 0]} rotation={[0, 0, leftRoofAngle]}>
                    <mesh><boxGeometry args={[leftRafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[leftRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[leftRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                  <group position={[rightCenterX, rafterCenterY, 0]} rotation={[0, 0, -rightRoofAngle]}>
                    <mesh><boxGeometry args={[rightRafterLength, webHeight * 0.8, webThickness]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, webHeight * 0.4, 0]}><boxGeometry args={[rightRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                    <mesh position={[0, -webHeight * 0.4, 0]}><boxGeometry args={[rightRafterLength, flangeThickness, flangeWidth * 0.8]} /><meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} /></mesh>
                  </group>
                </>
              )
            })()}
            
          </group>
        )
      })()}

      {/* Purlins (run along the length of the roof) - thin C-channels on rafters - hidden in frame-only */}
      {showSecondaryMembers && roofStyle === 'gable' && (() => {
        // Purlins stay within building length (no extension into overhangs)
        const purlinSize = 0.15  // Thin purlins like C-channels
        const numPurlins = 5  // 5 purlins per side (like reference image)
        
        // Calculate rafter geometry for positioning purlins ON rafters
        const columnInset = 0.9
        const rafterHorizLength = width / 2 - columnInset
        
        return (
          <>
            {/* Ridge Purlin - at the peak */}
            <mesh position={[0, eaveHeight + roofRise - 0.3, 0]}>
              <boxGeometry args={[purlinSize * 1.5, purlinSize * 1.5, length]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Left Side Purlins - evenly spaced on rafters */}
            {Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const x = -rafterHorizLength * (1 - ratio)
              const y = eaveHeight + roofRise * ratio - 0.3
              return (
                <mesh key={`purlin-left-${idx}`} position={[x, y, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, length]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}

            {/* Right Side Purlins - evenly spaced on rafters */}
            {Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const x = rafterHorizLength * (1 - ratio)
              const y = eaveHeight + roofRise * ratio - 0.3
              return (
                <mesh key={`purlin-right-${idx}`} position={[x, y, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, length]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
          </>
        )
      })()}

      {/* Single Slope Purlins - thin C-channels on rafter - hidden in frame-only */}
      {showSecondaryMembers && roofStyle === 'single-slope' && (() => {
        // Purlins stay within building length
        const purlinSize = 0.15  // Thin purlins like C-channels
        const numPurlins = 6  // 6 purlins across the single slope
        const columnInset = 0.9
        const rafterHorizLength = width - columnInset * 2
        
        return (
          <>
            {/* Purlins evenly spaced across the slope */}
            {Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const x = -width / 2 + columnInset + rafterHorizLength * ratio
              const y = eaveHeight + roofRise * ratio - 0.3
              return (
                <mesh key={`purlin-slope-${idx}`} position={[x, y, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, length]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
          </>
        )
      })()}

      {/* Asymmetrical Purlins - thin C-channels on rafters - hidden in frame-only */}
      {showSecondaryMembers && roofStyle === 'asymmetrical' && (() => {
        // Purlins stay within building length
        const purlinSize = 0.15  // Thin purlins like C-channels
        const columnInset = 0.9
        
        // Left side: from west column to peak
        const leftHorizLength = peakOffset + width / 2 - columnInset
        const numLeftPurlins = Math.max(3, Math.round(leftHorizLength / 4))
        
        // Right side: from peak to east column
        const rightHorizLength = width / 2 - columnInset - peakOffset
        const numRightPurlins = Math.max(2, Math.round(rightHorizLength / 4))
        
        return (
          <>
            {/* Ridge Purlin at offset peak */}
            <mesh position={[peakOffset, eaveHeight + roofRise - 0.3, 0]}>
              <boxGeometry args={[purlinSize * 1.5, purlinSize * 1.5, length]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Left Side Purlins - evenly spaced */}
            {Array.from({ length: numLeftPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numLeftPurlins + 1)
              const x = -width / 2 + columnInset + leftHorizLength * ratio
              const y = eaveHeight + roofRise * ratio - 0.3
              return (
                <mesh key={`purlin-asym-left-${idx}`} position={[x, y, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, length]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}

            {/* Right Side Purlins - evenly spaced */}
            {Array.from({ length: numRightPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numRightPurlins + 1)
              const x = peakOffset + rightHorizLength * ratio
              const y = eaveHeight + roofRise * (1 - ratio) - 0.3
              return (
                <mesh key={`purlin-asym-right-${idx}`} position={[x, y, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, length]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
          </>
        )
      })()}

      {/* Ridge Beam - horizontal beam at the peak running the length of building + overhangs */}
      {(roofStyle === 'gable' || roofStyle === 'asymmetrical') && (() => {
        // Ridge beam extends into overhang areas
        const totalLength = length + overhangs.north + overhangs.south
        const zOffset = (overhangs.south - overhangs.north) / 2
        const ridgeX = roofStyle === 'asymmetrical' ? peakOffset : 0
        const ridgeY = eaveHeight + roofRise - 0.6  // Lower to sit below roof surface
        
        return (
          <mesh position={[ridgeX, ridgeY, zOffset]}>
            <boxGeometry args={[0.3, 0.3, totalLength]} />
            <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
          </mesh>
        )
      })()}

      {/* Perimeter Eave Beams - always rendered, positioned INSIDE walls */}
      {(() => {
        const eaveInset = 0.9  // Same as column inset - eave beams connect to columns
        return (
          <group>
            {/* NORTH eave beam (back) - inside */}
            <mesh position={[0, eaveHeight - 0.2, -length / 2 + eaveInset]}>
              <boxGeometry args={[width - eaveInset * 2, beamSize * 0.8, beamSize * 0.8]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* SOUTH eave beam (front) - inside */}
            <mesh position={[0, eaveHeight - 0.2, length / 2 - eaveInset]}>
              <boxGeometry args={[width - eaveInset * 2, beamSize * 0.8, beamSize * 0.8]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* WEST eave beam (left) - inside */}
            <mesh position={[-width / 2 + eaveInset, eaveHeight - 0.2, 0]}>
              <boxGeometry args={[beamSize * 0.8, beamSize * 0.8, length - eaveInset * 2]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* EAST eave beam (right) - inside */}
            <mesh position={[width / 2 - eaveInset, eaveHeight - 0.2, 0]}>
              <boxGeometry args={[beamSize * 0.8, beamSize * 0.8, length - eaveInset * 2]} />
              <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        )
      })()}

      {/* Wall Panels - only render if enclosed */}
      {showWalls && (
        <group>
          {/* Front Wall (South) - unified wall with gable */}
          {walls.enclosed.south && roofStyle === 'gable' && (
            <mesh 
              position={[0, 0, length / 2 + 0.05]} 
              geometry={gableEndWallGeometry}
            >
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Front Wall (South) - unified wall with asymmetrical gable */}
          {walls.enclosed.south && roofStyle === 'asymmetrical' && (
            <mesh 
              position={[0, 0, length / 2 + 0.05]} 
              geometry={asymmetricalEndWallGeometry}
            >
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Front Wall (South) - unified wall with single slope */}
          {walls.enclosed.south && roofStyle === 'single-slope' && (
            <mesh 
              position={[0, 0, length / 2 + 0.05]} 
              geometry={singleSlopeEndWallGeometry}
            >
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Back Wall (North) - unified wall with gable */}
          {walls.enclosed.north && roofStyle === 'gable' && (
            <mesh 
              position={[0, 0, -length / 2 - 0.05]} 
              geometry={gableEndWallGeometry}
            >
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Back Wall (North) - unified wall with asymmetrical gable */}
          {walls.enclosed.north && roofStyle === 'asymmetrical' && (
            <mesh 
              position={[0, 0, -length / 2 - 0.05]} 
              geometry={asymmetricalEndWallGeometry}
            >
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Back Wall (North) - unified wall with single slope */}
          {walls.enclosed.north && roofStyle === 'single-slope' && (
            <mesh 
              position={[0, 0, -length / 2 - 0.05]} 
              geometry={singleSlopeEndWallGeometry}
            >
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Left Wall (West) - thickness increased for proper occlusion */}
          {walls.enclosed.west && (
            <mesh position={[-width / 2, eaveHeight / 2, 0]}>
              <boxGeometry args={[0.4, eaveHeight, length]} />
              <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Right Wall (East) - taller for single-slope, thickness increased for proper occlusion */}
          {walls.enclosed.east && (() => {
            const eastWallHeight = roofStyle === 'single-slope' ? eaveHeight + roofRise - 0.15 : eaveHeight
            return (
              <mesh position={[width / 2, eastWallHeight / 2, 0]}>
                <boxGeometry args={[0.4, eastWallHeight, length]} />
                <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
              </mesh>
            )
          })()}

          {/* Wainscot - only on enclosed walls, hidden if lean-to is attached to that side */}
          {walls.wainscotEnabled && (
            <group>
              {walls.enclosed.south && !leanToConfigs.south.enabled && (
                <mesh position={[0, walls.wainscotHeight / 2, length / 2 + 0.3]}>
                  <boxGeometry args={[width + 0.4, walls.wainscotHeight, 0.2]} />
                  <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                </mesh>
              )}
              {walls.enclosed.north && !leanToConfigs.north.enabled && (
                <mesh position={[0, walls.wainscotHeight / 2, -length / 2 - 0.3]}>
                  <boxGeometry args={[width + 0.4, walls.wainscotHeight, 0.2]} />
                  <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                </mesh>
              )}
              {walls.enclosed.west && !leanToConfigs.west.enabled && (
                <mesh position={[-width / 2 - 0.3, walls.wainscotHeight / 2, 0]}>
                  <boxGeometry args={[0.2, walls.wainscotHeight, length + 0.4]} />
                  <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                </mesh>
              )}
              {walls.enclosed.east && !leanToConfigs.east.enabled && (
                <mesh position={[width / 2 + 0.3, walls.wainscotHeight / 2, 0]}>
                  <boxGeometry args={[0.2, walls.wainscotHeight, length + 0.4]} />
                  <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                </mesh>
              )}
            </group>
          )}
        </group>
      )}

      {/* Roof Panels - no castShadow/receiveShadow to avoid shadow artifacts */}
      {/* Overhangs: north/south extend length, east/west extend width */}
      {showRoof && roofStyle === 'gable' && (() => {
        // Calculate extended roof panel lengths
        const leftPanelLength = roofPanelLength + 0.5 + overhangs.west
        const rightPanelLength = roofPanelLength + 0.5 + overhangs.east
        
        // The overhang extends the panel outward from the eave
        // We need to offset the panel center so the inner edge stays at the ridge
        // and the outer edge extends past the wall
        const leftXOffset = -overhangs.west / 2 * Math.cos(roofAngle)
        const leftYOffset = -overhangs.west / 2 * Math.sin(roofAngle)
        const rightXOffset = overhangs.east / 2 * Math.cos(roofAngle)
        const rightYOffset = -overhangs.east / 2 * Math.sin(roofAngle)
        
        // Roof extends 1.5 past the overhang frame to cover it
        const roofExtension = 1.5
        const totalRoofLength = length + overhangs.north + overhangs.south + roofExtension * 2
        
        return (
          <group position={[0, 0, (overhangs.south - overhangs.north) / 2]}>
            {/* Left Roof Panel (WEST side) - extends west with overhang */}
            <group position={[(-width / 4) + leftXOffset, eaveHeight + roofRise / 2 + 0.1 + leftYOffset, 0]}>
              <mesh rotation={[0, 0, roofAngle]}>
                <boxGeometry args={[leftPanelLength, 0.15, totalRoofLength]} />
                <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            </group>

            {/* Right Roof Panel (EAST side) - extends east with overhang */}
            <group position={[(width / 4) + rightXOffset, eaveHeight + roofRise / 2 + 0.1 + rightYOffset, 0]}>
              <mesh rotation={[0, 0, -roofAngle]}>
                <boxGeometry args={[rightPanelLength, 0.15, totalRoofLength]} />
                <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            </group>

            {/* Ridge Cap - thin strip at the peak */}
            <mesh position={[0, eaveHeight + roofRise + 0.15, 0]}>
              <boxGeometry args={[0.5, 0.1, totalRoofLength]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
          </group>
        )
      })()}

      {/* Single Slope Roof - slopes from WEST (low) to EAST (high) */}
      {/* With overhangs support - roof extends but stays over building */}
      {showRoof && roofStyle === 'single-slope' && (() => {
        // Calculate slope with overhangs included in width
        const totalWidth = width + overhangs.east + overhangs.west
        const slopeLength = Math.sqrt(totalWidth ** 2 + roofRise ** 2)
        const slopeAngle = Math.atan2(roofRise, totalWidth)
        
        // Position: center the extended roof, offset for N/S overhangs
        // West overhang extends left, East overhang extends right
        const xOffset = (overhangs.east - overhangs.west) / 2
        
        // Roof extends 1.5 past the overhang frame to cover it
        const roofExtension = 1.5
        const totalRoofLength = length + overhangs.north + overhangs.south + roofExtension * 2
        
        return (
          <group position={[xOffset, eaveHeight, (overhangs.south - overhangs.north) / 2]}>
            <mesh 
              position={[0, roofRise / 2, 0]}
              rotation={[0, 0, slopeAngle]}
            >
              <boxGeometry args={[slopeLength + 0.5, 0.15, totalRoofLength]} />
              <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })()}

      {/* Asymmetrical Roof - peak offset from center with overhangs */}
      {showRoof && roofStyle === 'asymmetrical' && (() => {
        // Roof extends 1.5 past the overhang frame to cover it
        const roofExtension = 1.5
        const totalRoofLength = length + overhangs.north + overhangs.south + roofExtension * 2
        
        return (
          <group position={[0, 0, (overhangs.south - overhangs.north) / 2]}>
            {/* Left Roof Panel - from left eave to offset peak */}
            <group position={[(-width / 2 + peakOffset) / 2 - overhangs.west / 2, eaveHeight + roofRise / 2 + 0.1, 0]}>
              <mesh rotation={[0, 0, leftRoofAngle]}>
                <boxGeometry args={[leftRoofLength + 0.3 + overhangs.west, 0.15, totalRoofLength]} />
                <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            </group>

            {/* Right Roof Panel - from offset peak to right eave */}
            <group position={[(width / 2 + peakOffset) / 2 + overhangs.east / 2, eaveHeight + roofRise / 2 + 0.1, 0]}>
              <mesh rotation={[0, 0, -rightRoofAngle]}>
                <boxGeometry args={[rightRoofLength + 0.3 + overhangs.east, 0.15, totalRoofLength]} />
                <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            </group>

            {/* Ridge Cap at offset peak */}
            <mesh position={[peakOffset, eaveHeight + roofRise + 0.15, 0]}>
              <boxGeometry args={[0.5, 0.1, totalRoofLength]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
          </group>
        )
      })()}

      {/* Ridge Vents - small rectangular vents along the ridge */}
      {showRoof && ridgeVents > 0 && roofStyle === 'gable' && (
        <group>
          {Array.from({ length: ridgeVents }).map((_, i) => {
            const spacing = length / (ridgeVents + 1)
            const zPos = -length / 2 + spacing * (i + 1)
            return (
              <group key={`ridge-vent-${i}`} position={[0, eaveHeight + roofRise + 0.3, zPos]}>
                {/* Vent base */}
                <mesh>
                  <boxGeometry args={[1.5, 0.5, 2]} />
                  <meshStandardMaterial color={colors.trim} metalness={0.3} roughness={0.7} />
                </mesh>
                {/* Vent louvers */}
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[1.3, 0.3, 1.8]} />
                  <meshStandardMaterial color="#888888" metalness={0.4} roughness={0.6} />
                </mesh>
              </group>
            )
          })}
        </group>
      )}

      {/* 2' Cupolas - small decorative structures on the ridge */}
      {showRoof && cupola2ft > 0 && roofStyle === 'gable' && (
        <group>
          {Array.from({ length: cupola2ft }).map((_, i) => {
            const spacing = length / (cupola2ft + 1)
            const zPos = -length / 2 + spacing * (i + 1)
            return (
              <group key={`cupola-2ft-${i}`} position={[0, eaveHeight + roofRise + 0.2, zPos]}>
                {/* Cupola base */}
                <mesh>
                  <boxGeometry args={[2, 0.3, 2]} />
                  <meshStandardMaterial color={colors.trim} />
                </mesh>
                {/* Cupola body with vents */}
                <mesh position={[0, 1, 0]}>
                  <boxGeometry args={[1.8, 1.5, 1.8]} />
                  <meshStandardMaterial color={colors.wall} metalness={0.3} roughness={0.7} />
                </mesh>
                {/* Cupola roof */}
                <mesh position={[0, 2, 0]}>
                  <coneGeometry args={[1.5, 1, 4]} />
                  <meshStandardMaterial color={colors.roof} metalness={0.4} roughness={0.6} />
                </mesh>
              </group>
            )
          })}
        </group>
      )}

      {/* 3' Cupolas - larger decorative structures on the ridge */}
      {showRoof && cupola3ft > 0 && roofStyle === 'gable' && (
        <group>
          {Array.from({ length: cupola3ft }).map((_, i) => {
            const spacing = length / (cupola3ft + 1)
            const zPos = -length / 2 + spacing * (i + 1)
            return (
              <group key={`cupola-3ft-${i}`} position={[0, eaveHeight + roofRise + 0.2, zPos]}>
                {/* Cupola base */}
                <mesh>
                  <boxGeometry args={[3, 0.4, 3]} />
                  <meshStandardMaterial color={colors.trim} />
                </mesh>
                {/* Cupola body with vents */}
                <mesh position={[0, 1.25, 0]}>
                  <boxGeometry args={[2.7, 2, 2.7]} />
                  <meshStandardMaterial color={colors.wall} metalness={0.3} roughness={0.7} />
                </mesh>
                {/* Cupola roof */}
                <mesh position={[0, 2.75, 0]}>
                  <coneGeometry args={[2.2, 1.5, 4]} />
                  <meshStandardMaterial color={colors.roof} metalness={0.4} roughness={0.6} />
                </mesh>
              </group>
            )
          })}
        </group>
      )}

      {/* Single Slope Wall Extensions - removed, now handled by unified singleSlopeEndWallGeometry */}

      {/* Trim - only visible when walls are visible */}
      {showWalls && (() => {
        // For single-slope, east (right) side is taller
        const leftEaveHeight = eaveHeight
        const rightEaveHeight = roofStyle === 'single-slope' ? eaveHeight + roofRise : eaveHeight
        // Only reduce height for single-slope to prevent extending above roof
        const rightTrimOffset = roofStyle === 'single-slope' ? 0.3 : 0
        
        const eaveTrimHeight = 0.6  // Trim height
        
        return (
          <group>
            {/* Left Eave Trim (WEST - low side for single-slope) */}
            <mesh position={[-width / 2 - 0.15, leftEaveHeight - eaveTrimHeight / 2, 0]}>
              <boxGeometry args={[0.15, eaveTrimHeight, length]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
            {/* Right Eave Trim (EAST - high side for single-slope) - at top of wall */}
            <mesh position={[width / 2 + 0.15, rightEaveHeight - eaveTrimHeight / 2, 0]}>
              <boxGeometry args={[0.15, eaveTrimHeight, length]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>

            {/* Corner Trim - Left corners use leftEaveHeight */}
            <mesh position={[-width / 2 - 0.1, leftEaveHeight / 2, length / 2 + 0.1]}>
              <boxGeometry args={[0.2, leftEaveHeight, 0.2]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
            <mesh position={[-width / 2 - 0.1, leftEaveHeight / 2, -length / 2 - 0.1]}>
              <boxGeometry args={[0.2, leftEaveHeight, 0.2]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
            
            {/* Corner Trim - Right corners use rightEaveHeight */}
            {/* Only reduced for single-slope to not extend above roof */}
            <mesh position={[width / 2 + 0.1, (rightEaveHeight - rightTrimOffset) / 2, length / 2 + 0.1]}>
              <boxGeometry args={[0.2, rightEaveHeight - rightTrimOffset, 0.2]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
            <mesh position={[width / 2 + 0.1, (rightEaveHeight - rightTrimOffset) / 2, -length / 2 - 0.1]}>
              <boxGeometry args={[0.2, rightEaveHeight - rightTrimOffset, 0.2]} />
              <meshStandardMaterial color={colors.trim} />
            </mesh>
          </group>
        )
      })()}

      {/* ========== DOORS & WINDOWS ========== */}
      {showWalls && openings.map((opening) => (
        <DraggableDoor
          key={opening.id}
          opening={opening}
          buildingWidth={width}
          buildingLength={length}
        />
      ))}

      {/* Lean-To Structures */}
      {/* South Lean-To */}
      {leanToConfigs.south.enabled && (() => {
        const config = leanToConfigs.south
        const leanToWidth = width - config.cutL - config.cutR
        // Drop lowers the ENTIRE lean-to - attachment point on building
        const attachHeight = eaveHeight - config.drop  // Where lean-to attaches to building (HIGH side)
        const leanToRoofRise = config.depth * (config.roofPitch / 12)
        const outerHeight = Math.max(1, attachHeight - leanToRoofRise)  // Height at outer edge (LOW side)
        const leanToRoofLength = Math.sqrt(config.depth ** 2 + leanToRoofRise ** 2)
        const leanToRoofAngle = Math.atan2(leanToRoofRise, config.depth)
        const xOffset = (config.cutR - config.cutL) / 2
        // Lean-to walls respect both local config AND global visibility mode
        const showLeanToWalls = showWalls && config.walls !== 'open'
        
        // Frame dimensions - MATCHING MAIN BUILDING STYLE
        const flangeWidth = 1.2      // Width of the flanges (horizontal parts of H)
        const webHeight = 1.0        // Height of the web (vertical part of H)
        const flangeThickness = 0.15 // Thickness of flanges
        const webThickness = 0.1     // Thickness of web
        const columnInset = flangeWidth / 2 + 1.5  // Column center inset - further inside wall
        const purlinSize = 0.15      // Thin purlins like C-channels
        const girtSize = 0.2         // Wall girts
        const rafterDrop = 1.0       // Lower rafters below roof surface
        const endWallInset = 1.5     // How far inside the end walls (left/right sides)
        
        // Only 3 main frames: left end, center, right end
        const numLeanToFrames = 3
        const frameableWidth = leanToWidth - endWallInset * 2  // Width between inset positions
        const actualFrameSpacing = frameableWidth / (numLeanToFrames - 1)
        
        // Calculate number of purlins
        const numPurlins = Math.max(3, Math.ceil(config.depth / 3))
        
        return (
          <group position={[xOffset, 0, length / 2]}>
            {/* ========== MAIN FRAMES (I-beam columns + rafters) ========== */}
            {Array.from({ length: numLeanToFrames }).map((_, frameIdx) => {
              // End frames are inset from side walls
              const xPos = -leanToWidth / 2 + endWallInset + frameIdx * actualFrameSpacing
              
              return (
                <group key={`south-leanto-frame-${frameIdx}`} position={[xPos, 0, 0]}>
                  {/* Column at outer edge - I-beam style */}
                  <group position={[0, 0, config.depth - columnInset]}>
                    {/* Web (vertical center plate of H) */}
                    <mesh position={[0, outerHeight / 2, 0]}>
                      <boxGeometry args={[webThickness, outerHeight, webHeight]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Front flange */}
                    <mesh position={[0, outerHeight / 2, webHeight / 2]}>
                      <boxGeometry args={[flangeWidth, outerHeight, flangeThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Back flange */}
                    <mesh position={[0, outerHeight / 2, -webHeight / 2]}>
                      <boxGeometry args={[flangeWidth, outerHeight, flangeThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                  {/* Rafter - sloped I-beam from building to outer column - lowered below roof */}
                  <group 
                    position={[0, (attachHeight + outerHeight) / 2 - rafterDrop, config.depth / 2]}
                    rotation={[leanToRoofAngle, 0, 0]}
                  >
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[webThickness, webHeight, leanToRoofLength]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight / 2, 0]}>
                      <boxGeometry args={[flangeWidth, flangeThickness, leanToRoofLength]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight / 2, 0]}>
                      <boxGeometry args={[flangeWidth, flangeThickness, leanToRoofLength]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                </group>
              )
            })}
            
            {/* ========== EAVE BEAMS (horizontal at top) - lowered below roof ========== */}
            {showSecondaryMembers && (
              <>
                {/* Eave beam at building wall (high side) */}
                <mesh position={[0, attachHeight - rafterDrop - 0.5, columnInset + 0.5]}>
                  <boxGeometry args={[leanToWidth - endWallInset * 2, 0.3, 0.3]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Eave beam at outer edge (low side) */}
                <mesh position={[0, outerHeight - rafterDrop - 0.5, config.depth - columnInset]}>
                  <boxGeometry args={[leanToWidth - endWallInset * 2, 0.3, 0.3]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              </>
            )}
            
            {/* ========== PURLINS (on roof, parallel to building) ========== */}
            {showSecondaryMembers && Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const zPos = config.depth * ratio
              const yPos = attachHeight - leanToRoofRise * ratio - 0.1
              return (
                <mesh key={`south-leanto-purlin-${idx}`} position={[0, yPos, zPos]}>
                  <boxGeometry args={[frameableWidth, purlinSize, purlinSize]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
            
            {/* ========== WALL GIRTS (horizontal on walls) ========== */}
            {showSecondaryMembers && showLeanToWalls && (() => {
              const numGirts = Math.max(2, Math.floor(outerHeight / 4))
              const girtSpacing = outerHeight / (numGirts + 1)
              
              return (
                <group>
                  {/* Front wall girts (at outer edge) */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && 
                    Array.from({ length: numGirts }).map((_, i) => (
                      <mesh key={`south-leanto-front-girt-${i}`} position={[0, girtSpacing * (i + 1), config.depth - columnInset]}>
                        <boxGeometry args={[leanToWidth - columnInset * 2, girtSize, girtSize]} />
                        <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                      </mesh>
                    ))
                  }
                  {/* Base girt at front */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                    <mesh position={[0, girtSize / 2, config.depth - columnInset]}>
                      <boxGeometry args={[leanToWidth - columnInset * 2, girtSize, girtSize]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  )}
                </group>
              )
            })()}
            
            {/* ========== ROOF ========== */}
            {showRoof && (
              <group position={[0, (attachHeight + outerHeight) / 2, config.depth / 2 + 0.3]}>
                <mesh rotation={[leanToRoofAngle, 0, 0]}>
                  <boxGeometry args={[leanToWidth + 1, 0.15, leanToRoofLength + 0.5]} />
                  <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            
            {/* ========== WALLS ========== */}
            {showLeanToWalls && (
              <group>
                {/* Front wall (at outer edge) - only for full-length and fully-enclosed */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[0, outerHeight / 2, config.depth + 0.2]}>
                    <boxGeometry args={[leanToWidth, outerHeight, 0.4]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
                
                {/* Side walls for fully-enclosed and gable-walls-only - trapezoid shape from ground to roof */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (() => {
                  const sideWallGeo = new THREE.BufferGeometry()
                  const vertices = new Float32Array([
                    0, 0, 0,                    
                    0, 0, config.depth,         
                    0, outerHeight, config.depth,
                    0, 0, 0,                    
                    0, outerHeight, config.depth,
                    0, attachHeight, 0,         
                  ])
                  // UV coordinates for proper texture mapping
                  const uvs = new Float32Array([
                    0, 0,
                    1, 0,
                    1, outerHeight / attachHeight,
                    0, 0,
                    1, outerHeight / attachHeight,
                    0, 1,
                  ])
                  sideWallGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
                  sideWallGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
                  sideWallGeo.computeVertexNormals()
                  
                  return (
                    <>
                      <mesh position={[-leanToWidth / 2, 0, 0]} geometry={sideWallGeo}>
                        <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                      </mesh>
                      <mesh position={[leanToWidth / 2, 0, 0]} geometry={sideWallGeo}>
                        <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                      </mesh>
                    </>
                  )
                })()}
                
                {/* Gable Dress - triangular panels at ends only (no front wall, no ground-level side walls) */}
                {config.walls === 'gable-dress' && (() => {
                  // Triangle from lean-to roof slope up to building attachment point
                  // This fills the triangular gap between lean-to roof and building wall
                  const gableDressGeo = new THREE.BufferGeometry()
                  const vertices = new Float32Array([
                    // Triangle: outer-top, building-top, building-bottom (at lean-to roof level)
                    0, outerHeight, config.depth,  // top at outer edge (lean-to roof low point)
                    0, attachHeight, 0,            // top at building (lean-to roof high point)
                    0, outerHeight, 0,             // bottom at building (at outer height level)
                  ])
                  // UV coordinates for proper texture mapping
                  const uvs = new Float32Array([
                    1, 0,
                    0, 1,
                    0, 0,
                  ])
                  gableDressGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
                  gableDressGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
                  gableDressGeo.computeVertexNormals()
                  
                  return (
                    <>
                      {/* Left gable dress */}
                      <mesh position={[-leanToWidth / 2, 0, 0]} geometry={gableDressGeo}>
                        <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                      </mesh>
                      {/* Right gable dress */}
                      <mesh position={[leanToWidth / 2, 0, 0]} geometry={gableDressGeo}>
                        <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                      </mesh>
                    </>
                  )
                })()}
                
                {/* 2ft Apron - wall panel hanging from roof at front edge */}
                {config.walls === '2ft-apron' && (
                  <mesh position={[0, outerHeight - 1, config.depth + 0.2]}>
                    <boxGeometry args={[leanToWidth, 2, 0.4]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
              </group>
            )}
            
            {/* Wainscot for South Lean-To */}
            {showWalls && walls.wainscotEnabled && (
              <group>
                {/* Front wainscot - for wall types with front wall */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[0, Math.min(walls.wainscotHeight, outerHeight) / 2, config.depth + 0.35]}>
                    <boxGeometry args={[leanToWidth + 0.4, Math.min(walls.wainscotHeight, outerHeight), 0.2]} />
                    <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                  </mesh>
                )}
                {/* Side wainscots - for wall types with side walls */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* Left (west) side wainscot - from building (z=0) to outer edge (z=config.depth) */}
                    <mesh position={[-leanToWidth / 2 - 0.35, Math.min(walls.wainscotHeight, outerHeight) / 2, config.depth / 2]}>
                      <boxGeometry args={[0.2, Math.min(walls.wainscotHeight, outerHeight), config.depth]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                    {/* Right (east) side wainscot */}
                    <mesh position={[leanToWidth / 2 + 0.35, Math.min(walls.wainscotHeight, outerHeight) / 2, config.depth / 2]}>
                      <boxGeometry args={[0.2, Math.min(walls.wainscotHeight, outerHeight), config.depth]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                  </>
                )}
              </group>
            )}
            
            {/* Trim for South Lean-To */}
            {showWalls && config.walls !== 'open' && (
              <group>
                {/* ===== FULL-LENGTH TRIM ===== */}
                {config.walls === 'full-length' && (
                  <>
                    {/* Front eave trim - horizontal at top of front wall */}
                    <mesh position={[0, outerHeight - 0.3, config.depth + 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.6, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left front corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, outerHeight / 2, config.depth + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right front corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, outerHeight / 2, config.depth + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== FULLY-ENCLOSED TRIM ===== */}
                {config.walls === 'fully-enclosed' && (
                  <>
                    {/* Front eave trim - horizontal at top of front wall */}
                    <mesh position={[0, outerHeight - 0.3, config.depth + 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.6, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left outer corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, outerHeight / 2, config.depth + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right outer corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, outerHeight / 2, config.depth + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left building corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, attachHeight / 2, 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right building corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, attachHeight / 2, 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left sloped roof trim */}
                    <mesh 
                      position={[-leanToWidth / 2 - 0.1, (attachHeight + outerHeight) / 2, config.depth / 2]}
                      rotation={[leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right sloped roof trim */}
                    <mesh 
                      position={[leanToWidth / 2 + 0.1, (attachHeight + outerHeight) / 2, config.depth / 2]}
                      rotation={[leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-WALLS-ONLY TRIM ===== */}
                {config.walls === 'gable-walls-only' && (
                  <>
                    {/* Left outer corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, outerHeight / 2, config.depth + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right outer corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, outerHeight / 2, config.depth + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left building corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, attachHeight / 2, 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right building corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, attachHeight / 2, 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left sloped roof trim */}
                    <mesh 
                      position={[-leanToWidth / 2 - 0.1, (attachHeight + outerHeight) / 2, config.depth / 2]}
                      rotation={[leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right sloped roof trim */}
                    <mesh 
                      position={[leanToWidth / 2 + 0.1, (attachHeight + outerHeight) / 2, config.depth / 2]}
                      rotation={[leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-DRESS TRIM ===== */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* Left sloped roof trim */}
                    <mesh 
                      position={[-leanToWidth / 2 - 0.1, (attachHeight + outerHeight) / 2, config.depth / 2]}
                      rotation={[leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right sloped roof trim */}
                    <mesh 
                      position={[leanToWidth / 2 + 0.1, (attachHeight + outerHeight) / 2, config.depth / 2]}
                      rotation={[leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== 2FT-APRON TRIM ===== */}
                {config.walls === '2ft-apron' && (
                  <>
                    {/* Apron bottom trim */}
                    <mesh position={[0, outerHeight - 2.1, config.depth + 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.2, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Apron top trim (at roof line) */}
                    <mesh position={[0, outerHeight - 0.1, config.depth + 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.2, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
              </group>
            )}
          </group>
        )
      })()}

      {/* North Lean-To */}
      {leanToConfigs.north.enabled && (() => {
        const config = leanToConfigs.north
        const leanToWidth = width - config.cutL - config.cutR
        // Drop lowers the ENTIRE lean-to
        const attachHeight = eaveHeight - config.drop  // HIGH side at building
        const leanToRoofRise = config.depth * (config.roofPitch / 12)
        const outerHeight = Math.max(1, attachHeight - leanToRoofRise)  // LOW side at outer
        const leanToRoofLength = Math.sqrt(config.depth ** 2 + leanToRoofRise ** 2)
        const leanToRoofAngle = Math.atan2(leanToRoofRise, config.depth)
        const xOffset = (config.cutL - config.cutR) / 2
        // Lean-to walls respect both local config AND global visibility mode
        const showLeanToWalls = showWalls && config.walls !== 'open'
        
        // Frame dimensions - MATCHING MAIN BUILDING STYLE
        const flangeWidth = 1.2      // Width of the flanges (horizontal parts of H)
        const webHeight = 1.0        // Height of the web (vertical part of H)
        const flangeThickness = 0.15 // Thickness of flanges
        const webThickness = 0.1     // Thickness of web
        const columnInset = flangeWidth / 2 + 1.5  // Column center inset - further inside wall
        const purlinSize = 0.15      // Thin purlins like C-channels
        const girtSize = 0.2         // Wall girts
        const rafterDrop = 1.0       // Lower rafters below roof surface
        const endWallInset = 1.5     // How far inside the end walls (left/right sides)
        
        // Only 3 main frames: left end, center, right end
        const numLeanToFrames = 3
        const frameableWidth = leanToWidth - endWallInset * 2  // Width between inset positions
        const actualFrameSpacing = frameableWidth / (numLeanToFrames - 1)
        
        // Calculate number of purlins
        const numPurlins = Math.max(3, Math.ceil(config.depth / 3))
        
        // North lean-to extends in NEGATIVE Z direction
        // Building wall at z=0, outer edge at z=-config.depth
        
        return (
          <group position={[xOffset, 0, -length / 2]}>
            {/* ========== MAIN FRAMES (I-beam columns + rafters) ========== */}
            {Array.from({ length: numLeanToFrames }).map((_, frameIdx) => {
              // End frames are inset from side walls
              const xPos = -leanToWidth / 2 + endWallInset + frameIdx * actualFrameSpacing
              
              return (
                <group key={`north-leanto-frame-${frameIdx}`} position={[xPos, 0, 0]}>
                  {/* Column at outer edge - I-beam style */}
                  <group position={[0, 0, -config.depth + columnInset]}>
                    {/* Web (vertical center plate of H) */}
                    <mesh position={[0, outerHeight / 2, 0]}>
                      <boxGeometry args={[webThickness, outerHeight, webHeight]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Front flange */}
                    <mesh position={[0, outerHeight / 2, webHeight / 2]}>
                      <boxGeometry args={[flangeWidth, outerHeight, flangeThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Back flange */}
                    <mesh position={[0, outerHeight / 2, -webHeight / 2]}>
                      <boxGeometry args={[flangeWidth, outerHeight, flangeThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                  {/* Rafter - sloped I-beam from building to outer column - lowered below roof */}
                  <group 
                    position={[0, (attachHeight + outerHeight) / 2 - rafterDrop, -config.depth / 2]}
                    rotation={[-leanToRoofAngle, 0, 0]}
                  >
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[webThickness, webHeight, leanToRoofLength]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight / 2, 0]}>
                      <boxGeometry args={[flangeWidth, flangeThickness, leanToRoofLength]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight / 2, 0]}>
                      <boxGeometry args={[flangeWidth, flangeThickness, leanToRoofLength]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                </group>
              )
            })}
            
            {/* ========== EAVE BEAMS (horizontal at top) - lowered below roof ========== */}
            {showSecondaryMembers && (
              <>
                {/* Eave beam at building wall (high side) */}
                <mesh position={[0, attachHeight - rafterDrop - 0.5, -columnInset - 0.5]}>
                  <boxGeometry args={[leanToWidth - endWallInset * 2, 0.3, 0.3]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Eave beam at outer edge (low side) */}
                <mesh position={[0, outerHeight - rafterDrop - 0.5, -config.depth + columnInset]}>
                  <boxGeometry args={[leanToWidth - endWallInset * 2, 0.3, 0.3]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              </>
            )}
            
            {/* ========== PURLINS (on roof, parallel to building) ========== */}
            {showSecondaryMembers && Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const zPos = -config.depth * ratio
              const yPos = attachHeight - leanToRoofRise * ratio - 0.1
              return (
                <mesh key={`north-leanto-purlin-${idx}`} position={[0, yPos, zPos]}>
                  <boxGeometry args={[frameableWidth, purlinSize, purlinSize]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
            
            {/* ========== WALL GIRTS (horizontal on walls) ========== */}
            {showSecondaryMembers && showLeanToWalls && (() => {
              const numGirts = Math.max(2, Math.floor(outerHeight / 4))
              const girtSpacing = outerHeight / (numGirts + 1)
              
              return (
                <group>
                  {/* Front wall girts (at outer edge) */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && 
                    Array.from({ length: numGirts }).map((_, i) => (
                      <mesh key={`north-leanto-front-girt-${i}`} position={[0, girtSpacing * (i + 1), -config.depth + columnInset]}>
                        <boxGeometry args={[leanToWidth - columnInset * 2, girtSize, girtSize]} />
                        <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                      </mesh>
                    ))
                  }
                  {/* Base girt at front */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                    <mesh position={[0, girtSize / 2, -config.depth + columnInset]}>
                      <boxGeometry args={[leanToWidth - columnInset * 2, girtSize, girtSize]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  )}
                </group>
              )
            })()}
            
            {/* ========== ROOF ========== */}
            {showRoof && (
              <group position={[0, (attachHeight + outerHeight) / 2, -config.depth / 2 - 0.3]}>
                <mesh rotation={[-leanToRoofAngle, 0, 0]}>
                  <boxGeometry args={[leanToWidth + 1, 0.15, leanToRoofLength + 0.5]} />
                  <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            
            {/* ========== WALLS ========== */}
            {showLeanToWalls && (
              <group>
                {/* Front wall (at outer edge) - only for full-length and fully-enclosed */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[0, outerHeight / 2, -config.depth - 0.2]}>
                    <boxGeometry args={[leanToWidth, outerHeight, 0.4]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
                
                {/* Side walls for fully-enclosed and gable-walls-only - trapezoid shape */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* Left side wall - trapezoid */}
                    {/* North extends in -Z, wall from z=0 (building, high) to z=-depth (outer, low) */}
                    {/* Rotation -90° around Y: X becomes -Z */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={outerHeight}
                      highHeight={attachHeight}
                      position={[-leanToWidth / 2, 0, 0]}
                      rotation={[0, -Math.PI / 2, 0]}
                      texture={wallTexture}
                    />
                    {/* Right side wall - trapezoid */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={outerHeight}
                      highHeight={attachHeight}
                      position={[leanToWidth / 2, 0, 0]}
                      rotation={[0, -Math.PI / 2, 0]}
                      texture={wallTexture}
                    />
                  </>
                )}
                
                {/* Gable Dress - triangular panels at ends */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* Left gable dress */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={0}
                      highHeight={attachHeight - outerHeight}
                      position={[-leanToWidth / 2, outerHeight, 0]}
                      rotation={[0, -Math.PI / 2, 0]}
                      texture={wallTexture}
                    />
                    {/* Right gable dress */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={0}
                      highHeight={attachHeight - outerHeight}
                      position={[leanToWidth / 2, outerHeight, 0]}
                      rotation={[0, -Math.PI / 2, 0]}
                      texture={wallTexture}
                    />
                  </>
                )}
                
                {/* 2ft Apron - wall panel hanging from roof at front edge */}
                {config.walls === '2ft-apron' && (
                  <mesh position={[0, outerHeight - 1, -config.depth - 0.2]}>
                    <boxGeometry args={[leanToWidth, 2, 0.4]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
              </group>
            )}
            
            {/* Wainscot for North Lean-To */}
            {showWalls && walls.wainscotEnabled && (
              <group>
                {/* Front wainscot - for wall types with front wall */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[0, Math.min(walls.wainscotHeight, outerHeight) / 2, -config.depth - 0.35]}>
                    <boxGeometry args={[leanToWidth + 0.4, Math.min(walls.wainscotHeight, outerHeight), 0.2]} />
                    <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                  </mesh>
                )}
                {/* Side wainscots - for wall types with side walls */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* Left (west) side wainscot */}
                    <mesh position={[-leanToWidth / 2 - 0.35, Math.min(walls.wainscotHeight, outerHeight) / 2, -config.depth / 2]}>
                      <boxGeometry args={[0.2, Math.min(walls.wainscotHeight, outerHeight), config.depth]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                    {/* Right (east) side wainscot */}
                    <mesh position={[leanToWidth / 2 + 0.35, Math.min(walls.wainscotHeight, outerHeight) / 2, -config.depth / 2]}>
                      <boxGeometry args={[0.2, Math.min(walls.wainscotHeight, outerHeight), config.depth]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                  </>
                )}
              </group>
            )}
            
            {/* Trim for North Lean-To */}
            {showWalls && config.walls !== 'open' && (
              <group>
                {/* ===== FULL-LENGTH TRIM ===== */}
                {config.walls === 'full-length' && (
                  <>
                    {/* Front eave trim - horizontal at top of front wall */}
                    <mesh position={[0, outerHeight - 0.3, -config.depth - 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.6, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left front corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, outerHeight / 2, -config.depth - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right front corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, outerHeight / 2, -config.depth - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== FULLY-ENCLOSED TRIM ===== */}
                {config.walls === 'fully-enclosed' && (
                  <>
                    {/* Front eave trim - horizontal at top of front wall */}
                    <mesh position={[0, outerHeight - 0.3, -config.depth - 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.6, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left outer corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, outerHeight / 2, -config.depth - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right outer corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, outerHeight / 2, -config.depth - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left building corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, attachHeight / 2, -0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right building corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, attachHeight / 2, -0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left sloped roof trim */}
                    <mesh 
                      position={[-leanToWidth / 2 - 0.1, (attachHeight + outerHeight) / 2, -config.depth / 2]}
                      rotation={[-leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right sloped roof trim */}
                    <mesh 
                      position={[leanToWidth / 2 + 0.1, (attachHeight + outerHeight) / 2, -config.depth / 2]}
                      rotation={[-leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-WALLS-ONLY TRIM ===== */}
                {config.walls === 'gable-walls-only' && (
                  <>
                    {/* Left outer corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, outerHeight / 2, -config.depth - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right outer corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, outerHeight / 2, -config.depth - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left building corner trim */}
                    <mesh position={[-leanToWidth / 2 - 0.1, attachHeight / 2, -0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right building corner trim */}
                    <mesh position={[leanToWidth / 2 + 0.1, attachHeight / 2, -0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Left sloped roof trim */}
                    <mesh 
                      position={[-leanToWidth / 2 - 0.1, (attachHeight + outerHeight) / 2, -config.depth / 2]}
                      rotation={[-leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right sloped roof trim */}
                    <mesh 
                      position={[leanToWidth / 2 + 0.1, (attachHeight + outerHeight) / 2, -config.depth / 2]}
                      rotation={[-leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-DRESS TRIM ===== */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* Left sloped roof trim */}
                    <mesh 
                      position={[-leanToWidth / 2 - 0.1, (attachHeight + outerHeight) / 2, -config.depth / 2]}
                      rotation={[-leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Right sloped roof trim */}
                    <mesh 
                      position={[leanToWidth / 2 + 0.1, (attachHeight + outerHeight) / 2, -config.depth / 2]}
                      rotation={[-leanToRoofAngle, 0, 0]}
                    >
                      <boxGeometry args={[0.2, 0.15, leanToRoofLength]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== 2FT-APRON TRIM ===== */}
                {config.walls === '2ft-apron' && (
                  <>
                    {/* Apron bottom trim */}
                    <mesh position={[0, outerHeight - 2.1, -config.depth - 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.2, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Apron top trim (at roof line) */}
                    <mesh position={[0, outerHeight - 0.1, -config.depth - 0.3]}>
                      <boxGeometry args={[leanToWidth + 0.4, 0.2, 0.15]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
              </group>
            )}
          </group>
        )
      })()}

      {/* West Lean-To */}
      {leanToConfigs.west.enabled && (() => {
        const config = leanToConfigs.west
        const leanToLength = length - config.cutL - config.cutR
        // Drop lowers the ENTIRE lean-to
        const attachHeight = eaveHeight - config.drop  // HIGH side at building
        const leanToRoofRise = config.depth * (config.roofPitch / 12)
        const outerHeight = Math.max(1, attachHeight - leanToRoofRise)  // LOW side at outer
        const leanToRoofLength = Math.sqrt(config.depth ** 2 + leanToRoofRise ** 2)
        const leanToRoofAngle = Math.atan2(leanToRoofRise, config.depth)
        const zOffset = (config.cutR - config.cutL) / 2
        // Lean-to walls respect both local config AND global visibility mode
        const showLeanToWalls = showWalls && config.walls !== 'open'
        
        // Frame dimensions - MATCHING MAIN BUILDING STYLE
        const flangeWidth = 1.2      // Width of the flanges (horizontal parts of H)
        const webHeight = 1.0        // Height of the web (vertical part of H)
        const flangeThickness = 0.15 // Thickness of flanges
        const webThickness = 0.1     // Thickness of web
        const columnInset = flangeWidth / 2 + 1.5  // Column center inset - further inside wall
        const purlinSize = 0.15      // Thin purlins like C-channels
        const girtSize = 0.2         // Wall girts
        const rafterDrop = 1.0       // Lower rafters below roof surface
        const endWallInset = 1.5     // How far inside the end walls (north/south sides)
        
        // Only 3 main frames: north end, center, south end
        const numLeanToFrames = 3
        const frameableLength = leanToLength - endWallInset * 2  // Length between inset positions
        const actualFrameSpacing = frameableLength / (numLeanToFrames - 1)
        
        // Calculate number of purlins
        const numPurlins = Math.max(3, Math.ceil(config.depth / 3))
        
        // West lean-to extends in NEGATIVE X direction
        // Building wall at x=0, outer edge at x=-config.depth
        // Length runs along Z axis: -leanToLength/2 to +leanToLength/2
        
        return (
          <group position={[-width / 2, 0, zOffset]}>
            {/* ========== MAIN FRAMES (I-beam columns + rafters) ========== */}
            {Array.from({ length: numLeanToFrames }).map((_, frameIdx) => {
              // End frames are inset from end walls
              const zPos = -leanToLength / 2 + endWallInset + frameIdx * actualFrameSpacing
              
              return (
                <group key={`west-leanto-frame-${frameIdx}`} position={[0, 0, zPos]}>
                  {/* Column at outer edge - I-beam style (rotated for west orientation) */}
                  <group position={[-config.depth + columnInset, 0, 0]}>
                    {/* Web (vertical center plate of H) */}
                    <mesh position={[0, outerHeight / 2, 0]}>
                      <boxGeometry args={[webHeight, outerHeight, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Front flange */}
                    <mesh position={[webHeight / 2, outerHeight / 2, 0]}>
                      <boxGeometry args={[flangeThickness, outerHeight, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Back flange */}
                    <mesh position={[-webHeight / 2, outerHeight / 2, 0]}>
                      <boxGeometry args={[flangeThickness, outerHeight, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                  {/* Rafter - sloped I-beam from building to outer column - lowered below roof */}
                  <group 
                    position={[-config.depth / 2, (attachHeight + outerHeight) / 2 - rafterDrop, 0]}
                    rotation={[0, 0, leanToRoofAngle]}
                  >
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[leanToRoofLength, webHeight, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight / 2, 0]}>
                      <boxGeometry args={[leanToRoofLength, flangeThickness, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight / 2, 0]}>
                      <boxGeometry args={[leanToRoofLength, flangeThickness, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                </group>
              )
            })}
            
            {/* ========== EAVE BEAMS (horizontal at top) - lowered below roof ========== */}
            {showSecondaryMembers && (
              <>
                {/* Eave beam at building wall (high side) */}
                <mesh position={[-columnInset - 0.5, attachHeight - rafterDrop - 0.5, 0]}>
                  <boxGeometry args={[0.3, 0.3, leanToLength - endWallInset * 2]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Eave beam at outer edge (low side) */}
                <mesh position={[-config.depth + columnInset, outerHeight - rafterDrop - 0.5, 0]}>
                  <boxGeometry args={[0.3, 0.3, leanToLength - endWallInset * 2]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              </>
            )}
            
            {/* ========== PURLINS (on roof, parallel to building) ========== */}
            {showSecondaryMembers && Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const xPos = -config.depth * ratio
              const yPos = attachHeight - leanToRoofRise * ratio - 0.1
              return (
                <mesh key={`west-leanto-purlin-${idx}`} position={[xPos, yPos, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, frameableLength]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
            
            {/* ========== WALL GIRTS (horizontal on walls) ========== */}
            {showSecondaryMembers && showLeanToWalls && (() => {
              const numGirts = Math.max(2, Math.floor(outerHeight / 4))
              const girtSpacing = outerHeight / (numGirts + 1)
              
              return (
                <group>
                  {/* Outer wall girts (at outer edge) */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && 
                    Array.from({ length: numGirts }).map((_, i) => (
                      <mesh key={`west-leanto-outer-girt-${i}`} position={[-config.depth + columnInset, girtSpacing * (i + 1), 0]}>
                        <boxGeometry args={[girtSize, girtSize, leanToLength - columnInset * 2]} />
                        <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                      </mesh>
                    ))
                  }
                  {/* Base girt at outer wall */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                    <mesh position={[-config.depth + columnInset, girtSize / 2, 0]}>
                      <boxGeometry args={[girtSize, girtSize, leanToLength - columnInset * 2]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  )}
                </group>
              )
            })()}
            
            {/* ========== ROOF ========== */}
            {showRoof && (
              <group position={[-config.depth / 2 - 0.3, (attachHeight + outerHeight) / 2, 0]}>
                <mesh rotation={[0, 0, leanToRoofAngle]}>
                  <boxGeometry args={[leanToRoofLength + 0.5, 0.15, leanToLength + 1]} />
                  <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            
            {/* ========== WALLS ========== */}
            {showLeanToWalls && (
              <group>
                {/* Outer wall (at outer edge) - only for full-length and fully-enclosed */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[-config.depth - 0.2, outerHeight / 2, 0]}>
                    <boxGeometry args={[0.4, outerHeight, leanToLength]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
                
                {/* End walls for fully-enclosed and gable-walls-only - trapezoid shape */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* South end wall - trapezoid */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={outerHeight}
                      highHeight={attachHeight}
                      position={[0, 0, leanToLength / 2]}
                      rotation={[0, Math.PI, 0]}
                      texture={wallTexture}
                    />
                    {/* North end wall - trapezoid */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={outerHeight}
                      highHeight={attachHeight}
                      position={[0, 0, -leanToLength / 2]}
                      rotation={[0, Math.PI, 0]}
                      texture={wallTexture}
                    />
                  </>
                )}
                
                {/* Gable Dress - triangular panels at ends */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* South end gable dress */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={0}
                      highHeight={attachHeight - outerHeight}
                      position={[0, outerHeight, leanToLength / 2]}
                      rotation={[0, Math.PI, 0]}
                      texture={wallTexture}
                    />
                    {/* North end gable dress */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={0}
                      highHeight={attachHeight - outerHeight}
                      position={[0, outerHeight, -leanToLength / 2]}
                      rotation={[0, Math.PI, 0]}
                      texture={wallTexture}
                    />
                  </>
                )}
                
                {/* 2ft Apron - wall panel hanging from roof at outer edge */}
                {config.walls === '2ft-apron' && (
                  <mesh position={[-config.depth - 0.2, outerHeight - 1, 0]}>
                    <boxGeometry args={[0.4, 2, leanToLength]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
              </group>
            )}
            
            {/* Wainscot for West Lean-To */}
            {showWalls && walls.wainscotEnabled && (
              <group>
                {/* Outer wainscot - for wall types with outer wall */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[-config.depth - 0.35, Math.min(walls.wainscotHeight, outerHeight) / 2, 0]}>
                    <boxGeometry args={[0.2, Math.min(walls.wainscotHeight, outerHeight), leanToLength + 0.4]} />
                    <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                  </mesh>
                )}
                {/* End wainscots - for wall types with end walls */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* South end wainscot */}
                    <mesh position={[-config.depth / 2, Math.min(walls.wainscotHeight, outerHeight) / 2, leanToLength / 2 + 0.35]}>
                      <boxGeometry args={[config.depth, Math.min(walls.wainscotHeight, outerHeight), 0.2]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                    {/* North end wainscot */}
                    <mesh position={[-config.depth / 2, Math.min(walls.wainscotHeight, outerHeight) / 2, -leanToLength / 2 - 0.35]}>
                      <boxGeometry args={[config.depth, Math.min(walls.wainscotHeight, outerHeight), 0.2]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                  </>
                )}
              </group>
            )}
            
            {/* Trim for West Lean-To */}
            {showWalls && config.walls !== 'open' && (
              <group>
                {/* ===== FULL-LENGTH TRIM ===== */}
                {config.walls === 'full-length' && (
                  <>
                    {/* Outer eave trim - horizontal at top of outer wall */}
                    <mesh position={[-config.depth - 0.3, outerHeight - 0.3, 0]}>
                      <boxGeometry args={[0.15, 0.6, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South outer corner trim */}
                    <mesh position={[-config.depth - 0.1, outerHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North outer corner trim */}
                    <mesh position={[-config.depth - 0.1, outerHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== FULLY-ENCLOSED TRIM ===== */}
                {config.walls === 'fully-enclosed' && (
                  <>
                    {/* Outer eave trim - horizontal at top of outer wall */}
                    <mesh position={[-config.depth - 0.3, outerHeight - 0.3, 0]}>
                      <boxGeometry args={[0.15, 0.6, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South outer corner trim */}
                    <mesh position={[-config.depth - 0.1, outerHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North outer corner trim */}
                    <mesh position={[-config.depth - 0.1, outerHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South building corner trim */}
                    <mesh position={[-0.1, attachHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North building corner trim */}
                    <mesh position={[-0.1, attachHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South sloped roof trim */}
                    <mesh 
                      position={[-config.depth / 2, (attachHeight + outerHeight) / 2, leanToLength / 2 + 0.1]}
                      rotation={[0, 0, -leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North sloped roof trim */}
                    <mesh 
                      position={[-config.depth / 2, (attachHeight + outerHeight) / 2, -leanToLength / 2 - 0.1]}
                      rotation={[0, 0, -leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-WALLS-ONLY TRIM ===== */}
                {config.walls === 'gable-walls-only' && (
                  <>
                    {/* South outer corner trim */}
                    <mesh position={[-config.depth - 0.1, outerHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North outer corner trim */}
                    <mesh position={[-config.depth - 0.1, outerHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South building corner trim */}
                    <mesh position={[-0.1, attachHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North building corner trim */}
                    <mesh position={[-0.1, attachHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South sloped roof trim */}
                    <mesh 
                      position={[-config.depth / 2, (attachHeight + outerHeight) / 2, leanToLength / 2 + 0.1]}
                      rotation={[0, 0, -leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North sloped roof trim */}
                    <mesh 
                      position={[-config.depth / 2, (attachHeight + outerHeight) / 2, -leanToLength / 2 - 0.1]}
                      rotation={[0, 0, -leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-DRESS TRIM ===== */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* South sloped roof trim */}
                    <mesh 
                      position={[-config.depth / 2, (attachHeight + outerHeight) / 2, leanToLength / 2 + 0.1]}
                      rotation={[0, 0, -leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North sloped roof trim */}
                    <mesh 
                      position={[-config.depth / 2, (attachHeight + outerHeight) / 2, -leanToLength / 2 - 0.1]}
                      rotation={[0, 0, -leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== 2FT-APRON TRIM ===== */}
                {config.walls === '2ft-apron' && (
                  <>
                    {/* Apron bottom trim */}
                    <mesh position={[-config.depth - 0.3, outerHeight - 2.1, 0]}>
                      <boxGeometry args={[0.15, 0.2, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Apron top trim (at roof line) */}
                    <mesh position={[-config.depth - 0.3, outerHeight - 0.1, 0]}>
                      <boxGeometry args={[0.15, 0.2, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
              </group>
            )}
          </group>
        )
      })()}

      {/* East Lean-To */}
      {leanToConfigs.east.enabled && (() => {
        const config = leanToConfigs.east
        const leanToLength = length - config.cutL - config.cutR
        // Drop lowers the ENTIRE lean-to
        const attachHeight = eaveHeight - config.drop  // HIGH side at building
        const leanToRoofRise = config.depth * (config.roofPitch / 12)
        const outerHeight = Math.max(1, attachHeight - leanToRoofRise)  // LOW side at outer
        const leanToRoofLength = Math.sqrt(config.depth ** 2 + leanToRoofRise ** 2)
        const leanToRoofAngle = Math.atan2(leanToRoofRise, config.depth)
        const zOffset = (config.cutL - config.cutR) / 2
        // Lean-to walls respect both local config AND global visibility mode
        const showLeanToWalls = showWalls && config.walls !== 'open'
        
        // Frame dimensions - MATCHING MAIN BUILDING STYLE
        const flangeWidth = 1.2      // Width of the flanges (horizontal parts of H)
        const webHeight = 1.0        // Height of the web (vertical part of H)
        const flangeThickness = 0.15 // Thickness of flanges
        const webThickness = 0.1     // Thickness of web
        const columnInset = flangeWidth / 2 + 1.5  // Column center inset - further inside wall
        const purlinSize = 0.15      // Thin purlins like C-channels
        const girtSize = 0.2         // Wall girts
        const rafterDrop = 1.0       // Lower rafters below roof surface
        const endWallInset = 1.5     // How far inside the end walls (north/south sides)
        
        // Only 3 main frames: north end, center, south end
        const numLeanToFrames = 3
        const frameableLength = leanToLength - endWallInset * 2  // Length between inset positions
        const actualFrameSpacing = frameableLength / (numLeanToFrames - 1)
        
        // Calculate number of purlins
        const numPurlins = Math.max(3, Math.ceil(config.depth / 3))
        
        // East lean-to extends in POSITIVE X direction
        // Building wall at x=0, outer edge at x=+config.depth
        // Length runs along Z axis: -leanToLength/2 to +leanToLength/2
        
        return (
          <group position={[width / 2, 0, zOffset]}>
            {/* ========== MAIN FRAMES (I-beam columns + rafters) ========== */}
            {Array.from({ length: numLeanToFrames }).map((_, frameIdx) => {
              // End frames are inset from end walls
              const zPos = -leanToLength / 2 + endWallInset + frameIdx * actualFrameSpacing
              
              return (
                <group key={`east-leanto-frame-${frameIdx}`} position={[0, 0, zPos]}>
                  {/* Column at outer edge - I-beam style (rotated for east orientation) */}
                  <group position={[config.depth - columnInset, 0, 0]}>
                    {/* Web (vertical center plate of H) */}
                    <mesh position={[0, outerHeight / 2, 0]}>
                      <boxGeometry args={[webHeight, outerHeight, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Front flange */}
                    <mesh position={[webHeight / 2, outerHeight / 2, 0]}>
                      <boxGeometry args={[flangeThickness, outerHeight, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Back flange */}
                    <mesh position={[-webHeight / 2, outerHeight / 2, 0]}>
                      <boxGeometry args={[flangeThickness, outerHeight, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                  {/* Rafter - sloped I-beam from building to outer column - lowered below roof */}
                  <group 
                    position={[config.depth / 2, (attachHeight + outerHeight) / 2 - rafterDrop, 0]}
                    rotation={[0, 0, -leanToRoofAngle]}
                  >
                    {/* Web */}
                    <mesh>
                      <boxGeometry args={[leanToRoofLength, webHeight, webThickness]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Top flange */}
                    <mesh position={[0, webHeight / 2, 0]}>
                      <boxGeometry args={[leanToRoofLength, flangeThickness, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Bottom flange */}
                    <mesh position={[0, -webHeight / 2, 0]}>
                      <boxGeometry args={[leanToRoofLength, flangeThickness, flangeWidth]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  </group>
                  
                </group>
              )
            })}
            
            {/* ========== EAVE BEAMS (horizontal at top) - lowered below roof ========== */}
            {showSecondaryMembers && (
              <>
                {/* Eave beam at building wall (high side) */}
                <mesh position={[columnInset + 0.5, attachHeight - rafterDrop - 0.5, 0]}>
                  <boxGeometry args={[0.3, 0.3, leanToLength - endWallInset * 2]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Eave beam at outer edge (low side) */}
                <mesh position={[config.depth - columnInset, outerHeight - rafterDrop - 0.5, 0]}>
                  <boxGeometry args={[0.3, 0.3, leanToLength - endWallInset * 2]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              </>
            )}
            
            {/* ========== PURLINS (on roof, parallel to building) ========== */}
            {showSecondaryMembers && Array.from({ length: numPurlins }).map((_, idx) => {
              const ratio = (idx + 1) / (numPurlins + 1)
              const xPos = config.depth * ratio
              const yPos = attachHeight - leanToRoofRise * ratio - 0.1
              return (
                <mesh key={`east-leanto-purlin-${idx}`} position={[xPos, yPos, 0]}>
                  <boxGeometry args={[purlinSize, purlinSize, frameableLength]} />
                  <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                </mesh>
              )
            })}
            
            {/* ========== WALL GIRTS (horizontal on walls) ========== */}
            {showSecondaryMembers && showLeanToWalls && (() => {
              const numGirts = Math.max(2, Math.floor(outerHeight / 4))
              const girtSpacing = outerHeight / (numGirts + 1)
              
              return (
                <group>
                  {/* Outer wall girts (at outer edge) */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && 
                    Array.from({ length: numGirts }).map((_, i) => (
                      <mesh key={`east-leanto-outer-girt-${i}`} position={[config.depth - columnInset, girtSpacing * (i + 1), 0]}>
                        <boxGeometry args={[girtSize, girtSize, leanToLength - columnInset * 2]} />
                        <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                      </mesh>
                    ))
                  }
                  {/* Base girt at outer wall */}
                  {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                    <mesh position={[config.depth - columnInset, girtSize / 2, 0]}>
                      <boxGeometry args={[girtSize, girtSize, leanToLength - columnInset * 2]} />
                      <meshStandardMaterial color="#FF6B35" metalness={0.6} roughness={0.4} />
                    </mesh>
                  )}
                </group>
              )
            })()}
            
            {/* ========== ROOF ========== */}
            {showRoof && (
              <group position={[config.depth / 2 + 0.3, (attachHeight + outerHeight) / 2, 0]}>
                <mesh rotation={[0, 0, -leanToRoofAngle]}>
                  <boxGeometry args={[leanToRoofLength + 0.5, 0.15, leanToLength + 1]} />
                  <meshStandardMaterial map={roofTexture} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            
            {/* ========== WALLS ========== */}
            {showLeanToWalls && (
              <group>
                {/* Outer wall (at outer edge) - only for full-length and fully-enclosed */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[config.depth + 0.2, outerHeight / 2, 0]}>
                    <boxGeometry args={[0.4, outerHeight, leanToLength]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
                
                {/* End walls for fully-enclosed and gable-walls-only - trapezoid shape */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* South end wall - trapezoid */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={outerHeight}
                      highHeight={attachHeight}
                      position={[0, 0, leanToLength / 2]}
                      rotation={[0, 0, 0]}
                      texture={wallTexture}
                    />
                    {/* North end wall - trapezoid */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={outerHeight}
                      highHeight={attachHeight}
                      position={[0, 0, -leanToLength / 2]}
                      rotation={[0, 0, 0]}
                      texture={wallTexture}
                    />
                  </>
                )}
                
                {/* Gable Dress - triangular panels at ends */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* South end gable dress */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={0}
                      highHeight={attachHeight - outerHeight}
                      position={[0, outerHeight, leanToLength / 2]}
                      rotation={[0, 0, 0]}
                      texture={wallTexture}
                    />
                    {/* North end gable dress */}
                    <TrapezoidWall
                      width={config.depth}
                      lowHeight={0}
                      highHeight={attachHeight - outerHeight}
                      position={[0, outerHeight, -leanToLength / 2]}
                      rotation={[0, 0, 0]}
                      texture={wallTexture}
                    />
                  </>
                )}
                
                {/* 2ft Apron - wall panel hanging from roof at outer edge */}
                {config.walls === '2ft-apron' && (
                  <mesh position={[config.depth + 0.2, outerHeight - 1, 0]}>
                    <boxGeometry args={[0.4, 2, leanToLength]} />
                    <meshStandardMaterial map={wallTexture} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                )}
              </group>
            )}
            
            {/* Wainscot for East Lean-To */}
            {showWalls && walls.wainscotEnabled && (
              <group>
                {/* Outer wainscot - for wall types with outer wall */}
                {(config.walls === 'full-length' || config.walls === 'fully-enclosed') && (
                  <mesh position={[config.depth + 0.35, Math.min(walls.wainscotHeight, outerHeight) / 2, 0]}>
                    <boxGeometry args={[0.2, Math.min(walls.wainscotHeight, outerHeight), leanToLength + 0.4]} />
                    <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                  </mesh>
                )}
                {/* End wainscots - for wall types with end walls */}
                {(config.walls === 'fully-enclosed' || config.walls === 'gable-walls-only') && (
                  <>
                    {/* South end wainscot */}
                    <mesh position={[config.depth / 2, Math.min(walls.wainscotHeight, outerHeight) / 2, leanToLength / 2 + 0.35]}>
                      <boxGeometry args={[config.depth, Math.min(walls.wainscotHeight, outerHeight), 0.2]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                    {/* North end wainscot */}
                    <mesh position={[config.depth / 2, Math.min(walls.wainscotHeight, outerHeight) / 2, -leanToLength / 2 - 0.35]}>
                      <boxGeometry args={[config.depth, Math.min(walls.wainscotHeight, outerHeight), 0.2]} />
                      <meshStandardMaterial color={colors.wainscot} metalness={0.4} roughness={0.6} />
                    </mesh>
                  </>
                )}
              </group>
            )}
            
            {/* Trim for East Lean-To */}
            {showWalls && config.walls !== 'open' && (
              <group>
                {/* ===== FULL-LENGTH TRIM ===== */}
                {config.walls === 'full-length' && (
                  <>
                    {/* Outer eave trim - horizontal at top of outer wall */}
                    <mesh position={[config.depth + 0.3, outerHeight - 0.3, 0]}>
                      <boxGeometry args={[0.15, 0.6, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South outer corner trim */}
                    <mesh position={[config.depth + 0.1, outerHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North outer corner trim */}
                    <mesh position={[config.depth + 0.1, outerHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== FULLY-ENCLOSED TRIM ===== */}
                {config.walls === 'fully-enclosed' && (
                  <>
                    {/* Outer eave trim - horizontal at top of outer wall */}
                    <mesh position={[config.depth + 0.3, outerHeight - 0.3, 0]}>
                      <boxGeometry args={[0.15, 0.6, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South outer corner trim */}
                    <mesh position={[config.depth + 0.1, outerHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North outer corner trim */}
                    <mesh position={[config.depth + 0.1, outerHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South building corner trim */}
                    <mesh position={[0.1, attachHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North building corner trim */}
                    <mesh position={[0.1, attachHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South sloped roof trim */}
                    <mesh 
                      position={[config.depth / 2, (attachHeight + outerHeight) / 2, leanToLength / 2 + 0.1]}
                      rotation={[0, 0, leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North sloped roof trim */}
                    <mesh 
                      position={[config.depth / 2, (attachHeight + outerHeight) / 2, -leanToLength / 2 - 0.1]}
                      rotation={[0, 0, leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-WALLS-ONLY TRIM ===== */}
                {config.walls === 'gable-walls-only' && (
                  <>
                    {/* South outer corner trim */}
                    <mesh position={[config.depth + 0.1, outerHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North outer corner trim */}
                    <mesh position={[config.depth + 0.1, outerHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, outerHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South building corner trim */}
                    <mesh position={[0.1, attachHeight / 2, leanToLength / 2 + 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North building corner trim */}
                    <mesh position={[0.1, attachHeight / 2, -leanToLength / 2 - 0.1]}>
                      <boxGeometry args={[0.2, attachHeight, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* South sloped roof trim */}
                    <mesh 
                      position={[config.depth / 2, (attachHeight + outerHeight) / 2, leanToLength / 2 + 0.1]}
                      rotation={[0, 0, leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North sloped roof trim */}
                    <mesh 
                      position={[config.depth / 2, (attachHeight + outerHeight) / 2, -leanToLength / 2 - 0.1]}
                      rotation={[0, 0, leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== GABLE-DRESS TRIM ===== */}
                {config.walls === 'gable-dress' && (
                  <>
                    {/* South sloped roof trim */}
                    <mesh 
                      position={[config.depth / 2, (attachHeight + outerHeight) / 2, leanToLength / 2 + 0.1]}
                      rotation={[0, 0, leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* North sloped roof trim */}
                    <mesh 
                      position={[config.depth / 2, (attachHeight + outerHeight) / 2, -leanToLength / 2 - 0.1]}
                      rotation={[0, 0, leanToRoofAngle]}
                    >
                      <boxGeometry args={[leanToRoofLength, 0.15, 0.2]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
                
                {/* ===== 2FT-APRON TRIM ===== */}
                {config.walls === '2ft-apron' && (
                  <>
                    {/* Apron bottom trim */}
                    <mesh position={[config.depth + 0.3, outerHeight - 2.1, 0]}>
                      <boxGeometry args={[0.15, 0.2, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                    {/* Apron top trim (at roof line) */}
                    <mesh position={[config.depth + 0.3, outerHeight - 0.1, 0]}>
                      <boxGeometry args={[0.15, 0.2, leanToLength + 0.4]} />
                      <meshStandardMaterial color={colors.trim} />
                    </mesh>
                  </>
                )}
              </group>
            )}
          </group>
        )
      })()}
    </group>
  )
}
