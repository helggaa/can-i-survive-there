// src/components/PersonalizedView.tsx
// Personalized Mode Screen per 03-ux-screens.md (Sections 3, 4, 5) with Global City Bootstrap Support

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  DollarSign,
  Sparkles,
  ArrowUpDown,
  Compass,
  Building2,
} from 'lucide-react';
import { db } from '../services/database';
import type { AreaExpenseBreakdown } from '../types/database.types';
import { calculateAreaScore, sortPersonalizedMode } from '../services/scoring';
import { searchAddress, type GeocodeResult } from '../services/geocoding';
import { calculateCommute } from '../services/routing';
import { AreaExpenseCard } from './AreaExpenseCard';
import { formatCurrency } from '../utils/formatters';
import { SubmitFactModal } from './SubmitFactModal';
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
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [rankedResults, setRankedResults] = useState<AreaExpenseBreakdown[]>([]);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [activeSubmitModalArea, setActiveSubmitModalArea] = useState<AreaExpenseBreakdown | null>(null);

  const debounceTimerRef = useRef<any>(null);

  const handleWorkplaceChange = (val: string) => {
    setWorkplaceQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchAddress(val);
          setSuggestions(results);
        } catch {
          setSuggestions([]);
        }
      }, 350);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: GeocodeResult) => {
    setSelectedGeocode(item);
    setWorkplaceQuery(item.displayName);
    setSuggestions([]);
  };

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
        matchedCity = getOrRegisterGlobalCity({
          id: `city-geo-${selectedGeocode.countryCode.toLowerCase()}-${(selectedGeocode.city || 'city').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: selectedGeocode.city || workplaceQuery.split(',')[0],
          nameAscii: selectedGeocode.city || workplaceQuery.split(',')[0],
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
    } finally {
      setIsCalculating(false);
    }
  }, [salaryInput, selectedGeocode, workplaceQuery]);

  useEffect(() => {
    handleRunCalculation();
  }, [handleRunCalculation]);

  const currencyCode = selectedGeocode?.currencyCode || 'IDR';
  const numericSalary = parseFloat(salaryInput.replace(/[^0-9.]/g, '')) || 0;

  return (
    <div className="personalized-view">
      {/* Header */}
      <div className="browse-header">
        <div className="browse-title-row">
          <div>
            <h1 className="section-title">Personalized Match & Commute Ranking</h1>
            <p className="section-subtitle">
              Calculates exact neighborhood affordability and commute times near your workplace anywhere globally.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="controls-bar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunCalculation();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Workplace Address Field with Auto-complete */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="workplace-input">
                  Workplace Address / Neighborhood
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} className="input-icon-left" />
                  <input
                    id="workplace-input"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. Pantai Indah Kapuk, Jakarta"
                    value={workplaceQuery}
                    onChange={(e) => handleWorkplaceChange(e.target.value)}
                    required
                  />
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 30,
                      marginTop: 4,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {suggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(item)}
                        style={{
                          padding: '0.65rem 1rem',
                          fontSize: '0.8125rem',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Compass size={14} color="var(--accent-secondary)" />
                        <span style={{ color: 'var(--text-primary)' }}>{item.displayName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Net Monthly Salary Field */}
              <div className="form-group">
                <label className="form-label" htmlFor="salary-input">
                  Monthly Net Salary ({currencyCode})
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} className="input-icon-left" />
                  <input
                    id="salary-input"
                    type="number"
                    step="any"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder={`e.g. ${currencyCode === 'IDR' ? '4500000' : '3000'}`}
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                *Formula weights: Affordability 50% · Commute 35% · Confidence 15%
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={onBackToBrowse}>
                  Switch to Browse Mode
                </button>
                <button type="submit" className="btn-primary" disabled={isCalculating}>
                  <Sparkles size={15} />
                  <span>{isCalculating ? 'Calculating Routes...' : 'Calculate Best Matches'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Query Echo Banner */}
      {hasCalculated && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-white)' }}>
              Near <span style={{ color: 'var(--accent-secondary)' }}>{selectedGeocode?.displayName.split(',')[0] || workplaceQuery}</span> · Budget <span style={{ color: 'var(--accent-primary)' }}>{formatCurrency(numericSalary, currencyCode)}/mo</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Showing {rankedResults.length} neighborhoods ranked by affordability & commute time
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <ArrowUpDown size={14} />
            <span>Score (Best Match First)</span>
          </div>
        </div>
      )}

      {/* Progressive Skeleton Loader or Ranked Cards */}
      {isCalculating ? (
        <div className="area-cards-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="area-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                  <div>
                    <div className="skeleton" style={{ width: 160, height: 22, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: 100, height: 14 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 120, height: 26 }} />
                  <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rankedResults.length > 0 ? (
        <div className="area-cards-list">
          {rankedResults.map((areaData, index) => (
            <div key={areaData.area.id} style={{ position: 'relative' }}>
              {index === 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.85rem',
                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    color: '#041017',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    borderRadius: '6px 6px 0 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Best Match</span>
                </div>
              )}
              <AreaExpenseCard
                data={areaData}
                rank={index + 1}
                isPersonalized={true}
                salary={numericSalary}
                onOpenSubmitFact={(area) => setActiveSubmitModalArea(area)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <Building2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No ranked areas found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
            Try entering a different workplace address or adjusting your budget.
          </p>
        </div>
      )}

      {/* Fact Submission Modal */}
      <SubmitFactModal
        areaData={activeSubmitModalArea}
        isOpen={!!activeSubmitModalArea}
        onClose={() => setActiveSubmitModalArea(null)}
        onSubmitted={handleRunCalculation}
      />
    </div>
  );
};
