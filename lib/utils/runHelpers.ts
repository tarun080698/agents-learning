import { Run } from '@/lib/db/models';

/**
 * Maps Master Agent mode to execution stage for UI workflow visualization
 */
export function modeToExecutionStage(mode: string): Run['executionStage'] {
  switch (mode?.toUpperCase()) {
    case 'CLARIFY':
      return 'clarify';
    case 'CONFIRM':
      return 'confirm';
    case 'DISPATCH':
      return 'dispatch';
    case 'FINALIZE':
      return 'finalize';
    default:
      return undefined;
  }
}

/**
 * Normalizes legacy runs for backward compatibility
 * Provides safe defaults for runs created before workflow visibility was added
 */
export function normalizeLegacyRun(run: Run): Run & { executionStage: NonNullable<Run['executionStage']> } {
  // If executionStage already exists, return as-is
  if (run.executionStage) {
    return run as Run & { executionStage: NonNullable<Run['executionStage']> };
  }

  // Infer execution stage from available data
  let inferredStage: NonNullable<Run['executionStage']>;

  if (run.status === 'error') {
    inferredStage = 'error';
  } else if (run.status === 'itinerary_selected' || run.status === 'completed') {
    inferredStage = 'completed';
  } else if (run.multipleItineraries) {
    inferredStage = 'completed';
  } else if (run.specialistOutputs && run.specialistOutputs.length > 0) {
    inferredStage = 'finalize';
  } else if (run.tasks && run.tasks.length > 0) {
    inferredStage = 'research';
  } else if (run.masterOutput) {
    const mode = (run.masterOutput as Record<string, unknown>)?.mode;
    inferredStage = modeToExecutionStage(mode as string) || 'clarify';
  } else {
    inferredStage = 'clarify';
  }

  // Normalize tasks array for legacy runs
  type TaskItem = NonNullable<Run['tasks']>[number];
  const normalizedTasks = run.tasks?.map((task: Record<string, unknown> | TaskItem, index: number) => {
    // If task already has status, return as-is
    if ('status' in task && task.status) {
      return task as TaskItem;
    }

    // Legacy task: infer status
    const hasSpecialistOutput = run.specialistOutputs?.some(
      (output: Record<string, unknown>) => output.taskId === (task as Record<string, unknown>).taskId || output.taskId === `task-${index + 1}`
    );

    return {
      taskId: (task as Record<string, unknown>).taskId as string || `task-${index + 1}`,
      taskName: (task as Record<string, unknown>).taskName as string | undefined,
      specialist: (task as Record<string, unknown>).specialist as string || 'transport',
      instructions: (task as Record<string, unknown>).instructions as string || '',
      status: hasSpecialistOutput ? ('completed' as const) : ('pending' as const),
      startedAt: hasSpecialistOutput ? run.createdAt : undefined,
      completedAt: hasSpecialistOutput ? (run.updatedAt || run.createdAt) : undefined,
    };
  });

  return {
    ...run,
    executionStage: inferredStage,
    tasks: normalizedTasks,
  } as Run & { executionStage: NonNullable<Run['executionStage']> };
}

/**
 * Converts agent task output to typed Run task format
 */
export function convertAgentTaskToRunTask(
  agentTask: Record<string, unknown>,
  status: 'pending' | 'running' | 'completed' | 'failed' = 'pending'
): NonNullable<Run['tasks']>[0] {
  return {
    taskId: (agentTask.taskId || agentTask.id || '') as string,
    taskName: agentTask.taskName as string | undefined || agentTask.name as string | undefined,
    specialist: (agentTask.specialist || 'transport') as 'transport' | 'stay' | 'food' | string,
    instructions: (agentTask.instructions || '') as string,
    status,
  };
}
