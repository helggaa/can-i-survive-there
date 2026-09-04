// src/services/database.ts
// Unified database service supporting both Supabase backend and local repository store

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Country,
  City,
  Area,
  Metric,
  AreaMetricValue,
  Submission,
  InsertAreaMetricInput,
  InsertAreaMetricResult,
  AreaExpenseBreakdown,
  ConfidenceLevel,
} from '../types/database.types';
import { validateAreaMetricInput } from './validation';
import { calculateTotalCost } from './scoring';
import {
  SEED_COUNTRIES,
  SEED_METRICS,
  SEED_CITIES,
  SEED_AREAS,
  INITIAL_AREA_METRIC_RECORDS,
} from '../data/seed-data';
import GLOBAL_COST_DATASET from '../data/global-cost-dataset.json';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class AppDatabase {
  public supabase: SupabaseClient | null = null;

  public countries: Country[] = [];
  public cities: City[] = [];
  public areas: Area[] = [];
  public metrics: Metric[] = [];
  public areaMetricValues: AreaMetricValue[] = [];
  public submissions: Submission[] = [];

  constructor() {
    this.initSupabaseClient();
    this.seedLocalStore();
  }

  private initSupabaseClient() {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      } catch (e) {
        console.warn('Could not initialize Supabase client:', e);
      }
    }
  }

  public seedLocalStore() {
    this.countries = [...SEED_COUNTRIES];
    this.metrics = [...SEED_METRICS];
    this.cities = [...SEED_CITIES];
    this.areas = [...SEED_AREAS];
    this.submissions = [];
    this.areaMetricValues = [];

    for (const record of INITIAL_AREA_METRIC_RECORDS) {
      const metric = this.metrics.find((m) => m.key === record.metric_key);
      if (metric) {
        // Generate baseline submissions to represent the sample size
        const count = Math.min(record.sample_size, 5);
        for (let i = 0; i < count; i++) {
          const subId = generateUUID();
          this.submissions.push({
            id: subId,
            area_id: record.area_id,
            metric_id: metric.id,
            value: record.value,
            note: record.note || `Verified fact from ${record.source_url}`,
            evidence_url: record.source_url,
            source_type: i === 0 ? 'agent_bootstrap' : 'listing_site',
            agent_confidence: record.confidence as any,
            observed_at: new Date(Date.now() - i * 86400000 * 3).toISOString().split('T')[0],
            created_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
            status: 'accepted',
          });
        }

        this.areaMetricValues.push({
          id: generateUUID(),
          area_id: record.area_id,
          metric_id: metric.id,
          value: record.value,
          confidence: record.confidence as ConfidenceLevel,
          sample_size: record.sample_size,
          computed_at: new Date().toISOString(),
          metric,
        });
      }
    }

    // Ingest curated global cost dataset for flagship international hubs (Paris, Madrid, Sydney, Dubai, Singapore, Jakarta)
    for (const item of GLOBAL_COST_DATASET as any[]) {
      const city = this.cities.find(
        (c) =>
          c.id === item.cityId ||
          (c.name.toLowerCase() === item.cityName.toLowerCase() &&
            c.id.toLowerCase().includes(item.iso2.toLowerCase()))
      );
      if (!city) continue;

      city.bootstrap_status = 'enriched';
      city.data_confidence = 'high';

      for (const n of item.neighborhoods || []) {
        let area: Area | undefined = this.areas.find(
          (a) => a.city_id === city.id && a.name.toLowerCase() === n.name.toLowerCase()
        );
        if (!area) {
          const newArea: Area = {
            id: `area-${item.iso2.toLowerCase()}-${n.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            city_id: city.id,
            name: n.name,
            lat: Number((city.lat + (n.latOffset || 0)).toFixed(4)),
            lng: Number((city.lng + (n.lngOffset || 0)).toFixed(4)),
            source: 'manual',
            created_at: new Date().toISOString(),
          };
          this.areas.push(newArea);
          area = newArea;
        }
        const activeArea: Area = area;

        const metricsToLoad: Array<{ key: string; src: any }> = [
          { key: 'rent_or_kost_monthly', src: n.sources?.rent },
          { key: 'food_meal_avg', src: n.sources?.food },
          { key: 'transport_monthly', src: n.sources?.transport },
          { key: 'grocery_basket', src: n.sources?.grocery },
        ];

        for (const mData of metricsToLoad) {
          if (!mData.src || !mData.src.value) continue;
          const metric = this.metrics.find((m) => m.key === mData.key);
          if (!metric) continue;

          const existing = this.areaMetricValues.find(
            (v) => v.area_id === activeArea.id && v.metric_id === metric.id
          );
          if (!existing) {
            this.submissions.push({
              id: generateUUID(),
              area_id: activeArea.id,
              metric_id: metric.id,
              value: mData.src.value,
              note: mData.src.note || `Curated benchmark from ${mData.src.url}`,
              evidence_url: mData.src.url,
              source_type: 'agent_bootstrap',
              agent_confidence: 'high',
              observed_at: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              status: 'accepted',
            });

            this.areaMetricValues.push({
              id: generateUUID(),
              area_id: activeArea.id,
              metric_id: metric.id,
              value: mData.src.value,
              confidence: 'high',
              sample_size: 15,
              computed_at: new Date().toISOString(),
              metric,
            });
          }
        }
      }
    }

    // Set seeded cities with 0 areas to 'not_started' so cold-start bootstrap can run on demand
    for (const city of this.cities) {
      const hasAreas = this.areas.some((a) => a.city_id === city.id);
      if (!hasAreas) {
        city.bootstrap_status = 'not_started';
        city.data_confidence = 'low';
      }
    }
  }

  public async getCountries(): Promise<Country[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('countries').select('*');
        if (!error && data && data.length > 0) {
          return data as Country[];
        }
      } catch (e) {
        console.warn('Supabase getCountries query failed, fallback to local store:', e);
      }
    }
    return this.countries;
  }

  public async getCities(): Promise<(City & { country: Country })[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('cities')
          .select('*, country:countries(*)');
        if (!error && data && data.length > 0) {
          return data as (City & { country: Country })[];
        }
      } catch (e) {
        console.warn('Supabase getCities query failed, fallback to local store:', e);
      }
    }
    return this.cities.map((city) => {
      const country = this.countries.find((c) => c.id === city.country_id)!;
      return { ...city, country };
    });
  }

  public async getAreaById(areaId: string): Promise<Area | undefined> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('areas')
          .select('*')
          .eq('id', areaId)
          .maybeSingle();
        if (!error && data) {
          return data as Area;
        }
      } catch (e) {
        console.warn('Supabase getAreaById query failed, fallback to local store:', e);
      }
    }
    return this.areas.find((a) => a.id === areaId);
  }

  public async getAreaSubmissions(areaId: string): Promise<(Submission & { metric?: Metric })[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('submissions')
          .select('*, metric:metrics(*)')
          .eq('area_id', areaId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as (Submission & { metric?: Metric })[];
        }
      } catch (e) {
        console.warn('Supabase getAreaSubmissions query failed, fallback to local store:', e);
      }
    }
    return this.submissions
      .filter((s) => s.area_id === areaId)
      .map((sub) => {
        const metric = this.metrics.find((m) => m.id === sub.metric_id);
        return { ...sub, metric };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getCityAreasWithExpenses(cityId: string): Promise<AreaExpenseBreakdown[]> {
    if (this.supabase) {
      try {
        const { data: areasData, error: aErr } = await this.supabase
          .from('areas')
          .select('*, city:cities(*, country:countries(*))')
          .eq('city_id', cityId);

        if (!aErr && areasData && areasData.length > 0) {
          const areaIds = areasData.map((a: any) => a.id);
          const { data: amvData, error: mErr } = await this.supabase
            .from('area_metric_values')
            .select('*, metric:metrics(*)')
            .in('area_id', areaIds);

          if (!mErr && amvData) {
            const results: AreaExpenseBreakdown[] = [];
            for (const area of areasData) {
              const city = area.city;
              const country = city?.country;
              if (!city || !country) continue;

              const metricValuesMap: Record<string, { value: number; confidence: ConfidenceLevel; sample_size: number }> = {};
              const areaValues = amvData.filter((v: any) => v.area_id === area.id);

              let rent_or_kost_monthly = 0;
              let food_meal_avg = 0;
              let transport_monthly = 0;
              let grocery_basket = 0;
              let minConfidence: ConfidenceLevel = 'high';
              let totalSampleSize = 0;

              const confidenceRank: Record<ConfidenceLevel, number> = {
                high: 4,
                medium: 3,
                low: 2,
                estimated: 1,
              };

              for (const val of areaValues) {
                const metric = val.metric;
                if (metric) {
                  metricValuesMap[metric.key] = {
                    value: Number(val.value),
                    confidence: val.confidence,
                    sample_size: val.sample_size,
                  };
                  totalSampleSize += val.sample_size;

                  if (confidenceRank[val.confidence as ConfidenceLevel] < confidenceRank[minConfidence]) {
                    minConfidence = val.confidence as ConfidenceLevel;
                  }

                  if (metric.key === 'rent_or_kost_monthly' || metric.key === 'rent_monthly') {
                    rent_or_kost_monthly = Number(val.value);
                  } else if (metric.key === 'food_meal_avg') {
                    food_meal_avg = Number(val.value);
                  } else if (metric.key === 'transport_monthly') {
                    transport_monthly = Number(val.value);
                  } else if (metric.key === 'grocery_basket') {
                    grocery_basket = Number(val.value);
                  }
                }
              }

              if (areaValues.length === 0) {
                minConfidence = 'estimated';
              }

              const costBreakdown = calculateTotalCost({
                rent_or_kost_monthly,
                food_meal_avg,
                transport_monthly,
                grocery_basket,
              });

              results.push({
                area: {
                  id: area.id,
                  city_id: area.city_id,
                  name: area.name,
                  lat: area.lat,
                  lng: area.lng,
                  source: area.source,
                  created_at: area.created_at,
                },
                city,
                country,
                rent_or_kost_monthly: costBreakdown.rent_or_kost_monthly,
                food_meal_avg: costBreakdown.food_meal_avg,
                food_cost_monthly: costBreakdown.food_cost_monthly,
                transport_monthly: costBreakdown.transport_monthly,
                grocery_monthly: costBreakdown.grocery_monthly,
                total_monthly_cost: costBreakdown.total_monthly_cost,
                confidence: minConfidence,
                sample_size: totalSampleSize,
                metric_values: metricValuesMap,
              });
            }

            if (results.length > 0) return results;
          }
        }
      } catch (e) {
        console.warn('Supabase getCityAreasWithExpenses query failed, fallback to local store:', e);
      }
    }

    const city = this.cities.find((c) => c.id === cityId);
    if (!city) return [];

    const country = this.countries.find((c) => c.id === city.country_id);
    if (!country) return [];

    const cityAreas = this.areas.filter((a) => a.city_id === cityId);
    const results: AreaExpenseBreakdown[] = [];

    for (const area of cityAreas) {

      const metricValuesMap: Record<string, { value: number; confidence: ConfidenceLevel; sample_size: number }> = {};
      const areaValues = this.areaMetricValues.filter((v) => v.area_id === area.id);

      let rent_or_kost_monthly = 0;
      let food_meal_avg = 0;
      let transport_monthly = 0;
      let grocery_basket = 0;
      let minConfidence: ConfidenceLevel = 'high';
      let totalSampleSize = 0;

      const confidenceRank: Record<ConfidenceLevel, number> = {
        high: 4,
        medium: 3,
        low: 2,
        estimated: 1,
      };

      for (const val of areaValues) {
        const metric = this.metrics.find((m) => m.id === val.metric_id);
        if (metric) {
          metricValuesMap[metric.key] = {
            value: val.value,
            confidence: val.confidence,
            sample_size: val.sample_size,
          };
          totalSampleSize += val.sample_size;

          if (confidenceRank[val.confidence] < confidenceRank[minConfidence]) {
            minConfidence = val.confidence;
          }

          if (metric.key === 'rent_or_kost_monthly' || metric.key === 'rent_monthly') {
            rent_or_kost_monthly = val.value;
          } else if (metric.key === 'food_meal_avg') {
            food_meal_avg = val.value;
          } else if (metric.key === 'transport_monthly') {
            transport_monthly = val.value;
          } else if (metric.key === 'grocery_basket') {
            grocery_basket = val.value;
          }
        }
      }

      if (areaValues.length === 0) {
        minConfidence = 'estimated';
      }

      const costBreakdown = calculateTotalCost({
        rent_or_kost_monthly,
        food_meal_avg,
        transport_monthly,
        grocery_basket,
      });

      results.push({
        area,
        city,
        country,
        rent_or_kost_monthly: costBreakdown.rent_or_kost_monthly,
        food_meal_avg: costBreakdown.food_meal_avg,
        food_cost_monthly: costBreakdown.food_cost_monthly,
        transport_monthly: costBreakdown.transport_monthly,
        grocery_monthly: costBreakdown.grocery_monthly,
        total_monthly_cost: costBreakdown.total_monthly_cost,
        confidence: minConfidence,
        sample_size: totalSampleSize,
        metric_values: metricValuesMap,
      });
    }

    return results;
  }

  public async insertAreaMetric(input: InsertAreaMetricInput): Promise<InsertAreaMetricResult> {
    const area = this.areas.find((a) => a.id === input.area_id);
    const city = area ? this.cities.find((c) => c.id === area.city_id) : undefined;
    const country = city ? this.countries.find((co) => co.id === city.country_id) : undefined;

    if (!input.currency_code && country) {
      input.currency_code = country.currency_code;
    }

    const targetMetric = this.metrics.find(
      (m) => m.key === input.metric_key || (input.metric_key === 'rent_monthly' && m.key === 'rent_or_kost_monthly')
    );
    const recentCount = this.submissions.filter(
      (s) => s.area_id === input.area_id && (!targetMetric || s.metric_id === targetMetric.id)
    ).length;

    const validation = validateAreaMetricInput(input, {
      area,
      country,
      validMetrics: this.metrics,
      recentSubmissionsCount: recentCount,
    });

    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason,
      };
    }

    const insertedId = generateUUID();
    const newSubmission: Submission = {
      id: insertedId,
      area_id: input.area_id,
      metric_id: validation.metricId!,
      value: input.value,
      note: input.note || `Observed via ${input.source_type || 'agent_bootstrap'}`,
      evidence_url: input.source_url,
      source_type: input.source_type || 'agent_bootstrap',
      agent_confidence: input.agent_confidence || 'medium',
      observed_at: input.observed_at || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: 'accepted',
    };

    this.submissions.push(newSubmission);

    if (this.supabase) {
      try {
        await this.supabase.from('submissions').insert({
          id: insertedId,
          area_id: newSubmission.area_id,
          metric_id: newSubmission.metric_id,
          value: newSubmission.value,
          note: newSubmission.note,
          evidence_url: newSubmission.evidence_url,
          source_type: newSubmission.source_type,
          agent_confidence: newSubmission.agent_confidence,
          observed_at: newSubmission.observed_at,
          status: 'accepted',
        });
      } catch (e) {
        console.warn('Supabase submission insert failed, saved to local store:', e);
      }
    }

    return {
      success: true,
      inserted_id: insertedId,
    };
  }

  public async submitUserFact(input: {
    area_id: string;
    metric_key: string;
    value: number;
    note?: string;
    evidence_url?: string;
    submitted_by?: string;
  }): Promise<InsertAreaMetricResult> {
    const normalizedKey = input.metric_key === 'rent_monthly' ? 'rent_or_kost_monthly' : input.metric_key;
    const metric = this.metrics.find((m) => m.key === normalizedKey);
    if (!metric) {
      return { success: false, reason: `Unknown metric key: ${input.metric_key}` };
    }

    if (isNaN(input.value) || input.value <= 0) {
      return { success: false, reason: 'Value must be strictly positive (greater than 0).' };
    }

    const insertedId = generateUUID();
    this.submissions.push({
      id: insertedId,
      area_id: input.area_id,
      metric_id: metric.id,
      value: input.value,
      note: input.note || 'User submitted community observation',
      evidence_url: input.evidence_url,
      submitted_by: input.submitted_by || 'community_user',
      source_type: 'user_fact',
      agent_confidence: 'medium',
      observed_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: 'accepted',
    });

    if (this.supabase) {
      try {
        await this.supabase.from('submissions').insert({
          id: insertedId,
          area_id: input.area_id,
          metric_id: metric.id,
          value: input.value,
          note: input.note || 'User submitted community observation',
          evidence_url: input.evidence_url,
          submitted_by: input.submitted_by || 'community_user',
          source_type: 'user_fact',
          agent_confidence: 'medium',
          observed_at: new Date().toISOString().split('T')[0],
          status: 'accepted',
        });
      } catch (e) {
        console.warn('Supabase submitUserFact insert failed, saved to local store:', e);
      }
    }

    return { success: true, inserted_id: insertedId };
  }

  public async recomputeAreaMetrics(areaId: string): Promise<{ success: boolean; area_id: string }> {
    const area = this.areas.find((a) => a.id === areaId);
    if (!area) return { success: false, area_id: areaId };

    if (this.supabase) {
      try {
        await this.supabase.rpc('recompute_area_metrics', { p_area_id: areaId });
      } catch (e) {
        console.warn('Supabase recompute_area_metrics RPC failed, fell back to local recompute:', e);
      }
    }


    for (const metric of this.metrics) {
      const subs = this.submissions.filter(
        (s) => s.area_id === areaId && s.metric_id === metric.id && s.status === 'accepted'
      );

      if (subs.length > 0) {
        const values = subs.map((s) => s.value).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

        let confidence: ConfidenceLevel = 'estimated';
        if (values.length >= 20) {
          confidence = 'high';
        } else if (values.length >= 5) {
          confidence = 'medium';
        } else if (values.length >= 1) {
          confidence = 'low';
        }

        const existingIdx = this.areaMetricValues.findIndex(
          (v) => v.area_id === areaId && v.metric_id === metric.id
        );

        const updatedVal: AreaMetricValue = {
          id: existingIdx >= 0 ? this.areaMetricValues[existingIdx].id : generateUUID(),
          area_id: areaId,
          metric_id: metric.id,
          value: Math.round(median),
          confidence,
          sample_size: values.length,
          computed_at: new Date().toISOString(),
          metric,
        };

        if (existingIdx >= 0) {
          this.areaMetricValues[existingIdx] = updatedVal;
        } else {
          this.areaMetricValues.push(updatedVal);
        }
      }
    }

    const city = this.cities.find((c) => c.id === area.city_id);
    if (city) {
      const cityAreas = this.areas.filter((a) => a.city_id === city.id);
      const allCityVals = this.areaMetricValues.filter((v) => cityAreas.some((a) => a.id === v.area_id));

      if (allCityVals.some((v) => v.confidence === 'low' || v.confidence === 'estimated')) {
        city.data_confidence = 'low';
      } else if (allCityVals.some((v) => v.confidence === 'medium')) {
        city.data_confidence = 'medium';
      } else if (allCityVals.length > 0) {
        city.data_confidence = 'high';
      }

      city.bootstrap_status = 'enriched';
      city.last_refreshed_at = new Date().toISOString();
    }

    return { success: true, area_id: areaId };
  }
}

export const db = new AppDatabase();
