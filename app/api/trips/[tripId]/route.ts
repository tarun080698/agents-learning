import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getTripsCollection, getMessagesCollection, getRunsCollection, initIndexes } from '@/lib/db/models';
import { generateTripMetadata } from '@/lib/utils/tripMetadata';

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

// Update trip metadata
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await initIndexes();

    const params = await context.params;
    const { tripId } = params;
    const body = await req.json();

    if (!ObjectId.isValid(tripId)) {
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    const tripsCollection = await getTripsCollection();

    // If updateMetadata flag is set, regenerate metadata
    if (body.updateMetadata) {
      const trip = await tripsCollection.findOne({ _id: new ObjectId(tripId) });

      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }

      // Generate fresh metadata with hasItinerary flag
      const hasItinerary = body.hasItinerary !== undefined ? body.hasItinerary : false;
      const metadata = generateTripMetadata(trip.tripContext, hasItinerary);

      // Update trip with new metadata
      await tripsCollection.updateOne(
        { _id: new ObjectId(tripId) },
        {
          $set: {
            title: metadata.title,
            origin: metadata.origin,
            destination: metadata.destination,
            tripDates: metadata.tripDates,
            progress: metadata.progress,
            updatedAt: new Date(),
          },
        }
      );

      const updatedTrip = await tripsCollection.findOne({ _id: new ObjectId(tripId) });
      return NextResponse.json(updatedTrip, { status: 200 });
    }

    return NextResponse.json({ error: 'No update action specified' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error in PATCH /api/trips/[tripId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
