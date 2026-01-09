# Travel Agentic Planner - Quick Start Guide

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Add your MongoDB Atlas connection string to `.env.local`

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

## Running the Application

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address or allow access from anywhere (0.0.0.0/0)
5. Get your connection string from "Connect" → "Connect your application"
6. Replace `<password>` with your actual password

## Database Collections

The app will automatically create these collections and indexes:
- `users` (unique index on username)
- `trips` (index on userId)
- `messages` (compound index on tripId + createdAt)
- `runs` (index on tripId) - not used in Step 1

## API Endpoints

### Users
- `POST /api/users` - Create/update user
  ```json
  { "username": "john", "firstName": "John", "lastName": "Doe" }
  ```
- `GET /api/users?username=john` - Get user by username

### Trips
- `POST /api/trips` - Create new trip
  ```json
  { "userId": "507f1f77bcf86cd799439011" }
  ```
- `GET /api/trips?userId=507f1f77bcf86cd799439011` - List user's trips

### Messages
- `POST /api/messages` - Send message
  ```json
  { "tripId": "507f1f77bcf86cd799439011", "role": "user", "content": "Hello" }
  ```
- `GET /api/messages?tripId=507f1f77bcf86cd799439011` - List trip messages

## Troubleshooting

### Can't connect to MongoDB
- Check your connection string format
- Verify your IP is whitelisted in MongoDB Atlas
- Make sure your database user credentials are correct

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Hot reload issues
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

## Next Steps

Step 1 is complete! Future steps will add:
- OpenAI/LLM integration
- Master and specialist agents
- Intelligent itinerary generation
- Run tracking and agent coordination
