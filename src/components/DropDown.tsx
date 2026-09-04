import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropDownOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface DropDownProps<T> {
  options: DropDownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export function DropDown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
}: DropDownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="dropdown-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#0f2042] border border-blue-500/30 text-xs font-semibold text-slate-200 hover:border-blue-400/60 hover:bg-[#132752] transition-all shadow-sm ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          {selectedOption?.badge && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1 rounded border border-amber-500/30">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-max min-w-full z-50 rounded-xl bg-[#0d1c3c] border border-blue-500/40 shadow-2xl overflow-hidden py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600/30 text-sky-300 font-bold border-l-2 border-sky-400'
                      : 'text-slate-300 hover:bg-blue-900/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                  {option.badge && (
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full border border-blue-500/30">
                      {option.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
