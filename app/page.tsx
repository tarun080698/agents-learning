"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth/client";
import { useUsernameAuth } from "@/hooks/useUsernameAuth";
import { useTrips } from "@/hooks/useTrips";
import { LandingHero } from "@/components/public/LandingHero";
import { UsernameLoginCard } from "@/components/public/UsernameLoginCard";
import { RecentTripsPreview } from "@/components/public/RecentTripsPreview";
import { FeaturesSection } from "@/components/public/FeaturesSection";
import { Sparkles } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { login, loading, error } = useUsernameAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const { trips, loading: tripsLoading } = useTrips(userId);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      // User already logged in, redirect to trips dashboard
      router.replace("/trips");
    } else {
      setHasCheckedAuth(true);
    }
  }, [router]);

  const handleLogin = async (username: string) => {
    try {
      const session = await login(username);
      // After successful login, redirect to trips
      router.replace("/trips");
    } catch (err) {
      // Error is handled by useUsernameAuth hook
      console.error("Login failed:", err);
    }
  };

  // Show nothing until we've checked auth (prevents flash)
  if (!hasCheckedAuth) {
    return null;
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-300 mx-auto">
        <LandingHero />

        {/* Main Content Grid - Mobile: stacked, Desktop: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column: Login Form */}
          <UsernameLoginCard onLogin={handleLogin} loading={loading} error={error} />

          {/* Right Column: Recent Trips Preview + AI Highlight + Stats */}
          <div className="space-y-4 sm:space-y-6">
            <RecentTripsPreview trips={userId ? trips : null} loading={tripsLoading} />

            {/* AI-Powered Planning Highlight */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-md">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    AI-Powered Planning
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Our Master Agent coordinates with specialist agents to research transport, stays,
                    and dining options in parallel - delivering complete itineraries in minutes.
                  </p>
                  <div className="flex items-center space-x-3 flex-wrap gap-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-gray-600">3 Active Agents</span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <div className="flex items-center space-x-1">
                      <svg
                        className="w-3 h-3 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <span className="text-xs text-gray-600">47% Faster</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features, Workflow, Testimonials, CTA, Footer */}
        <div className="mt-6 sm:mt-8 lg:mt-12">
          <FeaturesSection />
        </div>
      </div>
    </div>
  );
}
