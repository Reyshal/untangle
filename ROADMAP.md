# Untangle — Vision & Product Roadmap

> **"From chaotic thoughts to clear direction."**  
> Untangle is evolving from an AI task decomposition engine into an all-in-one personal workspace for mindful productivity: seamlessly connecting **unstructured thoughts (Scribbles)**, **daily reflections (Journaling)**, **structured action items (Tasks)**, and **real-world commitments (Google Calendar)**.

---

## 🧭 Product Vision & Pillars

```
                     ┌────────────────────────────────┐
                     │          U N T A N G L E       │
                     │    Mindful Personal Workspace  │
                     └───────────────┬────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│   THINK & DUMP   │       │   PLAN & ALIGN   │        │     REFLECT      │
│ • Scribble Notes │  ──►  │ • AI Task Break  │  ──►   │ • Daily Journal  │
│ • Quick Scratch  │       │ • Schedule Grid  │        │ • Mental Clarity │
│ • Stream of Mind │       │ • Google Cal Sync│        │ • Personal Space │
└──────────────────┘       └──────────────────┘        └──────────────────┘
```

1. **Think & Dump (Unstructured)**: Zero-friction scratchpad to write rambling ideas, meeting notes, or random brain dumps without structure.
2. **Plan & Align (Actionable & Chronological)**: AI decomposes chaotic thoughts into actionable tasks, scheduling them around real Google Calendar meetings and commitments.
3. **Reflect & Unwind (Personal)**: A warm, distraction-free journaling space to capture emotional reflections, daily logs, and mindful pauses.

---

## 🗺️ Implementation Phases

### Phase 1: Executive Dashboard & Feature Hub (`/dashboard`)
*Transform the current task-list-only view into a holistic daily command center.*

- [ ] **Greeting & Daily Focus**: Personalized greeting, motivational anchor, and quick-action buttons (*"New Brain Dump"*, *"Quick Task"*, *"Open Calendar"*).
- [ ] **Feature Spaces Navigation Grid**: Visual cards introducing and linking each workspace module:
  - 🧠 **AI Brain Dump**: Deconstruct messy thoughts into prioritized tasks.
  - 📅 **Schedule & Calendar**: Unified chronological agenda and time-blocking.
  - 📋 **Task Lists**: Structured projects and checklists.
  - ✍️ **Scribbles / Scratchpad**: Fast, raw thought-capture *(Phase 4)*.
  - 📖 **Mindful Journal**: Daily reflections and mental check-ins *(Phase 5)*.
- [ ] **Today's Focus & Urgent Tasks**: Surface tasks due today or overdue directly on the dashboard so users don't need to jump to the Schedule page to start their day.
- [ ] **Recent Lists & Quick Progress**: Display recent active task lists with live progress bars.

---

### Phase 2: Mindful Task Lifecycle & Dynamic List Sync
*Distinguish between deleting mistakes and cancelling plans, with automatic AI list re-summarization.*

- [ ] **Schema & Repository Layer**:
  - Add `isCancelled: boolean("is_cancelled").default(false).notNull()` to `tasks` in `lib/db/schema.ts`.
  - Add `cancellationReason: text("cancellation_reason")` (optional/nullable) to `tasks`.
  - Update `TaskRepository` and `TaskService` to support cancellation and reason storage.
  - Run database migration: `npx drizzle-kit push`.
- [ ] **Task Cancellation UX (Friction-Free & Optional Reason)**:
  - **Visual Distinction**: Muted text opacity, subtle strikethrough, and a clean `Cancelled` badge.
  - **Quick Reason Prompt (Optional)**:
    - When clicking `Mark as Cancelled`, show a lightweight popover with quick preset chips (*"Plans changed"*, *"Postponed"*, *"No longer needed"*) and a custom text input.
    - **Never required**: Hitting Enter or clicking "Cancel Task" immediately confirms without forcing text.
    - Hovering or clicking the `Cancelled` badge reveals the reason if one was provided.
    - Reversible via `Restore to To-Do` anytime.
  - **Accurate Metrics**: Exclude cancelled tasks from "Pending" and "Overdue" queues while keeping the historical record intact.
  - **Filter Toggle**: Add *"Show / Hide Cancelled"* in both List and Schedule views.
- [ ] **AI List Re-summarization ("Sync with Children Tasks")**:
  - **Problem**: When tasks are deleted, edited, cancelled, or added manually, the list's original AI title and summary become stale.
  - **Feature (`[ ✨ Re-summarize List ]`)**:
    - Analyzes the current remaining/active tasks in the list.
    - Generates an updated, accurate list title and a crisp 1–2 sentence summary.
    - Presents a quick preview modal so the user can accept, tweak, or discard the updated title & description.


---

### Phase 3: Visual Calendar Views in Schedule (`/dashboard/schedule`)
*Expand the Schedule page from a list-only view into an interactive calendar grid.*

- [ ] **View Switcher (`List` | `Week` | `Month`)**:
  - **List View**: The existing smart list with multi-sort (Priority $\rightarrow$ Date $\rightarrow$ Title), search, and presets.
  - **Month View**: Standard 7-column monthly calendar grid showing date cells, overdue indicators, and daily task pills.
  - **Week View**: Time-blocked weekly layout for precise scheduling throughout the day.
- [ ] **Interactive Task Pills**: Check off tasks directly inside calendar cells, click to edit due dates using `<DateTimePicker />`, or inspect details.
- [ ] **Design System Compliance**: Built using Untangle's Warm Minimalist palette (Terracotta `#c2410c`, Amber `#ea580c`, warm card borders, dark mode).

---

### Phase 4: Real Google Calendar Integration
*Unify fixed calendar commitments with flexible to-do tasks.*

- [ ] **Google OAuth Setup with Better Auth**:
  - Configure Google Social Provider in `lib/auth/auth.ts` with offline access:
    ```ts
    scope: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.readonly", // or .events for 2-way
    ]
    ```
  - Store `accessToken`, `refreshToken`, and expiration in the existing `account` table in `lib/db/schema.ts`.
- [ ] **Google Calendar API Service (`lib/services/google-calendar-service.ts`)**:
  - Secure server-side event fetcher using Google Calendar API (`v3/calendars/primary/events`).
  - Automatic token refresh handler for expired access tokens.
- [ ] **Unified Calendar Event Overlay**:
  - Render Google Calendar meetings (distinct blue/amber badges with start & end times) alongside Untangle tasks in Month and Week views.
- [ ] **Smart "Untangle Around Meetings" (AI Scheduling)**:
  - Feed the user's Google Calendar free/busy slots into the AI task breakdown engine (`lib/ai/breakdown.ts`).
  - Automatically place tasks into genuine open time blocks rather than overlapping with existing meetings.
- [ ] *(Optional)* **Push Tasks to Google Calendar**: 1-click button to export scheduled tasks as Google Calendar events.

---

### Phase 5: Scribble Notes & Instant Scratchpad
*A friction-free home for transient, chaotic thoughts with an agentic AI writing assistant.*

- [ ] **Scribbles Schema & Repository**:
  - `scribbles` table (`id`, `userId`, `title`, `content`, `tags`, `pinned`, `updatedAt`).
- [ ] **Scribbles Canvas UI (`/dashboard/scribbles`)**:
  - Auto-saving lightweight notes board with clean typography and markdown support.
  - Quick scratchpad drawer accessible anywhere via shortcut (`Cmd/Ctrl + K` or floating toggle).
- [ ] **AI Scribble Assistant ("Agentic Note Review")**:
  - **Quick AI Actions**:
    - ✨ **Tidy & Structure**: Formats messy stream-of-consciousness into clean markdown (headers, organized bullet points, bold key terms) while preserving the user's authentic voice.
    - ✍️ **Complete & Elaborate**: Auto-completes half-baked thoughts or brainstorms missing details.
    - 🔍 **Fix & Polish**: Corrects grammar, typos, and awkward phrasing without losing tone.
    - 🎯 **Extract Actionables**: Pulls out implied to-dos and deadlines.
  - **Code-Editor Style Diff / Review Mode**:
    - **Visual Review Modal / Split View**: Highlights proposed changes with green (added) / red (removed) diff styling or side-by-side comparison (*"Original Scribble"* vs. *"AI Polished"*).
    - **Agent Review Controls**:
      - `[✓ Apply Changes]`: Confirms and updates the note.
      - `[✕ Discard]`: Reverts immediately to the untouched original.
      - `[↺ Try Again / Adjust]`: Re-prompts the AI with a different angle (e.g., *"Make it more concise"*, *"Keep bullet points only"*).
    - **Non-Destructive Guarantee**: Original scribbles are never overwritten without explicit user approval.
- [ ] **"Untangle This" Transformation**:
  - One-click trigger that sends the scribble into the AI breakdown engine:
    - Extracts tasks $\rightarrow$ creates a task list or appends to an existing project.
    - Extracts personal reflections $\rightarrow$ archives into the daily journal.

---

### Phase 6: Mindful Journal & Personal Reflections
*A calm, warm sanctuary to process thoughts and log life.*

- [ ] **Journal Schema & Repository**:
  - `journal_entries` table (`id`, `userId`, `entryDate`, `mood`, `content`, `gratitude`, `tags`, `createdAt`).
- [ ] **Distraction-Free Journal Page (`/dashboard/journal`)**:
  - Daily writing prompt, mood/energy picker, and clean typography.
  - Calendar streak & history browser.
- [ ] **Weekly / Monthly Review**:
  - AI-generated gentle summaries of accomplishments, recurring themes, and headspace over the past week.

---

## 🏛️ Technical Architecture & Quality Standards

When implementing any feature from this roadmap, adhere strictly to the repository conventions defined in [`AGENTS.md`](file:///Users/reyshal/codes/personal/projects/untangle/AGENTS.md) and [`ARCHITECTURE.md`](file:///Users/reyshal/codes/personal/projects/untangle/ARCHITECTURE.md):

1. **Clean Layering**:
   ```
   PostgreSQL -> Schema -> Repositories -> Services -> API Routes -> Client Components
   ```
   *Never query Drizzle directly from route handlers or components.*
2. **Session Security**: Always authenticate API routes using `getUser(request)` from `lib/auth/get-user.ts`.
3. **UI Components**: Never use raw HTML selects or unstyled date inputs. Always use `<CustomSelect />`, `<DateTimePicker />`, `<DateRangePicker />`, `<Button />`, and `<Badge />`.
4. **URL State Synchronization**: Keep filter, tab, and calendar date ranges in sync with URL search params whenever appropriate.
5. **Aesthetics**: Warm minimalist palette (`--primary`: terracotta, `--accent`: amber, warm borders).
