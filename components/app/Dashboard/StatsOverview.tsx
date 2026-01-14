'use client';

import { Briefcase, Clock, CheckCircle, Bot } from 'lucide-react';
import type { DashboardStats } from '@/hooks/useDashboardDerivedStats';

interface StatsOverviewProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const statCards = [
    {
      icon: Briefcase,
      label: 'Total Trips',
      value: stats.totalTrips,
      badge: 'All Time',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      badgeColor: 'bg-gray-100 text-gray-500',
    },
    {
      icon: Clock,
      label: 'In Planning',
      value: stats.inPlanning,
      badge: 'Active',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badgeColor: 'bg-purple-100 text-purple-600',
    },
    {
      icon: CheckCircle,
      label: 'Finalized',
      value: stats.finalized,
      badge: 'Complete',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-600',
    },
    {
      icon: Bot,
      label: 'Active Agents',
      value: stats.activeAgents,
      badge: 'Live',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600',
      badgeColor: 'bg-pink-100 text-pink-600',
      pulse: stats.activeAgents > 0,
    },
  ];

  if (loading) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
              <card.icon className={`${card.iconColor} w-5 h-5 sm:w-6 sm:h-6`} />
            </div>
            <span className={`text-xs font-medium px-2 sm:px-3 py-1 rounded-full ${card.badgeColor} ${card.pulse ? 'animate-pulse' : ''}`}>
              {card.badge}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{card.value}</h3>
          <p className="text-xs sm:text-sm text-gray-600">{card.label}</p>
        </div>
      ))}
    </section>
  );
}
