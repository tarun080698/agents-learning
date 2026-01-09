# Travel Agentic Planner - MVP (Steps 1 & 2)

A Next.js-based travel planning application with MongoDB persistence and AI-powered trip planning. Step 1 provides the foundation with data persistence, and Step 2 adds an intelligent Master Agent that clarifies trip details through targeted questions.

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **shadcn/ui** components
- **TailwindCSS v4**
- **MongoDB Atlas** via MongoDB Node.js driver
- **OpenAI API** for intelligent trip planning
- **Zod** for request/response validation

## Features

### Step 1 (Complete)
- ✅ Username-based authentication (stored in localStorage)
- ✅ User management with MongoDB persistence
- ✅ Trip creation and management
- ✅ Chat messages tied to trips
- ✅ Real-time UI updates
- ✅ Responsive design with shadcn/ui components

### Step 2 (Complete)
- ✅ Master Agent with CLARIFY mode
- ✅ Structured trip context extraction
- ✅ Intelligent question generation (3-7 targeted questions)
- ✅ OpenAI integration with JSON mode
- ✅ Trip context persistence and updates
- ✅ Run tracking for agent executions
- ✅ Trace panel showing structured data

## Data Model

### Collections

1. **users**
   - `_id`: ObjectId (auto)
   - `username`: string (unique, required)
   - `firstName`: string (optional)
   - `lastName`: string (optional)
   - `createdAt`, `updatedAt`: Date

2. **trips**
   - `_id`: ObjectId (tripId)
   - `userId`: ObjectId (references users._id)
   - `status`: "draft" | "planning" | "final"
   - `tripContext`: object
   - `activeItinerary`: object (optional)
   - `createdAt`, `updatedAt`: Date

3. **messages**
   - `_id`: ObjectId
   - `tripId`: ObjectId (references trips._id)
   - `role`: "user" | "master" | "specialist" | "system"
   - `agentName`: string (optional)
   - `content`: string
   - `parsed`: object (optional)
   - `createdAt`: Date

4. **runs**
   - `_id`: ObjectId
   - `tripId`: ObjectId (references trips._id)
   - `userMessageId`: ObjectId (references messages._id)
   - `masterOutput`: object (structured AI output)
   - `tasks`: array (for specialist agents, Step 3+)
   - `specialistOutputs`: array (Step 3+)
   - `mergedItinerary`: object (Step 3+)
   - `status`: "ok" | "error"
   - `error`: string (optional)
   - `createdAt`: Date

## API Routes

### Users
- `POST /api/users` - Create or update user (upsert by username)
- `GET /api/users?username={username}` - Get user by username

### Trips
- `POST /api/trips` - Create new trip
- `GET /api/trips?userId={userId}` - List trips for user

### Messages
- `POST /api/messages` - Send message to trip (legacy, Step 1)
- `GET /api/messages?tripId={tripId}` - List messages for trip

### Chat (Step 2)
- `POST /api/chat` - Send message and get AI response
  - Input: `{ tripId, message }`
  - Calls Master Agent to clarify trip details
  - Updates trip context
  - Creates run record
  - Returns: `{ success, tripId, assistantMessage, tripContext, run }`
- `POST /api/trips` - Create new trip
- `GET /api/trips?userId={userId}` - List trips for user

### Messages
- `POST /api/messages` - Send message to trip
- `GET /api/messages?tripId={tripId}` - List messages for trip

## Running Locally

### Prerequisites

- Node.js 18+ installed
- pnpm (or npm/yarn)
- MongoDB Atlas account with a cluster set up
- OpenAI API key (for Step 2 features)

### Setup Instructions

1. **Clone the repository** (or navigate to project directory)

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up MongoDB Atlas**
   - Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster (free tier is fine)
   - Create a database user with read/write permissions
   - Get your connection string

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your configuration:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   APP_ENV=development
   ```

   Replace:
   - `<username>` with your MongoDB username
   - `<password>` with your MongoDB password
   - `<cluster>` with your cluster address
   - `<database>` with your database name (e.g., "travel-planner")
   - `sk-your-openai-api-key-here` with your actual OpenAI API key

5. **Get OpenAI API Key** (for Step 2 features)
   - Sign up at https://platform.openai.com/
   - Navigate to API Keys section
   - Create a new API key
   - Add it to your `.env.local` file

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. Enter a username on the welcome screen
2. Click "Continue" (user will be created automatically)
3. Create a new trip using the "+ New Trip" button
4. Select the trip to start chatting
5. Send a message like "Plan a 3-day trip to San Francisco from NYC"
6. The Master Agent will ask 3-7 targeted questions to clarify your trip
7. View the structured trip context and agent output in the Trace Panel

### Database Indexes

The application automatically creates the following indexes on first use:
- `users.username` (unique)
- `trips.userId`
- `messages.tripId + createdAt`
- `runs.tripId`

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── users/route.ts        # User management endpoints
│   │   ├── trips/route.ts        # Trip management endpoints
│   │   ├── messages/route.ts     # Message management endpoints (legacy)
│   │   └── chat/route.ts         # AI-powered chat endpoint (Step 2)
│   ├── page.tsx                  # Main application page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── username-gate.tsx         # Login component
│   ├── trips-panel.tsx           # Trip list and creation
│   ├── chat-panel.tsx            # Chat interface
│   └── trace-panel.tsx           # Agent trace viewer (Step 2)
├── lib/
│   ├── agents/
│   │   └── master.ts             # Master Agent logic and prompts (Step 2)
│   ├── db/
│   │   ├── mongo.ts              # MongoDB connection with caching
│   │   └── models.ts             # Type definitions and collection getters
│   ├── schemas/
│   │   ├── user.ts               # User validation schemas
│   │   ├── trip.ts               # Trip validation schemas
│   │   ├── message.ts            # Message validation schemas
│   │   └── agent.ts              # AI agent schemas (Step 2)
│   └── utils.ts                  # Utility functions
└── .env.local                    # Environment variables (not in git)
```

## How It Works (Step 2)

When you send a message in a trip:

1. **Frontend** calls `POST /api/chat` with `{ tripId, message }`
2. **API Route** loads trip, user, and recent messages
3. **API Route** saves user message to database
4. **Master Agent** is called with:
   - Current trip context (if any)
   - Conversation history
   - New user message
5. **OpenAI** processes the request in JSON mode and returns structured output
6. **Master Agent** validates the response against Zod schema
7. **API Route** saves:
   - Master's response as a message
   - Updated trip context to the trip document
   - Run record for tracking
8. **Frontend** updates UI with:
   - New messages in chat
   - Updated trip context in trace panel
   - Latest master output in trace panel

The Master Agent uses CLARIFY mode to:
- Extract structured information from user messages
- Ask 3-7 targeted questions to fill knowledge gaps
- Make reasonable assumptions (and document them)
- Build a comprehensive trip context over multiple turns

## Development Notes

- **No Authentication Library**: This MVP uses username-based authentication stored in localStorage for simplicity
- **OpenAI Integration**: Step 2 adds Master Agent with structured outputs using JSON mode
- **Hot Reload Safe**: MongoDB client is cached to prevent connection pool exhaustion during development
- **Type Safety**: Full TypeScript support with Zod validation for all API endpoints

## Next Steps (Not Yet Implemented)

Future steps will include:
- Specialist agents for transport, accommodation, and activities (Step 3)
- DISPATCH mode for the Master Agent
- Itinerary generation and merging
- Enhanced run tracking with specialist outputs

## Troubleshooting

### MongoDB Connection Issues
- Verify your connection string is correct
- Ensure your IP address is whitelisted in MongoDB Atlas
- Check that your database user has proper permissions

### OpenAI API Issues
- Verify your API key is correct in `.env.local`
- Check your OpenAI account has credits/billing enabled
- Ensure the model name is correct (default: `gpt-4o-mini`)
- Check the terminal/console for detailed error messages

### Development Server Issues
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Check that port 3000 is not already in use
- Restart the dev server after changing `.env.local`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)
