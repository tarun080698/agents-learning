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
      <CardHeader className="shrink-0">
        <CardTitle>Your Trips</CardTitle>
        <CardDescription>Create and manage your travel plans</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-6 overflow-hidden min-h-0">
        <div className="flex gap-2 shrink-0">
          <Button onClick={onNewTrip} disabled={loading} className="flex-1">
            + New Trip
          </Button>
          {onViewSavedItineraries && selectedTripId && (
            <Button
              onClick={onViewSavedItineraries}
              disabled={loading}
              variant="outline"
              className="shrink-0"
            >
              <BookOpen className="w-4 h-4" /> Saved Itineraries
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin min-h-0">
          {trips.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No trips yet. Create your first trip!
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => onSelectTrip(trip._id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors relative group ${
                    selectedTripId === trip._id
                      ? 'bg-slate-100 border-slate-400'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">Trip {trip._id.slice(-6)}</div>
                      <div className="text-sm text-slate-500">
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
