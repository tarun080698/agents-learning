# Workflow Visibility - Quick Reference

## Execution Stages

| Stage | Description | When Set |
|-------|-------------|----------|
| `clarify` | Gathering trip details | Master Agent in CLARIFY mode |
| `confirm` | Awaiting user confirmation | Master Agent in CONFIRM mode |
| `dispatch` | Creating specialist tasks | Master Agent in DISPATCH mode (initial) |
| `research` | Specialists executing | Before calling specialist agents |
| `finalize` | Merging outputs | Master Agent in FINALIZE mode |
| `completed` | Ready or selected | After FINALIZE or itinerary selection |
| `error` | Execution failed | Any error during process |

## Task Status Values

| Status | Description | Next State |
|--------|-------------|------------|
| `pending` | Task created, not started | `running` |
| `running` | Specialist actively working | `completed` or `failed` |
| `completed` | Task finished successfully | (terminal) |
| `failed` | Task encountered error | (terminal) |

## Key API Response Fields

### POST /api/chat
```typescript
{
  run: {
    executionStage: 'completed',
    tasks: [
      {
        taskId: string,
        specialist: 'transport' | 'stay' | 'food',
        status: 'pending' | 'running' | 'completed' | 'failed',
        startedAt?: Date,
        completedAt?: Date,
        error?: string
      }
    ]
  }
}
```

### GET /api/trips/{tripId}/latest-run
```typescript
{
  run: {
    executionStage: 'completed',
    status: 'itinerary_selected',
    selectedOptionId: 'opt-2',
    tasks: [...] // with timing info
  }
}
```

## User Decision Logging

When itinerary is selected:
```typescript
tripContext.userDecisions.push({
  id: string,
  type: 'select_itinerary',
  label: 'Selected itinerary: Balanced Experience',
  details: {
    optionId: 'opt-2',
    optionTitle: 'Balanced Experience',
    runId: '507f...'
  },
  createdAt: ISO string
});
```

## UI Integration Examples

### Render Stage Timeline
```typescript
const stageLabels = {
  clarify: 'Gathering Details',
  confirm: 'Confirming Plan',
  dispatch: 'Creating Tasks',
  research: 'Researching Options',
  finalize: 'Building Itinerary',
  completed: 'Ready',
  error: 'Error'
};

const currentLabel = stageLabels[run.executionStage];
```

### Show Parallel Task Progress
```typescript
const taskProgress = run.tasks?.map(task => ({
  name: task.specialist.charAt(0).toUpperCase() + task.specialist.slice(1),
  status: task.status,
  icon: {
    transport: '✈️',
    stay: '🏨',
    food: '🍽️'
  }[task.specialist],
  duration: task.completedAt && task.startedAt
    ? task.completedAt - task.startedAt
    : null
}));
```

### Calculate Overall Progress
```typescript
const stages = ['clarify', 'confirm', 'dispatch', 'research', 'finalize', 'completed'];
const currentIndex = stages.indexOf(run.executionStage);
const progressPercent = ((currentIndex + 1) / stages.length) * 100;
```

### Show Task Status Badge
```typescript
const statusColors = {
  pending: 'bg-gray-200 text-gray-700',
  running: 'bg-blue-200 text-blue-700 animate-pulse',
  completed: 'bg-green-200 text-green-700',
  failed: 'bg-red-200 text-red-700'
};

<Badge className={statusColors[task.status]}>
  {task.status}
</Badge>
```

## Common Queries

### Get runs with stages
```javascript
db.runs.find(
  { executionStage: { $exists: true } },
  { executionStage: 1, 'tasks.status': 1, createdAt: 1 }
).sort({ createdAt: -1 });
```

### Check task durations
```javascript
db.runs.aggregate([
  { $unwind: '$tasks' },
  { $match: { 'tasks.status': 'completed' } },
  { $project: {
      specialist: '$tasks.specialist',
      duration: { $subtract: ['$tasks.completedAt', '$tasks.startedAt'] }
    }
  },
  { $group: {
      _id: '$specialist',
      avgMs: { $avg: '$duration' }
    }
  }
]);
```

### Get user decisions
```javascript
db.trips.find(
  { 'tripContext.userDecisions': { $ne: [] } },
  { 'tripContext.userDecisions': 1, title: 1 }
);
```

## Helper Functions

### Check if run is in progress
```typescript
function isRunInProgress(run: Run): boolean {
  return ['dispatch', 'research', 'finalize'].includes(run.executionStage || '');
}
```

### Get stage display name
```typescript
function getStageDisplay(stage: string): string {
  const labels = {
    clarify: 'Gathering Details',
    confirm: 'Confirming Plan',
    dispatch: 'Creating Tasks',
    research: 'Researching Options',
    finalize: 'Building Itinerary',
    completed: 'Ready for Selection',
    error: 'Error Occurred'
  };
  return labels[stage] || 'Unknown';
}
```

### Calculate stage progress
```typescript
function getStageProgress(stage: string): number {
  const stages = ['clarify', 'confirm', 'dispatch', 'research', 'finalize', 'completed'];
  const index = stages.indexOf(stage);
  return index === -1 ? 0 : Math.round(((index + 1) / stages.length) * 100);
}
```

### Get task summary
```typescript
function getTaskSummary(tasks: Run['tasks']) {
  const counts = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0
  };

  tasks?.forEach(task => {
    counts[task.status]++;
  });

  return counts;
}
```

## Backward Compatibility

Legacy runs (without executionStage) are automatically normalized:

```typescript
import { normalizeLegacyRun } from '@/lib/utils/runHelpers';

// At API layer (latest-run endpoint already does this)
const normalizedRun = normalizeLegacyRun(legacyRun);
// Now has: executionStage, tasks with statuses
```

## Testing Checklist

Quick verification:

```bash
# 1. Create trip, send message
# Check: executionStage='clarify'

# 2. Provide details, trigger DISPATCH
# Check: executionStage='dispatch' → 'research' → 'completed'
# Check: tasks transition pending → running → completed

# 3. Select itinerary
# Check: status='itinerary_selected'
# Check: tripContext.userDecisions has entry

# 4. Call latest-run endpoint
# Check: Returns normalized run with all fields
```

## References

- Full documentation: `docs/DATA_MODELS.md` (Workflow Visibility section)
- API reference: `docs/API.md`
- Testing guide: `docs/WORKFLOW_VISIBILITY_TESTING.md`
- Implementation summary: `docs/WORKFLOW_VISIBILITY_SUMMARY.md`
