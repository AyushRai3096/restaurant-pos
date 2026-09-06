# Handover

Context that is not obvious from the code, for anyone picking this up — including
a fresh Claude Code session. Read `README.md` first for the architecture; this
file covers decisions, conventions and open threads.

## What this is

A Windows desktop POS for restaurant table service, modelled closely on the UI
of an existing product so staff need no retraining. Built for one outlet:
**Veer Ji Malai Chaap Wale, Paschim Vihar**.

## Working conventions

**Match by measurement, not by eye.** Nearly every visual bug in this project
came from adjusting values by feel. When something looks wrong, measure it from
a screenshot or read the value out of the reference stylesheet. Several rounds
were wasted redrawing an icon that turned out to be a completely different glyph,
and a whole afternoon on spacing that was wrong because the window was 1440px
while the reference screenshots were 1920px.

**Trace, do not guess, when matching an icon.** Find the element in the markup,
follow it to the function that renders it, and take that path. Guessing from the
name is how `poss_icon_refresh` got used when the screen actually calls
`poss_icon_check_for_update`.

**One scale variable.** Every size in `src/index.css` is written in the reference
UI's own pixel units and multiplied by `--s`:

```css
height: calc(62 * var(--s));   /* 62px in the reference design */
```

`--s: calc(1vw / 19.2)` — so 1 unit is one pixel at 1920px wide, and the layout
keeps its proportions at any window size. Never hardcode a px value.

**Brand assets are committed.** `assets/icon.{png,ico}` (the app icon — the build
reads `icon.ico` for the `.exe`), `assets/logo.png` (nav-bar wordmark, seeded to
the data folder on first run) and `src/ui/assets/{zomato,swiggy}.png` (delivery
platform marks, loaded by `import.meta.glob` in `platformLogos.js`) all live in
the repo now — the UI needs them to match the reference product. The Zomato and
Swiggy marks are their trademarks; this is nominative use in an order screen.
`assets/logo.png` currently still holds the *reference app's* wordmark — swap it
for the outlet's own. Without any `logo.png` the UI falls back to the text
wordmark from `branding.json` (`VEERJI POS`), so a clone still builds and runs.

## Decisions worth knowing

**An order is a list of KOTs, not a list of items.** This is the core of the data
model and makes "print only the new items" fall out naturally. The bill is
derived by grouping every `kot_item`, so it can never drift from what the kitchen
actually received.

**Menu prices include GST.** A ₹40 naan is ₹38.10 taxable + ₹1.90 tax. Each line
is rounded to paise **first**, then summed — dividing the gross total instead
loses a paisa against the real printed receipts.

**Trading day is 09:00–05:00**, so it crosses midnight. `business_day` is stamped
on every order at creation. Reports group on that column, never `created_at`.

**Availability is keyed by item name**, not id. The menu is a CSV that can be
re-edited, so ids would break the moment rows moved.

**`kot_number = 0`** holds items saved without firing a KOT — the plain "Save"
action. It is excluded from KOT counts, so such a table shows as *Running* (blue)
rather than *Running KOT* (yellow).

**Previews are development-only.** `IS_DEV = !app.isPackaged` in
`src/main/printer.js`. A packaged build sends `preview: null` and prints
directly — it is not a setting someone can switch on at the counter.

**Packaging is `npm install` then `npm run make`** — no flags, no manual steps.
The installer lands in `out/make/squirrel.windows/x64/`. Three non-obvious pieces
make it work, all in `forge.config.js` / `package.json`:

- **`overrides["@electron/node-gyp"] = "npm:node-gyp@^12.4.0"`.** `@electron/rebuild`
  pins a node-gyp fork whose Visual Studio detector predates VS 2026 (v18) and
  aborts with "could not find any Visual Studio" even when it is installed.
  Aliasing to upstream node-gyp fixes npm's implicit build of `better-sqlite3`
  (it ships a `binding.gyp`; the build is a no-op because v13 bundles a prebuilt
  N-API binary per platform in `prebuilds/`).
- **`rebuildConfig: { onlyModules: [] }`** stops Forge recompiling `better-sqlite3`
  for Electron. N-API is ABI-stable, so `prebuilds/win32-x64.node` loads in
  Electron 43 unchanged — no MSVC needed at package time.
- **`packagerConfig.ignore` + `plugin-auto-unpack-natives`.** The Vite plugin's
  default packages only `.vite/` and drops all of `node_modules`; the custom
  `ignore` lets `node_modules/better-sqlite3` back in, and auto-unpack pulls the
  `.node` out of the asar so Electron can load it.

A full C++ toolchain is *not* required for a normal build. It is only needed if
you ever set `onlyModules` back to rebuilding native modules from source — then
install the VS Build Tools "Desktop development with C++" workload (VS 2026 is
fine with node-gyp ≥ 12).

## Traps already hit

Each of these cost real time. They will not be obvious from reading the code.

- **CSP blocks silently.** `data:` URIs, fonts and iframes each needed an
  explicit directive in `index.html`. A blocked resource throws nothing — it just
  does not appear.
- **`stroke-width` in CSS loses to an SVG's own attribute.** Change the icon
  component, not the stylesheet.
- **`display: flex` on a `<td>`** removes it from the table layout, so collapsed
  borders break either side of it. Put the flexbox in a wrapper inside the cell.
- **`background:` shorthand after `background-image:`** erases the image.
- **A migration's `CREATE INDEX` must run after its `ALTER TABLE`**, not in the
  main schema block. Fresh installs pass; upgrades crash.
- **An effect like `if (!category)`** fights the user when `''` is a valid choice.
  Use `=== null` for "not chosen yet".
- **Electron's default menu owns Ctrl/Cmd+R.** It is removed in `src/main.js`;
  without that the reports shortcut just reloads the window.

## State of play

**Working:** table grid with five states, order screen with variants, all six
action buttons, billed/settled flow, KOT and bill templates, sales report,
item on/off, store on/off panel, business-day logic, menu from CSV.

**Presentation only:** Online/Offline and platform tabs, Logistics, Quick Section
Controller, Export Excel, Print (on the report), Action column, checkboxes,
Split, "It's Paid", most nav items.

**Not started:** real thermal-printer testing, Addon On/Off, Live View, Orders,
Recent, Hold, Alerts.

**Packaging works** on Windows (`npm run make` → Squirrel installer). Built and
launched from a clean checkout on 2026-09-06; the packaged app opens the DB and
seeds the data folder. See "Packaging" under *Decisions worth knowing*.

## Immediate next steps

1. **Test printing on the real thermal printer.** Templates are in
   `src/main/receipt.js`, sized for 80mm. Pick the printer from the hamburger
   menu, then Test Print. This is the one thing never verified.
2. **Trim the installer.** It ships all 8 `better-sqlite3` platform binaries
   (~11 MB dead weight). Pruning `prebuilds/` to `win32-x64.node` before
   packaging would shrink it.
3. **Clone to a path without spaces** if you ever build native modules from
   source — `node-gyp` struggles with them on Windows. (Not an issue for the
   current prebuilt-only setup.)
