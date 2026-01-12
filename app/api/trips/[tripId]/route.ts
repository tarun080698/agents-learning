import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getTripsCollection, getMessagesCollection, getRunsCollection, initIndexes } from '@/lib/db/models';

interface RouteContext {
  params: Promise<{
    tripId: string;
  }>;
}

// Delete a trip and all associated data
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await initIndexes();

    const params = await context.params;
    const { tripId } = params;

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const tripObjectId = new ObjectId(tripId);

    // Delete all messages associated with this trip
    const messagesCollection = await getMessagesCollection();
    await messagesCollection.deleteMany({ tripId: tripObjectId });

    // Delete all runs associated with this trip
    const runsCollection = await getRunsCollection();
    await runsCollection.deleteMany({ tripId: tripObjectId });

    // Delete the trip itself
    const tripsCollection = await getTripsCollection();
    const result = await tripsCollection.deleteOne({ _id: tripObjectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Trip and all associated data deleted successfully'
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
