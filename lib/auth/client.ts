"use client";

export interface Session {
  userId: string;
  username: string;
}

const SESSION_KEY = "travel_planner_session";

/**
 * Retrieve current session from localStorage
 */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as Session;
    // Validate session structure
    if (!session.userId || !session.username) return null;

    return session;
  } catch (error) {
    console.error("Failed to parse session:", error);
    return null;
  }
}

/**
 * Store session in localStorage
 */
export function setSession(session: Session): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to store session:", error);
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}
