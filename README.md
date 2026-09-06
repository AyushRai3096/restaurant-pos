# Restaurant POS

A Windows desktop point-of-sale for restaurant table service: seat a table, fire
KOTs to the kitchen, print the bill, settle, free the table.

Built with Electron, React and SQLite.

## Running it

```bash
npm install
npm start
```

`npm start` runs from source with hot reload. Receipt previews appear on screen
in this mode; a packaged build sends them straight to the printer instead.

## Packaging

```bash
npm run make
```

Produces a Windows installer in `out/`. `better-sqlite3` is a native module and
is rebuilt for the target automatically.

New to this codebase? Read `HANDOVER.md` — it covers the decisions, conventions
and traps that are not visible from the code alone.

## How it fits together

Electron runs two processes that cannot call each other directly:

| | Does | Cannot |
|---|---|---|
| **main** (`src/main*`) | database, printing, files | draw anything |
| **renderer** (`src/ui`) | the React UI | touch files or the database |

They talk over IPC. Every message the UI is allowed to send is declared in
`src/main/ipc.js` and exposed through `src/preload.js` — nothing else gets
through.

### The data model

An order is **a list of KOTs, not a list of items**. That is what makes "print
only the new items" trivial: a KOT holds exactly what was fired to the kitchen
at one moment. The bill is derived by grouping every `kot_item` of the order, so
it can never drift from what the kitchen actually received.

```
tables      id, name, status
orders      id, table_id, status, business_day, created_at, billed_at, settled_at
kots        id, order_id, kot_number, printed_at
kot_items   id, kot_id, item_name, price, qty
```

`kot_items` stores a **copy** of the name and price. Changing a price tomorrow
must not rewrite yesterday's bill.

`kot_number = 0` is a holder for items saved without firing a KOT — the plain
"Save" action. It is excluded from KOT counts so such a table shows as *Running*
rather than *Running KOT*.

### Trading day

The restaurant's day runs **09:00 to 05:00 the next morning**, so a business day
crosses midnight. `src/main/businessDay.js` owns that rule, and every order is
stamped with its `business_day` at creation. Reports group on that column, never
on `created_at` — otherwise a sale at 01:30 would land on the wrong day.

### Prices include GST

Menu prices are tax-inclusive. The bill back-calculates: a ₹40 naan is ₹38.10
taxable plus ₹1.90 GST. Each line is rounded to paise **first** and those values
summed — dividing the gross total instead loses a paisa against the printed
receipt.

## Files the outlet can edit

These live in the app data folder, **outside** the packaged app, so changing
them needs no rebuild:

```
Windows  C:\Users\<user>\AppData\Roaming\Restaurant POS\
macOS    ~/Library/Application Support/Restaurant POS/
```

| File | Purpose |
|---|---|
| `menu.csv` | The menu. Columns: `category,name,variant,price`. One row per price; rows sharing a name become one item with variants |
| `branding.json` | Outlet name, wordmark, window title |
| `logo.png` | Optional logo for the nav bar. Replaces the text mark |
| `petpooja.db` | The database |
| `print.log` | Every print attempt, with the reason on failure |

Defaults ship in `assets/` and are copied in on first run. After that the data
folder wins, so an app update never overwrites edited prices.

## Printing

Receipts are HTML rendered through the Windows printer driver, so any installed
thermal printer works without ESC/POS byte handling. Templates are in
`src/main/receipt.js`, sized for 80mm paper.

Pick the printer under the hamburger menu, then use **Test Print**. Failures are
reported inline and appended to `print.log` — in a packaged build there is no
preview, so the log is the only record.

## Shortcuts

| Key | Action |
|---|---|
| `Ctrl+R` / `⌘R` | Sales report |
| `Esc` | Close the report |

The default Electron menu is removed, because it owns `Ctrl+R` for "reload
window" and would swallow the shortcut.
