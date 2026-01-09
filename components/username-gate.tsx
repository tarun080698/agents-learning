'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UsernameGateProps {
  onLogin: (username: string, userId: string) => void;
}

export function UsernameGate({ onLogin }: UsernameGateProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Try to get existing user
      let response = await fetch(`/api/users?username=${encodeURIComponent(username)}`);

      if (response.status === 404) {
        // User doesn't exist, create new user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const user = await response.json();

      // Store in localStorage
      localStorage.setItem('username', username);
      localStorage.setItem('userId', user._id);

      onLogin(username, user._id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Travel Planner</CardTitle>
          <CardDescription>Enter your username to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            disabled={loading}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={handleContinue}
            disabled={loading || !username.trim()}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
