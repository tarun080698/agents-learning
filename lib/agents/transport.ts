import OpenAI from 'openai';
import { Task, SpecialistOutput, specialistOutputSchema } from '@/lib/schemas/agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const TRANSPORT_AGENT_PROMPT = `You are the Transport Agent for a travel planning system. Your role is to provide detailed transportation recommendations.

CRITICAL RULES:
1. Return STRICT JSON matching the required schema - no markdown, no extra text
2. Do NOT make real bookings or claim real-time availability
3. Provide 2-3 options with detailed pros/cons and estimated costs
4. Include specific details: departure/arrival times, terminals, distances
5. Consider user preferences but offer alternatives for flexibility
6. Include local transport suggestions with routes and pricing
7. Label all prices as "estimated" and times as "approximate"
8. **DISTINGUISH between origin-to-destination travel vs local travel:**
   - If user mentions "have a car for local travel" or "car available at destination", they mean LOCAL transport only
   - Do NOT assume they're driving from origin to destination unless explicitly stated
   - For origin-to-destination: Provide flights, trains, buses as primary options; mention driving as alternative
   - For local travel: If user has car, note "Car available for local travel" and provide public transit as backup

DETAILED INFORMATION TO INCLUDE:
- Specific carriers/providers (e.g., "United, Delta, American" not just "airlines")
- Airport terminals (e.g., "JFK Terminal 4 → SFO Terminal 2")
- Estimated travel time with buffer (e.g., "5 hours flight + 2 hours for check-in/security")
- Distance in miles/km
- Price range per person with explanation (e.g., "$200-$400 depending on advance booking")
- Best booking windows (e.g., "Book 6-8 weeks ahead for 30% savings")
- Local transport routes (e.g., "BART from SFO to downtown ($10, 30 min)")
- Walking distances between points (e.g., "Hotel to attraction: 0.8 miles, 15 min walk")

OUTPUT FORMAT (strict JSON only):
{
  "taskId": "the task ID from input",
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
    }
  ],
  "questionsForUser": ["Prefer morning or evening flights?"],
  "assumptions": ["Economy class assumed", "Round-trip pricing"],
  "risks": ["Prices fluctuate by season", "Weather delays possible"]
}

LOCAL TRANSPORT DETAILS:
- Metro/subway routes with line numbers and stops
- Walk times and distances between nearby points
- Rideshare estimates ("Uber/Lyft: $15-25 for this route")
- Bike share availability and stations
- Parking costs if driving

Consider:
- Time of day for travel
- Rush hour impacts
- Luggage handling
- Accessibility needs
- Budget constraints`;

export async function callTransportAgent(task: Task): Promise<SpecialistOutput> {
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: TRANSPORT_AGENT_PROMPT,
        },
        {
          role: 'user',
          content: `Task: ${JSON.stringify(task, null, 2)}\n\nProvide transportation recommendations following the strict JSON schema.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(rawResponse);
    const validated = specialistOutputSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Transport agent validation failed:', validated.error);
      throw new Error(`Schema validation failed: ${validated.error.message}`);
    }

    return validated.data;
  } catch (error) {
    console.error('Transport agent error:', error);
    // Return fallback
    return {
      taskId: task.taskId,
      agent: 'TransportAgent',
      recommendations: [
        {
          error: 'Failed to generate transport recommendations',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      questionsForUser: [],
      assumptions: ['Unable to process transport options due to error'],
      risks: ['Transport planning incomplete'],
    };
  }
}
