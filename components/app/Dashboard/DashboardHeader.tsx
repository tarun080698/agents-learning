'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  onCreateTrip: () => void;
}

export function DashboardHeader({ onCreateTrip }: DashboardHeaderProps) {
  return (
    <section className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Travel Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your trips and track AI agent progress in real-time
          </p>
        </div>
        <Button
          onClick={onCreateTrip}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span>Create New Trip</span>
        </Button>
      </div>
    </section>
  );
}
