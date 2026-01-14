# Features Guide

Complete guide to all features and capabilities in the Travel Agentic Planner application.

## Table of Contents

1. [Core Features](#core-features)
2. [User Management](#user-management)
3. [Trip Management](#trip-management)
4. [AI-Powered Planning](#ai-powered-planning)
5. [Itinerary Generation](#itinerary-generation)
6. [Itinerary Selection](#itinerary-selection)
7. [Trip Metadata](#trip-metadata)
8. [Question Ledger](#question-ledger)
9. [Trace Panel](#trace-panel)
10. [Saved Itineraries](#saved-itineraries)
11. [Mobile Support](#mobile-support)

---

## Core Features

### Overview

Travel Agentic Planner is a full-featured AI-powered travel planning application with:

✅ **Multi-User Support** - Username-based authentication
✅ **Multi-Trip Management** - Create and manage multiple trips
✅ **Conversational AI** - Natural language trip planning
✅ **Intelligent Question Tracking** - Avoid repeating questions
✅ **Specialist Agents** - Dedicated experts for transport, stay, food
✅ **Multiple Itinerary Options** - 2-3 diverse options (budget/mid/luxury)
✅ **Itinerary Selection & Saving** - Save and view selected itineraries
✅ **Dynamic Trip Metadata** - Auto-generated titles and progress tracking
✅ **Selection Persistence** - Prevents re-showing selection UI after refresh
✅ **Debug Trace Panel** - View agent outputs and trip context
✅ **Mobile Responsive** - Optimized for mobile devices

---

## User Management

### Username-Based Authentication

**No passwords required** - Users identified by unique username only.

**First-Time User Flow:**
1. User enters username on landing page
2. System checks if username exists via `GET /api/users?username={username}`
3. If not found (404), creates new user via `POST /api/users`
4. Stores `userId` and `username` in localStorage
5. Redirects to main application

**Returning User Flow:**
1. User enters username
2. System finds existing user
3. Loads user's trips and continues session

**Implementation:**
- Component: `components/username-gate.tsx`
- Storage: `localStorage.setItem('userId', user._id)`
- Persistence: Remains logged in until localStorage cleared

**Limitations:**
- No password protection
- Anyone with username can access account
- Suitable for demo/personal use, not production with sensitive data

---

## Trip Management

### Creating Trips

**How to Create:**
1. Click "New Trip" button in trips panel
2. System creates trip with:
   - `status: "draft"`
   - `tripContext: {}` (empty)
   - `userId: {currentUser}`
   - Auto-generated timestamps

**API:** `POST /api/trips { userId }`

**Result:**
- New trip added to trips list
- Auto-selected (chat panel opens)
- Ready to start conversation

---

### Viewing Trips

**Trips Panel:**
- Shows all user's trips sorted by most recent
- Displays:
  - Trip title (e.g., "NYC to Boston", "Trip to Boston")
  - Origin and destination (if known)
  - Trip dates (if known)
  - Progress bar (0% to 100%)
  - Created date

**Implementation:**
- Component: `components/trips-panel.tsx`
- API: `GET /api/trips?userId={userId}`
- Sorting: `updatedAt DESC`

---

### Selecting Trips

**How to Select:**
- Click on any trip in trips panel
- Selected trip highlighted with accent color
- Chat panel loads messages for selected trip
- Itinerary panel shows active itinerary (if any)

**Mobile Behavior:**
- Selecting trip switches from trips view to chat view
- "Back" button returns to trips list

---

### Deleting Trips

**How to Delete:**
1. Click delete icon (trash) on trip card
2. Confirmation dialog shows:
   - Trip details (title, message count)
   - Warning: "This cannot be undone"
3. If confirmed, deletes:
   - Trip document
   - All messages (cascade)
   - All runs (cascade)
   - All saved itineraries (embedded, cascade)

**API:** `DELETE /api/trips/{tripId}`

**Result:**
- Trip removed from list
- If was selected trip, chat panel clears
- Toast notification confirms deletion

---

## AI-Powered Planning

### Conversational Interface

**How It Works:**
1. User types message in chat input
2. Click "Send" or press Enter
3. Message sent to `POST /api/chat { tripId, message }`
4. Master Agent processes message:
   - Analyzes current trip context
   - Determines appropriate mode (CLARIFY/CONFIRM/DISPATCH/FINALIZE)
   - Generates response
5. Response displayed in chat
6. Trip context updated

**Natural Language Understanding:**
- "I want to visit Boston" → Extracts destination
- "for 3 days in February" → Extracts duration and month
- "2 people, mid-range budget" → Extracts travelers and budget
- "love history and food" → Extracts interests

**Context Accumulation:**
- Trip context builds progressively
- Each message adds to understanding
- No need to repeat information
- AI remembers previous answers

---

### Question Avoidance

**Problem:** AI re-asking questions user already answered

**Solution:** Question Ledger tracks:
- Questions asked
- Questions answered
- User's responses
- Timestamps

**Implementation:**
```typescript
// In trip context
questionLedger: {
  asked: [
    {
      id: "q1",
      text: "What dates are you considering?",
      status: "answered",
      answeredText: "February 15-18",
      askedAt: "2026-01-14T10:40:00Z",
      answeredAt: "2026-01-14T10:41:00Z"
    }
  ]
}
```

**Result:**
- AI never asks same question twice
- More natural conversation flow
- Faster trip planning

**See:** [Question Ledger](#question-ledger) for details

---

### Progress Tracking

**Visual Progress Bar:**
- Displayed on each trip card
- Shows completion percentage (0%, 25%, 50%, 75%, 100%)
- Color-coded: gray → yellow → green

**Milestones:**
1. **25%** - Has destination
2. **50%** - Has origin and destination
3. **75%** - Has origin, destination, and dates
4. **100%** - Has itinerary generated and selected

**Implementation:**
```typescript
function calculateProgress(tripContext, hasItinerary) {
  let percent = 0;
  if (tripContext.trip.destinations.length > 0) percent = 25;
  if (tripContext.trip.origin) percent = 50;
  if (tripContext.trip.dateRange.start && tripContext.trip.dateRange.end) percent = 75;
  if (hasItinerary) percent = 100;
  return percent;
}
```

---

## Itinerary Generation

### Triggering Generation

**When It Happens:**
1. User provides all required information:
   - Destination
   - Date range
   - Travelers count
   - Budget level
   - Key preferences
2. Master Agent enters DISPATCH mode
3. Specialist agents research options
4. Master Agent enters FINALIZE mode
5. Generates 2-3 diverse itinerary options

**User Actions:**
- No explicit "generate itinerary" button
- Happens automatically when ready
- User answers questions naturally
- AI determines when to proceed

---

### Diversity Guarantee

**Requirement:** System generates 2-3 distinctly different options

**Diversity Dimensions:**
- **Budget Level:** Economy vs Mid-range vs Luxury
- **Pace:** Relaxed vs Moderate vs Packed
- **Focus:** Adventure vs Culture vs Relaxation
- **Style:** Local/Authentic vs Tourist-Friendly vs Exclusive

**Example Options:**
1. **Budget Explorer** ($300-400)
   - Megabus, hostels, food trucks
   - Public transport, walking tours
   - Tags: Budget-Friendly, Local, Authentic

2. **Balanced Experience** ($700-900)
   - Amtrak, mid-range hotels, mixed dining
   - Uber + MBTA, guided tours
   - Tags: Balanced, Comfortable, Convenient

3. **Premium Comfort** ($1800-2200)
   - First-class flight, 5-star hotel, fine dining
   - Private car, VIP tours
   - Tags: Luxury, Exclusive, Hassle-Free

**AI Prompt Enforcement:**
```
MANDATORY: You MUST create 2-3 COMPLETELY DIFFERENT itinerary options!

Each option must be DISTINCTLY DIFFERENT from the others.
DO NOT create similar options - make each one appeal to a different type of traveler!

If you create only 1 option, the response will be rejected - always create 2-3!
```

**Validation:**
- Schema: `multipleItinerariesSchema.min(1).max(3)`
- Enforced in prompt: "MANDATORY: Always create AT LEAST 2 distinct options"
- Allows 1-3 for flexibility, but strongly encourages 2-3

---

### Itinerary Structure

**Each Option Contains:**

1. **Metadata:**
   - `id`: "opt-1", "opt-2", "opt-3"
   - `title`: "Budget Explorer", "Balanced Experience"
   - `description`: Brief overview of option's character
   - `highlights`: Key distinguishing features (array)
   - `estimatedTotalCost`: "$300-400", "$700-900"
   - `tags`: ["Budget-Friendly", "Local"]

2. **Daily Breakdown:**
   ```typescript
   days: [
     {
       dayNumber: 1,
       date: "2026-02-15",
       title: "Arrival & Freedom Trail",
       transport: { /* how to get there */ },
       accommodation: {
         name: "The Liberty Hotel",
         area: "Beacon Hill",
         estimatedCost: "$200-300/night"
       },
       meals: [
         {
           type: "breakfast",
           suggestion: "Flour Bakery",
           estimatedCost: "$10-15"
         },
         {
           type: "lunch",
           suggestion: "Neptune Oyster",
           estimatedCost: "$25-40"
         },
         {
           type: "dinner",
           suggestion: "Union Oyster House",
           estimatedCost: "$30-50"
         }
       ],
       activities: [
         {
           name: "Freedom Trail Walking Tour",
           time: "10:00 AM",
           duration: "2-3 hours",
           description: "Self-guided walk...",
           estimatedCost: "Free (donations appreciated)"
         }
       ]
     },
     // ... days 2-3
   ]
   ```

3. **Alternative Options:**
   ```typescript
   alternativeOptions: {
     transport: [ /* alternative transport */ ],
     stays: [ /* alternative hotels */ ],
     dining: [ /* alternative restaurants */ ]
   }
   ```

---

## Itinerary Selection

### Selection Interface

**When Shown:**
- After FINALIZE mode completes
- Master Agent message includes itinerary options
- UI displays selection buttons for each option

**How to Select:**
1. Review 2-3 itinerary options
2. Click "Select This Option" button on preferred itinerary
3. Confirmation message: "You selected: {option title}"
4. Itinerary saved to trip.savedItineraries
5. Run status updated to 'itinerary_selected'
6. Trip metadata updated (title, progress → 100%)

**Implementation:**
```typescript
async function handleSelectItinerary(option) {
  // 1. Save to savedItineraries
  await POST /api/trips/{tripId}/itineraries {
    itinerary: option.itinerary,
    tripContext: currentTripContext,
    name: option.title,
    runId: currentRunId
  }

  // 2. Update run status
  await PATCH /api/runs/{runId} {
    status: 'itinerary_selected',
    selectedOptionId: option.id
  }

  // 3. Save confirmation message
  await POST /api/messages {
    tripId,
    role: 'system',
    content: `You selected: ${option.title}`
  }

  // 4. Update trip metadata
  await PATCH /api/trips/{tripId} {
    updateMetadata: true,
    tripContext
  }
}
```

---

### Selection Persistence

**Problem:** After refresh, selection UI reappears even though user already selected an itinerary.

**Solution:** Track selection in run status.

**How It Works:**
1. When user selects itinerary, run status → 'itinerary_selected'
2. When page loads, check latest run status
3. If status is 'itinerary_selected', don't show selection UI
4. Instead, show saved itinerary from trip.savedItineraries

**Implementation:**
```typescript
async function checkIfItinerarySaved(runId) {
  const response = await fetch(`/api/runs/${runId}`);
  const run = await response.json();
  return run.status === 'itinerary_selected';
}

// In render:
if (runWithItineraries && !isItinerarySaved) {
  // Show selection UI
} else {
  // Show saved itinerary or normal chat
}
```

**API Support:**
- `GET /api/trips/{tripId}/latest-run` - Get latest run with status
- `PATCH /api/runs/{runId}` - Update run status

---

## Trip Metadata

### Dynamic Title Generation

**Problem:** All trips showed generic "New Trip" title.

**Solution:** Auto-generate titles based on trip context.

**Title Patterns:**
1. **Origin + Destination:** "NYC to Boston"
   - When both origin and destination known
2. **Destination Only:** "Trip to Boston"
   - When only destination known
3. **Destinations List:** "Boston, Providence, Newport"
   - Multiple destinations
4. **Fallback:** "New Trip"
   - No destination yet

**Implementation:**
```typescript
function generateTripTitle(tripContext) {
  const { origin, destinations } = tripContext.trip;

  if (origin && destinations.length === 1) {
    return `${origin} to ${destinations[0]}`;
  } else if (destinations.length > 0) {
    return destinations.length === 1
      ? `Trip to ${destinations[0]}`
      : destinations.join(', ');
  }

  return 'New Trip';
}
```

**Update Triggers:**
- After each chat message (if origin/destination changed)
- After itinerary selection
- Via `PATCH /api/trips/{tripId}` with updateMetadata flag

---

### Date Display

**Trip Dates:**
- Displayed on trip cards
- Format: "Feb 15-18, 2026" or "Feb 15 - Feb 18, 2026"
- Extracted from `tripContext.trip.dateRange.start` and `.end`

**Created Date:**
- Shows when trip was created
- Format: "Created Jan 14, 2026"
- Uses `trip.createdAt` timestamp

**Date Normalization:**
- Dates automatically normalized to future dates if in past
- Assumptions added to trip context: "Assuming you meant February 2026"

---

### Progress Tracking

See [Progress Tracking](#progress-tracking) in AI-Powered Planning section.

---

## Question Ledger

### Purpose

The Question Ledger prevents the AI from asking questions the user has already answered.

### How It Works

**Tracking:**
1. Master Agent asks questions in CLARIFY mode
2. Questions stored in `tripContext.questionLedger.asked[]`
3. Each entry has: id, text, status ("asked" or "answered")
4. User responds → status updated to "answered"
5. User's response stored in `answeredText` field

**Prevention:**
1. Before generating questions, AI receives:
   - `answeredQuestions`: Array of already-answered question texts
   - `outstandingQuestions`: Array of asked-but-not-answered texts
2. AI prompt includes: "DO NOT ask these questions again: {answeredQuestions}"
3. After validation, duplicate questions filtered out

**Implementation:**
```typescript
// Add question to ledger
function addQuestionToLedger(question, tripContext) {
  if (!tripContext.questionLedger) {
    tripContext.questionLedger = { asked: [] };
  }

  tripContext.questionLedger.asked.push({
    id: `q${tripContext.questionLedger.asked.length + 1}`,
    text: question,
    status: 'asked',
    askedAt: new Date().toISOString()
  });
}

// Mark as answered
function markQuestionAsAnswered(question, userResponse, tripContext) {
  const entry = tripContext.questionLedger.asked.find(q => q.text === question);
  if (entry) {
    entry.status = 'answered';
    entry.answeredText = userResponse;
    entry.answeredAt = new Date().toISOString();
  }
}

// Get context for prompts
function getQuestionContext(tripContext) {
  const answered = tripContext.questionLedger.asked
    .filter(q => q.status === 'answered')
    .map(q => q.text);

  const outstanding = tripContext.questionLedger.asked
    .filter(q => q.status === 'asked')
    .map(q => q.text);

  return { answered, outstanding };
}
```

**See:** `lib/utils/questionLedger.ts` for full implementation

---

## Trace Panel

### Purpose

Debug view for developers to inspect:
- Trip context (structured JSON)
- Master agent output (mode, questions, next step)
- Specialist tasks and outputs
- Agent execution flow

**Target Audience:** Developers, not end users

---

### What It Shows

**Trip Context:**
```json
{
  "trip": {
    "origin": "New York City",
    "destinations": ["Boston"],
    "dateRange": { "start": "2026-02-15", "end": "2026-02-18" },
    "travelers": 2,
    "budget": { "level": "mid", "currency": "USD" },
    "preferences": { "pace": "moderate", "interests": ["history", "food"] },
    "constraints": { "mustDo": ["Freedom Trail"], "avoid": [] }
  },
  "decisions": {
    "confirmed": ["Budget level: mid-range"],
    "pending": []
  },
  "questionLedger": { "asked": [...] }
}
```

**Master Output:**
```json
{
  "mode": "CLARIFY",
  "questions": ["What dates?", "How many travelers?"],
  "shortSummary": "Clarifying trip details",
  "nextStep": "Gather dates and traveler count"
}
```

**Specialist Tasks:**
```json
[
  {
    "taskId": "task-1",
    "specialist": "transport",
    "instructions": "Research transport NYC to Boston..."
  }
]
```

**Specialist Outputs:**
```json
[
  {
    "taskId": "task-1",
    "agent": "TransportAgent",
    "recommendations": [...],
    "assumptions": [...],
    "risks": [...]
  }
]
```

---

### How to Access

**Desktop/Tablet:**
- "Trace" button in header (tablet and above)
- Opens trace panel as 3rd column (25% width)

**Mobile:**
- Trace button not visible (too small screen)
- Access via browser console if needed

**Implementation:**
- Component: `components/trace-panel.tsx`
- State: `showTracePanel` (desktop/tablet only)
- Data: From latest run (`masterOutput`, `tasks`, `specialistOutputs`)

---

### Conditional Display

**Trace Panel Only Shows When:**
- `hasTraceData === true`
- `hasTraceData` is true if any of:
  - `masterOutput` exists
  - `tasks` array has items
  - `specialistOutputs` array has items

**Layout Adjustments:**
- When trace panel visible: Chat 50%, Itinerary 25%, Trace 25%
- When trace panel hidden: Chat 75%, Itinerary 25%
- When no itinerary: Chat 100%

---

## Saved Itineraries

### Viewing Saved Itineraries

**How to Access:**
1. Click "View Plans" button in chat panel
2. Opens drawer from right side
3. Shows all saved itineraries for current trip (max 20)

**What's Displayed:**
- Itinerary name (e.g., "Balanced Experience")
- Saved date (e.g., "Saved on Jan 14, 2026")
- Expandable accordion with full itinerary details
- Delete button to remove saved itinerary

**Implementation:**
- Component: `components/saved-itineraries-drawer.tsx`
- API: `GET /api/trips/{tripId}/itineraries`
- Limit: 20 most recent itineraries

---

### Saving Multiple Versions

**Use Case:** User generates new itineraries and selects different option.

**How It Works:**
1. First selection: Saves "Balanced Experience"
2. User modifies preferences, regenerates
3. Second selection: Saves "Luxury Escape"
4. Both saved to `trip.savedItineraries[]`
5. Both visible in "View Plans" drawer

**Duplicate Prevention:**
- If user selects same itinerary from same run twice, blocked with 409 Conflict
- Error: "Itinerary from this run already saved"
- Uses `runId` field to detect duplicates

**Implementation:**
```typescript
// Check for duplicate
const trip = await tripsCollection.findOne({ _id: tripId });
if (trip.savedItineraries.some(saved => saved.runId === runId)) {
  return 409 Conflict;
}

// Save new
await tripsCollection.updateOne(
  { _id: tripId },
  {
    $push: {
      savedItineraries: {
        _id: generateId(),
        itinerary,
        tripContext,
        name,
        runId,
        savedAt: new Date()
      }
    }
  }
);
```

---

### Deleting Saved Itineraries

**How to Delete:**
1. Open "View Plans" drawer
2. Click delete icon (trash) on itinerary
3. Confirmation dialog: "Delete this saved itinerary?"
4. If confirmed, removes from `trip.savedItineraries[]`

**API:** `DELETE /api/trips/{tripId}/itineraries?itineraryId={id}`

**Result:**
- Itinerary removed from list
- Trip.updatedAt timestamp updated
- Drawer refreshes to show remaining itineraries

---

## Mobile Support

### Responsive Design

**Breakpoints:**
- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+

**Layout Changes:**

**Mobile:**
- Single column view
- View switcher: Trips | Chat | Itinerary
- Stack all panels vertically
- Hide trace button (screen too small)

**Tablet:**
- Two column view: Chat + Itinerary
- Trips in slide-out drawer
- Show trace button

**Desktop:**
- Three column view: Chat + Itinerary + Trace (optional)
- Trips in fixed left sidebar
- All features visible

---

### Mobile Navigation

**View Switcher:**
- Tabs at top: "Trips" | "Chat" | "Itinerary"
- Default: "Trips" view
- Selecting trip → auto-switch to "Chat"
- Back button → return to "Trips"

**Implementation:**
```typescript
const [mobileView, setMobileView] = useState<'trips' | 'chat' | 'itinerary'>('trips');

function handleSelectTrip(tripId) {
  setSelectedTripId(tripId);
  if (isMobile) {
    setMobileView('chat');
  }
}

function handleBackToTrips() {
  setMobileView('trips');
}
```

---

### Mobile-Specific Features

**Sticky Header:**
- Username and "View Plans" button always visible
- Stays at top when scrolling

**Scrolling:**
- Chat panel scrolls independently
- Input box at bottom with border-top separator
- No sticky input (allows scrolling to top of messages)

**Touch Interactions:**
- Tap to select trip
- Swipe to open drawers (trips, saved itineraries)
- Tap to expand accordion items

---

### Mobile Optimizations

**Card Spacing:**
- 12px gap on mobile (3 spacing)
- 20px gap on tablet+ (5 spacing)
- Applied via: `gap-3 md:gap-5`

**Font Sizes:**
- Scaled down slightly on mobile
- Headers: `text-base md:text-lg`
- Body: `text-sm md:text-base`

**Button Sizes:**
- Full width buttons on mobile
- Larger touch targets (min 44x44px)
- Clear visual feedback on tap

---

## Feature Flags & Configuration

### Environment Variables

```bash
# Required
MONGODB_URI=mongodb+srv://...          # MongoDB connection
OPENAI_API_KEY=sk-...                  # OpenAI API key

# Optional
OPENAI_MODEL=gpt-4o-mini              # AI model (default: gpt-4o-mini)
MOCK_OPENAI=false                      # Mock AI responses (testing)
```

### Feature Toggles

Currently no feature flags. All features enabled by default.

**Future Considerations:**
- `ENABLE_TRACE_PANEL` - Show/hide trace panel
- `ENABLE_SAVED_ITINERARIES` - Enable saving multiple itineraries
- `MAX_SAVED_ITINERARIES` - Limit saved itineraries (default: 20)
- `MAX_CONVERSATION_HISTORY` - Limit messages sent to AI (default: 50)

---

## Known Limitations

### Current Limitations

1. **No Real-Time Booking:** AI does not make actual reservations
2. **No Price Accuracy:** All prices are estimates, not real-time data
3. **No Multi-Language:** English only
4. **No Collaborative Planning:** Single user per trip
5. **No Export:** Cannot export itinerary to PDF/Calendar
6. **No Offline Mode:** Requires internet connection
7. **No Push Notifications:** No reminders or alerts
8. **Question Ledger Not Perfect:** May occasionally re-ask similar questions phrased differently

### Future Enhancements

**Planned:**
- Export to PDF, Google Calendar, Apple Calendar
- Share trip with others (collaborative planning)
- Multi-language support
- Real-time price checking via APIs
- Integration with booking platforms
- Weather forecasts in itineraries
- Offline mode for viewing saved itineraries

**Under Consideration:**
- User accounts with email/password
- Social features (share trips publicly)
- Community-contributed recommendations
- AI learning from user feedback
- Voice input for mobile
- Photo upload for visual preferences

---

**For more information:**
- [API Reference](./API.md) - API details
- [Agent Architecture](./AGENT_ARCHITECTURE.md) - How AI works
- [Data Models](./DATA_MODELS.md) - Database structure
- [UI Components](./UI.md) - Frontend components
