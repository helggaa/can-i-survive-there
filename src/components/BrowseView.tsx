// src/components/BrowseView.tsx
// Survive Atlas — Browse Mode with glassmorphic command search, stagger reveals & premium filters

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  ArrowUpDown,
  Building2,
  Search,
  Globe,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
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
  initialCityId?: string;
}

export const BrowseView: React.FC<BrowseViewProps> = ({ onNavigatePersonalized, initialCityId }) => {
  const [cities, setCities] = useState<(City & { country: any })[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>(initialCityId || 'city-jakarta-01');
  const [areas, setAreas] = useState<AreaExpenseBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'kost' | 'apartment'>('all');
  const [activeSubmitModalArea, setActiveSubmitModalArea] = useState<AreaExpenseBreakdown | null>(null);

  useEffect(() => {
    if (initialCityId) {
      React.startTransition(() => { setSelectedCityId(initialCityId); });
    }
  }, [initialCityId]);

  // Segmented housing filtering
  const medianRent = React.useMemo(() => {
    const validRents = areas.map((a) => a.rent_or_kost_monthly).filter((r) => r > 0).sort((a, b) => a - b);
    if (validRents.length === 0) return 0;
    return validRents[Math.floor(validRents.length / 2)];
  }, [areas]);

  const kostAreas      = React.useMemo(() => areas.filter((a) => a.rent_or_kost_monthly <= medianRent), [areas, medianRent]);
  const apartmentAreas = React.useMemo(() => areas.filter((a) => a.rent_or_kost_monthly > medianRent),  [areas, medianRent]);
  const filteredAreas  = React.useMemo(() => {
    if (activeFilter === 'kost') return kostAreas;
    if (activeFilter === 'apartment') return apartmentAreas;
    return areas;
  }, [activeFilter, areas, kostAreas, apartmentAreas]);

  // Global search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GlobalCityItem[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef     = useRef<HTMLInputElement>(null);

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackCityName, setFeedbackCityName] = useState<string>('');
  const [feedbackArea, setFeedbackArea] = useState<{ id?: string; name?: string } | null>(null);

  // Cold-start state
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [bootstrapProgress, setBootstrapProgress] = useState<BootstrapProgressEvent | null>(null);

  // Keyboard shortcut
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const reloadCityList = useCallback(() => {
    db.getCities().then((cityList) => { setCities(cityList); });
  }, []);

  useEffect(() => { reloadCityList(); }, [reloadCityList]);

  const searchTimerRef = useRef<any>(null);
  const activeSearchQueryRef = useRef<string>('');
  const selectedCityIdRef = useRef<string>(selectedCityId);

  useEffect(() => {
    selectedCityIdRef.current = selectedCityId;
  }, [selectedCityId]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSelectedSuggestionIndex(-1);
    activeSearchQueryRef.current = val;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (val.trim().length >= 2) {
      searchTimerRef.current = setTimeout(async () => {
        const queryToSearch = val;
        const results = await searchGlobalCities(val, 8);
        if (activeSearchQueryRef.current === queryToSearch) {
          setSuggestions(results);
          setIsSearchOpen(true);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setIsSearchOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) setIsSearchOpen(true);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleProgress = (event: BootstrapProgressEvent) => {
      if (event.cityId === selectedCityId) {
        setBootstrapProgress(event);
        db.getCityAreasWithExpenses(selectedCityId).then((list) => {
          if (selectedCityIdRef.current !== event.cityId) return;
          const readyList = list.filter((a) => a.total_monthly_cost > 0);
          setAreas(sortBrowseMode(readyList));
        });
        if (event.isComplete || event.hasError) {
          setIsBootstrapping(false);
          setIsLoading(false);
        }
      }
    };
    bootstrapPipeline.addListener(handleProgress);
    return () => bootstrapPipeline.removeListener(handleProgress);
  }, [selectedCityId]);

  useEffect(() => {
    let isCurrent = true;
    const currentCityId = selectedCityId;

    React.startTransition(() => {
      setIsLoading(true);
      setAreas([]);
      setIsBootstrapping(false);
      setBootstrapProgress(null);
    });

    const targetCity = cities.find((c) => c.id === currentCityId);
    if (!targetCity) return;

    if (targetCity.bootstrap_status === 'not_started') {
      React.startTransition(() => {
        setIsBootstrapping(true);
        setIsLoading(true);
      });
      const country = db.countries.find((c) => c.id === targetCity.country_id) || db.countries[0];
      discoverCityAreas(targetCity, country)
        .then(async (discovered) => {
          if (!isCurrent || selectedCityIdRef.current !== currentCityId) return;
          try {
            await bootstrapPipeline.bootstrapCity(targetCity, country, discovered);
          } catch {
            if (isCurrent && selectedCityIdRef.current === currentCityId) {
              setIsBootstrapping(false);
              setIsLoading(false);
            }
          }
        })
        .catch(() => {
          if (isCurrent && selectedCityIdRef.current === currentCityId) {
            setIsBootstrapping(false);
            setIsLoading(false);
          }
        });
    } else {
      db.getCityAreasWithExpenses(currentCityId)
        .then((areaList) => {
          if (!isCurrent || selectedCityIdRef.current !== currentCityId) return;
          const readyList = areaList.filter((a) => a.total_monthly_cost > 0);
          setAreas(sortBrowseMode(readyList));
          setIsLoading(false);
        })
        .catch(() => {
          if (isCurrent && selectedCityIdRef.current === currentCityId) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [selectedCityId, cities]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  const handleDataReload = async () => {
    const areaList = await db.getCityAreasWithExpenses(selectedCityId);
    setAreas(sortBrowseMode(areaList));
  };

  return (
    <div className="browse-view">
      {/* Header */}
      <div className="browse-header-section">
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.7rem, 4vw, 2.6rem)',
            fontWeight: 800,
            marginBottom: '0.4rem',
            letterSpacing: '-0.035em',
            color: 'var(--text-primary)',
          }}>
            Cost of Living Explorer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Student kosts, warung meals, and commute passes — neighborhood by neighborhood.
          </p>
        </div>

        {/* Command Search Bar */}
        <div className="search-command-wrapper" ref={searchContainerRef}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input-box"
            placeholder="Search any city worldwide (e.g. Yogyakarta, Tokyo, Melbourne)…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setIsSearchOpen(true); }}
            maxLength={120}
            aria-label="Search cities"
            aria-autocomplete="list"
            aria-expanded={isSearchOpen}
          />
          <Search size={18} className="search-input-icon" />
          <div className="search-kbd-hint">
            <span className="search-kbd">/</span>
          </div>

          {/* Suggestions dropdown */}
          {isSearchOpen && suggestions.length > 0 && (
            <div className="search-suggestions-panel" role="listbox">
              <div className="search-suggestion-section-label" style={{ borderTop: 'none', marginTop: 0 }}>
                Cities found
              </div>
              {suggestions.map((item, idx) => {
                const isHighlighted = idx === selectedSuggestionIndex;
                return (
                  <div
                    key={item.id}
                    className={`search-suggestion-item ${isHighlighted ? 'highlighted' : ''}`}
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => handleSelectGlobalCity(item)}
                    onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                  >
                    <Globe size={16} className="suggestion-flag" style={{ color: 'var(--brand-primary)' }} />
                    <div>
                      <div className="suggestion-name">{item.name}</div>
                      <div className="suggestion-meta">
                        {item.adminName ? `${item.adminName}, ` : ''}{item.country} ({item.iso2})
                      </div>
                    </div>
                    {item.population ? (
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {(item.population / 1_000_000).toFixed(1)}M
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* No match */}
          {isSearchOpen && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="search-suggestions-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                No city found for &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: '0.8125rem' }}
                onClick={() => {
                  setFeedbackCityName(searchQuery);
                  setFeedbackArea(null);
                  setIsFeedbackModalOpen(true);
                  setIsSearchOpen(false);
                }}
              >
                <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} />
                Request research for &ldquo;{searchQuery}&rdquo;
              </button>
            </div>
          )}
        </div>

        {/* City quick-select chips */}
        <div className="city-selector-row">
          <span className="city-selector-label">
            <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />
            Popular:
          </span>
          <div className="city-chips-scroll">
            {cities.slice(0, 10).map((city) => (
              <button
                key={city.id}
                className={`city-chip ${selectedCityId === city.id ? 'active' : ''}`}
                onClick={() => setSelectedCityId(city.id)}
                title={city.name}
              >
                {city.name}
                {city.bootstrap_status === 'not_started' && (
                  <Sparkles size={11} style={{ color: 'var(--brand-primary)', marginLeft: 2 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Feedback controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="segmented-filter" role="tablist" aria-label="Housing types">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              className={`segment-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({areas.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'kost'}
              className={`segment-btn ${activeFilter === 'kost' ? 'active' : ''}`}
              onClick={() => setActiveFilter('kost')}
            >
              Kost &amp; Rooms ({kostAreas.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'apartment'}
              className={`segment-btn ${activeFilter === 'apartment' ? 'active' : ''}`}
              onClick={() => setActiveFilter('apartment')}
            >
              Apartments ({apartmentAreas.length})
            </button>
          </div>

          <button
            type="button"
            className="area-action-btn"
            onClick={() => {
              setFeedbackCityName(selectedCity?.name || '');
              setFeedbackArea(null);
              setIsFeedbackModalOpen(true);
            }}
          >
            <MessageSquare size={13} />
            <span>Feedback</span>
          </button>
        </div>
      </div>

      {/* Main content */}
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
          {/* Results header */}
          <div className="results-section-header">
            <div className="results-count-badge">
              <Building2 size={13} />
              <span>
                {filteredAreas.length} neighborhoods · {selectedCity?.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <ArrowUpDown size={13} />
              <span>Lowest Living Cost</span>
            </div>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="areas-results-list stagger-list">
              {[1, 2, 3, 4].map((i) => (
                <AreaCardSkeleton key={`browse-skeleton-${i}`} rank={i} />
              ))}
            </div>
          ) : filteredAreas.length > 0 ? (
            <div className="areas-results-list stagger-list">
              {filteredAreas.map((areaData, index) => (
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
          ) : areas.length > 0 ? (
            <div className="empty-state glass-card" style={{ marginTop: '1.5rem' }}>
              <div className="empty-state-icon">
                <Building2 size={28} />
              </div>
              <p className="empty-state-title">
                No {activeFilter === 'kost' ? 'Kost & Rooms' : 'Apartments'} found
              </p>
              <p className="empty-state-desc">
                All indexed areas in {selectedCity?.name} fall into other price tiers.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '0.5rem' }}
                onClick={() => setActiveFilter('all')}
              >
                Show All {areas.length} Neighborhoods
              </button>
            </div>
          ) : (
            <div className="empty-state glass-card" style={{ marginTop: '1.5rem' }}>
              <div className="empty-state-icon">
                <Building2 size={28} />
              </div>
              <p className="empty-state-title">No neighborhoods indexed yet</p>
              <p className="empty-state-desc">
                This city hasn&apos;t been fully mapped yet. Submit the first observation or request an automated research pass.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  setFeedbackCityName(selectedCity?.name || '');
                  setFeedbackArea(null);
                  setIsFeedbackModalOpen(true);
                }}
              >
                <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} />
                Request Automated Research
              </button>
            </div>
          )}
        </>
      )}

      {/* Bridge CTA */}
      {selectedCity && (
        <BridgeAffordance cityName={selectedCity.name} onNavigatePersonalized={onNavigatePersonalized} />
      )}

      {/* Modals */}
      <SubmitFactModal
        areaData={activeSubmitModalArea}
        isOpen={!!activeSubmitModalArea}
        onClose={() => setActiveSubmitModalArea(null)}
        onSubmitted={handleDataReload}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        initialCityName={feedbackCityName}
        initialAreaName={feedbackArea?.name}
        cityId={selectedCityId}
        areaId={feedbackArea?.id}
        onFeedbackSubmitted={() => { reloadCityList(); }}
      />
    </div>
  );
};

export default BrowseView;
