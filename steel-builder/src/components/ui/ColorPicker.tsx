const COLORS = [
  { name: 'Polar White', value: '#f5f5f5' },
  { name: 'Bone White', value: '#e8e4d9' },
  { name: 'Light Stone', value: '#c9b99a' },
  { name: 'Tan', value: '#c4a77d' },
  { name: 'Clay', value: '#8b7355' },
  { name: 'Brown', value: '#5c4033' },
  { name: 'Burnished Slate', value: '#4a4a4a' },
  { name: 'Charcoal', value: '#36454f' },
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Galvalume', value: '#a8a9ad' },
  { name: 'Ash Gray', value: '#b2beb5' },
  { name: 'Light Gray', value: '#d3d3d3' },
  { name: 'Classic Green', value: '#2d4a3d' },
  { name: 'Forest Green', value: '#228b22' },
  { name: 'Ocean Blue', value: '#1e3a5f' },
  { name: 'Hawaiian Blue', value: '#00bfff' },
  { name: 'Barn Red', value: '#7c0a02' },
  { name: 'Rustic Red', value: '#8b2500' },
  { name: 'Burgundy', value: '#722f37' },
  { name: 'Gallery Blue', value: '#4169e1' },
]

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div 
          className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="grid grid-cols-10 gap-1">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className={`w-6 h-6 rounded transition-transform hover:scale-110 ${
              value === color.value
                ? 'ring-2 ring-primary ring-offset-1'
                : 'border border-gray-300'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  )
}
