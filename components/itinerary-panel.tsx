'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MergedItinerary, TripContext } from '@/lib/schemas/agent';
import { Copy, CheckCircle2, Save, BookmarkPlus } from 'lucide-react';
import { useState } from 'react';

interface ItineraryPanelProps {
  itinerary: MergedItinerary | null;
  tripContext?: TripContext | null;
  tripId?: string | null;
  onSelectOption?: (type: string, option: unknown) => void;
  onSaved?: () => void;
}

export function ItineraryPanel({ itinerary, tripContext, tripId, onSaved }: ItineraryPanelProps) {
  const [copiedItinerary, setCopiedItinerary] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!itinerary) {
    return (
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle>Itinerary</CardTitle>
          <CardDescription>Your trip itinerary will appear here</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 italic">Complete your trip planning to generate an itinerary</p>
        </CardContent>
      </Card>
    );
  }

  const handleCopyItinerary = async () => {
    const markdown = generateMarkdownItinerary(itinerary);
    await navigator.clipboard.writeText(markdown);
    setCopiedItinerary(true);
    setTimeout(() => setCopiedItinerary(false), 2000);
  };

  const handleCopyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(itinerary, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleSaveItinerary = async () => {
    if (!tripId || !itinerary) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/trips/${tripId}/itineraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          tripContext,
          name: `${itinerary.summary.substring(0, 50)}${itinerary.summary.length > 50 ? '...' : ''}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to save itinerary');

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg md:text-xl">🎉 Your Itinerary</CardTitle>
            <CardDescription className="text-sm">{itinerary.summary}</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveItinerary}
              disabled={saving || !tripId}
              className="shrink-0 min-h-11 md:min-h-9"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              <span className="ml-1.5">{saved ? 'Saved!' : 'Save'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyItinerary}
              className="shrink-0 min-h-11 md:min-h-9"
            >
              {copiedItinerary ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5">{copiedItinerary ? 'Copied!' : 'Copy'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJSON}
              className="shrink-0 min-h-11 md:min-h-9"
            >
              {copiedJSON ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5">JSON</span>
            </Button>
          </div>
        </div>

        {/* Badges for key preferences */}
        {tripContext && (
          <div className="flex gap-2 flex-wrap mt-4">
            {tripContext.trip.preferences.pace && (
              <Badge variant="secondary">{tripContext.trip.preferences.pace} pace</Badge>
            )}
            {tripContext.trip.budget.level && (
              <Badge variant="secondary">{tripContext.trip.budget.level} budget</Badge>
            )}
            {tripContext.trip.preferences.dietary.length > 0 && (
              <Badge variant="secondary">{tripContext.trip.preferences.dietary.join(', ')}</Badge>
            )}
            {tripContext.trip.constraints.avoid.some(item => item.toLowerCase().includes('peanut')) && (
              <Badge variant="destructive" className="animate-pulse">⚠️ Peanut Allergy</Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-4 md:p-6">
        <ScrollArea className="h-full">
          <div className="space-y-4 md:space-y-6 pr-3 md:pr-4">
            {/* Day-by-day accordions */}
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-semibold">Day-by-Day</h3>
              {itinerary.days && itinerary.days.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2 md:space-y-3">
                  {itinerary.days.map((day) => (
                    <AccordionItem key={day.dayNumber} value={`day-${day.dayNumber}`} className="border rounded-lg px-4 bg-white">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-col items-start text-left w-full">
                          <div className="font-semibold text-base">Day {day.dayNumber}</div>
                          <div className="text-sm text-slate-600 mt-0.5">{day.date} • {day.title}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2">
                        <div className="space-y-4">
                          {/* Transport */}
                          {day.transport && (
                            <div className="bg-slate-50 p-3 rounded-md">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">🚗 Transport</h4>
                              <p className="text-sm text-slate-700">{renderValue(day.transport)}</p>
                            </div>
                          )}

                          {/* Accommodation */}
                          {day.accommodation && (
                            <div className="bg-slate-50 p-3 rounded-md">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">🏨 Accommodation</h4>
                              <div className="text-sm text-slate-700 space-y-1">
                                <div><strong>Name:</strong> {day.accommodation.name}</div>
                                {day.accommodation.area && <div><strong>Area:</strong> {day.accommodation.area}</div>}
                                {day.accommodation.estimatedCost && (
                                  <div><strong>Cost:</strong> {day.accommodation.estimatedCost}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Meals */}
                          {day.meals && day.meals.length > 0 && (
                            <div className="bg-slate-50 p-3 rounded-md">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">🍽️ Meals</h4>
                              <ul className="space-y-2 text-sm text-slate-700">
                                {day.meals.map((meal, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    <strong className="text-slate-900">{meal.type}:</strong> {typeof meal.suggestion === 'string' ? meal.suggestion : renderValue(meal.suggestion)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Activities */}
                          {day.activities && day.activities.length > 0 && (
                            <div className="bg-slate-50 p-3 rounded-md">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">🎯 Activities</h4>
                              <ul className="space-y-2 text-sm text-slate-700">
                                {day.activities.map((activity, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {activity.name && <strong className="text-slate-900">{activity.name}</strong>}
                                    {activity.time && <span className="text-slate-600"> ({activity.time})</span>}
                                    {activity.duration && <span className="text-slate-600"> - {activity.duration}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No itinerary days found. Please generate an itinerary first.</p>
                </div>
              )}
            </div>

            {/* Alternative Options */}
            {itinerary.alternativeOptions && (
              <>
                <Separator />
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="alternatives">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      ✨ Alternative Options ({countAlternatives(itinerary.alternativeOptions)})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {itinerary.alternativeOptions.transport && itinerary.alternativeOptions.transport.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Transport</h4>
                            <div className="space-y-2">
                              {itinerary.alternativeOptions.transport.map((option, idx) => (
                                <Card key={idx} className="p-3 text-sm">
                                  {renderObject(option)}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {itinerary.alternativeOptions.stays && itinerary.alternativeOptions.stays.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Stays</h4>
                            <div className="space-y-2">
                              {itinerary.alternativeOptions.stays.map((option, idx) => (
                                <Card key={idx} className="p-3 text-sm">
                                  {renderObject(option)}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {itinerary.alternativeOptions.dining && itinerary.alternativeOptions.dining.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Dining</h4>
                            <div className="space-y-2">
                              {itinerary.alternativeOptions.dining.map((option, idx) => (
                                <Card key={idx} className="p-3 text-sm">
                                  {renderObject(option)}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper to render simple values
function renderValue(value: unknown): React.ReactNode {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return renderObject(value);
}

// Helper to render unknown objects gracefully
function renderObject(obj: unknown): React.ReactNode {
  if (!obj) return null;

  if (typeof obj === 'string') return <p>{obj}</p>;
  if (typeof obj === 'number') return <p>{obj}</p>;

  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj);
    if (entries.length === 0) return null;

    // Check if it's a simple key-value object
    const hasSimpleValues = entries.every(([, v]) => typeof v === 'string' || typeof v === 'number' || v === null);

    if (hasSimpleValues) {
      return (
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium">{value !== null ? String(value) : 'N/A'}</span>
            </div>
          ))}
        </div>
      );
    }

    // Otherwise render as JSON
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  }

  return <p>{String(obj)}</p>;
}

// Helper to count alternatives
function countAlternatives(alternatives: { transport?: unknown[]; stays?: unknown[]; dining?: unknown[] }): number {
  return (
    (alternatives.transport?.length || 0) +
    (alternatives.stays?.length || 0) +
    (alternatives.dining?.length || 0)
  );
}

// Generate markdown itinerary for copying
function generateMarkdownItinerary(itinerary: MergedItinerary): string {
  let md = `# Travel Itinerary\n\n${itinerary.summary}\n\n`;

  itinerary.days.forEach(day => {
    md += `## Day ${day.dayNumber} - ${day.date}\n### ${day.title}\n\n`;

    if (day.transport) {
      md += `**Transport:**\n${JSON.stringify(day.transport, null, 2)}\n\n`;
    }

    if (day.accommodation) {
      md += `**Accommodation:** ${day.accommodation.name}`;
      if (day.accommodation.area) md += ` (${day.accommodation.area})`;
      if (day.accommodation.estimatedCost) md += ` - ${day.accommodation.estimatedCost}`;
      md += '\n\n';
    }

    if (day.meals && day.meals.length > 0) {
      md += `**Meals:**\n`;
      day.meals.forEach(meal => {
        md += `- ${meal.type}: ${meal.suggestion}\n`;
        if (meal.estimatedCost) md += `  Cost: ${meal.estimatedCost}\n`;
      });
      md += '\n';
    }

    if (day.activities && day.activities.length > 0) {
      md += `**Activities:**\n`;
      day.activities.forEach(activity => {
        md += `- ${activity.name}`;
        if (activity.time) md += ` (${activity.time})`;
        if (activity.duration) md += ` - ${activity.duration}`;
        md += '\n';
        if (activity.description) md += `  ${activity.description}\n`;
        if (activity.estimatedCost) md += `  Cost: ${activity.estimatedCost}\n`;
      });
      md += '\n';
    }

    md += '---\n\n';
  });

  return md;
}
