// src/components/BrowseView.tsx
// Browse Mode Screen with Progressive Cold-Start Bootstrap & Global City Search per UI/UX Pro Max

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ArrowUpDown, Building2, Search, Globe, Sparkles, MessageSquare } from 'lucide-react';
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
      React.startTransition(() => {
        setSelectedCityId(initialCityId);
      });
    }
  }, [initialCityId]);

  // Segmented Housing Filtering (All Types, Kost & Rooms, Apartments)
  const medianRent = React.useMemo(() => {
    const validRents = areas.map((a) => a.rent_or_kost_monthly).filter((r) => r > 0).sort((a, b) => a - b);
    if (validRents.length === 0) return 0;
    return validRents[Math.floor(validRents.length / 2)];
  }, [areas]);

  const kostAreas = React.useMemo(() => {
    return areas.filter((a) => a.rent_or_kost_monthly <= medianRent);
  }, [areas, medianRent]);

  const apartmentAreas = React.useMemo(() => {
    return areas.filter((a) => a.rent_or_kost_monthly > medianRent);
  }, [areas, medianRent]);

  const filteredAreas = React.useMemo(() => {
    if (activeFilter === 'kost') return kostAreas;
    if (activeFilter === 'apartment') return apartmentAreas;
    return areas;
  }, [activeFilter, areas, kostAreas, apartmentAreas]);

  // Global search input & suggestions
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GlobalCityItem[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Community feedback & research request modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackCityName, setFeedbackCityName] = useState<string>('');
  const [feedbackArea, setFeedbackArea] = useState<{ id?: string; name?: string } | null>(null);

  // Cold-start progress state
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [bootstrapProgress, setBootstrapProgress] = useState<BootstrapProgressEvent | null>(null);

  // Keyboard shortcut (/) to focus search
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

  // Load city areas or trigger auto-discovery for unbootstrapped cities
  useEffect(() => {
    React.startTransition(() => {
      setIsLoading(true);
      // Clear previous areas immediately to prevent stale state flash
      setAreas([]);
      setIsBootstrapping(false);
      setBootstrapProgress(null);
    });

    const targetCity = cities.find((c) => c.id === selectedCityId);
    if (!targetCity) {
      return;
    }

    if (targetCity.bootstrap_status === 'not_started') {
      React.startTransition(() => {
        setIsBootstrapping(true);
        setIsLoading(true);
      });

      const country = db.countries.find((c) => c.id === targetCity.country_id) || db.countries[0];
      discoverCityAreas(targetCity, country).then(async (discovered) => {
        await bootstrapPipeline.bootstrapCity(targetCity, country, discovered);
      });
    } else {
      db.getCityAreasWithExpenses(selectedCityId).then((areaList) => {
        // Strict non-zero living cost invariant
        const readyList = areaList.filter((a) => a.total_monthly_cost > 0);
        setAreas(sortBrowseMode(readyList));
        setIsLoading(false);
      });
    }
  }, [selectedCityId, cities]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  // Reload data after fact submission
  const handleDataReload = async () => {
    const areaList = await db.getCityAreasWithExpenses(selectedCityId);
    setAreas(sortBrowseMode(areaList));
  };

  return (
    <div className="browse-view">
      {/* Header Section */}
      <div className="browse-header-section">
        <div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>
            Relocation & Cost of Living Explorer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem' }}>
            Verified student kosts, room rentals, daily warung meals, and commute passes for students, young workers, and migrants moving to a new city.
          </p>
        </div>

        {/* Command Search Bar */}
        <div className="search-command-wrapper" ref={searchContainerRef}>
          <div className="search-input-box">
            <Search size={18} style={{ color: 'var(--brand-primary)' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Where are you moving? Search city (e.g. Yogyakarta, Bandung, Jakarta, Tokyo, Melbourne)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsSearchOpen(true);
              }}
              maxLength={120}
            />
            <div className="search-shortcut-badge">/</div>
          </div>

          {/* Suggestions Dropdown */}
          {isSearchOpen && suggestions.length > 0 && (
            <div className="search-dropdown-menu">
              {suggestions.map((item, idx) => {
                const isHighlighted = idx === selectedSuggestionIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectGlobalCity(item)}
                    className={`search-suggestion-item ${isHighlighted ? 'selected' : ''}`}
                    onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Globe size={16} style={{ color: 'var(--accent-secondary)' }} />
                      <div>
                        <div className="suggestion-city-name">{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.adminName ? `${item.adminName}, ` : ''}{item.country} ({item.iso2})
                        </div>
                      </div>
                    </div>
                    <span className="suggestion-country-badge">
                      {item.population ? `Pop: ${(item.population / 1000000).toFixed(1)}M` : item.iso2}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* No match prompt */}
          {isSearchOpen && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="search-dropdown-menu" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.85rem' }}>
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
                className="btn-primary"
                style={{ fontSize: '0.8125rem' }}
              >
                <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                Request Automated Research for &quot;{searchQuery}&quot;
              </button>
            </div>
          )}
        </div>

        {/* Quick City Horizontal Scrollable Pills */}
        <div className="city-pills-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', paddingRight: '0.4rem' }}>
            <MapPin size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Popular:</span>
          </div>
          {cities.slice(0, 10).map((city) => (
            <button
              key={city.id}
              className={`city-pill-btn ${selectedCityId === city.id ? 'active' : ''}`}
              onClick={() => setSelectedCityId(city.id)}
            >
              <span>{city.name}</span>
              {city.bootstrap_status === 'not_started' && ' ✨'}
            </button>
          ))}
        </div>

        {/* Controls Bar: Housing Segment & Feedback button */}
        <div className="browse-controls-bar">
          <div className="housing-filter-group">
            <button
              type="button"
              className={`housing-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Types ({areas.length})
            </button>
            <button
              type="button"
              className={`housing-filter-btn ${activeFilter === 'kost' ? 'active' : ''}`}
              onClick={() => setActiveFilter('kost')}
            >
              Kost &amp; Rooms ({kostAreas.length})
            </button>
            <button
              type="button"
              className={`housing-filter-btn ${activeFilter === 'apartment' ? 'active' : ''}`}
              onClick={() => setActiveFilter('apartment')}
            >
              Apartments ({apartmentAreas.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{
                fontSize: '0.8125rem',
                padding: '0.4rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--accent-secondary)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                background: 'rgba(6, 182, 212, 0.08)',
              }}
              onClick={() => {
                setFeedbackCityName(selectedCity?.name || '');
                setFeedbackArea(null);
                setIsFeedbackModalOpen(true);
              }}
            >
              <MessageSquare size={14} />
              <span>Feedback / Research</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Cold-Start vs Standard List */}
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
          {/* Results Count & Sorting Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div className="browse-stats-count">
              Showing <strong>{filteredAreas.length}</strong> {activeFilter !== 'all' ? `(${activeFilter === 'kost' ? 'Kost & Rooms' : 'Apartments'}) ` : ''}verified neighborhoods in <strong>{selectedCity?.name}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <ArrowUpDown size={13} />
              <span>Ranked by Lowest Living Cost</span>
            </div>
          </div>

          {/* Skeleton or Loaded Cards */}
          {isLoading ? (
            <div className="area-cards-list">
              {[1, 2, 3, 4].map((i) => (
                <AreaCardSkeleton key={`browse-skeleton-${i}`} rank={i} />
              ))}
            </div>
          ) : filteredAreas.length > 0 ? (
            <div className="area-cards-list">
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
            <div className="filter-empty-state">
              <Building2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <div className="filter-empty-state-title">
                No neighborhoods match &quot;{activeFilter === 'kost' ? 'Kost & Rooms' : 'Apartments'}&quot;
              </div>
              <p className="filter-empty-state-desc">
                All currently indexed areas in {selectedCity?.name} fall into other price tiers.
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Show All {areas.length} Neighborhoods
              </button>
            </div>
          ) : (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
              <Building2 size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                No verified neighborhoods yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
                This city hasn&apos;t been fully mapped yet. You can submit the first neighborhood observation or request an automated research pass.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedbackCityName(selectedCity?.name || '');
                  setFeedbackArea(null);
                  setIsFeedbackModalOpen(true);
                }}
                className="btn-primary"
                style={{ fontSize: '0.875rem' }}
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

export default BrowseView;
