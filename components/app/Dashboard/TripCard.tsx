'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, MoreVertical, Share, Download, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import type { LatestRun } from '@/hooks/useLatestRun';
import { formatDistanceToNow } from 'date-fns';

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

interface TripCardProps {
  trip: Trip;
  latestRun?: LatestRun | null;
}

export function TripCard({ trip, latestRun }: TripCardProps) {
  const router = useRouter();

  // Extract trip details from either top-level or tripContext
  const title = trip.title || `${trip.origin || trip.tripContext?.origin || 'Unknown'} to ${trip.destination || trip.tripContext?.destination || 'Unknown'}`;
  const origin = trip.origin || trip.tripContext?.origin || '—';
  const destination = trip.destination || trip.tripContext?.destination || '—';
  const startDate = trip.tripDates?.start || trip.tripContext?.tripDates?.start;
  const endDate = trip.tripDates?.end || trip.tripContext?.tripDates?.end;
  const travelers = trip.travelers || trip.tripContext?.numberOfTravelers || 0;
  const percentComplete = trip.progress?.percentComplete ?? 0;
  const isFinal = trip.status === 'final' || percentComplete >= 100;

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const dateRange = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : '—';

  // Get image for destination
  const getDestinationImage = () => {
    const dest = destination.toLowerCase();
    if (dest.includes('boston')) {
      return 'https://storage.googleapis.com/uxpilot-auth.appspot.com/e5ab0ad5ac-417b3a3e778ffa8ada87.png';
    } else if (dest.includes('miami')) {
      return 'https://storage.googleapis.com/uxpilot-auth.appspot.com/60d74fe5b6-d519cc7b1776e1b5dc20.png';
    }
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop';
  };

  // Get execution stage label
  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      clarify: 'Clarify',
      confirm: 'Confirm',
      dispatch: 'Dispatch',
      research: 'Research Phase',
      finalize: 'Finalize',
      completed: 'Completed',
      error: 'Error',
    };
    return labels[stage] || stage;
  };

  const handleContinue = () => {
    router.push(`/trips/${trip._id}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Hero Image */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={getDestinationImage()}
          alt={`${destination} trip`}
        />
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={isFinal ? 'final' : 'planning'} />
          <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
            {percentComplete}% Complete
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur rounded-full hover:bg-white"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </Button>
      </div>

      <div className="p-4 sm:p-6">
        {/* Title and Route */}
        <div className="mb-4">
          <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h4>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span className="truncate">{origin} → {destination}</span>
          </div>
        </div>

        {/* Dates and Travelers */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-gray-100 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs sm:text-sm">{dateRange}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs sm:text-sm">{travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Trip Progress</span>
            <span className="text-xs font-semibold text-indigo-600">{percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isFinal
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: 'Origin', completed: trip.progress?.hasOrigin },
              { label: 'Destination', completed: trip.progress?.hasDestination },
              { label: 'Dates', completed: trip.progress?.hasDates },
              { label: 'Itinerary', completed: trip.progress?.hasItinerary },
            ].map((step) => (
              <div key={step.label} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 ${
                    step.completed ? 'bg-green-100' : 'bg-gray-200'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="text-green-600 w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Clock className="text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </div>
                <span className="text-xs text-gray-600 text-center">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Activity */}
        {latestRun ? (
          <div className={`rounded-xl p-3 sm:p-4 mb-4 ${isFinal ? 'bg-green-50' : 'bg-purple-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${isFinal ? 'text-green-900' : 'text-purple-900'}`}>
                {isFinal ? 'Itinerary Ready' : 'Agent Activity'}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isFinal
                    ? 'text-green-600 bg-green-200'
                    : 'text-purple-600 bg-purple-200'
                }`}
              >
                {getStageLabel(latestRun.executionStage)}
              </span>
            </div>

            {isFinal ? (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="text-green-600 w-4 h-4" />
                  <span className="text-sm text-gray-700 font-medium">Complete Plan Ready</span>
                </div>
                <p className="text-xs text-gray-600">
                  All agents completed. Itinerary includes transport, accommodation, and dining recommendations.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {latestRun.tasks?.slice(0, 3).map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                          task.status === 'completed'
                            ? 'bg-green-500'
                            : task.status === 'running'
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-gray-300'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <CheckCircle className="text-white w-3 h-3" />
                        )}
                        {task.status === 'running' && (
                          <Clock className="text-white w-3 h-3 animate-spin" />
                        )}
                        {task.status === 'pending' && (
                          <Clock className="text-gray-600 w-3 h-3" />
                        )}
                      </div>
                      <span className="text-xs text-gray-700 capitalize">
                        {task.specialist} Agent
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        task.status === 'completed'
                          ? 'text-green-600'
                          : task.status === 'running'
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4">
            <p className="text-xs text-gray-600 text-center">No active run yet</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Created: {formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}</span>
          <span>Updated: {formatDistanceToNow(new Date(trip.updatedAt), { addSuffix: true })}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleContinue}
            className={`flex-1 font-semibold py-2 sm:py-3 rounded-xl transition shadow-sm ${
              isFinal
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
            }`}
          >
            {isFinal ? 'View Itinerary' : 'Continue Planning'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            {isFinal ? <Download className="w-4 h-4 text-gray-600" /> : <Share className="w-4 h-4 text-gray-600" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
