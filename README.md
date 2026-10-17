# Daymark

A small, local-first workbench for programmers: capture a task, decide whether it belongs to today, and keep moving. This is POC v0.1 for a single person — there is no server, no account, and no sync.

## Getting started

```bash
npm install
npm run dev        # start the dev server (prints a local URL)
```

No credentials, environment variables, or network access are needed — the app runs entirely in your browser.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Typecheck and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once (Vitest + jsdom) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript check with no output files |
| `npm run lint` | ESLint over the repository |

## What it does

- **Quick capture** — press `N` (or any **New task** button) to save a task with just a title; details, project, and *Add to Today* are optional and never block capture.
- **Task list** — every task, newest first, with quiet status (Todo / In Progress / Done) and project filters, including *No project*.
- **Projects** — optional labels that group tasks. Deleting a project keeps its tasks and makes them unassigned after explicit confirmation.
- **Today** — tasks scheduled for the current local calendar date, with completed work in a quieter *Done today* section. *Add to Today* stores today's local date (`YYYY-MM-DD`); removing clears it, and yesterday's items never silently slide onto today's list.
- **Recoverable actions** — deleting a task shows an *Undo* toast; nothing destructive is ever a side effect of changing status.

## How your data is stored

All data lives in this browser's `localStorage` under the versioned key `daymark:data:v1`, written through a typed repository module that validates and normalizes data on load.

- Tasks and projects persist across refreshes in the **same browser only**. There is no cloud sync, no account, and no backup — clearing site data erases everything.
- If saved data is malformed or from an unsupported schema version, Daymark shows a recovery banner and preserves the raw value in storage untouched until you choose to continue or clear it.
- If a write fails (quota exceeded, storage blocked), a visible banner says so — the app never claims a save succeeded when it didn't.

## Privacy

No analytics, no telemetry, no external API calls. Task and project content never leaves the browser and is not placed in URLs.

## Testing

Automated tests cover the foundations and the core flows: local-date helpers and their independence from UTC, runtime validation of stored data (including corrupt payloads and unsupported versions), repository persistence round-trips and storage-failure outcomes, project deletion that preserves and unassigns tasks, and end-to-end flows (capture across reloads, Today membership, status transitions, filters, delete-with-undo) rendered through jsdom.

## Deferred scope (intentionally not built)

Focus timers, dependencies/priorities/due dates/recurring tasks, notes or daily updates, global search, backup import/export, settings or theme switching, accounts/multi-device/collaboration, comments/mentions/activity feeds, and GitHub/GitLab integrations. The UI contains no placeholders for these.
