'use client';

import { TrendingUp, Trophy } from 'lucide-react';

interface InsightsProps {
  averageCompletionTime?: number;
}

export function Insights({ averageCompletionTime }: InsightsProps) {
  const agentPerformance = [
    { name: 'Transport Agent', score: 98 },
    { name: 'Stay Agent', score: 95 },
    { name: 'Food Agent', score: 97 },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">AI Insights &amp; Recommendations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Planning Efficiency */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-base sm:text-lg">Planning Efficiency</h4>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-2">47%</p>
          <p className="text-xs sm:text-sm opacity-90">
            faster than manual planning with AI agents working in parallel
          </p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span>Average planning time</span>
              <span className="font-semibold">
                {averageCompletionTime ? `${Math.round(averageCompletionTime)} minutes` : '12 minutes'}
              </span>
            </div>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-base sm:text-lg text-gray-900">Agent Performance</h4>
            <Trophy className="text-yellow-500 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-3">
            {agentPerformance.map((agent) => (
              <div key={agent.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{agent.name}</span>
                  <span className="text-sm font-semibold text-green-600">{agent.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${agent.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
