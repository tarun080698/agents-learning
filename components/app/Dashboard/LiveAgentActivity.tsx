'use client';

import { Bot, ArrowRight, CheckCircle, Clock, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import type { LatestRun } from '@/hooks/useLatestRun';

interface LiveAgentActivityProps {
  currentRun?: LatestRun | null;
  tripTitle?: string;
}

export function LiveAgentActivity({ currentRun, tripTitle }: LiveAgentActivityProps) {
  if (!currentRun) {
    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Live Agent Activity</h3>
                <p className="text-xs sm:text-sm text-gray-600">Real-time monitoring of AI agent workflows</p>
              </div>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">No live runs right now</p>
          </div>
        </div>
      </section>
    );
  }

  const stages = [
    { key: 'clarify', label: 'Clarify', description: 'Trip details clarified and confirmed with user' },
    { key: 'confirm', label: 'Confirm', description: 'User confirmed dates, budget, and preferences' },
    { key: 'dispatch', label: 'Dispatch', description: 'Tasks distributed to specialist agents' },
    { key: 'research', label: 'Research', description: 'Specialist agents gathering recommendations' },
    { key: 'finalize', label: 'Finalize', description: 'Generate and present itinerary options' },
    { key: 'completed', label: 'Completed', description: 'Trip planning finalized and ready for user' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === currentRun.executionStage);
  const progress = currentRun.progress ?? ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bot className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Live Agent Activity</h3>
              <p className="text-xs sm:text-sm text-gray-600">Real-time monitoring of AI agent workflows</p>
            </div>
          </div>
          <Button variant="ghost" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium self-start sm:self-center">
            View All Runs
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{tripTitle || 'Current Trip'} - Current Run</h4>
              <p className="text-sm text-gray-600">Run ID: {currentRun._id}</p>
            </div>
            <StatusBadge status="running" className="self-start sm:self-center" />
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <div className="flex-1 bg-white rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{Math.round(progress)}% Complete</span>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-purple-300"></div>

            <div className="space-y-4">
              {stages.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <div key={stage.key} className="flex items-start space-x-4">
                    <div
                      className={`relative z-10 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg ${
                        isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-gray-300'
                      }`}
                    >
                      {isCompleted && <CheckCircle className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
                      {isCurrent && <Loader className="text-white w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
                      {isPending && <Clock className="text-gray-600 w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>

                    <div
                      className={`flex-1 rounded-xl p-3 sm:p-4 shadow-sm ${
                        isCurrent ? 'bg-white border-2 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{stage.label}</h5>
                        <StatusBadge
                          status={isCompleted ? 'completed' : isCurrent ? 'running' : 'pending'}
                          className="text-xs"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{stage.description}</p>

                      {/* Show agent details for research stage */}
                      {stage.key === 'research' && isCurrent && currentRun.tasks && (
                        <div className="mt-4 space-y-3">
                          {currentRun.tasks.map((task, idx) => (
                            <div
                              key={idx}
                              className={`border rounded-lg p-3 ${
                                task.status === 'completed'
                                  ? 'bg-green-50 border-green-200'
                                  : task.status === 'running'
                                  ? 'bg-blue-50 border-2 border-blue-300'
                                  : 'bg-gray-100 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900 capitalize">
                                    {task.specialist} Agent
                                  </span>
                                </div>
                                <StatusBadge status={task.status} className="text-xs" />
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {task.status === 'completed'
                                  ? `Completed research for ${task.specialist}`
                                  : task.status === 'running'
                                  ? `Researching ${task.specialist} options...`
                                  : `Waiting to start ${task.specialist} research`}
                              </p>
                              {task.status === 'running' && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                                  </div>
                                  <span className="text-xs text-gray-600">65%</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="text-indigo-600">ℹ️</div>
            <div>
              <p className="text-sm font-medium text-gray-900">What&apos;s happening?</p>
              <p className="text-xs text-gray-600">
                Specialist agents are researching options in parallel to speed up planning
              </p>
            </div>
          </div>
          <Button variant="ghost" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hidden sm:block">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
