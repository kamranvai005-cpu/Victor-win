import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone, X } from 'lucide-react';

export interface CountryCode {
  name: string;
  code: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryCode[] = [
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩', placeholder: '1XXXXXXXXX' },
  { name: 'India', code: '+91', flag: '🇮🇳', placeholder: '98XXXXXXXX' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰', placeholder: '3XXXXXXXXX' },
  { name: 'UAE', code: '+971', flag: '🇦🇪', placeholder: '5XXXXXXXX' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', placeholder: '7XXXXXXXXX' },
  { name: 'United States', code: '+1', flag: '🇺🇸', placeholder: '202XXXXXXX' },
];

interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  disabled?: boolean;
  error?: string;
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  disabled = false,
  error,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

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
    <div className="w-full">
      <div
        className={`flex items-center rounded-xl bg-[#09152e] border transition-all duration-200 ${
          error
            ? 'border-red-500/70 ring-1 ring-red-500/40'
            : 'border-blue-500/30 hover:border-blue-400/50 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {/* Country Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id="phone-country-code-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3.5 py-3 border-r border-blue-500/20 text-slate-200 text-sm font-semibold hover:bg-blue-900/20 rounded-l-xl transition-colors"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sky-300 font-mono">{selectedCountry.code}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 z-50 rounded-xl bg-[#0d1c3c] border border-blue-500/40 shadow-2xl overflow-hidden py-1 backdrop-blur-md">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-blue-500/20">
                Select Country Code
              </div>
              <div className="max-h-52 overflow-y-auto">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onCountryCodeChange(c.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                      c.code === countryCode
                        ? 'bg-blue-600/30 text-sky-300 font-bold border-l-2 border-sky-400'
                        : 'text-slate-300 hover:bg-blue-900/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input Box */}
        <div className="relative flex-1 flex items-center">
          <Phone className="w-4 h-4 text-blue-400/60 absolute left-3 pointer-events-none" />
          <input
            type="tel"
            id="phone-number-input"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={selectedCountry.placeholder}
            className="w-full bg-transparent pl-9 pr-8 py-3 text-sm font-medium text-white placeholder-slate-500 focus:outline-none font-mono"
            maxLength={13}
            disabled={disabled}
          />
          {phone && (
            <button
              type="button"
              onClick={() => onPhoneChange('')}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-700/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
}
