# PWA Prompt-Update Serves the Stale Bundle During QA

**Scope**: All QA/eyeballing of production builds of this app.

## Core Rule

The production build registers a service worker with `registerType: "prompt"`
(see `vite.config.ts`), so an active SW keeps serving the **previously cached
bundle** until the user accepts an update. When verifying a fresh build, either:

- run `npm run dev` (no service worker), or
- clear the SW + Cache Storage first.

Otherwise you are testing STALE code and will wrongly conclude "my fix didn't work".

## When to Apply

- After `npm run build && npm run preview`, before screenshotting/eyeballing.
- Automated checks (Playwright): unregister SWs + clear caches, then reload.

```js
// clear SW + caches in a browser-automation step
const regs = await navigator.serviceWorker.getRegistrations();
for (const r of regs) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
```

## Why prompt (not autoUpdate)

`autoUpdate` (skipWaiting) could swap the SW mid-game and yank a lazily-loaded
game chunk. `prompt` is intentional — the stale-during-QA behavior is the trade-off.
