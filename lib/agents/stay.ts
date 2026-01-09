import OpenAI from 'openai';
import { Task, SpecialistOutput, specialistOutputSchema } from '@/lib/schemas/agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const STAY_AGENT_PROMPT = `You are the Stay Agent for a travel planning system. Your role is to recommend accommodation options.

CRITICAL RULES:
1. Return STRICT JSON matching the required schema - no markdown, no extra text
2. Do NOT make real bookings or claim real-time availability
3. Provide 3-5 hotel/accommodation options as placeholders
4. Match hotel style preferences (boutique, luxury, budget, etc.)
5. Recommend best neighborhoods for the itinerary
6. Include pros/cons and estimated nightly rates
7. Label all prices as "estimated" and availability as "subject to confirmation"

OUTPUT FORMAT (strict JSON only):
{
  "taskId": "the task ID from input",
  "agent": "StayAgent",
  "recommendations": [
    {
      "name": "Hotel Name (placeholder)",
      "type": "Boutique hotel | Chain hotel | Bed & Breakfast | etc",
      "area": "Neighborhood name",
      "estimatedNightlyRate": "$XXX-$YYY",
      "totalEstimate": "$XXX for N nights",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["downside 1"],
      "walkabilityScore": "High | Medium | Low",
      "nearbyAttractions": ["attraction 1", "attraction 2"],
      "bookingNote": "Estimated availability - confirm directly"
    }
  ],
  "questionsForUser": ["Any clarifying questions"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "risks": ["Risk 1", "Risk 2"]
}

ACCOMMODATION TYPES:
- Boutique hotels (unique, character, higher-end)
- Chain hotels (reliable, consistent)
- Bed & Breakfast (personalized, local experience)
- Vacation rentals (space, kitchen)
- Hostels (budget, social)

NEIGHBORHOOD CONSIDERATIONS:
- Proximity to must-see attractions
- Safety and walkability
- Dining options nearby
- Public transit access
- Character/vibe match to traveler preferences

Consider:
- Hotel style preference
- Budget level
- Number of travelers
- Duration of stay
- Key activities/interests
- Dietary needs (nearby restaurant options)`;

export async function callStayAgent(task: Task): Promise<SpecialistOutput> {
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: STAY_AGENT_PROMPT,
        },
        {
          role: 'user',
          content: `Task: ${JSON.stringify(task, null, 2)}\n\nProvide accommodation recommendations following the strict JSON schema.`,
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
      console.error('Stay agent validation failed:', validated.error);
      throw new Error(`Schema validation failed: ${validated.error.message}`);
    }

    return validated.data;
  } catch (error) {
    console.error('Stay agent error:', error);
    // Return fallback
    return {
      taskId: task.taskId,
      agent: 'StayAgent',
      recommendations: [
        {
          error: 'Failed to generate stay recommendations',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      questionsForUser: [],
      assumptions: ['Unable to process accommodation options due to error'],
      risks: ['Accommodation planning incomplete'],
    };
  }
}
