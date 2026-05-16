# Product Requirements Document (PRD)
## Khyber IT Operations Portal
### The Khyber Himalayan Resort & Spa — Gulmarg

**Version:** 1.0
**Owner:** IT Manager
**Date:** May 2026
**Built With:** Claude + Antar Gravity

---

## 1. Product Overview

| Field | Details |
|---|---|
| Project Title | Khyber IT Operations Portal |
| Version | 1.0 MVP |
| Owner | IT Manager, The Khyber Himalayan Resort & Spa |
| Location | Gulmarg, Jammu & Kashmir |
| Team Size | 2 IT Engineers + 1 IT Manager |
| Platform | Web app — desktop + mobile browser |
| Primary Deployment | Vercel (frontend) + Railway (backend) + Railway (database) — 100% Free |
| Fallback Deployment | Windows Server 2008 R2, IIS + iisnode, Node 12.22.12, SQL Server 2012 |
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

---

## 6. Features & Requirements

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

**Acceptance Criteria:**
- [ ] Checklist loads automatically for the current shift (Morning / Afternoon) based on time
- [ ] Each item is checkable with a single tap on mobile (minimum 48px tap target)
- [ ] Checking an item auto-records: timestamp + logged-in engineer's name
- [ ] Progress bar updates in real time as items are checked
- [ ] Incomplete items at shift end are flagged red and carry forward to the next shift with label "Overdue from [Morning/Afternoon] Shift"
- [ ] Manager can add, edit, or remove checklist items from the admin panel
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
- Assigned To
- Start Time (auto-stamped)
- Escalated To (vendor name, manager, or external support)
- ETA
- Progress Notes (threaded updates)

**Acceptance Criteria:**
- [ ] Any engineer can log a new issue in under 60 seconds
- [ ] All 3 team members see the same live board simultaneously
- [ ] Issues unresolved for 4+ hours are automatically highlighted with a gold border
- [ ] Critical priority issues trigger an immediate email + in-app notification to the manager
- [ ] Resolved issues move to a searchable archive — never permanently deleted
- [ ] Each issue maintains a full audit trail of all updates with timestamps and author names
- [ ] Issues can be filtered by: Priority / Status / Department / Date / Engineer

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
- [ ] Report cannot be deleted — only superseded by a re-submission

**Success Metric:** 100% of shifts have a submitted report before handover

---

#### Feature 4: Asset Activity Log

**Description:**
A simple log of any hardware or device activity during the shift — repairs, replacements, configurations, installations. Taken directly from the "Asset Activities" sheet in the existing Excel template.

**User Story:**
As an IT engineer, I want to log any device work I do during my shift, so there is a permanent record of what was done to which asset.

**Fields (from existing Excel template):**
- Asset ID
- Device Type
- User / Department
- Activity Performed
- Engineer (auto from login)
- Date (auto)
- Status

**Acceptance Criteria:**
- [ ] Engineer can log an asset activity in under 60 seconds
- [ ] Asset log entries appear automatically in the shift report summary
- [ ] Searchable by Asset ID or Device Type

**Success Metric:** All hardware activity during a shift is logged before report submission

---

#### Feature 5: Escalation Tracker

**Description:**
Tracks any issues formally escalated beyond the IT team — to vendors, hotel management, or external technical support. Taken directly from the "Escalation Tracker" sheet in the existing Excel template.

**User Story:**
As an IT manager, I want to see all active escalations in one place, so I know exactly which issues have gone to vendors or external support and their current status.

**Fields (from existing Excel template):**
- Incident ID (linked to Issues Tracker ticket)
- Issue Description (auto-pulled from linked ticket)
- Escalated To (vendor name / contact)
- Escalation Time (auto-stamped)
- Current Status
- Remarks

**Acceptance Criteria:**
- [ ] Any open issue can be escalated with one click — incident details auto-fill from the issue
- [ ] Escalation triggers an immediate email + in-app notification to the manager
- [ ] Manager sees all active escalations as a prominent card on their dashboard
- [ ] Escalation status can be updated by either engineer or manager

**Success Metric:** Manager is notified of every escalation within 5 minutes of it being logged

---

### P1 — Should Have (Version 1.1)

- **Manager Dashboard** — Single screen with KPI cards: Checklist completion %, Open Issues count, Active Escalations, Last Report submitted (time ago), Team Members on duty
- **Advanced Search & Filter** — across all issues by date range, priority, department, engineer, status
- **Weekly Summary Report** — auto-generated PDF emailed to manager every Sunday covering the week's incidents, checklist averages, and resolution times
- **Email + In-App Shift Reminder** — automatic notification to the on-duty engineer 30 minutes before shift end if no report has been submitted

### P2 — Nice to Have (Future)

- Export any individual shift report to branded PDF with Khyber logo, Fir Green header
- Dark mode using Khyber Slate as background
- Integration with hotel PMS to auto-log guest room IT complaints as issues
- Active Directory (AD) single sign-on — engineers log in with their Windows domain credentials
- Mobile PWA (installable on phone home screen without App Store)
- Trend charts for manager: weekly incident volume, most common issue categories, average resolution time

---

## 7. Explicitly OUT OF SCOPE

- **No HR or attendance management** — this is not a time-tracking or leave system
- **No full IT asset inventory** — no hardware lifecycle, warranty, or procurement tracking
- **No automated network monitoring** — this does not replace PRTG, Nagios, or any monitoring tool; it is a manual reporting system
- **No guest-facing portal** — internal IT team use only; guests never see or interact with this system
- **No multi-property support** — Gulmarg only; no other Khyber properties
- **No ticketing system integration** — no Jira, Freshdesk, or ServiceNow at MVP
- **No billing or cost tracking** — no vendor invoice management
- **No complex role permissions at MVP** — 3 roles only: Engineer (2 accounts), Manager (1 account)
- **No Active Directory SSO at MVP** — simple username/password login; AD deferred to V1.2
- **No mobile native app** — web browser only at MVP (PWA deferred to P2)

---

## 8. User Scenarios

### Scenario 1 — Engineer Starts Morning Shift (8:00 AM)

**Context:** Morning engineer arrives at the IT desk and opens the portal on their laptop.

**Steps:**
1. Opens `https://khyber-it-portal-web.vercel.app` → Login screen
2. Logs in with personal credentials → Engineer Dashboard loads
3. Sees Afternoon shift report from previous night pinned at top — reads it in 2 minutes
4. Sees 1 open pending issue: "Wi-Fi down in Wing B — In Progress (from last night)"
5. Opens today's Morning Checklist → 12 items, all unchecked
6. Does first round of the resort, checking items off on phone as completed
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
2. Fills in: "PMS Database Unreachable" → Priority: Critical → Location: Server Room → Assigns to self
3. Taps "Submit" → confirmation dialog: "Mark as Critical? Manager will be notified immediately." → Confirms
4. System sends email + in-app notification to manager: "🚨 CRITICAL ISSUE LOGGED — PMS Database Unreachable. Logged by [Engineer Name] at 11:04 AM"
5. Manager sees the in-app notification badge on their dashboard immediately
6. Manager calls engineer → decides to escalate to PMS vendor
7. Engineer logs escalation: Incident KHY-007 → Escalated To: "Oracle Hospitality Support" → adds vendor phone number in remarks
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
1. Opens `https://khyber-it-portal-web.vercel.app` on phone
2. Manager Dashboard loads: Checklist 10/12 complete, Open Issues 2 (1 escalated), Last Report: 3 hours ago, 1 active escalation
3. Taps the escalated issue → reads full thread → vendor ETA is 6PM
4. No action needed → closes phone, resumes meeting
5. Can verbally brief the GM: "PMS is being handled by the vendor, ETA 6PM. Everything else is running."

**Expected Outcome:** Manager has a complete, accurate status briefing in under 60 seconds. No calls made.

**Edge Cases:**
- Dashboard fails to load (internet issue in Gulmarg) → last loaded data shown in read-only cached mode with "Last updated [time]" banner

---

## 9. Dependencies & Constraints

### Technical Constraints

- **Primary Deployment:** Vercel (frontend) + Railway (backend) + Railway (PostgreSQL) — all permanently free tiers.
- **Fallback Deployment:** Windows Server 2008 R2, IIS + iisnode, Node.js 12.22.12, SQL Server 2012
  - Node 12 is EOL (End of Life since April 2022) — backend must be written Node 12-compatible for fallback use
  - SQL Server 2012 is EOL (since July 2022) — use as fallback only, migrate to Railway PostgreSQL as primary
- **Connectivity:** Resort is in Gulmarg — internet can be intermittent; app must handle offline gracefully with local caching
- **Build Constraint:** No traditional developer — all code generated by Claude + Antar Gravity AI tools
- **Browser Support:** Chrome (Android + Desktop), Safari (iPhone), Edge (Windows laptops)

### Business Constraints

- Zero ongoing infrastructure budget (Vercel + Render + Supabase free tiers)
- Zero notification budget — email via Resend free tier, in-app notifications built into the app
- Minimal ongoing maintenance — IT Manager is not a developer
- Must be usable by non-technical team members with zero training

### External Dependencies

| Dependency | Service | Cost | Purpose |
|---|---|---|---|
| Email Notifications | Resend | Free (3K emails/month) | Critical issue, shift report, escalation, reminder alerts |
| In-App Notifications | Built-in (database-driven) | $0 | Real-time badge + bell alerts inside the portal |
| File Storage | Cloudinary | Free (25GB) | Issue attachment screenshots |
| Frontend Hosting | Vercel | Free | Web app delivery |
| Backend Hosting | Railway | Free | API hosting |
| Database | Railway | Free | PostgreSQL database |

---

## 10. Timeline & Milestones

| Milestone | Target | Features Included |
|---|---|---|
| **MVP (V1.0)** | Week 3 | Login (3 accounts) + Daily Checklist (12 items) + Pending Issues Tracker + Shift Report + Asset Activity Log + Escalation Tracker + Email Notifications + In-App Notifications |
| **V1.1** | Week 6 | Manager Dashboard KPIs + Advanced Search & Filter + Weekly Summary Email + Offline Mode |
| **V1.2** | Week 10 | PDF Export (branded) + Active Directory login option + PWA (installable on phone) |

---

## 11. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | All pages load in under 3 seconds on the resort's internal network |
| **Availability** | 99% uptime — covering both shifts, 8AM–10PM daily minimum |
| **Offline Behavior** | Read-only access when internet drops; forms cached and submitted on reconnect |
| **Security** | Login required for every page; manager role inaccessible to engineers; JWT tokens expire in 15 minutes |
| **Data Retention** | All shift reports, issues, and logs retained for minimum 12 months |
| **Mobile** | Full functionality on 375px screen (iPhone SE minimum); tap targets minimum 48×48px |
| **Branding** | Khyber brand: Fir Green (`#19433E`), Slate (`#4A4D51`), Antique Gold (`#BD8D27`); Playfair Display headings + Novecentowide/Nunito Sans body text |
| **Backup** | Daily automated database backup retained for 30 days |
| **Scalability** | Designed for 3 users; architecture supports up to 20 without changes if team grows |
| **Accessibility** | WCAG 2.1 AA — sufficient colour contrast, readable font sizes (minimum 16px body) |
