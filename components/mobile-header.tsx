'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, BookMarked, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  tripId: string | null;
  onBack: () => void;
  onShowTrace: () => void;
  onShowPlans: () => void;
  onLogout: () => void;
  showBackButton?: boolean;
}

export function MobileHeader({
  tripId,
  onBack,
  onShowTrace,
  onShowPlans,
  onLogout,
  showBackButton = true,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back button or menu */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-10 w-10 p-0"
              aria-label="Back to trips"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">
            {tripId ? `Trip ${tripId.slice(-6)}` : 'Travel Planner'}
          </h1>
        </div>

        {/* Right: Action buttons */}
        {tripId && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowTrace}
              className="h-10 w-10 p-0"
              aria-label="Show execution trace"
              title="Execution Trace"
            >
              <Activity className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowPlans}
              className="h-10 w-10 p-0"
              aria-label="Show saved plans"
              title="Saved Plans"
            >
              <BookMarked className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-10 w-10 p-0"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
