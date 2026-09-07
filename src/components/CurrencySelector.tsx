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
    <div style={{ position: 'relative', display: 'inline-block' }} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.95rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-alt)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          boxShadow: 'var(--shadow-xs)'
        }}
        title="Switch display currency"
      >
        <Globe size={15} style={{ color: 'var(--brand-primary)' }} />
        <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
          {activeConfig.code === 'LOCAL' ? 'Native' : activeConfig.code}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          ({activeConfig.symbol})
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'none'
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '240px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 90,
            padding: '0.4rem',
            animation: 'fadeInCard 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Display Currency
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.25rem 0' }}>
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
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isSelected ? 'var(--brand-primary-light)' : 'transparent',
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1rem' }}>{curr.flag}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontWeight: 700 }}>{curr.code}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({curr.symbol})</span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {curr.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={14} style={{ color: 'var(--brand-primary)' }} />}
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
