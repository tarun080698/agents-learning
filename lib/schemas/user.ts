import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  username: z.string().min(1).max(50),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const getUserQuerySchema = z.object({
  username: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GetUserQuery = z.infer<typeof getUserQuerySchema>;
