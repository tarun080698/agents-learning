import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getTripsCollection, initIndexes } from '@/lib/db/models';

interface RouteContext {
  params: Promise<{
    tripId: string;
  }>;
}

// Save a new itinerary
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await initIndexes();

    const params = await context.params;
    const { tripId } = params;
    const body = await req.json();
    const { itinerary, tripContext, name, runId } = body;

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary is required' }, { status: 400 });
    }

    const tripsCollection = await getTripsCollection();

    // If runId is provided, check if an itinerary from this run already exists
    if (runId) {
      const trip = await tripsCollection.findOne({ _id: new ObjectId(tripId) });
      if (trip && trip.savedItineraries) {
        const alreadyExists = trip.savedItineraries.some((saved: any) => saved.runId === runId);
        if (alreadyExists) {
          return NextResponse.json(
            { success: false, message: 'Itinerary from this run already saved' },
            { status: 409 }
          );
        }
      }
    }

    const savedItinerary = {
      _id: new ObjectId().toString(),
      itinerary,
      tripContext: tripContext || null,
      savedAt: new Date(),
      name: name || `Itinerary saved at ${new Date().toLocaleString()}`,
      runId: runId || undefined, // Track which run this itinerary came from
    };

    // Workflow visibility: log user decision when itinerary is selected
    const userDecision = {
      id: new ObjectId().toString(),
      type: 'select_itinerary' as const,
      label: `Selected itinerary: ${name || 'Unnamed itinerary'}`,
      details: {
        optionId: savedItinerary._id,
        optionTitle: name || 'Unnamed itinerary',
        runId: runId || null,
      },
      runId: runId || undefined,
      createdAt: new Date().toISOString(),
    };

    const result = await tripsCollection.updateOne(
      { _id: new ObjectId(tripId) },
      {
        $push: {
          savedItineraries: savedItinerary,
          'tripContext.userDecisions': userDecision,
        } as never,
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, itinerary: savedItinerary }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error saving itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all saved itineraries for a trip (limited to 20 most recent)
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await initIndexes();

    const params = await context.params;
    const { tripId } = params;

    const tripsCollection = await getTripsCollection();
    const trip = await tripsCollection.findOne({ _id: new ObjectId(tripId) });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Return only the 20 most recent itineraries to prevent overload
    const itineraries = (trip.savedItineraries || []).slice(-20).reverse();

    return NextResponse.json(itineraries, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a saved itinerary
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await initIndexes();

    const params = await context.params;
    const { tripId } = params;
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');

    if (!itineraryId) {
      return NextResponse.json({ error: 'itineraryId is required' }, { status: 400 });
    }

    const tripsCollection = await getTripsCollection();

    const result = await tripsCollection.updateOne(
      { _id: new ObjectId(tripId) },
      {
        $pull: { savedItineraries: { _id: itineraryId } } as never,
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
