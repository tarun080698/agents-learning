'use client';

import { useEffect, useState } from 'react';
import { UsernameGate } from '@/components/username-gate';
import { TripsPanel } from '@/components/trips-panel';
import { ChatPanel } from '@/components/chat-panel';
import { TracePanel } from '@/components/trace-panel';
import { ItineraryPanel } from '@/components/itinerary-panel';
import { Button } from '@/components/ui/button';
import type { MasterOutput, TripContext, Task, SpecialistOutput, MergedItinerary } from '@/lib/schemas/agent';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specialistOutputs, setSpecialistOutputs] = useState<SpecialistOutput[]>([]);
  const [runStatus, setRunStatus] = useState<'in-progress' | 'completed' | 'failed'>('in-progress');
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

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
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedTripId) return;

    // Clear any previous errors
    setError(null);
    setLastFailedMessage(null);

    // Optimistically add user message to UI
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      tripId: selectedTripId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

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
        if (data.run.mergedItinerary) {
          setMergedItinerary(data.run.mergedItinerary);
        }
        // Determine run status
        if (data.run.masterOutput?.mode === 'FINALIZE' && data.run.mergedItinerary) {
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
      // Remove the optimistic message since it failed
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
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

          {/* Bottom row: Itinerary (only shows when available) */}
          {mergedItinerary && (
            <div className="h-[50vh] min-h-0">
              <ItineraryPanel
                itinerary={mergedItinerary}
                tripContext={tripContext}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
