# Daymark — Product & Implementation Design

> A small, local-first workbench for programmers: capture a task, decide whether it belongs to today, and keep moving. POC v0.1 is deliberately useful for one person before it grows toward team collaboration.

## 1. Product brief

Daymark helps a programmer keep a short, trustworthy list of work without the overhead of a full project-management suite. The first version is a focused solo POC, not a collaboration product or a mockup of one.

**Core loop:** capture a task → optionally assign a project → optionally put it on Today → change its status as work progresses.

The product should feel calm, direct, and credible during everyday use. It should open quickly, work offline after loading, and retain changes in the current browser. Do not imply cloud sync or shared access.

### Product principles

1. **Capture before categorizing.** A task can be saved with only a title. Project assignment is optional and never blocks capture.
2. **Make Today useful, not ceremonial.** Today is a practical list of tasks the user chose to do today; it is not a dashboard or a productivity scorecard.
3. **Keep the workflow small.** Three statuses and a simple task list are enough for this POC. Avoid speculative configuration.
4. **Local means local.** Explain that data stays in this browser; do not show fake sync, team, or integration states.
5. **Quiet polish over decoration.** Use deliberate type, spacing, and hierarchy rather than gradients, oversized slogans, or card-heavy layouts.

## 2. User and jobs to be done

**Primary user:** a solo software developer who wants to collect work, keep a few projects understandable, and see what they intend to work on today.

**Primary jobs**

- Capture a task in seconds without deciding where it belongs first.
- Keep tasks in one simple list and optionally group them by project.
- Mark selected tasks for today and see their current status at a glance.
- Move tasks through Todo, In Progress, and Done.
- Close and reopen the app without losing local work.

## 3. POC v0.1 scope

### In scope

- **Quick capture:** create a task from any main view using a short form. Title is required; details and project are optional. Capture must not require leaving the current view.
- **Task list:** browse, create, edit, complete, and delete tasks. Provide lightweight status and project filters; no board or configurable views.
- **Optional projects:** create, rename, and delete simple project labels. Tasks may remain unassigned. Deleting a project must not delete its tasks; unassign affected tasks after an explicit confirmation.
- **Today view:** add or remove a task from Today. Show the selected local calendar date and tasks scheduled for that date; completed tasks remain visible in a quieter completed section.
- **Statuses:** `Todo`, `In Progress`, and `Done`. A new task starts as `Todo`.
- **Local persistence:** store data in the browser, restore it on reload, and handle storage errors visibly.
- Responsive, accessible UI with useful empty, error, and confirmation states.

### Explicitly deferred

Do not build or expose controls for:

- Focus timer or focus sessions.
- Dependencies, blockers, priorities, due dates, recurring tasks, or calendar sync.
- Standalone notes or daily updates.
- Global search.
- Backup import/export or settings screens.
- Theme settings or a theme switcher.
- Accounts, authentication, cloud sync, multi-device access, or collaboration.
- Comments, mentions, roles, permissions, team dashboards, or activity feeds.
- GitHub/GitLab integrations, notifications, AI features, or external API data.

If a product or implementation decision conflicts with the list above, prefer the smallest working version that preserves the approved scope. Do not add disabled-looking placeholders for deferred features.

## 4. Information architecture and screens

Use a small single-page-app experience with three primary destinations:

- `/today` — default landing page; tasks intentionally scheduled for the current local date.
- `/tasks` — the complete task list, including tasks not scheduled for today.
- `/projects` — a compact project list; selecting a project opens its filtered task list, e.g. `/projects/:projectId`.

### Shared application shell

- Desktop: a narrow, persistent left sidebar with the Daymark wordmark, the three destinations, and a clear **New task** action. Keep navigation labels visible; icons are optional and secondary.
- Main area: a modest page heading, one line of contextual description when useful, and a readable content width. Avoid a global search field or utility toolbar.
- Task create/edit: use a compact dialog or side panel. Keep task title first and immediately editable. Do not navigate away for a quick change.
- Feedback: use inline validation for form errors and a restrained toast for saved/deleted actions. Offer Undo after deletion where practical.
- Mobile: replace the sidebar with a compact top bar and a three-destination bottom navigation. Keep **New task** reachable without obscuring content; respect safe areas.

### Today

- Show a human-readable local date and a concise heading, with one **Add task** action.
- List tasks whose `scheduledDate` matches the selected local date. Active tasks are shown first; completed tasks appear in a subdued **Done today** section.
- A task can be removed from Today without deleting it. The date picker is not required in v0.1; Today always means the current local date.
- Empty state: plainly say there is nothing planned for today and offer **Add a task**. Do not show scores, streaks, charts, or motivational copy.

### Tasks

- Show a compact, scannable list of all non-deleted tasks, newest first by default.
- Provide simple filters for status and project, including **All** and **No project**. Filters should be visually quiet and must not become a filter-builder.
- Each row supports opening details, changing status, and adding/removing the task from Today. Keep destructive deletion in the task detail/menu rather than beside the primary status control.
- Empty state offers quick capture and explains that tasks can optionally be assigned to a project.

### Projects

- Show project names as a simple list, not large decorative cards. Creating a project needs only a name.
- A project detail view shows its name and associated tasks, with the same task interactions as the main list.
- Allow rename and delete. When deleting a project with tasks, explain that its tasks will remain and become unassigned before confirmation.
- Include a clear unassigned-tasks route/filter; do not require every task to belong to a project.

### Quick capture and task details

- Open from **New task** on any main view. `N` may be used as a shortcut when focus is not already in an input, textarea, or editable element.
- Required field: task title. Optional fields: details, project, and **Add to Today**. Keep the initial capture compact; secondary fields may be visually quieter but discoverable.
- Save immediately to local storage and show the new task in the relevant list. Default status is `Todo`; default project and scheduled date are empty unless the user selected **Add to Today**.
- Editing supports title, optional details, project, status, Today membership, and deletion. Do not add priority, due-date, dependency, or time-tracking fields.

## 5. Interaction and behavior rules

- Status transitions are direct and reversible. Choosing `Done` does not delete or archive the task; it remains available in Tasks and in Today if scheduled there.
- **Add to Today** stores the current local date (`YYYY-MM-DD`). Removing from Today clears the date. At the next local day boundary, yesterday's task does not silently appear on today's list.
- A task may have `projectId: null`; this is a valid everyday state, not an incomplete warning.
- Deleting a task requires a clear confirmation or an immediate Undo affordance. Never make a status change or removal from Today destructive.
- Deleting a project with associated tasks requires confirmation and leaves those tasks intact with no project assigned.
- Shortcuts must not intercept normal typing or browser/system shortcuts. All actions remain available by pointer and keyboard.
- Do not silently drop edits if local storage fails. Keep the current edit visible when possible and explain that it could not be saved.

## 6. Data model and persistence

Keep the model small, typed, and versioned. Use stable IDs, ISO UTC timestamps for events, and local calendar strings for the Today date.

```ts
type TaskStatus = "todo" | "in_progress" | "done";

type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Task = {
  id: string;
  title: string;
  details: string;
  status: TaskStatus;
  projectId: string | null;
  scheduledDate: string | null; // YYYY-MM-DD in the user's local calendar
  createdAt: string;
  updatedAt: string;
};

type AppData = {
  schemaVersion: number;
  projects: Project[];
  tasks: Task[];
};
```

**Persistence rules**

- Store all app state behind a small typed repository/storage module, using a versioned key such as `daymark:data:v1`.
- Validate and normalize stored data on load. If data is malformed or from an unsupported version, preserve the raw value where possible and show a clear recovery message rather than silently overwriting it.
- Use `crypto.randomUUID()` for IDs where available, with a small fallback only if needed.
- Derive Today from the current local calendar date. Do not use UTC date slicing for user-facing day comparisons.
- Project deletion clears the matching `projectId` on affected tasks; it never cascades to task deletion.
- No server, account, analytics, or external API is needed. State plainly in product copy that data is stored in this browser and is not synced.

## 7. Visual and interaction design direction

### Art direction: a quiet programmer's workbench

Aim for an editorial utility interface: warm, neutral surfaces; precise alignment; one restrained accent; and typography that makes the work easy to scan. The product should feel designed by a careful software team, not assembled from a generic dashboard template.

Use a light, warm-neutral appearance as the single polished v0.1 theme. Avoid adding a theme toggle. Suggested CSS tokens:

```css
:root {
  --canvas: #f6f5f1;
  --surface: #ffffff;
  --surface-muted: #efeee8;
  --text: #252923;
  --text-muted: #70746d;
  --border: #e2e1d9;
  --accent: #426b57; /* restrained pine */
  --accent-hover: #345642;
  --focus-ring: #6f947f;
  --status-todo: #777a73;
  --status-progress: #466f91;
  --status-done: #4f7559;
  --danger: #a3483d;
}
```

Status colors must also have text labels; color is never the only signal. Keep semantic colors muted and reserve the accent for primary actions and a small number of selected states.

### Typography, spacing, and surfaces

- Use a dependable system sans-serif stack for UI text. Use a monospace face only for compact technical details if useful; do not make the whole interface look like a code editor.
- Establish a clear type scale: page title around 26–30 px, section heading around 16–18 px, body 14–16 px, metadata 12–13 px. Keep line lengths comfortable and contrast strong.
- Use a consistent 4/8 px spacing rhythm. Prefer whitespace and alignment to enclosing every region in a card.
- Use hairline borders and flat surfaces. Reserve subtle shadows for overlays only. Use small, consistent corner radii (roughly 4–8 px); avoid oversized pill-shaped controls.
- Task rows should be compact and readable, separated primarily by dividers. Make the title the visual anchor, with status, project, and Today indicator as subordinate metadata.
- Use one coherent icon style at a consistent 16 px size if icons are needed. Navigation and actions must retain readable text labels. No emoji or decorative illustration is needed.

### Avoid these visual shortcuts

- Purple/blue gradient hero panels, glow effects, glassmorphism, and decorative blobs.
- A grid of cards for simple lists, nested cards, or a dashboard of empty metrics.
- Huge marketing-style headings, generic motivational slogans, or unnecessary welcome banners.
- Excessive status pills, colored badges, shadows, animation, and icon-only controls.
- Fake avatars, fake activity, fake project/task content presented as the user's own data.

Start with an empty workspace. If sample data is ever added during development, keep it out of the default user experience and clearly label it as sample content.

### Accessibility and responsive behavior

- Support desktop and mobile layouts, including a usable width around 360 px. No horizontal page scrolling.
- Use semantic buttons, labels, and form controls; provide accessible names, visible keyboard focus, sufficient contrast, and logical tab order.
- Dialogs must manage focus, close predictably, and return focus to the triggering control. Support Escape where appropriate.
- Do not rely on hover alone. Respect `prefers-reduced-motion`; use motion only for brief, functional transitions.

## 8. Technical direction

Use the framework, package manager, and conventions already present in the repository. If starting from an empty repository, a suitable minimal stack is:

- Vite + React + TypeScript.
- The existing CSS approach if one exists; otherwise use a small CSS token layer and component styles. Do not introduce a large design system for this POC.
- Browser `localStorage` behind a typed repository module, with runtime validation on read.
- No backend, authentication, analytics, or external API.

Keep UI separate from domain and persistence logic. A compact structure may look like:

```text
src/
  app/                 # shell, routes, global shortcuts
  components/          # shared controls, task row, task editor
  features/
    today/
    tasks/
    projects/
  domain/              # types, validation, local-date helpers
  data/                # repository, localStorage adapter
```

Do not build a speculative sync abstraction, plugin system, generalized workflow engine, or future collaboration scaffolding. Preserve existing working infrastructure unless it blocks the POC.

## 9. Reliability, privacy, and edge cases

- Core task and project flows work without network access after the app has loaded.
- Handle empty, loading, and error states, even when local persistence makes loading brief.
- Handle local-storage quota/security failures visibly; never claim a save succeeded when it did not.
- Use local calendar dates consistently for Today across timezone boundaries and refreshes.
- Validate project references and status values when reading stored data; avoid crashes from malformed local state.
- Do not put private task or project content in URLs, logs, or analytics. No analytics are included in v0.1.
- Do not show fake sync indicators or imply that browser-local data is backed up.

## 10. Definition of done / acceptance criteria

The POC v0.1 is complete when:

1. The repository runs using documented commands without credentials or environment variables.
2. A user can create a task with only a title from any main view; optional details and project do not block saving.
3. Tasks persist after refresh in the same browser.
4. A user can edit task title/details, assign or clear a project, and change status among Todo, In Progress, and Done.
5. A user can add a task to Today, remove it from Today, and see the correct local-date list after refresh or a date boundary.
6. Today shows active tasks and a quieter completed section; its empty state offers a direct way to add a task.
7. The Tasks view lists all tasks and provides simple status/project filtering, including unassigned tasks.
8. A user can create and rename a project; deleting a project preserves its tasks and requires confirmation when tasks are affected.
9. Deleting a task is clear and recoverable where practical; it never happens as a side effect of marking Done.
10. The app is usable by keyboard and pointer, has visible focus states and accessible control names, and works at desktop and mobile widths.
11. Malformed data or local-storage write failures produce a clear recovery/error state instead of a silent reset or lost-save claim.
12. Automated tests cover status validation, Today local-date selection, project deletion behavior, and persistence validation. Run available lint, typecheck, test, and production build commands successfully.
13. The UI contains no nonfunctional controls for deferred features and no fake team, sync, or integration data.

## 11. Suggested implementation order

1. Inspect the existing repository and preserve its conventions; report blockers before replacing infrastructure.
2. Define the small data model, local-date helpers, validation, and versioned local persistence; test these foundations.
3. Build the responsive shell and three destinations with the warm-neutral design tokens and accessible navigation.
4. Implement task capture, task editing, status changes, Today membership, and task-list filtering.
5. Implement minimal project create/rename/delete and the unassigned-tasks behavior.
6. Add empty/error/confirmation states and verify data behavior after refresh and across local date boundaries.
7. Run lint, typecheck, tests, and production build; fix failures. Manually verify desktop and mobile layouts.
8. Update the README with setup, run/test commands, local-storage behavior, privacy limitations, and deferred scope.
