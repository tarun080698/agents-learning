# API Reference

Complete documentation for all REST API endpoints in the Travel Agentic Planner application.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Trips API](#trips-api)
4. [Messages API](#messages-api)
5. [Chat API](#chat-api)
6. [Runs API](#runs-api)
7. [Itineraries API](#itineraries-api)
8. [Error Responses](#error-responses)

---

## Authentication

Currently uses username-based authentication stored in localStorage. No JWT or session management.

**User Flow:**
1. User enters username on first visit
2. `GET /api/users?username={username}` - Check if user exists
3. If 404, `POST /api/users` - Create new user
4. Store userId and username in localStorage
5. Include userId in subsequent requests

---

## Users API

### Create or Update User

**Endpoint:** `POST /api/users`

**Description:** Creates a new user or updates existing user by username (upsert operation).

**Request Body:**
```json
{
  "username": "johndoe",
  "firstName": "John",    // Optional
  "lastName": "Doe"       // Optional
}
```

**Validation Rules:**
- `username`: required, min 1 character
- `firstName`: optional string
- `lastName`: optional string

**Success Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-01-14T10:30:00.000Z",
  "updatedAt": "2026-01-14T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (Zod validation error)
- `500 Internal Server Error` - Database error

---

### Get User by Username

**Endpoint:** `GET /api/users?username={username}`

**Description:** Fetches user details by username.

**Query Parameters:**
- `username` (required): The username to look up

**Success Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-01-14T10:30:00.000Z",
  "updatedAt": "2026-01-14T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid username
- `404 Not Found` - User does not exist
- `500 Internal Server Error` - Database error

---

## Trips API

### Create Trip

**Endpoint:** `POST /api/trips`

**Description:** Creates a new trip for a user with default status="draft".

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Validation Rules:**
- `userId`: required, must be valid ObjectId string

**Success Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "status": "draft",
  "tripContext": {},
  "createdAt": "2026-01-14T10:35:00.000Z",
  "updatedAt": "2026-01-14T10:35:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid userId
- `500 Internal Server Error` - Database error

---

### List User Trips

**Endpoint:** `GET /api/trips?userId={userId}`

**Description:** Retrieves all trips for a user, sorted by most recently updated first.

**Query Parameters:**
- `userId` (required): The user's ID

**Success Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
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
    "tripContext": { /* structured trip data */ },
    "activeItinerary": { /* current itinerary options */ },
    "savedItineraries": [ /* array of saved itineraries */ ],
    "createdAt": "2026-01-14T10:35:00.000Z",
    "updatedAt": "2026-01-14T12:00:00.000Z"
  }
]
```

**Error Responses:**
- `400 Bad Request` - Invalid userId
- `500 Internal Server Error` - Database error

---

### Update Trip Metadata

**Endpoint:** `PATCH /api/trips/{tripId}`

**Description:** Updates trip metadata (title, progress, origin, destination, dates).

**Request Body:**
```json
{
  "updateMetadata": true,
  "tripContext": { /* trip context object */ }
}
```

**Success Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid tripId or missing tripContext
- `404 Not Found` - Trip not found
- `500 Internal Server Error` - Database error

---

### Delete Trip

**Endpoint:** `DELETE /api/trips/{tripId}`

**Description:** Deletes a trip and all associated messages and runs.

**Success Response (200 OK):**
```json
{
  "success": true,
  "deletedTrip": true,
  "deletedMessages": 15,
  "deletedRuns": 3
}
```

**Error Responses:**
- `400 Bad Request` - Invalid tripId
- `404 Not Found` - Trip not found
- `500 Internal Server Error` - Database error

---

## Messages API

### Create Message

**Endpoint:** `POST /api/messages`

**Description:** Saves a new message to a trip. Updates trip.updatedAt timestamp.

**Request Body:**
```json
{
  "tripId": "507f1f77bcf86cd799439012",
  "role": "user",
  "content": "I want to visit Boston for 3 days",
  "agentName": "Master"  // Optional, for agent messages
}
```

**Validation Rules:**
- `tripId`: required, valid ObjectId
- `role`: required, one of: "user", "master", "specialist", "system"
- `content`: required, min 1 character
- `agentName`: optional string (used for specialist messages)

**Success Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "tripId": "507f1f77bcf86cd799439012",
  "role": "user",
  "content": "I want to visit Boston for 3 days",
  "createdAt": "2026-01-14T10:40:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Database error

---

### List Trip Messages

**Endpoint:** `GET /api/messages?tripId={tripId}`

**Description:** Retrieves all messages for a trip, sorted chronologically (oldest first).

**Query Parameters:**
- `tripId` (required): The trip ID

**Success Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "tripId": "507f1f77bcf86cd799439012",
    "role": "user",
    "content": "I want to visit Boston for 3 days",
    "createdAt": "2026-01-14T10:40:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "tripId": "507f1f77bcf86cd799439012",
    "role": "master",
    "agentName": "Master",
    "content": "Great! I can help you plan your Boston trip...",
    "parsed": { /* structured agent output */ },
    "createdAt": "2026-01-14T10:40:05.000Z"
  }
]
```

**Error Responses:**
- `400 Bad Request` - Invalid tripId
- `500 Internal Server Error` - Database error

---

## Chat API

### Send Chat Message

**Endpoint:** `POST /api/chat`

**Description:** Main endpoint for conversational interaction. Processes user message through Master Agent, updates trip context, creates run record, and returns AI response.

**Request Body:**
```json
{
  "tripId": "507f1f77bcf86cd799439012",
  "message": "I want to visit Boston from NYC for a long weekend"
}
```

**Validation Rules:**
- `tripId`: required, valid ObjectId
- `message`: required, min 1 character

**Success Response (200 OK):**

**Example 1: CLARIFY Mode**
```json
{
  "success": true,
  "tripId": "507f1f77bcf86cd799439012",
  "assistantMessage": "Perfect! I'm excited to help plan your Boston trip...\n\n**Quick Questions:**\n1. What specific dates are you considering?\n2. How many people will be traveling?",
  "tripContext": {
    "trip": {
      "origin": "New York City",
      "destinations": ["Boston"],
      "dateRange": { "start": null, "end": null },
      "travelers": null,
      "budget": { "level": null, "currency": "USD" },
      "preferences": {
        "pace": null,
        "interests": [],
        "dietary": [],
        "hotelStyle": null
      },
      "constraints": { "mustDo": [], "avoid": [] }
    },
    "decisions": { "confirmed": [], "pending": [] },
    "openQuestions": [],
    "assumptions": [],
    "questionLedger": { "asked": [ /* question entries */ ] }
  },
  "run": {
    "_id": "507f1f77bcf86cd799439015",
    "tripId": "507f1f77bcf86cd799439012",
    "userMessageId": "507f1f77bcf86cd799439013",
    "masterOutput": {
      "mode": "CLARIFY",
      "updatedTripContext": { /* trip context */ },
      "questions": [ /* array of questions */ ],
      "shortSummary": "Clarifying trip details",
      "nextStep": "Gather dates and traveler count"
    },
    "status": "ok",
    "createdAt": "2026-01-14T10:40:05.000Z"
  }
}
```

**Example 2: FINALIZE Mode (Multiple Itineraries)**
```json
{
  "success": true,
  "tripId": "507f1f77bcf86cd799439012",
  "assistantMessage": "I've created 3 different itinerary options for your Boston trip...\n\n**Select Your Preferred Option:**\n\n🎯 **Option 1: Budget Explorer**\n...\n\n🎯 **Option 2: Balanced Experience**\n...",
  "tripContext": { /* updated trip context */ },
  "run": {
    "_id": "507f1f77bcf86cd799439020",
    "tripId": "507f1f77bcf86cd799439012",
    "userMessageId": "507f1f77bcf86cd799439019",
    "masterOutput": { /* dispatch mode output */ },
    "dispatchOutput": { /* dispatch details */ },
    "tasks": [ /* specialist tasks */ ],
    "specialistOutputs": [ /* specialist recommendations */ ],
    "multipleItineraries": {
      "options": [
        {
          "id": "opt-1",
          "title": "Budget Explorer",
          "description": "Affordable adventure with local experiences",
          "highlights": ["Public transport", "Hostels", "Food trucks"],
          "estimatedTotalCost": "$300-400",
          "itinerary": {
            "summary": "3-day budget-friendly Boston exploration",
            "days": [ /* daily breakdown */ ],
            "alternativeOptions": { /* alternatives */ }
          },
          "tags": ["Budget-Friendly", "Local", "Walking"]
        },
        // ... 2 more options
      ],
      "comparisonNote": "All options cover key Boston attractions but differ in comfort and cost"
    },
    "status": "ok",
    "createdAt": "2026-01-14T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `404 Not Found` - Trip or user not found
- `500 Internal Server Error` - Agent failure or database error

**Special Cases:**

**Itinerary Already Generated:**
If itineraries exist and user hasn't selected one:
```json
{
  "success": true,
  "tripId": "507f1f77bcf86cd799439012",
  "assistantMessage": "I've already generated itinerary options for you. Please review and select one using the interface above, or let me know if you'd like me to regenerate them with different preferences.",
  "run": {
    "status": "ok"
  }
}
```

**Agent Validation Error:**
If agent output fails Zod validation:
```json
{
  "error": "Failed to process message",
  "details": "Agent output validation failed: ...",
  "rawResponse": "{ /* invalid agent output */ }"
}
```

---

## Runs API

### Update Run Status

**Endpoint:** `PATCH /api/runs/{runId}`

**Description:** Updates run status and selected option (used when user selects an itinerary).

**Request Body:**
```json
{
  "status": "itinerary_selected",
  "selectedOptionId": "opt-2"
}
```

**Success Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid runId
- `404 Not Found` - Run not found
- `500 Internal Server Error` - Database error

---

### Get Latest Run for Trip

**Endpoint:** `GET /api/trips/{tripId}/latest-run`

**Description:** Retrieves the most recent successful run (status: 'ok' or 'completed') for a trip.

**Success Response (200 OK):**
```json
{
  "run": {
    "_id": "507f1f77bcf86cd799439020",
    "tripId": "507f1f77bcf86cd799439012",
    "userMessageId": "507f1f77bcf86cd799439019",
    "masterOutput": { /* master agent output */ },
    "dispatchOutput": { /* dispatch output */ },
    "tasks": [ /* tasks array */ ],
    "specialistOutputs": [ /* specialist outputs */ ],
    "multipleItineraries": { /* itinerary options */ },
    "status": "itinerary_selected",
    "selectedOptionId": "opt-2",
    "createdAt": "2026-01-14T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid tripId
- `500 Internal Server Error` - Database error

---

## Itineraries API

### Save Itinerary

**Endpoint:** `POST /api/trips/{tripId}/itineraries`

**Description:** Saves a selected itinerary to trip.savedItineraries array. Prevents duplicate saves from same run.

**Request Body:**
```json
{
  "itinerary": { /* itinerary object */ },
  "tripContext": { /* trip context snapshot */ },
  "name": "My Boston Adventure",  // Optional custom name
  "runId": "507f1f77bcf86cd799439020"  // Optional, prevents duplicates
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "itinerary": {
    "_id": "itin-507f1f77bcf86cd799439021",
    "itinerary": { /* itinerary data */ },
    "tripContext": { /* context snapshot */ },
    "name": "My Boston Adventure",
    "savedAt": "2026-01-14T11:05:00.000Z",
    "runId": "507f1f77bcf86cd799439020"
  }
}
```

**Duplicate Prevention (409 Conflict):**
```json
{
  "error": "Itinerary from this run already saved",
  "message": "An itinerary from this planning session has already been saved to avoid duplicates."
}
```

**Error Responses:**
- `400 Bad Request` - Missing itinerary in body
- `500 Internal Server Error` - Database error

---

### Get Saved Itineraries

**Endpoint:** `GET /api/trips/{tripId}/itineraries`

**Description:** Retrieves all saved itineraries for a trip (limited to 20 most recent, newest first).

**Success Response (200 OK):**
```json
[
  {
    "_id": "itin-507f1f77bcf86cd799439021",
    "itinerary": {
      "summary": "3-day Boston cultural experience",
      "days": [ /* daily breakdown */ ],
      "alternativeOptions": { /* alternatives */ }
    },
    "tripContext": { /* trip context when saved */ },
    "name": "My Boston Adventure",
    "savedAt": "2026-01-14T11:05:00.000Z",
    "runId": "507f1f77bcf86cd799439020"
  }
]
```

**Error Responses:**
- `404 Not Found` - Trip not found
- `500 Internal Server Error` - Database error

---

### Delete Saved Itinerary

**Endpoint:** `DELETE /api/trips/{tripId}/itineraries?itineraryId={itineraryId}`

**Description:** Removes a saved itinerary from trip.savedItineraries array.

**Query Parameters:**
- `itineraryId` (required): The itinerary ID to delete

**Success Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Missing itineraryId
- `404 Not Found` - Trip not found
- `500 Internal Server Error` - Database error

---

## Error Responses

All error responses follow a consistent format:

**Zod Validation Error (400):**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["username"]
    }
  ]
}
```

**Not Found Error (404):**
```json
{
  "error": "Trip not found"
}
```

**Internal Server Error (500):**
```json
{
  "error": "Internal server error",
  "details": "Detailed error message for debugging"
}
```

**Agent Processing Error (500):**
```json
{
  "error": "Failed to process message",
  "details": "OpenAI API error: rate limit exceeded",
  "rawResponse": "..."  // If available
}
```

---

## Rate Limiting & Best Practices

**Current State:**
- No rate limiting implemented
- MongoDB connection pooling handled automatically
- OpenAI API calls may have rate limits based on your plan

**Best Practices:**
1. Always validate tripId/userId before API calls
2. Handle 404 gracefully for trip/user not found
3. Store user credentials (userId, username) in localStorage
4. Load messages/trips on component mount, not on every render
5. Debounce chat input to prevent excessive API calls
6. Cache trip context and messages in React state
7. Show loading states during API calls
8. Handle OpenAI errors with user-friendly messages

**Typical Error Handling:**
```typescript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('Chat API error:', error);
  // Show user-friendly error message
}
```

---

## Versioning

**Current Version:** v1.0
**API Stability:** Stable (production-ready)
**Breaking Changes:** None planned

**Deprecation Policy:**
- Deprecated endpoints will be marked in docs 30 days before removal
- Major version changes (v2.0) may introduce breaking changes
- Monitor changelog for updates

---

**For more information:**
- [Data Models](./DATA_MODELS.md) - Database schemas
- [Agent Architecture](./AGENT_ARCHITECTURE.md) - AI agent system
- [Features Guide](./FEATURES.md) - Capabilities overview
