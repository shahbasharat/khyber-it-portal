# Application Flow Documentation
## Khyber IT Operations Portal
### The Khyber Himalayan Resort & Spa — Gulmarg

**Version:** 1.1
**Owner:** IT Manager
**Date:** May 2026

---

## 1. Entry Points

### Direct URL
`https://khyber-it-portal.vercel.app`

First load → Login screen. If a valid session already exists (e.g., engineer left the tab open during shift) → redirected directly to Dashboard. No public-facing content; every route requires authentication.

### Deep Links

| Trigger | URL | Sent Via |
|---|---|---|
| Shift report reminder (30 min before shift end) | `/shift-report/new` | Email + In-App |
| Critical issue alert | `/issues/{id}` | Email + In-App |
| Escalation notification | `/escalations/{id}` | Email + In-App |
| Manager daily check link | `/dashboard` | Email (weekly summary) |
| Checklist incomplete reminder | `/checklist/today` | Email + In-App |

**Deep Link Authentication Behaviour:**
If a user follows a deep link while not logged in → redirected to `/login` with the destination URL stored in session → after successful login → automatically forwarded to the original deep link destination. The engineer does not need to navigate manually after logging in.

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
3. **First login check** →
   - IF this is the user's first login with a temporary password → redirect to `/account/set-password` (forced password change — no other screen accessible until complete)
   - IF not first login → proceed to role check
4. **Role check** →
   - Role = `ASSOCIATE` or `SENIOR_ASSOCIATE` → redirect to `/dashboard` (Full Write Shift Board)
   - Role = `MANAGER` → redirect to `/dashboard` (Full Manager/Admin Board + Admin Users access)
   - Role = `VIEWER` → redirect to `/dashboard` (Strictly Read-Only, no mutating actions, e.g. General Manager)
5. Dashboard loads with user's name displayed in top navigation

#### Error States

- **Wrong password** → inline error below password field: "Incorrect username or password" → fields remain filled → user retries
- **5 failed attempts** → account locked → error: "Account locked. Contact your IT Manager." → no retry shown → manager must unlock via admin panel
- **Server unreachable** → banner: "Cannot connect. Check your internet connection." + Retry button
- **Empty fields on submit** → inline validation: "Please enter your username" / "Please enter your password"
- **Deactivated account** → error: "Your account has been deactivated. Contact your IT Manager."

#### Edge Cases

- User follows a deep link (e.g., from an email notification) while not logged in → redirected to `/login` → after successful login → forwarded to the original deep link destination
- Session expires mid-shift → any tap or navigation shows modal: "Your session has expired. Please sign in again." → re-login → returned to the exact screen they were on
- User tries to access a manager-only route (e.g., `/admin/users`) while logged in as engineer → redirected to `/dashboard` with toast: "You don't have access to that page."

#### Exit Points

- **First login** → `/account/set-password` (forced password change)
- **Success (returning user)** → `/dashboard` (engineer or manager view depending on role)
- **Locked account** → static error screen with IT Manager contact details

---

### Flow 1A: First Login — Forced Password Change

**Goal:** Engineer sets a personal password on first login with a temporary password assigned by the manager
**Entry Point:** Login with temporary password → auto-redirected to `/account/set-password`

#### Happy Path

1. **Set Password Screen** → heading: "Welcome — Please set your password to continue"
2. Fields: New Password + Confirm Password
3. Password requirements shown inline: "Minimum 8 characters"
4. Engineer enters and confirms new password → taps "Set Password"
5. Password updated → engineer automatically redirected to their dashboard
6. Temporary password is invalidated — cannot be reused

#### Error States

- **Passwords don't match** → inline error: "Passwords do not match"
- **Password too short** → inline error: "Password must be at least 8 characters"
- **Same as temporary password** → inline error: "Please choose a different password"

#### Exit Points

- **Success** → `/dashboard`
- **Cannot skip** → no navigation away from this screen until password is set

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
4. Engineer taps "Add Note" on any item → small text box expands inline → types a quick observation (e.g., "Camera 3F offline — monitoring") → taps "Save Note" → note saved with timestamp; does not require a full issue ticket
5. Engineer continues rounds across resort, checking items off on mobile
6. Final item checked → banner: "Morning Checklist Complete — 12/12 ✓" → supervisor card on dashboard turns green
7. Engineer returns to Dashboard → Checklist card shows green "Complete"

#### Error States

- **Checkbox save fails (network blip)** → item reverts to unchecked → toast: "Couldn't save, retrying..." → auto-retries once → if still fails: "Check your internet connection"
- **Checklist fails to load** → error state shown: "Checklist unavailable" + Retry button
- **Checklist not yet configured** (manager hasn't set up items) → empty state: "No checklist items found. Ask your IT Manager to configure the checklist."
- **Note save fails** → toast: "Note couldn't be saved. Check your connection." + Retry button

#### Edge Cases

- **Engineer unchecks an item** → allowed freely within 5 minutes → after 5 minutes, uncheck requires a brief note: "Reason for unchecking?"
- **Shift ends with incomplete items** → incomplete items highlighted red → automatically carried forward to next shift with label: "⚠ Overdue from Morning Shift"
- **Two engineers on the same shift** → both can check items independently → all actions timestamped with individual names → last write wins → full log maintained
- **Manager deletes a checklist item mid-shift** → already-checked instances preserved in the shift log → item disappears from the active checklist immediately for any unchecked engineers → no data loss on completed checks

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
   - Guest Impacted: Yes / No (required)
   - Assign To: dropdown of 3 team members or "Unassigned"
   - Attachments: up to 3 files, JPEG/PNG/PDF, max 5MB each (optional)
3. **If Critical selected** → confirmation dialog: "Mark as Critical? This will alert the IT Manager immediately via Email and in-app notification." → Confirm / Cancel
4. Engineer taps "Submit Issue"
5. **Validation passes** → issue created with auto-generated ticket number (e.g., KHY-007) → timestamp auto-applied
6. **If Critical** → Email + in-app notification sent to manager immediately
7. Engineer redirected to **Issue Detail Screen** showing the new issue with Status: Open
8. Issue appears on the **Pending Issues Board** for all 3 team members instantly

#### Error States

- **Title blank on submit** → inline error: "Issue title is required" → form does not submit
- **Priority not selected** → inline error: "Please select a priority level"
- **Guest Impacted not selected** → inline error: "Please indicate if guests are affected"
- **Network offline on submit** → form data preserved in browser → toast: "You're offline. Issue will be submitted automatically when reconnected."
- **Duplicate detected** (same title within 24 hours) → warning: "A similar issue was logged today — KHY-005. View it?" → View button + Continue Anyway button
- **File too large** → inline error: "File exceeds 5MB limit. Please choose a smaller file."
- **Unsupported file type** → inline error: "Only JPEG, PNG, and PDF files are supported."

#### Edge Cases

- **Engineer navigates away mid-form** → browser warning: "Leave page? Your changes will be lost." → if confirmed, draft discarded
- **Critical selected → engineer changes mind** → can downgrade to High within 5 minutes of submission before notification is sent → after 5 minutes, only manager can change Critical priority → any priority change is logged in the issue audit trail
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
2. **Issue Detail Screen** → shows: full description, priority badge, location, guest impacted badge, assigned engineer, status, complete chronological notes thread
3. Engineer taps "Add Update" → text field expands → types progress note (e.g., "Called Oracle support. Vendor accessing remotely. ETA 6PM.")
4. Optionally attaches a file to the update note (same limits: 3 files, 5MB each, JPEG/PNG/PDF)
5. Taps "Save Note" → note saved with timestamp + author name → visible to all 3 team members
6. **Issue resolved** → Engineer taps "Mark Resolved" → confirmation dialog: "Mark KHY-007 as Resolved?" → Confirm
7. Engineer fills brief resolution note (required): "PMS restored after Oracle remote session. DB service restarted."
8. Status changes to **Resolved** → issue moves to archived Resolved section
9. **If Critical** → manager receives email + in-app notification: "✅ CRITICAL ISSUE RESOLVED — KHY-007 PMS Database Unreachable. Resolved by [Name] at 6:14 PM."

#### Error States

- **Empty note saved** → inline validation: "Please write a note before saving"
- **Note save fails** → toast: "Couldn't save note. Check your connection." + Retry button
- **Resolving without a resolution note** → inline error: "Please describe how this issue was resolved"
- **Resolving another engineer's assigned issue** → warning dialog: "This issue is assigned to [Name]. Resolve anyway?" → Confirm / Cancel

#### Edge Cases

- **Issue has no owner** → yellow "Unassigned" badge shown → "Assign to Me" button visible on detail screen
- **Manager reopens a resolved issue** → status reverts to Open → system note auto-added: "Reopened by IT Manager — [reason entered]"
- **Engineer tries to delete an issue** → deletion not permitted; issues can only be archived (resolved) or escalated
- **Priority changed after submission** → change logged automatically in the notes thread: "Priority changed from Critical to High by [Name] at [time]"

#### Exit Points

- **After adding a note** → stays on Issue Detail (updated note thread visible)
- **After resolving** → Issues Board (resolved issue no longer in active list)
- **Back button** → Issues Board

---

### Flow 5: Log an Escalation

**Goal:** Engineer formally escalates an unresolved issue to a vendor or external support
**Entry Point:** Issue Detail Screen → "Escalate Issue" button → `/issues/{id}/escalate`

#### Happy Path

1. **Issue Detail** (`/issues/{id}`) → Engineer taps "Escalate Issue"
2. **Escalation Form** → auto-fills: Incident ID, Issue Description from the linked ticket
3. Engineer fills:
   - Escalated To (vendor/contact name — required)
   - Contact Number (optional)
   - Vendor ETA (free text — e.g., "6PM today")
   - Current Status
   - Remarks
4. Taps "Submit Escalation"
5. Issue status automatically updates to "Escalated"
6. **Manager receives email + in-app notification immediately:** "🔺 ESCALATION — KHY-007 escalated to Oracle Hospitality Support by [Name] at 2:45 PM"
7. In-app notification badge updates on manager's dashboard instantly
8. Escalation appears as prominent card on Manager Dashboard

#### Error States

- **"Escalated To" field blank** → inline error: "Please specify who this issue is escalated to"
- **Network offline on submit** → form preserved → toast: "You're offline. Escalation will be submitted when reconnected."

#### Edge Cases

- **Manager wants to add remarks to escalation** → can add notes from their dashboard view
- **Engineer tries to escalate an already-escalated issue** → warning: "This issue is already escalated to [vendor]. Add an update instead?" → Update button + Escalate Anyway button

#### Exit Points

- **Success** → back to Issue Detail (now showing "Escalated" status badge)
- **Cancel** → Issue Detail (no escalation created)

---

### Flow 5A: Close an Escalation

**Goal:** Engineer or manager closes a resolved escalation with a vendor resolution note
**Entry Point:** Escalations Board → tap escalation → `/escalations/{id}` → "Close Escalation"

#### Happy Path

1. **Escalation Detail** → Engineer or manager taps "Close Escalation"
2. **Confirmation dialog** with required field: "Resolution Note — What did the vendor do to fix this?"
3. Engineer fills resolution note (e.g., "Oracle remote session — restarted DB service, cleared corrupted index")
4. Taps "Confirm Close"
5. Escalation status changes to **Resolved**
6. **Manager receives email + in-app notification:** "✅ ESCALATION CLOSED — KHY-007 Oracle Hospitality Support. Closed by [Name]."
7. Parent issue status **does not** auto-resolve — engineer must separately go to the Issue Detail and mark it Resolved

#### Error States

- **Resolution Note blank** → inline error: "Please describe what the vendor did to resolve this" → cannot close without note

#### Edge Cases

- **Manager closes escalation from dashboard** → same flow, same required resolution note
- **Engineer closes escalation but forgets to resolve parent issue** → Issue Detail still shows "Escalated" status with a yellow banner: "The related escalation was closed. Has this issue been resolved?"

#### Exit Points

- **Success** → Escalations Board (closed escalation moves to Resolved section)
- **Cancel** → Escalation Detail (no change)

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
   - Shift Summary row: auto-calculated (Total Incidents, Resolved, Pending, Critical Alerts, Downtime, Escalations, Guest-Impacted Issues)
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
- **Duplicate report for same shift/date** → "A report was already submitted for this shift at [time]. Replace it?" → Confirm replaces (with auto-note: "Re-submitted at [time]") / Cancel keeps original

#### Edge Cases

- **30 minutes before shift end — no report submitted** → email + in-app reminder sent to engineer: "⏰ Your shift ends in 30 minutes. Please submit your shift report."
- **Session expires mid-form** → form data saved in browser local storage → on re-login: "You have an unsaved shift report. Restore it?" → Yes restores all fields / No discards
- **Report submitted after shift end time** → attributed to the outgoing shift (not the clock time) → note added automatically: "Submitted [X minutes] after shift end"
- **No issues logged during shift** → report still valid → Shift Summary shows zeros → system note: "No issues logged this shift"

#### Exit Points

- **Success** → Dashboard with "Morning Shift Report Submitted ✓" banner (auto-dismisses in 6 seconds)
- **Cancel** → Dashboard (no data saved)

---

### Flow 7: View Shift Report History

**Goal:** Manager or engineer browses past shift reports by date or shift
**Entry Point:** Dashboard → "Shift Reports" link → `/shift-report/history`

#### Happy Path

1. **Report History Screen** → list of all submitted reports, sorted newest first
2. Each row shows: Date, Shift (Morning / Afternoon badge), Submitted By, Time submitted
3. Engineer or manager taps any report → **Report Detail Screen** (`/shift-report/{id}`)
4. Full formatted report displayed: all auto-filled fields + handover notes + summary stats
5. Manager can filter list by: Date range, Shift (Morning / Afternoon), Engineer name
6. Search bar at top accepts a date (e.g., "12 May") or engineer name

#### Error States

- **History fails to load** → skeleton list shown → Retry button
- **No reports yet** → empty state: "No shift reports submitted yet."

#### Edge Cases

- **Engineer views another engineer's report** → full report visible (read-only for all)
- **Manager searches for a specific date with no report** → empty state: "No report submitted for [date] [shift]" with note: "This shift had no report submitted."

#### Exit Points

- **Back from Report Detail** → Report History list (scroll position preserved)
- **Back from History** → Dashboard

---

### Flow 8: Manager Reviews Dashboard

**Goal:** IT Manager gets a complete operational picture in under 60 seconds — no calls needed
**Entry Point:** Login → auto-routed to Manager Dashboard → `/dashboard`

#### Happy Path

1. **Manager Dashboard** loads with status cards:
   - **Checklist:** "Morning — 10/12 complete"
   - **Open Issues:** "2 open (1 Critical, 1 Guest Impacted)"
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

### Flow 9: Logout

**Goal:** Engineer or manager ends their session securely
**Entry Point:** Sidebar (desktop) or Account tab (mobile) → "Log Out" button

#### Happy Path

1. User taps "Log Out"
2. **Confirmation dialog:** "Log out of Khyber IT Portal?" → Confirm / Cancel
3. On Confirm:
   - JWT access token cleared from memory (Zustand store reset)
   - Refresh token deleted from database
   - httpOnly cookie cleared
   - User redirected to `/login`
4. Login screen shown — no back-navigation possible (history cleared)

#### Edge Cases

- **Engineer logs out mid-shift without submitting report** → if it's within 30 minutes of shift end and no report submitted → additional warning before logout: "⚠ You haven't submitted your shift report. Log out anyway?" → Log Out Anyway / Go Back
- **Session already expired before logout tapped** → logout completes silently (token already invalid) → redirected to login
- **On shared IT desk laptop** → engineer should always log out after shift; a reminder banner appears on dashboard during the last 15 minutes of a shift: "Remember to log out when handing over the desk."

#### Exit Points

- **Success** → `/login`
- **Cancel** → returns to whatever screen the user was on

---

### Flow 10: Notification Centre

**Goal:** Engineer or manager views, acts on, and dismisses in-app notifications
**Entry Point:** Bell icon in top navigation → notification panel slides open

#### Happy Path

1. **Bell icon** in navigation shows a red badge with unread count (e.g., "3")
2. User taps bell → **Notification Panel** slides in from the right (desktop) or appears as a bottom sheet (mobile)
3. Panel shows notifications grouped by today vs. earlier, newest first
4. Each notification shows:
   - Icon (🚨 Critical / 🔺 Escalation / 📋 Report / ⏰ Reminder / ✅ Resolved)
   - Title and brief message
   - Time ago (e.g., "12 minutes ago")
   - Tappable — navigates to the linked screen (issue, escalation, or report)
5. Tapping any notification → marks it as read → navigates to linked screen
6. "Mark all as read" button at top of panel → clears red badge → all notifications marked read without navigating
7. Notifications older than 90 days are auto-removed from the panel

#### Error States

- **Notifications fail to load** → panel shows: "Couldn't load notifications." + Retry button

#### Edge Cases

- **User taps a notification linked to a deleted or archived item** → toast: "This item is no longer available." → notification marked as read
- **New notification arrives while panel is open** → panel refreshes silently and prepends the new notification at the top
- **All notifications read** → panel shows: "You're all caught up ✓" with the Khyber stag illustration centred

#### Exit Points

- **Tap notification** → linked screen (notification marked read)
- **Tap outside panel or "Close"** → panel closes, badge updated to remaining unread count

---

### Flow 11: Admin Panel — Manage Users

**Goal:** Manager creates, edits, unlocks, and deactivates user accounts
**Entry Point:** Left sidebar → Admin → Users → `/admin/users`

#### Happy Path — Create User

1. **Users Screen** → list of all accounts with name, role, status badges
2. Manager taps "+ Add User"
3. **Add User form:** Full Name, Role (Manager / Senior Associate / Associate / Viewer), Temporary Password
4. Taps "Create User" → new account created → appears in list with "Active" badge
5. Manager verbally tells the new engineer their temporary password → engineer logs in and is forced to change it on first login

#### Happy Path — Reset Password

1. Manager taps a user in the list → user detail opens
2. Taps "Reset Password" → form: New Temporary Password + Confirm
3. Taps "Save" → password updated → any active sessions for that user are immediately invalidated
4. Manager verbally communicates the new temporary password → engineer logs in and is forced to set a new one

#### Happy Path — Unlock Account

1. Manager sees the locked user in the list with a red "Locked" badge
2. Taps the user → taps "Unlock Account"
3. Confirmation: "Unlock account for [Name]?" → Confirm
4. Account unlocked immediately → badge changes to "Active" → engineer can retry login

#### Happy Path — Deactivate Account

1. Manager taps a user → taps "Deactivate Account"
2. Warning dialog: "Deactivating [Name] will immediately end all their active sessions. They will not be able to log in. Continue?" → Confirm / Cancel
3. On Confirm → account deactivated → all sessions invalidated → user sees "Your account has been deactivated" on next page load

#### Error States

- **Duplicate username** → inline error: "This username is already taken."
- **Password too short on creation** → inline error: "Password must be at least 8 characters."
- **Deactivating yourself (manager)** → blocked: "You cannot deactivate your own account."

#### Exit Points

- **After any action** → returns to Users list with success toast (e.g., "Account unlocked ✓")
- **Cancel** → Users list (no change)

---

### Flow 12: Admin Panel — Manage Checklist Items

**Goal:** Manager adds, edits, reorders, or removes items from the daily checklist
**Entry Point:** Left sidebar → Manage Checklist → `/checklist/manage`

#### Happy Path — Add Item

1. **Checklist Manager Screen** → list of all current items with shift assignment badges
2. Manager taps "+ Add Item"
3. **Add Item form:** Item Name, Category (Network / Systems / Guest Services / Peripherals), Shift Assignment (Morning only / Afternoon only / Both shifts)
4. Taps "Save" → item added to the live checklist immediately
5. New item appears unchecked for all engineers in the relevant shift(s)

#### Happy Path — Edit Item

1. Manager taps any item in the list → "Edit" option appears
2. Edits name, category, or shift assignment → taps "Save"
3. Change applies from the next shift onwards — current shift is not affected

#### Happy Path — Delete Item

1. Manager taps any item → "Delete" option appears
2. Warning: "Deleting this item removes it from all future checklists. Already-completed instances are preserved in shift logs. Continue?" → Confirm / Cancel
3. On Confirm → item removed from live checklist immediately → historical logs unchanged

#### Error States

- **Item name blank** → inline error: "Item name is required."
- **Duplicate item name** → inline error: "An item with this name already exists."

#### Exit Points

- **After any action** → stays on Checklist Manager with success toast
- **Cancel** → Checklist Manager (no change)

---

### Flow 13: Admin Panel — Shift Time Configuration

**Goal:** Manager configures or adjusts shift start and end times — e.g., for seasonal changes
**Entry Point:** Left sidebar → Admin → Settings → Shift Times → `/admin/settings`

#### Happy Path

1. **Settings Screen** → "Shift Times" section
2. Two rows: Morning Shift and Afternoon Shift
3. Each row has: Start Time (time picker) + End Time (time picker)
4. Manager adjusts times → taps "Save Shift Times"
5. Change applies from the next calendar day — current active shifts are not disrupted
6. Success toast: "Shift times updated. Changes take effect from tomorrow."

#### Error States

- **End time before start time** → inline error: "End time must be after start time."
- **No overlap between shifts** → warning (not a block): "Warning: These shift times have no overlap. Engineers will have no handover period."
- **Shifts cover less than 16 hours of the day** → warning: "These shifts leave [X] hours uncovered between 8AM–10PM."

#### Exit Points

- **Success** → Settings screen with success toast
- **Cancel** → Settings screen (no change)

---

### Flow 14: Change Own Password

**Goal:** Any user updates their own password from their account settings
**Entry Point:** Navigation → Account icon → "Change Password" → modal popup

#### Happy Path

1. User taps account icon in navigation → "Change Password"
2. **Modal:** Current Password, New Password, Confirm New Password
3. User fills all fields → taps "Update Password"
4. System validates current password → if correct → updates password → invalidates all other active sessions
5. Success toast: "Password updated. You've been logged out of other devices."

#### Error States

- **Current password wrong** → inline error: "Current password is incorrect."
- **New password too short** → inline error: "Password must be at least 8 characters."
- **Passwords don't match** → inline error: "Passwords do not match."
- **Same as current password** → inline error: "New password must be different from your current password."

#### Exit Points

- **Success** → modal closes, user remains on current screen
- **Cancel** → modal closes, no change

---

### Flow 15: Search Issues

**Goal:** Engineer or manager finds a specific issue by ticket number, keyword, or filter
**Entry Point:** Issues Board → Search bar at top → or filter panel

#### Happy Path — Keyword / Ticket Search

1. **Issues Board** → user taps the search bar at the top
2. Types a keyword (e.g., "Wi-Fi", "printer") or ticket number (e.g., "KHY-047")
3. Results update in real time as the user types (debounced — 300ms delay)
4. Matching issues shown — title, ticket number, priority badge, and status
5. User taps any result → opens Issue Detail

#### Happy Path — Filter Panel

1. User taps "Filter" button → Filter Panel opens (bottom sheet on mobile, inline bar on desktop)
2. Available filters: Priority / Status / Department / Date Range / Engineer / Guest Impacted
3. User selects one or more filters → taps "Apply"
4. Issues Board updates to show only matching results
5. Active filter count shown on the Filter button: "Filter (2)"
6. "Clear All" button removes all active filters

#### Error States

- **No results found** → empty state: "No issues match your search. Try different keywords or clear your filters." + "Clear Search" button
- **Search fails (network)** → toast: "Search unavailable. Check your connection." + Retry

#### Edge Cases

- **Searching in archived/resolved issues** → toggle at top of board: "Active Issues" / "Resolved Issues" — search applies to whichever view is active
- **Ticket number search (e.g., KHY-047)** → auto-navigates directly to that Issue Detail without showing a results list

#### Exit Points

- **Tap a result** → Issue Detail
- **Clear search / filters** → full Issues Board restored

---

### Flow 16: Viewer Dashboard (General Manager)

**Goal:** A read-only user (GM) gets a quick top-level status view with no risk of accidentally modifying data
**Entry Point:** Login as Viewer → auto-routed to `/dashboard` (Read-Only mode)

#### Happy Path

1. **Viewer Dashboard** loads — identical data to Engineer/Manager dashboard but with all action buttons, forms, FABs, and edit controls hidden
2. Status cards visible (read-only):
   - Checklist completion for current shift
   - Open issues count (with guest-impacted count)
   - Active escalations
   - Last shift report (time ago)
3. Viewer can tap "Open Issues" → sees Issues Board in read-only mode (no "+ New Issue" button, no "Resolve", no "Add Update")
4. Viewer can tap any issue → reads full detail and notes thread (no action buttons visible)
5. Viewer can browse Shift Reports history → reads any report in full
6. Viewer cannot access: Checklist (no checkbox controls), Admin Panel, any form

#### Error States

- Same as Manager Dashboard error states — data load failures handled identically

#### Edge Cases

- **Viewer tries to navigate to `/issues/new` directly via URL** → redirected to `/dashboard` with toast: "You don't have access to that page."
- **Viewer's session expires** → same session expiry modal as all other roles → re-login → returned to Viewer dashboard

#### Exit Points

- All exits are read-only navigations between views
- Logout → `/login`

---

## 3. Navigation Map

```
/login
│
├── /account/set-password          ← First login forced password change
│
├── /dashboard  [Engineer / Senior Associate View]
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
│       └── /account/profile       ← Change password (modal)
│
├── /dashboard  [Manager View]
│   ├── /dashboard/overview          ← KPI cards + team health summary
│   ├── /issues                      ← full board, all engineers visible
│   │   └── /issues/{id}
│   ├── /shift-report/history        ← all reports, all dates, all engineers
│   │   └── /shift-report/{id}
│   ├── /escalations                 ← all active + resolved escalations
│   │   └── /escalations/{id}
│   ├── /assets                      ← all asset activity log entries
│   ├── /checklist/manage            ← add / edit / remove checklist items
│   └── /admin
│       ├── /admin/users             ← manage accounts, unlock, reset passwords
│       └── /admin/settings          ← shift times, notification recipient
│
└── /dashboard  [Viewer View]
    ├── /issues                      ← read-only
    │   └── /issues/{id}             ← read-only
    ├── /shift-report/history        ← read-only
    │   └── /shift-report/{id}       ← read-only
    └── /escalations                 ← read-only
        └── /escalations/{id}        ← read-only
```

---

## 4. App Flow Summary Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN                                    │
│                    /login                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────────┐
         │             │                 │
    First Login    Engineer          Manager / Viewer
         │         Dashboard          Dashboard
         ▼             │                 │
  Set Password    ┌────┼────┐       ┌────┼────────┐
  /account/       │    │    │       │    │        │
  set-password    ▼    ▼    ▼       ▼    ▼        ▼
                Check  Issues Shift  Issues  Reports  Admin
                list  Board  Report  Board   History  Panel
                  │     │      │       │       │       │
                  ▼     ▼      ▼       ▼       ▼       ▼
               Item  Issue   Log    Issue   Report  Users /
               Check Detail Submit Detail   Detail  Settings
                       │
                       ▼
                  Escalation
                    Form
                       │
                       ▼
                  Escalation
                    Detail
                       │
                       ▼
                Close Escalation
                (+ Resolution Note)
```

---

## 5. Screen Inventory

| Screen | Route | Access | Purpose | Key UI Elements | State Variants |
|---|---|---|---|---|---|
| Login | `/login` | Public | Authenticate user | Username field, password field, Sign In button, Khyber logo | Default, Loading, Error, Locked |
| Set Password | `/account/set-password` | All (first login only) | Force password change on first login | New Password, Confirm Password, Set Password button | Default, Validation error, Success |
| Engineer Dashboard | `/dashboard` | Engineer | Daily overview and quick actions | Checklist card, Issues card, Report button, "+ New Issue" FAB, shift name header | Loading, All-clear, Warning (amber) |
| Manager Dashboard | `/dashboard` | Manager | Team health overview | 4 KPI cards, Escalation highlight, Guest Impact count, last report time | Loading, All-clear, Alert (gold pulse) |
| Viewer Dashboard | `/dashboard` | Viewer | Read-only status view | Same KPI cards as Manager, no action buttons | Loading, All-clear, Alert |
| Checklist | `/checklist/today` | Engineer | Complete 12 shift tasks | Grouped task list, checkboxes, inline notes, progress bar | Loading, In-progress, Complete, Error |
| Issues Board | `/issues` | All | View all pending issues | Issue cards, priority badges, filter bar, search, Guest Impact badges | Loading, Empty, Filtered, Read-only (Viewer) |
| New Issue Form | `/issues/new` | Engineer + Manager | Log a new resort IT issue | Title, description, priority, location, Guest Impacted toggle, assignee, attachments | Default, Validation error, Submitting, Duplicate warning |
| Issue Detail | `/issues/{id}` | All | View and update one issue | Full details, notes thread, Add Update, Resolve, Escalate, priority audit trail | Loading, Active, Escalated, Resolved, Read-only (Viewer) |
| Escalation Form | `/issues/{id}/escalate` | Engineer + Manager | Formally escalate an issue | Auto-filled issue info, Escalated To, contact, ETA, status, remarks | Default, Validation error, Submitting |
| Escalation Detail | `/escalations/{id}` | All | View/update/close one escalation | Full escalation info, update notes, Close Escalation button, link to parent issue | Loading, Active, Closed |
| Escalations Board | `/escalations` | All | View all escalations | Escalation cards, status badges, linked ticket numbers | Loading, Empty, Active |
| Shift Report Form | `/shift-report/new` | Engineer + Manager | Submit end-of-shift report | Auto-filled summary, issues sections, Handover Notes, Preview button | Default, Draft restored, Submitting, Duplicate warning |
| Report History | `/shift-report/history` | All | Browse past shift reports | Date-grouped list, Morning/Afternoon badges, search by date or engineer | Loading, Empty, Populated |
| Report Detail | `/shift-report/{id}` | All | Read a submitted report | Full formatted report, submitter name, timestamp, shift badge, guest-impacted count | Loading, Full report view |
| Asset Activity Form | `/assets/new` | Engineer + Manager | Log hardware/device activity | Asset Name, Asset Type, Location, Action Performed, Action Details, linked issue | Default, Validation, Submitting |
| Asset Log | `/assets` | All | View all asset activity | Table of entries, sortable columns, search by asset name or type | Loading, Empty, Populated |
| Checklist Manager | `/checklist/manage` | Manager | Add/edit/remove checklist items | Item list with shift assignments, Add Item form, Edit/Delete controls | Loading, Empty, Edit mode |
| Admin — Users | `/admin/users` | Manager | Manage user accounts | User list with Locked/Active badges, Add User, Reset Password, Unlock, Deactivate | Loading, Populated |
| Admin — Settings | `/admin/settings` | Manager | Configure shift times and notification recipient | Shift time pickers, notification email field | Default, Edit mode, Saved |
| Notification Centre | Panel / bottom sheet | All | View and dismiss in-app notifications | Notification list grouped by date, Mark All Read button, notification icons | Loading, Populated, All-read ("You're all caught up ✓") |
| Change Password | Modal | All | Update own password | Current Password, New Password, Confirm Password | Default, Validation error, Success |

---

## 6. Decision Points

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

IF viewer tries to access any mutating route (/issues/new, /shift-report/new, etc.)
  → redirect to /dashboard with toast: "You don't have access to that page."

═══════════════════════════════════════════════════
ON LOGIN SUCCESS
═══════════════════════════════════════════════════
IF user.isFirstLogin == true
  → redirect to /account/set-password (forced password change)
  → no other screen accessible until password is changed

IF user.role == "manager"
  → /dashboard (Manager view with KPI cards)

IF user.role == "engineer" OR "senior_associate"
  → /dashboard (Engineer view with checklist + issues + report button)

IF user.role == "viewer"
  → /dashboard (Viewer view — read-only, no action buttons)

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
ON PRIORITY CHANGE — POST SUBMISSION
═══════════════════════════════════════════════════
IF time since submission < 5 minutes
  → any engineer can change priority freely
  → change logged in issue audit trail

IF time since submission >= 5 minutes
  → only manager can change priority
  → engineer sees priority field as read-only
  → manager change logged in issue audit trail

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
ON LOGOUT — SHIFT REPORT CHECK
═══════════════════════════════════════════════════
IF engineer attempts to log out
  AND current time is within 30 minutes of shift end
  AND no shift report submitted
  → show additional warning: "⚠ You haven't submitted your shift report. Log out anyway?"
  → Log Out Anyway / Go Back to Submit Report

IF shift report already submitted OR more than 30 minutes before shift end
  → standard logout confirmation only

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
ON ESCALATION CLOSED
═══════════════════════════════════════════════════
  → send Email to manager: "✅ ESCALATION CLOSED — [title]"
  → send In-App notification to manager
  → escalation archived in Resolved section
  → parent issue status does NOT auto-change — engineer must manually resolve

═══════════════════════════════════════════════════
ON CRITICAL ISSUE RESOLVED
═══════════════════════════════════════════════════
  → send Email to manager: "✅ CRITICAL RESOLVED — [title]"
  → send In-App notification to manager
  → issue archived in Resolved section
  → manager dashboard open issues count decrements
```

---

## 7. Error Handling Flows

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
| Notification Centre | "You're all caught up ✓" | None |
| Report History (no match) | "No report found for [date] [shift]." | "Clear Search" button |

---

## 8. Responsive Behavior

### Mobile (Phone — Used During Resort Rounds)
*Breakpoint: screens < 768px*

**Navigation:**
- Fixed **bottom tab bar** with 4 icons: Dashboard, Checklist, Issues, Report
- No hamburger menu — bottom nav is always visible and always accessible
- Notification badge (red dot) on tab icons when there are unread alerts

**Dashboard:**
- Cards stack vertically, full device width
- "+ New Issue" is a **floating action button (FAB)** — gold circle, bottom-right corner, always visible (hidden for Viewer role)
- Shift name and date shown in top header bar

**Checklist:**
- Items shown full-width in a single column
- **Checkbox tap target minimum 48×48px** — entire row is tappable, not just the checkbox icon
- "Add Note" button appears inline below each item when tapped — text box expands to fill available width
- Category headers are collapsible (tap to collapse checked categories)
- Progress bar pinned to top of screen while scrolling

**Issues Board:**
- List view only (no card grid)
- Each issue row shows: priority badge, guest impact icon, title, location, time ago
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

**Notification Centre:**
- Opens as a **bottom sheet** sliding up from the bottom of the screen
- Full-width, scrollable list
- "Mark All Read" button pinned at the top of the sheet

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
  - Notification bell (top right of sidebar header)
  - Account / Logout (bottom of sidebar)

**Dashboard:**
- **2×2 KPI card grid** for Engineer view
- **3-column layout** for Manager view: KPI cards | Issues Board | Report Log

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
  - Left: KPI summary cards + escalation alert + guest impact count
  - Centre: Live Issues Board (filterable)
  - Right: Last 3 shift reports with "View All" link

**Notification Centre:**
- Opens as a **right-side panel** sliding in from the right
- Fixed width (380px), scrollable list
- Does not push the main content — overlays with a dark backdrop
