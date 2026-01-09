'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MergedItinerary, TripContext } from '@/lib/schemas/agent';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ItineraryPanelProps {
  itinerary: MergedItinerary | null;
  tripContext?: TripContext | null;
  onSelectOption?: (type: string, option: unknown) => void;
}

export function ItineraryPanel({ itinerary, tripContext }: ItineraryPanelProps) {
  const [copiedItinerary, setCopiedItinerary] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);

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

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>🎉 Your Itinerary</CardTitle>
            <CardDescription>{itinerary.summary}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyItinerary}
              className="shrink-0"
            >
              {copiedItinerary ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1">{copiedItinerary ? 'Copied!' : 'Copy'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJSON}
              className="shrink-0"
            >
              {copiedJSON ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1">JSON</span>
            </Button>
          </div>
        </div>

        {/* Badges for key preferences */}
        {tripContext && (
          <div className="flex gap-2 flex-wrap mt-3">
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

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Day-by-day cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Day-by-Day</h3>
              {itinerary.days.map((day) => (
                <Card key={day.dayNumber} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">Day {day.dayNumber}</CardTitle>
                        <CardDescription className="text-sm">{day.date} • {day.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Transport */}
                    {day.transport && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">🚗 Transport</p>
                        <div className="text-sm bg-slate-50 rounded p-2">
                          {renderObject(day.transport)}
                        </div>
                      </div>
                    )}

                    {/* Accommodation */}
                    {day.accommodation && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">🏨 Accommodation</p>
                        <div className="text-sm bg-slate-50 rounded p-2">
                          <p className="font-medium">{day.accommodation.name}</p>
                          {day.accommodation.area && (
                            <p className="text-xs text-slate-600">{day.accommodation.area}</p>
                          )}
                          {day.accommodation.estimatedCost && (
                            <p className="text-xs text-slate-600 mt-1">{day.accommodation.estimatedCost}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Meals */}
                    {day.meals && day.meals.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">🍽️ Meals</p>
                        <div className="space-y-2">
                          {day.meals.map((meal, mealIdx) => (
                            <div key={mealIdx} className="text-sm bg-slate-50 rounded p-2">
                              <Badge variant="outline" className="mb-1 text-xs">{meal.type}</Badge>
                              <div className="mt-1">{renderObject(meal.recommendation)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {day.activities && day.activities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">🎯 Activities</p>
                        <ul className="space-y-1 text-sm">
                          {day.activities.map((activity, actIdx) => (
                            <li key={actIdx} className="bg-slate-50 rounded p-2">
                              <span className="font-medium">{activity.time}:</span> {activity.description}
                              {activity.location && (
                                <span className="text-slate-600"> • {activity.location}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
        md += `- ${meal.type}: ${JSON.stringify(meal.recommendation)}\n`;
      });
      md += '\n';
    }

    if (day.activities && day.activities.length > 0) {
      md += `**Activities:**\n`;
      day.activities.forEach(activity => {
        md += `- ${activity.time}: ${activity.description}`;
        if (activity.location) md += ` (${activity.location})`;
        md += '\n';
      });
      md += '\n';
    }

    md += '---\n\n';
  });

  return md;
}
