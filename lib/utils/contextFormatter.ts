import type { TripContext } from '@/lib/schemas/agent';

/**
 * Formats trip context into a human-readable summary for user confirmation
 */
export function formatTripContextSummary(tripContext: TripContext): string {
  const { trip, decisions } = tripContext;
  const parts: string[] = [];

  parts.push('📋 **Here\'s what we have planned for your trip:**\n');

  // Basic trip info
  parts.push('### 🗺️ Trip Overview');
  if (trip.origin && trip.destinations.length > 0) {
    parts.push(`• **Route:** ${trip.origin} → ${trip.destinations.join(' → ')}`);
  }

  if (trip.dateRange.start && trip.dateRange.end) {
    const start = new Date(trip.dateRange.start);
    const end = new Date(trip.dateRange.end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    parts.push(`• **Dates:** ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} to ${end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} (${days} days)`);
  }

  if (trip.travelers) {
    parts.push(`• **Travelers:** ${trip.travelers} ${trip.travelers === 1 ? 'person' : 'people'}`);
  }

  parts.push('');

  // Budget & Style
  parts.push('### 💰 Budget & Style');
  if (trip.budget.level) {
    const budgetLabels = { low: 'Budget-Friendly', mid: 'Mid-Range', high: 'Luxury' };
    parts.push(`• **Budget:** ${budgetLabels[trip.budget.level] || trip.budget.level}`);
  }
  if (trip.preferences.pace) {
    const paceLabels = { relaxed: 'Relaxed (plenty of downtime)', moderate: 'Moderate (balanced)', packed: 'Packed (maximize activities)' };
    parts.push(`• **Pace:** ${paceLabels[trip.preferences.pace] || trip.preferences.pace}`);
  }
  if (trip.preferences.hotelStyle) {
    parts.push(`• **Accommodation Style:** ${trip.preferences.hotelStyle}`);
  }
  parts.push('');

  // Interests & Activities
  if (trip.preferences.interests && trip.preferences.interests.length > 0) {
    parts.push('### 🎯 Interests & Activities');
    parts.push(`• ${trip.preferences.interests.join(', ')}`);
    parts.push('');
  }

  if (trip.constraints.mustDo && trip.constraints.mustDo.length > 0) {
    parts.push('### ⭐ Must-Do Experiences');
    trip.constraints.mustDo.forEach(item => parts.push(`• ${item}`));
    parts.push('');
  }

  // Dining Preferences
  parts.push('### 🍽️ Dining Preferences');
  if (trip.preferences.dietary && trip.preferences.dietary.length > 0) {
    parts.push(`• **Dietary Requirements:** ${trip.preferences.dietary.join(', ')}`);
  } else {
    parts.push(`• No specific dietary restrictions`);
  }
  parts.push('');

  // Things to Avoid
  if (trip.constraints.avoid && trip.constraints.avoid.length > 0) {
    parts.push('### 🚫 Things to Avoid');
    trip.constraints.avoid.forEach(item => parts.push(`• ${item}`));
    parts.push('');
  }

  // Confirmation prompt
  parts.push('\n---\n');
  parts.push('**Does this look good?** Reply with:');
  parts.push('• "Yes" or "Looks good" to proceed with creating your itinerary options');
  parts.push('• Or let me know what you\'d like to change (e.g., "Add more museums" or "Switch to luxury hotels")');

  return parts.join('\n');
}

/**
 * Check if we have enough information to create an itinerary
 */
export function hasCompleteContext(tripContext: TripContext): boolean {
  const { trip } = tripContext;

  return !!(
    trip.origin &&
    trip.destinations.length > 0 &&
    trip.dateRange.start &&
    trip.dateRange.end &&
    trip.travelers &&
    trip.budget.level &&
    trip.preferences.pace &&
    (trip.preferences.interests && trip.preferences.interests.length > 0)
  );
}
