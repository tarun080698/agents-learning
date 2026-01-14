// Utility functions for generating trip metadata

export interface TripMetadata {
  title: string;
  origin?: string;
  destination?: string;
  tripDates?: {
    start?: string;
    end?: string;
  };
  progress: {
    hasDestination: boolean;
    hasOrigin: boolean;
    hasDates: boolean;
    hasItinerary: boolean;
    percentComplete: number;
  };
}

export function generateTripMetadata(tripContext: any, hasItinerary: boolean = false): TripMetadata {
  const origin = tripContext?.trip?.origin?.city || tripContext?.trip?.origin || null;
  const destination = tripContext?.trip?.destination?.city || tripContext?.trip?.destination || null;
  const startDate = tripContext?.trip?.dates?.start || null;
  const endDate = tripContext?.trip?.dates?.end || null;

  // Generate dynamic title
  let title = 'New Trip';
  if (destination && origin) {
    title = `${origin} to ${destination}`;
  } else if (destination) {
    title = `Trip to ${destination}`;
  } else if (origin) {
    title = `From ${origin}`;
  }

  // Calculate progress
  const hasDestination = !!destination;
  const hasOrigin = !!origin;
  const hasDates = !!(startDate && endDate);

  let percentComplete = 0;
  if (hasDestination) percentComplete += 25;
  if (hasOrigin) percentComplete += 25;
  if (hasDates) percentComplete += 25;
  if (hasItinerary) percentComplete += 25;

  return {
    title,
    origin: origin || undefined,
    destination: destination || undefined,
    tripDates: (startDate || endDate) ? {
      start: startDate || undefined,
      end: endDate || undefined,
    } : undefined,
    progress: {
      hasDestination,
      hasOrigin,
      hasDates,
      hasItinerary,
      percentComplete,
    },
  };
}
