import { GroundType } from '../../store/useStore'

interface GroundProps {
  type: GroundType
}

export function Ground({ type }: GroundProps) {
  const getColor = () => {
    switch (type) {
      case 'grass': return '#4a7c4e'
      case 'concrete': return '#9ca3af'
      case 'gravel': return '#78716c'
      default: return '#4a7c4e'
    }
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color={getColor()} />
    </mesh>
  )
}
