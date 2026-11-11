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

- **Today** — the day as its own header (`Wednesday` / `November 11, 2026`), a done/total badge, a mint progress bar, and the day's plan on the right of the date: `3h 45m of 5h`, the planned work against the day's budget. **Plan the day** opens the planning ritual; the day's tasks sit in hairline groups, planned work first, completed work below. A seven-day strip and the current streak sit at the foot, and **End the day** closes it.
- **Tasks** — every task grouped into Overdue / Today / Upcoming / No date / Completed, with status chips and a project filter in the header row.
- **Projects** — simple labels with tinted tiles; each project has a detail view with inline rename, an icon/colour editor, and delete. Deleting a project keeps its tasks and unassigns them.
- **Focus** — a Pomodoro-style timer with 15/25/50-minute presets; completed sessions are logged against the day.
- **Search** — reachable from the header of every screen, matches titles, details, and project names, grouped by project.
- **The rituals** — two flows that bracket the day. *Plan the day* asks three questions: what you left behind yesterday, what you want to pull in from your inbox, and whether the plan fits the budget (with a way to push a task to tomorrow). *End the day* shows what you finished, what is left (it rolls into tomorrow), and asks for one line about the day.

## Features

- **Quick capture** — press `N` or the round **+** button to save a task with just a title. Details, project, due date, priority, icon, and *Add to Today* are all optional.
- **Subtasks** — a checklist inside each task with `done/total` progress on the row.
- **Priority & due date** — flag a task Low/Medium/High and give it a due date; overdue items are flagged in the list.
- **Lengths and a daily budget** — give a task a planned length (15m to 2h); it shows as a clock on its row, `1:30`, and counts against the day's budget. The budget is set from the day's plan: tap `3h 45m of 5h` and pick a day (one to eight hours, or type it). Over the budget, the figure turns amber.
- **Rituals** — give a task a repeat rule (every day, every weekday, every week) and it is laid down fresh each morning, with its steps reset and its own place in the day. The ritual itself lives under **Rituals** on the Tasks screen, so you can edit what tomorrow will look like.
- **A note for the day** — the shutdown ritual keeps one line a day. It shows on the Today screen once the day is closed.
- **Icon & colour** — give any task or project a tinted tile from a fixed palette.
- **Drag reorder** — reorder tasks with the row grip (mouse) or `Alt+↑` / `Alt+↓` (keyboard).
- **Today membership** — add or remove a task from Today from the row or the editor; the date is the current local calendar day.
- **Light / dark theme** — follows your system by default; the header button cycles system → light → dark and persists the choice.
- **Undo** — deleting a task shows a toast with Undo; nothing destructive happens as a side effect of changing status.

## How data is stored

Everything is kept in `localStorage` under the versioned key `daymark:data:v4`, behind a typed repository that validates and normalizes data on load.

- Data persists across refreshes in the **same browser only** — no cloud sync, no backup. Clearing site data erases everything.
- Data written by the older `daymark:data:v3`, `:v2` or `:v1` keys is **migrated automatically** on first load and re-saved under the current key: v3 gains the repeat rules and the daily notes, v2 gains task lengths and the daily budget, v1 also gains subtasks, priority, due dates, emoji and colour (and completed tasks get a `completedAt`).
- Malformed data or an unsupported version shows a recovery banner and leaves the stored value untouched rather than silently resetting.
- A failed write (quota or blocked storage) is reported visibly; the app never claims a save succeeded when it didn't.

## Privacy

No analytics, no telemetry, no external requests. Task content never leaves the browser and never appears in URLs.

## Tech

Vite + React + TypeScript, a small hash router (`#/today`, `#/tasks`, `#/projects/:id`, `#/focus`, `#/search`, `#/unassigned`), and a `localStorage` repository behind a validating layer.

The look is one system, in `src/styles/`: `tokens.css` holds the palette, the type ramp, the spacing scale and the radii; `base.css` the shell and the type; `components.css` the buttons, the rows, the sheets and the tab bar. The hover, press and focus layer comes from the design kit and is loaded as plain files from `public/assets/motion/`. `scripts/shots.mjs` drives the app in a real browser and writes one PNG per screen and state, which is how the redesign was compared against its reference.

## Tests

```
src/domain/*.test.ts        validation + v1/v2/v3 migration, date math, stats, durations, rituals, reorder
src/data/*.test.ts          repository round-trips, migration, storage failures, mutations
src/components/*.test.tsx   Dropdown, SubtasksEditor, EmojiColorPicker, FocusTimer
src/features/app.test.tsx   end-to-end flows: capture, Today, status, projects, delete+undo,
                            subtasks, priority/due date, lengths and budget, rituals, the
                            planning and shutdown rituals, search, reorder, theme, focus
```
