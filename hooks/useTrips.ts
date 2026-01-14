"use client";

import { useState, useEffect } from "react";

export interface Trip {
  _id: string;
  userId: string;
  status: "draft" | "planning" | "final";
  title?: string;
  origin?: string;
  destination?: string;
  tripDates?: {
    start?: string;
    end?: string;
  };
  progress?: {
    hasDestination: boolean;
    hasOrigin: boolean;
    hasDates: boolean;
    hasItinerary: boolean;
    percentComplete: number;
  };
  metadata?: {
    numTravelers?: number;
    budget?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseTripsReturn {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch trips for a user
 * GET /api/trips?userId={userId}
 */
export function useTrips(userId: string | null): UseTripsReturn {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    if (!userId) {
      setTrips([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips?userId=${encodeURIComponent(userId)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }

      const data = (await response.json()) as Trip[];
      // Sort by updatedAt descending (most recent first)
      const sorted = data.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setTrips(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load trips";
      setError(message);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    trips,
    loading,
    error,
    refetch: fetchTrips,
  };
}
