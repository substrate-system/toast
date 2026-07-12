# Patch plan: `@substrate-system/toast` queue starvation

Plan for fixing the root-cause bug upstream in
`@substrate-system/toast` (repo: `substrate-system/toast`), so that a
persistent toast can no longer swallow every other toast. Once released,
this app can drop its local workaround and go back to the normal
`.toast()` call.

## Context / problem

`.toast()` shows toasts through a single module-global slot. In the
compiled output (`dist/index.js`) the relevant pieces are:

```js
const toastQueue = []          // pending toasts
let currentToast = null        // the one slot; only cleared in hide()

function processToastQueue () {
  if (currentToast) return               // slot busy -> do nothing
  if (toastQueue.length === 0) return
  currentToast = toastQueue.shift()
  requestAnimationFrame(() => currentToast._showToast())  // adds .toast-visible
}

toast () { toastQueue.push(this); processToastQueue() }
```

`currentToast` is only released inside `hide()`, and a toast whose
`_timeout === Infinity` (set by `timeout="0"` OR `noclose`) never
auto-hides. So a persistent toast shown via `.toast()` holds the slot
forever, and every later `.toast()` call from any other instance is
silently dropped -- never shown, never deferred-then-shown.

Concrete failure in this app: the always-mounted offline "Unsynced
changes" toast (`timeout="0"`) holds the slot, so the profile "Report
settings saved" confirmation never appears.

## Root cause

The queue conflates two different kinds of toast:

1. Transient toasts -- a confirmation that shows for N seconds then
   auto-hides. These legitimately want "one at a time, in sequence."
2. Persistent / sticky toasts (`timeout="0"` or `noclose`) -- a status
   banner that stays until a condition clears. These are not part of any
   sequence and must not occupy the transient slot.

A persistent toast in a single-slot transient queue is a permanent
head-of-line block.

## Fix design (recommended)

Two independent changes, both small:

### 1. Persistent toasts bypass the transient queue

A toast whose effective timeout is `Infinity` should show immediately and
never take the shared slot.

In `toast()`:

```js
toast () {
  if (this._timeout === Infinity) {
    // Sticky/persistent toast: show now, never occupy the transient
    // single-slot queue (otherwise it head-of-line-blocks every other
    // toast until it is manually hidden).
    this._showToast()
    return
  }
  toastQueue.push(this)
  processToastQueue()
}
```

Because such a toast never becomes `currentToast`, `hide()`'s
`if (currentToast === this)` branch is already skipped for it, so hiding a
persistent toast will not wrongly advance the transient queue. No change
needed in `hide()` for this part.

Behavior after the change: `timeout="0"` / `noclose` toasts render
independently and coexist with transient toasts. Transient toasts keep
their existing "one at a time" sequencing.

### 2. Self-heal a stale / disconnected slot (defense in depth)

Even for transient toasts, if the holder element is removed from the DOM
before its `hide()` completes (for example a route unmounts during the
show window), `currentToast` can be left pointing at a detached node and
block the queue. Make `processToastQueue` release a disconnected holder:

```js
function processToastQueue () {
  if (currentToast) {
    if (currentToast.isConnected) return   // genuinely busy
    currentToast = null                    // stale holder -> release
  }
  if (toastQueue.length === 0) return
  currentToast = toastQueue.shift()
  requestAnimationFrame(() => currentToast._showToast())
}
```

This is a safety net so no single misbehaving/removed toast can wedge the
queue permanently.

### Alternatives considered

- Per-position queues (group by top-right / bottom-center, etc.): solves
  overlap too, but needs the component to know its resolved position and
  is materially more complex. Rejected for now; item 1 fixes the reported
  bug with far less surface area.
- Remove the queue entirely (every toast shows independently): simplest,
  but changes stacking behavior for multiple simultaneous transient
  toasts and loses the "one at a time" affordance the queue provides.
- New explicit `sticky` attribute / `show()` method instead of keying off
  `Infinity`: nice-to-have, but keying off the existing timeout semantics
  fixes current consumers with zero API surface. Can be added later
  (see optional task below).

## Task list (upstream repo: `substrate-system/toast`)

1. In `src/` (the TypeScript source that compiles to `dist/index.js`),
   update `toast()` to early-return via `_showToast()` when
   `this._timeout === Infinity` (change 1 above).
2. Update `processToastQueue()` to release a `currentToast` that is not
   `isConnected` (change 2 above).
3. Confirm `_timeout` is already `Infinity` for both `timeout="0"` and
   `noclose` at the moment `toast()` runs (constructor +
   `handleChange_timeout` / `handleChange_noclose`). If a race exists
   where `toast()` can run before the timeout attribute is processed,
   normalize `_timeout` at the top of `toast()`.
4. Update README: document that `timeout="0"` / `noclose` toasts are
   "sticky" and render outside the transient queue (they can overlap other
   sticky toasts; positioning is the consumer's responsibility).
5. Add a CHANGELOG entry.
6. (Optional) Add an explicit opt-in that does not depend on timeout: a
   `sticky` boolean attribute (or a public `show()` method) that also
   bypasses the queue. Keep the `Infinity` behavior as the default so
   existing consumers are fixed without edits.

## Tests to add upstream

Prefer behavior assertions over DOM-string matching. Drive the real
component in jsdom (or the repo's existing harness):

1. Sticky does not block transient: show a `timeout="0"` toast, then call
   `.toast()` on a second `timeout="3000"` toast; assert the second gets
   `toast-visible` within a couple of frames.
2. Transient sequencing preserved: two `timeout>0` toasts; the second
   waits until the first hides, then shows.
3. Self-heal: set a transient toast as `currentToast`, remove it from the
   DOM, then `.toast()` another transient toast; assert the new one shows
   (the stale slot was released).
4. Hiding a sticky toast does not advance the transient queue: with a
   transient toast queued behind, hide the sticky one and assert the
   transient does not jump the sequence incorrectly.

A minimal jsdom harness that already exercises this exact interaction
lives in this repo's git history from the debugging session (offline
`timeout="0"` toast holding the slot vs a transient toast). Reuse its
setup: `new JSDOM(..., { pretendToBeVisual: true })`, assign the globals,
`await import('@substrate-system/toast')`, assert on the `toast-visible`
class.

## Release

1. Bump `@substrate-system/toast` (patch or minor -- it is a bugfix with a
   documented behavior change for sticky toasts), publish to npm.
2. Bump the dependency in this app's `package.json`
   (currently `^0.0.10`) and `npm install`.

## Migrate this app back to the normal API

After the new version is installed, revert the local workaround in
`src/client/routes/profile.ts` (added 2026-07-11):

1. Restore the save handler body to:
   `if (shouldShowReportSettingsSavedToast(saved)) {
   reportSettingsToastRef.current?.toast() }`.
2. Delete the `savedToastTimer` ref, its unmount-cleanup `useEffect`, the
   `SAVED_TOAST_TIMEOUT_MS` constant, and the imperative
   `classList.add('toast-visible')` / `setTimeout` block.
3. Re-add `timeout="3000"` to the `<substrate-toast>` element.
4. Leave the offline toast (`src/client/components/offline-unsynced-toast.ts`)
   unchanged -- it now coexists with transient toasts automatically.

## Verify end to end

1. Upstream unit tests (the four above) pass.
2. In this app: with the offline "Unsynced changes" toast active (offline
   with pending ops), save report settings and confirm the "saved" toast
   still appears, and the offline toast is undisturbed.
3. With no offline toast active, saving still shows the confirmation and it
   auto-dismisses.
4. `npm run test:typecheck` and `npm run lint` clean.
