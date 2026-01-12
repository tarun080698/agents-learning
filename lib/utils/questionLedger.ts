import { TripContext, QuestionLedgerEntry } from '@/lib/schemas/agent';

/**
 * Normalize question text for duplicate detection
 */
export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Collapse whitespace
}

/**
 * Check if a question ledger exists and initialize if needed
 */
export function ensureQuestionLedger(tripContext: TripContext): TripContext {
  if (!tripContext.questionLedger) {
    return {
      ...tripContext,
      questionLedger: {
        asked: [],
      },
    };
  }
  return tripContext;
}

/**
 * Add questions to the ledger with "asked" status
 */
export function addQuestionsToLedger(
  tripContext: TripContext,
  questions: string[]
): TripContext {
  const context = ensureQuestionLedger(tripContext);
  const now = new Date().toISOString();

  const newEntries: QuestionLedgerEntry[] = questions.map((q, index) => ({
    id: `q-${Date.now()}-${index}`,
    text: q,
    status: 'asked',
    askedAt: now,
  }));

  return {
    ...context,
    questionLedger: {
      asked: [...(context.questionLedger?.asked || []), ...newEntries],
    },
  };
}

/**
 * Mark questions as answered based on user message
 * Simple MVP: marks most recent unanswered questions as answered
 */
export function markQuestionsAsAnswered(
  tripContext: TripContext,
  userMessage: string
): TripContext {
  const context = ensureQuestionLedger(tripContext);
  const now = new Date().toISOString();

  // Find unanswered questions
  const unansweredQuestions = (context.questionLedger?.asked || []).filter(
    (q) => q.status === 'asked'
  );

  if (unansweredQuestions.length === 0) {
    return context;
  }

  // Try to detect numbered answers (1. answer, 2. answer, etc.)
  const numberedAnswers = userMessage.match(/^\s*\d+\.\s*.+$/gm);

  const updatedAsked = (context.questionLedger?.asked || []).map((q) => {
    if (q.status === 'answered') return q;

    // If we have numbered answers, try to map them
    if (numberedAnswers && numberedAnswers.length > 0) {
      const questionIndex = unansweredQuestions.findIndex((uq) => uq.id === q.id);
      if (questionIndex !== -1 && questionIndex < numberedAnswers.length) {
        return {
          ...q,
          status: 'answered' as const,
          answeredText: numberedAnswers[questionIndex].trim(),
          answeredAt: now,
        };
      }
    }

    // Fallback: mark all recent unanswered as answered with full message
    const isRecent = unansweredQuestions.some((uq) => uq.id === q.id);
    if (isRecent) {
      return {
        ...q,
        status: 'answered' as const,
        answeredText: userMessage,
        answeredAt: now,
      };
    }

    return q;
  });

  return {
    ...context,
    questionLedger: {
      asked: updatedAsked,
    },
  };
}

/**
 * Filter out duplicate questions that have already been answered
 */
export function filterDuplicateQuestions(
  questions: string[],
  tripContext: TripContext
): string[] {
  const context = ensureQuestionLedger(tripContext);
  const answeredQuestions = (context.questionLedger?.asked || [])
    .filter((q) => q.status === 'answered')
    .map((q) => normalizeQuestionText(q.text));

  // Also track questions in current batch to remove duplicates within
  const seenInBatch = new Set<string>();

  return questions.filter((q) => {
    const normalized = normalizeQuestionText(q);

    // Check if answered before
    if (answeredQuestions.includes(normalized)) {
      return false;
    }

    // Check if duplicate in current batch
    if (seenInBatch.has(normalized)) {
      return false;
    }

    seenInBatch.add(normalized);
    return true;
  });
}

/**
 * Filter master output to remove duplicate questions
 * Returns a new master output with filtered questions and updated ledger
 */
export function filterMasterOutput<T extends { questions: string[]; updatedTripContext: TripContext }>(
  currentTripContext: TripContext | null,
  masterOutput: T
): T {
  if (!currentTripContext) {
    // First interaction - add all questions to ledger
    const updated = addQuestionsToLedger(masterOutput.updatedTripContext, masterOutput.questions);
    return {
      ...masterOutput,
      updatedTripContext: updated,
    };
  }

  // Filter out duplicates
  const filtered = filterDuplicateQuestions(masterOutput.questions, currentTripContext);

  // Add new questions to ledger
  const updated = addQuestionsToLedger(masterOutput.updatedTripContext, filtered);

  return {
    ...masterOutput,
    questions: filtered,
    updatedTripContext: updated,
  };
}

/**
 * Get lists of answered and outstanding questions for master context
 */
export function getQuestionContext(tripContext: TripContext): {
  answered: QuestionLedgerEntry[];
  outstanding: QuestionLedgerEntry[];
} {
  const context = ensureQuestionLedger(tripContext);
  const asked = context.questionLedger?.asked || [];

  return {
    answered: asked.filter((q) => q.status === 'answered'),
    outstanding: asked.filter((q) => q.status === 'asked'),
  };
}

/**
 * Check if trip has enough information to dispatch to specialists
 * Requires comprehensive information gathering (10-15 questions minimum)
 */
export function isReadyToDispatch(tripContext: TripContext): boolean {
  const { trip, questionLedger } = tripContext;

  // Count answered questions to ensure we've gathered enough context
  const answeredQuestions = questionLedger?.asked?.filter(q => q.status === 'answered').length || 0;

  // Require at least 8 answered questions for comprehensive planning
  const hasEnoughQuestions = answeredQuestions >= 8;

  // Required minimum fields
  const hasOrigin = !!trip.origin;
  const hasDestination = trip.destinations.length > 0;
  const hasStartDate = !!trip.dateRange.start;
  const hasEndDate = !!trip.dateRange.end;
  const hasTravelers = !!trip.travelers;
  const hasBudgetLevel = !!trip.budget.level;
  const hasPace = !!trip.preferences.pace;
  const hasHotelStyle = !!trip.preferences.hotelStyle;
  const hasDietary = trip.preferences.dietary.length > 0;
  const hasInterestOrMustDo =
    trip.preferences.interests.length > 0 || trip.constraints.mustDo.length > 0;

  // Transport preference is optional (can be assumed)
  const hasTransportPreference = !!trip.preferences.transportPreference;

  return (
    hasEnoughQuestions &&
    hasOrigin &&
    hasDestination &&
    hasStartDate &&
    hasEndDate &&
    hasTravelers &&
    hasBudgetLevel &&
    hasPace &&
    hasHotelStyle &&
    hasDietary &&
    hasInterestOrMustDo &&
    (hasTransportPreference || true) // Transport can be assumed
  );
}
