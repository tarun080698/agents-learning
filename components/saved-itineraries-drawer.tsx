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
}

export function SavedItinerariesDrawer({
  open,
  onOpenChange,
  tripId,
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItinerary(null)}
                className="mb-2"
              >
                ← Back to list
              </Button>

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
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          Trip Summary
        </h3>
        <p className="text-slate-700 leading-relaxed">{itinerary.summary}</p>
      </div>

      <Separator />

      {/* Daily Itinerary */}
      <div>
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <span>📅</span> Day-by-Day Itinerary
        </h3>
        <div className="space-y-4">
          {itinerary.days.map((day) => (
            <Card key={day.dayNumber} className="border-2 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {day.dayNumber}
                      </span>
                      {day.title}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 ml-10">
                      {day.date}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Transport */}
                {day.transport && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-0.5">🚗</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 mb-2">Transportation</h4>
                        <div className="text-sm text-green-800">
                          {renderObject(day.transport)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-0.5">🏨</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-900 mb-1">Accommodation</h4>
                        <p className="font-medium text-purple-800">{day.accommodation.name}</p>
                        {day.accommodation.area && (
                          <p className="text-sm text-purple-700 mt-1">📍 {day.accommodation.area}</p>
                        )}
                        {day.accommodation.estimatedCost && (
                          <p className="text-sm text-purple-700 mt-1">💰 {day.accommodation.estimatedCost}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Meals */}
                {day.meals && day.meals.length > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-0.5">🍽️</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900 mb-2">Meals</h4>
                        <div className="space-y-2">
                          {day.meals.map((meal, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="inline-block bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-xs font-semibold uppercase mb-1">
                                {meal.type}
                              </span>
                              <div className="text-orange-800 ml-1">
                                {renderObject(meal.recommendation)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {day.activities && day.activities.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-0.5">🎯</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">Activities</h4>
                        <div className="space-y-2">
                          {day.activities.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <span className="font-semibold text-blue-700 min-w-[60px]">{activity.time}</span>
                              <div className="flex-1">
                                <p className="text-blue-900">{activity.description}</p>
                                {activity.location && (
                                  <p className="text-blue-600 text-xs mt-0.5">📍 {activity.location}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Alternative Options */}
      {itinerary.alternativeOptions && (
        <>
          <Separator />
          <div>
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <span>✨</span> Alternative Options
            </h3>
            <div className="space-y-4">
              {itinerary.alternativeOptions.transport && itinerary.alternativeOptions.transport.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <span>🚗</span> Alternative Transportation
                  </h4>
                  <div className="space-y-2">
                    {itinerary.alternativeOptions.transport.map((option, idx) => (
                      <Card key={idx} className="p-3 bg-green-50 border-green-100">
                        {renderObject(option)}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {itinerary.alternativeOptions.stays && itinerary.alternativeOptions.stays.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <span>🏨</span> Alternative Accommodation
                  </h4>
                  <div className="space-y-2">
                    {itinerary.alternativeOptions.stays.map((option, idx) => (
                      <Card key={idx} className="p-3 bg-purple-50 border-purple-100">
                        {renderObject(option)}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {itinerary.alternativeOptions.dining && itinerary.alternativeOptions.dining.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <span>🍽️</span> Alternative Dining
                  </h4>
                  <div className="space-y-2">
                    {itinerary.alternativeOptions.dining.map((option, idx) => (
                      <Card key={idx} className="p-3 bg-orange-50 border-orange-100">
                        {renderObject(option)}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to render objects in a readable way
function renderObject(obj: unknown): React.ReactNode {
  if (!obj) return null;

  if (typeof obj === 'string') return <p className="leading-relaxed">{obj}</p>;
  if (typeof obj === 'number') return <p>{obj}</p>;

  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj);
    if (entries.length === 0) return null;

    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => {
          // Skip rendering null or undefined values
          if (value === null || value === undefined) return null;

          // Format the key to be more readable
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

          return (
            <div key={key} className="flex items-start gap-2">
              <span className="font-medium min-w-[100px]">{formattedKey}:</span>
              <span className="flex-1">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return <p>{String(obj)}</p>;
}

