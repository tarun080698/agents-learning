'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  loading: boolean;
}

export function TripsPanel({
  trips,
  selectedTripId,
  onSelectTrip,
  onNewTrip,
  loading
}: TripsPanelProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Your Trips</CardTitle>
        <CardDescription>Create and manage your travel plans</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-6 overflow-hidden min-h-0">
        <Button onClick={onNewTrip} disabled={loading} className="w-full flex-shrink-0">
          + New Trip
        </Button>

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
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTripId === trip._id
                      ? 'bg-slate-100 border-slate-400'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="font-medium">Trip {trip._id.slice(-6)}</div>
                  <div className="text-sm text-slate-500">
                    Status: {trip.status}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(trip.updatedAt).toLocaleDateString()}
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
