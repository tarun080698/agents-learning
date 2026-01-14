'use client';

import { CheckCircle, Bot, User, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ActivityEvent {
  type: 'agent_completed' | 'agent_dispatched' | 'user_action' | 'trip_created';
  title: string;
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  events?: ActivityEvent[];
}

export function RecentActivity({ events }: RecentActivityProps) {
  // Use static timestamps for default events
  const now = new Date();
  const defaultEvents: ActivityEvent[] = [
    {
      type: 'agent_completed',
      title: 'Transport Agent completed research',
      description: 'Found 3 transport options for current trip',
      timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
    },
    {
      type: 'agent_dispatched',
      title: 'Master Agent dispatched tasks',
      description: '3 specialist agents assigned for research phase',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      type: 'user_action',
      title: 'You confirmed trip details',
      description: 'Dates, budget, and preferences confirmed',
      timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
    },
    {
      type: 'trip_created',
      title: 'New trip created',
      description: 'Trip started with initial details',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  ];

  const activityEvents = events || defaultEvents;

  const getIcon = (type: string) => {
    switch (type) {
      case 'agent_completed':
        return { Icon: CheckCircle, bgColor: 'bg-green-100', iconColor: 'text-green-600' };
      case 'agent_dispatched':
        return { Icon: Bot, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
      case 'user_action':
        return { Icon: User, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' };
      case 'trip_created':
        return { Icon: Plus, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' };
      default:
        return { Icon: Bot, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h3>
          <Button variant="ghost" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {activityEvents.map((event, index) => {
            const { Icon, bgColor, iconColor } = getIcon(event.type);
            return (
              <div
                key={index}
                className={`flex items-start space-x-4 ${
                  index < activityEvents.length - 1 ? 'pb-4 border-b border-gray-100' : ''
                }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`${iconColor} w-4 h-4 sm:w-5 sm:h-5`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
