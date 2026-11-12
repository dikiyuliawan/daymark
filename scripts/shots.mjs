#!/usr/bin/env node
/*
  Daymark design loop: drive the app in a real browser and save the screens.

  It launches headless Chrome, sets a phone viewport, walks a list of scenes
  (a route, a click, a dark theme) and writes one PNG per scene into shots/.
  It is the tool the redesign was judged with: every round of changes is shot
  again and compared against the reference screenshots.

    node scripts/shots.mjs                     # every scene at 390x844
    node scripts/shots.mjs --w 1440 --h 900    # another size
    node scripts/shots.mjs --only today,sheet  # a few scenes
    node scripts/shots.mjs --base http://localhost:5173/?demo=1
*/
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const WIDTH = Number(opt("w", 390));
const HEIGHT = Number(opt("h", 844));
const BASE = opt("base", "http://localhost:5173/?demo=1");
const OUT = path.resolve(opt("out", "shots"));
const ONLY = opt("only", "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);
const PORT = Number(opt("port", 9333));

const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

/** Each scene: a name, a hash route, a script to run in the page, and a flag. */
const SCENES = [
  { name: "today", route: "/today" },
  { name: "tasks", route: "/tasks" },
  { name: "projects", route: "/projects" },
  { name: "focus", route: "/focus" },
  { name: "search", route: "/search" },
  {
    name: "sheet",
    route: "/today",
    run: async () => {
      const fab = document.querySelector(".fab");
      fab?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
      window.__set(document.querySelector("#task-title"), "Draft the launch note");
      await new Promise((resolve) => setTimeout(resolve, 150));
    },
  },
  {
    name: "plan",
    route: "/plan",
  },
  {
    name: "plan-load",
    route: "/plan",
    run: async () => {
      const cont = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.trim() === "Continue",
      );
      cont?.click();
      await new Promise((resolve) => setTimeout(resolve, 250));
      cont?.click();
      await new Promise((resolve) => setTimeout(resolve, 350));
    },
  },
  {
    name: "shutdown",
    route: "/shutdown",
  },
  {
    name: "focus-task",
    route: "/focus",
    run: async () => {
      document.querySelector(".dropdown-link .dropdown-trigger")?.click();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const option = [...document.querySelectorAll(".dropdown-option")].find((o) =>
        o.textContent?.includes("Document customer feedback"),
      );
      option?.click();
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
  },
  {
    name: "large-text",
    route: "/today",
    run: async () => {
      // the system text size turned up
      const style = document.createElement("style");
      style.textContent = "html { font-size: 20px; }";
      document.head.appendChild(style);
      await new Promise((resolve) => setTimeout(resolve, 200));
    },
  },
  {
    name: "move-menu",
    route: "/tasks",
    run: async () => {
      document.querySelector(".row-grip")?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
  },
  {
    name: "budget",
    route: "/today",
    run: async () => {
      const figure = document.querySelector(".capacity");
      figure?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
  },
  {
    name: "row-menu",
    route: "/tasks",
    run: async () => {
      const trigger = document.querySelector(".dropdown-dot .dropdown-trigger");
      trigger?.click();
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
  },
  {
    name: "dark-today",
    route: "/today",
    dark: true,
  },
  {
    name: "dark-tasks",
    route: "/tasks",
    dark: true,
  },
  {
    name: "empty-today",
    route: "/today",
    fresh: true,
  },
  {
    name: "empty-tasks",
    route: "/tasks",
    fresh: true,
  },
  {
    name: "toast",
    route: "/today",
    run: async () => {
      document.querySelector(".fab")?.click();
      await new Promise((resolve) => setTimeout(resolve, 350));
      window.__set(document.querySelector("#task-title"), "Send the launch note");
      await new Promise((resolve) => setTimeout(resolve, 120));
      const submit = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "Add task",
      );
      submit?.click();
      await new Promise((resolve) => setTimeout(resolve, 600));
    },
  },
  {
    name: "confirm",
    route: "/today",
    run: async () => {
      const title = document.querySelector(".row-title");
      title?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
      const del = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "Delete task",
      );
      del?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
  },
  {
    name: "dark-sheet",
    route: "/today",
    dark: true,
    run: async () => {
      document.querySelector(".fab")?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wait until the app has rendered its screen, whatever the dev server took. */
async function waitForApp(cdp, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const ready = await cdp.evaluate(
      "!!document.querySelector('.screen') || !!document.querySelector('.loading-note')",
    );
    if (ready === true) {
      await sleep(250);
      return;
    }
    await sleep(200);
  }
}

/* Set a controlled input the way a person would, so React sees it. It runs in
   the page (window.__set), because the scenes are evaluated there. */
const SET_VALUE = `
  window.__set = (input, value) => {
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
`;

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      /* keep looking */
    }
  }
  throw new Error("No Chrome or Edge found; set CHROME_PATH.");
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        `evaluate failed: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`,
      );
    }
    return result.result?.value;
  }

  /** Run a scene function in the page. */
  async runFunction(fn) {
    return this.evaluate(`await (${fn.toString()})();`);
  }
}

async function openCdp(port) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      const info = await response.json();
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((target) => target.type === "page");
      if (!page) throw new Error("no page target");
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", reject, { once: true });
      });
      return { cdp: new Cdp(ws), info };
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome did not answer on the debugging port");
}

async function main() {
  const chrome = await findChrome();
  const profile = path.join(os.tmpdir(), "daymark-shots-profile");
  await fs.mkdir(profile, { recursive: true });
  await fs.mkdir(OUT, { recursive: true });

  const child = spawn(
    chrome,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const { cdp } = await openCdp(PORT);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 2,
    mobile: true,
  });

  const scenes = SCENES.filter((scene) => ONLY.length === 0 || ONLY.includes(scene.name));

  for (const scene of scenes) {
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: scene.dark ? "dark" : "light" },
      ],
    });
    const base = scene.fresh ? BASE.replace(/[?&]demo=1/, "") : BASE;
    const url = `${base}#${scene.route}`;
    await cdp.send("Page.navigate", { url });
    await sleep(900);
    await waitForApp(cdp);
    // Every scene starts from a known store: the demo scenes re-seed it, the
    // empty ones stay empty.
    await cdp.evaluate("localStorage.clear();");
    await cdp.send("Page.reload", { ignoreCache: false });
    await waitForApp(cdp);
    // The app reads the hash on load; a same-page hash change needs a reload.
    await cdp.send("Page.reload", { ignoreCache: false });
    await sleep(1400);
    await cdp.evaluate(SET_VALUE);
    if (scene.run) {
      await cdp.runFunction(scene.run);
    }
    await sleep(400);
    const shot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const file = path.join(OUT, `${scene.name}-${WIDTH}.png`);
    await fs.writeFile(file, Buffer.from(shot.data, "base64"));
    console.log("saved", file);
  }

  cdp.ws.close();
  child.kill();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
