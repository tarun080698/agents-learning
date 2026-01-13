'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Trip {
  _id: string;
  userId: string;
  status: string;
  tripContext: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface TripsPanelProps {
  userId: string;
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onNewTrip: () => void;
  onViewSavedItineraries?: () => void;
  onDeleteTrip?: (tripId: string) => void;
  loading: boolean;
}

export function TripsPanel({
  trips,
  selectedTripId,
  onSelectTrip,
  onNewTrip,
  onViewSavedItineraries,
  onDeleteTrip,
  loading
}: TripsPanelProps) {
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation(); // Prevent trip selection when clicking delete

    if (!confirm('Are you sure you want to delete this trip? This will remove all messages and itineraries.')) {
      return;
    }

    setDeletingTripId(tripId);
    if (onDeleteTrip) {
      await onDeleteTrip(tripId);
    }
    setDeletingTripId(null);
  };
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg md:text-xl">Your Trips</CardTitle>
            <CardDescription className="text-sm">Create and manage your travel plans</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 md:gap-4 p-4 md:p-6 overflow-hidden min-h-0">
        <div className="flex flex-col md:flex-row gap-2 shrink-0">
          <Button
            onClick={onNewTrip}
            disabled={loading}
            className="w-full md:flex-1 min-h-[44px] md:min-h-0 text-base md:text-sm"
          >
            + New Trip
          </Button>
          {onViewSavedItineraries && selectedTripId && (
            <Button
              onClick={onViewSavedItineraries}
              disabled={loading}
              variant="outline"
              className="w-full md:w-auto md:shrink-0 min-h-[44px] md:min-h-0 text-base md:text-sm"
            >
              <BookOpen className="w-4 h-4" /> <span className="ml-2">Saved Itineraries</span>
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-3 md:pr-4 scrollbar-thin min-h-0">
          {trips.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No trips yet. Create your first trip!
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => onSelectTrip(trip._id)}
                  className={`p-4 md:p-3 rounded-lg border cursor-pointer transition-colors relative group min-h-[68px] md:min-h-0 ${
                    selectedTripId === trip._id
                      ? 'bg-slate-100 border-slate-400'
                      : 'hover:bg-slate-50 border-slate-200 active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base md:text-sm truncate">Trip {trip._id.slice(-6)}</div>
                      <div className="text-sm md:text-xs text-slate-500">
                        Status: {trip.status}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(trip.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, trip._id)}
                      disabled={deletingTripId === trip._id}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] md:h-8 md:w-8 p-0 shrink-0"
                      aria-label="Delete trip"
                    >
                      <Trash2 className="w-5 h-5 md:w-4 md:h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
