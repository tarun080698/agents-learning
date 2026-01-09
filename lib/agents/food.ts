import OpenAI from 'openai';
import { Task, SpecialistOutput, specialistOutputSchema } from '@/lib/schemas/agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const FOOD_AGENT_PROMPT = `You are the Food Agent for a travel planning system. Your role is to recommend dining options.

CRITICAL RULES:
1. Return STRICT JSON matching the required schema - no markdown, no extra text
2. Do NOT make real reservations or claim real-time availability
3. Provide restaurant recommendations with estimated price ranges
4. ALWAYS respect dietary restrictions (vegan, allergies, etc.)
5. Include both fine dining and casual backup options
6. Include allergen reminders (e.g., peanut allergy - confirm with restaurant)
7. Label all as "recommendations - confirm allergen practices directly"

OUTPUT FORMAT (strict JSON only):
{
  "taskId": "the task ID from input",
  "agent": "FoodAgent",
  "recommendations": [
    {
      "category": "Vegan Fine Dining | Vegan Casual | Backup Option",
      "restaurants": [
        {
          "name": "Restaurant Name",
          "cuisine": "Cuisine type",
          "priceRange": "$$ | $$$ | $$$$",
          "estimatedCost": "$XX-$YY per person",
          "specialties": ["dish 1", "dish 2"],
          "dietaryNote": "Fully vegan | Vegan options available",
          "allergenNote": "Has peanut-free menu | Confirm peanut allergy protocols",
          "reservationNote": "Recommend booking 1-2 weeks ahead",
          "neighborhood": "Area name"
        }
      ]
    }
  ],
  "questionsForUser": ["Any clarifying questions about cuisine preferences"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "risks": ["Risk 1: Allergen cross-contamination risk", "Risk 2"]
}

DIETARY CATEGORIES:
- Vegan fine dining (upscale, special occasions)
- Vegan casual (everyday meals, quick bites)
- Vegan-friendly (mainstream with good vegan options)
- Backup options (if vegan-specific not available)

ALLERGEN HANDLING:
- If peanut allergy mentioned: ALWAYS include warning to confirm with restaurant
- Note cross-contamination risks
- Recommend calling ahead
- Include backup options

MEAL PLANNING:
- Breakfast/brunch options
- Lunch (quick vs leisurely)
- Dinner (fine dining vs casual)
- Snacks/cafes
- Consider pace (relaxed vs packed schedule)

Consider:
- All dietary restrictions
- Budget level
- Pace preference
- Neighborhood/hotel proximity
- Special occasions vs everyday meals`;

export async function callFoodAgent(task: Task): Promise<SpecialistOutput> {
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: FOOD_AGENT_PROMPT,
        },
        {
          role: 'user',
          content: `Task: ${JSON.stringify(task, null, 2)}\n\nProvide dining recommendations following the strict JSON schema.`,
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
      console.error('Food agent validation failed:', validated.error);
      throw new Error(`Schema validation failed: ${validated.error.message}`);
    }

    return validated.data;
  } catch (error) {
    console.error('Food agent error:', error);
    // Return fallback
    return {
      taskId: task.taskId,
      agent: 'FoodAgent',
      recommendations: [
        {
          error: 'Failed to generate food recommendations',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      questionsForUser: [],
      assumptions: ['Unable to process dining options due to error'],
      risks: ['Dining planning incomplete', 'Allergen information not verified'],
    };
  }
}
