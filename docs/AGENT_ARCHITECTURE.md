# Agent Architecture

Complete documentation of the AI agent system used in Travel Agentic Planner.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Master Agent](#master-agent)
3. [Specialist Agents](#specialist-agents)
4. [Agent Flow](#agent-flow)
5. [Mode Transitions](#mode-transitions)
6. [Question Ledger System](#question-ledger-system)
7. [OpenAI Integration](#openai-integration)
8. [Error Handling](#error-handling)

---

## Architecture Overview

### System Design

Travel Agentic Planner uses a **hierarchical multi-agent architecture** where a Master Agent orchestrates the conversation and delegates specialized tasks to Specialist Agents.

```
User Input
    ↓
Master Agent (Orchestrator)
    ├─→ CLARIFY Mode: Ask questions to gather trip details
    ├─→ CONFIRM Mode: Validate gathered information
    ├─→ DISPATCH Mode: Delegate to specialists
    │   ├─→ TransportAgent: Transportation recommendations
    │   ├─→ StayAgent: Accommodation recommendations
    │   └─→ FoodAgent: Dining recommendations
    └─→ FINALIZE Mode: Merge specialist outputs into 2-3 itinerary options
            ↓
User selects itinerary
```

### Key Principles

1. **Structured Outputs:** All agent responses are JSON validated with Zod schemas
2. **Conversation Memory:** Recent 50 messages + accumulated trip context
3. **Progressive Disclosure:** Ask only necessary questions, avoid repetition
4. **Diversity by Design:** Generate 2-3 distinctly different itinerary options
5. **Explainable AI:** All assumptions, risks, and questions clearly documented
6. **Error Recovery:** Graceful fallbacks when validation fails

### Technology Stack

- **AI Model:** OpenAI GPT-4o-mini (configurable via `OPENAI_MODEL` env var)
- **Structured Outputs:** OpenAI `response_format: { type: 'json_object' }`
- **Validation:** Zod schemas with discriminated unions
- **Retry Logic:** Validation errors trigger helpful correction prompts
- **Mock Mode:** `MOCK_OPENAI=true` for testing without API calls

---

## Master Agent

**Location:** `lib/agents/master.ts`

### Responsibility

The Master Agent is the central orchestrator responsible for:
- Managing conversation flow through 4 distinct modes
- Accumulating trip context (origin, destination, dates, preferences, etc.)
- Tracking asked/answered questions to avoid repetition
- Determining when enough information is gathered to dispatch specialists
- Merging specialist outputs into final itinerary options

### Agent Modes

The Master Agent operates in **4 sequential modes** (discriminated union):

#### 1. CLARIFY Mode

**Purpose:** Gather missing trip information by asking focused questions.

**When Used:**
- Initial conversation stages
- When critical information is missing (destination, dates, travelers)
- When user provides vague or incomplete details

**Output Schema:**
```typescript
{
  mode: "CLARIFY",
  updatedTripContext: TripContext,
  questions: string[],  // 1-7 questions
  shortSummary: string,
  nextStep: string
}
```

**Example Prompt (excerpt):**
```
CLARIFY MODE:
You need more information before planning. Ask 1-7 focused questions to fill gaps in trip context.

PRIORITY QUESTIONS (ask if missing):
1. Destination(s)
2. Date range or duration
3. Number of travelers
4. Budget level (low/mid/high)

DO NOT ASK:
- Questions already answered (check questionLedger)
- Multiple questions about same topic
- Open-ended "tell me everything" questions

Ask specific, actionable questions that move planning forward.
```

**Example Output:**
```json
{
  "mode": "CLARIFY",
  "updatedTripContext": {
    "trip": {
      "origin": "New York City",
      "destinations": ["Boston"],
      "dateRange": { "start": null, "end": null },
      "travelers": null,
      ...
    },
    ...
  },
  "questions": [
    "What specific dates are you considering for your Boston trip?",
    "How many people will be traveling?",
    "What's your budget level: economy, mid-range, or luxury?"
  ],
  "shortSummary": "Clarifying trip dates, travelers, and budget",
  "nextStep": "Gather dates, traveler count, and budget level"
}
```

---

#### 2. CONFIRM Mode

**Purpose:** Validate gathered information before dispatching to specialists.

**When Used:**
- After CLARIFY mode when most information is collected
- When user says "looks good" or "yes, that's correct"
- Optional: can skip directly to DISPATCH if high confidence

**Output Schema:**
```typescript
{
  mode: "CONFIRM",
  updatedTripContext: TripContext,
  contextSummary: string,  // Human-readable summary of trip details
  questions: string[],     // 0-1 confirmation question
  shortSummary: string,
  nextStep: string
}
```

**Example Prompt (excerpt):**
```
CONFIRM MODE:
You have gathered enough information. Summarize trip details and ask for confirmation.

SUMMARY SHOULD INCLUDE:
- Origin and destination(s)
- Date range
- Number of travelers
- Budget level
- Key preferences (pace, interests, dietary)
- Must-do activities or constraints

CONFIRMATION QUESTION (optional):
"Does this look correct? Anything you'd like to adjust?"
```

**Example Output:**
```json
{
  "mode": "CONFIRM",
  "updatedTripContext": { ... },
  "contextSummary": "Trip Summary:\n- Origin: New York City\n- Destination: Boston\n- Dates: Feb 15-18, 2026\n- Travelers: 2 adults\n- Budget: Mid-range\n- Pace: Moderate\n- Interests: History, food\n- Must-do: Freedom Trail",
  "questions": ["Does this capture everything correctly?"],
  "shortSummary": "Confirming trip details before planning",
  "nextStep": "Wait for user confirmation, then dispatch to specialists"
}
```

---

#### 3. DISPATCH Mode

**Purpose:** Delegate specialized research to Specialist Agents.

**When Used:**
- After CONFIRM mode when user approves trip details
- When trip context has: destination, dates, travelers, budget, key preferences
- Automatically triggers specialist agent calls

**Output Schema:**
```typescript
{
  mode: "DISPATCH",
  updatedTripContext: TripContext,
  tasks: Task[],  // 1-3 tasks (transport, stay, food)
  questions: string[],  // Must be empty array
  shortSummary: string,
  nextStep: string
}
```

**Task Schema:**
```typescript
{
  taskId: string,  // "task-1", "task-2", etc.
  taskName: string,  // "Transport Research", "Accommodation Research"
  specialist: "transport" | "stay" | "food",
  instructions: string  // Detailed instructions for specialist
}
```

**Example Prompt (excerpt):**
```
DISPATCH MODE:
Trip details are confirmed. Create tasks for specialist agents.

REQUIRED TASKS:
1. Transport: Origin-to-destination + local transport
2. Stay: Accommodation recommendations (2-3 options)
3. Food: Dining recommendations (breakfast, lunch, dinner)

TASK INSTRUCTIONS SHOULD INCLUDE:
- Specific requirements from trip context
- Budget constraints
- User preferences (pace, dietary, hotel style)
- Must-do activities that affect recommendations
- Date range and traveler count

DO NOT ask questions in DISPATCH mode (questions array must be empty).
```

**Example Output:**
```json
{
  "mode": "DISPATCH",
  "updatedTripContext": { ... },
  "tasks": [
    {
      "taskId": "task-1",
      "taskName": "Transport Research",
      "specialist": "transport",
      "instructions": "Research transport from NYC to Boston for 2 travelers, Feb 15-18. Mid-range budget. Provide flight, train, and bus options with estimated costs. Include local Boston transport."
    },
    {
      "taskId": "task-2",
      "taskName": "Accommodation Research",
      "specialist": "stay",
      "instructions": "Find 2-3 hotel options in Boston for 3 nights (Feb 15-17). Mid-range budget, boutique style preferred. Near Freedom Trail and public transport."
    },
    {
      "taskId": "task-3",
      "taskName": "Food Research",
      "specialist": "food",
      "instructions": "Recommend dining options for 3 days in Boston. Mid-range budget, interests in local food scene and history. Include breakfast, lunch, dinner suggestions."
    }
  ],
  "questions": [],
  "shortSummary": "Dispatching research to specialist agents",
  "nextStep": "Collect specialist recommendations and merge into itinerary"
}
```

**API Processing:**
When DISPATCH mode is detected, the Chat API automatically:
1. Calls each specialist agent with task instructions
2. Collects specialist outputs (recommendations, questions, assumptions, risks)
3. Saves specialist messages to database
4. Calls Master Agent again in FINALIZE mode with specialist outputs

---

#### 4. FINALIZE Mode

**Purpose:** Merge specialist outputs into 2-3 diverse itinerary options for user selection.

**When Used:**
- After DISPATCH mode when all specialist outputs are collected
- Only triggered automatically by API after specialist agents complete
- User never directly triggers FINALIZE mode

**Output Schema:**
```typescript
{
  mode: "FINALIZE",
  updatedTripContext: TripContext,
  multipleItineraries: {
    options: ItineraryOption[],  // 2-3 options (min 1, max 3)
    comparisonNote: string
  },
  questions: string[],  // Must be empty array
  shortSummary: string,
  nextStep: string
}
```

**Itinerary Option Schema:**
```typescript
{
  id: string,  // "opt-1", "opt-2", "opt-3"
  title: string,  // "Budget Explorer", "Balanced Experience", "Luxury Escape"
  description: string,  // Brief overview of this option's character
  highlights: string[],  // Key distinguishing features
  estimatedTotalCost: string,  // "$300-400", "$600-800", "$1200-1500"
  itinerary: {
    summary: string,
    days: DayItinerary[],  // Day-by-day breakdown
    alternativeOptions: {
      transport: any[],
      stays: any[],
      dining: any[]
    }
  },
  tags: string[]  // ["Budget-Friendly", "Local", "Walking"]
}
```

**Example Prompt (excerpt):**
```
FINALIZE MODE OUTPUT (REQUIRED - USE THIS STRUCTURE):
**MANDATORY: You MUST create 2-3 COMPLETELY DIFFERENT itinerary options!**

Each option must be DISTINCTLY DIFFERENT from the others. Create diversity through:
- Budget level (economy vs mid-range vs luxury)
- Pace (relaxed vs moderate vs packed)
- Focus (adventure vs culture vs relaxation)
- Style (local/authentic vs tourist-friendly vs exclusive)

DO NOT create similar options - make each one appeal to a different type of traveler!

Example diversity patterns:
- Option 1: Budget-conscious, packed schedule, street food focus
- Option 2: Mid-range, balanced pace, mix of experiences
- Option 3: Luxury, relaxed pace, fine dining and premium hotels

CRITICAL RULES FOR FINALIZE MODE:
1. **MANDATORY: Always create AT LEAST 2 distinct options** (3 is preferred)
2. Each option MUST be meaningfully different - not just minor variations
3. Vary options by: budget tier, activity pace, accommodation style, dining approach, or experience focus
4. Each option should target a different traveler type or preference
5. Option titles must clearly convey the key difference
6. Provide specific highlights that show why this option is unique
7. Estimated costs should reflect the tier (budget: 30-50% less, luxury: 50-100% more than mid-range)
8. Use descriptive tags that help users quickly identify the option's character
9. You MUST output mode="FINALIZE" when specialist outputs are present
10. **If you create only 1 option, the response will be rejected - always create 2-3!**
```

**Example Output:**
```json
{
  "mode": "FINALIZE",
  "updatedTripContext": { ... },
  "multipleItineraries": {
    "options": [
      {
        "id": "opt-1",
        "title": "Budget Explorer",
        "description": "Affordable Boston adventure with authentic local experiences",
        "highlights": [
          "Megabus or regional train from NYC",
          "Budget-friendly hostel in downtown Boston",
          "Local food trucks and casual dining",
          "Free walking tours and public attractions",
          "MBTA subway for all local transport"
        ],
        "estimatedTotalCost": "$300-$400 per person",
        "itinerary": {
          "summary": "3-day budget-friendly Boston exploration...",
          "days": [
            {
              "dayNumber": 1,
              "date": "2026-02-15",
              "title": "Arrival & Freedom Trail",
              "transport": { /* transport details */ },
              "accommodation": { /* hostel details */ },
              "meals": [ /* budget meal suggestions */ ],
              "activities": [ /* free/low-cost activities */ ]
            },
            // ... days 2-3
          ],
          "alternativeOptions": { /* alternatives */ }
        },
        "tags": ["Budget-Friendly", "Local", "Walking", "Authentic"]
      },
      {
        "id": "opt-2",
        "title": "Balanced Experience",
        "description": "Mix of comfort and value with popular attractions",
        "highlights": [
          "Amtrak Acela train for comfort",
          "Mid-range hotel near Public Garden",
          "Mix of casual and sit-down restaurants",
          "Guided tours and museums",
          "Uber/Lyft + occasional MBTA"
        ],
        "estimatedTotalCost": "$700-$900 per person",
        "itinerary": { /* mid-range itinerary */ },
        "tags": ["Balanced", "Comfortable", "Popular", "Convenient"]
      },
      {
        "id": "opt-3",
        "title": "Premium Comfort",
        "description": "Luxury Boston experience with exclusive access",
        "highlights": [
          "First-class Acela or direct flight",
          "5-star hotel in Back Bay",
          "Fine dining at award-winning restaurants",
          "Private tours and VIP museum access",
          "Private car service throughout"
        ],
        "estimatedTotalCost": "$1800-$2200 per person",
        "itinerary": { /* luxury itinerary */ },
        "tags": ["Luxury", "Premium", "Exclusive", "Hassle-Free"]
      }
    ],
    "comparisonNote": "All three options cover Boston's iconic attractions (Freedom Trail, Fenway Park, museums) but differ significantly in comfort level, pace, and cost. Choose based on your priorities: savings (Budget), balance (Balanced), or indulgence (Premium)."
  },
  "questions": [],
  "shortSummary": "Created 3 distinct itinerary options for user selection",
  "nextStep": "User selects preferred itinerary option"
}
```

---

### Mode Transition Logic

The Master Agent automatically determines which mode to use based on trip context completeness:

```typescript
function determineMode(tripContext, conversationHistory, specialistOutputsPresent) {
  if (specialistOutputsPresent) {
    return "FINALIZE";  // Always FINALIZE when specialists have responded
  }

  if (isReadyToDispatch(tripContext)) {
    return "DISPATCH";  // Enough info gathered, delegate to specialists
  }

  if (mostInfoGathered(tripContext) && userRecentlyConfirmed(conversationHistory)) {
    return "CONFIRM";  // Validate before dispatching
  }

  return "CLARIFY";  // Default: gather more information
}
```

**isReadyToDispatch Criteria:**
- ✅ Has destination
- ✅ Has date range (start and end)
- ✅ Has traveler count
- ✅ Has budget level
- ✅ No unanswered questions in ledger (all asked questions have been answered)

---

## Specialist Agents

Specialist Agents are focused experts that provide detailed recommendations for specific travel aspects.

### Common Properties

All specialist agents share:
- **Input:** Task object with taskId, taskName, specialist, instructions
- **Output:** SpecialistOutput with recommendations, questions, assumptions, risks
- **Validation:** Zod schema `specialistOutputSchema`
- **Error Handling:** Graceful fallback with error message in recommendations
- **No Database Access:** Specialists are stateless, receive all context in task instructions

---

### TransportAgent

**Location:** `lib/agents/transport.ts`

**Responsibility:** Provide transportation recommendations for origin-to-destination travel and local transport.

**Key Features:**
- Multiple transport modes (flight, train, bus, car)
- Detailed cost breakdowns with booking tips
- Local transport routes (metro, bike, rideshare)
- Walk times and distances
- Pros/cons for each option
- Season/time-of-day considerations

**Important Distinction:**
- **Origin-to-Destination:** How to get from starting point to destination (flights, trains, buses)
- **Local Transport:** How to get around at the destination (metro, walking, rideshare)
- User saying "I have a car" typically means local transport, NOT driving long distances

**Example Recommendations:**
```json
{
  "taskId": "task-1",
  "agent": "TransportAgent",
  "recommendations": [
    {
      "option": "Flight - Nonstop",
      "provider": "United Airlines, Delta, or American Airlines",
      "route": "New York JFK Terminal 4 → San Francisco SFO Terminal 2",
      "distance": "2,586 miles",
      "duration": "6 hours (5h 30m flight + 30m taxi/boarding)",
      "schedule": "Morning departure 8:00 AM, arrival 11:30 AM local time",
      "estimatedCost": "$250-$450 per person (economy)",
      "bookingTips": "Book 6-8 weeks in advance for best rates. Tuesday/Wednesday flights often cheaper.",
      "pros": ["Fastest option", "Multiple daily flights", "Arrive refreshed for first day"],
      "cons": ["Most expensive", "Airport security time", "Baggage fees extra"],
      "localTransport": "BART train from SFO to downtown: $10.15, 30 minutes to Powell St."
    },
    {
      "option": "Train - Amtrak Coast Starlight",
      "provider": "Amtrak",
      "route": "New York Penn Station → Oakland Jack London Square (transfer to SF via BART)",
      "distance": "2,900 miles",
      "duration": "3 days (with overnight stops)",
      "schedule": "Departs daily at 9:30 AM",
      "estimatedCost": "$150-$350 per person (coach), $400-$800 (sleeper)",
      "bookingTips": "Book early for sleeper cars. Saver fares available 14+ days ahead.",
      "pros": ["Scenic views", "Spacious seats", "No baggage fees", "Can walk around"],
      "cons": ["Much slower", "Limited schedules", "Requires transfer"],
      "localTransport": "BART from Oakland to SF: $4.50, 20 minutes"
    }
  ],
  "questionsForUser": [
    "Do you prefer speed (flight) or scenic experience (train)?"
  ],
  "assumptions": [
    "Economy class assumed for flights",
    "Coach assumed for trains",
    "Traveling with 1 carry-on and 1 checked bag"
  ],
  "risks": [
    "Flight prices fluctuate by season (higher in summer)",
    "Train delays possible due to freight priority",
    "Weather may cause cancellations"
  ]
}
```

---

### StayAgent

**Location:** `lib/agents/stay.ts`

**Responsibility:** Provide accommodation recommendations matching user preferences and budget.

**Key Features:**
- 2-3 hotel/accommodation options
- Detailed location descriptions (neighborhood, walkability)
- Amenities and room types
- Booking platforms and tips
- Proximity to attractions and transport
- Budget-appropriate suggestions

**Example Recommendations:**
```json
{
  "taskId": "task-2",
  "agent": "StayAgent",
  "recommendations": [
    {
      "name": "The Liberty Hotel",
      "type": "Boutique Hotel",
      "location": "Beacon Hill, Boston",
      "address": "215 Charles Street, Boston, MA 02114",
      "neighborhood": "Beacon Hill - historic area near Charles/MGH T station",
      "walkability": "15 min walk to Freedom Trail, 10 min to Boston Common, near Red Line T",
      "estimatedCost": "$200-$300 per night (mid-range room)",
      "roomType": "Deluxe King or Double Queen",
      "amenities": ["Free Wi-Fi", "Fitness center", "Restaurant/bar", "24-hour front desk", "Historic architecture"],
      "bookingPlatforms": ["Booking.com", "Hotels.com", "Direct hotel website"],
      "bookingTips": "Book direct for potential upgrades. Check for AAA/AARP discounts. Weekend rates higher.",
      "pros": ["Unique historic building (former jail)", "Great location", "Walkable to attractions", "Near T station"],
      "cons": ["Can be pricey on weekends", "Rooms vary in size", "Paid parking ($45/night)"],
      "bestFor": "History enthusiasts, central location seekers"
    },
    {
      "name": "HI Boston Hostel",
      "type": "Hostel",
      "location": "Downtown Boston",
      "address": "19 Stuart Street, Boston, MA 02116",
      "neighborhood": "Theatre District - near Boylston T station",
      "walkability": "Walking distance to Boston Common, Public Garden, Back Bay",
      "estimatedCost": "$40-$60 per night (dorm bed), $100-$140 (private room)",
      "roomType": "4-bed or 6-bed dorm, or private rooms",
      "amenities": ["Free Wi-Fi", "Kitchen", "Common areas", "Lockers", "Laundry"],
      "bookingPlatforms": ["Hostelworld", "Booking.com", "HI USA website"],
      "bookingTips": "Book early for private rooms. HI membership saves 10%.",
      "pros": ["Very affordable", "Social atmosphere", "Central location", "Kitchen saves on food costs"],
      "cons": ["Shared bathrooms in dorms", "Can be noisy", "No daily housekeeping"],
      "bestFor": "Budget travelers, solo travelers, meeting other travelers"
    }
  ],
  "questionsForUser": ["Do you prefer boutique character or budget savings?"],
  "assumptions": ["2 adults sharing one room", "3 nights stay", "Mid-range budget"],
  "risks": ["Hotel prices surge during major events", "Popular hotels book up 3+ months ahead"]
}
```

---

### FoodAgent

**Location:** `lib/agents/food.ts`

**Responsibility:** Provide dining recommendations for breakfast, lunch, dinner, and snacks.

**Key Features:**
- Meal-specific recommendations (breakfast, lunch, dinner)
- Budget-appropriate options
- Dietary accommodations
- Local specialties and must-try dishes
- Reservation requirements
- Locations near attractions/hotel

**Example Recommendations:**
```json
{
  "taskId": "task-3",
  "agent": "FoodAgent",
  "recommendations": [
    {
      "mealType": "breakfast",
      "name": "Flour Bakery + Cafe",
      "cuisine": "Bakery/Cafe",
      "location": "Multiple locations (Back Bay, Cambridge, etc.)",
      "neighborhood": "Various - check closest to your hotel",
      "mustTryDishes": ["Sticky Buns", "Breakfast Sandwiches", "Fresh Pastries"],
      "estimatedCost": "$8-$15 per person",
      "dietaryOptions": ["Vegetarian options", "Some gluten-free pastries"],
      "reservationNeeded": false,
      "hours": "7:00 AM - 8:00 PM daily",
      "pros": ["Award-winning", "Quick service", "Multiple locations", "Great coffee"],
      "cons": ["Can have lines", "Limited seating at some locations"],
      "bestFor": "Quick breakfast before sightseeing",
      "tips": "Go early to avoid crowds. Try the sticky buns while they're warm."
    },
    {
      "mealType": "lunch",
      "name": "Neptune Oyster",
      "cuisine": "Seafood",
      "location": "North End, Boston",
      "neighborhood": "Near Paul Revere House, on Freedom Trail route",
      "mustTryDishes": ["Lobster Roll", "Fresh Oysters", "Clam Chowder"],
      "estimatedCost": "$25-$40 per person",
      "dietaryOptions": ["Some vegetarian sides", "Gluten-free options available"],
      "reservationNeeded": true,
      "hours": "11:30 AM - 10:00 PM",
      "waitTime": "30-60 minutes without reservation",
      "reservationTips": "Book 1-2 weeks ahead for lunch, earlier for dinner. Walk-ins accepted but expect wait.",
      "pros": ["Best lobster roll in Boston", "Fresh seafood", "Near Freedom Trail"],
      "cons": ["Small space", "Can be loud", "Long waits without reservation"],
      "bestFor": "Seafood lovers, lobster roll seekers",
      "tips": "Order the lobster roll hot with butter. Pair with a local Sam Adams beer."
    },
    {
      "mealType": "dinner",
      "name": "Union Oyster House",
      "cuisine": "Seafood/American",
      "location": "Downtown Boston",
      "neighborhood": "Near Faneuil Hall",
      "historicalNote": "Oldest continuously operating restaurant in the US (since 1826)",
      "mustTryDishes": ["New England Clam Chowder", "Baked Scrod", "Oysters"],
      "estimatedCost": "$30-$50 per person",
      "dietaryOptions": ["Vegetarian options", "Gluten-free menu"],
      "reservationNeeded": true,
      "hours": "11:00 AM - 10:00 PM daily",
      "pros": ["Historic atmosphere", "Tourist-friendly", "Classic Boston dishes"],
      "cons": ["Touristy", "Can be crowded", "Not the most innovative menu"],
      "bestFor": "History buffs, classic Boston dining experience",
      "tips": "Ask to sit upstairs for quieter atmosphere. Daniel Webster's favorite booth available."
    }
  ],
  "questionsForUser": ["Any dietary restrictions or allergies?"],
  "assumptions": ["Mid-range budget", "Interested in local specialties", "Willing to make reservations"],
  "risks": ["Popular restaurants book up weeks ahead", "Seafood prices vary by season"]
}
```

---

## Agent Flow

### Complete Conversation Flow

```
1. User: "I want to visit Boston for a long weekend"
   ↓
2. Master Agent (CLARIFY): Asks for dates, travelers, budget
   User: "Feb 15-18, 2 people, mid-range budget"
   ↓
3. Master Agent (CLARIFY): Asks for preferences (pace, interests, must-do)
   User: "Moderate pace, love history and food, must see Freedom Trail"
   ↓
4. Master Agent (CONFIRM): Summarizes trip details, asks for confirmation
   User: "Yes, that's perfect!"
   ↓
5. Master Agent (DISPATCH): Creates 3 tasks for specialists
   ├→ TransportAgent: Gets transport options (flight, train, local)
   ├→ StayAgent: Gets hotel options (boutique, mid-range, budget)
   └→ FoodAgent: Gets dining options (breakfast, lunch, dinner)
   ↓
6. Master Agent (FINALIZE): Merges specialist outputs into 3 itinerary options
   - Budget Explorer ($300-400)
   - Balanced Experience ($700-900)
   - Premium Comfort ($1800-2200)
   ↓
7. User: Selects "Balanced Experience"
   ↓
8. System: Saves itinerary, updates trip status, records selection
```

### Data Flow Through Agents

```
API Handler (chat/route.ts)
    ↓
Load Context:
    - Trip (with tripContext)
    - User (for personalization)
    - Recent 50 messages
    ↓
Call Master Agent:
    Input:
        - currentTripContext
        - conversationHistory (50 messages)
        - user
        - newUserMessage
        - answeredQuestions (from question ledger)
        - outstandingQuestions (from question ledger)
    ↓
OpenAI API:
    - Model: gpt-4o-mini
    - Response format: JSON object
    - Temperature: 0.7
    - System prompt: ~2000 tokens
    - Conversation history: ~5000 tokens
    ↓
Validate with Zod:
    - Parse JSON response
    - Validate against masterOutputSchema
    - If invalid: retry with error correction
    ↓
Process by Mode:
    CLARIFY/CONFIRM:
        - Save master message
        - Update trip context
        - Create run record
        - Return to user

    DISPATCH:
        - Save master message
        - Update trip context
        - For each task:
            → Call specialist agent
            → Save specialist message
            → Collect specialist output
        - Call master agent again with specialist outputs
        ↓
    FINALIZE:
        - Save master message with multiple itineraries
        - Update trip context
        - Update trip.activeItinerary
        - Create run with all outputs
        - Return to user for selection
```

---

## Mode Transitions

### State Machine

```
[START] → CLARIFY → CONFIRM → DISPATCH → FINALIZE → [END]
   ↑          ↑        ↓          ↑
   └──────────┴────────┴──────────┘
         (loop back if needed)
```

### Transition Triggers

**CLARIFY → CLARIFY:** User provides partial information, more questions needed

**CLARIFY → CONFIRM:** Most information gathered, ready to validate

**CLARIFY → DISPATCH:** High confidence, skip confirmation

**CONFIRM → CLARIFY:** User says "no, let me change something"

**CONFIRM → DISPATCH:** User confirms, ready to research

**DISPATCH → FINALIZE:** All specialists complete (automatic, no user trigger)

**FINALIZE → CLARIFY:** User rejects all options, wants to modify preferences

---

## Question Ledger System

**Location:** `lib/utils/questionLedger.ts`

### Purpose

Prevent the AI from asking the same questions repeatedly by tracking:
- Questions that have been asked
- Questions that have been answered
- When they were asked/answered
- What the user's answer was

### Schema

```typescript
interface QuestionLedgerEntry {
  id: string;              // "q1", "q2", etc.
  text: string;            // "What dates are you considering?"
  status: "asked" | "answered";
  answeredText?: string;   // User's response
  askedAt?: string;        // ISO timestamp
  answeredAt?: string;     // ISO timestamp
}

// In tripContext
questionLedger: {
  asked: QuestionLedgerEntry[]
}
```

### Key Functions

**ensureQuestionLedger(tripContext):** Adds empty question ledger if missing

**markQuestionsAsAnswered(questions, userMessage, tripContext):** Updates status to "answered" when user responds

**filterMasterOutput(output, tripContext):** Removes already-asked questions from output

**getQuestionContext(tripContext):** Returns { answered: [...], outstanding: [...] } for prompts

### Usage in Prompts

```
Master Agent receives:
- answeredQuestions: ["What dates?", "How many travelers?"]
- outstandingQuestions: ["What's your budget level?"]

System prompt includes:
"DO NOT ask these questions again: {answeredQuestions}
PRIORITY outstanding questions: {outstandingQuestions}"
```

### Example

```json
{
  "questionLedger": {
    "asked": [
      {
        "id": "q1",
        "text": "What dates are you considering for your Boston trip?",
        "status": "answered",
        "answeredText": "February 15-18, 2026",
        "askedAt": "2026-01-14T10:40:00.000Z",
        "answeredAt": "2026-01-14T10:41:00.000Z"
      },
      {
        "id": "q2",
        "text": "How many people will be traveling?",
        "status": "answered",
        "answeredText": "2 adults",
        "askedAt": "2026-01-14T10:40:00.000Z",
        "answeredAt": "2026-01-14T10:41:00.000Z"
      },
      {
        "id": "q3",
        "text": "What's your budget level: economy, mid-range, or luxury?",
        "status": "asked",
        "askedAt": "2026-01-14T10:42:00.000Z"
      }
    ]
  }
}
```

---

## OpenAI Integration

### Configuration

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
```

### API Call Structure

```typescript
const completion = await openai.chat.completions.create({
  model: OPENAI_MODEL,
  messages: [
    {
      role: 'system',
      content: systemPrompt,  // 2000+ tokens with mode instructions
    },
    ...conversationHistory,   // Recent 50 messages
    {
      role: 'user',
      content: newUserMessage,
    },
  ],
  response_format: { type: 'json_object' },  // Force JSON output
  temperature: 0.7,                          // Balanced creativity
});
```

### Response Processing

1. **Extract Response:**
   ```typescript
   const rawResponse = completion.choices[0]?.message?.content;
   if (!rawResponse) throw new Error('No response from OpenAI');
   ```

2. **Parse JSON:**
   ```typescript
   const parsed = JSON.parse(rawResponse);
   ```

3. **Validate with Zod:**
   ```typescript
   const validated = masterOutputSchema.safeParse(parsed);
   if (!validated.success) {
     // Retry with error correction or return error
   }
   ```

4. **Handle Validation Errors:**
   ```typescript
   if (output.mode !== 'FINALIZE' && specialistOutputsPresent) {
     // Send correction message back to OpenAI
     messages.push({
       role: 'assistant',
       content: rawResponse,
     }, {
       role: 'user',
       content: `ERROR: You must use mode="FINALIZE" when specialist outputs are present.`,
     });
     // Retry API call
   }
   ```

### Token Limits

- **Max Context:** ~128k tokens (gpt-4o-mini)
- **Typical Usage:**
  - System prompt: 2000 tokens
  - 50 messages: 5000 tokens
  - User message: 100-500 tokens
  - Response: 1000-3000 tokens
- **Cost Optimization:** Limit conversation history to 50 messages

---

## Error Handling

### Validation Failures

When Zod validation fails:

1. **Log detailed error:**
   ```typescript
   console.error('Master agent validation failed:', validated.error);
   ```

2. **Attempt correction:**
   ```typescript
   // For known issues (like wrong mode), send correction message
   if (issue === 'wrong_mode') {
     retryWithCorrection();
   }
   ```

3. **Create error run:**
   ```typescript
   await runsCollection.insertOne({
     tripId: new ObjectId(tripId),
     userMessageId,
     status: 'error',
     error: validationError.message,
     createdAt: new Date(),
   });
   ```

4. **Return user-friendly error:**
   ```typescript
   return NextResponse.json({
     error: 'Failed to process message',
     details: 'AI output validation failed',
   }, { status: 500 });
   ```

### OpenAI API Failures

**Rate Limits:**
```typescript
catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    return {
      error: 'OpenAI API rate limit exceeded. Please try again in a moment.',
    };
  }
}
```

**Network Errors:**
```typescript
catch (error) {
  if (error.code === 'ECONNREFUSED') {
    return {
      error: 'Unable to connect to OpenAI. Please check your internet connection.',
    };
  }
}
```

### Specialist Agent Fallbacks

If specialist fails, return structured error:

```typescript
return {
  taskId: task.taskId,
  agent: 'TransportAgent',
  recommendations: [{
    error: 'Failed to generate transport recommendations',
    message: error.message,
  }],
  questionsForUser: [],
  assumptions: ['Transport planning incomplete due to error'],
  risks: ['User may need to research transport independently'],
};
```

This allows FINALIZE mode to still proceed with partial data.

---

## Best Practices

### Prompt Engineering

**✅ DO:**
- Use structured examples in prompts
- Specify exact output format with JSON schema
- Include "DO NOT" rules for common mistakes
- Provide context about conversation history
- Use discriminated unions for mode selection
- Include question ledger context

**❌ DON'T:**
- Rely on markdown formatting in responses
- Assume AI will follow implicit rules
- Include user PII in prompts
- Use vague instructions like "be creative"

### Validation

**✅ DO:**
- Validate all AI outputs with Zod schemas
- Log validation errors for debugging
- Retry with corrections for fixable errors
- Provide fallback responses for critical failures

**❌ DON'T:**
- Trust AI output without validation
- Expose raw validation errors to users
- Retry indefinitely (max 1-2 retries)

### Conversation Management

**✅ DO:**
- Limit conversation history to 50 messages
- Track asked/answered questions in ledger
- Accumulate trip context progressively
- Clear trip context only when user explicitly resets

**❌ DON'T:**
- Send entire conversation history (token waste)
- Re-ask questions without checking ledger
- Clear context between messages
- Store sensitive data in context

---

**For more information:**
- [API Reference](./API.md) - Integration details
- [Data Models](./DATA_MODELS.md) - Data structures
- [Features Guide](./FEATURES.md) - Feature implementations
