import { ReactNode } from 'react';
import {
  Compass,
  Search,
} from 'lucide-react';
import { GameCategory } from '../types';
import { sound } from '../utils/audio';
import { VENDOR_LOGOS } from '../data/mockData';

interface CategoryNavProps {
  activeCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

export function CategoryNav({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedProvider,
  onProviderChange,
}: CategoryNavProps) {
  const categories: {
    id: GameCategory;
    nameBn: string;
    nameEn: string;
    iconUrl?: string;
    fallbackIcon?: ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'popular',
      nameBn: 'জনপ্রিয়',
      nameEn: 'Popular',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010810ntvi.png',
      badge: 'HOT',
    },
    {
      id: 'lottery',
      nameBn: 'লটারি',
      nameEn: 'Lottery',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010843wkhh.png',
      badge: '9.8X',
    },
    {
      id: 'mini',
      nameBn: 'মিনি গেম',
      nameEn: 'Mini games',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_202307250108157skt.png',
      badge: 'FLASH',
    },
    {
      id: 'slots',
      nameBn: 'স্লটস',
      nameEn: 'Slots',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010848q8ha.png',
    },
    {
      id: 'fishing',
      nameBn: 'ফিশিং',
      nameEn: 'Fishing',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010820sb5g.png',
    },
    {
      id: 'sports',
      nameBn: 'স্পোর্টস',
      nameEn: 'Sports',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_202307250108379rl2.png',
      badge: 'LIVE',
    },
    {
      id: 'casino',
      nameBn: 'ক্যাসিনো',
      nameEn: 'Casino',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010831r9qo.png',
    },
    {
      id: 'rummy',
      nameBn: 'পিভিসি / কার্ড',
      nameEn: 'PVC',
      iconUrl: 'https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010826wr4i.png',
    },
    {
      id: 'all',
      nameBn: 'সব গেম',
      nameEn: 'All Games',
      fallbackIcon: <Compass className="w-5 h-5 text-sky-400" />,
    },
  ];

  return (
    <div className="w-full space-y-2.5">
      {/* Category Tabs Ribbon with horizontal scroll */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              id={`cat-nav-btn-${cat.id}`}
              onClick={() => {
                sound.playClick();
                onSelectCategory(cat.id);
              }}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 border border-yellow-300 scale-102'
                  : 'bg-[#091533] text-slate-200 hover:text-white hover:bg-[#0e214d] border border-blue-500/20'
              }`}
            >
              {cat.iconUrl ? (
                <img
                  src={cat.iconUrl}
                  alt={cat.nameEn}
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 drop-shadow"
                  referrerPolicy="no-referrer"
                />
              ) : (
                cat.fallbackIcon
              )}

              <div className="flex flex-col text-left leading-tight">
                <span className={`text-[11px] sm:text-xs font-black ${isActive ? 'text-slate-950' : 'text-white'}`}>
                  {cat.nameBn}
                </span>
                <span className={`text-[9px] font-medium ${isActive ? 'text-slate-900/80' : 'text-slate-400'}`}>
                  {cat.nameEn}
                </span>
              </div>

              {cat.badge && (
                <span
                  className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-0.5 ${
                    isActive
                      ? 'bg-slate-950 text-amber-300 shadow'
                      : 'bg-rose-500 text-white animate-pulse'
                  }`}
                >
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Provider Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-0.5">
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="games-search-bar"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="গেম খুঁজুন (Search games)..."
            className="w-full bg-[#091533] border border-blue-500/30 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {/* Official Provider Logos quick filters */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onProviderChange('');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
              !selectedProvider
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'bg-[#091533] text-slate-300 border border-blue-500/20 hover:text-white'
            }`}
          >
            All Providers
          </button>

          {VENDOR_LOGOS.map((v) => {
            const isSelected = selectedProvider === v.code || selectedProvider === v.name;
            return (
              <button
                key={v.id}
                type="button"
                id={`provider-btn-${v.code.toLowerCase()}`}
                onClick={() => {
                  sound.playClick();
                  onProviderChange(isSelected ? '' : v.code);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                    : 'bg-[#091533] text-slate-300 border border-blue-500/20 hover:text-white hover:border-amber-500/40'
                }`}
              >
                <img
                  src={v.img}
                  alt={v.name}
                  className="h-4 sm:h-5 w-auto object-contain shrink-0 rounded"
                  referrerPolicy="no-referrer"
                />
                <span>{v.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
