import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* 3D Gold & Sapphire Crest Badge */}
      <div
        className={`${iconSizes[size]} shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-[2px] shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center`}
      >
        <div className="w-full h-full bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#050c20] rounded-[14px] flex items-center justify-center border border-amber-400/40 relative overflow-hidden">
          {/* Subtle shine layer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />
          <span className="font-black font-mono tracking-tighter bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-sm select-none">
            VW
          </span>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1">
            <span className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-display uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              VICTOR WIN
            </span>
            <span className="px-1.5 py-0.2 text-[8px] font-black rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-tight">
              PRO
            </span>
          </div>
          <span className="text-[9px] text-sky-400 font-bold uppercase tracking-widest mt-0.5">
            Official Gaming Hub
          </span>
        </div>
      )}
    </div>
  );
}
