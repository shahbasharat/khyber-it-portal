# Frontend Design System & Guidelines
## Khyber IT Operations Portal
### The Khyber Himalayan Resort & Spa — Gulmarg

**Version:** 1.0
**Owner:** IT Manager
**Date:** May 2026

---

## 1. Design Principles

### 1. Clarity Over Decoration
Every screen must communicate status at a glance. An engineer doing rounds in the resort has seconds to read a checklist item or log an issue. No decorative elements that compete with functional information.

### 2. Speed of Interaction
The most common actions — checking off a task, logging an issue, adding a note — must require the fewest possible taps. One tap to check. One tap to open. Submit is always one button, always visible.

### 3. Hospitality-Grade Presentation
This is a tool for a 5-star resort. The interface must feel considered and premium — Khyber brand colours, Playfair Display for headings, generous whitespace. Engineers should feel they are using a professional system, not a generic IT form.

### 4. Resilience-First Design
Gulmarg has intermittent internet. Offline states, sync indicators, and queued-action feedback are not edge cases — they are core UI. Every state (loading, empty, error, offline) must be designed, never left blank.

### 5. Mobile as Default
Engineers use phones during resort rounds. Every component is designed mobile-first, then expanded for desktop. Touch targets, tap areas, and thumb-zone placement drive all layout decisions.

---

## 2. Design Tokens

### Colors

#### Brand Palette

| Token | Hex | Usage |
|---|---|---|
| `color-fir-green` | `#19433E` | Primary actions, checked states, sidebar background, success |
| `color-fir-green-light` | `#235C55` | Primary button hover state |
| `color-fir-green-subtle` | `#E8F0EF` | Checked item background, success banners (light tint) |
| `color-slate` | `#4A4D51` | Body text, secondary labels, navigation text |
| `color-slate-light` | `#6B6E73` | Helper text, placeholder text, timestamps |
| `color-slate-lighter` | `#C2C4C7` | Borders, dividers, disabled states |
| `color-antique-gold` | `#BD8D27` | Accent — overdue highlights, escalation alerts, FAB button, active nav indicator |
| `color-antique-gold-light` | `#D4A84B` | Gold hover state |
| `color-antique-gold-subtle` | `#FDF6E7` | Overdue item background, escalation card tint |
| `color-cream` | `#FAF8F3` | Page background, card background |
| `color-white` | `#FFFFFF` | Card surfaces, modal backgrounds, input backgrounds |

#### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `color-success` | `#19433E` | Mapped to Fir Green — completed checklist, resolved issues |
| `color-success-bg` | `#E8F0EF` | Success banner background |
| `color-success-text` | `#0F2E2A` | Success banner text |
| `color-warning` | `#BD8D27` | Mapped to Antique Gold — overdue items, pending reminders |
| `color-warning-bg` | `#FDF6E7` | Warning banner background |
| `color-warning-text` | `#7A5B18` | Warning banner text |
| `color-error` | `#C0392B` | Incomplete required fields, Critical priority badge, destructive actions |
| `color-error-bg` | `#FDECEA` | Error banner background |
| `color-error-text` | `#8B0000` | Error banner text |
| `color-info` | `#2563EB` | Informational toasts, help hints |
| `color-info-bg` | `#EFF6FF` | Info banner background |

#### Priority Badge Colors

| Priority | Background | Text | Border |
|---|---|---|---|
| Critical | `#FDECEA` | `#C0392B` | `#C0392B` |
| High | `#FDF6E7` | `#BD8D27` | `#BD8D27` |
| Medium | `#EFF6FF` | `#2563EB` | `#2563EB` |
| Low | `#F1F5F9` | `#64748B` | `#CBD5E1` |

#### Tailwind Config (`tailwind.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'fir-green':          '#19433E',
        'fir-green-light':    '#235C55',
        'fir-green-subtle':   '#E8F0EF',
        'slate-dark':         '#4A4D51',
        'slate-mid':          '#6B6E73',
        'slate-border':       '#C2C4C7',
        'antique-gold':       '#BD8D27',
        'antique-gold-light': '#D4A84B',
        'antique-gold-subtle':'#FDF6E7',
        'cream':              '#FAF8F3',
      },
    },
  },
}
```

---

### Typography

#### Font Families

```css
--font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-body:    'Nunito Sans', 'Myriad Pro', Arial, Helvetica, sans-serif;
--font-mono:    'JetBrains Mono', 'Courier New', monospace;
```

**Google Fonts import (in `globals.css`):**
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap');
```

#### Type Scale

| Token | Size (rem) | Size (px) | Line Height | Usage |
|---|---|---|---|---|
| `text-xs` | 0.75rem | 12px | 1.5 | Timestamps, meta labels |
| `text-sm` | 0.875rem | 14px | 1.5 | Helper text, secondary info, table data |
| `text-base` | 1rem | 16px | 1.6 | Body text, form labels, button text |
| `text-lg` | 1.125rem | 18px | 1.5 | Section subheadings, card titles |
| `text-xl` | 1.25rem | 20px | 1.4 | Page subheadings |
| `text-2xl` | 1.5rem | 24px | 1.3 | Page titles (mobile) |
| `text-3xl` | 1.875rem | 30px | 1.2 | Page titles (desktop), KPI numbers |
| `text-4xl` | 2.25rem | 36px | 1.1 | Dashboard KPI values (large numbers) |

#### Font Weights

| Token | Weight | Usage |
|---|---|---|
| `font-normal` | 400 | Body text, descriptions, notes |
| `font-medium` | 500 | Form labels, nav items, table headers |
| `font-semibold` | 600 | Card titles, button text, priority badges |
| `font-bold` | 700 | Page headings, KPI values, alert titles |

#### Usage Rules

- **Playfair Display** — page titles, section headings, dashboard KPI labels, 404/error page headings only. Never used for body text, form labels, or UI controls.
- **Nunito Sans** — everything else: body text, labels, buttons, inputs, table data, toasts.
- **Monospace** — ticket numbers (KHY-007), timestamps in issue threads, code snippets in admin settings.
- **Minimum body text size: 16px** — never smaller in the main content area (WCAG AA requirement).
- **Minimum tap label size: 14px** — for secondary meta text only.

---

### Spacing Scale

Based on a 4px base unit.

| Token | Value | Usage |
|---|---|---|
| `spacing-1` | 4px | Icon-to-label gap, tight inline spacing |
| `spacing-2` | 8px | Internal badge padding, compact list item padding |
| `spacing-3` | 12px | Input field vertical padding |
| `spacing-4` | 16px | Card padding (mobile), section padding, button horizontal padding |
| `spacing-5` | 20px | Form field gap, list item vertical spacing |
| `spacing-6` | 24px | Card padding (desktop), modal padding top/bottom |
| `spacing-8` | 32px | Between cards, section gap (mobile) |
| `spacing-10` | 40px | Between sections (desktop), page top padding |
| `spacing-12` | 48px | Minimum tap target size, large section gap |
| `spacing-16` | 64px | Page hero padding, large modal padding |

#### Usage Rules

- **Component internal padding:** `spacing-4` (mobile), `spacing-6` (desktop)
- **Between cards / list items:** `spacing-4` to `spacing-5`
- **Between sections on a page:** `spacing-8` (mobile), `spacing-10` (desktop)
- **Form field gap:** `spacing-5` vertically between fields
- **Page container padding:** `spacing-4` horizontal (mobile), `spacing-8` (desktop)

---

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-none` | 0px | Table cells, full-bleed elements |
| `rounded-sm` | 4px | Badges, small pills, tooltips |
| `rounded` | 6px | Buttons (default), input fields |
| `rounded-md` | 8px | Cards, form containers, dropdowns |
| `rounded-lg` | 12px | Modals, bottom sheets, toast notifications |
| `rounded-xl` | 16px | Dashboard KPI cards, feature highlight panels |
| `rounded-full` | 9999px | Avatar circles, toggle switches, FAB button |

---

### Shadows

```css
--shadow-sm:   0 1px 2px 0 rgba(25, 67, 62, 0.06);
--shadow-base: 0 2px 4px 0 rgba(25, 67, 62, 0.08), 0 1px 2px -1px rgba(25, 67, 62, 0.06);
--shadow-md:   0 4px 8px -2px rgba(25, 67, 62, 0.10), 0 2px 4px -2px rgba(25, 67, 62, 0.06);
--shadow-lg:   0 8px 16px -4px rgba(25, 67, 62, 0.12), 0 4px 6px -4px rgba(25, 67, 62, 0.08);
--shadow-xl:   0 20px 32px -8px rgba(25, 67, 62, 0.16), 0 8px 16px -8px rgba(25, 67, 62, 0.10);
```

| Token | Usage |
|---|---|
| `shadow-sm` | Subtle card lift, input focus |
| `shadow-base` | Default card shadow, dropdown panels |
| `shadow-md` | Hovered card, active form |
| `shadow-lg` | Modals, bottom sheets, drawer panels |
| `shadow-xl` | Full-screen overlays, critical alert modals |

---

## 3. Layout System

### Container

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding-left: 16px;   /* mobile */
  padding-right: 16px;
}

@media (min-width: 768px) {
  .container {
    padding-left: 32px;
    padding-right: 32px;
  }
}
```

### Responsive Breakpoints

| Name | Min Width | Usage |
|---|---|---|
| `sm` | 480px | Large phone (iPhone Pro Max, Galaxy S) |
| `md` | 768px | Tablet, desktop switch — sidebar appears, wizard → single-page forms |
| `lg` | 1024px | Laptop — 2-column layouts, issue drawer panel |
| `xl` | 1280px | Full desktop — 3-column manager dashboard |

### Page Layout Patterns

#### Mobile Layout (< 768px)
```
┌─────────────────────┐
│  Top Header Bar     │  (48px — logo + username + logout)
├─────────────────────┤
│                     │
│   Page Content      │  (scrollable, full width)
│                     │
│                     │
├─────────────────────┤
│  Bottom Tab Bar     │  (64px — Dashboard | Checklist | Issues | Report)
└─────────────────────┘
```

#### Desktop Layout (≥ 768px)
```
┌──────┬──────────────────────────────┐
│      │  Top Header Bar              │  (56px)
│ Side ├──────────────────────────────┤
│ Bar  │                              │
│240px │   Page Content               │  (scrollable)
│      │                              │
│      │                              │
└──────┴──────────────────────────────┘
```

#### Manager Dashboard (≥ 1280px)
```
┌──────┬──────────────┬──────────────┬──────────────┐
│ Side │  KPI Cards   │  Issues      │  Reports     │
│ Bar  │  + Escalation│  Board       │  Log         │
│ 240px│  col         │  col         │  col         │
└──────┴──────────────┴──────────────┴──────────────┘
```

---

## 4. Component Library

---

### Button

#### Variants

**Primary — for the single main action on a screen**
```html
<button class="
  bg-fir-green text-white
  px-5 py-3 rounded
  text-base font-semibold
  transition-colors duration-200
  hover:bg-fir-green-light
  focus:outline-none focus:ring-2 focus:ring-fir-green focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  active:scale-[0.98]
">
  Submit Report
</button>
```

**Secondary — for supporting actions (Cancel, Back)**
```html
<button class="
  bg-white text-slate-dark
  border border-slate-border
  px-5 py-3 rounded
  text-base font-semibold
  transition-colors duration-200
  hover:bg-cream hover:border-slate-mid
  focus:outline-none focus:ring-2 focus:ring-slate-dark focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Cancel
</button>
```

**Outline Gold — for accent actions (New Issue FAB label, escalate)**
```html
<button class="
  bg-transparent text-antique-gold
  border-2 border-antique-gold
  px-5 py-3 rounded
  text-base font-semibold
  transition-colors duration-200
  hover:bg-antique-gold hover:text-white
  focus:outline-none focus:ring-2 focus:ring-antique-gold focus:ring-offset-2
">
  Escalate Issue
</button>
```

**Ghost — for low-emphasis actions in lists (Assign to Me, View)**
```html
<button class="
  bg-transparent text-fir-green
  px-4 py-2 rounded
  text-sm font-semibold
  transition-colors duration-200
  hover:bg-fir-green-subtle
  focus:outline-none focus:ring-2 focus:ring-fir-green focus:ring-offset-1
">
  Assign to Me
</button>
```

**Danger — for destructive actions (Delete, Reset)**
```html
<button class="
  bg-color-error text-white
  px-5 py-3 rounded
  text-base font-semibold
  transition-colors duration-200
  hover:bg-red-700
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Delete Issue
</button>
```

#### Sizes

| Size | Classes | Usage |
|---|---|---|
| Small | `px-3 py-2 text-sm` | Ghost actions inside cards, filter tags |
| Medium | `px-5 py-3 text-base` | Default — all primary/secondary/outline |
| Large | `px-6 py-4 text-lg` | Form submit buttons, full-width mobile CTAs |

#### Loading State

```html
<button class="bg-fir-green text-white px-5 py-3 rounded opacity-80 cursor-not-allowed flex items-center gap-2" disabled>
  <svg class="animate-spin h-4 w-4" .../>
  Submitting...
</button>
```

#### Usage Rules

- **Only one Primary button per screen.** All other actions use Secondary, Ghost, or Outline.
- **Full-width on mobile** for Primary CTAs at the bottom of forms.
- **Never use Danger** for anything reversible — only for permanent deletions (which are rare in this app; issues are archived, not deleted).
- Minimum button tap target: **48px height** on mobile.

---

### Floating Action Button (FAB) — "+ New Issue"

```html
<button class="
  fixed bottom-20 right-4 z-50
  w-14 h-14 rounded-full
  bg-antique-gold text-white
  shadow-lg
  flex items-center justify-center
  transition-transform duration-200
  hover:scale-105 active:scale-95
  focus:outline-none focus:ring-2 focus:ring-antique-gold focus:ring-offset-2
  md:hidden
" aria-label="Log new issue">
  <svg class="w-6 h-6" .../><!-- Plus icon -->
</button>
```

On desktop, this becomes a standard Primary button in the sidebar or header: "+ New Issue".

---

### Input Fields

#### Text Input (default)

```html
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-slate-dark" for="issue-title">
    Issue Title <span class="text-color-error">*</span>
  </label>
  <input
    id="issue-title"
    type="text"
    placeholder="e.g. Wi-Fi down in Wing B"
    class="
      w-full px-4 py-3 rounded
      border border-slate-border
      bg-white text-slate-dark
      text-base
      placeholder:text-slate-mid
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-fir-green focus:border-fir-green
      disabled:bg-cream disabled:text-slate-mid disabled:cursor-not-allowed
    "
  />
  <span class="text-xs text-slate-mid">Describe the issue in a few words</span>
</div>
```

#### Error State

```html
<input class="
  w-full px-4 py-3 rounded
  border border-color-error
  bg-white text-slate-dark text-base
  focus:outline-none focus:ring-2 focus:ring-color-error
" />
<span class="text-xs text-color-error flex items-center gap-1 mt-1">
  <svg class="w-3.5 h-3.5"/><!-- Alert icon -->
  Issue title is required
</span>
```

#### Success State

```html
<input class="
  w-full px-4 py-3 rounded
  border border-color-success
  bg-white text-slate-dark text-base
  focus:outline-none focus:ring-2 focus:ring-fir-green
" />
<span class="text-xs text-fir-green flex items-center gap-1 mt-1">
  <svg class="w-3.5 h-3.5"/><!-- Check icon -->
  Looks good
</span>
```

#### Textarea

```html
<textarea
  rows="4"
  class="
    w-full px-4 py-3 rounded
    border border-slate-border
    bg-white text-slate-dark text-base
    placeholder:text-slate-mid
    resize-y min-h-[100px]
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-fir-green focus:border-fir-green
  "
/>
```

#### Select / Dropdown

```html
<select class="
  w-full px-4 py-3 rounded
  border border-slate-border
  bg-white text-slate-dark text-base
  appearance-none
  bg-[url('chevron-down.svg')] bg-no-repeat bg-[right_12px_center]
  focus:outline-none focus:ring-2 focus:ring-fir-green focus:border-fir-green
">
  <option value="">Select priority...</option>
  <option value="critical">Critical</option>
  <option value="high">High</option>
  <option value="medium">Medium</option>
  <option value="low">Low</option>
</select>
```

#### Input Field Usage Rules

- **Label always above the input**, never inside (placeholder text is for hints only, not labels).
- **Required fields** marked with a red asterisk `*` next to the label.
- **Helper text** in `text-xs text-slate-mid` below the input — always present for complex fields.
- **Error messages** replace helper text when validation fails — same position, red colour.
- **All inputs: minimum height 48px** on mobile (achieved via `py-3` on a `text-base` input).

---

### Cards

#### Default Card

```html
<div class="
  bg-white rounded-xl
  shadow-base
  p-6
  border border-slate-border/50
">
  <!-- card content -->
</div>
```

#### Hover/Interactive Card (e.g., Issue cards on the board)

```html
<div class="
  bg-white rounded-xl
  shadow-base
  p-5
  border border-slate-border/50
  cursor-pointer
  transition-all duration-200
  hover:shadow-md hover:border-fir-green/30 hover:-translate-y-0.5
  active:scale-[0.99]
">
  <!-- card content -->
</div>
```

#### KPI Dashboard Card

```html
<div class="
  bg-white rounded-xl
  shadow-base
  p-6
  border border-slate-border/50
  flex flex-col gap-2
">
  <span class="text-sm font-medium text-slate-mid uppercase tracking-wide">Open Issues</span>
  <span class="text-4xl font-bold text-slate-dark font-display">3</span>
  <span class="text-sm text-antique-gold font-medium">1 overdue</span>
</div>
```

#### Success KPI Card (all clear)

```html
<div class="
  bg-fir-green-subtle rounded-xl
  shadow-base
  p-6
  border border-fir-green/20
">
  <!-- green variant for complete checklist / no open issues -->
</div>
```

#### Warning KPI Card (overdue or no report)

```html
<div class="
  bg-antique-gold-subtle rounded-xl
  shadow-base
  p-6
  border border-antique-gold/30
">
</div>
```

---

### Checklist Item

```html
<label class="
  flex items-start gap-4
  p-4 rounded-lg
  cursor-pointer
  transition-colors duration-200
  hover:bg-cream
  has-[:checked]:bg-fir-green-subtle
  min-h-[48px]
">
  <input
    type="checkbox"
    class="
      mt-0.5 w-5 h-5 rounded
      border-2 border-slate-border
      text-fir-green
      cursor-pointer
      focus:ring-2 focus:ring-fir-green focus:ring-offset-1
      checked:bg-fir-green checked:border-fir-green
    "
  />
  <div class="flex flex-col gap-0.5 flex-1">
    <span class="text-base font-medium text-slate-dark has-[:checked]:line-through has-[:checked]:text-slate-mid">
      Server Health Check
    </span>
    <span class="text-xs text-slate-mid">
      <!-- shown after check: "Checked by Ahmed at 8:42 AM" -->
    </span>
  </div>
</label>
```

**Overdue item (carried from previous shift):**
```html
<div class="
  flex items-start gap-4 p-4 rounded-lg
  bg-antique-gold-subtle
  border border-antique-gold/40
  min-h-[48px]
">
  <!-- same structure + "⚠ Overdue from Morning Shift" badge -->
</div>
```

---

### Priority Badge

```html
<!-- Critical -->
<span class="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded-sm
  text-xs font-semibold
  bg-[#FDECEA] text-[#C0392B] border border-[#C0392B]
">
  <span class="w-1.5 h-1.5 rounded-full bg-[#C0392B]"/>
  Critical
</span>

<!-- High -->
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-antique-gold-subtle text-antique-gold border border-antique-gold">
  High
</span>

<!-- Medium -->
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-300">
  Medium
</span>

<!-- Low -->
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-300">
  Low
</span>
```

---

### Status Badge

```html
<!-- Open -->
<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">Open</span>

<!-- In Progress -->
<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-antique-gold-subtle text-antique-gold">In Progress</span>

<!-- Resolved -->
<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-fir-green-subtle text-fir-green">Resolved</span>

<!-- Escalated -->
<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEA] text-[#C0392B]">Escalated</span>
```

---

### Modals

#### Structure

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-slate-dark/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">

  <!-- Modal Panel -->
  <div class="
    bg-white w-full
    rounded-t-2xl md:rounded-xl
    shadow-xl
    max-w-md md:w-full
    p-6
    animate-slide-up md:animate-fade-in
  ">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-slate-dark font-display">Confirm Resolution</h2>
      <button class="p-2 rounded hover:bg-cream text-slate-mid" aria-label="Close">
        <svg class="w-5 h-5"/><!-- X icon -->
      </button>
    </div>

    <!-- Body -->
    <p class="text-base text-slate-dark mb-6">
      Mark KHY-007 as Resolved? This will notify the IT Manager.
    </p>

    <!-- Footer -->
    <div class="flex gap-3 flex-col md:flex-row-reverse">
      <button class="...primary button...">Confirm</button>
      <button class="...secondary button...">Cancel</button>
    </div>

  </div>
</div>
```

**Animation classes:**
```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-slide-up { animation: slide-up 250ms ease-out; }
.animate-fade-in  { animation: fade-in 200ms ease-out; }
```

**Behaviour rules:**
- Modal slides up from bottom on mobile (feels like a bottom sheet), fades in centered on desktop.
- **Cannot be dismissed by clicking the overlay** for critical confirmations (resolve, escalate, critical flag). Can be dismissed by overlay for informational modals.
- Pressing `Escape` always closes the modal.
- Focus trapped inside modal while open (use Radix Dialog for this).

---

### Alerts & Toasts

#### Persistent Banner (Offline / Reminder)

```html
<div class="
  w-full px-4 py-3
  bg-antique-gold-subtle border-b border-antique-gold/40
  flex items-center gap-3
  text-sm font-medium text-[#7A5B18]
">
  <svg class="w-4 h-4 shrink-0"/><!-- Wifi-off icon -->
  <span>You're offline — changes will sync when reconnected</span>
  <span class="ml-auto text-xs">3 actions queued</span>
</div>
```

#### Toast Notification (auto-dismissing, 4 seconds)

```html
<!-- Success Toast -->
<div class="
  flex items-center gap-3
  bg-fir-green text-white
  px-4 py-3 rounded-lg shadow-lg
  max-w-sm w-full
  animate-slide-in-right
">
  <svg class="w-5 h-5 shrink-0"/><!-- Check icon -->
  <p class="text-sm font-medium">Checklist item saved</p>
  <button class="ml-auto p-1 hover:opacity-70" aria-label="Dismiss">
    <svg class="w-4 h-4"/><!-- X icon -->
  </button>
</div>

<!-- Error Toast -->
<div class="flex items-center gap-3 bg-[#C0392B] text-white px-4 py-3 rounded-lg shadow-lg max-w-sm w-full">
  <svg class="w-5 h-5 shrink-0"/><!-- AlertCircle icon -->
  <p class="text-sm font-medium">Couldn't save. Check your connection.</p>
</div>

<!-- Warning Toast -->
<div class="flex items-center gap-3 bg-antique-gold text-white px-4 py-3 rounded-lg shadow-lg max-w-sm w-full">
  <svg class="w-5 h-5 shrink-0"/><!-- AlertTriangle icon -->
  <p class="text-sm font-medium">Shift report due in 30 minutes</p>
</div>
```

**Toast positioning:**
- Mobile: `fixed bottom-20 left-4 right-4` (above bottom tab bar)
- Desktop: `fixed bottom-6 right-6 w-auto max-w-sm`

---

### Loading States

#### Skeleton Card

```html
<div class="bg-white rounded-xl shadow-base p-6 animate-pulse">
  <div class="h-4 bg-slate-border/60 rounded w-1/3 mb-4"/>
  <div class="h-8 bg-slate-border/40 rounded w-1/2 mb-2"/>
  <div class="h-3 bg-slate-border/30 rounded w-1/4"/>
</div>
```

#### Skeleton Checklist Item

```html
<div class="flex items-center gap-4 p-4 animate-pulse">
  <div class="w-5 h-5 rounded bg-slate-border/50 shrink-0"/>
  <div class="flex flex-col gap-2 flex-1">
    <div class="h-4 bg-slate-border/50 rounded w-3/4"/>
    <div class="h-3 bg-slate-border/30 rounded w-1/3"/>
  </div>
</div>
```

#### Inline Spinner (for button loading state)

```html
<svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
</svg>
```

---

### Empty States

```html
<div class="flex flex-col items-center justify-center py-16 px-6 text-center">

  <!-- Icon container -->
  <div class="w-16 h-16 rounded-full bg-fir-green-subtle flex items-center justify-center mb-4">
    <svg class="w-8 h-8 text-fir-green"/><!-- context-relevant icon -->
  </div>

  <!-- Heading -->
  <h3 class="text-lg font-semibold text-slate-dark font-display mb-2">
    No open issues
  </h3>

  <!-- Subtext -->
  <p class="text-sm text-slate-mid mb-6 max-w-xs">
    Your team is all clear. Log a new issue when something needs attention.
  </p>

  <!-- CTA (when applicable) -->
  <button class="...primary button...">+ Log New Issue</button>

</div>
```

| Screen | Icon | Heading | CTA |
|---|---|---|---|
| Issues Board (empty) | `CheckCircle` | "No open issues. All clear ✓" | "+ Log New Issue" |
| Report History (empty) | `FileText` | "No shift reports yet" | "Submit First Report" |
| Escalations (empty) | `Shield` | "No active escalations" | None |
| Asset Log (empty) | `Monitor` | "No asset activity this shift" | "+ Log Activity" |
| Checklist (not configured) | `Settings` | "Checklist not configured" | None (engineer message) |

---

## 5. Accessibility Guidelines

### WCAG 2.1 Level AA Targets

All components must meet WCAG 2.1 AA as a minimum. This applies to every screen, every state.

### Colour Contrast Minimums

| Pair | Ratio | Test |
|---|---|---|
| `#19433E` (Fir Green) on `#FAF8F3` (Cream) | 9.1:1 | ✅ Passes AA (4.5:1 required) |
| White text on `#19433E` | 9.1:1 | ✅ Passes |
| `#4A4D51` (Slate) on `#FAF8F3` (Cream) | 7.8:1 | ✅ Passes |
| `#BD8D27` (Antique Gold) on White | 3.1:1 | ⚠ Fails on small text — only use Gold on backgrounds or as bold/large text |
| White text on `#BD8D27` | 3.1:1 | ⚠ Fails — **never put small white text on gold background** |
| `#C0392B` (Error Red) on White | 5.9:1 | ✅ Passes |
| `#6B6E73` (Slate Light) on White | 4.7:1 | ✅ Passes for body text |

**Gold colour rule:** Antique Gold (`#BD8D27`) must **only** be used for:
- Large display text (24px+) on white/cream
- Borders and icon fills (no text contrast requirement)
- Backgrounds with dark (`#4A4D51`) text on top — that pair is 4.9:1 ✅

### Keyboard Navigation

All interactive elements must be reachable and operable via keyboard:
- `Tab` — moves focus through all interactive elements in DOM order
- `Enter` / `Space` — activates buttons, checkboxes, and links
- `Escape` — closes modals, bottom sheets, and dropdowns
- `Arrow keys` — navigate within dropdowns and select menus
- All forms submittable with `Enter` from the last field

### Focus Indicator Styling

Never suppress the default browser focus ring without replacing it. Use:

```css
/* Applied to all interactive elements */
.focus-visible:focus {
  outline: none;
  box-shadow: 0 0 0 3px #FAF8F3, 0 0 0 5px #19433E;
}
```

This gives a white halo + Fir Green outer ring — visible on both light and dark backgrounds.

### ARIA Requirements

| Component | Required ARIA |
|---|---|
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to heading |
| Icon-only button (FAB, close) | `aria-label="Log new issue"` |
| Checklist checkbox | `aria-label="Server Health Check"` (not just the visual label) |
| Toast notification | `role="alert"` for errors, `role="status"` for success |
| Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="12"` |
| Priority badge | `aria-label="Priority: Critical"` |
| Loading skeleton | `aria-busy="true"` on the container |
| Offline banner | `role="alert"` — announces to screen readers immediately |

### Minimum Font Sizes

- Body text: **16px minimum** (never smaller for readable content)
- Helper / meta text: **14px minimum**
- Timestamp / secondary labels: **12px minimum** — use sparingly, only for non-critical metadata

---

## 6. Animation Guidelines

### Timing

| Token | Duration | Usage |
|---|---|---|
| `duration-fast` | 150ms | Micro-interactions: checkbox tick, button press |
| `duration-base` | 200ms | Default: hover states, colour transitions |
| `duration-moderate` | 250ms | Modal slide-up, drawer open |
| `duration-slow` | 350ms | Page transitions, skeleton fade-out |

### Easing Functions

```css
--ease-default:  cubic-bezier(0.4, 0, 0.2, 1);   /* Tailwind default — most UI transitions */
--ease-out:      cubic-bezier(0, 0, 0.2, 1);      /* Elements entering the screen */
--ease-in:       cubic-bezier(0.4, 0, 1, 1);      /* Elements leaving the screen */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* FAB button, checkbox — playful snap */
```

### What to Animate

**Always animate using `transform` and `opacity` only** — these are GPU-composited and never cause layout reflow.

| ✅ Animate | ❌ Never Animate |
|---|---|
| `transform: translateY()` — slide in/out | `height` or `width` |
| `transform: scale()` — press feedback | `padding` or `margin` |
| `opacity` — fade in/out | `top`, `left`, `right`, `bottom` |
| `transform: rotate()` — spinner | `background-color` (use `transition-colors` only for simple colour switches) |

### Specific Animations

```css
/* Modal slides up on mobile */
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Toast slides in from right on desktop */
@keyframes slide-in-right {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

/* Checklist item check — quick scale snap */
@keyframes check-snap {
  0%   { transform: scale(1); }
  50%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}

/* Escalation card pulse — gold glow */
@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(189, 141, 39, 0); }
  50%       { box-shadow: 0 0 0 6px rgba(189, 141, 39, 0.3); }
}
```

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations must be wrapped in this — it is required for accessibility.

---

## 7. Icon System

### Library: Lucide React 0.414.0

```bash
npm install lucide-react@0.414.0
```

Docs: https://lucide.dev

### Sizes

| Size | px | Usage |
|---|---|---|
| `w-4 h-4` | 16px | Inline with small text, badge icons, timestamp icons |
| `w-5 h-5` | 20px | Button icons, input prefix icons, nav tab icons |
| `w-6 h-6` | 24px | Default standalone icons, card header icons |
| `w-8 h-8` | 32px | Section heading icons |
| `w-10 h-10` | 40px | Empty state icons (inside container) |

### Icon Mapping (App-Specific)

| Element | Icon | Lucide Name |
|---|---|---|
| Dashboard | `LayoutDashboard` | `layout-dashboard` |
| Checklist | `ClipboardCheck` | `clipboard-check` |
| Issues Board | `AlertCircle` | `alert-circle` |
| Shift Report | `FileText` | `file-text` |
| Asset Log | `Monitor` | `monitor` |
| Escalations | `ArrowUpCircle` | `arrow-up-circle` |
| New Issue (FAB) | `Plus` | `plus` |
| Resolved | `CheckCircle2` | `check-circle-2` |
| Critical Alert | `Zap` | `zap` |
| Overdue | `Clock` | `clock` |
| Offline | `WifiOff` | `wifi-off` |
| Manager | `ShieldCheck` | `shield-check` |
| Logout | `LogOut` | `log-out` |
| Settings | `Settings` | `settings` |
| Escalate | `ChevronsUp` | `chevrons-up` |

### Usage Patterns

```jsx
import { ClipboardCheck } from 'lucide-react';

// Always pass explicit size — never rely on default
<ClipboardCheck className="w-5 h-5 text-fir-green" aria-hidden="true" />

// Icon with label — icon is decorative, text is the accessible label
<button className="flex items-center gap-2">
  <Plus className="w-5 h-5" aria-hidden="true" />
  <span>New Issue</span>
</button>

// Icon-only — must have aria-label on the button
<button aria-label="Log new issue">
  <Plus className="w-6 h-6" aria-hidden="true" />
</button>
```

### Rules

- Always `aria-hidden="true"` on icons that accompany text labels — the text is the accessible name.
- Icon-only buttons always need an `aria-label` on the button element.
- Icons must never be the sole indicator of status (e.g., don't use only a red icon to indicate critical — always pair with text or a badge).

---

## 8. Responsive Design

### Mobile-First Approach

All styles are written for mobile first. Desktop styles are added using `md:`, `lg:`, and `xl:` prefixes.

```css
/* Mobile-first example: card padding */
.card { padding: 16px; }                   /* mobile default */
@media (min-width: 768px) { padding: 24px; } /* desktop override */

/* Tailwind equivalent */
<div class="p-4 md:p-6">
```

### Touch Target Minimums

**All interactive elements must have a minimum tap target of 48×48px on mobile.** This applies even if the visual element is smaller.

```html
<!-- Checkbox row: the entire row is the tap target, not just the 20px checkbox -->
<label class="flex items-center gap-4 p-4 cursor-pointer min-h-[48px]">
  <input type="checkbox" class="w-5 h-5"/>
  <span>Server Health Check</span>
</label>

<!-- Small icon button: invisible padding expands the tap area -->
<button class="p-3 -m-1 rounded" aria-label="Close">
  <!-- Visual: 20px icon. Tap target: 44px due to p-3 -->
  <svg class="w-5 h-5"/>
</button>
```

### Component Responsive Behaviour

| Component | Mobile (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| Navigation | Fixed bottom tab bar (4 icons) | Fixed left sidebar (full labels) |
| Dashboard | Stacked cards, full width | 2×2 grid (engineer), 3-col (manager) |
| Checklist | Single column, full-width rows | Single column, max-width 600px centred |
| Issues Board | List view, tap → full screen | 2-col card grid, drawer panel on click |
| New Issue Form | Wizard (one section per screen) | Single page, all fields visible |
| Shift Report Form | Wizard, auto-filled sections collapsed | Single page, side-by-side short fields |
| Modals | Slides up from bottom | Fades in centred, max-width 480px |
| Toasts | Bottom of screen, above tab bar | Bottom-right corner |
| Filter panel | Bottom sheet (tap Filter button) | Inline bar above the board |
| Manager Dashboard | Stacked KPI cards | 3-column full layout |

### Thumb Zone (Mobile)

Primary actions must fall within comfortable thumb reach on a standard phone.

```
┌─────────────────────┐
│  ░░░░░░░░░░░░░░░░░  │  ← Hard to reach (header) — logo, username OK
│  ░░░░░░░░░░░░░░░░░  │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │  ← Reachable — scrollable content
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← Ideal thumb zone — FAB, primary CTAs
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ██████████████████  │  ← Bottom nav — always in thumb zone
└─────────────────────┘
```

- **FAB (+ New Issue):** `fixed bottom-20 right-4` — sits just above the tab bar, right thumb zone
- **Primary submit buttons:** pinned to bottom of form on mobile (`sticky bottom-4`)
- **Destructive/danger actions:** placed at the top of the screen or behind a "More" menu — not in thumb zone to prevent accidental taps

---

*Document prepared for The Khyber Himalayan Resort & Spa IT Team — Gulmarg, J&K*
*Design system derived from brand assets: Fir Green #19433E | Antique Gold #BD8D27 | Slate #4A4D51*
*Playfair Display (headings) + Nunito Sans (body)*
