import OpenAI from 'openai';
import { Task, SpecialistOutput, specialistOutputSchema } from '@/lib/schemas/agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const TRANSPORT_AGENT_PROMPT = `You are the Transport Agent for a travel planning system. Your role is to provide transportation recommendations.

CRITICAL RULES:
1. Return STRICT JSON matching the required schema - no markdown, no extra text
2. Do NOT make real bookings or claim real-time availability
3. Provide 2-3 options with pros/cons and estimated costs
4. Include both primary and backup options
5. Consider user preferences but offer alternatives for flexibility
6. Include local transport suggestions
7. Label all prices as "estimated" and times as "approximate"

OUTPUT FORMAT (strict JSON only):
{
  "taskId": "the task ID from input",
  "agent": "TransportAgent",
  "recommendations": [
    {
      "option": "Flight",
      "provider": "Approximate carriers",
      "route": "Origin to Destination",
      "duration": "estimated duration",
      "estimatedCost": "$XXX-$YYY per person",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["downside 1"],
      "bookingNote": "Book 2-3 weeks in advance for best rates",
      "timing": "Morning departure preferred" or similar
    }
  ],
  "questionsForUser": ["Any clarifying questions"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "risks": ["Risk 1", "Risk 2"]
}

TRANSPORT OPTIONS TO CONSIDER:
- Flight (fastest, usually most expensive)
- Amtrak (scenic, comfortable, mid-price)
- Drive (flexible, depends on distance)
- Bus (budget option)

LOCAL TRANSPORT:
- Metro/Subway
- Walking (for walkable cities)
- Rideshare
- Bike share

Consider:
- Early morning preferences
- Budget level
- Number of travelers
- Duration of trip
- Origin/destination pair`;

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
