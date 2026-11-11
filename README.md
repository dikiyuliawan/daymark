# Daymark

A local-first workbench for programmers: capture a task, decide whether it belongs to today, and keep moving. No server, no account, no sync — everything lives in your browser.

The interface is a phone app in the browser: a day header with a progress bar, hairline-separated task rows with circle checks, a bottom tab bar, a floating add button, and sheets that rise from the foot of the screen. It follows the calm, flat language of Sunsama — one green accent, near-black type, gray meta lines, no cards between the rows — in light and dark.

## Getting started

```bash
npm install
npm run dev
```

No credentials, environment variables, or network access are needed.

Open `http://localhost:5173/?demo=1` for a filled sample workspace (it only seeds an empty browser, so your own data is never overwritten).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript check, no output |
| `npm run lint` | ESLint |
| `node scripts/shots.mjs` | Screenshot every screen at a phone size (design loop) |

## Screens

The bottom bar carries four places, and the round **+** button adds a task from anywhere.

- **Today** — the day as its own header (`Wednesday` / `November 11, 2026`), a done/total badge, a mint progress bar, then the day's tasks in hairline groups: planned work first, completed work below. A seven-day strip and the current streak sit at the foot.
- **Tasks** — every task grouped into Overdue / Today / Upcoming / No date / Completed, with status chips and a project filter in the header row.
- **Projects** — simple labels with tinted tiles; each project has a detail view with inline rename, an icon/colour editor, and delete. Deleting a project keeps its tasks and unassigns them.
- **Focus** — a Pomodoro-style timer with 15/25/50-minute presets; completed sessions are logged against the day.
- **Search** — reachable from the header of every screen, matches titles, details, and project names, grouped by project.

## Features

- **Quick capture** — press `N` or the round **+** button to save a task with just a title. Details, project, due date, priority, icon, and *Add to Today* are all optional.
- **Subtasks** — a checklist inside each task with `done/total` progress on the row.
- **Priority & due date** — flag a task Low/Medium/High and give it a due date; overdue items are flagged in the list.
- **Icon & colour** — give any task or project a tinted tile from a fixed palette.
- **Drag reorder** — reorder tasks with the row grip (mouse) or `Alt+↑` / `Alt+↓` (keyboard).
- **Today membership** — add or remove a task from Today from the row or the editor; the date is the current local calendar day.
- **Light / dark theme** — follows your system by default; the header button cycles system → light → dark and persists the choice.
- **Undo** — deleting a task shows a toast with Undo; nothing destructive happens as a side effect of changing status.

## How data is stored

Everything is kept in `localStorage` under the versioned key `daymark:data:v2`, behind a typed repository that validates and normalizes data on load.

- Data persists across refreshes in the **same browser only** — no cloud sync, no backup. Clearing site data erases everything.
- Data written by the older `daymark:data:v1` key is **migrated automatically** on first load (new fields defaulted; completed tasks get a `completedAt`).
- Malformed data or an unsupported version shows a recovery banner and leaves the stored value untouched rather than silently resetting.
- A failed write (quota or blocked storage) is reported visibly; the app never claims a save succeeded when it didn't.

## Privacy

No analytics, no telemetry, no external requests. Task content never leaves the browser and never appears in URLs.

## Tech

Vite + React + TypeScript, a small hash router (`#/today`, `#/tasks`, `#/projects/:id`, `#/focus`, `#/search`, `#/unassigned`), and a `localStorage` repository behind a validating layer.

The look is one system, in `src/styles/`: `tokens.css` holds the palette, the type ramp, the spacing scale and the radii; `base.css` the shell and the type; `components.css` the buttons, the rows, the sheets and the tab bar. The hover, press and focus layer comes from the design kit and is loaded as plain files from `public/assets/motion/`. `scripts/shots.mjs` drives the app in a real browser and writes one PNG per screen and state, which is how the redesign was compared against its reference.

## Tests

```
src/domain/*.test.ts        validation + v1→v2 migration, date math, stats, reorder
src/data/*.test.ts          repository round-trips, migration, storage failures, mutations
src/components/*.test.tsx   Dropdown, SubtasksEditor, EmojiColorPicker, FocusTimer
src/features/app.test.tsx   end-to-end flows: capture, Today, status, projects, delete+undo,
                            subtasks, priority/due date, search, keyboard reorder, theme, focus
```
