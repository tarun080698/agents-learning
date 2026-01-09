import { z } from 'zod';

// Question ledger entry schema
export const questionLedgerEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum(['asked', 'answered']),
  answeredText: z.string().optional(),
  askedAt: z.string().optional(),
  answeredAt: z.string().optional(),
});

// Trip context schema - represents the structured trip planning data
export const tripContextSchema = z.object({
  trip: z.object({
    origin: z.string().nullable(),
    destinations: z.array(z.string()),
    dateRange: z.object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    }),
    travelers: z.number().nullable(),
    budget: z.object({
      level: z.enum(['low', 'mid', 'high']).nullable(),
      currency: z.string().nullable(),
    }),
    preferences: z.object({
      pace: z.enum(['relaxed', 'moderate', 'packed']).nullable(),
      interests: z.array(z.string()),
      dietary: z.array(z.string()),
      hotelStyle: z.string().nullable(),
      transportPreference: z.string().nullable().optional(),
    }),
    constraints: z.object({
      mustDo: z.array(z.string()),
      avoid: z.array(z.string()),
    }),
  }),
  decisions: z.object({
    confirmed: z.array(z.string()),
    pending: z.array(z.string()),
  }),
  openQuestions: z.array(z.string()),
  assumptions: z.array(z.string()),
  questionLedger: z.object({
    asked: z.array(questionLedgerEntrySchema),
  }).optional(),
});

// Task schema for specialist agents
export const taskSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  specialist: z.enum(['transport', 'stay', 'food']),
  instructions: z.string(),
});

// Specialist output schema
export const specialistOutputSchema = z.object({
  taskId: z.string(),
  agent: z.enum(['TransportAgent', 'StayAgent', 'FoodAgent']),
  recommendations: z.array(z.any()),
  questionsForUser: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
});

// Merged itinerary schema
export const mergedItinerarySchema = z.object({
  summary: z.string(),
  days: z.array(z.object({
    dayNumber: z.number(),
    date: z.string(),
    title: z.string(),
    transport: z.any().optional(),
    accommodation: z.object({
      name: z.string(),
      area: z.string().optional(),
      estimatedCost: z.string().optional(),
    }).optional(),
    meals: z.array(z.object({
      type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      recommendation: z.any(),
    })).optional(),
    activities: z.array(z.object({
      time: z.string(),
      description: z.string(),
      location: z.string().optional(),
    })).optional(),
  })),
  alternativeOptions: z.object({
    transport: z.array(z.any()).optional(),
    stays: z.array(z.any()).optional(),
    dining: z.array(z.any()).optional(),
  }).optional(),
});

// Master agent output schema - Step 3: supports CLARIFY, DISPATCH, FINALIZE
export const masterOutputSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('CLARIFY'),
    updatedTripContext: tripContextSchema,
    questions: z.array(z.string()).min(1).max(7),
    shortSummary: z.string(),
    nextStep: z.string(),
  }),
  z.object({
    mode: z.literal('DISPATCH'),
    updatedTripContext: tripContextSchema,
    tasks: z.array(taskSchema).min(1),
    questions: z.array(z.string()).max(0).default([]),
    shortSummary: z.string(),
    nextStep: z.string(),
  }),
  z.object({
    mode: z.literal('FINALIZE'),
    updatedTripContext: tripContextSchema,
    mergedItinerary: mergedItinerarySchema,
    questions: z.array(z.string()).max(0).default([]),
    shortSummary: z.string(),
    nextStep: z.string(),
  }),
]);

export type QuestionLedgerEntry = z.infer<typeof questionLedgerEntrySchema>;
export type TripContext = z.infer<typeof tripContextSchema>;
export type Task = z.infer<typeof taskSchema>;
export type SpecialistOutput = z.infer<typeof specialistOutputSchema>;
export type MergedItinerary = z.infer<typeof mergedItinerarySchema>;
export type MasterOutput = z.infer<typeof masterOutputSchema>;
