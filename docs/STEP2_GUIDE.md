# Step 2: Quick Start Guide

## What's New in Step 2

Step 2 adds an intelligent Master Agent that clarifies trip details through natural conversation. Instead of manually entering trip information, you chat with the AI and it extracts structured data while asking smart follow-up questions.

## New Features

1. **Master Agent with CLARIFY Mode**
   - Asks 3-7 targeted questions to understand your trip
   - Extracts structured information from natural language
   - Makes reasonable assumptions (and tells you what they are)
   - Never repeats questions about info you've already provided

2. **Structured Trip Context**
   - Origin and destinations
   - Travel dates
   - Number of travelers
   - Budget level
   - Preferences (pace, interests, dietary, hotel style)
   - Constraints (must-do activities, things to avoid)

3. **Trace Panel**
   - View the structured trip context as JSON
   - See the master agent's output
   - Debug and understand what the AI is thinking

## Setup (Additional to Step 1)

### 1. Get an OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)

### 2. Update Environment Variables

Add to your `.env.local`:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Restart the Dev Server

If the server is running:
```bash
# Press Ctrl+C to stop
pnpm dev
```

## How to Use

### Basic Flow

1. **Start a Conversation**
   ```
   You: "Plan a 3-day trip to San Francisco from NYC"
   ```

2. **Master Agent Responds**
   ```
   Master: "Planning a 3-day trip from NYC to San Francisco!

   I have a few questions:
   1. When would you like to travel?
   2. What's your budget?
   3. What are your main interests?
   ...

   Once you answer, I'll generate recommendations for
   transport, hotels, and restaurants."
   ```

3. **Answer Questions**
   ```
   You: "I want to travel in July, budget is around $2000,
   and I'm interested in tech, food, and nature."
   ```

4. **Agent Refines Understanding**
   The agent updates the trip context and asks any remaining questions.

5. **View Structured Data**
   Check the Trace Panel on the right to see:
   - Your trip details structured as JSON
   - The agent's latest output
   - Assumptions being made

## Example Interactions

### Trip Planning
```
User: "I want to visit Tokyo for a week"
Master: Asks about dates, budget, interests, dietary needs
User: "Next spring, $3000, love anime and sushi"
Master: Updates context, asks about accommodation preference
```

### Multi-Destination
```
User: "Road trip from LA to SF to Portland"
Master: Asks about travel dates, group size, pace preference
User: "Summer 2026, 2 people, relaxed pace"
Master: Updates context, asks about must-do activities
```

### Budget Travel
```
User: "Cheap weekend getaway from Boston"
Master: Asks about destination preferences, budget range
User: "Somewhere nature-y, under $500 total"
Master: Updates with low budget, asks about camping vs hotel
```

## Understanding the UI

### Chat Panel (Center)
- Your messages appear in blue
- Master agent messages in purple
- Clear conversation flow

### Trace Panel (Right)
- **Trip Context**: All structured trip information
- **Master Output**: Latest agent response as JSON
- Useful for debugging and understanding

### Trips Panel (Left)
- Create multiple trips
- Each trip has its own context
- Switch between trips easily

## What the Agent Tracks

### Trip Details
- **Origin**: Where you're traveling from
- **Destinations**: Where you want to go
- **Dates**: Start and end dates
- **Travelers**: Number of people
- **Budget**: Level (low/mid/high) and currency

### Preferences
- **Pace**: Relaxed, moderate, or packed
- **Interests**: Tech, food, nature, art, etc.
- **Dietary**: Restrictions or preferences
- **Hotel Style**: Budget, boutique, luxury, etc.

### Decisions & Questions
- **Confirmed**: What you've definitely decided
- **Pending**: What still needs decision
- **Open Questions**: What the agent is asking
- **Assumptions**: What the agent is assuming

## Tips for Best Results

### Be Specific
❌ "I want to travel"
✅ "Plan a 5-day trip to Paris from London"

### Provide Context
❌ "Find me a hotel"
✅ "I'm traveling with family, need 2 rooms, mid-range budget"

### Answer Multiple Questions at Once
✅ "We're traveling June 15-20, budget is $1500, interested in history and food, no dietary restrictions"

### Correct Assumptions
The agent shows its assumptions - if they're wrong, just say so:
✅ "Actually, we're 4 people, not 2"

## Troubleshooting

### "Failed to process message"
- Check your OpenAI API key is correct
- Ensure you have API credits
- Check terminal for detailed error messages

### Agent asks same questions
- This shouldn't happen, but if it does:
- Be more explicit in your answers
- Reference previous context: "As I mentioned, we're traveling in June"

### Trip context not showing
- Make sure you've selected a trip
- Refresh the page
- Check browser console for errors

### Slow responses
- OpenAI API calls take 2-5 seconds
- This is normal
- Loading indicator shows while processing

## Technical Details

### How It Works
1. Your message → `/api/chat` endpoint
2. API loads trip context and message history
3. Master agent called with OpenAI
4. OpenAI returns structured JSON
5. Trip context updated in database
6. Master response saved as message
7. Run record created for tracking
8. UI updated with new data

### Data Persistence
- All messages saved to MongoDB
- Trip context saved to trip document
- Run records track each agent execution
- Everything persists across page refreshes

### Privacy & Data
- All data stored in your MongoDB Atlas
- OpenAI processes messages but doesn't train on them
- No data shared with third parties
- You control your API keys and database

## What's Next (Step 3)

Future steps will add:
- **Specialist Agents**: Transport, accommodation, activities
- **DISPATCH Mode**: Master coordinates specialists
- **Itinerary Generation**: Full trip plans with options
- **Recommendations**: Specific flights, hotels, restaurants

But for Step 2, the focus is on understanding your needs!

## Need Help?

### Check the Trace Panel
The JSON data shows exactly what the agent knows and is thinking.

### Review Message History
All previous messages are stored - scroll up to see context.

### Clear and Restart
Create a new trip to start fresh if conversation gets confusing.

### Check the Console
Browser console (F12) and terminal show detailed error messages.

## Happy Planning! 🌍✈️

The Master Agent is ready to help you plan amazing trips!
