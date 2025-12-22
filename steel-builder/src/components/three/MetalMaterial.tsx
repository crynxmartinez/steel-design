import { useMemo } from 'react'
import * as THREE from 'three'

interface MetalMaterialProps {
  color: string
  isRoof?: boolean
  ribSpacing?: number
}

// Create a corrugated metal texture using canvas
function createCorrugatedTexture(
  baseColor: string,
  _ribSpacing: number = 0.5,
  isRoof: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const size = 128  // Smaller canvas = larger ribs when repeated
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Parse the base color
  const color = new THREE.Color(baseColor)
  const r = Math.floor(color.r * 255)
  const g = Math.floor(color.g * 255)
  const b = Math.floor(color.b * 255)

  // Fill with base color
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
  ctx.fillRect(0, 0, size, size)

  // Draw larger, more visible ribs
  const ribWidth = 16  // Fixed rib width for consistent look
  const numRibs = Math.floor(size / ribWidth)

  for (let i = 0; i < numRibs; i++) {
    const pos = i * ribWidth
    
    // Lighter highlight on one side of rib (stronger contrast)
    const highlightR = Math.min(255, r + 50)
    const highlightG = Math.min(255, g + 50)
    const highlightB = Math.min(255, b + 50)
    ctx.fillStyle = `rgb(${highlightR}, ${highlightG}, ${highlightB})`
    
    if (isRoof) {
      ctx.fillRect(0, pos, size, ribWidth * 0.4)
    } else {
      ctx.fillRect(pos, 0, ribWidth * 0.4, size)
    }

    // Darker shadow on other side of rib (stronger contrast)
    const shadowR = Math.max(0, r - 40)
    const shadowG = Math.max(0, g - 40)
    const shadowB = Math.max(0, b - 40)
    ctx.fillStyle = `rgb(${shadowR}, ${shadowG}, ${shadowB})`
    
    if (isRoof) {
      ctx.fillRect(0, pos + ribWidth * 0.6, size, ribWidth * 0.4)
    } else {
      ctx.fillRect(pos + ribWidth * 0.6, 0, ribWidth * 0.4, size)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  // Fewer repeats = larger visible ribs
  texture.repeat.set(isRoof ? 4 : 3, isRoof ? 8 : 6)
  
  return texture
}

export function MetalMaterial({ color, isRoof = false, ribSpacing = 0.5 }: MetalMaterialProps) {
  const texture = useMemo(() => {
    return createCorrugatedTexture(color, ribSpacing, isRoof)
  }, [color, ribSpacing, isRoof])

  return (
    <meshStandardMaterial
      map={texture}
      metalness={0.6}
      roughness={0.4}
      side={THREE.DoubleSide}
    />
  )
}

// Simple hook to get the texture for use in mesh materials
export function useCorrugatedTexture(color: string, isRoof: boolean = false) {
  return useMemo(() => {
    return createCorrugatedTexture(color, 0.5, isRoof)
  }, [color, isRoof])
}
