import { useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport, Grid, Sky, Text } from '@react-three/drei'
import { useStore } from '../../store/useStore'
import { Building } from './Building'
import { Ground } from './Ground'

// Camera controller component that responds to viewMode changes
function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const { ui, dimensions } = useStore()
  
  useEffect(() => {
    if (ui.viewMode === 'interior') {
      // Move camera inside the building
      camera.position.set(0, dimensions.eaveHeight * 0.6, 0)
      if (controlsRef.current) {
        controlsRef.current.target.set(0, dimensions.eaveHeight * 0.6, 10)
        controlsRef.current.update()
      }
    } else {
      // Move camera outside the building
      camera.position.set(60, 40, 60)
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 10, 0)
        controlsRef.current.update()
      }
    }
  }, [ui.viewMode, camera, dimensions.eaveHeight])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!ui.isDraggingDoor}
      minPolarAngle={0}
      maxPolarAngle={ui.viewMode === 'interior' ? Math.PI : Math.PI / 2.1}
      minDistance={ui.viewMode === 'interior' ? 1 : 20}
      maxDistance={ui.viewMode === 'interior' ? 50 : 200}
      target={ui.viewMode === 'interior' ? [0, 6, 10] : [0, 10, 0]}
    />
  )
}

export function Scene() {
  const { environment } = useStore()

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [60, 40, 60], fov: 50 }}
        shadows
      >
        {/* Lighting - Enhanced for realistic metal reflections */}
        <ambientLight intensity={0.4} />
        
        {/* Main Sun Light */}
        <directionalLight
          position={[80, 100, 50]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* Fill Light - softer from opposite side */}
        <directionalLight
          position={[-50, 30, -30]}
          intensity={0.3}
        />
        
        {/* Hemisphere Light - sky/ground color blend */}
        <hemisphereLight
          args={['#87CEEB', '#3d5c3d', 0.4]}
        />

        {/* Sky */}
        {environment.sky === 'day' && (
          <Sky 
            sunPosition={[100, 50, 100]} 
            turbidity={8}
            rayleigh={2}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
        )}
        {environment.sky === 'sunset' && (
          <Sky 
            sunPosition={[100, 5, 100]} 
            turbidity={10}
            rayleigh={3}
            mieCoefficient={0.1}
            mieDirectionalG={0.95}
          />
        )}
        {environment.sky === 'night' && (
          <color attach="background" args={['#0a0a1a']} />
        )}

        {/* Ground */}
        <Ground type={environment.ground} />

        {/* Grid */}
        {environment.showGrid && (
          <Grid
            args={[200, 200]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6e6e6e"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={100}
            fadeStrength={1}
            followCamera={false}
            position={[0, 0.01, 0]}
          />
        )}

        {/* Building */}
        <Building />

        {/* Compass Direction Labels */}
        {/* N = North = -Z, S = South = +Z, E = East = +X, W = West = -X */}
        <Text position={[0, 0.5, -60]} rotation={[-Math.PI / 2, 0, 0]} fontSize={8} color="black" anchorX="center" anchorY="middle">
          N
        </Text>
        <Text position={[0, 0.5, 60]} rotation={[-Math.PI / 2, 0, 0]} fontSize={8} color="black" anchorX="center" anchorY="middle">
          S
        </Text>
        <Text position={[60, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={8} color="black" anchorX="center" anchorY="middle">
          E
        </Text>
        <Text position={[-60, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={8} color="black" anchorX="center" anchorY="middle">
          W
        </Text>

        {/* Camera Controls */}
        <CameraController />

        {/* Gizmo Helper */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
      </Canvas>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full">
        Click & drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  )
}
