# Workflow Visibility Implementation - Summary

## Overview

Successfully implemented comprehensive workflow-visibility improvements to enable the UI to visualize agent progress without guessing. The system now tracks execution stages, parallel task progress, and user decisions with backward compatibility for legacy runs.

## Implementation Summary

### ✅ 1. Data Model Updates

**Files Modified:**
- `lib/db/models.ts`
- `lib/schemas/agent.ts`

**Changes:**
- Added `executionStage` field to Run interface: `'clarify' | 'confirm' | 'dispatch' | 'research' | 'finalize' | 'completed' | 'error'`
- Enhanced `tasks` array with status tracking:
  ```typescript
  tasks: Array<{
    taskId: string;
    taskName?: string;
    specialist: 'transport' | 'stay' | 'food' | string;
    instructions: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
  }>
  ```
- Added `userDecisions` array to TripContext schema for explicit decision logging
- All new fields are optional for backward compatibility

### ✅ 2. Helper Functions

**File Created:**
- `lib/utils/runHelpers.ts`

**Functions:**
- `modeToExecutionStage(mode)`: Maps Master Agent mode to execution stage
- `normalizeLegacyRun(run)`: Provides backward compatibility by inferring stages/statuses for old runs
- `convertAgentTaskToRunTask(agentTask, status)`: Converts agent output to typed Run task format

### ✅ 3. API Enhancements

#### POST /api/chat
**File:** `app/api/chat/route.ts`

**Changes:**
- Import workflow helpers
- Set `executionStage` based on Master Agent mode:
  - CLARIFY → 'clarify'
  - CONFIRM → 'confirm'
  - DISPATCH → 'dispatch' (initial) then 'research'
  - FINALIZE → 'finalize' then 'completed'
  - Errors → 'error'
- Atomic task status updates during specialist execution:
  - Before call: `status: 'running'`, `startedAt: now`
  - After success: `status: 'completed'`, `completedAt: now`
  - After failure: `status: 'failed'`, `error: message`, `completedAt: now`
- Return task statuses and executionStage in response

#### PATCH /api/runs/[runId]
**File:** `app/api/runs/[runId]/route.ts`

**Changes:**
- When `status` changes to `'itinerary_selected'`, automatically set `executionStage: 'completed'`

#### GET /api/trips/[tripId]/latest-run
**File:** `app/api/trips/[tripId]/latest-run/route.ts`

**Changes:**
- Include `'itinerary_selected'` in success status query
- Apply `normalizeLegacyRun()` to ensure all runs have executionStage/task statuses
- Return normalized run with workflow visibility fields

#### POST /api/trips/[tripId]/itineraries
**File:** `app/api/trips/[tripId]/itineraries/route.ts`

**Changes:**
- Append user decision entry to `tripContext.userDecisions` when itinerary is saved:
  ```typescript
  {
    id: string,
    type: 'select_itinerary',
    label: 'Selected itinerary: ...',
    details: { optionId, optionTitle, runId },
    createdAt: ISO timestamp
  }
  ```

### ✅ 4. Agent Prompting

**File:** `lib/agents/master.ts`

**Status:** No changes required - Master Agent already outputs stable `taskId`, `specialist`, and `instructions` in DISPATCH mode as shown in the system prompt examples.

### ✅ 5. Documentation

**Files Updated:**
- `docs/DATA_MODELS.md`
  - Updated Run interface with new fields
  - Added Workflow Visibility and Execution Stages section
  - Documented stage transitions and task status flow
  - Added userDecisions to TripContext schema
  - Updated itinerary selection flow

- `docs/API.md`
  - Updated POST /api/chat response examples with executionStage and task statuses
  - Enhanced PATCH /api/runs/[runId] documentation
  - Updated GET /api/trips/[tripId]/latest-run with workflow visibility features
  - Enhanced POST /api/trips/[tripId]/itineraries with user decision logging

**File Created:**
- `docs/WORKFLOW_VISIBILITY_TESTING.md`
  - Comprehensive testing guide with 7 test scenarios
  - Manual testing steps for each workflow stage
  - MongoDB verification queries
  - Troubleshooting tips
  - Expected behavior summary table

## Execution Stage Lifecycle

```
┌──────────┐   User     ┌──────────┐   User      ┌──────────┐
│ CLARIFY  │─provides──▶│ CONFIRM  │─confirms───▶│ DISPATCH │
└──────────┘   info     └──────────┘             └──────────┘
                                                       │
                                                       ▼
                                                  ┌──────────┐
                        ┌──────────┐◀─specialists─│ RESEARCH │
                        │ FINALIZE │              └──────────┘
                        └──────────┘
                             │
                             ▼
                        ┌───────────┐   User    ┌───────────┐
                        │ COMPLETED │─selects──▶│ COMPLETED │
                        └───────────┘  option   │+ selected │
                                                 └───────────┘
                             │
                        (on error)
                             ▼
                        ┌─────────┐
                        │  ERROR  │
                        └─────────┘
```

## Task Status Transitions

```
PENDING → RUNNING → COMPLETED
                 └→ FAILED (on error)
```

## Key Features

### 1. **Real-time Progress Tracking**
- UI can render timeline showing current execution stage
- Parallel specialist execution visible with individual task statuses
- Timestamps for task start/completion enable duration calculation

### 2. **User Decision Audit Trail**
- All itinerary selections logged in tripContext.userDecisions
- Includes metadata: optionId, title, runId, timestamp
- Enables analytics and user behavior tracking

### 3. **Backward Compatibility**
- Legacy runs without executionStage/task statuses work seamlessly
- Normalization happens transparently at API layer
- No migration script required

### 4. **Atomic Database Updates**
- Task status updates use MongoDB positional operator (`tasks.$.status`)
- Ensures consistency even with parallel specialist execution
- Prevents race conditions

## Example Flow (DISPATCH → COMPLETED)

1. **User confirms trip details**
   ```
   POST /api/chat { message: "yes, proceed" }
   ```

2. **Run created with DISPATCH stage**
   ```json
   {
     "executionStage": "dispatch",
     "tasks": [
       { "taskId": "task-1", "status": "pending", ... },
       { "taskId": "task-2", "status": "pending", ... },
       { "taskId": "task-3", "status": "pending", ... }
     ]
   }
   ```

3. **Transition to RESEARCH stage**
   ```json
   { "executionStage": "research" }
   ```

4. **Specialists execute in parallel**
   ```json
   {
     "tasks": [
       { "taskId": "task-1", "status": "running", "startedAt": "..." },
       { "taskId": "task-2", "status": "running", "startedAt": "..." },
       { "taskId": "task-3", "status": "running", "startedAt": "..." }
     ]
   }
   ```

5. **Tasks complete**
   ```json
   {
     "tasks": [
       { "taskId": "task-1", "status": "completed", "completedAt": "..." },
       { "taskId": "task-2", "status": "completed", "completedAt": "..." },
       { "taskId": "task-3", "status": "completed", "completedAt": "..." }
     ]
   }
   ```

6. **Transition to FINALIZE stage**
   ```json
   { "executionStage": "finalize" }
   ```

7. **Final itineraries generated**
   ```json
   {
     "executionStage": "completed",
     "multipleItineraries": { "options": [...] }
   }
   ```

8. **User selects itinerary**
   ```
   POST /api/trips/{tripId}/itineraries
   PATCH /api/runs/{runId} { status: "itinerary_selected" }
   ```

9. **Decision logged**
   ```json
   {
     "tripContext": {
       "userDecisions": [
         {
           "type": "select_itinerary",
           "label": "Selected itinerary: Balanced Experience",
           "details": { "optionId": "opt-2", ... },
           "createdAt": "..."
         }
       ]
     }
   }
   ```

## Benefits for UI Development

### Timeline Visualization
```typescript
// UI can render agent activity timeline
const stages = [
  { stage: 'clarify', label: 'Gathering Details', status: 'completed' },
  { stage: 'confirm', label: 'Confirming Plan', status: 'completed' },
  { stage: 'dispatch', label: 'Creating Tasks', status: 'completed' },
  { stage: 'research', label: 'Researching Options', status: 'completed' },
  { stage: 'finalize', label: 'Building Itinerary', status: 'completed' },
  { stage: 'completed', label: 'Ready for Selection', status: 'current' }
];
```

### Parallel Task Progress
```typescript
// UI can show specialist progress in real-time
tasks.map(task => ({
  specialist: task.specialist, // 'transport', 'stay', 'food'
  status: task.status,         // 'pending', 'running', 'completed'
  duration: task.completedAt - task.startedAt // milliseconds
}));
```

### User Decision History
```typescript
// UI can display decision audit trail
tripContext.userDecisions.map(decision => ({
  timestamp: decision.createdAt,
  action: decision.label,
  details: decision.details
}));
```

## Testing Checklist

- [ ] CLARIFY mode sets executionStage='clarify'
- [ ] CONFIRM mode sets executionStage='confirm'
- [ ] DISPATCH creates tasks with status='pending'
- [ ] Tasks transition to 'running' before specialist calls
- [ ] Tasks transition to 'completed' after success
- [ ] Failed specialists mark tasks as 'failed' with error message
- [ ] FINALIZE stage transitions correctly
- [ ] Final stage is 'completed' with multipleItineraries
- [ ] Itinerary selection logs user decision
- [ ] Run status updates to 'itinerary_selected'
- [ ] GET latest-run returns executionStage and task statuses
- [ ] Legacy runs are normalized correctly
- [ ] Error handling sets executionStage='error'

See `docs/WORKFLOW_VISIBILITY_TESTING.md` for detailed testing steps.

## Metrics & Monitoring

### Recommended Metrics
- **Stage durations**: Time spent in each executionStage
- **Task durations**: Individual specialist execution times
- **Parallel efficiency**: Difference between slowest and fastest task
- **Failure rates**: Percentage of tasks with status='failed'
- **User decisions**: Itinerary selection patterns (which options chosen)

### Example Queries

**Average task duration by specialist:**
```javascript
db.runs.aggregate([
  { $unwind: '$tasks' },
  { $match: { 'tasks.status': 'completed' } },
  { $group: {
      _id: '$tasks.specialist',
      avgDuration: {
        $avg: {
          $subtract: ['$tasks.completedAt', '$tasks.startedAt']
        }
      }
    }
  }
]);
```

**Execution stage distribution:**
```javascript
db.runs.aggregate([
  { $group: { _id: '$executionStage', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

## Next Steps

1. **Frontend Integration**: Build UI components using executionStage and task statuses
2. **Real-time Updates**: Add WebSocket or polling for live progress updates
3. **Error Recovery**: Implement retry logic for failed tasks
4. **Analytics Dashboard**: Track stage transitions and task performance
5. **User Experience**: Show specialist progress animations
6. **Optimization**: Monitor task durations and optimize slow specialists

## Files Changed Summary

**Data Models (2 files):**
- `lib/db/models.ts` - Run interface
- `lib/schemas/agent.ts` - TripContext schema

**Utilities (1 file):**
- `lib/utils/runHelpers.ts` - NEW

**API Routes (4 files):**
- `app/api/chat/route.ts`
- `app/api/runs/[runId]/route.ts`
- `app/api/trips/[tripId]/latest-run/route.ts`
- `app/api/trips/[tripId]/itineraries/route.ts`

**Documentation (3 files):**
- `docs/DATA_MODELS.md`
- `docs/API.md`
- `docs/WORKFLOW_VISIBILITY_TESTING.md` - NEW

**Total:** 11 files (2 new, 9 modified)

## Conclusion

The workflow-visibility implementation is complete and ready for UI integration. All code changes maintain backward compatibility, include comprehensive documentation, and provide the foundation for rich UI visualizations of agent execution progress.
