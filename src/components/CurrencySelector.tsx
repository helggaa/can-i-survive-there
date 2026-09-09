// src/components/CurrencySelector.tsx
// Clean, friendly currency switcher dropdown for global cost comparison

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="currency-selector-container" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="currency-selector-btn"
        title="Switch display currency"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe size={15} className="currency-globe-icon" />
        <span className="currency-code-label">
          {activeConfig.code === 'LOCAL' ? 'Native' : activeConfig.code}
        </span>
        <span className="currency-symbol-label">
          ({activeConfig.symbol})
        </span>
        <ChevronDown
          size={14}
          className={`currency-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="currency-dropdown-panel" role="listbox">
          <div className="currency-dropdown-header">
            Display Currency
          </div>
          <div className="currency-dropdown-list">
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
                  className={`currency-option-item ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="currency-option-info">
                    <span className="currency-option-flag">{curr.flag}</span>
                    <div className="currency-option-details">
                      <div className="currency-option-primary">
                        <strong>{curr.code}</strong>
                        <span className="currency-option-symbol">({curr.symbol})</span>
                      </div>
                      <div className="currency-option-name" title={curr.name}>
                        {curr.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="currency-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;

