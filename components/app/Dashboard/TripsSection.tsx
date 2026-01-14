'use client';

import { useState } from 'react';
import { Search, Filter, List, Grid as GridIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TripCard } from './TripCard';
import type { LatestRun } from '@/hooks/useLatestRun';

interface Trip {
  _id: string;
  title?: string;
  origin?: string;
  destination?: string;
  tripDates?: {
    start?: string;
    end?: string;
  };
  travelers?: number;
  progress?: {
    percentComplete: number;
    hasOrigin?: boolean;
    hasDestination?: boolean;
    hasDates?: boolean;
    hasItinerary?: boolean;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  tripContext?: {
    origin?: string;
    destination?: string;
    tripDates?: {
      start?: string;
      end?: string;
    };
    numberOfTravelers?: number;
  };
}

interface TripsSectionProps {
  trips: Trip[];
  runs: Map<string, LatestRun>;
  loading?: boolean;
}

export function TripsSection({ trips, runs, loading }: TripsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'final'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    // Search filter
    const title = trip.title || `${trip.origin || trip.tripContext?.origin} to ${trip.destination || trip.tripContext?.destination}`;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const isFinal = trip.status === 'final' || (trip.progress?.percentComplete ?? 0) >= 100;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'planning' && !isFinal) ||
      (statusFilter === 'final' && isFinal);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">All Trips</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">All Trips</h3>
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <Filter className="text-gray-500 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'planning' | 'final')}
              className="text-sm text-gray-700 border-none focus:ring-0 bg-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="final">Final</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:flex-initial">
            <Input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm w-full sm:w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="hidden sm:flex"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="hidden sm:flex"
          >
            <GridIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-indigo-600 w-12 h-12" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No trips found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No trips match "${searchQuery}". Try a different search term.`
                : 'No trips match the selected filter. Try changing your filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'lg:grid-cols-2' : ''} gap-4 sm:gap-6`}>
          {filteredTrips.map((trip) => (
            <TripCard key={trip._id} trip={trip} latestRun={runs.get(trip._id)} />
          ))}
        </div>
      )}
    </section>
  );
}
