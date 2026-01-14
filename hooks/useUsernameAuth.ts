"use client";

import { useState } from "react";
import { setSession } from "@/lib/auth/client";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface UseUsernameAuthReturn {
  login: (username: string, options?: { firstName?: string; lastName?: string }) => Promise<{ userId: string; username: string }>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for username-based authentication
 * Handles GET /api/users?username={username} and POST /api/users for new users
 */
export function useUsernameAuth(): UseUsernameAuthReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (
    username: string,
    options?: { firstName?: string; lastName?: string }
  ): Promise<{ userId: string; username: string }> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Try to fetch existing user
      const getResponse = await fetch(`/api/users?username=${encodeURIComponent(username)}`);

      if (getResponse.ok) {
        // User exists, parse and store session
        const user = (await getResponse.json()) as User;
        const session = { userId: user._id, username: user.username };
        setSession(session);
        setLoading(false);
        return session;
      }

      if (getResponse.status === 404) {
        // User doesn't exist, create new user
        const createResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            firstName: options?.firstName,
            lastName: options?.lastName,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create user");
        }

        const newUser = (await createResponse.json()) as User;
        const session = { userId: newUser._id, username: newUser.username };
        setSession(session);
        setLoading(false);
        return session;
      }

      // Other error responses
      throw new Error("Failed to authenticate. Please try again.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      setLoading(false);
      throw err;
    }
  };

  return { login, loading, error };
}
