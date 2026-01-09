import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { getTripsCollection, initIndexes } from '@/lib/db/models';
import { createTripSchema, getTripQuerySchema } from '@/lib/schemas/trip';

export async function POST(req: NextRequest) {
  try {
    await initIndexes();

    const body = await req.json();
    const validatedData = createTripSchema.parse(body);

    const tripsCollection = await getTripsCollection();
    const now = new Date();

    const newTrip = {
      userId: new ObjectId(validatedData.userId),
      status: 'draft' as const,
      tripContext: {},
      createdAt: now,
      updatedAt: now,
    };

    const result = await tripsCollection.insertOne(newTrip);
    const trip = await tripsCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(trip, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/trips:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await initIndexes();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const validatedQuery = getTripQuerySchema.parse({ userId });

    const tripsCollection = await getTripsCollection();
    const trips = await tripsCollection
      .find({ userId: new ObjectId(validatedQuery.userId) })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(trips, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/trips:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
