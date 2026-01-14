'use client';

import { useEffect, useState } from 'react';
import { UsernameGate } from '@/components/username-gate';
import { TripsPanel } from '@/components/trips-panel';
import { ChatPanel } from '@/components/chat-panel';
import { TracePanel } from '@/components/trace-panel';
import { ItineraryPanel } from '@/components/itinerary-panel';
import { SavedItinerariesDrawer } from '@/components/saved-itineraries-drawer';
import { ItinerarySelection } from '@/components/itinerary-selection';
import { MobileHeader } from '@/components/mobile-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';
import type { MasterOutput, TripContext, Task, SpecialistOutput, MergedItinerary, MultipleItineraries, ItineraryOption } from '@/lib/schemas/agent';

interface Trip {
  _id: string;
  userId: string;
  status: string;
  tripContext: TripContext;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  tripId: string;
  role: string;
  agentName?: string;
  content: string;
  createdAt: string;
}

export default function Home() {
  // Responsive hooks
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<'trips' | 'chat'>('trips');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [masterOutput, setMasterOutput] = useState<MasterOutput | null>(null);
  const [mergedItinerary, setMergedItinerary] = useState<MergedItinerary | null>(null);
  const [multipleItineraries, setMultipleItineraries] = useState<MultipleItineraries | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specialistOutputs, setSpecialistOutputs] = useState<SpecialistOutput[]>([]);
  const [runStatus, setRunStatus] = useState<'in-progress' | 'completed' | 'failed'>('in-progress');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [traceDrawerOpen, setTraceDrawerOpen] = useState(false);
  const [itineraryDrawerOpen, setItineraryDrawerOpen] = useState(false);
  const [showItinerarySavedNotification, setShowItinerarySavedNotification] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');

    if (storedUsername && storedUserId) {
      setUsername(storedUsername);
      setUserId(storedUserId);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadTrips();
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    if (selectedTripId) {
      loadMessages(selectedTripId);
      loadTripContext(selectedTripId);
      loadLatestRun(selectedTripId);
      loadLatestItinerary(selectedTripId);
    } else {
      setMessages([]);
      setTripContext(null);
      setMasterOutput(null);
      setMergedItinerary(null);
      setMultipleItineraries(null);
      setTasks([]);
      setSpecialistOutputs([]);
      setRunStatus('in-progress');
      setCurrentRunId(null);
    }
  }, [selectedTripId]);

  const handleLogin = (newUsername: string, newUserId: string) => {
    setUsername(newUsername);
    setUserId(newUserId);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUsername('');
    setUserId('');
    setTrips([]);
    setSelectedTripId(null);
    setMessages([]);
  };

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trips?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load trips');
      const data = await response.json();
      setTrips(data);

      // If there's a selected trip, update its context immediately
      if (selectedTripId) {
        const selectedTrip = data.find((t: any) => t._id === selectedTripId);
        if (selectedTrip && selectedTrip.tripContext) {
          setTripContext(selectedTrip.tripContext);
        }
      }

      return data; // Return the data for use in callers
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (tripId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages?tripId=${tripId}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTripContext = async (tripId: string) => {
    try {
      const trip = trips.find(t => t._id === tripId);
      if (trip && trip.tripContext) {
        setTripContext(trip.tripContext);
      } else {
        setTripContext(null);
      }
    } catch (error) {
      console.error('Error loading trip context:', error);
    }
  };

  const loadLatestRun = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/latest-run`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.run) {
        // Store the run ID for tracking saved itineraries
        setCurrentRunId(data.run._id?.toString() || null);

        // Restore run state
        if (data.run.masterOutput) {
          setMasterOutput(data.run.masterOutput);
        }
        if (data.run.tasks) {
          setTasks(data.run.tasks);
        }
        if (data.run.specialistOutputs) {
          setSpecialistOutputs(data.run.specialistOutputs);
        }
        if (data.run.multipleItineraries) {
          // Don't show selection UI if user already selected an itinerary from this run
          if (data.run.status === 'itinerary_selected') {
            // Itinerary already selected, don't show options again
            // Try to load the selected itinerary from saved itineraries
            const savedItinerary = await checkIfItinerarySaved(tripId, data.run._id);
            if (savedItinerary) {
              // User already made their selection
            }
          } else {
            // No selection made yet, show the options
            setMultipleItineraries(data.run.multipleItineraries);
          }
          // Don't set mergedItinerary from multipleItineraries - that's for selection UI
        } else if (data.run.mergedItinerary && data.run.mergedItinerary.days) {
          // Only set if it has the proper structure with days array
          setMergedItinerary(data.run.mergedItinerary);
        }

        // Set run status
        if (data.run.status === 'error') {
          setRunStatus('failed');
        } else if (data.run.masterOutput?.mode === 'FINALIZE') {
          setRunStatus('completed');
        } else {
          setRunStatus('in-progress');
        }
      }
    } catch (error) {
      console.error('Error loading latest run:', error);
    }
  };

  const checkIfItinerarySaved = async (tripId: string, runId?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/trips/${tripId}/itineraries`);
      if (!response.ok) return false;

      const itineraries = await response.json();
      if (!itineraries || itineraries.length === 0) return false;

      // If runId is provided, check if any saved itinerary has this runId
      if (runId) {
        return itineraries.some((saved: any) => saved.runId === runId);
      }

      // Otherwise, just check if any itinerary exists
      return true;
    } catch (error) {
      console.error('Error checking saved itinerary:', error);
      return false;
    }
  };

  const loadLatestItinerary = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/itineraries`);
      if (!response.ok) return;

      const itineraries = await response.json();
      if (itineraries && itineraries.length > 0) {
        // Get the most recent saved itinerary
        const latest = itineraries[0];
        // The saved itinerary has the structure: { _id, itinerary, tripContext, savedAt, name }
        // We need to extract the nested 'itinerary' property
        if (latest && latest.itinerary && latest.itinerary.days) {
          // Set the saved itinerary if there's no active run itinerary
          // This ensures we show the saved itinerary for the current trip
          if (!mergedItinerary) {
            setMergedItinerary(latest.itinerary);
          }
        }
      }
    } catch (error) {
      console.error('Error loading latest itinerary:', error);
    }
  };

  const handleNewTrip = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to create trip');
      const newTrip = await response.json();
      setTrips([newTrip, ...trips]);
      setSelectedTripId(newTrip._id);
    } catch (error) {
      console.error('Error creating trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    // Reset error state when switching trips
    setError(null);
    setLastFailedMessage(null);
    // On mobile, switch to chat view after selecting a trip
    if (isMobile) {
      setMobileView('chat');
    }
  };

  const handleBackToTrips = () => {
    setMobileView('trips');
  };

  const handleShowTrace = () => {
    setTraceDrawerOpen(true);
  };

  const handleShowPlans = () => {
    setItineraryDrawerOpen(true);
  };

  // Check if there's trace data to show
  const hasTraceData = Boolean(
    masterOutput ||
    (tasks && tasks.length > 0) ||
    (specialistOutputs && specialistOutputs.length > 0)
  );

  const handleDeleteTrip = async (tripId: string) => {
    // Get trip details for better confirmation
    const trip = trips.find(t => t._id === tripId);
    const messageCount = tripId === selectedTripId ? messages.length : 0;

    const confirmMessage = trip && messageCount > 0
      ? `Delete this trip with ${messageCount} messages? This cannot be undone.`
      : 'Delete this trip? This cannot be undone.';

    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete trip');

      // Remove from local state
      setTrips(trips.filter(t => t._id !== tripId));

      // If the deleted trip was selected, clear selection
      if (selectedTripId === tripId) {
        setSelectedTripId(null);
        setMessages([]);
        setTripContext(null);
        setMasterOutput(null);
        setMergedItinerary(null);
        setTasks([]);
        setSpecialistOutputs([]);
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, isRetry = false) => {
    if (!selectedTripId) return;

    // Clear any previous errors
    setError(null);
    setLastFailedMessage(null);

    // Only add optimistic message if this is NOT a retry (retry reuses existing message)
    let optimisticMessage: Message | null = null;
    if (!isRetry) {
      optimisticMessage = {
        _id: `temp-${Date.now()}`,
        tripId: selectedTripId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMessage!]);
    }

    try {
      setLoading(true);
      // Use the new /api/chat endpoint for AI-powered responses
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: selectedTripId,
          message: content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      // Update all state from response
      if (data.tripContext) {
        setTripContext(data.tripContext);
      }
      if (data.run) {
        if (data.run.masterOutput) {
          setMasterOutput(data.run.masterOutput);
        }
        if (data.run.tasks) {
          setTasks(data.run.tasks);
        }
        if (data.run.specialistOutputs) {
          setSpecialistOutputs(data.run.specialistOutputs);
        }
        if (data.run.multipleItineraries) {
          // Multiple itineraries received - show selection UI
          setMultipleItineraries(data.run.multipleItineraries);
        } else if (data.run.mergedItinerary) {
          // Backward compatibility for single itinerary
          setMergedItinerary(data.run.mergedItinerary);
        }
        // Determine run status
        if (data.run.masterOutput?.mode === 'FINALIZE' && (data.run.multipleItineraries || data.run.mergedItinerary)) {
          setRunStatus('completed');
        } else {
          setRunStatus('in-progress');
        }
      }

      // Reload messages after sending
      await loadMessages(selectedTripId);

      // Reload trips to get updated metadata (title, progress, etc.)
      // This also updates the tripContext for the selected trip
      await loadTrips();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      setLastFailedMessage(content);
      // Remove the optimistic message since it failed (only if we created one)
      if (optimisticMessage?._id) {
        setMessages(prev => prev.filter(m => m._id !== optimisticMessage!._id));
      } else if (isRetry) {
        // For retry, just reload messages to get clean state
        if (selectedTripId) {
          await loadMessages(selectedTripId);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage, true);
    }
  };

  const handleSelectItinerary = async (itinerary: MergedItinerary, option: ItineraryOption) => {
    if (!selectedTripId) return;

    setSavingItinerary(true);
    try {
      // Use the currentRunId from the loaded run
      await saveItineraryAutomatically(itinerary, tripContext, option.title, currentRunId || undefined);
      setMergedItinerary(itinerary);
      setMultipleItineraries(null); // Hide selection UI

      // Mark the run as having an itinerary selected
      if (currentRunId) {
        try {
          await fetch(`/api/runs/${currentRunId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'itinerary_selected',
              selectedOptionId: option.id,
            }),
          });
        } catch (error) {
          console.error('Error updating run status:', error);
        }
      }

      // Update trip metadata to mark itinerary as complete
      try {
        await fetch(`/api/trips/${selectedTripId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateMetadata: true,
            hasItinerary: true,
          }),
        });

        // Reload trips to refresh the UI with updated metadata
        await loadTrips();
      } catch (metadataError) {
        console.error('Error updating trip metadata:', metadataError);
      }

      // Save confirmation message to database
      const confirmationMessage = {
        tripId: selectedTripId,
        role: 'system' as const,
        agentName: 'System',
        content: `✅ **${option.title}** has been saved! You can view the full itinerary details anytime by clicking the bookmark icon.`,
      };

      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(confirmationMessage),
        });

        // Reload messages to include the saved confirmation
        await loadMessages(selectedTripId);
      } catch (error) {
        console.error('Error saving confirmation message:', error);
        // Still show the message in UI even if DB save fails
        setMessages(prev => [...prev, {
          _id: `system-${Date.now()}`,
          tripId: selectedTripId,
          role: 'system',
          agentName: 'System',
          content: confirmationMessage.content,
          createdAt: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Error saving selected itinerary:', error);
      setError('Failed to save itinerary. Please try again.');
    } finally {
      setSavingItinerary(false);
    }
  };

  const saveItineraryAutomatically = async (
    itinerary: MergedItinerary,
    tripContext: TripContext | null,
    customName?: string,
    runId?: string
  ) => {
    if (!selectedTripId) return;

    try {
      // Check if this exact itinerary (by runId) has already been saved
      if (runId) {
        const alreadySaved = await checkIfItinerarySaved(selectedTripId, runId);
        if (alreadySaved) {
          console.log('Itinerary already saved, skipping duplicate save');
          return;
        }
      }

      const response = await fetch(`/api/trips/${selectedTripId}/itineraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          tripContext,
          name: customName || `${itinerary.summary.substring(0, 50)}${itinerary.summary.length > 50 ? '...' : ''}`,
          runId, // Include runId to track which run this itinerary came from
        }),
      });

      if (response.ok) {
        setShowItinerarySavedNotification(true);
        setTimeout(() => setShowItinerarySavedNotification(false), 5000);
      }
    } catch (error) {
      console.error('Error auto-saving itinerary:', error);
    }
  };

  if (!isLoggedIn) {
    return <UsernameGate onLogin={handleLogin} />;
  }

  return (
    <div className="max-h-screen bg-white flex flex-col">
      {/* Mobile Header - Trips List View */}
      {isMobile && mobileView === 'trips' && (
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 safe-top shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Travel Planner</h1>
              <p className="text-xs text-slate-600">Welcome, {username}!</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="min-h-11 min-w-11"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Header - Chat View */}
      {isMobile && mobileView === 'chat' && (
        <MobileHeader
          tripId={selectedTripId}
          onBack={handleBackToTrips}
          onShowTrace={handleShowTrace}
          onShowPlans={handleShowPlans}
          onLogout={handleLogout}
          showBackButton={true}
        />
      )}

      {/* Desktop Header - Hidden on mobile */}
      {!isMobile && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="max-w-400 mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Travel Planner</h1>
              <p className="text-sm md:text-base text-slate-600">Welcome, {username}!</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex h-screen container mx-auto my-4">
        {/* MOBILE LAYOUT - Show trips XOR chat */}
        {isMobile && (
          <>
            {/* Mobile: Trips List */}
            {mobileView === 'trips' && (
              <div className="w-full h-full mx-auto">
                <TripsPanel
                  userId={userId}
                  trips={trips}
                  selectedTripId={selectedTripId}
                  onSelectTrip={handleSelectTrip}
                  onNewTrip={handleNewTrip}
                  onViewSavedItineraries={() => setDrawerOpen(true)}
                  onDeleteTrip={handleDeleteTrip}
                  loading={loading}
                />
              </div>
            )}

            {/* Mobile: Chat View (full screen) */}
            {mobileView === 'chat' && selectedTripId && (
              <div className="w-full h-full">
                <ChatPanel
                  tripId={selectedTripId}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={loading}
                  error={error}
                  onRetry={handleRetry}
                  multipleItineraries={multipleItineraries}
                  onSelectItinerary={handleSelectItinerary}
                  savingItinerary={savingItinerary}
                  lastFailedMessage={lastFailedMessage}
                  onShowTrace={hasTraceData ? handleShowTrace : undefined}
                />
              </div>
            )}

            {/* Mobile: Prompt to select trip */}
            {mobileView === 'chat' && !selectedTripId && (
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-slate-600 mb-4">Select a trip to start chatting</p>
                  <Button onClick={handleBackToTrips}>View Trips</Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TABLET LAYOUT - Collapsible sidebar + chat + optional itinerary drawer */}
        {isTablet && !isDesktop && (
          <div className="flex w-full h-full max-h-[calc(100vh-150px)] mx-auto gap-4 container">
            {/* Tablet: Trips Sidebar (collapsible) */}
            <div className="w-80 shrink-0 ">
              <TripsPanel
                userId={userId}
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={handleSelectTrip}
                onNewTrip={handleNewTrip}
                onViewSavedItineraries={() => setDrawerOpen(true)}
                onDeleteTrip={handleDeleteTrip}
                loading={loading}
              />
            </div>

            {/* Tablet: Chat Area */}
            <div className="flex-1 min-w-0">
              <ChatPanel
                tripId={selectedTripId}
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                error={error}
                onRetry={handleRetry}
                multipleItineraries={multipleItineraries}
                onSelectItinerary={handleSelectItinerary}
                savingItinerary={savingItinerary}
                lastFailedMessage={lastFailedMessage}
              onShowTrace={hasTraceData ? handleShowTrace : undefined}
              />
            </div>
          </div>
        )}

        {/* DESKTOP LAYOUT - 3-column: trips | chat | itinerary */}
        {isDesktop && (
          <div className="flex w-full h-full max-h-[calc(100vh-150px)] mx-auto gap-4 container">
            {/* Desktop: Trips Panel (25%) */}
            <div className="w-[25%] min-w-75 max-w-100">
              <TripsPanel
                userId={userId}
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={handleSelectTrip}
                onNewTrip={handleNewTrip}
                onViewSavedItineraries={() => setDrawerOpen(true)}
                onDeleteTrip={handleDeleteTrip}
                loading={loading}
              />
            </div>

            {/* Desktop: Chat Panel - dynamic width based on itinerary panel */}
            <div className={mergedItinerary ? "w-[45%] min-w-0" : "w-[75%] min-w-0"}>
              <ChatPanel
                tripId={selectedTripId}
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                error={error}
                onRetry={handleRetry}
                multipleItineraries={multipleItineraries}
                onSelectItinerary={handleSelectItinerary}
                savingItinerary={savingItinerary}
                lastFailedMessage={lastFailedMessage}
                onShowTrace={hasTraceData ? handleShowTrace : undefined}
              />
            </div>

            {/* Desktop: Itinerary Panel (30%) - only show if there's an itinerary */}
            {mergedItinerary && (
              <div className="w-[30%] min-w-87.5">
                <ItineraryPanel
                  itinerary={mergedItinerary}
                  tripContext={tripContext}
                  tripId={selectedTripId}
                  onSaved={() => {
                    setShowItinerarySavedNotification(true);
                    setTimeout(() => setShowItinerarySavedNotification(false), 5000);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trace Drawer - Available on all screen sizes, only when there's trace data */}
      {traceDrawerOpen && hasTraceData && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setTraceDrawerOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-[90%] md:w-[60%] lg:w-[40%] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="flex justify-between items-center p-4 shrink-0">
                <h2 className="text-lg font-semibold text-slate-900">Execution Trace</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTraceDrawerOpen(false)}
                  aria-label="Close trace drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-hidden">
                <TracePanel
                  masterOutput={masterOutput}
                  tripContext={tripContext}
                  tasks={tasks}
                  specialistOutputs={specialistOutputs}
                  mergedItinerary={mergedItinerary}
                  runStatus={runStatus}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Itineraries Drawer */}
      <SavedItinerariesDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        tripId={selectedTripId}
      />

      {/* Itinerary Drawer - Tablet only */}
      {isTablet && !isDesktop && itineraryDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setItineraryDrawerOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-[60%] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="flex justify-between items-center p-4 shrink-0">
                <h2 className="text-lg font-semibold text-slate-900">Current Itinerary</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItineraryDrawerOpen(false)}
                  aria-label="Close itinerary drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-hidden">
                <ItineraryPanel
                  itinerary={mergedItinerary}
                  tripContext={tripContext}
                  tripId={selectedTripId}
                  onSaved={() => {
                    setShowItinerarySavedNotification(true);
                    setTimeout(() => setShowItinerarySavedNotification(false), 5000);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Itinerary Drawer */}
      {isMobile && itineraryDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={() => setItineraryDrawerOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-[90%] bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="flex justify-between items-center p-4 shrink-0">
                <h2 className="text-lg font-semibold text-slate-900">Current Itinerary</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItineraryDrawerOpen(false)}
                  aria-label="Close itinerary drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-hidden">
                <ItineraryPanel
                  itinerary={mergedItinerary}
                  tripContext={tripContext}
                  tripId={selectedTripId}
                  onSaved={() => {
                    setShowItinerarySavedNotification(true);
                    setTimeout(() => setShowItinerarySavedNotification(false), 5000);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification when itinerary is saved */}
      {showItinerarySavedNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Itinerary saved!</span>
          </div>
        </div>
      )}
    </div>
  );
}
