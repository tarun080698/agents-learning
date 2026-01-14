# Travel Agentic Planner - Technical Documentation

## Overview

Travel Agentic Planner is an AI-powered travel planning application that uses a multi-agent architecture to help users create personalized trip itineraries. The system uses OpenAI's GPT models with structured outputs to orchestrate a conversation that gathers trip requirements and generates multiple itinerary options.

**Tech Stack:**
- **Framework**: Next.js 16.1.1 (App Router, React 19)
- **Database**: MongoDB (using native driver, not Mongoose)
- **AI**: OpenAI API (gpt-4o-mini with structured outputs)
- **Validation**: Zod schemas
- **Styling**: TailwindCSS v4 + shadcn/ui components
- **Language**: TypeScript 5

## Documentation Structure

This documentation is organized into focused chapters for easy navigation:

1. **[Quick Start Guide](./QUICKSTART.md)** - Get up and running quickly
2. **[API Reference](./API.md)** - Complete API endpoint documentation
3. **[Data Models](./DATA_MODELS.md)** - MongoDB schemas and data structures
4. **[Agent Architecture](./AGENT_ARCHITECTURE.md)** - AI agent system design and flow
5. **[Features Guide](./FEATURES.md)** - Supported features and capabilities
6. **[UI Components](./UI.md)** - Frontend component overview

## System Architecture

### High-Level Flow

```
User Input → Frontend → API Routes → Master Agent → Specialist Agents → AI Generation → Response
                                                                                             ↓
MongoDB ← Trip Context Updated ← Structured Output Validated ← OpenAI Response ← ←← ←← ←← ←←
```

### Key Components

**Frontend (React/Next.js)**
- User authentication via username
- Trip management (create, select, delete)
- Real-time chat interface
- Itinerary selection and viewing
- Trace panel for debugging agent outputs

**API Layer (Next.js API Routes)**
- RESTful endpoints for users, trips, messages, chat
- Request validation with Zod
- MongoDB integration
- Error handling and logging

**Agent System (AI Orchestration)**
- **Master Agent**: Orchestrates conversation, manages trip context
- **Specialist Agents**: Transport, Stay, Food recommendations
- **Modes**: CLARIFY → CONFIRM → DISPATCH → FINALIZE
- Structured outputs validated with Zod schemas

**Database (MongoDB)**
- 4 collections: users, trips, messages, runs
- Embedded documents for trip context and itineraries
- Indexed for performance

## Core Features

✅ **Multi-User Support** - Username-based authentication
✅ **Trip Management** - Create, view, delete multiple trips
✅ **AI-Powered Planning** - Intelligent conversation to gather requirements
✅ **Question Ledger** - Tracks asked/answered questions to avoid repetition
✅ **Specialist Agents** - Dedicated agents for transport, accommodation, dining
✅ **Multiple Itineraries** - Generates 2-3 diverse options (budget/mid/luxury)
✅ **Itinerary Selection** - Save and view selected itineraries
✅ **Trip Metadata** - Dynamic titles, progress tracking, date management
✅ **Selection Persistence** - Prevents re-showing selection UI after refresh
✅ **Trace Panel** - Debug view for agent outputs and trip context

## Quick Reference

### Environment Variables

```bash
MONGODB_URI=mongodb+srv://...          # Required
OPENAI_API_KEY=sk-...                  # Required
OPENAI_MODEL=gpt-4o-mini              # Optional (default: gpt-4o-mini)
MOCK_OPENAI=false                      # Optional (for testing)
```

### Development Commands

```bash
pnpm install                           # Install dependencies
pnpm dev                               # Start dev server (http://localhost:3000)
pnpm build                             # Build for production
pnpm start                             # Run production server
pnpm lint                              # Run ESLint
```

### Project Structure

```
agents-learning/
├── app/                               # Next.js App Router
│   ├── api/                          # API routes
│   │   ├── chat/                     # Main chat endpoint
│   │   ├── users/                    # User management
│   │   ├── trips/                    # Trip CRUD
│   │   │   └── [tripId]/
│   │   │       ├── route.ts          # DELETE, PATCH trip
│   │   │       ├── itineraries/      # Save/get/delete itineraries
│   │   │       └── latest-run/       # Get latest run data
│   │   ├── messages/                 # Message CRUD
│   │   └── runs/                     # Run updates
│   │       └── [runId]/route.ts
│   ├── page.tsx                      # Main application UI
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── components/                        # React components
│   ├── chat-panel.tsx                # Chat interface
│   ├── trips-panel.tsx               # Trip list
│   ├── itinerary-panel.tsx           # Itinerary display
│   ├── trace-panel.tsx               # Debug trace view
│   ├── username-gate.tsx             # Login screen
│   └── ui/                           # shadcn/ui components
├── lib/                              # Core logic
│   ├── agents/                       # AI agent implementations
│   │   ├── master.ts                 # Master orchestrator
│   │   ├── transport.ts              # Transport specialist
│   │   ├── stay.ts                   # Accommodation specialist
│   │   └── food.ts                   # Dining specialist
│   ├── db/                           # Database layer
│   │   ├── mongo.ts                  # MongoDB connection
│   │   └── models.ts                 # Type definitions & collections
│   ├── schemas/                      # Zod validation schemas
│   │   ├── agent.ts                  # Agent output schemas
│   │   ├── user.ts                   # User schemas
│   │   ├── trip.ts                   # Trip schemas
│   │   └── message.ts                # Message schemas
│   └── utils/                        # Utility functions
│       ├── contextFormatter.ts       # Format conversation context
│       ├── questionLedger.ts         # Question tracking logic
│       ├── itineraryExport.ts        # Itinerary formatting
│       └── tripMetadata.ts           # Trip metadata generation
└── docs/                             # Documentation (you are here!)
```

## Key Concepts

### Trip Context
A structured JSON object that accumulates trip planning details through conversation:
- Origin, destinations, date range
- Travelers count, budget level
- Preferences (pace, interests, dietary, hotel style)
- Constraints (must-do, avoid)
- Decisions (confirmed, pending)
- Question ledger (tracking asked/answered questions)

### Agent Modes
The Master Agent operates in 4 sequential modes:

1. **CLARIFY** - Gather missing trip information (ask 1-7 questions)
2. **CONFIRM** - Validate gathered information with user (optional 1 question)
3. **DISPATCH** - Delegate to specialist agents (transport, stay, food)
4. **FINALIZE** - Merge specialist outputs into 2-3 diverse itinerary options

### Runs
A "run" represents one complete agent execution cycle, storing:
- User message that triggered the run
- Master agent output (mode, questions, trip context)
- Dispatch tasks and specialist outputs
- Final merged itineraries
- Status (ok, completed, itinerary_selected, error)

### Itinerary Options
When FINALIZE mode completes, the system generates 2-3 distinctly different itineraries:
- **Diversity dimensions**: budget (economy/mid/luxury), pace (relaxed/moderate/packed), focus (adventure/culture/relaxation)
- Each option includes: title, description, highlights, estimated cost, daily breakdown, tags
- User selects one option which is saved to trip.savedItineraries

## Development Philosophy

- **Type Safety First**: Zod schemas validate all inputs/outputs; TypeScript enforces types
- **Structured Outputs**: AI responses are JSON validated against Zod schemas
- **Conversation Memory**: Recent messages (50) + trip context provide continuity
- **Idempotency**: Question ledger prevents asking same questions repeatedly
- **Error Recovery**: Validation failures trigger helpful error messages
- **Progressive Enhancement**: Mobile-first responsive design

## Next Steps

- **For Setup**: Read [Quick Start Guide](./QUICKSTART.md)
- **For API Integration**: See [API Reference](./API.md)
- **For Agent Development**: Study [Agent Architecture](./AGENT_ARCHITECTURE.md)
- **For Database Work**: Review [Data Models](./DATA_MODELS.md)
- **For Features**: Explore [Features Guide](./FEATURES.md)

---

**Version**: 1.0.0 (Current Production State)
**Last Updated**: January 14, 2026
**Contributors**: Development Team
