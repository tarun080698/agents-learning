'use client';

import { Plus, Clock, Bookmark } from 'lucide-react';

interface QuickActionsProps {
  onCreateTrip: () => void;
}

export function QuickActions({ onCreateTrip }: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      title: 'Start New Trip',
      description: 'Begin planning your next adventure with AI assistance',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      hoverColor: 'hover:border-indigo-200',
      onClick: onCreateTrip,
    },
    {
      icon: Clock,
      title: 'View Run History',
      description: 'Review past agent runs and planning sessions',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      hoverColor: 'hover:border-purple-200',
      onClick: () => console.log('View run history'),
    },
    {
      icon: Bookmark,
      title: 'Saved Itineraries',
      description: 'Access your collection of saved travel plans',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600',
      hoverColor: 'hover:border-pink-200',
      onClick: () => console.log('View saved itineraries'),
    },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md ${action.hoverColor} transition text-left w-full`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.bgColor} rounded-xl flex items-center justify-center mb-4`}>
              <action.icon className={`${action.iconColor} w-5 h-5 sm:w-6 sm:h-6`} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
