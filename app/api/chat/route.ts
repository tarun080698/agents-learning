import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { ZodError, z } from 'zod';
import {
  getTripsCollection,
  getUsersCollection,
  getMessagesCollection,
  getRunsCollection,
  initIndexes,
} from '@/lib/db/models';
import { callMasterAgent, formatMasterResponse } from '@/lib/agents/master';
import { callTransportAgent } from '@/lib/agents/transport';
import { callStayAgent } from '@/lib/agents/stay';
import { callFoodAgent } from '@/lib/agents/food';
import { tripContextSchema, type Task, type SpecialistOutput } from '@/lib/schemas/agent';
import {
  ensureQuestionLedger,
  markQuestionsAsAnswered,
  filterMasterOutput,
  getQuestionContext,
} from '@/lib/utils/questionLedger';

// Request validation schema
const chatRequestSchema = z.object({
  tripId: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await initIndexes();

    // Validate request body
    const body = await req.json();
    const { tripId, message } = chatRequestSchema.parse(body);

    // Load trip
    const tripsCollection = await getTripsCollection();
    const trip = await tripsCollection.findOne({ _id: new ObjectId(tripId) });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Load user
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: trip.userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Load recent messages (increased from 20 to 50 for better context)
    const messagesCollection = await getMessagesCollection();
    const recentMessages = await messagesCollection
      .find({ tripId: new ObjectId(tripId) })
      .sort({ createdAt: 1 })
      .limit(50)
      .toArray();

    // Check if this exact message was already saved recently (within last 10 seconds)
    // This prevents duplicates on retry
    const now = new Date();
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingMessage = await messagesCollection.findOne({
      tripId: new ObjectId(tripId),
      role: 'user',
      content: message,
      createdAt: { $gte: tenSecondsAgo }
    });

    let userMessageId: ObjectId;
    if (existingMessage) {
      // Reuse the existing message instead of creating a duplicate
      userMessageId = existingMessage._id;
    } else {
      // Append new user message
      const userMessage = {
        tripId: new ObjectId(tripId),
        role: 'user' as const,
        content: message,
        createdAt: now,
      };

      const userMessageResult = await messagesCollection.insertOne(userMessage);
      userMessageId = userMessageResult.insertedId;
    }

    // Parse current trip context and ensure question ledger exists
    let currentTripContext = null;
    if (trip.tripContext && Object.keys(trip.tripContext).length > 0) {
      const parsed = tripContextSchema.safeParse(trip.tripContext);
      if (parsed.success) {
        currentTripContext = ensureQuestionLedger(parsed.data);
      }
    }

    // Check if itineraries have already been generated for this trip
    const runsCollection = await getRunsCollection();
    const existingRun = await runsCollection.findOne(
      { tripId: new ObjectId(tripId), multipleItineraries: { $exists: true, $ne: null } },
      { sort: { createdAt: -1 } }
    );

    // If itineraries already exist and user hasn't selected one yet, guide them to use the UI
    if (existingRun?.multipleItineraries) {
      // Check if message indicates confusion or asking for next steps
      const selectionKeywords = /select|choose|pick|next|looks good|already selected|what now|proceed/i;

      if (selectionKeywords.test(message)) {
        // Save a helpful assistant message
        const assistantMessage = {
          tripId: new ObjectId(tripId),
          role: 'system' as const,
          agentName: 'Master',
          content: '👆 Please select one of the itinerary options above by clicking the "Select" button on your preferred choice. This will save the itinerary and let you view the detailed day-by-day plan.',
          createdAt: new Date(),
        };

        await messagesCollection.insertOne(assistantMessage);

        // Return existing run data
        return NextResponse.json({
          run: existingRun,
          tripContext: currentTripContext,
        });
      }
    }

    // Mark any questions as answered if user provided info
    if (currentTripContext) {
      currentTripContext = markQuestionsAsAnswered(currentTripContext, message);
    }

    // Get question context for master agent
    const { answered, outstanding } =
      currentTripContext ? getQuestionContext(currentTripContext) : { answered: [], outstanding: [] };

    // Call master agent
    const agentResult = await callMasterAgent({
      currentTripContext,
      conversationHistory: recentMessages,
      user,
      newUserMessage: message,
      answeredQuestions: answered,
      outstandingQuestions: outstanding,
    });

    if (!agentResult.success || !agentResult.output) {
      // Log detailed error for debugging
      console.error('Master agent failed:', {
        error: agentResult.error,
        rawResponse: agentResult.rawResponse,
      });

      // Create error run record
      await runsCollection.insertOne({
        tripId: new ObjectId(tripId),
        userMessageId,
        status: 'error',
        error: agentResult.error || 'Unknown error',
        createdAt: now,
      });

      return NextResponse.json(
        {
          error: 'Failed to process message',
          details: agentResult.error,
        },
        { status: 500 }
      );
    }

    const masterOutput = agentResult.output;

    // Branch based on mode
    if (masterOutput.mode === 'CLARIFY') {
      // Mode: CLARIFY - Ask questions, update trip context, no specialist execution

      // Filter duplicate questions before updating ledger
      const filteredOutput = filterMasterOutput(
        currentTripContext,
        masterOutput
      );

      // Format master response for user
      const assistantMessage = formatMasterResponse(filteredOutput);

      // Save master message
      const masterMessageResult = await messagesCollection.insertOne({
        tripId: new ObjectId(tripId),
        role: 'master',
        agentName: 'Master',
        content: assistantMessage,
        parsed: filteredOutput as Record<string, unknown>,
        createdAt: new Date(),
      });

      // Update trip context with filtered output
      await tripsCollection.updateOne(
        { _id: new ObjectId(tripId) },
        {
          $set: {
            tripContext: filteredOutput.updatedTripContext as Record<string, unknown>,
            updatedAt: new Date(),
          },
        }
      );

      // Create run record (CLARIFY mode)
      const runResult = await runsCollection.insertOne({
        tripId: new ObjectId(tripId),
        userMessageId,
        masterOutput: filteredOutput as Record<string, unknown>,
        status: 'ok',
        createdAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          tripId,
          assistantMessage,
          masterMessageId: masterMessageResult.insertedId.toString(),
          tripContext: filteredOutput.updatedTripContext,
          run: {
            id: runResult.insertedId.toString(),
            masterOutput: filteredOutput,
          },
        },
        { status: 200 }
      );
    } else if (masterOutput.mode === 'CONFIRM') {
      // Mode: CONFIRM - Show context summary and wait for user confirmation

      // Format master response with context summary
      const assistantMessage = `${masterOutput.contextSummary}\n\n${masterOutput.questions.join('\n')}`;

      // Save master message
      const masterMessageResult = await messagesCollection.insertOne({
        tripId: new ObjectId(tripId),
        role: 'master',
        agentName: 'Master',
        content: assistantMessage,
        parsed: masterOutput as Record<string, unknown>,
        createdAt: new Date(),
      });

      // Update trip context
      await tripsCollection.updateOne(
        { _id: new ObjectId(tripId) },
        {
          $set: {
            tripContext: masterOutput.updatedTripContext as Record<string, unknown>,
            updatedAt: new Date(),
          },
        }
      );

      // Create run record (CONFIRM mode)
      const runResult = await runsCollection.insertOne({
        tripId: new ObjectId(tripId),
        userMessageId,
        masterOutput: masterOutput as Record<string, unknown>,
        status: 'awaiting_confirmation',
        createdAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          tripId,
          assistantMessage,
          masterMessageId: masterMessageResult.insertedId.toString(),
          tripContext: masterOutput.updatedTripContext,
          run: {
            id: runResult.insertedId.toString(),
            masterOutput,
          },
        },
        { status: 200 }
      );
    } else if (masterOutput.mode === 'DISPATCH') {
      // Mode: DISPATCH - Execute specialists in parallel

      const tasks = masterOutput.tasks;

      // Execute specialists in parallel
      const specialistPromises = tasks.map(async (task: Task) => {
        try {
          if (task.specialist === 'transport') {
            const result = await callTransportAgent(task);
            return { task, ...result };
          } else if (task.specialist === 'stay') {
            const result = await callStayAgent(task);
            return { task, ...result };
          } else if (task.specialist === 'food') {
            const result = await callFoodAgent(task);
            return { task, ...result };
          } else {
            return {
              task,
              success: false,
              error: `Unknown specialist: ${task.specialist}`,
            };
          }
        } catch (error) {
          return {
            task,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const specialistResults = await Promise.all(specialistPromises);

      // Extract successful outputs
      const specialistOutputs: SpecialistOutput[] = specialistResults
        .filter((result) => !result.error)
        .map((result) => {
          const { task, ...output } = result;
          return output as SpecialistOutput;
        });

      // Collect errors
      const errors: string[] = specialistResults
        .filter((result) => result.error)
        .map((result) =>
          `${result.task.specialist} (${result.task.taskName}): ${result.error || 'Unknown error'}`
        );

      // Even if some specialists fail, continue with merge if we have at least one success
      if (specialistOutputs.length === 0) {
        // All specialists failed - create error run
        await runsCollection.insertOne({
          tripId: new ObjectId(tripId),
          userMessageId,
          masterOutput: masterOutput as Record<string, unknown>,
          tasks: tasks as Record<string, unknown>[],
          status: 'error',
          error: `All specialists failed: ${errors.join('; ')}`,
          createdAt: new Date(),
        });

        return NextResponse.json(
          {
            error: 'All specialists failed to execute',
            details: errors.join('; '),
          },
          { status: 500 }
        );
      }

      // Call master agent again in FINALIZE mode to merge itinerary
      const mergeResult = await callMasterAgent({
        currentTripContext: masterOutput.updatedTripContext,
        conversationHistory: recentMessages,
        user,
        newUserMessage: message,
        answeredQuestions: answered,
        outstandingQuestions: outstanding,
        specialistOutputs,
      });

      if (!mergeResult.success || !mergeResult.output) {
        // Merge failed - save partial run
        await runsCollection.insertOne({
          tripId: new ObjectId(tripId),
          userMessageId,
          masterOutput: masterOutput as Record<string, unknown>,
          tasks: tasks as Record<string, unknown>[],
          specialistOutputs: specialistOutputs as Record<string, unknown>[],
          status: 'error',
          error: `Merge failed: ${mergeResult.error || 'Unknown error'}`,
          createdAt: new Date(),
        });

        return NextResponse.json(
          {
            error: 'Failed to merge itinerary',
            details: mergeResult.error,
          },
          { status: 500 }
        );
      }

      const finalizeOutput = mergeResult.output;

      // Validate FINALIZE mode
      if (finalizeOutput.mode !== 'FINALIZE') {
        await runsCollection.insertOne({
          tripId: new ObjectId(tripId),
          userMessageId,
          masterOutput: masterOutput as Record<string, unknown>,
          tasks: tasks as Record<string, unknown>[],
          specialistOutputs: specialistOutputs as Record<string, unknown>[],
          status: 'error',
          error: `Expected FINALIZE mode, got ${finalizeOutput.mode}`,
          createdAt: new Date(),
        });

        return NextResponse.json(
          {
            error: 'Master agent returned invalid mode during merge',
            details: `Expected FINALIZE, got ${finalizeOutput.mode}`,
          },
          { status: 500 }
        );
      }

      const multipleItineraries = finalizeOutput.multipleItineraries;

      // Format response for user
      const assistantMessage = formatMasterResponse(finalizeOutput);

      // Save master message
      const masterMessageResult = await messagesCollection.insertOne({
        tripId: new ObjectId(tripId),
        role: 'master',
        agentName: 'Master',
        content: assistantMessage,
        parsed: finalizeOutput as Record<string, unknown>,
        createdAt: new Date(),
      });

      // Update trip with multiple itineraries and updated context
      await tripsCollection.updateOne(
        { _id: new ObjectId(tripId) },
        {
          $set: {
            tripContext: finalizeOutput.updatedTripContext as Record<string, unknown>,
            activeItinerary: multipleItineraries as Record<string, unknown>,
            updatedAt: new Date(),
          },
        }
      );

      // Create complete run record
      const runResult = await runsCollection.insertOne({
        tripId: new ObjectId(tripId),
        userMessageId,
        masterOutput: masterOutput as Record<string, unknown>,
        tasks: tasks as Record<string, unknown>[],
        specialistOutputs: specialistOutputs as Record<string, unknown>[],
        mergedItinerary: multipleItineraries as Record<string, unknown>,
        status: 'ok',
        createdAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          tripId,
          assistantMessage,
          masterMessageId: masterMessageResult.insertedId.toString(),
          tripContext: finalizeOutput.updatedTripContext,
          multipleItineraries,
          run: {
            id: runResult.insertedId.toString(),
            masterOutput,
            tasks,
            specialistOutputs,
            multipleItineraries,
          },
        },
        { status: 200 }
      );
    } else {
      // FINALIZE mode called directly (shouldn't happen in normal flow)
      return NextResponse.json(
        {
          error: 'Invalid mode',
          details: 'FINALIZE mode should only be called internally after DISPATCH',
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Error in POST /api/chat:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
