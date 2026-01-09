import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getUsersCollection, initIndexes } from '@/lib/db/models';
import { createUserSchema, getUserQuerySchema } from '@/lib/schemas/user';

export async function POST(req: NextRequest) {
  try {
    await initIndexes();

    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    const usersCollection = await getUsersCollection();
    const now = new Date();

    // Upsert by username
    const result = await usersCollection.findOneAndUpdate(
      { username: validatedData.username },
      {
        $set: {
          ...(validatedData.firstName && { firstName: validatedData.firstName }),
          ...(validatedData.lastName && { lastName: validatedData.lastName }),
          updatedAt: now,
        },
        $setOnInsert: {
          username: validatedData.username,
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in POST /api/users:', error);
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
    const username = searchParams.get('username');

    const validatedQuery = getUserQuerySchema.parse({ username });

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ username: validatedQuery.username });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in GET /api/users:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
