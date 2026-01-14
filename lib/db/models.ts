import { Collection, ObjectId } from 'mongodb';
import { getDb } from './mongo';

// Type definitions
export interface User {
  _id?: ObjectId;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  _id?: ObjectId;
  userId: ObjectId;
  status: 'draft' | 'planning' | 'final';
  title?: string; // Dynamic title like "Trip to Boston" or "NYC to Boston"
  origin?: string;
  destination?: string;
  tripDates?: {
    start?: string;
    end?: string;
  };
  progress?: {
    hasDestination: boolean;
    hasOrigin: boolean;
    hasDates: boolean;
    hasItinerary: boolean;
    percentComplete: number;
  };
  tripContext: Record<string, unknown>;
  activeItinerary?: Record<string, unknown>;
  savedItineraries?: Array<{
    _id: string;
    itinerary: Record<string, unknown>;
    tripContext?: Record<string, unknown>;
    savedAt: Date;
    name?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id?: ObjectId;
  tripId: ObjectId;
  role: 'user' | 'master' | 'specialist' | 'system';
  agentName?: string;
  content: string;
  parsed?: Record<string, unknown>;
  createdAt: Date;
}

export interface Run {
  _id?: ObjectId;
  tripId: ObjectId;
  userMessageId: ObjectId;
  masterOutput?: Record<string, unknown>;
  dispatchOutput?: Record<string, unknown>;
  tasks?: Array<{
    taskId: string;
    taskName?: string;
    specialist: 'transport' | 'stay' | 'food' | string;
    instructions: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
  }>;
  specialistOutputs?: Record<string, unknown>[];
  mergedItinerary?: Record<string, unknown>;
  multipleItineraries?: Record<string, unknown>;
  status: string;
  selectedOptionId?: string;
  // Workflow visibility: execution stage for UI timeline rendering
  // Optional for backward compatibility with old runs
  executionStage?: 'clarify' | 'confirm' | 'dispatch' | 'research' | 'finalize' | 'completed' | 'error';
  error?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Collection getters
export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>('users');
}

export async function getTripsCollection(): Promise<Collection<Trip>> {
  const db = await getDb();
  return db.collection<Trip>('trips');
}

export async function getMessagesCollection(): Promise<Collection<Message>> {
  const db = await getDb();
  return db.collection<Message>('messages');
}

export async function getRunsCollection(): Promise<Collection<Run>> {
  const db = await getDb();
  return db.collection<Run>('runs');
}

// Initialize indexes
let indexesInitialized = false;

export async function initIndexes() {
  if (indexesInitialized) return;

  try {
    const db = await getDb();

    // Users collection indexes
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ username: 1 }, { unique: true });

    // Trips collection indexes
    const tripsCollection = db.collection('trips');
    await tripsCollection.createIndex({ userId: 1 });

    // Messages collection indexes
    const messagesCollection = db.collection('messages');
    await messagesCollection.createIndex({ tripId: 1, createdAt: 1 });

    // Runs collection indexes (for future use)
    const runsCollection = db.collection('runs');
    await runsCollection.createIndex({ tripId: 1 });

    indexesInitialized = true;
    console.log('Database indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing indexes:', error);
    throw error;
  }
}
