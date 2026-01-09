import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Normalize date strings to ensure they're in the future
 * Handles dates without years by assuming next occurrence
 */
export function normalizeDateToFuture(dateStr: string | null): {
  normalized: string | null;
  assumption?: string
} {
  if (!dateStr) return { normalized: null };

  try {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Parse the date string
    let parsedDate = new Date(dateStr);

    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      // Try common formats without year
      const monthDayMatch = dateStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
      if (monthDayMatch) {
        const day = parseInt(monthDayMatch[1]);
        const monthStr = monthDayMatch[2];
        const months: Record<string, number> = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const month = months[monthStr.toLowerCase()];

        // Try current year first
        parsedDate = new Date(currentYear, month, day);

        // If date is in the past, use next year
        if (parsedDate < today) {
          parsedDate = new Date(currentYear + 1, month, day);
          const normalized = parsedDate.toISOString().split('T')[0];
          return {
            normalized,
            assumption: `Assumed year ${currentYear + 1} for '${dateStr}' (next occurrence)`
          };
        }

        const normalized = parsedDate.toISOString().split('T')[0];
        return {
          normalized,
          assumption: `Assumed year ${currentYear} for '${dateStr}'`
        };
      }

      // Cannot parse
      return { normalized: null };
    }

    // Date was parsed successfully
    // Check if it's in the past
    if (parsedDate < today) {
      // If the date appears to be missing a year or has wrong year, fix it
      const dateYear = parsedDate.getFullYear();
      if (dateYear < currentYear) {
        // Move to current or next year
        const updatedDate = new Date(parsedDate);
        updatedDate.setFullYear(currentYear);

        if (updatedDate < today) {
          updatedDate.setFullYear(currentYear + 1);
          const normalized = updatedDate.toISOString().split('T')[0];
          return {
            normalized,
            assumption: `Adjusted year from ${dateYear} to ${currentYear + 1} (date was in past)`
          };
        }

        const normalized = updatedDate.toISOString().split('T')[0];
        return {
          normalized,
          assumption: `Adjusted year from ${dateYear} to ${currentYear}`
        };
      }
    }

    // Date is valid and in the future
    return { normalized: parsedDate.toISOString().split('T')[0] };

  } catch (error) {
    console.error('Error normalizing date:', error);
    return { normalized: null };
  }
}

/**
 * Normalize trip dates ensuring they're in the future and logical
 */
export function normalizeTripDates(startDate: string | null, endDate: string | null): {
  start: string | null;
  end: string | null;
  assumptions: string[];
} {
  const assumptions: string[] = [];

  const startResult = normalizeDateToFuture(startDate);
  if (startResult.assumption) {
    assumptions.push(startResult.assumption);
  }

  let normalizedEnd = endDate;

  // If we have start but no end, and context suggests weekend trip
  if (startResult.normalized && !endDate) {
    const start = new Date(startResult.normalized);
    const dayOfWeek = start.getDay();

    // If start is Friday (5) or Saturday (6), assume weekend trip
    if (dayOfWeek === 5) {
      const end = new Date(start);
      end.setDate(end.getDate() + 2); // Fri-Sun
      normalizedEnd = end.toISOString().split('T')[0];
      assumptions.push('Assumed 3-day weekend trip (Friday to Sunday)');
    } else if (dayOfWeek === 6) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1); // Sat-Sun
      normalizedEnd = end.toISOString().split('T')[0];
      assumptions.push('Assumed weekend trip (Saturday to Sunday)');
    }
  }

  const endResult = normalizeDateToFuture(normalizedEnd);
  if (endResult.assumption) {
    assumptions.push(endResult.assumption);
  }

  // Validate end is after start
  if (startResult.normalized && endResult.normalized) {
    if (new Date(endResult.normalized) <= new Date(startResult.normalized)) {
      // End is same or before start, adjust end to be start + 2 days
      const start = new Date(startResult.normalized);
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      return {
        start: startResult.normalized,
        end: end.toISOString().split('T')[0],
        assumptions: [...assumptions, 'Adjusted end date to be 2 days after start (was invalid)']
      };
    }
  }

  return {
    start: startResult.normalized,
    end: endResult.normalized,
    assumptions
  };
}