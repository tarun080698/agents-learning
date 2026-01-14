# Data Models

Complete documentation of MongoDB collections, schemas, relationships, and indexes used in the Travel Agentic Planner application.

## Table of Contents

1. [Database Overview](#database-overview)
2. [Collections](#collections)
   - [Users](#users-collection)
   - [Trips](#trips-collection)
   - [Messages](#messages-collection)
   - [Runs](#runs-collection)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Zod Schemas](#zod-schemas)
6. [Data Flow](#data-flow)

---

## Database Overview

**Database System:** MongoDB (native driver, not Mongoose)
**Connection:** Singleton pattern with lazy initialization
**Connection Pool:** Managed automatically by MongoDB driver
**Type Safety:** TypeScript interfaces + Zod validation schemas

**Connection Details:**
- Environment variable: `MONGODB_URI`
- Lazy connection: Database connects on first operation, not at module load
- Cached globally to prevent connection pool exhaustion during hot reload
- Supports MongoDB Atlas and self-hosted instances

**Collections:**
- `users` - User accounts (username-based auth)
- `trips` - Trip planning sessions
- `messages` - Conversation history
- `runs` - Agent execution records

---

## Collections

### Users Collection

**Purpose:** Store user account information for authentication and personalization.

**TypeScript Interface:**
```typescript
interface User {
  _id?: ObjectId;
  username: string;          // Unique identifier (no passwords)
  firstName?: string;        // Optional
  lastName?: string;         // Optional
  createdAt: Date;
  updatedAt: Date;
}
```

**Document Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": ISODate("2026-01-14T10:30:00Z"),
  "updatedAt": ISODate("2026-01-14T10:30:00Z")
}
```

**Constraints:**
- `username` must be unique (enforced by unique index)
- No password field (username-only authentication)
- `createdAt` and `updatedAt` managed by API

**Operations:**
- **Insert:** Upsert by username (create if not exists, update if exists)
- **Query:** Find by username or _id
- **Update:** Update firstName/lastName/updatedAt
- **Delete:** Not currently supported (no user deletion endpoint)

---

### Trips Collection

**Purpose:** Store trip planning sessions with trip context, itineraries, and metadata.

**TypeScript Interface:**
```typescript
interface Trip {
  _id?: ObjectId;
  userId: ObjectId;                    // Reference to User._id
  status: 'draft' | 'planning' | 'final';

  // Dynamic metadata (auto-generated from tripContext)
  title?: string;                      // "Trip to Boston", "NYC to Boston"
  origin?: string;                     // "New York City"
  destination?: string;                // "Boston"
  tripDates?: {
    start?: string;                    // "2026-02-15"
    end?: string;                      // "2026-02-18"
  };
  progress?: {
    hasOrigin: boolean;
    hasDestination: boolean;
    hasDates: boolean;
    hasItinerary: boolean;
    percentComplete: number;           // 0, 25, 50, 75, 100
  };

  // Core trip data
  tripContext: Record<string, unknown>; // Structured trip planning data
  activeItinerary?: Record<string, unknown>; // Current itinerary options

  // Saved itineraries (embedded array)
  savedItineraries?: Array<{
    _id: string;                       // Generated ID
    itinerary: Record<string, unknown>; // Itinerary details
    tripContext?: Record<string, unknown>; // Context snapshot
    savedAt: Date;
    name?: string;                     // Custom name
    runId?: string;                    // Source run (for deduplication)
  }>;

  createdAt: Date;
  updatedAt: Date;
}
```

**Document Example:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "status": "planning",
  "title": "NYC to Boston",
  "origin": "New York City",
  "destination": "Boston",
  "tripDates": {
    "start": "2026-02-15",
    "end": "2026-02-18"
  },
  "progress": {
    "hasOrigin": true,
    "hasDestination": true,
    "hasDates": true,
    "hasItinerary": false,
    "percentComplete": 75
  },
  "tripContext": {
    "trip": {
      "origin": "New York City",
      "destinations": ["Boston"],
      "dateRange": { "start": "2026-02-15", "end": "2026-02-18" },
      "travelers": 2,
      "budget": { "level": "mid", "currency": "USD" },
      "preferences": {
        "pace": "moderate",
        "interests": ["history", "food"],
        "dietary": [],
        "hotelStyle": "boutique"
      },
      "constraints": {
        "mustDo": ["Freedom Trail"],
        "avoid": ["late nights"]
      }
    },
    "decisions": {
      "confirmed": ["Budget level: mid-range", "Pace: moderate"],
      "pending": []
    },
    "openQuestions": [],
    "assumptions": ["Flexible with exact hotel locations"],
    "questionLedger": {
      "asked": [
        {
          "id": "q1",
          "text": "What dates are you considering?",
          "status": "answered",
          "answeredText": "February 15-18",
          "askedAt": "2026-01-14T10:40:00Z",
          "answeredAt": "2026-01-14T10:41:00Z"
        }
      ]
    }
  },
  "activeItinerary": {
    "options": [ /* array of itinerary options */ ]
  },
  "savedItineraries": [
    {
      "_id": "itin-507f1f77bcf86cd799439021",
      "itinerary": { /* itinerary details */ },
      "tripContext": { /* context snapshot */ },
      "savedAt": ISODate("2026-01-14T11:05:00Z"),
      "name": "Balanced Experience",
      "runId": "507f1f77bcf86cd799439020"
    }
  ],
  "createdAt": ISODate("2026-01-14T10:35:00Z"),
  "updatedAt": ISODate("2026-01-14T11:05:00Z")
}
```

**Constraints:**
- `userId` must reference existing User._id
- `status` enum: 'draft', 'planning', 'final'
- `tripContext` accumulates during conversation (never cleared)
- `activeItinerary` replaced when new options generated
- `savedItineraries` limited to 20 most recent (enforced in API)
- `updatedAt` updated on every message or itinerary save

**Operations:**
- **Insert:** Create with userId, status="draft", empty tripContext
- **Query:** Find by userId (sorted by updatedAt desc)
- **Update:** Update tripContext, activeItinerary, metadata, savedItineraries
- **Delete:** Cascade delete associated messages and runs

---

### Messages Collection

**Purpose:** Store conversation history between user and agents.

**TypeScript Interface:**
```typescript
interface Message {
  _id?: ObjectId;
  tripId: ObjectId;                    // Reference to Trip._id
  role: 'user' | 'master' | 'specialist' | 'system';
  agentName?: string;                  // "Master", "TransportAgent", etc.
  content: string;                     // Display message
  parsed?: Record<string, unknown>;    // Structured agent output (for agent messages)
  createdAt: Date;
}
```

**Document Examples:**

**User Message:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "role": "user",
  "content": "I want to visit Boston for a long weekend",
  "createdAt": ISODate("2026-01-14T10:40:00Z")
}
```

**Master Agent Message:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "role": "master",
  "agentName": "Master",
  "content": "Great! I can help plan your Boston trip. Let me ask a few questions...",
  "parsed": {
    "mode": "CLARIFY",
    "updatedTripContext": { /* trip context */ },
    "questions": ["What dates?", "How many travelers?"],
    "shortSummary": "Clarifying trip details",
    "nextStep": "Gather dates and traveler count"
  },
  "createdAt": ISODate("2026-01-14T10:40:05Z")
}
```

**Specialist Message:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439018"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "role": "specialist",
  "agentName": "TransportAgent",
  "content": "**Transport Recommendations:**\n- Train from NYC to Boston...",
  "parsed": {
    "taskId": "task-1",
    "agent": "TransportAgent",
    "recommendations": [ /* transport options */ ],
    "questionsForUser": [],
    "assumptions": ["Prefer direct routes"],
    "risks": []
  },
  "createdAt": ISODate("2026-01-14T10:50:00Z")
}
```

**System Message (Itinerary Selection Confirmation):**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439025"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "role": "system",
  "content": "You selected: Balanced Experience",
  "createdAt": ISODate("2026-01-14T11:05:00Z")
}
```

**Constraints:**
- `tripId` must reference existing Trip._id
- `role` enum: 'user', 'master', 'specialist', 'system'
- `agentName` required for agent messages (role: master/specialist)
- `parsed` only present for agent messages (structured output)
- Messages never deleted individually (cascade deleted with trip)
- Sorted chronologically (createdAt asc) when queried

**Operations:**
- **Insert:** Append message to trip, update trip.updatedAt
- **Query:** Find by tripId (sorted by createdAt asc, limited to 50 recent in API)
- **Update:** Not supported (messages are immutable)
- **Delete:** Cascade deleted when trip is deleted

---

### Runs Collection

**Purpose:** Store agent execution records for debugging and itinerary tracking.

**TypeScript Interface:**
```typescript
interface Run {
  _id?: ObjectId;
  tripId: ObjectId;                    // Reference to Trip._id
  userMessageId: ObjectId;             // Reference to triggering Message._id

  // Agent outputs (stored as Record for flexibility)
  masterOutput?: Record<string, unknown>;        // Master agent's initial response
  dispatchOutput?: Record<string, unknown>;      // Dispatch mode output
  tasks?: Record<string, unknown>[];             // Specialist tasks
  specialistOutputs?: Record<string, unknown>[]; // Specialist recommendations
  mergedItinerary?: Record<string, unknown>;     // Single merged itinerary (legacy)
  multipleItineraries?: Record<string, unknown>; // Multiple itinerary options

  // Status tracking
  status: string;                      // 'ok', 'completed', 'itinerary_selected', 'error'
  selectedOptionId?: string;           // Which itinerary option user selected
  error?: string;                      // Error message if status='error'

  createdAt: Date;
  updatedAt?: Date;                    // Added when status updated
}
```

**Document Examples:**

**CLARIFY Mode Run:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "userMessageId": ObjectId("507f1f77bcf86cd799439013"),
  "masterOutput": {
    "mode": "CLARIFY",
    "updatedTripContext": { /* trip context */ },
    "questions": ["What dates?", "How many travelers?"],
    "shortSummary": "Clarifying trip details",
    "nextStep": "Gather dates and traveler count"
  },
  "status": "ok",
  "createdAt": ISODate("2026-01-14T10:40:05Z")
}
```

**FINALIZE Mode Run (with itinerary selection):**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "userMessageId": ObjectId("507f1f77bcf86cd799439019"),
  "masterOutput": {
    "mode": "DISPATCH",
    "updatedTripContext": { /* trip context */ },
    "tasks": [ /* specialist tasks */ ],
    "shortSummary": "Dispatching to specialists",
    "nextStep": "Gather recommendations"
  },
  "dispatchOutput": { /* dispatch details */ },
  "tasks": [
    { "taskId": "task-1", "specialist": "transport", "instructions": "..." },
    { "taskId": "task-2", "specialist": "stay", "instructions": "..." },
    { "taskId": "task-3", "specialist": "food", "instructions": "..." }
  ],
  "specialistOutputs": [
    { "taskId": "task-1", "agent": "TransportAgent", "recommendations": [...] },
    { "taskId": "task-2", "agent": "StayAgent", "recommendations": [...] },
    { "taskId": "task-3", "agent": "FoodAgent", "recommendations": [...] }
  ],
  "multipleItineraries": {
    "options": [
      {
        "id": "opt-1",
        "title": "Budget Explorer",
        "description": "Affordable adventure",
        "highlights": ["Public transport", "Hostels"],
        "estimatedTotalCost": "$300-400",
        "itinerary": {
          "summary": "3-day budget Boston trip",
          "days": [ /* daily breakdown */ ]
        },
        "tags": ["Budget-Friendly", "Local"]
      },
      {
        "id": "opt-2",
        "title": "Balanced Experience",
        "description": "Mix of comfort and value",
        "highlights": ["Mix of transport", "Mid-range hotels"],
        "estimatedTotalCost": "$600-800",
        "itinerary": {
          "summary": "3-day balanced Boston trip",
          "days": [ /* daily breakdown */ ]
        },
        "tags": ["Balanced", "Comfortable"]
      },
      {
        "id": "opt-3",
        "title": "Luxury Escape",
        "description": "Premium comfort",
        "highlights": ["Private transport", "5-star hotels"],
        "estimatedTotalCost": "$1200-1500",
        "itinerary": {
          "summary": "3-day luxury Boston trip",
          "days": [ /* daily breakdown */ ]
        },
        "tags": ["Luxury", "Premium"]
      }
    ],
    "comparisonNote": "All options cover key Boston attractions"
  },
  "status": "itinerary_selected",
  "selectedOptionId": "opt-2",
  "createdAt": ISODate("2026-01-14T11:00:00Z"),
  "updatedAt": ISODate("2026-01-14T11:05:00Z")
}
```

**Error Run:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "tripId": ObjectId("507f1f77bcf86cd799439012"),
  "userMessageId": ObjectId("507f1f77bcf86cd799439013"),
  "status": "error",
  "error": "OpenAI API rate limit exceeded",
  "createdAt": ISODate("2026-01-14T10:40:05Z")
}
```

**Constraints:**
- `tripId` must reference existing Trip._id
- `userMessageId` must reference existing Message._id
- `status` values: 'ok', 'completed', 'itinerary_selected', 'error'
- `masterOutput` always present unless error
- `tasks` and `specialistOutputs` only present for DISPATCH mode
- `multipleItineraries` only present for FINALIZE mode
- `selectedOptionId` only present when status='itinerary_selected'
- Runs never deleted individually (cascade deleted with trip)

**Operations:**
- **Insert:** Create on every chat message (stores agent execution)
- **Query:** Find by tripId, find latest successful run (status in ['ok', 'completed'])
- **Update:** Update status and selectedOptionId when user selects itinerary
- **Delete:** Cascade deleted when trip is deleted

**Status Lifecycle:**
1. `ok` - Agent execution completed successfully
2. `completed` - (legacy, treated same as 'ok')
3. `itinerary_selected` - User selected an itinerary option
4. `error` - Agent execution failed

---

## Relationships

### Entity Relationship Diagram

```
User (1) ─────< (N) Trip
                     │
                     ├─────< (N) Message
                     │
                     └─────< (N) Run
```

### Relationship Details

**User → Trips (One-to-Many)**
- One user can have multiple trips
- Foreign key: `Trip.userId` → `User._id`
- Query: `Trip.find({ userId: user._id })`
- Cascade delete: Not implemented (trips remain if user deleted)

**Trip → Messages (One-to-Many)**
- One trip can have multiple messages
- Foreign key: `Message.tripId` → `Trip._id`
- Query: `Message.find({ tripId: trip._id })`
- Cascade delete: Deleting trip deletes all messages

**Trip → Runs (One-to-Many)**
- One trip can have multiple runs
- Foreign key: `Run.tripId` → `Trip._id`
- Query: `Run.find({ tripId: trip._id })`
- Cascade delete: Deleting trip deletes all runs

**Run → Message (Many-to-One)**
- Each run triggered by one user message
- Foreign key: `Run.userMessageId` → `Message._id`
- Query: `Run.find({ userMessageId: message._id })`
- Cascade delete: Deleting message does not delete run (run keeps messageId)

**Trip → SavedItineraries (One-to-Many Embedded)**
- One trip can have multiple saved itineraries
- Embedded array: `Trip.savedItineraries[]`
- No separate collection (embedded documents)
- Cascade delete: Deleting trip deletes all saved itineraries

---

## Indexes

Indexes are automatically created on application startup via `initIndexes()` function.

### Users Collection Indexes

```javascript
users.createIndex({ username: 1 }, { unique: true })
```
- **Purpose:** Ensure username uniqueness, fast login lookups
- **Type:** Unique index
- **Query:** `users.findOne({ username: "johndoe" })`

---

### Trips Collection Indexes

```javascript
trips.createIndex({ userId: 1, updatedAt: -1 })
```
- **Purpose:** Fast retrieval of user's trips, sorted by most recent
- **Type:** Compound index
- **Query:** `trips.find({ userId: ObjectId(...) }).sort({ updatedAt: -1 })`

---

### Messages Collection Indexes

```javascript
messages.createIndex({ tripId: 1, createdAt: 1 })
```
- **Purpose:** Fast retrieval of trip messages in chronological order
- **Type:** Compound index
- **Query:** `messages.find({ tripId: ObjectId(...) }).sort({ createdAt: 1 })`

---

### Runs Collection Indexes

```javascript
runs.createIndex({ tripId: 1, createdAt: -1 })
```
- **Purpose:** Fast retrieval of trip runs, sorted by most recent
- **Type:** Compound index
- **Query:** `runs.find({ tripId: ObjectId(...) }).sort({ createdAt: -1 })`

```javascript
runs.createIndex({ tripId: 1, status: 1 })
```
- **Purpose:** Fast filtering of runs by status (e.g., find successful runs)
- **Type:** Compound index
- **Query:** `runs.findOne({ tripId: ObjectId(...), status: { $in: ['ok', 'completed'] } })`

---

## Zod Schemas

Zod schemas provide runtime validation and TypeScript type inference.

### User Schemas

**Location:** `lib/schemas/user.ts`

```typescript
// Create user schema
export const createUserSchema = z.object({
  username: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Query user schema
export const getUserQuerySchema = z.object({
  username: z.string().min(1),
});
```

---

### Trip Schemas

**Location:** `lib/schemas/trip.ts`

```typescript
// Create trip schema
export const createTripSchema = z.object({
  userId: z.string().min(1),  // ObjectId as string
});

// Query trip schema
export const getTripQuerySchema = z.object({
  userId: z.string().min(1),
});
```

---

### Message Schemas

**Location:** `lib/schemas/message.ts`

```typescript
// Create message schema
export const createMessageSchema = z.object({
  tripId: z.string().min(1),
  role: z.enum(['user', 'master', 'specialist', 'system']),
  content: z.string().min(1),
  agentName: z.string().optional(),
});

// Query message schema
export const getMessageQuerySchema = z.object({
  tripId: z.string().min(1),
});
```

---

### Agent Schemas

**Location:** `lib/schemas/agent.ts`

**Trip Context Schema:**
```typescript
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
```

**Master Output Schema (Discriminated Union):**
```typescript
export const masterOutputSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('CLARIFY'),
    updatedTripContext: tripContextSchema,
    questions: z.array(z.string()).min(1).max(7),
    shortSummary: z.string(),
    nextStep: z.string(),
  }),
  z.object({
    mode: z.literal('CONFIRM'),
    updatedTripContext: tripContextSchema,
    contextSummary: z.string(),
    questions: z.array(z.string()).max(1).default([]),
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
    multipleItineraries: multipleItinerariesSchema,
    questions: z.array(z.string()).max(0).default([]),
    shortSummary: z.string(),
    nextStep: z.string(),
  }),
]);
```

**Multiple Itineraries Schema:**
```typescript
export const multipleItinerariesSchema = z.object({
  options: z.array(itineraryOptionSchema).min(1).max(3),  // 1-3 options (prefer 2-3)
  comparisonNote: z.string().optional(),
});

export const itineraryOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  estimatedTotalCost: z.string().optional(),
  itinerary: mergedItinerarySchema,
  tags: z.array(z.string()).optional(),
});
```

---

## Data Flow

### Trip Creation Flow

```
1. User enters username
   → GET /api/users?username=johndoe
   → If 404: POST /api/users { username: "johndoe" }
   → Store userId in localStorage

2. User clicks "New Trip"
   → POST /api/trips { userId: "507f..." }
   → Insert: { userId, status: "draft", tripContext: {}, createdAt, updatedAt }
   → Return trip object

3. Frontend loads trips
   → GET /api/trips?userId=507f...
   → Return array of trips sorted by updatedAt desc
```

---

### Chat Conversation Flow

```
1. User sends message
   → POST /api/chat { tripId, message }

2. API loads context
   → Load trip from trips collection
   → Load user from users collection
   → Load recent 50 messages from messages collection

3. API saves user message
   → Insert message { tripId, role: "user", content, createdAt }

4. API calls Master Agent
   → Pass currentTripContext, conversationHistory, user, newUserMessage
   → Master Agent calls OpenAI with structured output
   → OpenAI returns JSON matching masterOutputSchema
   → Validate with Zod schema

5. API processes Master Agent response
   → Format response message
   → Insert message { tripId, role: "master", content, parsed, createdAt }
   → Update trip { tripContext: updatedTripContext, updatedAt }
   → Insert run { tripId, userMessageId, masterOutput, status: "ok", createdAt }

6. If DISPATCH mode: Call specialist agents
   → For each task: call TransportAgent/StayAgent/FoodAgent
   → Collect specialistOutputs
   → Insert specialist messages
   → Call Master Agent again in FINALIZE mode
   → Generate multipleItineraries
   → Update run { tasks, specialistOutputs, multipleItineraries }
   → Update trip { activeItinerary: multipleItineraries }

7. Return response to frontend
   → { success, tripId, assistantMessage, tripContext, run }
```

---

### Itinerary Selection Flow

```
1. User selects itinerary option
   → Frontend calls handleSelectItinerary(option)

2. Save to trip.savedItineraries
   → POST /api/trips/{tripId}/itineraries
   → Body: { itinerary, tripContext, name, runId }
   → Push to savedItineraries array (limit 20)

3. Update run status
   → PATCH /api/runs/{runId}
   → Body: { status: "itinerary_selected", selectedOptionId: "opt-2" }
   → Update run { status, selectedOptionId, updatedAt }

4. Save confirmation message
   → POST /api/messages
   → Body: { tripId, role: "system", content: "You selected: ..." }

5. Update trip metadata
   → PATCH /api/trips/{tripId}
   → Body: { updateMetadata: true, tripContext }
   → Update { title, progress, updatedAt }

6. Reload data
   → GET /api/trips?userId={userId}  (reload trips with new metadata)
   → GET /api/messages?tripId={tripId}  (include confirmation message)
```

---

### Trip Deletion Flow

```
1. User deletes trip
   → DELETE /api/trips/{tripId}

2. Cascade delete associated data
   → Delete all messages: messagesCollection.deleteMany({ tripId })
   → Delete all runs: runsCollection.deleteMany({ tripId })
   → Delete trip: tripsCollection.deleteOne({ _id: tripId })

3. Return deletion summary
   → { success: true, deletedTrip: true, deletedMessages: 15, deletedRuns: 3 }
```

---

## Best Practices

### Data Access Patterns

**✅ DO:**
- Use indexes for all frequent queries
- Load only necessary fields (projection)
- Limit result sets (e.g., messages limited to 50)
- Cache trip context and messages in React state
- Use compound indexes for multi-field queries
- Validate all inputs with Zod before database operations

**❌ DON'T:**
- Query without indexes (performance degradation)
- Load all messages without limit (memory issues)
- Update trip on every render (excessive writes)
- Store passwords or sensitive data in plaintext
- Bypass validation schemas

---

### Schema Evolution

**Adding Fields:**
- Optional fields can be added anytime (backward compatible)
- Update TypeScript interface + Zod schema
- Update indexes if field used in queries

**Removing Fields:**
- Mark as deprecated in docs
- Remove from new documents but keep in interface (for old documents)
- After grace period, remove from interface and update queries

**Changing Field Types:**
- Create new field with new type
- Migrate data in background
- Update code to use new field
- Remove old field after migration complete

---

**For more information:**
- [API Reference](./API.md) - Endpoint details
- [Agent Architecture](./AGENT_ARCHITECTURE.md) - How agents use this data
- [Features Guide](./FEATURES.md) - Feature implementations
