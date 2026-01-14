# UI Components

Overview of frontend components and structure (kept minimal as UI will be redesigned).

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Main Application](#main-application)
3. [Core Components](#core-components)
4. [Shared UI Components](#shared-ui-components)
5. [State Management](#state-management)
6. [Styling System](#styling-system)

---

## Component Architecture

### Technology Stack

- **Framework:** React 19 (Next.js 16 App Router)
- **Language:** TypeScript 5
- **Styling:** TailwindCSS v4
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **State:** React Hooks (useState, useEffect)
- **Responsive:** CSS media queries + TailwindCSS breakpoints

### Component Hierarchy

```
app/page.tsx (Main Application)
├── UsernameGate (authentication)
└── Main Layout
    ├── Mobile Header (mobile only)
    ├── Trips Panel (desktop sidebar / mobile drawer)
    ├── Chat Panel (main conversation area)
    ├── Itinerary Panel (active itinerary display)
    ├── Trace Panel (debug view, conditional)
    └── Saved Itineraries Drawer (slide-out)
```

---

## Main Application

**File:** `app/page.tsx`

**Purpose:** Root component managing entire application state and layout.

**Key State:**
```typescript
// User
const [userId, setUserId] = useState<string | null>(null);
const [isLoggedIn, setIsLoggedIn] = useState(false);

// Trips
const [trips, setTrips] = useState<Trip[]>([]);
const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

// Messages
const [messages, setMessages] = useState<Message[]>([]);

// Trip Context & Agent Data
const [tripContext, setTripContext] = useState<any>(null);
const [masterOutput, setMasterOutput] = useState<any>(null);
const [tasks, setTasks] = useState<any[]>([]);
const [specialistOutputs, setSpecialistOutputs] = useState<any[]>([]);

// UI State
const [loading, setLoading] = useState(false);
const [mobileView, setMobileView] = useState<'trips' | 'chat' | 'itinerary'>('trips');
const [showTracePanel, setShowTracePanel] = useState(false);
const [itineraryDrawerOpen, setItineraryDrawerOpen] = useState(false);
```

**Key Functions:**
- `loadTrips()` - Fetch user's trips
- `loadMessages()` - Fetch trip messages
- `loadTripContext()` - Load trip context and agent data
- `handleSendMessage()` - Send chat message
- `handleSelectItinerary()` - Save selected itinerary
- `handleDeleteTrip()` - Delete trip with confirmation

**Layout Logic:**
- Mobile: Single column with view switcher
- Tablet: Two columns (chat + itinerary)
- Desktop: Three columns (sidebar + chat + itinerary/trace)

---

## Core Components

### Username Gate

**File:** `components/username-gate.tsx`

**Purpose:** Initial login screen for username-based authentication.

**Features:**
- Input field for username
- Checks if user exists via API
- Creates new user if not found
- Stores userId in localStorage
- Emits `onLogin` event with userId

**Usage:**
```tsx
{!isLoggedIn && (
  <UsernameGate onLogin={(id) => {
    setUserId(id);
    setIsLoggedIn(true);
  }} />
)}
```

---

### Trips Panel

**File:** `components/trips-panel.tsx`

**Purpose:** Display list of user's trips with metadata.

**Features:**
- Trip cards with title, dates, progress
- New trip button
- Delete trip button (with confirmation)
- Select trip on click
- Sorted by most recent (updatedAt)

**Key Elements:**
- Progress bar (0-100%)
- Dynamic titles ("NYC to Boston", "Trip to Boston")
- Date display ("Feb 15-18" or "Created Jan 14")
- Delete icon (trash)

**Props:**
```typescript
{
  trips: Trip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string) => void;
  onNewTrip: () => void;
  onDeleteTrip: (id: string) => void;
}
```

---

### Chat Panel

**File:** `components/chat-panel.tsx`

**Purpose:** Main conversation interface between user and AI.

**Features:**
- Message list (scrollable)
- Message bubbles (user vs agent vs system)
- Agent badges (Master, TransportAgent, etc.)
- Input field with send button
- "View Plans" button (if saved itineraries exist)
- Itinerary selection UI (when options available)

**Message Types:**
1. **User Messages:** Right-aligned, blue background
2. **Master Messages:** Left-aligned, gray background, "🤖 Master" badge
3. **Specialist Messages:** Left-aligned, purple background, agent-specific badge
4. **System Messages:** Left-aligned, yellow background, "📢 System" badge

**Special UI:**
- **Itinerary Selection Cards:** When FINALIZE mode shows options
  - Title, description, highlights, cost
  - "Select This Option" button
  - Tags (Budget-Friendly, Luxury, etc.)
  - Expandable daily itinerary preview

**Props:**
```typescript
{
  messages: Message[];
  onSendMessage: (message: string) => void;
  onSelectItinerary: (option: ItineraryOption) => void;
  onShowPlans: () => void;
  loading: boolean;
}
```

---

### Itinerary Panel

**File:** `components/itinerary-panel.tsx`

**Purpose:** Display active itinerary options or selected itinerary.

**Features:**
- Shows trip context summary
- Displays itinerary options (if available)
- Expandable daily breakdown
- Alternative options accordion
- Conditional display (only shown when data exists)

**Content Structure:**
```
Itinerary Panel
├── Option Title & Description
├── Highlights (bullet list)
├── Estimated Cost
├── Tags
├── Daily Breakdown (accordion)
│   ├── Day 1
│   │   ├── Transport
│   │   ├── Accommodation
│   │   ├── Meals
│   │   └── Activities
│   ├── Day 2
│   └── Day 3
└── Alternative Options (accordion)
    ├── Transport alternatives
    ├── Stay alternatives
    └── Dining alternatives
```

**Props:**
```typescript
{
  itinerary: ItineraryOption | null;
  tripContext: TripContext | null;
}
```

---

### Trace Panel

**File:** `components/trace-panel.tsx`

**Purpose:** Debug view for developers to inspect agent execution.

**Features:**
- Trip context JSON viewer
- Master output display (mode, questions, summary)
- Specialist tasks list
- Specialist outputs display
- Formatted JSON with syntax highlighting

**Sections:**
1. **Trip Context:** Expandable JSON
2. **Master Output:** Mode, questions, nextStep
3. **Specialist Tasks:** Task list with instructions
4. **Specialist Outputs:** Recommendations, assumptions, risks

**Props:**
```typescript
{
  tripContext: TripContext | null;
  masterOutput: MasterOutput | null;
  tasks: Task[];
  specialistOutputs: SpecialistOutput[];
}
```

---

### Saved Itineraries Drawer

**File:** `components/saved-itineraries-drawer.tsx`

**Purpose:** View and manage saved itineraries for current trip.

**Features:**
- Slide-out drawer from right
- List of saved itineraries (max 20)
- Accordion view for each itinerary
- Delete button for each
- Saved date display

**Content:**
```
Drawer Header: "Saved Itineraries"
├── No itineraries message (if empty)
└── Itinerary List
    ├── Itinerary 1 (accordion)
    │   ├── Header: Name + Delete button
    │   └── Content: Full itinerary details
    ├── Itinerary 2
    └── Itinerary 3
```

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}
```

---

### Mobile Header

**File:** `components/mobile-header.tsx`

**Purpose:** Header bar for mobile view with username and actions.

**Features:**
- Username display
- "View Plans" button
- View switcher tabs (Trips | Chat | Itinerary)
- Responsive visibility (mobile only)

**Props:**
```typescript
{
  username: string;
  currentView: 'trips' | 'chat' | 'itinerary';
  onViewChange: (view) => void;
  onShowPlans: () => void;
}
```

---

### Itinerary Selection

**File:** `components/itinerary-selection.tsx`

**Purpose:** UI for selecting one of multiple itinerary options.

**Features:**
- Display 2-3 itinerary option cards
- Each card shows: title, description, highlights, cost, tags
- "Select This Option" button
- Expandable daily preview
- Comparison note at bottom

**Props:**
```typescript
{
  options: ItineraryOption[];
  onSelect: (option: ItineraryOption) => void;
  comparisonNote?: string;
}
```

---

## Shared UI Components

**Location:** `components/ui/`

shadcn/ui components (Radix UI primitives):

- **`button.tsx`** - Button with variants (default, outline, ghost)
- **`card.tsx`** - Card container with header, content, footer
- **`input.tsx`** - Text input field
- **`scroll-area.tsx`** - Custom scrollbar container
- **`tabs.tsx`** - Tab navigation (mobile view switcher)
- **`accordion.tsx`** - Expandable sections (daily itinerary, alternatives)
- **`badge.tsx`** - Small labels (agent names, tags)
- **`separator.tsx`** - Horizontal divider line
- **`drawer.tsx`** - Slide-out drawer (trips, saved itineraries)

**Usage Example:**
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>Trip Title</CardHeader>
  <CardContent>
    Trip details...
    <Button onClick={handleClick}>Select</Button>
  </CardContent>
</Card>
```

---

## State Management

### Strategy

**Local State Only** - No external state management library (Redux, Zustand, etc.)

**State Location:**
- **Global State:** `app/page.tsx` (userId, trips, messages, etc.)
- **Component State:** Individual components (input values, open/closed state)
- **Persistence:** `localStorage` for userId and username

**State Flow:**
```
User Action
    ↓
Event Handler (in page.tsx)
    ↓
API Call
    ↓
Update State (setState)
    ↓
Re-render
    ↓
Props passed to child components
```

### Key Patterns

**Loading States:**
```typescript
const [loading, setLoading] = useState(false);

async function fetchData() {
  setLoading(true);
  try {
    const data = await apiCall();
    setData(data);
  } finally {
    setLoading(false);
  }
}
```

**Dependent State Updates:**
```typescript
useEffect(() => {
  if (selectedTripId) {
    loadMessages(selectedTripId);
    loadTripContext(selectedTripId);
  }
}, [selectedTripId]);
```

**Conditional Rendering:**
```typescript
{!isLoggedIn && <UsernameGate />}
{isLoggedIn && (
  <div>
    {isMobile ? <MobileView /> : <DesktopView />}
  </div>
)}
```

---

## Styling System

### TailwindCSS

**Configuration:** `tailwind.config.ts`

**Theme:**
- Colors: CSS variables in `globals.css`
- Dark mode: Not currently implemented
- Fonts: System fonts (sans-serif stack)

**Common Patterns:**
```tsx
// Responsive spacing
<div className="gap-3 md:gap-5" />  // 12px mobile, 20px desktop

// Responsive layout
<div className="flex flex-col md:flex-row" />

// Responsive text
<h1 className="text-base md:text-lg" />

// Conditional classes
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)} />
```

### Global Styles

**File:** `app/globals.css`

**Includes:**
- TailwindCSS base styles
- CSS variables for colors
- Root font size and family
- Scrollbar customization

**Key Variables:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --accent: 240 4.8% 95.9%;
  /* ... more color variables */
}
```

### Component Styling

**Pattern:** Utility-first with `cn()` helper for conditional classes

**Example:**
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "rounded-lg border p-4",  // Base styles
  selected && "border-primary bg-accent",  // Conditional
  "hover:shadow-md transition-shadow"  // Interactive
)} />
```

### Responsive Design

**Breakpoints:**
- `sm:` 640px
- `md:` 768px (tablet)
- `lg:` 1024px (desktop)
- `xl:` 1280px

**Mobile-First Approach:**
```tsx
// Base styles apply to mobile
// Add md: prefix for tablet+
// Add lg: prefix for desktop+
<div className="w-full md:w-1/2 lg:w-1/3" />
```

---

## Component Best Practices

### Do's:
- ✅ Use TypeScript for all components
- ✅ Extract reusable logic into custom hooks
- ✅ Keep components focused (single responsibility)
- ✅ Use semantic HTML elements
- ✅ Handle loading and error states
- ✅ Add proper accessibility attributes (aria-*)
- ✅ Test on mobile, tablet, desktop

### Don'ts:
- ❌ Don't mix API calls in components (keep in page.tsx)
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't store sensitive data in component state
- ❌ Don't forget error boundaries for production
- ❌ Don't skip loading states (causes poor UX)

---

## Future UI Considerations

**Planned Redesign Areas:**
1. Visual design system (colors, typography, spacing)
2. Dark mode support
3. Animations and transitions
4. Improved mobile navigation
5. Better itinerary visualization
6. Interactive maps for destinations
7. Photo uploads for preferences
8. Calendar view for dates
9. Budget calculator
10. Collaborative features UI

**Technology Upgrades:**
- Consider Framer Motion for animations
- Consider Mapbox/Google Maps integration
- Consider date picker library (react-day-picker)
- Consider chart library for budget visualization

---

**For more information:**
- [Features Guide](./FEATURES.md) - What UI components enable
- [API Reference](./API.md) - API integration patterns
- [Agent Architecture](./AGENT_ARCHITECTURE.md) - How AI responses are displayed
