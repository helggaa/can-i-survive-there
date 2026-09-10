// src/types/database.types.ts
// Cost-of-Living Recommender Data Model & Types per 02-data-model-schema.md

export type ConfidenceLevel = 'estimated' | 'low' | 'medium' | 'high';
export type BootstrapStatus = 'not_started' | 'unbootstrapped' | 'discovering' | 'enriched' | 'ready' | 'baseline_only';
export type MetricCategory = 'housing' | 'transport' | 'food' | 'other';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'flagged';
export type HousingType = 'dorm' | 'kos' | 'apartment' | 'shared_house';
export type CommuteMode = 'walk' | 'transit' | 'drive' | 'bike';
export type AreaSource = 'osm' | 'manual' | 'curated' | 'crowdsourced' | 'modeled';
export type SourceType = 'listing_site' | 'aggregator' | 'news_article' | 'government_data' | 'agent_bootstrap' | 'user_fact';

export interface Country {
  id: string;
  iso_code: string;
  name: string;
  currency_code: string;
  gni_per_capita_ppp?: number;
  created_at: string;
}

export interface City {
  id: string;
  country_id: string;
  name: string;
  lat: number;
  lng: number;
  bootstrap_status: BootstrapStatus;
  bootstrap_source?: string;
  last_refreshed_at?: string;
  data_confidence: ConfidenceLevel;
  created_at: string;
}

export interface Area {
  id: string;
  city_id: string;
  name: string;
  boundary?: any;
  lat: number;
  lng: number;
  source: AreaSource;
  created_at: string;
}

export interface Metric {
  id: string;
  key: 'rent_or_kost_monthly' | 'food_meal_avg' | 'transport_monthly' | 'grocery_basket' | string;
  name: string;
  description?: string;
  unit: string;
  category: MetricCategory;
  created_at: string;
}

export interface AreaMetricValue {
  id: string;
  area_id: string;
  metric_id: string;
  value: number;
  confidence: ConfidenceLevel;
  sample_size: number;
  computed_at: string;
  metric?: Metric;
}

export interface HousingListing {
  id: string;
  area_id: string;
  title: string;
  type: HousingType;
  rent_monthly: number;
  lat?: number;
  lng?: number;
  source: 'scraped' | 'crowdsourced';
  source_url?: string;
  last_seen_at: string;
}

export interface Submission {
  id: string;
  area_id: string;
  metric_id: string;
  value: number;
  note?: string;
  submitted_by?: string;
  evidence_url?: string;
  source_type: SourceType;
  agent_confidence?: ConfidenceLevel;
  observed_at: string;
  created_at: string;
  status: SubmissionStatus;
}

export interface User {
  id: string;
  created_at: string;
  trust_score: number;
}

export interface CommuteCache {
  id: string;
  origin_lat: number;
  origin_lng: number;
  area_id: string;
  mode: CommuteMode;
  distance_km: number;
  duration_min: number;
  computed_at: string;
}

export interface InsertAreaMetricInput {
  area_id: string;
  metric_key: string;
  value: number;
  currency_code?: string;
  source_url: string;
  source_type?: 'listing_site' | 'aggregator' | 'news_article' | 'government_data' | 'agent_bootstrap' | 'user_fact';
  observed_at?: string;
  agent_confidence?: ConfidenceLevel;
  note?: string;
}

export interface InsertAreaMetricResult {
  success: boolean;
  reason?: string;
  inserted_id?: string;
}

export interface RouteDetailItem {
  mode: CommuteMode;
  duration_min: number;
  distance_km: number;
  is_available?: boolean;
  status_note?: string;
}

export interface AreaExpenseBreakdown {
  area: Area;
  city: City;
  country: Country;
  rent_or_kost_monthly: number;
  food_meal_avg: number;
  food_cost_monthly: number;
  transport_monthly: number;
  grocery_monthly: number;
  total_monthly_cost: number;
  confidence: ConfidenceLevel;
  sample_size: number;
  metric_values: Record<string, { value: number; confidence: ConfidenceLevel; sample_size: number }>;
  commute?: {
    mode: CommuteMode;
    duration_min: number;
    distance_km: number;
    available_modes: RouteDetailItem[];
  };
  score?: {
    affordability_ratio: number;
    commute_score: number;
    confidence_weight: number;
    final_score: number;
    is_affordable: boolean;
  };
}

export type FeedbackType = 'cost_correction' | 'new_city_request' | 'new_area_request' | 'general_feedback';
export type FeedbackStatus = 'new' | 'investigating' | 'researched' | 'resolved' | 'dismissed';

export interface UserFeedback {
  id: string;
  city_id?: string | null;
  area_id?: string | null;
  city_name: string;
  feedback_type: FeedbackType;
  message: string;
  suggested_value?: number | null;
  currency_code?: string | null;
  evidence_url?: string | null;
  status: FeedbackStatus;
  created_at: string;
}

export interface SubmitFeedbackInput {
  city_id?: string | null;
  area_id?: string | null;
  city_name: string;
  feedback_type: FeedbackType;
  message: string;
  suggested_value?: number | null;
  currency_code?: string | null;
  evidence_url?: string | null;
}

