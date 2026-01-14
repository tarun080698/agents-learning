# Workflow Visibility Testing Guide

This document provides manual testing steps to verify the workflow-visibility improvements implemented for agent execution tracking.

## Overview of Changes

The application now tracks agent execution progress through:
1. **Execution Stages**: `clarify` → `confirm` → `dispatch` → `research` → `finalize` → `completed` → `error`
2. **Task Status Tracking**: Each specialist task has `pending` → `running` → `completed` or `failed` status
3. **User Decision Logging**: Explicit tracking of user decisions (itinerary selections, confirmations)
4. **Backward Compatibility**: Legacy runs are automatically normalized with inferred stages/statuses

## Prerequisites

1. MongoDB running locally or MongoDB Atlas connection configured
2. OpenAI API key configured in `.env` file
3. Application running: `pnpm dev`
4. Clean database recommended for testing (or use a test trip)

## Test Scenarios

### Test 1: CLARIFY Mode - Basic Flow

**Objective:** Verify executionStage is set to 'clarify' for initial questions

**Steps:**
1. Start application, navigate to home
2. Enter username (e.g., "tester")
3. Click "New Trip"
4. Send message: "I want to visit Boston"

**Expected Results:**
- API response includes `run.executionStage = 'clarify'`
- Run document in MongoDB has `executionStage: 'clarify'`
- Master agent asks clarifying questions
- No tasks array yet (tasks only appear in DISPATCH mode)

**Verify in MongoDB:**
```javascript
db.runs.findOne({}, { sort: { createdAt: -1 } })
// Should show:
// {
//   executionStage: 'clarify',
//   status: 'ok',
//   masterOutput: { mode: 'CLARIFY', ... }
// }
```

---

### Test 2: CONFIRM Mode - Context Summary

**Objective:** Verify executionStage transitions to 'confirm' when ready for user confirmation

**Steps:**
1. Continue from Test 1
2. Provide comprehensive trip details:
   - Message: "I'm traveling from NYC, Feb 15-18, 2 people, mid budget, interested in history and food, prefer boutique hotels"

**Expected Results:**
- Master Agent may enter CONFIRM mode (shows context summary)
- If in CONFIRM: `run.executionStage = 'confirm'`
- User sees summary with "Does this look good?" or similar

**Verify in MongoDB:**
```javascript
db.runs.findOne({}, { sort: { createdAt: -1 } })
// If CONFIRM mode triggered:
// {
//   executionStage: 'confirm',
//   status: 'awaiting_confirmation' or 'ok',
//   masterOutput: { mode: 'CONFIRM', contextSummary: '...', ... }
// }
```

---

### Test 3: DISPATCH → RESEARCH → FINALIZE Flow with Task Tracking

**Objective:** Verify complete workflow with task status transitions

**Steps:**
1. Continue from Test 2
2. If in CONFIRM mode, send: "Yes, looks good, proceed"
3. Wait for specialists to execute and itineraries to generate

**Expected Results:**

**Stage 1: DISPATCH**
- Run created with `executionStage: 'dispatch'`
- `tasks` array populated with 3 tasks (transport, stay, food)
- All tasks have `status: 'pending'`

**Stage 2: RESEARCH**
- `executionStage` updates to `'research'`
- Each task transitions:
  - `status: 'running'`, `startedAt` timestamp added
  - Then `status: 'completed'`, `completedAt` timestamp added
- Tasks execute in parallel (check timestamps are close)

**Stage 3: FINALIZE**
- `executionStage` updates to `'finalize'`
- Master Agent merges specialist outputs

**Stage 4: COMPLETED**
- `executionStage` updates to `'completed'`
- `multipleItineraries` populated with 2-3 options
- All tasks show `status: 'completed'`

**Verify in MongoDB:**
```javascript
db.runs.findOne({}, { sort: { createdAt: -1 } })
// Final state should show:
// {
//   executionStage: 'completed',
//   status: 'ok',
//   tasks: [
//     {
//       taskId: 'task-1',
//       specialist: 'transport',
//       status: 'completed',
//       startedAt: ISODate(...),
//       completedAt: ISODate(...)
//     },
//     {
//       taskId: 'task-2',
//       specialist: 'stay',
//       status: 'completed',
//       startedAt: ISODate(...),
//       completedAt: ISODate(...)
//     },
//     {
//       taskId: 'task-3',
//       specialist: 'food',
//       status: 'completed',
//       startedAt: ISODate(...),
//       completedAt: ISODate(...)
//     }
//   ],
//   specialistOutputs: [ ... ],
//   multipleItineraries: { options: [ ... ] },
//   updatedAt: ISODate(...)
// }
```

**Verify Parallel Execution:**
```javascript
// Check that tasks started around the same time
const run = db.runs.findOne({}, { sort: { createdAt: -1 } });
const task1Start = run.tasks[0].startedAt;
const task2Start = run.tasks[1].startedAt;
const task3Start = run.tasks[2].startedAt;

// Difference should be < 1 second (parallel execution)
print(task2Start - task1Start); // Should be ~0-100ms
print(task3Start - task1Start); // Should be ~0-100ms
```

---

### Test 4: Itinerary Selection with User Decision Logging

**Objective:** Verify user decision is logged when itinerary is selected

**Steps:**
1. Continue from Test 3 (itineraries generated)
2. Click "Select" on one of the itinerary options (e.g., "Balanced Experience")
3. Wait for confirmation

**Expected Results:**

**Run Updates:**
- `status` changes to `'itinerary_selected'`
- `executionStage` remains `'completed'` (or sets to completed if not already)
- `selectedOptionId` matches the selected option
- `updatedAt` timestamp updated

**Trip Updates:**
- Itinerary saved to `trip.savedItineraries` array
- User decision logged in `trip.tripContext.userDecisions`:
  ```json
  {
    "id": "dec-...",
    "type": "select_itinerary",
    "label": "Selected itinerary: Balanced Experience",
    "details": {
      "optionId": "opt-2",
      "optionTitle": "Balanced Experience",
      "runId": "507f..."
    },
    "runId": "507f...",
    "createdAt": "2026-01-14T..."
  }
  ```

**Verify in MongoDB:**
```javascript
// Check run status
db.runs.findOne({ _id: ObjectId('YOUR_RUN_ID') });
// {
//   status: 'itinerary_selected',
//   selectedOptionId: 'opt-2',
//   executionStage: 'completed',
//   ...
// }

// Check trip for user decision log
db.trips.findOne({ _id: ObjectId('YOUR_TRIP_ID') });
// {
//   tripContext: {
//     ...
//     userDecisions: [
//       {
//         id: '...',
//         type: 'select_itinerary',
//         label: 'Selected itinerary: Balanced Experience',
//         details: { optionId: 'opt-2', ... },
//         createdAt: '...'
//       }
//     ]
//   },
//   savedItineraries: [
//     { _id: '...', itinerary: {...}, savedAt: ... }
//   ]
// }
```

---

### Test 5: Latest Run Endpoint with Workflow Visibility

**Objective:** Verify GET /api/trips/{tripId}/latest-run returns workflow fields

**Steps:**
1. Use trip from Test 4 (with selected itinerary)
2. Call API: `GET /api/trips/{tripId}/latest-run`

**Expected Results:**
- Response includes full run object
- `executionStage: 'completed'`
- `tasks` array with all status fields
- `status: 'itinerary_selected'`
- `selectedOptionId` present

**API Request (curl):**
```bash
curl http://localhost:3000/api/trips/{YOUR_TRIP_ID}/latest-run
```

**Expected Response:**
```json
{
  "run": {
    "_id": "...",
    "executionStage": "completed",
    "status": "itinerary_selected",
    "selectedOptionId": "opt-2",
    "tasks": [
      {
        "taskId": "task-1",
        "specialist": "transport",
        "status": "completed",
        "startedAt": "...",
        "completedAt": "..."
      }
      // ... more tasks
    ],
    "multipleItineraries": { ... },
    "updatedAt": "..."
  }
}
```

---

### Test 6: Error Handling - Failed Specialist

**Objective:** Verify error handling and task failure tracking

**Steps:**
1. Create new trip
2. Temporarily break a specialist agent (e.g., set invalid OpenAI key or modify specialist code to throw error)
3. Trigger DISPATCH mode

**Expected Results:**
- Failed task marked with `status: 'failed'`
- `error` field populated with error message
- `completedAt` timestamp set
- Run may continue with other specialists (best-effort)
- If all fail: `executionStage: 'error'`, `status: 'error'`

**Verify in MongoDB:**
```javascript
db.runs.findOne({}, { sort: { createdAt: -1 } });
// {
//   tasks: [
//     {
//       taskId: 'task-1',
//       specialist: 'transport',
//       status: 'failed',
//       error: 'OpenAI API error: ...',
//       startedAt: ISODate(...),
//       completedAt: ISODate(...)
//     }
//   ],
//   executionStage: 'error', // if all failed
//   status: 'error'
// }
```

---

### Test 7: Backward Compatibility - Legacy Runs

**Objective:** Verify old runs (without executionStage/task statuses) are normalized

**Setup:**
1. Manually insert a legacy run in MongoDB:
```javascript
db.runs.insertOne({
  tripId: ObjectId('YOUR_TRIP_ID'),
  userMessageId: ObjectId('SOME_MESSAGE_ID'),
  masterOutput: { mode: 'CLARIFY', ... },
  tasks: [
    { taskId: 'task-1', specialist: 'transport', instructions: '...' }
  ],
  specialistOutputs: [ ... ],
  status: 'ok',
  createdAt: new Date()
  // NOTE: No executionStage, no task statuses
});
```

**Steps:**
2. Call `GET /api/trips/{tripId}/latest-run`

**Expected Results:**
- Response includes normalized run
- `executionStage` inferred (e.g., 'completed' if specialistOutputs exist)
- `tasks[].status` inferred (e.g., 'completed' if specialistOutputs match)

**API Response:**
```json
{
  "run": {
    "_id": "...",
    "executionStage": "completed", // inferred
    "tasks": [
      {
        "taskId": "task-1",
        "specialist": "transport",
        "status": "completed", // inferred
        "instructions": "..."
      }
    ],
    "status": "ok"
  }
}
```

---

## Quick Verification Queries

**Check all runs with execution stages:**
```javascript
db.runs.find(
  { executionStage: { $exists: true } },
  { executionStage: 1, status: 1, 'tasks.status': 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(5);
```

**Check tasks with timing:**
```javascript
db.runs.aggregate([
  { $match: { tasks: { $exists: true, $ne: [] } } },
  { $unwind: '$tasks' },
  { $project: {
      taskId: '$tasks.taskId',
      specialist: '$tasks.specialist',
      status: '$tasks.status',
      duration: {
        $subtract: ['$tasks.completedAt', '$tasks.startedAt']
      }
    }
  },
  { $sort: { duration: -1 } }
]);
```

**Check user decisions:**
```javascript
db.trips.find(
  { 'tripContext.userDecisions': { $exists: true, $ne: [] } },
  { 'tripContext.userDecisions': 1 }
);
```

---

## Expected Behavior Summary

| Mode     | executionStage | tasks array | task statuses | multipleItineraries |
|----------|---------------|-------------|---------------|---------------------|
| CLARIFY  | 'clarify'     | null/[]     | N/A           | null                |
| CONFIRM  | 'confirm'     | null/[]     | N/A           | null                |
| DISPATCH | 'dispatch'    | [3]         | 'pending'     | null                |
| RESEARCH | 'research'    | [3]         | 'running' → 'completed' | null      |
| FINALIZE | 'finalize'    | [3]         | 'completed'   | null (building)     |
| COMPLETED| 'completed'   | [3]         | 'completed'   | {options: [...]}    |
| ERROR    | 'error'       | varies      | varies        | null                |

---

## Troubleshooting

**Issue: executionStage not appearing**
- Check you're testing with NEW runs (created after implementation)
- Verify import of `modeToExecutionStage` in chat route
- Check MongoDB for raw document structure

**Issue: Task statuses not updating**
- Ensure atomic updates are reaching MongoDB (check logs)
- Verify taskId matching (positional operator requires exact match)
- Check for MongoDB connection issues

**Issue: Legacy runs not normalized**
- Verify `normalizeLegacyRun` is called in latest-run endpoint
- Check helper function logic for inference rules

**Issue: User decisions not logging**
- Check itineraries endpoint for `$push` to `tripContext.userDecisions`
- Verify tripContext schema includes userDecisions (optional, default [])

---

## Next Steps After Testing

1. **UI Integration**: Use `executionStage` and `tasks[].status` to render timeline/progress UI
2. **Real-time Updates**: Consider WebSocket or polling to show live specialist progress
3. **Analytics**: Track task durations, success rates, user decision patterns
4. **Error Recovery**: Implement retry logic for failed tasks
5. **Monitoring**: Add logging/metrics for stage transitions and task failures

## Files Changed

**Data Models:**
- `lib/db/models.ts` - Run interface with executionStage, enhanced tasks
- `lib/schemas/agent.ts` - TripContext with userDecisions

**Utilities:**
- `lib/utils/runHelpers.ts` - Stage mapping, normalization helpers

**API Endpoints:**
- `app/api/chat/route.ts` - Stage tracking, task status updates
- `app/api/runs/[runId]/route.ts` - Set executionStage on itinerary_selected
- `app/api/trips/[tripId]/latest-run/route.ts` - Normalization, include itinerary_selected
- `app/api/trips/[tripId]/itineraries/route.ts` - User decision logging

**Documentation:**
- `docs/DATA_MODELS.md` - Updated Run schema, workflow visibility section
- `docs/API.md` - Updated endpoint responses with new fields
