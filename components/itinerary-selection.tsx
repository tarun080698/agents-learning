'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import type { MultipleItineraries, ItineraryOption, MergedItinerary } from '@/lib/schemas/agent';

interface ItinerarySelectionProps {
  multipleItineraries: MultipleItineraries;
  onSelect: (itinerary: MergedItinerary, option: ItineraryOption) => void;
  loading?: boolean;
}

export function ItinerarySelection({ multipleItineraries, onSelect, loading }: ItinerarySelectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSelect = (option: ItineraryOption) => {
    setSelectedId(option.id);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    const selectedOption = multipleItineraries.options.find(opt => opt.id === selectedId);
    if (selectedOption) {
      onSelect(selectedOption.itinerary, selectedOption);
    }
  };

  const handleExpand = (optionId: string) => {
    setExpandedId(expandedId === optionId ? null : optionId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-lg">Choose Your Perfect Itinerary</h3>
        </div>
        <p className="text-sm text-slate-600">
          I've created {multipleItineraries.options.length} different options for your trip.
          Review and select the one that best fits your style!
        </p>
        {multipleItineraries.comparisonNote && (
          <p className="text-xs text-slate-500 mt-2 italic">
            {multipleItineraries.comparisonNote}
          </p>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {multipleItineraries.options.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all ${
              selectedId === option.id
                ? 'border-blue-500 border-2 shadow-lg'
                : 'hover:border-slate-300 hover:shadow-md'
            }`}
            onClick={() => handleSelect(option)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    {selectedId === option.id && (
                      <div className="bg-blue-500 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </div>
              </div>

              {/* Tags */}
              {option.tags && option.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {option.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {/* Estimated Cost */}
              {option.estimatedTotalCost && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-slate-700">
                    💰 Estimated Total: <span className="text-green-700">{option.estimatedTotalCost}</span>
                  </p>
                </div>
              )}

              {/* Highlights */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">✨ Highlights:</p>
                <ul className="space-y-1">
                  {option.highlights.map((highlight, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* View Details Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand(option.id);
                }}
                className="w-full"
              >
                {expandedId === option.id ? 'Hide Details' : 'View Full Itinerary'}
              </Button>

              {/* Expanded Details */}
              {expandedId === option.id && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      <p className="text-sm font-medium text-slate-700">{option.itinerary.summary}</p>
                      <Separator />
                      {option.itinerary.days.map((day) => (
                        <div key={day.dayNumber} className="text-xs">
                          <p className="font-semibold text-slate-800">
                            Day {day.dayNumber}: {day.title}
                          </p>
                          <p className="text-slate-600">{day.date}</p>
                          {day.accommodation && (
                            <p className="text-slate-600 mt-1">
                              🏨 {day.accommodation.name}
                            </p>
                          )}
                          {day.activities && day.activities.length > 0 && (
                            <p className="text-slate-600 mt-1">
                              🎯 {day.activities.length} activities planned
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirm Button */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          onClick={handleConfirm}
          disabled={!selectedId || loading}
          size="lg"
          className="px-8"
        >
          {loading ? 'Saving...' : 'Confirm & Save Selected Itinerary'}
        </Button>
      </div>
    </div>
  );
}
