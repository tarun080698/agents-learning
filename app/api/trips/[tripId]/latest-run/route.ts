import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getRunsCollection, initIndexes } from '@/lib/db/models';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await initIndexes();
    const { tripId } = await params;

    if (!ObjectId.isValid(tripId)) {
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    const runsCollection = await getRunsCollection();
    const latestRun = await runsCollection.findOne(
      { tripId: new ObjectId(tripId), status: { $in: ['ok', 'completed'] } },
      { sort: { createdAt: -1 } }
    );

    return NextResponse.json({ run: latestRun });
  } catch (error) {
    console.error('Error fetching latest run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest run' },
      { status: 500 }
    );
  }
}
