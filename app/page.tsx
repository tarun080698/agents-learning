'use client';

import { useEffect, useState } from 'react';
import { UsernameGate } from '@/components/username-gate';
import { TripsPanel } from '@/components/trips-panel';
import { ChatPanel } from '@/components/chat-panel';
import { TracePanel } from '@/components/trace-panel';
import { SavedItinerariesDrawer } from '@/components/saved-itineraries-drawer';
import { ItinerarySelection } from '@/components/itinerary-selection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    } else {
      setMessages([]);
      setTripContext(null);
      setMasterOutput(null);
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
    } catch (error) {
      console.error('Error loading trips:', error);
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
          setMultipleItineraries(data.run.multipleItineraries);
        } else if (data.run.mergedItinerary) {
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
  };

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

      // Reload trips to update updatedAt and tripContext
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
      await saveItineraryAutomatically(itinerary, tripContext, option.title);
      setMergedItinerary(itinerary);
      setMultipleItineraries(null); // Hide selection UI

      // Show confirmation message
      const confirmationMessage = {
        _id: `system-${Date.now()}`,
        tripId: selectedTripId,
        role: 'assistant',
        agentName: 'System',
        content: `✅ **${option.title}** has been saved! You can view the full itinerary details anytime by clicking the bookmark icon.`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmationMessage]);
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
    customName?: string
  ) => {
    if (!selectedTripId) return;

    try {
      const response = await fetch(`/api/trips/${selectedTripId}/itineraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          tripContext,
          name: customName || `${itinerary.summary.substring(0, 50)}${itinerary.summary.length > 50 ? '...' : ''}`,
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
    <div className="h-screen bg-slate-50 p-5 flex flex-col overflow-hidden">
      <div className="flex flex-col h-full max-w-400 mx-auto w-full gap-4">
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Travel Planner</h1>
            <p className="text-slate-600">Welcome, {username}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Top row: Trips, Chat, Trace */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
            {/* Trips panel */}
            <div className="lg:col-span-1 h-full min-h-0">
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

            {/* Chat panel */}
            <div className="lg:col-span-2 h-full min-h-0">
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
              />
            </div>

            {/* Trace panel */}
            <div className="lg:col-span-1 h-full min-h-0">
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

          {/* Itinerary selection is now inline in the chat panel */}
        </div>

        {/* Notification when itinerary is saved */}
        {showItinerarySavedNotification && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Itinerary saved! Click the bookmark icon to view it.</span>
            </div>
          </div>
        )}

        {/* Saved Itineraries Drawer */}
        <SavedItinerariesDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          tripId={selectedTripId}
        />
      </div>
    </div>
  );
}
