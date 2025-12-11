/**
 * MOTIS API Client using @motis-project/motis-client
 * Documentation: https://transitous.org/api/
 */

import { geocode, plan, type Match, type Place, type PlanResponse, type GeocodeResponse } from '@motis-project/motis-client';

const MOTIS_API_BASE = 'https://api.transitous.org';

export interface Location {
  lat: number;
  lng: number;
  name?: string;
  id?: string; // Station ID (e.g., "PY05") - will be prefixed with "my-rail-kl_" when used in API
}

/**
 * Search for routes between two locations using MOTIS plan API
 * Uses Place format: "lat,lng" or stop ID
 */
export async function searchRoutes(
  from: Location,
  to: Location,
  startTime?: Date
): Promise<PlanResponse> {
  const fromPlace = from.id ? `my-rail-kl_${from.id}` : `${from.lat},${from.lng}`;
  const toPlace = to.id ? `my-rail-kl_${to.id}` : `${to.lat},${to.lng}`;
  
  const query = {
    fromPlace,
    toPlace,
    arriveBy: false,
    detailedTransfers: false,
    transitModes: "WALK,BUS,RAIL",
    fastestDirectFactor: 1.5,
    joinInterlinedLegs:false,
    maxMatchingDistance:250,
    ...(startTime && { time: startTime.toISOString() }),
  };

  try {
    const response = await plan({
      baseUrl: MOTIS_API_BASE,
      query: query as unknown as Parameters<typeof plan>[0]['query'],
    });

    if (response.error) {
      throw new Error(`MOTIS API error: ${JSON.stringify(response.error)}`);
    }

    return response.data as PlanResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch routes from MOTIS API');
  }
}

/**
 * Geocode a location name to coordinates using MOTIS geocode API
 */
export async function geocodeLocation(query: string): Promise<Match[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await geocode({
      baseUrl: MOTIS_API_BASE,
      query: {
        text: query.trim(),
      },
    });

    if (response.error) {
      console.error('Geocoding error:', response.error);
      return [];
    }

    return (response.data || []) as Match[];
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

export type { Match, Place, PlanResponse };

