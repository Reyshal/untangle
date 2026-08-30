<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Untangle — AI Agent Developer Guide & Architecture Context

> **Executive AI task breakdown and smart chronological scheduler built with a warm, distraction-free minimalist aesthetic.**

---

## 1. 🛠️ Tech Stack & Key Dependencies

- **Framework**: Next.js 16.3+ (App Router, Turbopack) + React 19
- **Styling**: Tailwind CSS v4 (configured in `app/globals.css` with CSS variables)
- **Database**: PostgreSQL (Docker container `dev-stack-postgres`, port `5432`, DB `untangle`)
- **ORM**: Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- **Authentication**: Better Auth v1.7+ (`better-auth`, self-hosted with password hashing & session cookies)
- **AI Engine**: DeepSeek Chat API (`deepseek-chat`) with offline heuristic fallback
- **Date & Calendar**: `date-fns` + `react-day-picker`
- **Icons**: `lucide-react`

---

## 2. 🏛️ Clean Architecture & Layer Responsibilities

```
Database (PostgreSQL)
  └─ Schema (`lib/db/schema.ts`)
       └─ Repositories (`lib/repositories/`) — Direct Drizzle queries
            └─ Services (`lib/services/`) — Business logic & validation
                 └─ API Routes (`app/api/`) — HTTP request / response parsing
                      └─ Client Components (`components/`, `app/`) — Interactive UI
```

### Critical Architecture Rules:
1. **Never query Drizzle directly from API route handlers or UI components**. Always route through Repository (`lib/repositories/`) and Service (`lib/services/`) layers.
2. **Session Security**: Always use `getUser(request)` from `lib/auth/get-user.ts` in API routes to authenticate requests via session cookies.
3. **Database Schema Migrations**: After editing `lib/db/schema.ts`, apply changes with:
   ```bash
   npx drizzle-kit push
   ```
4. **Better Auth Account Table**: Must retain `issuer: text("issuer")` in `lib/db/schema.ts` for Better Auth 1.7+ compatibility.

---

## 3. 🎨 Design System & Custom UI Component Rules

Untangle follows a **Warm Minimalist Aesthetic** (Terracotta primary, Amber accent, warm card borders, dark mode).

### Component Directory (`components/ui/`):
- **Date & Time Picker**: Use `<DateTimePicker />` (`components/ui/date-time-picker.tsx`).
- **Date Range Picker**: Use `<DateRangePicker />` (`components/ui/date-range-picker.tsx`).
- **Dropdown / Select**: Use `<CustomSelect />` (`components/ui/custom-select.tsx`). **NEVER** use raw browser `<select>` tags.
- **Language Selector**: Use `<LanguageSelect />` (`components/ui/language-select.tsx`).
- **Buttons & Badges**: Use `<Button />` (`components/ui/button.tsx`) and `<Badge />` (`components/ui/badge.tsx`).

### Design Tokens (`app/globals.css`):
- `--primary`: `#c2410c` (Light) / `#ea580c` (Dark)
- `--background`: `#faf8f5` (Light) / `#141210` (Dark)
- `--card`: `#ffffff` (Light) / `#1f1c19` (Dark)
- `--border`: `#e7e2d9` (Light) / `#2e2b26` (Dark)

---

## 4. 🧠 AI Task Breakdown & Date Scheduling Engine

### Files:
- [lib/ai/breakdown.ts](file:///home/reyshal/Codes/Projects/Personal/untangle/lib/ai/breakdown.ts) — AI prompt engineering, calendar reference generator, & date sanitizer.
- [lib/ai/deepseek.ts](file:///home/reyshal/Codes/Projects/Personal/untangle/lib/ai/deepseek.ts) — DeepSeek API client & offline heuristic generator.
- [lib/ai/schemas.ts](file:///home/reyshal/Codes/Projects/Personal/untangle/lib/ai/schemas.ts) — Zod schemas for AI breakdown validation.

### Date Rules:
1. **Never let LLMs perform raw mental date arithmetic**: Always pass `getCalendarReferenceTable()` into the system prompt to supply an exact 14-day lookup table.
2. **Server-Side Validation**: All AI responses pass through `sanitizeAndValidateTaskDates()` to enforce exact calendar boundaries (e.g. 31-day vs 30-day months, leap years, relative tokens like *tomorrow*, *besok*, *lusa*).
3. **Vague / Undated Tasks**: If no deadline is mentioned, `dueDate` MUST be `null`.

---

## 5. 📅 Schedule & Timeline (`app/(dashboard)/dashboard/schedule/page.tsx`)

### Key Features:
- **Date Presets**: `today`, `week`, `month`, `someday`, `custom`, `all`.
- **URL Query Param Sync**: Filter and sort states are derived directly from `searchParams` (`?filter=...&priority=...&status=...&sort=...&q=...`).
- **1-Click Smart Sorting**: Click **Priority**, **Date & Time**, or **Title** to immediately switch the primary sort. Hold **`Shift + Click`** to combine multi-sort criteria (`1`, `2`, `3`).
- **Next.js Suspense**: Always wrap pages reading `useSearchParams()` in `<Suspense>`.

---

## 6. ⚡ Next.js 16 & React 19 Conventions

- **Dynamic Route Params**: Unwrapped using `const { listId } = React.use(params)`.
- **No Synchronous setState in Effects**: Derive state directly from URL `searchParams` or async loader functions with `ignore` cleanup flags.
- **Turbopack Dev & Build**: Run with `npm run dev` and test with `npm run build`.

---

## 💻 Essential Developer Commands

```bash
# Start development server
npm run dev

# Run TypeScript & ESLint verification
npm run lint

# Production build test
npm run build

# Push database schema changes
npx drizzle-kit push
```
