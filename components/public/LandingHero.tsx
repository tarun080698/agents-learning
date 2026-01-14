"use client";

import { Plane } from "lucide-react";

export function LandingHero() {
  return (
    <div className="text-center mb-8 sm:mb-10 lg:mb-12">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-2xl shadow-md flex items-center justify-center floating-element">
          <Plane className="text-indigo-600 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
        Travel Agentic Planner
      </h1>
      <p className="text-white/80 text-base sm:text-lg lg:text-xl px-4">
        AI-Powered Trip Planning Made Simple
      </p>
    </div>
  );
}
