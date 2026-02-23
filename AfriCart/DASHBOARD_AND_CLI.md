# AfriCart – Dashboard & CLI-Observable Statistics

All statistics are stored **locally** in your browser. No data is sent to any server.

---

## Opening the dashboard

1. **From the extension:** Open **Settings** (click the gear on the side panel), then click **“Open Dashboard (graphs & export)”**.  
   Or open the dashboard directly: right‑click the AfriCart icon → **Manage extension** → under “Extension options” or “Inspect views”, open **dashboard.html** if listed; otherwise use the link from the Options page.

2. **From the Options page:** AfriCart Settings → **Usage Statistics & Dashboard** → **Open Dashboard (graphs & export)**. This opens the dashboard in a new tab.

---

## What the dashboard shows

- **Total comparisons** – Number of times you’ve opened a store comparison (e.g. “Check Konga”, “Check Amazon”).
- **Last activity** – Date and time of the most recent comparison.
- **Comparisons by store** – Bar chart of which stores you’ve used (e.g. Jumia, Amazon, AliExpress).
- **Comparisons over last 14 days** – Daily counts for the past two weeks.
- **Activity log** – Recent events (e.g. “Price comparison opened”, with store name and time).

Layout is card-based with simple bar charts so you can see usage at a glance.

---

## Export for CLI / scripts (observable)

Use the dashboard buttons to export data and inspect it from the command line or other tools.

### Export stats (JSON)

- Click **“Export stats (JSON)”**.
- A file is downloaded, e.g. `africart-stats-2025-02-17.json`.

Contents include:

- `usageStats` – `totalHops`, `hopsByStore`, `lastHop`.
- `statsByDate` – Per-day counts (and per-store per day) for the last 14+ days.
- `activityLog` – Last ~100 activity entries (timestamp, message, store).

**Example (command line):**

```bash
# Pretty-print
cat africart-stats-2025-02-17.json | jq .

# Total comparisons
cat africart-stats-2025-02-17.json | jq '.usageStats.totalHops'

# Top 5 stores
cat africart-stats-2025-02-17.json | jq '.usageStats.hopsByStore | to_entries | sort_by(-.value) | .[0:5]'

# Activity log (last 10)
cat africart-stats-2025-02-17.json | jq '.activityLog[0:10]'
```

### Export CSV

- Click **“Export CSV”**.
- A file is downloaded, e.g. `africart-stats-2025-02-17.csv`.

It has two parts:

1. **By store:** `Store,Comparisons`
2. **By date:** `Date,Comparisons`

**Example (command line):**

```bash
# View CSV
cat africart-stats-2025-02-17.csv

# Or use column/awk for a simple table
cat africart-stats-2025-02-17.csv | column -t -s,
```

You can pipe the CSV into any script or tool (Python, Excel, etc.) for your own graphs or reports.

---

## Backend / where data lives

- There is **no remote backend**. All of this is stored in **Chrome’s local extension storage** (`chrome.storage.local`).
- The dashboard and export only read from that local storage and from the files you download. Nothing is sent to AfriCart or any third party.

This gives you full control and a clear, observable view of your usage (in the UI and via JSON/CSV) while keeping everything on your machine.
