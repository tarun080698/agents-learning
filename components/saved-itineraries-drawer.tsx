'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from '@/components/ui/drawer';
import { Trash2, Calendar, Eye } from 'lucide-react';
import type { MergedItinerary, TripContext } from '@/lib/schemas/agent';

interface SavedItinerary {
  _id: string;
  itinerary: MergedItinerary;
  tripContext?: TripContext | null;
  savedAt: string;
  name?: string;
}

interface SavedItinerariesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string | null;
  onSelectItinerary?: (itinerary: MergedItinerary, tripContext?: TripContext | null) => void;
}

export function SavedItinerariesDrawer({
  open,
  onOpenChange,
  tripId,
  onSelectItinerary,
}: SavedItinerariesDrawerProps) {
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<SavedItinerary | null>(null);

  useEffect(() => {
    if (open && tripId) {
      loadItineraries();
    }
  }, [open, tripId]);

  const loadItineraries = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/trips/${tripId}/itineraries`);
      if (!response.ok) throw new Error('Failed to load itineraries');
      const data = await response.json();
      setItineraries(data);
    } catch (error) {
      console.error('Error loading itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itineraryId: string) => {
    if (!tripId) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/itineraries?itineraryId=${itineraryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete itinerary');

      // Remove from local state
      setItineraries(prev => prev.filter(it => it._id !== itineraryId));

      // Clear selected if it was the deleted one
      if (selectedItinerary?._id === itineraryId) {
        setSelectedItinerary(null);
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error);
    }
  };

  const handleView = (itinerary: SavedItinerary) => {
    setSelectedItinerary(itinerary);
  };

  const handleLoadItinerary = () => {
    if (selectedItinerary && onSelectItinerary) {
      onSelectItinerary(selectedItinerary.itinerary, selectedItinerary.tripContext);
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Saved Itineraries</DrawerTitle>
          <DrawerDescription>
            View and manage your saved travel itineraries
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Loading itineraries...</p>
            </div>
          ) : itineraries.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 text-center">
                No saved itineraries yet.<br />
                Save an itinerary to see it here.
              </p>
            </div>
          ) : selectedItinerary ? (
            // Detail view
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItinerary(null)}
                >
                  ← Back to list
                </Button>
                <Button
                  size="sm"
                  onClick={handleLoadItinerary}
                >
                  Load this itinerary
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{selectedItinerary.name}</CardTitle>
                  <CardDescription>
                    Saved on {new Date(selectedItinerary.savedAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <ItineraryDetails itinerary={selectedItinerary.itinerary} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            // List view
            <div className="space-y-3">
              {itineraries.map((item) => (
                <Card key={item._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {item.name || 'Untitled Itinerary'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.savedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {item.itinerary.summary}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        {item.itinerary.days.length} days
                      </Badge>
                      {item.tripContext && (
                        <>
                          {item.tripContext.trip.budget.level && (
                            <Badge variant="outline">
                              {item.tripContext.trip.budget.level} budget
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// Component to render itinerary details
function ItineraryDetails({ itinerary }: { itinerary: MergedItinerary }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Summary</h3>
        <p className="text-sm text-slate-600">{itinerary.summary}</p>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Daily Itinerary</h3>
        <div className="space-y-4">
          {itinerary.days.map((day) => (
            <Card key={day.dayNumber}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Day {day.dayNumber} - {day.date}
                </CardTitle>
                <CardDescription className="text-xs">{day.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {day.transport && (
                  <div>
                    <span className="font-medium">🚗 Transport:</span>
                    <p className="text-xs text-slate-600 mt-1">
                      {JSON.stringify(day.transport)}
                    </p>
                  </div>
                )}

                {day.accommodation && (
                  <div>
                    <span className="font-medium">🏨 Accommodation:</span>
                    <p className="text-xs text-slate-600 mt-1">
                      {day.accommodation.name}
                      {day.accommodation.area && ` (${day.accommodation.area})`}
                    </p>
                  </div>
                )}

                {day.meals && day.meals.length > 0 && (
                  <div>
                    <span className="font-medium">🍽️ Meals:</span>
                    <ul className="text-xs text-slate-600 mt-1 space-y-1">
                      {day.meals.map((meal, idx) => (
                        <li key={idx}>
                          {meal.type}: {JSON.stringify(meal.recommendation)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {day.activities && day.activities.length > 0 && (
                  <div>
                    <span className="font-medium">🎯 Activities:</span>
                    <ul className="text-xs text-slate-600 mt-1 space-y-1">
                      {day.activities.map((activity, idx) => (
                        <li key={idx}>
                          {activity.time}: {activity.description}
                          {activity.location && ` (${activity.location})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
