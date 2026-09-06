// src/components/CurrencySelector.tsx
// Sleek glassmorphic currency switcher dropdown for global cost comparison

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export const CurrencySelector: React.FC = () => {
  const { targetCurrency, setTargetCurrency, availableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeConfig = availableCurrencies.find((c) => c.code === targetCurrency) || availableCurrencies[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 transition shadow-sm backdrop-blur-md cursor-pointer"
        title="Switch display currency"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-cyan-300">
          {activeConfig.code === 'LOCAL' ? 'Native' : activeConfig.code}
        </span>
        <span className="text-gray-400">({activeConfig.symbol})</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-xl z-50 py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-white/10">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Display Currency
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {availableCurrencies.map((curr) => {
              const isSelected = curr.code === targetCurrency;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    setTargetCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 transition cursor-pointer ${
                    isSelected ? 'text-cyan-400 bg-cyan-500/10 font-medium' : 'text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{curr.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{curr.code}</span>
                        <span className="text-[11px] text-gray-400">({curr.symbol})</span>
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[130px]">
                        {curr.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
