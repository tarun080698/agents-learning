import { useMemo } from 'react';
import type { LatestRun, Task } from './useLatestRun';

interface Trip {
  _id: string;
  status: string;
  progress?: {
    percentComplete: number;
    hasOrigin?: boolean;
    hasDestination?: boolean;
    hasDates?: boolean;
    hasItinerary?: boolean;
  };
}

export interface DashboardStats {
  totalTrips: number;
  inPlanning: number;
  finalized: number;
  activeAgents: number;
}

export function useDashboardDerivedStats(
  trips: Trip[],
  runs: Map<string, LatestRun>
): DashboardStats {
  return useMemo(() => {
    const totalTrips = trips.length;

    // Count trips in planning (not 100% complete)
    const inPlanning = trips.filter(
      (trip) => (trip.progress?.percentComplete ?? 0) < 100
    ).length;

    // Count finalized trips (100% complete or status === 'final')
    const finalized = trips.filter(
      (trip) =>
        trip.status === 'final' || (trip.progress?.percentComplete ?? 0) >= 100
    ).length;

    // Count active agents across all latest runs
    let activeAgents = 0;
    runs.forEach((run) => {
      if (run.tasks) {
        const runningTasks = run.tasks.filter((task: Task) => task.status === 'running');
        activeAgents += runningTasks.length;
      }
    });

    return {
      totalTrips,
      inPlanning,
      finalized,
      activeAgents,
    };
  }, [trips, runs]);
}
