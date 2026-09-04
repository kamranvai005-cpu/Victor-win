import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { Currency } from '../types';
import { getWinGoPaginatedHistory } from '../utils/gameSync';
import { sound } from '../utils/audio';

interface WinGoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  durationSeconds: number;
  currency: Currency;
}

export function WinGoHistoryModal({
  isOpen,
  onClose,
  durationSeconds,
}: WinGoHistoryModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!isOpen) return null;

  const { results, totalPages, totalCount } = getWinGoPaginatedHistory(
    durationSeconds,
    currentPage,
    pageSize
  );

  const getBallClass = (num: number, color?: string) => {
    if (color === 'red-violet' || num === 0) {
      return 'bg-gradient-to-br from-red-600 to-purple-600 text-white';
    }
    if (color === 'green-violet' || num === 5) {
      return 'bg-gradient-to-br from-emerald-600 to-purple-600 text-white';
    }
    if ([1, 3, 7, 9].includes(num)) {
      return 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white';
    }
    return 'bg-gradient-to-br from-red-500 to-red-700 text-white';
  };

  const getDurationLabel = (sec: number) => {
    if (sec === 30) return 'Win Go 30 Sec';
    if (sec === 60) return 'Win Go 1 Min';
    if (sec === 180) return 'Win Go 3 Min';
    if (sec === 300) return 'Win Go 5 Min';
    if (sec === 600) return 'Win Go 10 Min';
    return `Win Go ${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-[#091533] border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900/60 flex items-center justify-between bg-[#060e22]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>লটারি ড্র ফলাফল বিস্তারিত</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                  {getDurationLabel(durationSeconds)}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                গত {totalCount}টি ড্র ফলাফল রেকর্ড (পৃষ্ঠা {currentPage}/{totalPages})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-blue-900/30 space-y-1">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-blue-900/40 text-[11px] uppercase">
                  <th className="py-2.5 px-3 font-semibold">পিরিয়ড (Period)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">সংখ্যা (Number)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">সাইজ (Size)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">কালার (Color)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">সময় (Time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {results.map((row) => (
                  <tr key={row.period} className="hover:bg-blue-950/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                      {row.period}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex w-6 h-6 rounded-full items-center justify-center font-bold text-xs font-mono shadow-sm ${getBallClass(
                          row.number,
                          row.color
                        )}`}
                      >
                        {row.number}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          row.size === 'big'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {row.size === 'big' ? 'বিগ' : 'স্মল'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.color === 'green' && (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" title="সবুজ" />
                        )}
                        {row.color === 'red' && (
                          <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm" title="লাল" />
                        )}
                        {row.color === 'green-violet' && (
                          <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 shadow-sm" title="সবুজ + বেগুনী" />
                        )}
                        {row.color === 'red-violet' && (
                          <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-500 to-purple-500 shadow-sm" title="লাল + বেগুনী" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Pagination Footer */}
        <div className="p-3 sm:p-4 border-t border-blue-900/60 bg-[#060e22] flex items-center justify-between">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              sound.playClick();
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#091533] border border-blue-500/30 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>পূর্ববর্তী</span>
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCurrentPage(pageNum);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#091533] text-slate-400 hover:text-white border border-blue-900/50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => {
              sound.playClick();
              setCurrentPage((p) => Math.min(totalPages, p + 1));
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#091533] border border-blue-500/30 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <span>পরবর্তী</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
