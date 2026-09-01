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
import { ColdStartView } from './ColdStartView';
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
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cold-start progress state
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [bootstrapProgress, setBootstrapProgress] = useState<BootstrapProgressEvent | null>(null);

  // Load available cities
  const reloadCityList = useCallback(async () => {
    const cityList = await db.getCities();
    setCities(cityList);
    if (!selectedCityId && cityList.length > 0) {
      setSelectedCityId(cityList[0].id);
    }
  }, [selectedCityId]);

  useEffect(() => {
    reloadCityList();
  }, [reloadCityList]);

  const searchTimerRef = useRef<any>(null);

  // Handle global search input
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
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

  const handleSelectGlobalCity = async (item: GlobalCityItem) => {
    const registered = getOrRegisterGlobalCity(item);
    await reloadCityList();
    setSelectedCityId(registered.id);
    setSearchQuery('');
    setSuggestions([]);
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
          setAreas(sortBrowseMode(list));
        });
        if (event.isComplete) {
          setIsBootstrapping(false);
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
      setIsLoading(true);

      const city = db.cities.find((c) => c.id === selectedCityId);
      if (!city) return;

      const country = db.countries.find((co) => co.id === city.country_id)!;

      if (city.bootstrap_status === 'not_started') {
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
        const areaList = await db.getCityAreasWithExpenses(selectedCityId);
        setAreas(sortBrowseMode(areaList));
        setIsLoading(false);
      }
    }

    checkAndLoadCityData();
  }, [selectedCityId]);

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
                {suggestions.map((item) => (
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
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
                ))}
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="area-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                      <div>
                        <div className="skeleton" style={{ width: 140, height: 20, marginBottom: 6 }} />
                        <div className="skeleton" style={{ width: 90, height: 14 }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="skeleton" style={{ width: 110, height: 26 }} />
                      <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 12 }} />
                    </div>
                  </div>
                </div>
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
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <Building2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No data for this city yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
                This city hasn't been researched yet. You can submit the first fact or request a research run.
              </p>
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
    </div>
  );
};
