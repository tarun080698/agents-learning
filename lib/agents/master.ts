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
  if (output.mode === 'CLARIFY' || output.mode === 'CONFIRM' || output.mode === 'DISPATCH') {
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
    // FINALIZE mode: normalize dates in updatedTripContext and all itinerary options
    const startDate = output.updatedTripContext.trip.dateRange.start;
    const endDate = output.updatedTripContext.trip.dateRange.end;

    const { start, end, assumptions } = normalizeTripDates(startDate, endDate);

    // Normalize dates in each itinerary option
    const normalizedOptions = output.multipleItineraries.options.map((option) => ({
      ...option,
      itinerary: {
        ...option.itinerary,
        days: option.itinerary.days.map((day) => {
          if (!day.date) {
            return {
              ...day,
              date: start || new Date().toISOString().split('T')[0],
            };
          }

          const { start: normalizedDate } = normalizeTripDates(day.date, day.date);
          return {
            ...day,
            date: normalizedDate || day.date,
          };
        }),
      },
    }));

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
      multipleItineraries: {
        ...output.multipleItineraries,
        options: normalizedOptions,
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
5. GATHER COMPREHENSIVE INFORMATION - Ask 10-15 relevant questions before dispatching to gather rich context
6. Be thorough but efficient - Don't exceed 20 questions total

CURRENT DATE: ${currentDate} (use this for date validation)

COMPREHENSIVE INFORMATION GATHERING:
Before dispatching, ensure you have gathered information about:
- Basic Trip Details: origin, destination(s), dates, number of travelers
- Budget: overall budget level and currency
- Travel Style: pace (relaxed/moderate/packed), interests, special occasions
- Accommodation: preferred hotel/stay style, location preferences, amenities needed
- Food & Dining: dietary restrictions, allergies, cuisine preferences, dining occasions
- Activities: must-do experiences, interests (culture, nature, adventure, etc.), things to avoid
- Transportation: mode preferences, comfort level, flexibility
- Special Considerations: accessibility needs, age groups, celebrations, work requirements
- Time Constraints: flexible dates, specific time requirements

QUESTION LEDGER (CRITICAL - NO REPETITION):
Previously Answered Questions (DO NOT ASK THESE AGAIN):
${answeredQuestions.length > 0 ? answeredQuestions.map(q => `- "${q.text}" (answered: ${q.answeredText?.substring(0, 50)}...)`).join('\n') : '- None yet'}

Outstanding Questions (waiting for answers):
${outstandingQuestions.length > 0 ? outstandingQuestions.map(q => `- "${q.text}"`).join('\n') : '- None'}

MODE DECISION:
- Use "CLARIFY" mode if you need to ask questions to gather comprehensive trip details (aim for 10-15 questions total before dispatching)
- Use "CONFIRM" mode when you have gathered sufficient detail and want user to review the context summary:
  * Must have: origin, destination, start date, end date, travelers, budget level, pace
  * Should have: interests, hotel style, dietary restrictions, must-do activities
  * Transport preference is optional (can be assumed)
  * Present a human-readable summary asking "Does this look good?" or "Ready to create your itinerary options?"
- Use "DISPATCH" mode when:
  * User explicitly confirms (says "yes", "looks good", "proceed", "ready", "correct", "confirmed", etc.)
  * User asks if it's enough/sufficient ("is this enough?", "can you proceed?", etc.) → Treat as implicit confirmation and proceed to DISPATCH
  * User makes small corrections and confirms
- If user in CONFIRM mode:
  * Asks questions, expresses uncertainty, or says "you tell me" → Provide brief guidance then offer to proceed. If they still seem uncertain, ask 1-2 clarifying questions about missing optional details (hotel style, dietary, must-dos), then proceed to DISPATCH
  * Points out errors or major gaps → Return to CLARIFY mode to gather correct information

DATE HANDLING (CRITICAL):
- When user provides dates without years (e.g., "16th Jan"), calculate next occurrence
- Use ${currentYear} as base year; if date passed, use ${currentYear + 1}
- Format as YYYY-MM-DD
- Add assumption: "Assumed year YYYY for 'date' (next occurrence)"
- End date must be after start date

TRIP CONTEXT STRUCTURE (CRITICAL - MUST FOLLOW EXACTLY):
updatedTripContext MUST have this exact nested structure FOR ALL MODES (CLARIFY, CONFIRM, DISPATCH, FINALIZE):
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

CRITICAL: openQuestions and assumptions MUST be arrays inside updatedTripContext, not at root level!

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

AVAILABLE SPECIALIST AGENTS (CRITICAL - ONLY USE THESE):
You have exactly THREE specialist agents available:
1. "transport" - Handles ALL transportation (flights, trains, buses, rental cars, local transit, airport transfers)
2. "stay" - Handles ALL accommodation (hotels, hostels, Airbnb, resorts, location recommendations)
3. "food" - Handles BOTH dining AND activities/experiences (restaurants, cafes, attractions, tours, activities, things to do)

IMPORTANT: There is NO separate "activities" specialist. The "food" specialist handles both dining and activities.
When dispatching, you MUST use ONLY these three specialist values: "transport", "stay", or "food"

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
      "taskName": "Dining and activities recommendations",
      "specialist": "food",
      "instructions": "Vegan fine dining options in San Francisco. Note peanut allergy. Include 2-3 upscale restaurants and casual backups. Also suggest hiking and biking activities, famous landmarks, and must-do experiences."
    }
  ],
  "questions": [],
  "shortSummary": "We have all the information needed. Creating detailed itinerary...",
  "nextStep": "Dispatching to specialist agents for transport, accommodation, and dining recommendations"
}

CONFIRM MODE OUTPUT (WHEN READY FOR USER CONFIRMATION):
{
  "mode": "CONFIRM",
  "updatedTripContext": {
    "trip": {
      "origin": "New York City",
      "destinations": ["San Francisco"],
      "dateRange": { "start": "2026-01-16", "end": "2026-01-20" },
      "travelers": 3,
      "budget": { "level": "high", "currency": "USD" },
      "preferences": {
        "pace": "moderate",
        "interests": ["hiking", "biking", "landmarks"],
        "dietary": ["vegan"],
        "hotelStyle": "boutique",
        "transportPreference": null
      },
      "constraints": {
        "mustDo": ["Golden Gate Bridge", "Alcatraz"],
        "avoid": ["tourist traps"]
      }
    },
    "decisions": {
      "confirmed": ["NYC to SF", "3 travelers", "High budget", "Vegan", "Peanut allergy"],
      "pending": []
    },
    "openQuestions": [],
    "assumptions": ["Assumed boutique hotels based on budget level"]
  },
  "contextSummary": "# Your Trip to San Francisco\\n\\n📍 **Trip Overview**\\n- From: New York City\\n- To: San Francisco\\n- Dates: January 16-20, 2026 (5 days, 4 nights)\\n- Travelers: 3 people\\n\\n💰 **Budget & Travel Style**\\n- Budget: High-end / Luxury\\n- Pace: Moderate (balanced)\\n- Accommodation: Boutique hotels\\n\\n🎯 **Your Interests**\\n- Hiking and outdoor activities\\n- Biking\\n- Famous landmarks\\n\\n🍽️ **Dining**\\n- Vegan fine dining preferred\\n- ⚠️ Peanut allergy (will confirm with all restaurants)\\n\\n✅ **Must-Do Experiences**\\n- Golden Gate Bridge\\n- Alcatraz tour\\n\\n❌ **Things to Avoid**\\n- Crowded tourist traps\\n\\n---\\n\\n**Does this look good? Ready to create your itinerary options?**",
  "questions": ["Confirm if this summary is accurate and we should proceed"],
  "shortSummary": "Context gathered. Awaiting your confirmation to create itinerary options.",
  "nextStep": "User reviews context summary and confirms to proceed to dispatch"
}

HANDLING USER RESPONSES IN CONFIRM MODE:
1. Clear confirmation (e.g., "yes", "looks good", "proceed", "ready", "that's correct") → DISPATCH mode immediately
2. Implicit confirmation / asking if sufficient (e.g., "is this enough?", "can you proceed?", "you tell me") → DISPATCH mode with encouraging note
3. Questions or uncertainty (e.g., "what else do you need?", "should I add more?") → Either DISPATCH with brief guidance OR ask 1-2 quick optional questions then DISPATCH
4. Pointing out errors (e.g., "no, I said 3 travelers not 2") → CLARIFY mode to fix the issue

IMPORTANT: Don't get stuck repeating the same CONFIRM message. If user seems uncertain but info is sufficient, proceed to DISPATCH.`;

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
CRITICAL: You MUST create 2-3 different itinerary options for the user to choose from!

{
  "mode": "FINALIZE",
  "updatedTripContext": {
    "trip": { /* keep same trip context from before */ },
    "decisions": { /* keep same decisions */ },
    "openQuestions": [],
    "assumptions": [ /* keep existing + add new if needed */ ]
  },
  "multipleItineraries": {
    "options": [
      {
        "id": "option-1",
        "title": "Balanced Experience",
        "description": "A well-rounded itinerary mixing culture, dining, and relaxation",
        "highlights": [
          "Mix of popular and hidden gems",
          "Moderate pace with flexibility",
          "Diverse dining experiences"
        ],
        "estimatedTotalCost": "$800-1000",
        "tags": ["Balanced", "Popular", "Flexible"],
        "itinerary": {
          "summary": "A balanced 3-day experience in Washington DC",
          "days": [
            {
              "dayNumber": 1,
              "date": "2026-01-14",
              "title": "Travel Day & Arrival",
              "transport": { "provider": "Amtrak", "route": "Jersey City to DC", "estimatedCost": "$50" },
              "accommodation": { "name": "The Darcy Hotel", "area": "Downtown", "estimatedCost": "$200/night" },
              "meals": [
                { "type": "dinner", "suggestion": "Fancy Radish (Vegetarian fine dining) - Try their seasonal vegetable tasting menu. Located at 600 Florida Ave NW. Reservations recommended. $50-70 per person.", "estimatedCost": "$60" }
              ],
              "activities": [
                { "name": "Evening stroll at National Mall", "time": "7:00 PM", "duration": "1 hour", "description": "Enjoy the monuments lit up at night, including Lincoln Memorial and Washington Monument" }
              ]
            }
          ],
          "alternativeOptions": {
            "transport": [],
            "stays": [],
            "dining": []
          }
        }
      },
      {
        "id": "option-2",
        "title": "Budget-Conscious Adventure",
        "description": "Maximize experiences while keeping costs lower",
        "highlights": [
          "Free museums and attractions",
          "More casual dining options",
          "Public transportation focus"
        ],
        "estimatedTotalCost": "$500-650",
        "tags": ["Budget-Friendly", "Active", "Local"],
        "itinerary": {
          "summary": "An affordable yet rich Washington DC experience",
          "days": [ /* similar structure with budget-friendly options */ ]
        }
      },
      {
        "id": "option-3",
        "title": "Premium Comfort Experience",
        "description": "Elevated accommodations and fine dining throughout",
        "highlights": [
          "Upscale hotels and dining",
          "Private tours and experiences",
          "Maximum comfort and convenience"
        ],
        "estimatedTotalCost": "$1500-2000",
        "tags": ["Luxury", "Comfort", "Exclusive"],
        "itinerary": {
          "summary": "A premium Washington DC getaway with top-tier experiences",
          "days": [ /* similar structure with premium options */ ]
        }
      }
    ],
    "comparisonNote": "All options cover the same destinations and timeframe but differ in accommodation quality, dining choices, and overall budget."
  },
  "questions": [],
  "shortSummary": "I've created 3 different itinerary options for your trip - from budget-conscious to premium!",
  "nextStep": "Review the options and let me know which one appeals to you most, or if you'd like adjustments to any of them"
}

CRITICAL RULES FOR FINALIZE MODE:
1. Always create 2-3 distinct options with meaningful differences
2. Vary the options by budget, pace, style, or focus
3. Each option should have a clear theme and target audience
4. Provide specific highlights and estimated costs for each
5. Use tags to help users quickly understand each option
6. You MUST output mode="FINALIZE" when specialist outputs are present. Do not use DISPATCH or CLARIFY.

CRITICAL FORMATTING RULES FOR ITINERARY DAYS:
- meals[].suggestion MUST be a STRING, not an object. Format as: "Restaurant Name (cuisine/details) - Description. Address. $XX-YY per person."
- meals[].type MUST be one of: "breakfast", "lunch", "dinner", "snack"
- meals[].estimatedCost is optional string
- activities[].name MUST be present (required string)
- activities[].time, duration, description, estimatedCost are optional strings
- DO NOT use "recommendation" field - use "suggestion" for meals
- DO NOT use "location" field in activities - include location info in description

CRITICAL LOCATION VERIFICATION:
- VERIFY all restaurant and activity addresses are in the DESTINATION CITY from the trip context
- Do NOT include places from other cities (e.g., DC restaurants in a Boston trip)
- Check that neighborhoods, street names, and zip codes match the destination city
- When merging specialist outputs, validate each address belongs to the destination`;
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
            content: `ERROR: You used mode="${normalizedOutput.mode}" but specialist outputs are present. You MUST use mode="FINALIZE" to merge the specialist recommendations into 2-3 different itinerary options. Return the complete JSON with mode="FINALIZE" and include the multipleItineraries field with options array.`,
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
    // Show multiple itinerary options summary
    const multipleItineraries = output.multipleItineraries;

    if (!multipleItineraries || !multipleItineraries.options) {
      parts.push('⚠️ Error: Itinerary options not available');
      return parts.join('\n');
    }

    parts.push(`🎉 I've created ${multipleItineraries.options.length} itinerary options for your trip!`);
    parts.push('');

    if (multipleItineraries.comparisonNote) {
      parts.push(multipleItineraries.comparisonNote);
      parts.push('');
    }

    // Show brief overview of each option
    multipleItineraries.options.forEach((option, index) => {
      parts.push(`**Option ${index + 1}: ${option.title}**`);
      parts.push(option.description);
      if (option.estimatedTotalCost) {
        parts.push(`💰 Estimated Cost: ${option.estimatedTotalCost}`);
      }
      if (option.itinerary?.days) {
        parts.push(`📅 ${option.itinerary.days.length} days`);
      }
      if (option.highlights && option.highlights.length > 0) {
        parts.push(`✨ Highlights: ${option.highlights.slice(0, 2).join(', ')}${option.highlights.length > 2 ? '...' : ''}`);
      }
      parts.push('');
    });

    parts.push('Review the options below and select your preferred itinerary!');
  }

  // Add next step
  if (output.nextStep) {
    parts.push(output.nextStep);
  }

  return parts.join('\n');
}
