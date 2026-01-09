import OpenAI from 'openai';
import { TripContext, MasterOutput, masterOutputSchema, QuestionLedgerEntry, SpecialistOutput } from '@/lib/schemas/agent';
import { Message, User } from '@/lib/db/models';
import { normalizeTripDates } from '@/lib/utils';
import { isReadyToDispatch } from '@/lib/utils/questionLedger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MOCK_MODE = process.env.MOCK_OPENAI === 'true';

/**
 * Normalize dates in master output to ensure they're in the future
 */
function normalizeDatesInOutput(output: MasterOutput): MasterOutput {
  // Only normalize dates for modes that have updatedTripContext
  if (output.mode === 'CLARIFY' || output.mode === 'DISPATCH') {
    const startDate = output.updatedTripContext.trip.dateRange.start;
    const endDate = output.updatedTripContext.trip.dateRange.end;

    const { start, end, assumptions } = normalizeTripDates(startDate, endDate);

    return {
      ...output,
      updatedTripContext: {
        ...output.updatedTripContext,
        trip: {
          ...output.updatedTripContext.trip,
          dateRange: {
            start,
            end,
          },
        },
        assumptions: [
          ...output.updatedTripContext.assumptions,
          ...assumptions,
        ],
      },
    };
  } else if (output.mode === 'FINALIZE') {
    // FINALIZE mode: normalize dates in both updatedTripContext and mergedItinerary
    const startDate = output.updatedTripContext.trip.dateRange.start;
    const endDate = output.updatedTripContext.trip.dateRange.end;

    const { start, end, assumptions } = normalizeTripDates(startDate, endDate);

    // Normalize dates in each day of the itinerary
    const normalizedDays = output.mergedItinerary.days.map((day) => {
      if (!day.date) {
        // If date is missing, skip normalization but ensure it's a string
        return {
          ...day,
          date: start || new Date().toISOString().split('T')[0], // Fallback to start date or today
        };
      }

      const { start: normalizedDate } = normalizeTripDates(day.date, day.date);
      return {
        ...day,
        date: normalizedDate || day.date, // Fallback to original date if normalization fails
      };
    });

    return {
      ...output,
      updatedTripContext: {
        ...output.updatedTripContext,
        trip: {
          ...output.updatedTripContext.trip,
          dateRange: {
            start,
            end,
          },
        },
        assumptions: [
          ...output.updatedTripContext.assumptions,
          ...assumptions,
        ],
      },
      mergedItinerary: {
        ...output.mergedItinerary,
        days: normalizedDays,
      },
    };
  }

  return output;
}

// Master agent system prompt - Step 3: supports CLARIFY, DISPATCH, and FINALIZE modes
function getMasterSystemPrompt(
  answeredQuestions: QuestionLedgerEntry[],
  outstandingQuestions: QuestionLedgerEntry[],
  specialistOutputs?: SpecialistOutput[]
): string {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // Base prompt for CLARIFY/DISPATCH modes
  const basePrompt = `You are the Master Agent for a travel planning assistant. Your role is to either CLARIFY trip details OR DISPATCH tasks to specialist agents OR FINALIZE the itinerary.

CRITICAL RULES:
1. Always return STRICT JSON matching the required schema - no markdown, no extra text
2. NEVER ask questions that have already been answered
3. Make reasonable assumptions but list them in the assumptions array
4. Update the tripContext with ALL information gathered so far

CURRENT DATE: ${currentDate} (use this for date validation)

QUESTION LEDGER (CRITICAL - NO REPETITION):
Previously Answered Questions (DO NOT ASK THESE AGAIN):
${answeredQuestions.length > 0 ? answeredQuestions.map(q => `- "${q.text}" (answered: ${q.answeredText?.substring(0, 50)}...)`).join('\n') : '- None yet'}

Outstanding Questions (waiting for answers):
${outstandingQuestions.length > 0 ? outstandingQuestions.map(q => `- "${q.text}"`).join('\n') : '- None'}

MODE DECISION:
- Use "CLARIFY" mode if critical information is missing AND you need to ask questions
- Use "DISPATCH" mode when you have enough info to create detailed plans:
  * Must have: origin, destination, start date, travelers, budget level, pace, hotel style, dietary, interests/must-do
  * Transport preference is optional (can be assumed)
- If you have enough info, output mode="DISPATCH" with tasks array

DATE HANDLING (CRITICAL):
- When user provides dates without years (e.g., "16th Jan"), calculate next occurrence
- Use ${currentYear} as base year; if date passed, use ${currentYear + 1}
- Format as YYYY-MM-DD
- Add assumption: "Assumed year YYYY for 'date' (next occurrence)"
- End date must be after start date

TRIP CONTEXT STRUCTURE (CRITICAL - MUST FOLLOW EXACTLY):
updatedTripContext MUST have this exact nested structure:
{
  "trip": {
    "origin": "City name or null",
    "destinations": ["City 1", "City 2"],
    "dateRange": { "start": "YYYY-MM-DD or null", "end": "YYYY-MM-DD or null" },
    "travelers": 1,
    "budget": { "level": "low|mid|high or null", "currency": "USD or null" },
    "preferences": {
      "pace": "relaxed|moderate|packed or null",
      "interests": ["interest1", "interest2"],
      "dietary": ["vegetarian", "vegan"],
      "hotelStyle": "boutique or null",
      "transportPreference": "flight or null"
    },
    "constraints": {
      "mustDo": ["activity1"],
      "avoid": ["thing1"]
    }
  },
  "decisions": {
    "confirmed": ["fact1", "fact2"],
    "pending": ["question1", "question2"]
  },
  "openQuestions": ["question1", "question2"],
  "assumptions": ["assumption1", "assumption2"]
}

CLARIFY MODE OUTPUT EXAMPLE:
{
  "mode": "CLARIFY",
  "updatedTripContext": {
    "trip": {
      "origin": "Jersey City",
      "destinations": ["Washington DC"],
      "dateRange": { "start": "2026-01-14", "end": "2026-01-16" },
      "travelers": 1,
      "budget": { "level": "mid", "currency": "USD" },
      "preferences": {
        "pace": null,
        "interests": [],
        "dietary": ["vegetarian"],
        "hotelStyle": null,
        "transportPreference": null
      },
      "constraints": { "mustDo": [], "avoid": [] }
    },
    "decisions": {
      "confirmed": ["Jersey City to Washington DC", "1 traveler", "Mid budget", "Vegetarian"],
      "pending": ["Pace preference", "Interests", "Hotel style"]
    },
    "openQuestions": ["What is your preferred pace?", "What are your interests?"],
    "assumptions": ["Assumed year 2026 for dates"]
  },
  "questions": ["What is your preferred pace (relaxed, moderate, packed)?", "What are your main interests or must-do activities?"],
  "shortSummary": "Planning a weekend trip to Washington DC",
  "nextStep": "Once these questions are answered, we can dispatch to specialists"
}

DISPATCH MODE OUTPUT:
{
  "mode": "DISPATCH",
  "updatedTripContext": { /* full context */ },
  "tasks": [
    {
      "taskId": "transport-001",
      "taskName": "Get transport options",
      "specialist": "transport",
      "instructions": "Find flights, trains, and local transport from NYC to San Francisco. Consider 3 travelers, high budget, prefer morning flights."
    },
    {
      "taskId": "stay-001",
      "taskName": "Find accommodation",
      "specialist": "stay",
      "instructions": "Recommend 3-5 boutique hotels in walkable neighborhoods of San Francisco for 5 nights. High budget, 3 travelers."
    },
    {
      "taskId": "food-001",
      "taskName": "Dining recommendations",
      "specialist": "food",
      "instructions": "Vegan fine dining options in San Francisco. Note peanut allergy. Include 2-3 upscale restaurants and casual backups."
    }
  ],
  "questions": [],
  "shortSummary": "We have all the information needed. Creating detailed itinerary...",
  "nextStep": "Dispatching to specialist agents for transport, accommodation, and dining recommendations"
}`;

  // If specialist outputs provided, add FINALIZE mode prompt
  if (specialistOutputs && specialistOutputs.length > 0) {
    return basePrompt + `

========================================
IMPORTANT: SPECIALIST OUTPUTS RECEIVED
========================================

The specialist agents have completed their work. You MUST now use mode="FINALIZE" to merge their recommendations.

DO NOT use CLARIFY or DISPATCH mode. ONLY use FINALIZE mode when specialist outputs are present.

SPECIALIST OUTPUTS:
${JSON.stringify(specialistOutputs, null, 2)}

FINALIZE MODE OUTPUT (REQUIRED - USE THIS STRUCTURE):
{
  "mode": "FINALIZE",
  "updatedTripContext": {
    "trip": { /* keep same trip context from before */ },
    "decisions": { /* keep same decisions */ },
    "openQuestions": [],
    "assumptions": [ /* keep existing + add new if needed */ ]
  },
  "mergedItinerary": {
    "summary": "Brief 2-3 sentence overview of the complete trip",
    "days": [
      {
        "dayNumber": 1,
        "date": "2026-01-14",
        "title": "Travel Day & Arrival",
        "transport": {
          "provider": "Amtrak",
          "route": "Jersey City to Washington DC",
          "estimatedCost": "$50"
        },
        "accommodation": {
          "name": "The Darcy Hotel",
          "area": "Downtown DC",
          "estimatedCost": "$200/night"
        },
        "meals": [
          {
            "type": "dinner",
            "recommendation": {
              "name": "Fancy Radish",
              "cuisine": "Vegetarian fine dining",
              "estimatedCost": "$60",
              "reservationNote": "Book 1 week ahead"
            }
          }
        ],
        "activities": [
          {
            "time": "Evening",
            "description": "Walk around the National Mall",
            "location": "National Mall"
          }
        ]
      }
    ],
    "alternativeOptions": {
      "transport": [ /* other transport options from specialist */ ],
      "stays": [ /* other hotel options */ ],
      "dining": [ /* other restaurant options */ ]
    }
  },
  "questions": [],
  "shortSummary": "Your complete 3-day Washington DC itinerary is ready!",
  "nextStep": "Review the itinerary and let me know if you'd like any adjustments"
}

CRITICAL: You MUST output mode="FINALIZE" when specialist outputs are present. Do not use DISPATCH or CLARIFY.`;
  }

  return basePrompt;
}

export interface MasterAgentInput {
  currentTripContext: TripContext | null;
  conversationHistory: Message[];
  user: User;
  newUserMessage: string;
  answeredQuestions: QuestionLedgerEntry[];
  outstandingQuestions: QuestionLedgerEntry[];
  specialistOutputs?: SpecialistOutput[];
}

export interface MasterAgentResult {
  success: boolean;
  output?: MasterOutput;
  error?: string;
  rawResponse?: string;
}

/**
 * Call the Master Agent to clarify trip details or dispatch to specialists
 */
export async function callMasterAgent(input: MasterAgentInput): Promise<MasterAgentResult> {
  try {
    // Mock mode for testing without OpenAI
    if (MOCK_MODE) {
      return getMockResponse(input);
    }

    // Build conversation messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: getMasterSystemPrompt(
          input.answeredQuestions,
          input.outstandingQuestions,
          input.specialistOutputs
        ),
      },
    ];

    // Add context about current trip state
    if (input.currentTripContext) {
      messages.push({
        role: 'system',
        content: `Current Trip Context:\n${JSON.stringify(input.currentTripContext, null, 2)}`,
      });
    }

    // Add conversation history (last 20 messages)
    const recentMessages = input.conversationHistory.slice(-20);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content,
        });
      } else if (msg.role === 'master' || msg.role === 'specialist') {
        messages.push({
          role: 'assistant',
          content: msg.content,
        });
      }
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: input.newUserMessage,
    });

    // If specialist outputs present, add explicit FINALIZE instruction as user message
    if (input.specialistOutputs && input.specialistOutputs.length > 0) {
      messages.push({
        role: 'user',
        content: 'CRITICAL: Specialist outputs have been received. You MUST use mode="FINALIZE" to merge them into a day-by-day itinerary. Do NOT use CLARIFY or DISPATCH mode.',
      });
    }

    // Call OpenAI with JSON mode (lower temperature for FINALIZE to be more deterministic)
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: input.specialistOutputs && input.specialistOutputs.length > 0 ? 0.3 : 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content;

    if (!rawResponse) {
      return {
        success: false,
        error: 'No response from OpenAI',
      };
    }

    // Parse JSON response
    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(rawResponse);
    } catch {
      // Retry with explicit instruction
      const retryCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: rawResponse,
          },
          {
            role: 'user',
            content: 'Please return ONLY valid JSON matching the required schema, with no markdown or extra text.',
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const retryResponse = retryCompletion.choices[0]?.message?.content;
      if (!retryResponse) {
        return {
          success: false,
          error: 'Failed to get valid JSON response after retry',
          rawResponse,
        };
      }

      try {
        parsedOutput = JSON.parse(retryResponse);
      } catch {
        return {
          success: false,
          error: 'Failed to parse JSON even after retry',
          rawResponse: retryResponse,
        };
      }
    }

    // Validate against schema
    const validated = masterOutputSchema.safeParse(parsedOutput);

    if (!validated.success) {
      // Determine expected mode based on context
      const expectedMode = input.specialistOutputs && input.specialistOutputs.length > 0
        ? 'FINALIZE (specialist outputs received)'
        : 'CLARIFY or DISPATCH';

      // Try one repair attempt if schema invalid
      const repairCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: rawResponse,
          },
          {
            role: 'user',
            content: `Schema validation failed. Please return JSON strictly matching the required schema. Expected mode: ${expectedMode}. Here's the error: ${validated.error.message}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const repairResponse = repairCompletion.choices[0]?.message?.content;
      if (!repairResponse) {
        return {
          success: false,
          error: `Schema validation failed: ${validated.error.message}`,
          rawResponse,
        };
      }

      try {
        const repairParsed = JSON.parse(repairResponse);
        const repairValidated = masterOutputSchema.safeParse(repairParsed);

        if (!repairValidated.success) {
          return {
            success: false,
            error: `Schema validation failed after repair: ${repairValidated.error.message}`,
            rawResponse: repairResponse,
          };
        }

        // Success after repair - normalize dates and return
        const normalizedOutput = normalizeDatesInOutput(repairValidated.data);

        // Validate mode is correct when specialist outputs present
        if (input.specialistOutputs && input.specialistOutputs.length > 0 && normalizedOutput.mode !== 'FINALIZE') {
          return {
            success: false,
            error: `Expected FINALIZE mode when specialist outputs present, but got ${normalizedOutput.mode}`,
            rawResponse: repairResponse,
          };
        }

        return {
          success: true,
          output: normalizedOutput,
          rawResponse: repairResponse,
        };
      } catch {
        return {
          success: false,
          error: `Failed to parse repaired JSON: ${validated.error.message}`,
          rawResponse: repairResponse,
        };
      }
    }

    // Success on first try - normalize dates and return
    const normalizedOutput = normalizeDatesInOutput(validated.data);

    // Validate mode is correct when specialist outputs present
    if (input.specialistOutputs && input.specialistOutputs.length > 0 && normalizedOutput.mode !== 'FINALIZE') {
      // Try one more time with explicit FINALIZE-only instruction
      console.warn('Agent returned wrong mode, attempting FINALIZE-specific retry...');

      const finalizeRetry = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: rawResponse,
          },
          {
            role: 'user',
            content: `ERROR: You used mode="${normalizedOutput.mode}" but specialist outputs are present. You MUST use mode="FINALIZE" to merge the specialist recommendations into a day-by-day itinerary. Return the complete JSON with mode="FINALIZE" and include the mergedItinerary field.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const finalizeResponse = finalizeRetry.choices[0]?.message?.content;
      if (!finalizeResponse) {
        return {
          success: false,
          error: `Expected FINALIZE mode when specialist outputs present, but got ${normalizedOutput.mode}. Retry failed.`,
          rawResponse,
        };
      }

      try {
        const finalizeParsed = JSON.parse(finalizeResponse);
        const finalizeValidated = masterOutputSchema.safeParse(finalizeParsed);

        if (!finalizeValidated.success) {
          return {
            success: false,
            error: `FINALIZE retry validation failed: ${finalizeValidated.error.message}`,
            rawResponse: finalizeResponse,
          };
        }

        const finalizeNormalized = normalizeDatesInOutput(finalizeValidated.data);

        if (finalizeNormalized.mode !== 'FINALIZE') {
          return {
            success: false,
            error: `Agent still returned ${finalizeNormalized.mode} after explicit FINALIZE instruction. This should not happen.`,
            rawResponse: finalizeResponse,
          };
        }

        return {
          success: true,
          output: finalizeNormalized,
          rawResponse: finalizeResponse,
        };
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse FINALIZE retry response`,
          rawResponse: finalizeResponse,
        };
      }
    }

    return {
      success: true,
      output: normalizedOutput,
      rawResponse,
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling OpenAI',
    };
  }
}

/**
 * Mock response for testing without OpenAI API
 */
function getMockResponse(input: MasterAgentInput): MasterAgentResult {
  const userMessage = input.newUserMessage.toLowerCase();

  // Extract basic info from the message
  const hasOrigin = userMessage.includes('from');
  const hasDestination = userMessage.includes('to') || userMessage.includes('trip to');
  const hasDuration = /\d+\s*day/.test(userMessage);

  const mockOutput: MasterOutput = {
    mode: 'CLARIFY',
    updatedTripContext: {
      trip: {
        origin: hasOrigin ? userMessage.match(/from ([^to]+)/i)?.[1]?.trim() || null : null,
        destinations: hasDestination ? [userMessage.match(/to ([^from]+)|trip to ([^from]+)/i)?.[1]?.trim() || 'San Francisco'] : [],
        dateRange: { start: null, end: null },
        travelers: null,
        budget: { level: null, currency: null },
        preferences: {
          pace: null,
          interests: [],
          dietary: [],
          hotelStyle: null,
        },
        constraints: {
          mustDo: [],
          avoid: [],
        },
      },
      decisions: {
        confirmed: [],
        pending: ['Travel dates', 'Number of travelers', 'Budget range'],
      },
      openQuestions: [
        'When would you like to travel?',
        'How many people are traveling?',
        'What is your approximate budget for this trip?',
      ],
      assumptions: [
        'Assuming you want a complete itinerary with transport, accommodation, and activities',
      ],
    },
    questions: [
      'When would you like to travel? (specific dates or a general timeframe)',
      'How many people will be traveling?',
      'What is your approximate budget for this trip?',
      'What are your main interests? (e.g., food, culture, nature, tech, nightlife)',
    ],
    shortSummary: `Planning a trip${hasDestination ? ' to San Francisco' : ''}${hasOrigin ? ' from NYC' : ''}! Let me gather some details to create the perfect itinerary.`,
    nextStep: 'Once I have these details, I can recommend specific transport options, hotels, and activities.',
  };

  return {
    success: true,
    output: mockOutput,
    rawResponse: JSON.stringify(mockOutput),
  };
}

/**
 * Format master output for user-friendly display
 */
export function formatMasterResponse(output: MasterOutput): string {
  const parts: string[] = [];

  // Add summary
  if (output.shortSummary) {
    parts.push(output.shortSummary);
    parts.push('');
  }

  // Mode-specific formatting
  if (output.mode === 'CLARIFY') {
    // Add questions
    if (output.questions && output.questions.length > 0) {
      parts.push('I have a few questions to help plan your trip better:');
      output.questions.forEach((q, i) => {
        parts.push(`${i + 1}. ${q}`);
      });
      parts.push('');
    }
  } else if (output.mode === 'DISPATCH') {
    // Show that specialists are being dispatched
    if (output.tasks && output.tasks.length > 0) {
      parts.push(`I'm now working with ${output.tasks.length} specialist(s) to create your itinerary:`);
      output.tasks.forEach((task) => {
        parts.push(`- ${task.specialist}: ${task.taskName}`);
      });
      parts.push('');
    }
  } else if (output.mode === 'FINALIZE') {
    // Show itinerary summary
    const itinerary = output.mergedItinerary;
    parts.push(`🎉 Your ${itinerary.days.length}-day itinerary is ready!`);
    parts.push('');
    parts.push(itinerary.summary);
    parts.push('');

    // Show brief day-by-day overview
    itinerary.days.forEach((day) => {
      parts.push(`**Day ${day.dayNumber}** (${day.date}): ${day.title}`);
      if (day.accommodation) {
        parts.push(`  🏨 ${day.accommodation.name}`);
      }
      if (day.meals && day.meals.length > 0) {
        const dinnerCount = day.meals.filter(m => m.type === 'dinner').length;
        const lunchCount = day.meals.filter(m => m.type === 'lunch').length;
        if (dinnerCount > 0 || lunchCount > 0) {
          parts.push(`  🍽️ ${dinnerCount + lunchCount} dining recommendation(s)`);
        }
      }
      if (day.activities && day.activities.length > 0) {
        parts.push(`  🎯 ${day.activities.length} activity(ies)`);
      }
    });
    parts.push('');

    // Show alternative options count
    const altCount =
      (itinerary.alternativeOptions?.transport?.length || 0) +
      (itinerary.alternativeOptions?.stays?.length || 0) +
      (itinerary.alternativeOptions?.dining?.length || 0);

    if (altCount > 0) {
      parts.push(`✨ ${altCount} alternative option(s) available`);
      parts.push('');
    }
  }

  // Add next step
  if (output.nextStep) {
    parts.push(output.nextStep);
  }

  return parts.join('\n');
}
