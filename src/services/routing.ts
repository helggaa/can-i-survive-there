// src/services/routing.ts
// Commute calculation service using OpenStreetMap OSRM with 100m grid commute_cache per 02-data-model-schema.md

import type { CommuteMode } from '../types/database.types';

export interface RouteDetail {
  mode: CommuteMode;
  duration_min: number;
  distance_km: number;
  is_available: boolean;
  status_note?: string;
}

export interface AreaCommuteSummary {
  area_id: string;
  selected_mode: CommuteMode;
  duration_min: number;
  distance_km: number;
  available_modes: RouteDetail[];
}

const localCommuteCache = new Map<string, RouteDetail>();

export function roundTo100m(val: number): number {
  return Math.round(val * 1000) / 1000;
}

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function calculateCommute(
  originLat: number,
  originLng: number,
  areaId: string,
  areaLat: number,
  areaLng: number,
  cityHasGtfsTransit: boolean = true
): Promise<AreaCommuteSummary> {
  const roundedLat = roundTo100m(originLat);
  const roundedLng = roundTo100m(originLng);
  const cachePrefix = `${roundedLat},${roundedLng}:${areaId}`;

  const cachedDrive = localCommuteCache.get(`${cachePrefix}:drive`);
  const cachedTransit = localCommuteCache.get(`${cachePrefix}:transit`);
  const cachedWalk = localCommuteCache.get(`${cachePrefix}:walk`);
  const cachedBike = localCommuteCache.get(`${cachePrefix}:bike`);

  if (cachedDrive && cachedTransit && cachedWalk) {
    return {
      area_id: areaId,
      selected_mode: 'drive',
      duration_min: cachedDrive.duration_min,
      distance_km: cachedDrive.distance_km,
      available_modes: [cachedDrive, cachedTransit, cachedWalk, cachedBike].filter(Boolean) as RouteDetail[],
    };
  }

  const straightDistanceKm = calculateHaversineDistanceKm(originLat, originLng, areaLat, areaLng);
  const roadDistanceKm = Number((straightDistanceKm * 1.35).toFixed(1));

  let driveDurationMin = Math.max(5, Math.round((roadDistanceKm / 24) * 60));
  let driveDistanceKm = roadDistanceKm;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${areaLng},${areaLat}?overview=false`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        driveDistanceKm = Number((route.distance / 1000).toFixed(1));
        driveDurationMin = Math.max(5, Math.round((route.duration / 60) * 1.3));
      }
    }
  } catch {
    // geometric road estimate fallback
  }

  const bikeDurationMin = Math.max(4, Math.round(driveDurationMin * 0.75));
  const transitDurationMin = Math.max(8, Math.round(driveDurationMin * 1.25 + 5));
  const walkDurationMin = Math.round((roadDistanceKm / 4.8) * 60);

  const driveDetail: RouteDetail = {
    mode: 'drive',
    duration_min: driveDurationMin,
    distance_km: driveDistanceKm,
    is_available: true,
    status_note: 'Estimated driving / taxi duration in typical traffic',
  };

  const bikeDetail: RouteDetail = {
    mode: 'bike',
    duration_min: bikeDurationMin,
    distance_km: driveDistanceKm,
    is_available: true,
    status_note: 'Motorbike / scooter duration',
  };

  const transitDetail: RouteDetail = {
    mode: 'transit',
    duration_min: transitDurationMin,
    distance_km: driveDistanceKm,
    is_available: cityHasGtfsTransit,
    status_note: cityHasGtfsTransit
      ? 'Estimated transit bus / metro route'
      : 'No scheduled public transit data available for this city yet',
  };

  const walkDetail: RouteDetail = {
    mode: 'walk',
    duration_min: walkDurationMin,
    distance_km: roadDistanceKm,
    is_available: walkDurationMin <= 120,
    status_note: walkDurationMin <= 120 ? 'Direct walking route' : 'Too far for daily walking',
  };

  localCommuteCache.set(`${cachePrefix}:drive`, driveDetail);
  localCommuteCache.set(`${cachePrefix}:bike`, bikeDetail);
  localCommuteCache.set(`${cachePrefix}:transit`, transitDetail);
  localCommuteCache.set(`${cachePrefix}:walk`, walkDetail);

  return {
    area_id: areaId,
    selected_mode: 'drive',
    duration_min: driveDurationMin,
    distance_km: driveDistanceKm,
    available_modes: [driveDetail, bikeDetail, transitDetail, walkDetail],
  };
}
