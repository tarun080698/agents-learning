import { z } from 'zod';

// Message schemas
export const createMessageSchema = z.object({
  tripId: z.string().min(1),
  role: z.enum(['user', 'master', 'specialist', 'system']),
  content: z.string().min(1),
  agentName: z.string().optional(),
});

export const getMessageQuerySchema = z.object({
  tripId: z.string().min(1),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type GetMessageQuery = z.infer<typeof getMessageQuerySchema>;
