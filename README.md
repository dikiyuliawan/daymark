# Daymark

A local-first workbench for programmers: capture a task, decide whether it belongs to today, and keep moving. No server, no account, no sync — everything lives in your browser.

The interface follows a modern mobile-app language (floating tab bar, grouped list panels, tinted icon tiles, light/dark themes) adapted to a calm, pine-accented palette.

## Getting started

```bash
npm install
npm run dev
```

No credentials, environment variables, or network access are needed.

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

## Screens

- **Today** — a completion hero (`done / planned`), a 7-day bar chart, your current streak, and grouped panels for planned and completed work.
- **Tasks** — every task grouped into Overdue / Today / Upcoming / No date / Completed, with status chips and a project filter.
- **Projects** — simple labels with tinted tiles; each project has a detail view with inline rename, an emoji/colour editor, and delete. Deleting a project keeps its tasks and unassigns them.
- **Focus** — a Pomodoro-style timer with 15/25/50-minute presets; completed sessions are logged against the day.
- **Search** — reachable from the top bar, matches titles, details, and project names, grouped by project.

## Features

- **Quick capture** — press `N` or the **Add** tab to save a task with just a title. Details, project, due date, priority, icon, and *Add to Today* are all optional.
- **Subtasks** — a checklist inside each task with `done/total` progress on the row.
- **Priority & due date** — flag a task Low/Medium/High and give it a due date; overdue items are flagged in the list.
- **Emoji & colour** — give any task or project a tinted icon tile from a fixed palette.
- **Drag reorder** — reorder tasks with the row grip (mouse) or `Alt+↑` / `Alt+↓` (keyboard).
- **Today membership** — add or remove a task from Today from the row or the editor; the date is the current local calendar day.
- **Light / dark theme** — follows your system by default; the top-bar button cycles system → light → dark and persists the choice.
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

Vite + React + TypeScript, one CSS token layer (system font stack, no webfonts), `localStorage` behind a validating repository, and a small hash router (`#/today`, `#/tasks`, `#/projects/:id`, `#/focus`, `#/search`, `#/unassigned`).

## Tests

```
src/domain/*.test.ts        validation + v1→v2 migration, date math, stats, reorder
src/data/*.test.ts          repository round-trips, migration, storage failures, mutations
src/components/*.test.tsx   Dropdown, SubtasksEditor, EmojiColorPicker, FocusTimer
src/features/app.test.tsx   end-to-end flows: capture, Today, status, projects, delete+undo,
                            subtasks, priority/due date, search, keyboard reorder, theme, focus
```
