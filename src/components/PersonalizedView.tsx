// src/components/PersonalizedView.tsx
// Survive Atlas — Personalized Match with premium glass input panel & commute ranking

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  DollarSign,
  Sparkles,
  ArrowUpDown,
  Compass,
  Building2,
  SlidersHorizontal,
  GraduationCap,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';
import { db } from '../services/database';
import type { AreaExpenseBreakdown } from '../types/database.types';
import { calculateAreaScore, sortPersonalizedMode } from '../services/scoring';
import { searchAddress, type GeocodeResult } from '../services/geocoding';
import { calculateCommute } from '../services/routing';
import { AreaExpenseCard } from './AreaExpenseCard';
import { AreaCardSkeleton } from './AreaCardSkeleton';
import { formatCurrency } from '../utils/formatters';
import { convertCurrency } from '../services/currency';
import { SubmitFactModal } from './SubmitFactModal';
import { FeedbackModal } from './FeedbackModal';
import { discoverCityAreas } from '../services/bootstrap/area-discovery';
import { bootstrapPipeline } from '../services/bootstrap/worker-pool';
import { getOrRegisterGlobalCity } from '../services/city-search';

interface PersonalizedViewProps {
  onBackToBrowse: () => void;
}

export const PersonalizedView: React.FC<PersonalizedViewProps> = ({ onBackToBrowse }) => {
  const [salaryInput, setSalaryInput]               = useState<string>('4500000');
  const [workplaceQuery, setWorkplaceQuery]         = useState<string>('Pantai Indah Kapuk, Jakarta');
  const [selectedGeocode, setSelectedGeocode]       = useState<GeocodeResult | null>({
    lat: -6.1089, lng: 106.7412,
    displayName: 'Pantai Indah Kapuk (PIK), Penjaringan, Jakarta Utara, DKI Jakarta, Indonesia',
    city: 'Jakarta', country: 'Indonesia', countryCode: 'ID', currencyCode: 'IDR',
  });

  const [suggestions, setSuggestions]               = useState<GeocodeResult[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isSuggestionsOpen, setIsSuggestionsOpen]   = useState<boolean>(false);
  const workplaceContainerRef                        = useRef<HTMLDivElement>(null);
  const [isCalculating, setIsCalculating]           = useState<boolean>(false);
  const [rankedResults, setRankedResults]           = useState<AreaExpenseBreakdown[]>([]);
  const [hasCalculated, setHasCalculated]           = useState<boolean>(false);
  const [activeSubmitModalArea, setActiveSubmitModalArea] = useState<AreaExpenseBreakdown | null>(null);
  const resultsRef                                   = useRef<HTMLDivElement>(null);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackCityName, setFeedbackCityName]       = useState<string>('');
  const [feedbackArea, setFeedbackArea]               = useState<{ id?: string; name?: string } | null>(null);

  const debounceTimerRef = useRef<any>(null);

  // Dismiss suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workplaceContainerRef.current && !workplaceContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWorkplaceChange = (val: string) => {
    setWorkplaceQuery(val);
    setSelectedSuggestionIndex(-1);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchAddress(val);
          setSuggestions(results);
          setIsSuggestionsOpen(results.length > 0);
        } catch {
          setSuggestions([]);
          setIsSuggestionsOpen(false);
        }
      }, 350);
    } else {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
    }
  };

  const selectSuggestion = (item: GeocodeResult) => {
    setSelectedGeocode(item);
    setWorkplaceQuery(item.displayName);
    setSuggestions([]);
    setIsSuggestionsOpen(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleWorkplaceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) setIsSuggestionsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSuggestionsOpen(false);
    }
  };

  const getPresetAmount = React.useCallback((preset: 'student' | 'fresh_grad' | 'worker', curr: string): number => {
    if (curr === 'IDR') return preset === 'student' ? 2500000 : preset === 'fresh_grad' ? 5000000 : 10000000;
    if (curr === 'JPY') return preset === 'student' ? 80000  : preset === 'fresh_grad' ? 160000 : 300000;
    if (curr === 'USD') return preset === 'student' ? 500    : preset === 'fresh_grad' ? 1200 : 2500;
    if (curr === 'EUR') return preset === 'student' ? 450    : preset === 'fresh_grad' ? 1100 : 2200;
    if (curr === 'GBP') return preset === 'student' ? 400    : preset === 'fresh_grad' ? 1000 : 2000;
    if (curr === 'AUD') return preset === 'student' ? 700    : preset === 'fresh_grad' ? 1600 : 3200;
    if (curr === 'SGD') return preset === 'student' ? 650    : preset === 'fresh_grad' ? 1500 : 3000;
    return convertCurrency(preset === 'student' ? 500 : preset === 'fresh_grad' ? 1200 : 2500, 'USD', curr);
  }, []);

  const salaryInputRef = useRef(salaryInput);
  useEffect(() => { salaryInputRef.current = salaryInput; }, [salaryInput]);

  const prevCurrencyRef = useRef<string>('IDR');
  useEffect(() => {
    const newCurr = selectedGeocode?.currencyCode || 'IDR';
    if (prevCurrencyRef.current !== newCurr) {
      const currentNum = parseFloat(salaryInputRef.current.replace(/[^0-9.]/g, '')) || 0;
      if (currentNum > 0) {
        const converted = convertCurrency(currentNum, prevCurrencyRef.current, newCurr);
        setSalaryInput(String(Math.round(converted)));
      } else {
        setSalaryInput(String(getPresetAmount('fresh_grad', newCurr)));
      }
      prevCurrencyRef.current = newCurr;
    }
  }, [selectedGeocode?.currencyCode, getPresetAmount]);

  const handleRunCalculation = React.useCallback(async () => {
    setIsCalculating(true);
    setHasCalculated(false);
    try {
      const numSalary = parseFloat(salaryInput.replace(/[^0-9.]/g, '')) || 4500000;
      const cityList = await db.getCities();
      let matchedCity = cityList.find(
        (c) =>
          c.name.toLowerCase() === (selectedGeocode?.city || 'Jakarta').toLowerCase() ||
          (selectedGeocode?.displayName || '').toLowerCase().includes(c.name.toLowerCase())
      );
      if (!matchedCity && selectedGeocode) {
        const fallbackName = selectedGeocode.city || selectedGeocode.displayName.split(',')[0];
        matchedCity = getOrRegisterGlobalCity({
          id: `city-geo-${selectedGeocode.countryCode.toLowerCase()}-${fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: fallbackName, nameAscii: fallbackName,
          country: selectedGeocode.country, iso2: selectedGeocode.countryCode,
          lat: selectedGeocode.lat, lng: selectedGeocode.lng,
          currencyCode: selectedGeocode.currencyCode,
        });
      }
      if (!matchedCity) matchedCity = cityList[0];

      const country = db.countries.find((c) => c.id === matchedCity!.country_id) || db.countries[0];
      let areaBreakdowns = await db.getCityAreasWithExpenses(matchedCity.id);
      if (areaBreakdowns.length === 0 || areaBreakdowns.every((a) => a.total_monthly_cost === 0)) {
        const discovered = await discoverCityAreas(matchedCity, country);
        await bootstrapPipeline.bootstrapCity(matchedCity, country, discovered);
        areaBreakdowns = await db.getCityAreasWithExpenses(matchedCity.id);
      }

      const scoredAreas: AreaExpenseBreakdown[] = [];
      for (const item of areaBreakdowns) {
        const commuteSummary = await calculateCommute(
          selectedGeocode?.lat || -6.1089, selectedGeocode?.lng || 106.7412,
          item.area.id, item.area.lat, item.area.lng, true
        );
        const score = calculateAreaScore(item.total_monthly_cost, numSalary, commuteSummary.duration_min, item.confidence);
        scoredAreas.push({
          ...item,
          score,
          commute: {
            mode: commuteSummary.selected_mode,
            duration_min: commuteSummary.duration_min,
            distance_km: commuteSummary.distance_km,
            available_modes: commuteSummary.available_modes,
          },
        });
      }
      const sorted = sortPersonalizedMode(scoredAreas);
      setRankedResults(sorted);
      setHasCalculated(true);
      setTimeout(() => {
        if (resultsRef.current && typeof window !== 'undefined' && window.innerWidth <= 900) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } finally {
      setIsCalculating(false);
    }
  }, [salaryInput, selectedGeocode]);

  useEffect(() => {
    const timer = setTimeout(() => { handleRunCalculation(); }, 0);
    return () => clearTimeout(timer);
  }, [handleRunCalculation]);

  const currencyCode   = selectedGeocode?.currencyCode || 'IDR';
  const numericSalary  = parseFloat(salaryInput.replace(/[^0-9.]/g, '')) || 0;
  const studentPreset  = getPresetAmount('student',   currencyCode);
  const freshGradPreset = getPresetAmount('fresh_grad', currencyCode);
  const workerPreset   = getPresetAmount('worker',    currencyCode);

  return (
    <div className="personalized-view">
      {/* Header */}
      <div className="personalized-header" style={{ marginBottom: '2rem' }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          onClick={onBackToBrowse}
        >
          <ArrowLeft size={15} />
          Back to Browser
        </button>
        <h1 className="personalized-title">Personalized Match</h1>
        <p className="personalized-subtitle">
          Enter your workplace and monthly budget. We rank every neighborhood by affordability and commute time.
        </p>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '1.75rem', alignItems: 'start' }}>

        {/* Left — Config Panel */}
        <div className="input-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-secondary)' }}>
              <SlidersHorizontal size={19} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Relocation Profile</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Set your destination &amp; budget</div>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleRunCalculation(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Workplace Address */}
            <div className="input-group" ref={workplaceContainerRef} style={{ position: 'relative' }}>
              <label className="input-label" htmlFor="workplace-input">
                <MapPin size={12} />
                Campus or Office Address
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, marginLeft: 'auto' }}>Auto-geocoded</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="workplace-input"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Universitas Indonesia, PIK Jakarta, Monash…"
                  value={workplaceQuery}
                  onChange={(e) => handleWorkplaceChange(e.target.value)}
                  onKeyDown={handleWorkplaceKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setIsSuggestionsOpen(true); }}
                  style={{ paddingLeft: '2.5rem' }}
                  maxLength={200}
                  required
                />
                <Compass size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-primary)', pointerEvents: 'none' }} />
              </div>

              {/* Address suggestions */}
              {isSuggestionsOpen && suggestions.length > 0 && (
                <div className="address-suggestions-panel">
                  {suggestions.map((item, idx) => {
                    const isHighlighted = idx === selectedSuggestionIndex;
                    return (
                      <div
                        key={idx}
                        className={`address-suggestion-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => selectSuggestion(item)}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                      >
                        <MapPin size={14} className="address-suggestion-icon" />
                        <div>
                          <div className="address-suggestion-text">{item.displayName.split(',')[0]}</div>
                          <div className="address-suggestion-sub">{item.displayName.split(',').slice(1).join(',').trim()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monthly Budget */}
            <div className="input-group">
              <label className="input-label" htmlFor="salary-input">
                <DollarSign size={12} />
                Monthly Budget / Allowance
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'none', letterSpacing: 0 }}>
                  {formatCurrency(numericSalary, currencyCode)}/mo
                </span>
              </label>
              <div className="salary-input-wrapper">
                <span className="salary-currency-prefix">{currencyCode}</span>
                <input
                  id="salary-input"
                  type="number"
                  step="any"
                  className="input-field"
                  placeholder={currencyCode === 'IDR' ? '4500000' : '3000'}
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>

              {/* Budget presets */}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                {[
                  { label: 'Student', preset: studentPreset,   icon: <GraduationCap size={11} /> },
                  { label: 'Fresh Grad', preset: freshGradPreset, icon: <Briefcase size={11} /> },
                  { label: 'Worker', preset: workerPreset,     icon: <Building2 size={11} /> },
                ].map(({ label, preset, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSalaryInput(String(preset))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-full)',
                      border: `1px solid ${numericSalary === preset ? 'var(--brand-primary)' : 'var(--glass-border)'}`,
                      background: numericSalary === preset ? 'var(--brand-primary-light)' : 'var(--glass-bg)',
                      color: numericSalary === preset ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula info */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary-light)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.55rem' }}>
                <Sparkles size={12} />
                Multi-Factor Scoring
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  'Housing 50%',
                  'Commute 35%',
                  'Confidence 15%',
                ].map((chip) => (
                  <span key={chip} style={{ padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary calculate-btn"
              disabled={isCalculating}
            >
              <Sparkles size={16} />
              {isCalculating ? 'Routing & Scoring Neighborhoods…' : 'Calculate Best Matches'}
            </button>
          </form>
        </div>

        {/* Right — Results */}
        <div ref={resultsRef}>
          {/* Echo banner */}
          {hasCalculated && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
              padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(14px)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  <MapPin size={15} style={{ color: 'var(--brand-primary)' }} />
                  {selectedGeocode?.displayName.split(',')[0] || workplaceQuery}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>{rankedResults.length}</strong> neighborhoods · budget{' '}
                  <strong style={{ color: 'var(--brand-primary)' }}>{formatCurrency(numericSalary, currencyCode)}/mo</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <ArrowUpDown size={13} />
                Highest Match Score First
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {isCalculating ? (
            <div className="areas-results-list stagger-list">
              {[1, 2, 3, 4].map((i) => (
                <AreaCardSkeleton
                  key={`personalized-skeleton-${i}`}
                  rank={i}
                  statusText={i === 1 ? 'Routing commute & scoring…' : 'Calculating route…'}
                  isResearching={i === 1}
                />
              ))}
            </div>
          ) : rankedResults.length > 0 ? (
            <div className="areas-results-list stagger-list">
              {rankedResults.map((areaData, index) => (
                <AreaExpenseCard
                  key={areaData.area.id}
                  data={areaData}
                  rank={index + 1}
                  isPersonalized={true}
                  isTopRecommendation={index === 0}
                  salary={numericSalary}
                  onOpenSubmitFact={(area) => setActiveSubmitModalArea(area)}
                  onOpenFeedback={(area) => {
                    setFeedbackCityName(selectedGeocode?.city || '');
                    setFeedbackArea({ id: area.area.id, name: area.area.name });
                    setIsFeedbackModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state glass-card">
              <div className="empty-state-icon"><Building2 size={26} /></div>
              <p className="empty-state-title">No results found</p>
              <p className="empty-state-desc">
                Try adjusting your budget or entering a different destination address.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SubmitFactModal
        areaData={activeSubmitModalArea}
        isOpen={!!activeSubmitModalArea}
        onClose={() => setActiveSubmitModalArea(null)}
        onSubmitted={handleRunCalculation}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        initialCityName={feedbackCityName}
        initialAreaName={feedbackArea?.name}
        areaId={feedbackArea?.id}
      />
    </div>
  );
};

export default PersonalizedView;
