# Product Requirements Document (PRD)
## Khyber IT Operations Portal
### The Khyber Himalayan Resort & Spa — Gulmarg

**Version:** 1.1
**Owner:** IT Manager
**Date:** May 2026
**Built With:** Claude + Antar Gravity

---

## 1. Product Overview

| Field | Details |
|---|---|
| Project Title | Khyber IT Operations Portal |
| Version | 1.1 MVP |
| Owner | IT Manager, The Khyber Himalayan Resort & Spa |
| Location | Gulmarg, Jammu & Kashmir |
| Team Size | 2 IT Engineers + 1 IT Manager |
| Platform | Web app — desktop + mobile browser |
| Primary Deployment | Vercel (frontend) + Render (backend) + Supabase (PostgreSQL database) — 100% Free |
| Build Approach | AI-assisted (Claude + Antar Gravity) — no traditional developer |

---

## 2. Problem Statement

The Khyber IT team of 3 manages all technology across a luxury 5-star resort in Gulmarg — covering guest Wi-Fi, CCTV, PMS (Property Management System), PABX phones, printers, in-room entertainment, and internal servers. With only 2 engineers on rotating shifts and 1 manager, operations currently run on verbal handovers and group chats, causing:

- **No written record** of what was completed or left pending per shift
- **Zero manager visibility** without calling an engineer directly
- **Missed recurring tasks** (Wi-Fi health check, CCTV check, server backup) during busy resort periods
- **Guest-impacting IT issues** not formally tracked or escalated
- **No audit trail** when management asks "what happened to the internet last night?"
- **No structured handover** — incoming engineer has no context without a phone call

---

## 3. Goals & Objectives

### Business Goals

- Eliminate verbal-only shift handovers — 100% of shifts have a written record within 30 days of launch
- Give IT Manager real-time visibility from any device without calling the team
- Create a 12-month audit trail of all IT activity at the resort
- Reduce guest-impacting IT incidents caused by missed routine checks by 80%
- Ensure all critical issues are escalated to the manager within 15 minutes of logging

### User Goals

- Engineers start their shift knowing exactly what was left pending by the previous shift
- Engineers complete their end-of-shift report in under 5 minutes
- Manager sees full team health status in under 1 minute without messaging anyone
- Recurring checklist tasks are never forgotten during a busy resort day

---

## 4. Success Metrics

1. **100%** of shifts have a submitted shift report before handover within 30 days of launch
2. **95%** daily checklist completion rate achieved within the first month
3. **Zero** pending issues go unacknowledged for more than 4 hours
4. **Zero** status-check messages from manager within 60 days — all status visible in-app
5. **100%** of guest-impacting IT incidents are traceable in the system within 24 hours

### How Metrics Are Measured

| Metric | Where It Is Visible |
|---|---|
| Shift report submission rate | Manager Dashboard → Weekly Summary card (last 7 days) |
| Checklist completion rate | Manager Dashboard → KPI card + Weekly Summary Report (V1.1) |
| Issues unacknowledged > 4 hrs | Manager Dashboard → Open Issues card with "(X overdue)" label |
| Guest-impacting incidents | Issues Board → filter by "Guest Impacted: Yes" |
| Manager status-check messages | Tracked informally by manager for 60 days post-launch |

---

## 5. Target Users & Personas

### Persona 1 — IT Engineer (Primary Daily User)

- **Who:** 2 engineers, rotating Morning (8AM–5PM) and Afternoon (1PM–10PM) shifts
- **Devices:** Phone during resort rounds, laptop at the IT desk
- **Technical Proficiency:** Medium — comfortable with web apps and smartphones
- **Pain Points:**
  - Doesn't know what the previous shift left unresolved without calling them
  - Forgets recurring tasks during busy resort periods (high occupancy, events)
  - No formal record when management asks what happened during their shift
  - Escalation paths unclear when an issue goes beyond their ability to fix
- **Goals:**
  - Complete shift cleanly with everything documented
  - Hand over to the next engineer without a phone call
  - Log issues quickly without a complex form

### Persona 2 — IT Manager (Oversight User)

- **Who:** 1 manager, daytime oversight, not on a fixed shift
- **Devices:** Laptop in office, phone when away from desk
- **Technical Proficiency:** Medium — reviews data, does not fill in daily forms
- **Pain Points:**
  - Has to call engineers to know what's happening
  - No historical data when reporting to hotel management
  - Critical issues reach them too late via informal messages
  - No visibility of whether checklists are being completed
- **Goals:**
  - See team health at a glance from any device
  - Be notified immediately when something critical happens
  - Have a 12-month log to show hotel management if needed

### Persona 3 — General Manager / Viewer (Read-Only User)

- **Who:** Hotel General Manager or senior hotel management — occasional viewer
- **Devices:** Laptop or phone
- **Technical Proficiency:** Low to medium — reads data only, never inputs anything
- **Pain Points:**
  - Has to ask IT Manager for verbal status updates
  - No way to verify IT incidents were handled without calling someone
- **Goals:**
  - See a clean top-level status view on demand
  - Confirm that guest-impacting issues were resolved and logged

---

## 6. Role Permissions

All users are assigned one of four roles. Permissions are enforced on both frontend (UI) and backend (API middleware).

| Feature | Manager | Senior Associate | Associate | Viewer |
|---|---|---|---|---|
| View Dashboard | ✅ | ✅ | ✅ | ✅ (read-only) |
| View Issues Board | ✅ | ✅ | ✅ | ✅ (read-only) |
| View Shift Reports | ✅ | ✅ | ✅ | ✅ (read-only) |
| View Asset Log | ✅ | ✅ | ✅ | ✅ (read-only) |
| View Escalations | ✅ | ✅ | ✅ | ✅ (read-only) |
| Complete Checklist Items | ✅ | ✅ | ✅ | ❌ |
| Log New Issue | ✅ | ✅ | ✅ | ❌ |
| Update / Resolve Issue | ✅ | ✅ | ✅ | ❌ |
| Log Escalation | ✅ | ✅ | ✅ | ❌ |
| Submit Shift Report | ✅ | ✅ | ✅ | ❌ |
| Log Asset Activity | ✅ | ✅ | ✅ | ❌ |
| Change Priority (after 5 min) | ✅ only | ❌ | ❌ | ❌ |
| Reopen Resolved Issue | ✅ only | ❌ | ❌ | ❌ |
| Edit Checklist Items | ✅ only | ❌ | ❌ | ❌ |
| Manage Users / Accounts | ✅ only | ❌ | ❌ | ❌ |
| Unlock Locked Accounts | ✅ only | ❌ | ❌ | ❌ |
| Reset Any User's Password | ✅ only | ❌ | ❌ | ❌ |
| Configure Shift Times | ✅ only | ❌ | ❌ | ❌ |
| Configure Notification Recipients | ✅ only | ❌ | ❌ | ❌ |
| Access Admin Panel | ✅ only | ❌ | ❌ | ❌ |

**Notes:**
- Viewer role sees all data but has no buttons, forms, or actions available — the UI renders in strict read-only mode
- Senior Associate and Associate have identical permissions at MVP — Senior Associate distinction is for display and future role expansion only
- Manager can perform all engineer actions in addition to admin actions

---

## 7. Features & Requirements

### P0 — Must Have (MVP)

---

#### Feature 1: Daily Operations Checklist

**Description:**
A shift-specific checklist of recurring IT tasks tailored to a hospitality environment. Pre-loaded with 12 resort-relevant items from the existing Excel template. Resets each shift. Incomplete items carry forward with a warning.

**User Story:**
As an IT engineer, I want to see my shift's task list and mark items complete with one tap, so that no routine check is missed during a busy resort day.

**Pre-loaded Checklist Items:**
- Server Health Check
- Backup Verification
- Internet / WAN Connectivity
- Firewall Status
- VPN Connectivity
- Email Services (Exchange / Mail Server)
- Database Connectivity (PMS Database)
- Wi-Fi Access Points (Guest + Staff)
- CCTV System Check
- PABX / Phone System Check
- PMS (Property Management System) Status
- Printer / Peripheral Status

**Shift Overlap Behaviour (1PM–5PM):**
Morning and Afternoon shifts overlap for 4 hours. During this period:
- Each engineer sees and owns only their own shift's checklist
- Morning checklist is labelled "Morning Shift" and Afternoon checklist is labelled "Afternoon Shift"
- Both checklists are visible on the dashboard during overlap, clearly separated
- Checklist ownership is tied to the shift, not the clock time — an engineer who logged in for Morning shift owns the Morning checklist regardless of what time they check items
- The shift report is tied to the person submitting it, not the overlap period

**Acceptance Criteria:**
- [ ] Checklist loads automatically for the current shift (Morning / Afternoon) based on login time
- [ ] Each item is checkable with a single tap on mobile (minimum 48px tap target)
- [ ] Each item has an optional "Add Note" field — one tap expands a small text box for quick observations that don't warrant a full issue ticket
- [ ] Checking an item auto-records: timestamp + logged-in engineer's name
- [ ] Progress bar updates in real time as items are checked
- [ ] Incomplete items at shift end are flagged red and carry forward to the next shift with label "Overdue from [Morning/Afternoon] Shift"
- [ ] Manager can add, edit, or remove checklist items from the admin panel
- [ ] When a checklist item is deleted mid-shift by the manager, any already-checked instances of that item are preserved in the shift log — only future shifts stop showing the item
- [ ] Checklist resets automatically at each shift start time

**Success Metric:** 95% checklist completion rate per shift within 30 days

---

#### Feature 2: Pending Issues Tracker

**Description:**
A live shared board of all open IT issues across the resort, visible to all 3 team members simultaneously. Based directly on the "Issues Faced During Shift" and "Pending/In-Progress Issues" sections of the existing Excel template.

**User Story:**
As an IT engineer starting my shift, I want to see all open issues and their current status, so I can pick up exactly where the previous engineer left off without making a phone call.

**Fields per Issue (matching existing Excel template):**
- Ticket No (auto-generated: KHY-001, KHY-002…)
- Issue Description
- Priority: Critical / High / Medium / Low
- Department / Location (Front Desk / Guest Room / Restaurant / Spa / Server Room / Conference Room / Staff Area / Other)
- Status: Open / In Progress / Resolved / Escalated
- **Guest Impacted: Yes / No** *(required field — used for audit trail and GM reporting)*
- Assigned To
- Start Time (auto-stamped)
- Escalated To (vendor name, manager, or external support)
- ETA
- Progress Notes (threaded updates)
- Attachments (screenshots / photos — max 3 files, JPEG/PNG/PDF, max 5MB each)

**Priority Change Audit Trail:**
Every change to an issue's priority is logged automatically with: who changed it, previous priority, new priority, and timestamp. This log is visible in the issue's notes thread. After 5 minutes, only the Manager can change a Critical priority.

**Acceptance Criteria:**
- [ ] Any engineer can log a new issue in under 60 seconds
- [ ] All 3 team members see the same live board simultaneously
- [ ] Issues unresolved for 4+ hours are automatically highlighted with a gold border
- [ ] Critical priority issues trigger an immediate email + in-app notification to the manager
- [ ] Resolved issues move to a searchable archive — never permanently deleted
- [ ] Each issue maintains a full audit trail of all updates and priority changes with timestamps and author names
- [ ] Issues can be filtered by: Priority / Status / Department / Date / Engineer / Guest Impacted
- [ ] Up to 3 file attachments (JPEG, PNG, PDF) per issue, max 5MB each, stored via Cloudinary
- [ ] Attachments can be added on issue creation or in any subsequent update note

**Success Metric:** Zero issues unacknowledged for more than 4 hours

---

#### Feature 3: Shift Report

**Description:**
A structured end-of-shift form the outgoing engineer submits before handover. Maps exactly to the existing Excel template — same sections, digitised and auto-populated from the shift's live data.

**User Story:**
As an outgoing IT engineer, I want to submit a formal shift report in under 5 minutes, so the incoming engineer has full written context without needing a phone call from me.

**Form Fields (from existing Excel template):**
- Report Date (auto)
- Shift (auto-detected from login time: Morning / Afternoon)
- Prepared By (auto from logged-in user)
- Team Members On Duty (free text)
- Designation (auto from profile)
- **Shift Summary** (auto-calculated): Total Incidents / Resolved / Pending / Critical Alerts / Downtime (minutes) / Escalations / Users Supported
- Issues Faced During Shift (auto-pulled from Issues Tracker)
- Resolved Issues (auto-pulled from resolved items)
- Pending / In-Progress Issues (auto-pulled from open items)
- Handover Notes for Incoming Shift (free text — only field requiring manual input)

**Acceptance Criteria:**
- [ ] Form auto-fills all summary data from the shift's checklist and issue tracker data
- [ ] Engineer only needs to write the Handover Notes section manually
- [ ] Submitted report is instantly visible to the incoming engineer pinned at the top of their dashboard
- [ ] Manager receives an email + in-app notification the moment a report is submitted
- [ ] All reports are searchable by date and shift
- [ ] If no report is submitted 30 minutes before shift end, engineer receives an automatic email + in-app reminder
- [ ] Report cannot be deleted — only superseded by a re-submission with a note: "Re-submitted at [time]"

**Success Metric:** 100% of shifts have a submitted report before handover

---

#### Feature 4: Asset Activity Log

**Description:**
A simple log of any hardware or device activity during the shift — repairs, replacements, configurations, installations. Taken directly from the "Asset Activities" sheet in the existing Excel template.

**User Story:**
As an IT engineer, I want to log any device work I do during my shift, so there is a permanent record of what was done to which asset.

**Fields:**
- Asset Name (free text — e.g. "HP LaserJet 3F", "Cisco AP Wing B")
- Asset Type (dropdown: Access Point / Server / CCTV Camera / Printer / Phone / Switch / Router / Laptop / Desktop / Other)
- Location / Department (same dropdown as Issues: Front Desk / Guest Room / Restaurant / Spa / Server Room / Conference Room / Staff Area / Other)
- Action Performed (dropdown: Restarted / Replaced / Inspected / Configured / Installed / Repaired / Moved / Other)
- Action Details (free text — brief description of what was done)
- Engineer (auto from login)
- Date & Time (auto-stamped)
- Status after action (dropdown: Resolved / Monitoring / Pending Further Action)
- Linked Issue Ticket (optional — link to a KHY ticket if this asset activity is related to a logged issue)

**Acceptance Criteria:**
- [ ] Engineer can log an asset activity in under 60 seconds
- [ ] Asset log entries appear automatically in the shift report summary
- [ ] Searchable by Asset Name, Asset Type, or Location
- [ ] Asset log entries can be linked to an existing issue ticket (optional)
- [ ] All entries are read-only after submission — no editing or deletion

**Success Metric:** All hardware activity during a shift is logged before report submission

---

#### Feature 5: Escalation Tracker

**Description:**
Tracks any issues formally escalated beyond the IT team — to vendors, hotel management, or external technical support. Taken directly from the "Escalation Tracker" sheet in the existing Excel template.

**User Story:**
As an IT manager, I want to see all active escalations in one place, so I know exactly which issues have gone to vendors or external support and their current status.

**Fields:**
- Incident ID (linked to Issues Tracker ticket)
- Issue Description (auto-pulled from linked ticket)
- Escalated To (vendor name / contact)
- Contact Number (optional)
- Escalation Time (auto-stamped)
- Current Status (Open / In Progress / Resolved)
- Vendor ETA (free text)
- Resolution Note (required when closing escalation — what the vendor did to fix it)
- Remarks

**Escalation Resolution Flow:**
1. Engineer or manager opens the escalation detail
2. Taps "Close Escalation" → required field: Resolution Note ("What did the vendor do?")
3. Confirms → escalation status changes to Resolved
4. Parent issue status does **not** auto-resolve — engineer must separately mark the parent issue as Resolved with their own resolution note
5. Manager receives email + in-app notification: "✅ ESCALATION CLOSED — KHY-007 Oracle Hospitality Support. Closed by [Name]."

**Acceptance Criteria:**
- [ ] Any open issue can be escalated with one click — incident details auto-fill from the issue
- [ ] Escalation triggers an immediate email + in-app notification to the manager
- [ ] Manager sees all active escalations as a prominent card on their dashboard
- [ ] Escalation status can be updated by either engineer or manager
- [ ] Closing an escalation requires a Resolution Note — this cannot be left blank
- [ ] Closing an escalation does not auto-resolve the parent issue — these are separate actions

**Success Metric:** Manager is notified of every escalation within 5 minutes of it being logged

---

#### Feature 6: Authentication & Account Management

**Description:**
Secure login for all 3 users with role-based access. Manager has full admin control over accounts including password resets and account unlocking.

**User Story:**
As an IT manager, I want to control all 3 user accounts from the admin panel, so I can reset passwords and unlock accounts without needing a developer.

**Password Reset Flow:**
- Engineers cannot self-reset passwords via email at MVP (deferred to V1.2)
- If an engineer forgets their password: engineer contacts the manager → manager goes to Admin Panel → Users → selects the user → "Reset Password" → enters a new temporary password → saves → tells engineer verbally
- Engineer logs in with the temporary password → is immediately forced to set a new password before accessing any screen

**First Login / Forced Password Change Flow:**
- On account creation, manager sets an initial temporary password
- On first login with that temporary password, engineer is redirected to a "Set Your Password" screen before reaching the dashboard
- Password requirements: minimum 8 characters — enforced at form level
- Until password is changed, no other screen is accessible

**Account Unlock Flow:**
- After 5 failed login attempts, account is locked
- Engineer sees: "Account locked. Contact your IT Manager."
- Manager goes to Admin Panel → Users → finds the locked user (shown with a red "Locked" badge) → taps "Unlock Account" → account is immediately unlocked → engineer can retry login

**Acceptance Criteria:**
- [ ] Manager can create, edit, and deactivate any of the 3 user accounts from the admin panel
- [ ] Manager can reset any user's password from the admin panel
- [ ] First login with a temporary password forces a password change before dashboard access
- [ ] Account locked after 5 failed attempts — manager must unlock via admin panel
- [ ] All users can change their own password from their account settings at any time
- [ ] Deactivating an account immediately invalidates all active sessions for that user

---

### P1 — Should Have (Version 1.1)

- **Manager Dashboard KPIs** — Single screen with KPI cards: Checklist completion %, Open Issues count, Active Escalations, Last Report submitted (time ago), Team Members on duty
- **Advanced Search & Filter** — across all issues by date range, priority, department, engineer, status, guest impacted
- **Weekly Summary Report** — auto-generated email to manager every Sunday: past 7 days checklist completion rate, total incidents, average resolution time, escalations count
- **Email + In-App Shift Reminder** — automatic notification to the on-duty engineer 30 minutes before shift end if no report has been submitted

### P2 — Nice to Have (Future)

- Export any individual shift report to branded PDF with Khyber logo, Fir Green header
- Dark mode using Khyber Slate as background
- Integration with hotel PMS to auto-log guest room IT complaints as issues
- Active Directory (AD) single sign-on — engineers log in with their Windows domain credentials
- Mobile PWA (installable on phone home screen without App Store)
- Trend charts for manager: weekly incident volume, most common issue categories, average resolution time
- Self-service password reset via email link

---

## 8. Explicitly OUT OF SCOPE

- **No HR or attendance management** — this is not a time-tracking or leave system
- **No full IT asset inventory** — no hardware lifecycle, warranty, or procurement tracking
- **No automated network monitoring** — this does not replace PRTG, Nagios, or any monitoring tool; it is a manual reporting system
- **No guest-facing portal** — internal IT team use only; guests never see or interact with this system
- **No multi-property support** — Gulmarg only; no other Khyber properties
- **No ticketing system integration** — no Jira, Freshdesk, or ServiceNow at MVP
- **No billing or cost tracking** — no vendor invoice management
- **No Active Directory SSO at MVP** — simple username/password login; AD deferred to V1.2
- **No mobile native app** — web browser only at MVP (PWA deferred to P2)
- **No self-service password reset via email** — manager resets passwords at MVP; email-based reset deferred to V1.2

---

## 9. Known Limitations (MVP)

These are deliberate constraints accepted at MVP — not bugs, not oversights:

| Limitation | Impact | Plan |
|---|---|---|
| In-app notifications poll every 30 seconds (not real-time push) | Manager sees critical alerts up to 30 seconds after they fire | WebSocket push deferred to V1.1 |
| No conflict resolution for simultaneous offline edits | If two engineers update the same issue while offline, last-write-wins when they reconnect | Acceptable for a 3-person team; document in team briefing |
| No granular notification preferences | All critical alerts go to manager's email — no temporary delegation option | Notification preferences deferred to V1.1 |
| No self-service password reset | Engineer must contact manager to reset forgotten password | Email-based reset deferred to V1.2 |
| Viewer dashboard shows same data as engineer dashboard in read-only mode | No bespoke simplified GM view at MVP | Dedicated Viewer dashboard deferred to V1.1 |

---

## 10. User Scenarios

### Scenario 1 — Engineer Starts Morning Shift (8:00 AM)

**Context:** Morning engineer arrives at the IT desk and opens the portal on their laptop.

**Steps:**
1. Opens `https://khyber-it-portal.vercel.app` → Login screen
2. Logs in with personal credentials → Engineer Dashboard loads
3. Sees Afternoon shift report from previous night pinned at top — reads it in 2 minutes
4. Sees 1 open pending issue: "Wi-Fi down in Wing B — In Progress (from last night)"
5. Opens today's Morning Checklist → 12 items, all unchecked
6. Does first round of the resort, checking items off on phone as completed; adds a quick note on the CCTV item: "Camera 3F offline — monitoring"
7. Discovers Wi-Fi in Wing B is now fully restored → opens the issue → "Mark Resolved" → adds resolution note → submits
8. Finishes checklist — 12/12 complete → green banner: "Morning Checklist Complete ✓"

**Expected Outcome:** Engineer is fully briefed and operational within 3 minutes of arriving. All activity is logged automatically.

**Edge Cases:**
- Previous shift forgot to submit report → dashboard shows amber warning: "No Afternoon report submitted" → engineer knows to call the other engineer for verbal briefing
- Wi-Fi issue was already resolved by incoming engineer → duplicate resolution blocked: "This issue was already resolved by [Name]"

---

### Scenario 2 — Critical Issue During Shift (11:00 AM)

**Context:** Engineer doing rounds discovers PMS database is unreachable — front desk cannot check in guests.

**Steps:**
1. Engineer opens "+ New Issue" on phone
2. Fills in: "PMS Database Unreachable" → Priority: Critical → Location: Server Room → Guest Impacted: Yes → Assigns to self
3. Taps "Submit" → confirmation dialog: "Mark as Critical? Manager will be notified immediately." → Confirms
4. System sends email + in-app notification to manager: "🚨 CRITICAL ISSUE LOGGED — PMS Database Unreachable. Logged by [Engineer Name] at 11:04 AM. Guest Impacted: Yes"
5. Manager sees the in-app notification badge on their dashboard immediately
6. Manager calls engineer → decides to escalate to PMS vendor
7. Engineer logs escalation: Incident KHY-007 → Escalated To: "Oracle Hospitality Support" → adds vendor phone number in remarks → sets ETA: 6PM
8. Escalation triggers second email + in-app notification to manager: "🔺 ESCALATION — KHY-007 escalated to Oracle Hospitality Support"
9. Manager sees both the issue and escalation on their dashboard

**Expected Outcome:** Manager is informed within 3 minutes of the issue being logged. Full audit trail created automatically.

**Edge Cases:**
- Engineer logs Critical by mistake → can downgrade priority within 5 minutes before notification fires → after 5 minutes, requires manager to change priority

---

### Scenario 3 — End of Shift Handover (4:45 PM)

**Context:** Morning engineer finishing shift at 5PM. Afternoon engineer arrives at 4:45 PM.

**Steps:**
1. At 4:30 PM, engineer receives an in-app notification + email: "⏰ Shift report due in 30 minutes. Please submit before 5:00 PM."
2. Engineer opens Shift Report form on laptop
3. Form auto-fills: Date, Shift (Morning), Prepared By, Shift Summary (11 tasks completed, 1 issue open, 1 escalated)
4. Issues sections auto-populated from the day's data
5. Engineer writes Handover Notes: "PMS escalated to Oracle, vendor ETA 6PM. Wi-Fi Wing B fully stable. Check printer in restaurant — paper jam reported by F&B."
6. Taps Submit → confirmation screen
7. Manager receives email + in-app notification: "📋 Morning Shift Report submitted by [Engineer Name]"
8. Afternoon engineer logs in at 4:45 PM → sees Morning report pinned at top of their dashboard → reads it before handover meeting

**Expected Outcome:** Handover completed in under 5 minutes. Afternoon engineer has full context before they even speak to the Morning engineer.

**Edge Cases:**
- Engineer forgets to submit and shift ends at 5PM → red banner persists on their dashboard → second email + in-app reminder sent at 5:15 PM
- Afternoon engineer logs in before Morning report is submitted → sees amber card: "Morning report not yet submitted"

---

### Scenario 4 — Manager Reviews From Phone (Any Time)

**Context:** IT Manager is in a meeting with hotel General Manager and needs a quick status update.

**Steps:**
1. Opens `https://khyber-it-portal.vercel.app` on phone
2. Manager Dashboard loads: Checklist 10/12 complete, Open Issues 2 (1 escalated), Last Report: 3 hours ago, 1 active escalation
3. Taps the escalated issue → reads full thread → vendor ETA is 6PM
4. No action needed → closes phone, resumes meeting
5. Can verbally brief the GM: "PMS is being handled by the vendor, ETA 6PM. Everything else is running."

**Expected Outcome:** Manager has a complete, accurate status briefing in under 60 seconds. No calls made.

**Edge Cases:**
- Dashboard fails to load (internet issue in Gulmarg) → last loaded data shown in read-only cached mode with "Last updated [time]" banner

---

## 11. Initial Setup & Onboarding

Before handing the portal to the engineering team, the IT Manager must complete the following pre-launch checklist. This should take approximately 30–45 minutes.

### Manager Pre-Launch Checklist

- [ ] **1. Create 3 user accounts** — Admin Panel → Users → Add User (Name, Role, Email, Temporary Password) for each team member
- [ ] **2. Configure shift times** — Admin Panel → Settings → Shift Times → set Morning (8:00 AM – 5:00 PM) and Afternoon (1:00 PM – 10:00 PM); adjust seasonally as needed
- [ ] **3. Pre-load 12 checklist items** — Admin Panel → Checklist Manager → add all 12 items from the Excel template; assign each to Morning, Afternoon, or Both shifts
- [ ] **4. Set notification recipient** — Admin Panel → Settings → Notifications → confirm manager email address for critical alerts
- [ ] **5. Verify email notifications** — log a test issue as Critical → confirm email arrives at manager inbox → delete the test issue
- [ ] **6. Test login on all 3 devices** — confirm each engineer can log in on their phone and the IT desk laptop; confirm manager login works on office laptop and personal phone
- [ ] **7. Brief the engineering team** — walk both engineers through: login, checklist, logging an issue, submitting a shift report; share the Glossary section of this document

---

## 12. Data Retention & Archival Policy

| Data Type | Retention Period | After Retention Period | Export Available? |
|---|---|---|---|
| Shift Reports | 12 months | Auto-archived (read-only, not deleted) | Yes — PDF export (V1.2) |
| Issues (resolved) | 12 months active + permanent archive | Moved to cold archive after 12 months | Yes — CSV export (V1.1) |
| Issues (unresolved) | Retained indefinitely until resolved | N/A | Yes |
| Checklist Logs | 12 months | Auto-deleted after 12 months | No — summarised in shift reports |
| Asset Activity Log | 12 months | Auto-archived | Yes — CSV export (V1.1) |
| Escalation Records | 12 months | Auto-archived | Yes — CSV export (V1.1) |
| Notification Records | 90 days | Auto-deleted | No |
| Refresh Tokens | 7 days (rolling) | Auto-expired | No |

**Notes:**
- No data is permanently deleted at MVP — all records are archived and remain accessible to the manager in read-only mode
- Manager receives an in-app notification 30 days before any auto-archival event
- Data archival does not affect the live app — archived records are simply moved out of default views and into an "Archive" filter

---

## 13. Dependencies & Constraints

### Technical Constraints

- **Primary Deployment:** Vercel (frontend) + Render (backend) + Supabase (PostgreSQL) — all permanently free tiers
- **Connectivity:** Resort is in Gulmarg — internet can be intermittent; app must handle offline gracefully with local caching
- **Build Constraint:** No traditional developer — all code generated by Claude + Antar Gravity AI tools
- **Browser Support:** Chrome (Android + Desktop), Safari (iPhone), Edge (Windows laptops)

### Business Constraints

- Zero ongoing infrastructure budget (Vercel + Render + Supabase free tiers)
- Zero notification budget — email via Resend free tier (3,000 emails/month, 100/day), in-app notifications built into the app
- Minimal ongoing maintenance — IT Manager is not a developer
- Must be usable by non-technical team members with zero training

### External Dependencies

| Dependency | Service | Cost | Purpose |
|---|---|---|---|
| Email Notifications | Resend | Free (3K emails/month, 100/day) | Critical issue, shift report, escalation, reminder alerts |
| In-App Notifications | Built-in (database-driven) | $0 | Real-time badge + bell alerts inside the portal |
| File Storage | Cloudinary | Free (25GB) | Issue attachment screenshots |
| Frontend Hosting | Vercel | Free | Web app delivery |
| Backend Hosting | Render | Free | API hosting |
| Database | Supabase | Free (500MB PostgreSQL) | Primary database |

---

## 14. Timeline & Milestones

| Milestone | Target | Features Included |
|---|---|---|
| **MVP (V1.0)** | Week 3 | Login + Role Permissions + Daily Checklist (12 items, with notes) + Pending Issues Tracker (with Guest Impact flag) + Shift Report + Asset Activity Log (full fields) + Escalation Tracker (with resolution flow) + Email Notifications + In-App Notifications + Admin Panel (users, shift times, checklist manager) |
| **V1.1** | Week 6 | Manager Dashboard KPIs + Advanced Search & Filter + Weekly Summary Email + Notification Preferences + Viewer Dashboard + WebSocket push notifications |
| **V1.2** | Week 10 | PDF Export (branded) + Active Directory login option + PWA (installable on phone) + Self-service password reset via email |

---

## 15. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | All pages load in under 3 seconds on the resort's internal network |
| **Availability** | 99% uptime — covering both shifts, 8AM–10PM daily minimum |
| **Offline Behavior** | Read-only access when internet drops; forms cached and submitted on reconnect |
| **Security** | Login required for every page; role permissions enforced on backend API; JWT tokens expire in 15 minutes |
| **Data Retention** | All shift reports, issues, and logs retained for minimum 12 months per Section 12 |
| **Mobile** | Full functionality on 375px screen (iPhone SE minimum); tap targets minimum 48×48px |
| **Branding** | Khyber brand: Fir Green (`#19433E`), Slate (`#4A4D51`), Antique Gold (`#BD8D27`); Playfair Display headings + Nunito Sans body text |
| **Backup** | Daily automated database backup retained for 30 days (Supabase automated backups) |
| **Scalability** | Designed for 3 users; architecture supports up to 20 without changes if team grows |
| **Accessibility** | WCAG 2.1 AA — sufficient colour contrast, readable font sizes (minimum 16px body) |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **Shift** | A defined working period for an IT engineer: Morning (8AM–5PM) or Afternoon (1PM–10PM) |
| **Shift Overlap** | The 4-hour period (1PM–5PM) when both Morning and Afternoon engineers are on duty simultaneously |
| **Handover** | The process of one engineer formally briefing the next engineer at shift changeover, via the Shift Report |
| **KHY Ticket** | An auto-generated issue reference number in the format KHY-001, KHY-002, etc. Used to track and reference IT issues |
| **Escalation** | The formal process of passing an unresolved IT issue to a vendor, external support team, or hotel management when the IT team cannot resolve it internally |
| **Checklist** | The daily list of 12 recurring IT tasks each engineer must complete and check off during their shift |
| **Asset Activity** | Any physical action performed on an IT device — restarting, replacing, configuring, installing, repairing, or moving hardware |
| **Critical Issue** | An IT problem severe enough to impact resort operations or guests immediately — triggers instant email + in-app notification to the manager |
| **Guest Impacted** | A flag on an issue indicating that the problem directly affected one or more hotel guests |
| **Viewer** | A read-only user role — can see all data but cannot create, edit, or resolve anything (e.g. General Manager) |
| **In-App Notification** | An alert that appears inside the portal as a badge on the bell icon — does not require email |
| **Overdue Item** | A checklist item that was not completed before the shift ended — carried forward to the next shift with a red warning label |
| **Admin Panel** | The manager-only section of the portal for managing users, shift times, checklist items, and notification settings |
