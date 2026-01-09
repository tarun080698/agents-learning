# Development Notes

## MongoDB Connection

The MongoDB connection is cached globally to prevent exhausting the connection pool during Next.js hot reloading in development. The connection is established lazily (on first database operation) rather than at module load time to allow the build to succeed without environment variables.

## Data Flow

### User Login Flow
1. User enters username
2. Frontend calls `GET /api/users?username=...`
3. If 404, calls `POST /api/users` to create user
4. User ID and username stored in localStorage
5. Main app loads with user context

### Trip Creation Flow
1. User clicks "New Trip"
2. Frontend calls `POST /api/trips` with userId
3. New trip created with default status="draft"
4. Trip added to list and auto-selected
5. User can immediately start chatting

### Message Flow
1. User types message and clicks Send
2. Frontend calls `POST /api/messages` with tripId, role="user", content
3. Message saved to database
4. Trip's updatedAt timestamp updated
5. Frontend reloads messages and trips

## Type Safety

All API routes use Zod schemas for validation:
- Input validation catches errors before database operations
- TypeScript types inferred from Zod schemas
- MongoDB operations use typed collection helpers
- No `any` types in production code (all replaced with `unknown` or proper types)

## Error Handling

- Zod validation errors return 400 with details
- Database errors return 500
- Not found errors return 404
- All errors logged to console for debugging

## UI State Management

The main page uses React hooks for state:
- `isLoggedIn`: Controls username gate visibility
- `userId`: Current user ID from localStorage
- `trips`: Array of user's trips
- `selectedTripId`: Currently active trip
- `messages`: Messages for selected trip
- `loading`: Global loading state

## Component Architecture

### UsernameGate
- Standalone login component
- Handles user creation/retrieval
- Manages localStorage
- Callback to parent on success

### TripsPanel
- Displays trip list
- Handles trip creation
- Manages trip selection
- Shows trip metadata

### ChatPanel
- Displays messages with role colors
- Handles message sending
- Auto-scrolls to new messages
- Conditional rendering based on trip selection

## Database Schema Decisions

### Users
- `username` is unique (enforced by index)
- `firstName` and `lastName` optional for Step 1
- Timestamps for audit trail

### Trips
- Default status is "draft"
- `tripContext` and `activeItinerary` as flexible JSON objects
- `userId` reference for user ownership

### Messages
- `role` enum for different message types
- `agentName` optional (for specialist identification)
- `parsed` optional (for structured data from LLM)
- Sorted by `createdAt` for chat history

### Runs
- Collection created but not used in Step 1
- Schema defined for future agent tracking
- Ready for orchestration logic

## Future Considerations

### Step 2 Prep
- Run collection is ready
- Message parsing field available
- Agent name field in messages
- Flexible tripContext for LLM data

### Scalability
- Indexes in place for efficient queries
- Connection pooling handled by driver
- Stateless API routes (scalable)

### Security Notes (for Production)
- Currently no authentication (username-only)
- No rate limiting
- No input sanitization beyond Zod
- No CORS configuration
- No API key management
- **These should be added before production**

## Local Development Tips

### Clearing Next.js Cache
```bash
rm -rf .next
pnpm dev
```

### Checking MongoDB Connection
The connection is lazy - it won't connect until the first API call.
Check console logs for "Database indexes initialized successfully"

### Testing API Endpoints
Use Postman, curl, or the browser:
```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# Get user
curl http://localhost:3000/api/users?username=testuser

# Create trip
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID"}'
```

### Debugging Tips
- Check browser console for frontend errors
- Check terminal console for backend errors
- MongoDB errors include full stack trace
- Zod errors include detailed validation messages

## Common Issues

### "Please define the MONGODB_URI"
- Create `.env.local` file
- Add your MongoDB connection string
- Restart dev server

### "Connection refused" from MongoDB
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has permissions

### Hot Reload Loops
- Clear `.next` directory
- Check for circular dependencies
- Verify no infinite useEffect loops

### TypeScript Errors
- Run `pnpm tsc --noEmit` to check
- Ensure all types are properly defined
- Check for missing imports

## Performance Notes

- MongoDB queries use indexes
- Collections cached in memory
- localStorage for session persistence
- No unnecessary re-renders in React
- Efficient message sorting with compound index

## Browser Compatibility

Tested on:
- Chrome (recommended)
- Edge
- Firefox
- Safari

Requires:
- localStorage support
- Fetch API support
- ES6+ JavaScript support
