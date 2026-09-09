// src/components/PersonalizedView.tsx
// Personalized Mode Screen with Commute Algorithm & Multi-factor Ranking per UI/UX Pro Max

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  DollarSign,
  Sparkles,
  ArrowUpDown,
  Compass,
  Building2,
  SlidersHorizontal,
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
  const [salaryInput, setSalaryInput] = useState<string>('4500000');
  const [workplaceQuery, setWorkplaceQuery] = useState<string>('Pantai Indah Kapuk, Jakarta');
  const [selectedGeocode, setSelectedGeocode] = useState<GeocodeResult | null>({
    lat: -6.1089,
    lng: 106.7412,
    displayName: 'Pantai Indah Kapuk (PIK), Penjaringan, Jakarta Utara, DKI Jakarta, Indonesia',
    city: 'Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    currencyCode: 'IDR',
  });

  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);
  const workplaceContainerRef = useRef<HTMLDivElement>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [rankedResults, setRankedResults] = useState<AreaExpenseBreakdown[]>([]);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [activeSubmitModalArea, setActiveSubmitModalArea] = useState<AreaExpenseBreakdown | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackCityName, setFeedbackCityName] = useState<string>('');
  const [feedbackArea, setFeedbackArea] = useState<{ id?: string; name?: string } | null>(null);

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
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

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
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsSuggestionsOpen(true);
      }
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

  // Dynamic currency-aware presets
  const getPresetAmount = React.useCallback((preset: 'student' | 'fresh_grad' | 'worker', curr: string): number => {
    if (curr === 'IDR') {
      return preset === 'student' ? 2500000 : preset === 'fresh_grad' ? 5000000 : 10000000;
    }
    if (curr === 'JPY') {
      return preset === 'student' ? 80000 : preset === 'fresh_grad' ? 160000 : 300000;
    }
    if (curr === 'USD') {
      return preset === 'student' ? 500 : preset === 'fresh_grad' ? 1200 : 2500;
    }
    if (curr === 'EUR') {
      return preset === 'student' ? 450 : preset === 'fresh_grad' ? 1100 : 2200;
    }
    if (curr === 'GBP') {
      return preset === 'student' ? 400 : preset === 'fresh_grad' ? 1000 : 2000;
    }
    if (curr === 'AUD') {
      return preset === 'student' ? 700 : preset === 'fresh_grad' ? 1600 : 3200;
    }
    if (curr === 'SGD') {
      return preset === 'student' ? 650 : preset === 'fresh_grad' ? 1500 : 3000;
    }
    const baseUsd = preset === 'student' ? 500 : preset === 'fresh_grad' ? 1200 : 2500;
    return convertCurrency(baseUsd, 'USD', curr);
  }, []);

  const salaryInputRef = useRef(salaryInput);
  useEffect(() => {
    salaryInputRef.current = salaryInput;
  }, [salaryInput]);

  // When selected geocode currency changes, calibrate salary input or convert smoothly
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

      // If not in database, dynamically register it
      if (!matchedCity && selectedGeocode) {
        const fallbackName = selectedGeocode.city || selectedGeocode.displayName.split(',')[0];
        matchedCity = getOrRegisterGlobalCity({
          id: `city-geo-${selectedGeocode.countryCode.toLowerCase()}-${fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: fallbackName,
          nameAscii: fallbackName,
          country: selectedGeocode.country,
          iso2: selectedGeocode.countryCode,
          lat: selectedGeocode.lat,
          lng: selectedGeocode.lng,
          currencyCode: selectedGeocode.currencyCode,
        });
      }

      if (!matchedCity) {
        matchedCity = cityList[0];
      }

      // Ensure areas exist
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
          selectedGeocode?.lat || -6.1089,
          selectedGeocode?.lng || 106.7412,
          item.area.id,
          item.area.lat,
          item.area.lng,
          true
        );

        const score = calculateAreaScore(
          item.total_monthly_cost,
          numSalary,
          commuteSummary.duration_min,
          item.confidence
        );

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

      // On mobile / tablet screens, smoothly scroll to results once computed
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
    const timer = setTimeout(() => {
      handleRunCalculation();
    }, 0);
    return () => clearTimeout(timer);
  }, [handleRunCalculation]);

  const currencyCode = selectedGeocode?.currencyCode || 'IDR';
  const numericSalary = parseFloat(salaryInput.replace(/[^0-9.]/g, '')) || 0;

  return (
    <div className="personalized-view">
      {/* Header */}
      <div className="personalized-header-section">
        <h1 className="personalized-title">
          Personalized Match &amp; Commute Ranking
        </h1>
        <p className="personalized-subtitle">
          Calculates neighborhood affordability, commute durations, and ranked suitability tailored to your office.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="personalized-grid-layout">
        {/* Left Column: Configuration Controls Panel */}
        <div className="personalized-config-card">
          <div className="config-card-header">
            <div className="config-header-icon">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h2 className="config-header-title">Relocation Profile</h2>
              <div className="config-header-subtitle">
                Configure your destination campus or office & monthly budget
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunCalculation();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Workplace Address Field */}
            <div className="form-field-group" style={{ position: 'relative' }} ref={workplaceContainerRef}>
              <label className="form-field-label" htmlFor="workplace-input">
                <span>Destination Campus or Office</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-geocoded</span>
              </label>
              <div className="search-input-box">
                <MapPin size={17} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <input
                  id="workplace-input"
                  type="text"
                  placeholder="e.g. Universitas Indonesia, PIK Jakarta, NUS Singapore, Monash..."
                  value={workplaceQuery}
                  onChange={(e) => handleWorkplaceChange(e.target.value)}
                  onKeyDown={handleWorkplaceKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setIsSuggestionsOpen(true);
                  }}
                  maxLength={200}
                  required
                />
              </div>

              {/* Suggestions Dropdown */}
              {isSuggestionsOpen && suggestions.length > 0 && (
                <div className="search-dropdown-menu" style={{ width: '100%' }}>
                  {suggestions.map((item, idx) => {
                    const isHighlighted = idx === selectedSuggestionIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(item)}
                        className={`search-suggestion-item ${isHighlighted ? 'selected' : ''}`}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Compass size={14} style={{ color: 'var(--brand-primary)' }} />
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                            {item.displayName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Net Monthly Salary / Budget Field */}
            <div className="form-field-group">
              <label className="form-field-label" htmlFor="salary-input">
                <span>Monthly Living Budget / Allowance</span>
                <span className="field-value-badge">
                  {formatCurrency(numericSalary, currencyCode)}/mo
                </span>
              </label>
              <div className="search-input-box">
                <DollarSign size={17} style={{ color: 'var(--brand-secondary)', flexShrink: 0 }} />
                <input
                  id="salary-input"
                  type="number"
                  step="any"
                  placeholder={`e.g. ${currencyCode === 'IDR' ? '4500000' : '3000'}`}
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>

              {/* Quick Persona Budget Presets */}
              <div style={{ marginTop: '0.65rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Quick relocation presets:
                </div>
                <div className="preset-pills-row">
                  {(() => {
                    const studentPreset = getPresetAmount('student', currencyCode);
                    const freshGradPreset = getPresetAmount('fresh_grad', currencyCode);
                    const workerPreset = getPresetAmount('worker', currencyCode);
                    return (
                      <>
                        <button
                          type="button"
                          className={`preset-pill-btn ${numericSalary === studentPreset ? 'active' : ''}`}
                          onClick={() => setSalaryInput(String(studentPreset))}
                        >
                          🎓 Student ({formatCurrency(studentPreset, currencyCode)})
                        </button>
                        <button
                          type="button"
                          className={`preset-pill-btn ${numericSalary === freshGradPreset ? 'active' : ''}`}
                          onClick={() => setSalaryInput(String(freshGradPreset))}
                        >
                          💼 Fresh Grad ({formatCurrency(freshGradPreset, currencyCode)})
                        </button>
                        <button
                          type="button"
                          className={`preset-pill-btn ${numericSalary === workerPreset ? 'active' : ''}`}
                          onClick={() => setSalaryInput(String(workerPreset))}
                        >
                          🏢 Worker ({formatCurrency(workerPreset, currencyCode)})
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Multi-factor formula info card */}
            <div className="formula-info-card">
              <div className="formula-info-title">
                <Sparkles size={13} style={{ color: 'var(--brand-primary)' }} />
                <span>Multi-Factor Recommendation Weighting</span>
              </div>
              <div className="formula-chips-row">
                <span className="formula-chip">🏡 Housing Cost 50%</span>
                <span className="formula-chip">⏱️ Commute Time 35%</span>
                <span className="formula-chip">📊 Data Confidence 15%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.25rem' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isCalculating}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
              >
                <Sparkles size={16} />
                <span>{isCalculating ? 'Routing & Scoring Neighborhoods…' : 'Calculate Best Matches'}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={onBackToBrowse}
                style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }}
              >
                ← Back to City Explorer
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Ranked Recommendations List */}
        <div className="personalized-results-panel" ref={resultsRef}>
          {/* Query Echo Status Banner */}
          {hasCalculated && (
            <div className="personalized-echo-banner">
              <div className="echo-main-info">
                <div className="echo-destination-title">
                  <MapPin size={18} className="echo-pin-icon" />
                  <span>Destination: {selectedGeocode?.displayName.split(',')[0] || workplaceQuery}</span>
                </div>
                <div className="echo-details">
                  Showing <strong>{rankedResults.length} scored neighborhoods</strong> matching your budget of <strong className="echo-budget-highlight">{formatCurrency(numericSalary, currencyCode)}/mo</strong>
                </div>
              </div>

              <div className="echo-meta-badge">
                <ArrowUpDown size={14} />
                <span>Highest Match Score First</span>
              </div>
            </div>
          )}

          {/* Progressive Skeleton Loader or Ranked Cards */}
          {isCalculating ? (
            <div className="area-cards-list">
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
            <div className="area-cards-list">
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
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
              <Building2 size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                No ranked neighborhoods found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: 420, margin: '0 auto' }}>
                Try adjusting your monthly budget or entering a different destination campus/office address.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fact Submission Modal */}
      <SubmitFactModal
        areaData={activeSubmitModalArea}
        isOpen={!!activeSubmitModalArea}
        onClose={() => setActiveSubmitModalArea(null)}
        onSubmitted={handleRunCalculation}
      />

      {/* Community Feedback & Research Request Modal */}
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
