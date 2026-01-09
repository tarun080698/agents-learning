import { z } from 'zod';

// Trip schemas
export const createTripSchema = z.object({
  userId: z.string().min(1),
});

export const getTripQuerySchema = z.object({
  userId: z.string().min(1),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type GetTripQuery = z.infer<typeof getTripQuerySchema>;
