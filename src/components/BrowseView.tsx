// src/components/BrowseView.tsx
// Browse Mode Screen with Progressive Cold-Start Bootstrap & Global City Search per 03-ux-screens.md

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ArrowUpDown, Building2, Search, Globe } from 'lucide-react';
import type { City, AreaExpenseBreakdown } from '../types/database.types';
import { db } from '../services/database';
import { sortBrowseMode } from '../services/scoring';
import { AreaExpenseCard } from './AreaExpenseCard';
import { BridgeAffordance } from './BridgeAffordance';
import { SubmitFactModal } from './SubmitFactModal';
import { FeedbackModal } from './FeedbackModal';
import { ColdStartView } from './ColdStartView';
import { AreaCardSkeleton } from './AreaCardSkeleton';
import { discoverCityAreas } from '../services/bootstrap/area-discovery';
import { bootstrapPipeline, type BootstrapProgressEvent } from '../services/bootstrap/worker-pool';
import { searchGlobalCities, getOrRegisterGlobalCity, type GlobalCityItem } from '../services/city-search';

interface BrowseViewProps {
  onNavigatePersonalized: () => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({ onNavigatePersonalized }) => {
  const [cities, setCities] = useState<(City & { country: any })[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('city-jakarta-01');
  const [areas, setAreas] = useState<AreaExpenseBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'kost' | 'apartment'>('all');
  const [activeSubmitModalArea, setActiveSubmitModalArea] = useState<AreaExpenseBreakdown | null>(null);

  // Global search input & suggestions
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GlobalCityItem[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Community feedback & research request modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackCityName, setFeedbackCityName] = useState<string>('');
  const [feedbackArea, setFeedbackArea] = useState<{ id?: string; name?: string } | null>(null);

  // Cold-start progress state
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [bootstrapProgress, setBootstrapProgress] = useState<BootstrapProgressEvent | null>(null);

  // Load available cities
  const reloadCityList = useCallback(() => {
    db.getCities().then((cityList) => {
      setCities(cityList);
    });
  }, []);

  useEffect(() => {
    reloadCityList();
  }, [reloadCityList]);

  const searchTimerRef = useRef<any>(null);

  // Handle global search input
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSelectedSuggestionIndex(-1);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (val.trim().length >= 2) {
      searchTimerRef.current = setTimeout(async () => {
        const results = await searchGlobalCities(val, 8);
        setSuggestions(results);
        setIsSearchOpen(true);
      }, 150);
    } else {
      setSuggestions([]);
      setIsSearchOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsSearchOpen(true);
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
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        handleSelectGlobalCity(suggestions[selectedSuggestionIndex]);
      } else if (suggestions.length > 0) {
        handleSelectGlobalCity(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
    }
  };

  const handleSelectGlobalCity = async (item: GlobalCityItem) => {
    const registered = getOrRegisterGlobalCity(item);
    await reloadCityList();
    setSelectedCityId(registered.id);
    setSearchQuery('');
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setIsSearchOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to pipeline events
  useEffect(() => {
    const handleProgress = (event: BootstrapProgressEvent) => {
      if (event.cityId === selectedCityId) {
        setBootstrapProgress(event);
        db.getCityAreasWithExpenses(selectedCityId).then((list) => {
          // Strict non-zero filter: only push computed areas to state to prevent 0 living cost flash
          const readyList = list.filter((a) => a.total_monthly_cost > 0);
          setAreas(sortBrowseMode(readyList));
        });
        if (event.isComplete) {
          setIsBootstrapping(false);
          setIsLoading(false);
        }
      }
    };

    bootstrapPipeline.addListener(handleProgress);
    return () => bootstrapPipeline.removeListener(handleProgress);
  }, [selectedCityId]);

  // Load areas or trigger cold-start when city changes
  useEffect(() => {
    async function checkAndLoadCityData() {
      if (!selectedCityId) return;
      // Immediately reset state to prevent stale data or 0-cost blinking
      setAreas([]);
      setIsLoading(true);

      const city = cities.find((c) => c.id === selectedCityId) || db.cities.find((c) => c.id === selectedCityId);
      if (!city) {
        setIsLoading(false);
        return;
      }

      const country = (city as any).country || db.countries.find((co) => co.id === city.country_id);
      if (!country) {
        setIsLoading(false);
        return;
      }

      const existingAreas = await db.getCityAreasWithExpenses(selectedCityId);
      const validExisting = existingAreas.filter((a) => a.total_monthly_cost > 0);

      if (city.bootstrap_status === 'not_started' || existingAreas.length === 0 || validExisting.length === 0) {
        setIsBootstrapping(true);
        setIsLoading(false);
        const discovered = await discoverCityAreas(city, country);
        setBootstrapProgress({
          cityId: city.id,
          totalAreas: discovered.length,
          completedAreas: 0,
          activeAreaName: discovered[0]?.name,
          isComplete: false,
          completedAreaIds: [],
        });
        bootstrapPipeline.bootstrapCity(city, country, discovered);
      } else {
        setIsBootstrapping(false);
        setAreas(sortBrowseMode(validExisting));
        setIsLoading(false);
      }
    }

    checkAndLoadCityData();
  }, [selectedCityId, cities]);

  const selectedCity = cities.find((c) => c.id === selectedCityId) || cities[0];

  const handleDataReload = async () => {
    if (!selectedCityId) return;
    const areaList = await db.getCityAreasWithExpenses(selectedCityId);
    setAreas(sortBrowseMode(areaList));
  };

  return (
    <div className="browse-view">
      {/* Header */}
      <div className="browse-header">
        <div className="browse-title-row">
          <div>
            <h1 className="section-title">City Cost of Living Explorer</h1>
            <p className="section-subtitle">
              Transparent, crowdsourced cost breakdowns for housing, sit-down food, and transport across 1,500+ global cities.
            </p>
          </div>
        </div>

        {/* Controls Bar: Global Search, City Dropdown & Quick Pills */}
        <div className="controls-bar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Global City Search Auto-complete */}
          <div ref={searchContainerRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} className="input-icon-left" />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem', background: 'var(--bg-secondary)', width: '100%' }}
                placeholder="Search any city globally (e.g. Bangkok, Seoul, Paris, Sydney, São Paulo, Da Nang)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setIsSearchOpen(true);
                }}
              />
            </div>

            {/* Suggestions Dropdown */}
            {isSearchOpen && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 40,
                  marginTop: 6,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === selectedSuggestionIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectGlobalCity(item)}
                      style={{
                        padding: '0.75rem 1.15rem',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        background: isHighlighted ? 'var(--bg-tertiary)' : 'transparent',
                        borderLeft: isHighlighted ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={15} color="var(--accent-secondary)" />
                        <div>
                          <strong style={{ color: 'var(--text-white)' }}>{item.name}</strong>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                            {item.adminName ? `${item.adminName}, ` : ''}{item.country} ({item.iso2})
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.population ? `Pop: ${(item.population / 1000000).toFixed(1)}M` : item.iso2}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No match prompt */}
            {isSearchOpen && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 40,
                  marginTop: 6,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  No indexed city found for &quot;<strong>{searchQuery}</strong>&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackCityName(searchQuery);
                    setFeedbackArea(null);
                    setIsFeedbackModalOpen(true);
                    setIsSearchOpen(false);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                >
                  ✨ Request Automated Research for &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </div>

          <div className="city-search-row">
            <div className="city-select-box">
              <MapPin size={18} className="input-icon-left" />
              <select
                className="city-dropdown"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                aria-label="Select City"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.country?.name} ({city.country?.currency_code})
                    {city.bootstrap_status === 'not_started' ? ' — [New City Research]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick-select city pills */}
            <div className="quick-city-pills">
              {cities.slice(0, 8).map((city) => (
                <button
                  key={city.id}
                  className={`quick-pill ${selectedCityId === city.id ? 'active' : ''}`}
                  onClick={() => setSelectedCityId(city.id)}
                >
                  {city.name}
                  {city.bootstrap_status === 'not_started' && ' ✨'}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="filter-chips-row">
            <span className="filter-label">Focus:</span>
            <button
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Neighborhoods ({areas.length})
            </button>
            <button
              className={`filter-chip ${activeFilter === 'kost' ? 'active' : ''}`}
              onClick={() => setActiveFilter('kost')}
            >
              Kost & Dorm Friendly
            </button>
            <button
              className={`filter-chip ${activeFilter === 'apartment' ? 'active' : ''}`}
              onClick={() => setActiveFilter('apartment')}
            >
              Apartment Focus
            </button>
            <button
              className="filter-chip"
              style={{
                marginLeft: 'auto',
                background: 'rgba(6, 182, 212, 0.08)',
                borderColor: 'rgba(6, 182, 212, 0.25)',
                color: 'var(--accent-secondary)',
              }}
              onClick={() => {
                setFeedbackCityName(selectedCity?.name || '');
                setFeedbackArea(null);
                setIsFeedbackModalOpen(true);
              }}
            >
              💬 Feedback / Request Research
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Cold-Start vs. Standard List */}
      {isBootstrapping && selectedCity ? (
        <ColdStartView
          city={selectedCity}
          readyAreas={areas}
          totalAreasCount={bootstrapProgress?.totalAreas || 5}
          activeAreaName={bootstrapProgress?.activeAreaName}
          isComplete={bootstrapProgress?.isComplete || false}
          onOpenSubmitFact={(area) => setActiveSubmitModalArea(area)}
        />
      ) : (
        <>
          {/* Results Count Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{areas.length}</strong> neighborhoods in <strong>{selectedCity?.name}</strong>, sorted by lowest total cost
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ArrowUpDown size={13} />
              <span>Lowest Cost First</span>
            </div>
          </div>

          {/* Skeleton or Loaded Cards */}
          {isLoading ? (
            <div className="area-cards-list">
              {[1, 2, 3, 4].map((i) => (
                <AreaCardSkeleton key={`browse-skeleton-${i}`} rank={i} />
              ))}
            </div>
          ) : areas.length > 0 ? (
            <div className="area-cards-list">
              {areas.map((areaData, index) => (
                <AreaExpenseCard
                  key={areaData.area.id}
                  data={areaData}
                  rank={index + 1}
                  onOpenSubmitFact={(area) => setActiveSubmitModalArea(area)}
                  onOpenFeedback={(area) => {
                    setFeedbackCityName(selectedCity?.name || '');
                    setFeedbackArea({ id: area.area.id, name: area.area.name });
                    setIsFeedbackModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <Building2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No data for this city yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1.25rem' }}>
                This city hasn&apos;t been researched yet. You can submit the first fact or request an automated research run.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedbackCityName(selectedCity?.name || '');
                  setFeedbackArea(null);
                  setIsFeedbackModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
              >
                ✨ Request Automated Research
              </button>
            </div>
          )}
        </>
      )}

      {/* Bridge Affordance */}
      {selectedCity && (
        <BridgeAffordance
          cityName={selectedCity.name}
          onNavigatePersonalized={onNavigatePersonalized}
        />
      )}

      {/* Fact Submission Modal */}
      <SubmitFactModal
        areaData={activeSubmitModalArea}
        isOpen={!!activeSubmitModalArea}
        onClose={() => setActiveSubmitModalArea(null)}
        onSubmitted={handleDataReload}
      />

      {/* Feedback & Automated Research Request Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        initialCityName={feedbackCityName}
        initialAreaName={feedbackArea?.name}
        cityId={selectedCityId}
        areaId={feedbackArea?.id}
        onFeedbackSubmitted={() => {
          reloadCityList();
        }}
      />
    </div>
  );
};
