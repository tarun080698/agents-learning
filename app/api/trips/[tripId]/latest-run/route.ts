import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getRunsCollection, initIndexes } from '@/lib/db/models';
import { normalizeLegacyRun } from '@/lib/utils/runHelpers';

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

    // Workflow visibility: include 'itinerary_selected' in success status set
    // This ensures selected runs are returned for UI persistence
    const latestRun = await runsCollection.findOne(
      { tripId: new ObjectId(tripId), status: { $in: ['ok', 'completed', 'itinerary_selected'] } },
      { sort: { createdAt: -1 } }
    );

    // Normalize legacy runs for backward compatibility
    const normalizedRun = latestRun ? normalizeLegacyRun(latestRun) : null;

    return NextResponse.json({ run: normalizedRun });
  } catch (error) {
    console.error('Error fetching latest run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest run' },
      { status: 500 }
    );
  }
}
