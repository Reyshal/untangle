# Untangle ✨

> **Untangle messy thoughts, get actionable, prioritized tasks.**  
> An executive AI task breakdown and smart chronological scheduler built with a warm, distraction-free minimalist aesthetic.

---

## 🌟 Features

### 1. 🧠 Intelligent Brain Dump Decomposer
- **Raw Stream-of-Consciousness Input**: Paste chaotic thoughts, meeting notes, project plans, or voice transcriptions.
- **DeepSeek AI Task Breakdown**: Automatically extracts discrete, single-step tasks starting with imperative action verbs.
- **✨ Context Notes & Motivational Tips**: Each task includes contextual guidance, recommended next steps, and helpful micro-tips.
- **Interactive Draft Preview**: Edit task titles, context notes, priorities, or scheduled times before saving.

### 2. 🌐 Multilingual Output Selection
- **Custom Language Selector**: Choose output language on the fly (`Auto / Same as input`, `Bahasa Indonesia`, `English`, `Español`, `日本語`, `Français`, `Deutsch`, `中文`).

### 3. ⏰ Contextual Date & Time Scheduling Engine
- **Smart Natural Language Inference**: Contextual activity times are automatically scheduled (e.g. *Breakfast* ➔ `08:00 AM`, *Standup* ➔ `09:30 AM`, *Lunch* ➔ `12:30 PM`, *Gym* ➔ `06:00 PM`, *Dinner* ➔ `07:30 PM`).
- **Server-Side Calendar Validation**: Pre-calculates exact 14-day calendar lookup tables and sanitizes dates on the backend to eliminate month-boundary hallucinations.
- **Open-Ended / Vague Task Fallback**: Tasks without specific deadlines cleanly receive `dueDate: null`.

### 4. 📅 Schedule & Timeline View (`/dashboard/schedule`)
- **Preserved Date Filters**: Filter by **Today**, **This Week**, **This Month**, **No Date (Someday)**, **Custom Range**, or **All Tasks**.
- **Chronological Day Grouping**: Automatically groups tasks into sections (`Past / Overdue`, `Today`, `Tomorrow`, `Weekday Date`, `Someday`) with completion progress counters.
- **URL Query Param Sync**: All filters, search queries, and sorting criteria are synced to URL search parameters (`useSearchParams`), preserving state across browser Back/Forward navigation.

### 5. 🔀 1-Click Multi-Column Sorting
- **Interactive Sort Controls**:
  - 🏷️ **Priority**: `High ➔ Low` / `Low ➔ High`
  - 📅 **Date & Time**: `Earliest` / `Latest`
  - 🔤 **Title**: `A ➔ Z` / `Z ➔ A`
- **1-Click Primary Switch**: Click any button to immediately switch primary sorting.
- **Multi-Sort Support**: Hold **`Shift + Click`** to combine multiple criteria with visible hierarchy badges (`1`, `2`, `3`).

### 6. 🎨 Warm Minimalist Design System
- **Custom UI Components**: Custom Date & Time Picker (`react-day-picker` + `date-fns`), Custom Range Picker, Custom Select dropdowns, and Language selector.
- **Dark Mode**: Smooth light/dark theme toggle with persistent storage and system preference detection.
- **Dynamic Brand Favicons**: Scalable vector SVG (`app/icon.svg`), dynamic Retina PNG (`app/icon.tsx`), and Apple touch icon (`app/apple-icon.tsx`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with Warm Minimalist Design System (Terracotta & Amber tokens)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://better-auth.com/) (Self-hosted credentials & session management)
- **AI Engine**: [DeepSeek Chat API](https://platform.deepseek.com/) + Built-in offline heuristic fallback
- **Date & Calendar**: [`date-fns`](https://date-fns.org/) + [`react-day-picker`](https://daypicker.dev/)
- **Icons**: [`lucide-react`](https://lucide.dev/)

---

## 🏗️ Architecture

Untangle follows **Clean Architecture** principles with a strict layered structure:

```
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth routes (/login, /register)
│   ├── (dashboard)/                  # Dashboard routes
│   │   ├── dashboard/                # Main task lists overview
│   │   ├── dashboard/[listId]/       # Single task list detail
│   │   ├── dashboard/new/            # Brain dump AI input
│   │   └── dashboard/schedule/       # Schedule & Timeline calendar view
│   ├── api/                          # REST API Endpoints
│   │   ├── auth/[...all]/            # Better Auth handlers
│   │   ├── breakdown/                # AI task decomposition
│   │   ├── task-lists/               # Task list CRUD
│   │   └── tasks/                    # Task CRUD
│   ├── icon.svg, icon.tsx            # Dynamic brand icons
│   └── globals.css                   # Tailwind 4 & design tokens
├── components/                       # UI & Feature Components
│   ├── ui/                           # Button, Badge, CustomSelect, DateTimePicker, DateRangePicker, LanguageSelect
│   ├── ai-input-card.tsx             # Brain dump textarea with language dropdown
│   ├── navbar.tsx                    # Top navigation with theme toggle & user menu
│   ├── task-draft-preview.tsx        # Editable AI preview before saving
│   ├── task-filter-bar.tsx           # Search, status, priority, and multi-sort bar
│   └── task-item.tsx                 # Interactive task checkbox, notes, edit, & badges
├── lib/
│   ├── ai/                           # DeepSeek integration, calendar prompts, schemas, & date sanitizer
│   ├── auth/                         # Better Auth config & client
│   ├── db/                           # Drizzle schema & PostgreSQL connection
│   ├── repositories/                 # Data access layer (TaskRepository, TaskListRepository)
│   └── services/                     # Business logic (BreakdownService, TaskService, TaskListService)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20+` (or `v24+`)
- **Docker**: For running PostgreSQL locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/untangle.git
cd untangle
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:rootpassword@localhost:5432/untangle"

# Better Auth
BETTER_AUTH_SECRET="your-32-byte-hex-secret"
BETTER_AUTH_URL="http://localhost:3000"

# AI Provider (Optional: falls back to offline heuristic breakdown if omitted)
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

To generate a secure auth secret:
```bash
openssl rand -hex 32
```

### 3. Start PostgreSQL Container
If using Docker:
```bash
docker run -d --name dev-stack-postgres -p 5432:5432 -e POSTGRES_PASSWORD=rootpassword -e POSTGRES_DB=untangle postgres:16-alpine
```

### 4. Push Database Schema
```bash
npx drizzle-kit push
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev` — Starts the Next.js development server with Turbopack.
- `npm run build` — Builds the production bundle and validates all static/dynamic routes.
- `npm run start` — Starts the production server.
- `npm run lint` — Runs ESLint checks.
- `npx drizzle-kit push` — Syncs the TypeScript schema directly to the database.

---

## 📄 License
MIT License. Created with ❤️ for clear thinking and productive execution.
