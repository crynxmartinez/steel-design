export function Header() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      {/* Logo */}
      <div className="flex items-center">
        <img 
          src="https://storagematerials.com/wp-content/uploads/2024/08/storagematerials-logo.webp" 
          alt="Storage Materials" 
          className="h-10 object-contain"
        />
      </div>
      
      {/* Title */}
      <div className="text-center">
        <h1 className="text-lg font-bold text-gray-800">
          3D Steel Building Designer
        </h1>
      </div>
      
      {/* Right side - could add user menu later */}
      <div className="w-32">
        <a 
          href="https://storagematerials.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          StorageMaterials.com
        </a>
      </div>
    </header>
  )
}
