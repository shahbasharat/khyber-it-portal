# Application Flow Documentation
## Khyber IT Operations Portal
### The Khyber Himalayan Resort & Spa — Gulmarg

**Version:** 1.0
**Owner:** IT Manager
**Date:** May 2026

---

## 1. Entry Points

### Direct URL
`https://khyber-it-portal-web.vercel.app`

First load → Login screen. If a valid session already exists (e.g., engineer left the tab open during shift) → redirected directly to Dashboard. No public-facing content; every route requires authentication.

### Deep Links

| Trigger | URL | Sent Via |
|---|---|---|
| Shift report reminder (30 min before shift end) | `/shift-report/new` | Email + In-App |
| Critical issue alert | `/issues/{id}` | Email + In-App |
| Escalation notification | `/escalations/{id}` | Email + In-App |
| Manager daily check link | `/dashboard` | Email (weekly summary) |
| Checklist incomplete reminder | `/checklist/today` | Email + In-App |

### Login / Authentication Entry Points

- Username + password (own account per person — 3 accounts total)
- No guest or anonymous access — every single route is behind authentication
- Active Directory (AD) SSO: deferred to V1.2 — not in MVP

---

## 2. Core User Flows

---

### Flow 1: Login

**Goal:** Engineer or manager authenticates and reaches their personalised dashboard
**Entry Point:** `/login` — direct URL or redirect from any deep link

#### Happy Path

1. **Login Screen** → username field + password field + "Sign In" button → user enters credentials → taps Sign In
2. **System validates** credentials against database → success → JWT access token created (15 min) + refresh token stored
3. **Role check** →
   - Role = `ASSOCIATE` or `SENIOR_ASSOCIATE` → redirect to `/dashboard` (Full Write Shift Board)
   - Role = `MANAGER` → redirect to `/dashboard` (Full Manager/Admin Board + Admin Users access)
   - Role = `VIEWER` → redirect to `/dashboard` (Strictly Read-Only, no mutating actions, e.g. General Manager)
4. Dashboard loads with user's name displayed in top navigation

#### Error States

- **Wrong password** → inline error below password field: "Incorrect username or password" → fields remain filled → user retries
- **5 failed attempts** → account locked → error: "Account locked. Contact your IT Manager." → no retry shown → manager must unlock via admin panel
- **Server unreachable** → banner: "Cannot connect. Check your internet connection." + Retry button
- **Empty fields on submit** → inline validation: "Please enter your username" / "Please enter your password"

#### Edge Cases

- User follows a deep link (e.g., from an email notification) while not logged in → redirected to `/login` → after successful login → forwarded to the original deep link destination
- Session expires mid-shift → any tap or navigation shows modal: "Your session has expired. Please sign in again." → re-login → returned to the exact screen they were on
- User tries to access a manager-only route (e.g., `/admin/users`) while logged in as engineer → redirected to `/dashboard` with toast: "You don't have access to that page."

#### Exit Points

- **Success** → `/dashboard` (engineer or manager view depending on role)
- **Locked account** → static error screen with IT Manager contact details

---

### Flow 2: Daily Checklist

**Goal:** Engineer checks off all 12 routine resort IT tasks for their current shift
**Entry Point:** Dashboard → "Today's Checklist" card → `/checklist/today`

#### Happy Path

1. **Dashboard** → Engineer sees "Morning Checklist — 0/12 complete" card → taps it
2. **Checklist Screen** → 12 items grouped into 4 categories:
   - **Network:** Internet/WAN, Firewall, VPN, Wi-Fi Access Points
   - **Systems:** Server Health, Backup Verification, Database Connectivity
   - **Guest Services:** PMS Status, PABX/Phone System, Email Services
   - **Peripherals:** CCTV System, Printer/Peripheral Status
3. Engineer taps checkbox on first item → item turns **Fir Green** → timestamp + engineer name auto-saved → progress bar increments
4. Engineer continues rounds across resort, checking items off on mobile
5. Final item checked → banner: "Morning Checklist Complete — 12/12 ✓" → supervisor card on dashboard turns green
6. Engineer returns to Dashboard → Checklist card shows green "Complete"

#### Error States

- **Checkbox save fails (network blip)** → item reverts to unchecked → toast: "Couldn't save, retrying..." → auto-retries once → if still fails: "Check your internet connection"
- **Checklist fails to load** → error state shown: "Checklist unavailable" + Retry button
- **Checklist not yet configured** (manager hasn't set up items) → empty state: "No checklist items found. Ask your IT Manager to configure the checklist."

#### Edge Cases

- **Engineer unchecks an item** → allowed freely within 5 minutes → after 5 minutes, uncheck requires a brief note: "Reason for unchecking?"
- **Shift ends with incomplete items** → incomplete items highlighted red → automatically carried forward to next shift with label: "⚠ Overdue from Morning Shift"
- **Two engineers on the same shift** → both can check items independently → all actions timestamped with individual names → last write wins → full log maintained

#### Exit Points

- **All complete** → Back to Dashboard (green checklist card)
- **Abandoned mid-checklist** → progress saved automatically → resumes where left off on return

---

### Flow 3: Log a New Pending Issue

**Goal:** Engineer records a resort IT problem so the whole team is aware and it can be tracked
**Entry Point:** Dashboard → "+ New Issue" button → `/issues/new`

#### Happy Path

1. **Dashboard** → Engineer taps floating "+ New Issue" button
2. **New Issue Form** → fields appear:
   - Title (required)
   - Description (optional but encouraged)
   - Priority: Critical / High / Medium / Low (required)
   - Department/Location: Front Desk / Guest Room / Restaurant / Spa / Server Room / Conference Room / Staff Area / Other (required)
   - Assign To: dropdown of 3 team members or "Unassigned"
3. **If Critical selected** → confirmation dialog: "Mark as Critical? This will alert the IT Manager immediately via Email and in-app notification." → Confirm / Cancel
4. Engineer taps "Submit Issue"
5. **Validation passes** → issue created with auto-generated ticket number (e.g., KHY-007) → timestamp auto-applied
6. **If Critical** → Email + in-app notification sent to manager immediately
7. Engineer redirected to **Issue Detail Screen** showing the new issue with Status: Open
8. Issue appears on the **Pending Issues Board** for all 3 team members instantly

#### Error States

- **Title blank on submit** → inline error: "Issue title is required" → form does not submit
- **Network offline on submit** → form data preserved in browser → toast: "You're offline. Issue will be submitted automatically when reconnected."
- **Duplicate detected** (same title within 24 hours) → warning: "A similar issue was logged today — KHY-005. View it?" → View button + Continue Anyway button

#### Edge Cases

- **Engineer navigates away mid-form** → browser warning: "Leave page? Your changes will be lost." → if confirmed, draft discarded
- **Critical selected → engineer changes mind** → can downgrade to High within 5 minutes of submission before notification is sent → after 5 minutes, only manager can change Critical priority
- **Issue submitted during shift overlap** (both engineers logged in) → visible to both immediately

#### Exit Points

- **Success** → Issue Detail Screen (`/issues/{id}`)
- **Cancel** → Issues Board (`/issues`)
- **Duplicate redirect** → existing Issue Detail

---

### Flow 4: Update or Resolve a Pending Issue

**Goal:** Engineer logs progress notes on an open issue or marks it resolved
**Entry Point:** Issues Board → tap any issue → `/issues/{id}`

#### Happy Path

1. **Issues Board** → Engineer taps an open issue card (e.g., KHY-007 — PMS Database Unreachable)
2. **Issue Detail Screen** → shows: full description, priority badge, location, assigned engineer, status, complete chronological notes thread
3. Engineer taps "Add Update" → text field expands → types progress note (e.g., "Called Oracle support. Vendor accessing remotely. ETA 6PM.")
4. Taps "Save Note" → note saved with timestamp + author name → visible to all 3 team members
5. **Issue resolved** → Engineer taps "Mark Resolved" → confirmation dialog: "Mark KHY-007 as Resolved?" → Confirm
6. Engineer fills brief resolution note (required): "PMS restored after Oracle remote session. DB service restarted."
7. Status changes to **Resolved** → issue moves to archived Resolved section
8. **If Critical** → manager receives email + in-app notification: "✅ CRITICAL ISSUE RESOLVED — KHY-007 PMS Database Unreachable. Resolved by [Name] at 6:14 PM."

#### Error States

- **Empty note saved** → inline validation: "Please write a note before saving"
- **Note save fails** → toast: "Couldn't save note. Check your connection." + Retry button
- **Resolving another engineer's assigned issue** → warning dialog: "This issue is assigned to [Name]. Resolve anyway?" → Confirm / Cancel

#### Edge Cases

- **Issue has no owner** → yellow "Unassigned" badge shown → "Assign to Me" button visible on detail screen
- **Manager reopens a resolved issue** → status reverts to Open → system note auto-added: "Reopened by IT Manager — [reason entered]"
- **Engineer tries to delete an issue** → deletion not permitted; issues can only be archived (resolved) or escalated

#### Exit Points

- **After adding a note** → stays on Issue Detail (updated note thread visible)
- **After resolving** → Issues Board (resolved issue no longer in active list)
- **Back button** → Issues Board

---

### Flow 5: Log an Escalation

**Goal:** Engineer formally escalates an unresolved issue to a vendor or external support
**Entry Point:** Issue Detail Screen → "Escalate Issue" button → or `/escalations` board

#### Happy Path

1. **Issue Detail** (`/issues/{id}`) → Engineer taps "Escalate Issue"
2. **Escalation Form** → auto-fills: Incident ID, Issue Description from the linked ticket
3. Engineer fills: Escalated To (vendor/contact name), Contact Number (optional), Current Status, Remarks
4. Taps "Submit Escalation"
5. Issue status automatically updates to "Escalated"
6. **Manager receives email + in-app notification immediately:** "🔺 ESCALATION — KHY-007 escalated to Oracle Hospitality Support by [Name] at 2:45 PM"
7. In-app notification badge updates on manager's dashboard instantly
8. Escalation appears as prominent card on Manager Dashboard

#### Error States

- **"Escalated To" field blank** → inline error: "Please specify who this issue is escalated to"

#### Edge Cases

- **Escalation resolved** → engineer updates status to "Resolved" on the escalation card → manager notified
- **Manager wants to add remarks to escalation** → can add notes from their dashboard view

#### Exit Points

- **Success** → back to Issue Detail (now showing "Escalated" status badge)

---

### Flow 6: Submit Shift Report

**Goal:** Outgoing engineer formally hands over the shift in a written, structured report
**Entry Point:** Dashboard → "Submit Shift Report" button → `/shift-report/new`

#### Happy Path

1. **Dashboard** → Engineer taps "Submit Shift Report" (prominent button, always visible)
2. **Shift Report Form** → auto-filled fields:
   - Report Date: today's date
   - Shift: Morning or Afternoon (auto-detected from login time)
   - Prepared By: logged-in engineer's name
   - Designation: from profile
   - Shift Summary row: auto-calculated (Total Incidents, Resolved, Pending, Critical Alerts, Downtime, Escalations)
3. **Issues sections auto-populated:**
   - Issues Faced During Shift → pulled from all issues logged today
   - Resolved Issues → pulled from all issues resolved this shift
   - Pending / In-Progress Issues → pulled from all still-open issues
4. **Engineer fills one field manually:** Handover Notes for incoming shift (free text)
5. Taps "Preview Report" → sees full report as it will appear → taps "Submit"
6. **Confirmation screen:** "Report submitted. Incoming shift will see this on their dashboard."
7. **Manager receives email + in-app notification:** "📋 Morning Shift Report submitted by [Name] at 4:52 PM"
8. Report pinned at top of Afternoon engineer's dashboard when they log in

#### Error States

- **Handover Notes field empty** → gentle warning (not a hard block): "Consider adding handover notes for the incoming shift." → can proceed or add notes
- **Duplicate report for same shift/date** → "A report was already submitted for this shift at [time]. Replace it?" → Confirm replaces / Cancel keeps original

#### Edge Cases

- **30 minutes before shift end — no report submitted** → email + in-app reminder sent to engineer: "⏰ Your shift ends in 30 minutes. Please submit your shift report."
- **Session expires mid-form** → form data saved in browser local storage → on re-login: "You have an unsaved shift report. Restore it?" → Yes restores all fields / No discards
- **Report submitted after shift end time** → attributed to the outgoing shift (not the clock time) → note added automatically: "Submitted [X minutes] after shift end"
- **No issues logged during shift** → report still valid → Shift Summary shows zeros → system note: "No issues logged this shift"

#### Exit Points

- **Success** → Dashboard with "Morning Shift Report Submitted ✓" banner (auto-dismisses in 6 seconds)
- **Cancel** → Dashboard (no data saved)

---

### Flow 7: Manager Reviews Dashboard

**Goal:** IT Manager gets a complete operational picture in under 60 seconds — no calls needed
**Entry Point:** Login → auto-routed to Manager Dashboard → `/dashboard`

#### Happy Path

1. **Manager Dashboard** loads with status cards:
   - **Checklist:** "Morning — 10/12 complete"
   - **Open Issues:** "2 open (1 Critical)"
   - **Active Escalations:** "1 active — Oracle / PMS"
   - **Last Report:** "Morning report — 3 hours ago"
2. Manager taps "Open Issues" card → Issues Board filtered to Open only
3. Taps critical issue → reads full thread and vendor notes
4. Optionally adds a comment or reassigns the issue
5. Returns to Dashboard → taps "Shift Reports" → sees last 7 days list → taps any to read in full

#### Error States

- **Dashboard data fails to load** → skeleton placeholder cards shown with Retry button → if persistent: "Dashboard unavailable. Data was last updated at [time]."

#### Edge Cases

- **No shift report submitted** → amber card: "⚠ No Morning report submitted yet"
- **All issues resolved, checklist complete** → full-green dashboard: "All Clear — No open issues, checklist complete ✓"
- **Escalation just logged** → Escalation card pulses gold + email + in-app notification already sent to manager

#### Exit Points

- From any drill-down → breadcrumb or back arrow returns to Dashboard
- Logout → Login screen

---

## 3. Navigation Map

```
/login
│
├── /dashboard  [Engineer View]
│   ├── /checklist
│   │   └── /checklist/today
│   ├── /issues
│   │   ├── /issues/new
│   │   └── /issues/{id}
│   │       └── /issues/{id}/escalate
│   ├── /shift-report
│   │   ├── /shift-report/new
│   │   └── /shift-report/history
│   │       └── /shift-report/{id}
│   ├── /assets
│   │   ├── /assets/new
│   │   └── /assets/{id}
│   ├── /escalations
│   │   └── /escalations/{id}
│   └── /account
│       └── /account/profile
│
└── /dashboard  [Manager View]
    ├── /dashboard/overview          ← KPI cards + team health summary
    ├── /issues                      ← full board, all engineers visible
    │   └── /issues/{id}
    ├── /shift-report/history        ← all reports, all dates, all engineers
    │   └── /shift-report/{id}
    ├── /escalations                 ← all active + resolved escalations
    │   └── /escalations/{id}
    ├── /assets                      ← all asset activity log entries
    ├── /checklist/manage            ← add / edit / remove checklist items
    └── /admin
        └── /admin/users             ← manage 3 user accounts + passwords
```

---

## 4. Screen Inventory

| Screen | Route | Access | Purpose | Key UI Elements | State Variants |
|---|---|---|---|---|---|
| Login | `/login` | Public | Authenticate user | Username field, password field, Sign In button, Khyber logo | Default, Loading (spinner on button), Error (inline message) |
| Engineer Dashboard | `/dashboard` | Engineer | Daily overview and quick actions | Checklist card, Issues card, Report button, "+ New Issue" FAB, shift name header | Loading (skeleton cards), All-clear (green), Warning (amber for missing report) |
| Manager Dashboard | `/dashboard` | Manager | Team health overview | 4 KPI cards, Escalation highlight, Team status, last report time | Loading (skeleton), All-clear (green), Alert (escalation pulse) |
| Checklist | `/checklist/today` | Engineer | Complete 12 shift tasks | Grouped task list, checkboxes, progress bar, category headers | Loading, In-progress, Complete (green banner), Error (retry) |
| Issues Board | `/issues` | All | View all pending issues | Issue cards with priority badges, filter bar, search, "+ New Issue" button | Loading (skeleton), Empty ("No open issues ✓"), Filtered |
| New Issue Form | `/issues/new` | Engineer | Log a new resort IT issue | Title, description, priority selector, location dropdown, assignee picker | Default, Validation error, Submitting (loading button), Duplicate warning |
| Issue Detail | `/issues/{id}` | All | View and update one issue | Full details header, notes thread, Add Update field, Resolve button, Escalate button | Loading, Active (open), Escalated (gold badge), Resolved (green archive) |
| Escalation Form | `/issues/{id}/escalate` | Engineer | Formally escalate an issue | Auto-filled issue info, "Escalated To" field, contact, status, remarks | Default, Validation error, Submitting |
| Escalations Board | `/escalations` | All | View all escalations | Escalation cards, status badges, linked ticket numbers | Loading, Empty ("No active escalations"), Active |
| Escalation Detail | `/escalations/{id}` | All | View/update one escalation | Full escalation info, update notes, link back to parent issue | Loading, Active, Resolved |
| Shift Report Form | `/shift-report/new` | Engineer | Submit end-of-shift report | Auto-filled summary, issues sections, Handover Notes text area, Preview button | Default, Draft restored, Submitting, Duplicate warning |
| Report History | `/shift-report/history` | All | Browse past shift reports | Date-grouped list, shift badges (Morning/Afternoon), search by date | Loading, Empty (no past reports), Populated |
| Report Detail | `/shift-report/{id}` | All | Read a submitted report | Full formatted report, submitter name, timestamp, shift badge | Loading, Full report view |
| Asset Activity Form | `/assets/new` | Engineer | Log hardware/device activity | Asset ID, device type, department, activity performed, status | Default, Validation, Submitting |
| Asset Log | `/assets` | All | View all asset activity | Table of entries, sortable columns, search | Loading, Empty, Populated |
| Checklist Manager | `/checklist/manage` | Manager | Add/edit/remove checklist items | Item list with shift assignments, Add Item form, Edit/Delete controls | Loading, Empty, Edit mode |
| Admin — Users | `/admin/users` | Manager | Manage user accounts | User list (name, role, dynamic badge), Add User, Edit User modal (name, role, optional reset password), Delete User | Loading, Populated |
| Change Password | Modal popup (🔑 sidebar/header) | All | Update own account password | Current Password, New Password, Confirm Password | Success/error alerts, inline validations |

---

## 5. Decision Points

```
═══════════════════════════════════════════════════
ON ANY PAGE LOAD
═══════════════════════════════════════════════════
IF no session token exists
  → redirect to /login

IF session token is expired
  → attempt silent refresh using httpOnly cookie
  → IF refresh succeeds → continue normally
  → IF refresh fails → show "Session expired" modal → re-login → return to original route

IF engineer tries to access /admin/* or /dashboard/overview
  → redirect to /dashboard with toast: "You don't have access to that page."

═══════════════════════════════════════════════════
ON LOGIN SUCCESS
═══════════════════════════════════════════════════
IF user.role == "manager"
  → /dashboard (Manager view with KPI cards)

IF user.role == "engineer"
  → /dashboard (Engineer view with checklist + issues + report button)

═══════════════════════════════════════════════════
ON NEW ISSUE FORM — PRIORITY SELECTED
═══════════════════════════════════════════════════
IF priority == "Critical"
  → show confirmation dialog before submission
  → ON CONFIRM:
    → submit issue
    → fire Email notification to manager immediately
    → fire In-App notification to manager immediately

IF priority == "High" / "Medium" / "Low"
  → submit normally, no additional confirmation

═══════════════════════════════════════════════════
ON CHECKLIST AT SHIFT END TIME
═══════════════════════════════════════════════════
IF completion < 100% when shift ends
  → incomplete items flagged red
  → items carried to next shift with "Overdue" label
  → manager dashboard checklist card shows amber warning

IF completion == 100%
  → checklist card turns green on both dashboards
  → "All tasks complete ✓" banner shown to engineer

═══════════════════════════════════════════════════
ON SHIFT REPORT — TIME CHECK
═══════════════════════════════════════════════════
IF current time >= (shift_end_time - 30 minutes)
  AND no report submitted for current shift
  → send Email + In-App reminder to on-duty engineer
  → show persistent reminder banner on engineer's dashboard

IF shift end time passes with no report submitted
  → manager dashboard shows amber card: "⚠ No Morning report submitted"
  → send second Email + In-App reminder to engineer at shift_end + 15 minutes

═══════════════════════════════════════════════════
ON ISSUE UNRESOLVED FOR 4+ HOURS
═══════════════════════════════════════════════════
  → issue card highlighted with Antique Gold border on Issues Board
  → manager dashboard "Open Issues" counter shows "(1 overdue)" label

═══════════════════════════════════════════════════
ON ESCALATION LOGGED
═══════════════════════════════════════════════════
  → fire Email to manager immediately
  → fire In-App notification to manager immediately
  → manager dashboard Escalation card updates + pulses gold
  → parent issue status auto-changes to "Escalated"

═══════════════════════════════════════════════════
ON CRITICAL ISSUE RESOLVED
═══════════════════════════════════════════════════
  → send Email to manager: "✅ CRITICAL RESOLVED — [title]"
  → send In-App notification to manager
  → issue archived in Resolved section
  → manager dashboard open issues count decrements
```

---

## 6. Error Handling Flows

### 404 — Page Not Found

- **Display:** Khyber-branded page — stag logo centred, "Page Not Found" in Playfair Display, subtle Fir Green background
- **Message:** "This page doesn't exist or has been moved."
- **Available Actions:** "Go to Dashboard" button (primary) + "Go Back" link
- **Recovery:** User navigates to a valid screen; no data lost

---

### 500 — Server Error

- **Display:** Khyber-branded page — "Something went wrong on our end." with error reference code
- **Message:** "Our team has been notified. Please try again in a moment."
- **Available Actions:** "Retry" button + "Go to Dashboard" button
- **Recovery:** Auto-retries the failed request once silently; if still failing, shows manual Retry; Sentry captures the error automatically

---

### Network Offline (Critical for Gulmarg Connectivity)

- **Display:** Persistent gold banner at the very top of every screen: "📶 You're offline — changes will sync when reconnected"
- **Behavior:**
  - All already-loaded data remains fully viewable (read-only)
  - Checkboxes, forms, and note inputs are preserved in browser local storage
  - Submit buttons disabled with label: "Will submit when online"
  - New data (other engineers' updates) will not refresh until reconnected
- **Recovery:** Banner automatically disappears when internet is restored; any queued submissions (issue logs, checklist checks, notes) fire automatically in the order they were made
- **Important:** Engineer is shown a count: "3 actions queued for sync"

---

### Session Expired (Mid-Shift)

- **Display:** Modal overlay (cannot be dismissed by clicking outside) — "Your session has expired. Please sign in again."
- **Behavior:** Current page and any unsaved form data preserved in browser storage
- **Available Actions:** "Sign In Again" button
- **Recovery:** After re-login → returned to the exact screen they were on; form data restored with prompt

---

### Empty States (Informational, Not Errors)

| Screen | Empty State Message | Action Shown |
|---|---|---|
| Issues Board | "No open issues. Your team is all clear ✓" | "+ Log New Issue" button |
| Shift Report History | "No shift reports yet. Submit your first report." | "Submit Report" button |
| Escalations Board | "No active escalations." | None |
| Asset Log | "No asset activity logged for this shift." | "+ Log Asset Activity" button |
| Checklist (no items) | "No checklist configured. Ask your IT Manager." | None (engineer-only message) |

---

## 7. Responsive Behavior

### Mobile (Phone — Used During Resort Rounds)
*Breakpoint: screens < 768px*

**Navigation:**
- Fixed **bottom tab bar** with 4 icons: Dashboard, Checklist, Issues, Report
- No hamburger menu — bottom nav is always visible and always accessible
- Notification badge (red dot) on tab icons when there are unread alerts

**Dashboard:**
- Cards stack vertically, full device width
- "+ New Issue" is a **floating action button (FAB)** — gold circle, bottom-right corner, always visible
- Shift name and date shown in top header bar

**Checklist:**
- Items shown full-width in a single column
- **Checkbox tap target minimum 48×48px** — entire row is tappable, not just the checkbox icon
- Category headers are collapsible (tap to collapse checked categories)
- Progress bar pinned to top of screen while scrolling

**Issues Board:**
- List view only (no card grid)
- Each issue row shows: priority badge, title, location, time ago
- Tap → opens Issue Detail as full screen
- Filter accessible via "Filter" button → opens a **bottom sheet** with filter options

**New Issue / Shift Report / Escalation Forms:**
- **Wizard-style** — one section per screen
- "Next →" button advances, "← Back" returns
- Final screen shows a full summary before Submit
- Text fields expand to fill screen height when keyboard opens

**Shift Report Form:**
- Auto-filled sections collapsed by default → engineer taps to expand and review
- Only "Handover Notes" section open by default (the one field they must type)

---

### Desktop / Laptop (Used at IT Desk)
*Breakpoint: screens ≥ 768px*

**Navigation:**
- Fixed **left sidebar** — always visible, full labels:
  - Dashboard
  - Checklist
  - Issues
  - Shift Report
  - Asset Log
  - Escalations
  - *(Manager only)* Manage Checklist
  - *(Manager only)* Admin

**Dashboard:**
- **2×2 KPI card grid** for Engineer view
- **3-column layout** for Manager view: KPI cards | Issues Board | Report Log
- All key data visible without scrolling on a standard 1080p screen

**Issues Board:**
- **2-column card grid** (list/grid toggle available)
- Inline filter bar always visible above the board
- Clicking an issue opens detail in a **right-side drawer panel** — no full page navigation
- Supports keyboard navigation through issue cards

**Forms:**
- **Single-page layout** — all fields visible at once, no wizard pagination
- Short field pairs displayed side-by-side (e.g., Date + Shift, Priority + Location)
- Auto-save indicator ("Draft saved") shown in form header

**Manager Dashboard (Desktop Only):**
- **3-column layout:**
  - Left: KPI summary cards + escalation alert
  - Centre: Live Issues Board (filterable)
  - Right: Last 3 shift reports with "View All" link
- All data visible above the fold on a 1280px screen at standard zoom
