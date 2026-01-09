import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { getMessagesCollection, getTripsCollection, initIndexes } from '@/lib/db/models';
import { createMessageSchema, getMessageQuerySchema } from '@/lib/schemas/message';

export async function POST(req: NextRequest) {
  try {
    await initIndexes();

    const body = await req.json();
    const validatedData = createMessageSchema.parse(body);

    const messagesCollection = await getMessagesCollection();
    const tripsCollection = await getTripsCollection();
    const now = new Date();

    const newMessage = {
      tripId: new ObjectId(validatedData.tripId),
      role: validatedData.role,
      content: validatedData.content,
      ...(validatedData.agentName && { agentName: validatedData.agentName }),
      createdAt: now,
    };

    const result = await messagesCollection.insertOne(newMessage);

    // Update trip's updatedAt
    await tripsCollection.updateOne(
      { _id: new ObjectId(validatedData.tripId) },
      { $set: { updatedAt: now } }
    );

    const message = await messagesCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/messages:', error);
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
    const tripId = searchParams.get('tripId');

    const validatedQuery = getMessageQuerySchema.parse({ tripId });

    const messagesCollection = await getMessagesCollection();
    const messages = await messagesCollection
      .find({ tripId: new ObjectId(validatedQuery.tripId) })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(messages, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/messages:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
