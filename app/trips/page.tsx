'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client';
import { useTrips } from '@/hooks/useTrips';
import { useLatestRuns } from '@/hooks/useLatestRun';
import { useDashboardDerivedStats } from '@/hooks/useDashboardDerivedStats';
import { AppHeader } from '@/components/app/AppHeader';
import { DashboardHeader } from '@/components/app/Dashboard/DashboardHeader';
import { StatsOverview } from '@/components/app/Dashboard/StatsOverview';
import { TripsSection } from '@/components/app/Dashboard/TripsSection';
import { LiveAgentActivity } from '@/components/app/Dashboard/LiveAgentActivity';
import { QuickActions } from '@/components/app/Dashboard/QuickActions';
import { RecentActivity } from '@/components/app/Dashboard/RecentActivity';
import { Insights } from '@/components/app/Dashboard/Insights';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const session = getSession();

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  // Fetch trips data
  const { trips, loading: tripsLoading, error: tripsError, refetch: refetchTrips } = useTrips(session?.userId || '');

  // Fetch latest runs for all trips (limit to first 10 to avoid excessive requests)
  const tripIds = trips.slice(0, 10).map((trip) => trip._id);
  const { runs } = useLatestRuns(tripIds);

  // Compute dashboard stats
  const stats = useDashboardDerivedStats(trips, runs);

  // Find current run for live activity (prefer most recently updated run that's not completed)
  const currentRun = Array.from(runs.values()).find(
    (run) => run.executionStage !== 'completed' && run.executionStage !== 'error'
  ) || null;

  const currentTripTitle = currentRun
    ? trips.find((t) => t._id === currentRun.tripId)?.title || 'Current Trip'
    : undefined;

  // Handlers
  const handleCreateTrip = () => {
    // For now, just show an alert - you can implement modal or redirect
    alert('Create trip modal would open here. Redirecting to first trip for now...');
    if (trips.length > 0) {
      router.push(`/trips/${trips[0]._id}`);
    }
  };

  // Don't render until we have a session
  if (!session) {
    return null;
  }

  // Error state
  if (tripsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <AppHeader username={session?.username || 'User'} />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-600 text-4xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Error loading trips</h3>
              <p className="text-gray-600 mb-6">{tripsError}</p>
              <Button
                onClick={() => refetchTrips()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition"
              >
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Empty state (no trips)
  if (!tripsLoading && trips.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <AppHeader username={session?.username || 'User'} />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
          <DashboardHeader onCreateTrip={handleCreateTrip} />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="text-indigo-600 w-12 h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No trips yet</h3>
              <p className="text-gray-600 mb-6">
                Start planning your first adventure with our AI-powered travel agents. They&apos;ll help you create the perfect itinerary in minutes.
              </p>
              <Button
                onClick={handleCreateTrip}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition"
              >
                Create Your First Trip
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <AppHeader username={session?.username || 'User'} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DashboardHeader onCreateTrip={handleCreateTrip} />

        <StatsOverview stats={stats} loading={tripsLoading} />

        <TripsSection trips={trips} runs={runs} loading={tripsLoading} />

        {currentRun && (
          <LiveAgentActivity currentRun={currentRun} tripTitle={currentTripTitle} />
        )}

        <QuickActions onCreateTrip={handleCreateTrip} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <RecentActivity />
          <Insights />
        </div>

        {/* Help Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">💡</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">How AI Agents Work</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Our Master Agent coordinates with specialist agents (Transport, Stay, Food) to research options in parallel, then synthesizes their findings into complete itinerary options for you to choose from.
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                    <span>Learn more about our AI workflow</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 self-start sm:self-center">
                ✕
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
