import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getRunsCollection } from '@/lib/db/models';

interface RouteContext {
  params: Promise<{
    runId: string;
  }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const { runId } = params;
    const body = await req.json();

    if (!ObjectId.isValid(runId)) {
      return NextResponse.json({ error: 'Invalid run ID' }, { status: 400 });
    }

    const runsCollection = await getRunsCollection();

    const updateFields: any = {};

    if (body.status) {
      updateFields.status = body.status;

      // Workflow visibility: set executionStage to 'completed' when itinerary is selected
      if (body.status === 'itinerary_selected') {
        updateFields.executionStage = 'completed';
      }
    }

    if (body.selectedOptionId) {
      updateFields.selectedOptionId = body.selectedOptionId;
    }

    updateFields.updatedAt = new Date();

    const result = await runsCollection.updateOne(
      { _id: new ObjectId(runId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating run:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
