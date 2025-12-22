import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { Scene } from './components/three/Scene'

function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* 3D Viewport */}
        <main className="flex-1 relative bg-gradient-to-b from-sky-200 to-sky-400">
          <Scene />
        </main>
      </div>
    </div>
  )
}

export default App
