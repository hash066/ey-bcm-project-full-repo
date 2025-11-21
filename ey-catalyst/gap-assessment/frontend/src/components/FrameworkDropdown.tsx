import { Framework } from '../types';
import { ChevronDown, Upload, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface FrameworkDropdownProps {
  frameworks: Framework[];
  value: string;
  onChange: (value: string) => void;
  onUploadNew: () => void;
}

export default function FrameworkDropdown({
  frameworks,
  value,
  onChange,
  onUploadNew
}: FrameworkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ['Standards', 'Acts of Parliament', 'Regulations'];
  const groupedFrameworks = categories.reduce((acc, category) => {
    acc[category] = frameworks.filter(f => f.category === category);
    return acc;
  }, {} as Record<string, Framework[]>);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (frameworkCode: string) => {
    onChange(frameworkCode);
    setIsOpen(false);
  };

  const getSelectedName = () => {
    if (!value) return 'All Frameworks';
    const framework = frameworks.find(f => f.code === value);
    return framework ? framework.name : 'All Frameworks';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 flex items-center justify-between"
      >
        <span className="truncate">{getSelectedName()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {/* All Frameworks option */}
          <button
            onClick={() => handleSelect('')}
            className="w-full px-4 py-3 text-left text-white hover:bg-zinc-800 transition-colors flex items-center"
          >
            All Frameworks
          </button>

          {/* Grouped categories */}
          {categories.map(category => (
            groupedFrameworks[category].length > 0 && (
              <div key={category}>
                <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-700">
                  <span className="text-yellow-400 text-sm font-semibold">{category}</span>
                </div>
                {groupedFrameworks[category].map(framework => (
                  <button
                    key={framework.id}
                    onClick={() => handleSelect(framework.code)}
                    className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-medium">{framework.code}</div>
                      <div className="text-xs text-zinc-500">{framework.name}</div>
                    </div>
                    {value === framework.code && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )
          ))}

          {/* Upload New Framework option */}
          <div className="border-t border-zinc-700">
            <button
              onClick={() => {
                setIsOpen(false);
                onUploadNew();
              }}
              className="w-full px-4 py-3 text-left text-yellow-400 hover:bg-yellow-950/30 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload New Framework
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
