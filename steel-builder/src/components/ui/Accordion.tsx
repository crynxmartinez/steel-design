import { ChevronDown } from 'lucide-react'
import { ReactNode } from 'react'

interface AccordionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: ReactNode
}

export function Accordion({ title, isExpanded, onToggle, children }: AccordionProps) {
  return (
    <div className="border-b border-dark-200">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          isExpanded ? 'bg-dark-300' : 'bg-dark-400 hover:bg-dark-300'
        }`}
      >
        <span className="text-sm font-semibold text-white tracking-wide">{title}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-[1000px]' : 'max-h-0'
        }`}
      >
        <div className="bg-gray-100 p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
