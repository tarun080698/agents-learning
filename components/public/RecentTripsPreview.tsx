"use client";

import { MapPin, Calendar, Users, ArrowRight, Clock } from "lucide-react";
import { Trip } from "@/hooks/useTrips";
import { Button } from "@/components/ui/button";

interface RecentTripsPreviewProps {
  trips: Trip[] | null;
  loading: boolean;
}

// Dummy data for preview mode
const DUMMY_TRIPS = [
  {
    _id: "dummy-1",
    title: "NYC to Boston",
    origin: "New York",
    destination: "Boston",
    status: "planning" as const,
    tripDates: {
      start: "2026-02-15",
      end: "2026-02-18",
    },
    metadata: {
      numTravelers: 2,
    },
    progress: {
      percentComplete: 75,
      hasDestination: true,
      hasOrigin: true,
      hasDates: true,
      hasItinerary: false,
    },
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/e5ab0ad5ac-417b3a3e778ffa8ada87.png",
  },
  {
    _id: "dummy-2",
    title: "Miami Weekend Escape",
    origin: "Jersey City",
    destination: "Miami",
    status: "final" as const,
    tripDates: {
      start: "2026-03-06",
      end: "2026-03-09",
    },
    metadata: {
      numTravelers: 2,
    },
    progress: {
      percentComplete: 100,
      hasDestination: true,
      hasOrigin: true,
      hasDates: true,
      hasItinerary: true,
    },
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/60d74fe5b6-d519cc7b1776e1b5dc20.png",
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatUpdatedAt(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
}

function getStatusBadge(status: string, progress?: { percentComplete: number }) {
  if (status === "final" || progress?.percentComplete === 100) {
    return (
      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
        Final
      </span>
    );
  }
  if (status === "planning") {
    return (
      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
        Planning
      </span>
    );
  }
  return (
    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
      Draft
    </span>
  );
}

export function RecentTripsPreview({ trips, loading }: RecentTripsPreviewProps) {
  const displayTrips = trips || DUMMY_TRIPS;
  const isRealData = trips !== null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {isRealData ? "Your Recent Trips" : "Preview: Recent Trips"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">Continue where you left off</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 shimmer h-40" />
            ))}
          </div>
        ) : displayTrips.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No trips yet. Create your first trip after logging in!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTrips.slice(0, 2).map((trip) => {
              const imageUrl = "imageUrl" in trip ? trip.imageUrl : undefined;
              const percentComplete = trip.progress?.percentComplete || 0;
              const progressColor =
                percentComplete === 100
                  ? "from-green-500 to-emerald-500"
                  : "from-indigo-500 to-purple-500";

              return (
                <div
                  key={trip._id}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 trip-card-hover cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {trip.title || `${trip.origin} to ${trip.destination}`}
                        </h4>
                        {getStatusBadge(trip.status, trip.progress)}
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="text-indigo-500 w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">
                            {trip.origin} → {trip.destination}
                          </span>
                        </div>
                      </div>
                    </div>
                    {imageUrl && (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 ml-4">
                        <img
                          className="w-full h-full object-cover"
                          src={imageUrl}
                          alt={trip.destination || "Trip destination"}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 text-xs text-gray-600 flex-wrap gap-1">
                    {trip.tripDates?.start && trip.tripDates?.end && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span>
                          {formatDate(trip.tripDates.start)} - {formatDate(trip.tripDates.end)}
                        </span>
                      </div>
                    )}
                    {trip.metadata?.numTravelers && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                          <span>{trip.metadata.numTravelers} travelers</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Progress</span>
                      <span
                        className={`text-xs font-semibold ${
                          percentComplete === 100 ? "text-green-600" : "text-indigo-600"
                        }`}
                      >
                        {percentComplete}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`bg-linear-to-r ${progressColor} h-1.5 rounded-full transition-all`}
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Updated {formatUpdatedAt(trip.updatedAt)}</span>
                    <button
                      className={`${
                        percentComplete === 100
                          ? "text-green-600 hover:text-green-700"
                          : "text-indigo-600 hover:text-indigo-700"
                      } text-xs sm:text-sm font-medium flex items-center space-x-1`}
                    >
                      <span>{percentComplete === 100 ? "View" : "Continue"}</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isRealData && displayTrips.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition flex items-center justify-center space-x-2"
          >
            <span>View All Trips</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Stats Grid - Mobile: stacked, Tablet+: grid */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-md">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{displayTrips.length}</p>
            <p className="text-xs text-gray-600">Total Trips</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {displayTrips.filter((t) => t.status === "planning").length}
            </p>
            <p className="text-xs text-gray-600">In Planning</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {displayTrips.filter((t) => t.status === "final").length}
            </p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
