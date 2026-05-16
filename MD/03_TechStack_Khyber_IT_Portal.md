# Technology Stack Documentation
**IT Operations Portal — The Khyber Himalayan Resort & Spa**
Version: 1.0 | Date: May 2026

---

## 1. Stack Overview

### Architecture Pattern: Monolithic Web Application

A single deployable frontend + single backend API + single database. The right choice for a 3-person internal team — simple to build with AI tools (Claude + Antar Gravity), simple to deploy, and simple to maintain. No microservices, no containers, no DevOps complexity.

### Deployment Strategy

| Layer | Primary | Fallback |
|---|---|---|
| Frontend | Vercel (free tier) | IIS static serving on Windows Server |
| Backend | Railway (Public API) | IIS + iisnode on Windows Server 2008 R2 |
| Database | Railway PostgreSQL | SQL Server 2012 (on-premise) |

### Justification for Architecture Choice

- Built entirely with Claude + Antar Gravity — no traditional developer needed
- 3 users with zero concurrent traffic spikes — monolith is entirely sufficient
- Free hosting covers the full team at near-zero cost
- If Gulmarg internet is unstable, the Windows Server fallback keeps operations running locally
- Can be extracted into services later if the team or hotel group scales

---

## 2. Frontend Stack

### Framework: Next.js 14.2.35

- **Docs:** https://nextjs.org/docs
- **Reason:** Works natively with Vercel (same company), App Router gives clean nested dashboard layouts, fast initial page loads on mobile during resort rounds, built-in TypeScript support
- **Alternatives considered:** Vite + React SPA — rejected because it requires a separate router and has no built-in SSR for fast shift report history pages

### Language: TypeScript 6.0.3

- **Docs:** https://www.typescriptlang.org/docs
- **Reason:** Catches bugs before they reach 3 users; Claude and AI tools write significantly better TypeScript than plain JS; shared types between frontend and backend
- **Alternatives considered:** Plain JavaScript — rejected; no justification for skipping types on a team-maintained codebase

### Styling: Tailwind CSS 3.4.6

- **Docs:** https://tailwindcss.com/docs
- **Reason:** Khyber brand tokens implemented as CSS variables; fast to style with AI assistance; JIT build keeps bundle minimal

**Brand tokens (`tailwind.config.js`):**
```js
colors: {
  'fir-green':    '#19433E',  // Primary
  'slate':        '#4A4D51',  // Secondary
  'antique-gold': '#BD8D27',  // Accent
  'cream':        '#FAF8F3',  // Background
}
```

**Font tokens (`globals.css`):**
```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body:    'Nunito Sans', 'Myriad Pro', Arial, sans-serif;
```

- **Alternatives considered:** CSS Modules — rejected; component-level styles slow development without meaningful benefit for an internal tool

### State Management: Zustand 4.5.4

- **Docs:** https://docs.pmnd.rs/zustand
- **Reason:** Lightweight, no boilerplate, works naturally with React hooks; used for UI state (active shift, notification count, filter selections); server state handled by TanStack Query
- **Alternatives considered:** Redux Toolkit — overkill for this app size; Jotai — considered but Zustand's single-store model is simpler

### Server State / Data Fetching: TanStack Query 5.51.1

- **Docs:** https://tanstack.com/query/latest
- **Reason:** Handles caching, background refetch, loading/error states, and optimistic updates for the Issues Board and Checklist; eliminates manual `useEffect` data fetching
- **Alternatives considered:** SWR — good but TanStack Query has better mutation support and devtools

### Form Handling: React Hook Form 7.52.1

- **Docs:** https://react-hook-form.com
- **Reason:** Uncontrolled inputs with minimal re-renders; Shift Report and New Issue forms have 8–12 fields each — performance matters on mobile; integrates cleanly with Zod
- **Alternatives considered:** Formik — rejected due to unnecessary re-renders and slower performance on mobile browsers

### Validation: Zod 3.23.8

- **Docs:** https://zod.dev
- **Reason:** Schema definitions shared between frontend (form validation) and backend (API input validation), eliminating duplicate logic; works natively with React Hook Form via `@hookform/resolvers`
- **Alternatives considered:** Yup — less TypeScript-native; Zod is the current standard

### HTTP Client: Axios 1.7.3

- **Docs:** https://axios-http.com/docs/intro
- **Reason:** Automatic JSON parsing; request/response interceptors used to attach JWT tokens to every request and handle 401 redirects to login automatically
- **Alternatives considered:** Native Fetch — rejected because interceptor logic would require manual wrapper code

### UI Components: shadcn/ui (June 2024 release)

- **Docs:** https://ui.shadcn.com
- **Reason:** Components are copied into the codebase (not a runtime dependency), fully customizable to Khyber brand colors, built on Radix UI primitives for accessibility; checkboxes, dialogs, selects, and toasts used extensively
- **Alternatives considered:** MUI — heavy bundle, opinionated styling conflicts with Tailwind; Headless UI — less complete

### Icons: Lucide React 0.414.0

- **Docs:** https://lucide.dev
- **Reason:** Clean, consistent icons for checklist items, issue priorities, and navigation; tree-shakeable

### Date Handling: date-fns 3.6.0

- **Docs:** https://date-fns.org
- **Reason:** Shift times, issue timestamps, and report dates are core to the app; modular (tree-shakeable), immutable, excellent TypeScript types
- **Alternatives considered:** Day.js — good alternative but date-fns tree-shaking is superior

---

## 3. Backend Stack

### Runtime: Node.js 24.14.1

- **Docs:** https://nodejs.org/en/docs
- **Reason:** Current production runtime on Railway; consistent language with frontend
- **Fallback note:** Windows Server runs Node.js 12.22.12 (EOL). Backend code is written to be compatible with Node 12 for fallback deployment. Upgrade plan documented in Section 10.

### Framework: Express 5.2.1

- **Docs:** https://expressjs.com
- **Reason:** Simplest possible backend — Claude and AI tools write Express extremely well; no framework magic to debug; fully compatible with Node 12 for the Windows Server fallback
- **Note:** Fastify was considered for performance but Express was chosen specifically for Node 12 fallback compatibility
- **Alternatives considered:** Fastify 4.x — faster but more complex Node version requirements; NestJS — too opinionated and heavyweight for a 3-user internal tool

### Database: PostgreSQL 16 (Railway)

- **Docs:** https://www.postgresql.org/docs/16
- **Provider:** Railway
- **Reason:** All data is relational with foreign keys (users → shifts → issues → reports); full-text search on issue descriptions via `tsvector`; JSONB for flexible remarks fields
- **Fallback Database:** SQL Server 2012 via `mssql 12.5.3` — Prisma supports both; switching is a connection string change + one migration run
- **Alternatives considered:** MongoDB — rejected because the data model is clearly relational; MySQL 8 — PostgreSQL's JSONB and full-text features are superior

### ORM: Prisma 7.8.0

- **Docs:** https://www.prisma.io/docs
- **Reason:** Type-safe queries generated from schema; auto-generated TypeScript types used across frontend and backend; excellent migration tooling; Prisma Studio for manager to inspect data; supports both PostgreSQL and SQL Server
- **Alternatives considered:** Drizzle ORM — faster and more lightweight but Prisma's migration story and Studio are better for a team without a dedicated DBA

### Authentication: JWT + bcryptjs

- **jsonwebtoken 9.0.3** — access tokens (15 min expiry) | https://github.com/auth0/node-jsonwebtoken
- **bcryptjs 3.0.3** — password hashing at 10 rounds (~150ms on Windows Server 2008 R2)
- **Reason:** Stateless JWT access tokens + refresh tokens stored in the database (no Redis needed for 3 users); `bcryptjs` chosen over `bcrypt` because it is pure JavaScript with no native bindings — required for Windows Server 2008 R2 compatibility
- **Refresh token storage:** Database table `refresh_tokens` — keyed by `userId` + `tokenId`; invalidated on logout or password change

### Notifications: Email + In-App

**Email — Resend 6.12.3**
- **Docs:** https://resend.com/docs
- **Reason:** Free tier (3,000 emails/month) — sufficient for 3 users many times over; React Email templates (same language as frontend); simple API; no infrastructure to manage
- **Triggers:** Critical issue logged, shift report submitted, escalation created, shift report reminder (30 min before end), critical issue resolved
- **Alternatives considered:** SendGrid — more complex setup, less predictable pricing at low volume; Nodemailer + SMTP — adds infrastructure overhead and requires a mail server

**In-App Notifications — Database-driven (no third-party service)**
- **How it works:** A `notifications` table in PostgreSQL stores unread alerts per user; the frontend polls every 30 seconds (or uses WebSocket push if added in V1.1) to fetch new notifications; a bell icon in the nav header shows unread count badge
- **Cost:** $0 — built into the existing database and API
- **Triggers:** Same events as email — Critical issue, escalation, shift report submitted, overdue reminder; also triggers for both engineers when a new issue is assigned to them
- **Notification record fields:** `id`, `userId`, `type`, `title`, `message`, `linkUrl`, `isRead`, `createdAt`
- **Alternatives considered:** Push notifications (Web Push API) — deferred to V1.2 as a PWA feature; Twilio WhatsApp — removed per team preference

### File Uploads: Cloudinary 2.3.1

- **Docs:** https://cloudinary.com/documentation
- **Reason:** Issue screenshots and photos stored free (25GB); image optimization and CDN delivery; no server storage needed; no S3 bucket policy management
- **Alternatives considered:** AWS S3 — more powerful but requires more configuration; local storage — rejected because files are lost on server redeploy

### Validation: Zod 3.23.8 (shared with frontend)

- All API route inputs validated with Zod schemas defined in `/packages/schemas` or duplicated in `/backend/src/schemas` if not using a monorepo

---

## 4. DevOps & Infrastructure

### Git Branching Strategy (GitHub Flow)

```
main          → production (Vercel + Render auto-deploy on push)
dev           → staging / testing environment
feature/*     → built by Claude/AI tools, merged via PR
hotfix/*      → critical fixes merged directly to main with review
```

### CI/CD

| Trigger | Action |
|---|---|
| Push to `dev` | Lint + type-check → deploy to staging |
| Merge to `main` | Full check → auto-deploy to Vercel (frontend) + Render (backend) |

No complex pipeline needed for a 3-user internal tool. Vercel and Railway handle deployment automatically on `git push`.

### Hosting Summary

| Layer | Service | Cost |
|---|---|---|
| Frontend | Vercel Free | $0/mo |
| Backend | Railway Free | $0/mo |
| Database | Railway Free | $0/mo |
| Email | Resend Free | $0/mo |
| In-App Notifications | Built-in (DB-driven) | $0/mo |
| File Storage | Cloudinary Free | $0/mo |
| **Total** | | **$0/month guaranteed** |

### Windows Server Fallback Deployment

```
IIS → iisnode → Express app (Node 12 compatible build)
SQL Server 2012 → mssql 10.0.4 driver
Static frontend → IIS static file serving
```

Switch from Render to fallback: change `DATABASE_URL` to SQL Server connection string + run `prisma migrate deploy`.

### Monitoring & Error Tracking

| Tool | Purpose | Cost |
|---|---|---|
| Better Uptime | Pings `/health` every 3 min, alerts on downtime | Free |
| Sentry (free tier) | Frontend + backend error tracking (5K errors/month) | Free |
| Railway Logs | Backend console log viewer | Included |
| Vercel Analytics | Frontend performance monitoring | Free |

---

## 5. Development Tools

### Linter: ESLint 8.57.0

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Formatter: Prettier 3.3.3

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Package Manager: npm

Chosen over pnpm/yarn for compatibility with Node 12 on the Windows Server fallback. No monorepo workspace complexity.

### Git Hooks: Husky 9.1.3 + lint-staged 15.2.7 (optional, V1.1)

- Pre-commit: run ESLint + Prettier on staged files
- Commit-msg: enforce Conventional Commits (`feat:`, `fix:`, `chore:`)

---

## 6. Environment Variables

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://api-production-7927.up.railway.app/api
NEXT_PUBLIC_APP_NAME=Khyber IT Portal
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Backend (`apps/api/.env`)

```env
# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://khyber-it-portal-web.vercel.app

# Database — Railway PostgreSQL (primary)
DATABASE_URL=postgresql://postgres:OndQOtIwgrzMRmCkZtcNTSMFFITECcpc@yamanote.proxy.rlwy.net:55025/railway

# Database — SQL Server 2012 (fallback)
SQLSERVER_URL=Server=localhost;Database=khyber_it;User=sa;Password=yourpassword;

# Authentication
JWT_ACCESS_SECRET=khyber-minimum-32-character-secret-here
JWT_REFRESH_SECRET=khyber-different-32-character-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=10

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=IT Portal <it@khyberhotel.com>
MANAGER_EMAIL=itmanager.gulmarg@khyberhotel.com
ENGINEER1_EMAIL=sbasharat577@gamil.com
ENGINEER2_EMAIL=asrasyed330@gmail.com

# In-App Notifications (no external service — DB-driven)
# Polling interval in milliseconds (frontend polls this often for new notifications)
NOTIFICATION_POLL_INTERVAL_MS=30000

# Cloudinary
CLOUDINARY_CLOUD_NAME=khyber-it
CLOUDINARY_API_KEY=xxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 7. Package.json Scripts

### Frontend (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Backend (`package.json`)

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio"
  }
}
```

---

## 8. Dependencies Lock

### Frontend (`package.json`)

```json
{
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "typescript": "5.5.3",
    "@tanstack/react-query": "5.51.1",
    "zustand": "4.5.4",
    "react-hook-form": "7.52.1",
    "@hookform/resolvers": "3.9.0",
    "zod": "3.23.8",
    "axios": "1.7.3",
    "date-fns": "3.6.0",
    "lucide-react": "0.414.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.4.0",
    "class-variance-authority": "0.7.0",
    "@radix-ui/react-dialog": "1.1.1",
    "@radix-ui/react-checkbox": "1.1.1",
    "@radix-ui/react-select": "2.1.1",
    "@radix-ui/react-toast": "1.2.1",
    "@sentry/nextjs": "8.21.0"
  },
  "devDependencies": {
    "tailwindcss": "3.4.6",
    "postcss": "8.4.40",
    "autoprefixer": "10.4.19",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "prettier": "3.3.3",
    "prettier-plugin-tailwindcss": "0.6.5",
    "@types/node": "20.14.13",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0"
  }
}
```

### Backend (`package.json`)

```json
{
  "dependencies": {
    "express": "5.2.1",
    "cors": "2.8.6",
    "helmet": "8.1.0",
    "express-rate-limit": "8.5.2",
    "@prisma/client": "7.8.0",
    "jsonwebtoken": "9.0.3",
    "bcryptjs": "3.0.3",
    "zod": "4.4.3",
    "resend": "6.12.3",
    "cloudinary": "2.10.0",
    "mssql": "12.5.3",
    "dotenv": "17.4.2",
    "pino": "10.3.1",
    "pino-pretty": "13.1.3",
    "@sentry/node": "10.53.1"
  },
  "devDependencies": {
    "prisma": "7.8.0",
    "typescript": "6.0.3",
    "tsx": "4.22.0",
    "eslint": "10.3.0",
    "@typescript-eslint/eslint-plugin": "8.59.3",
    "@typescript-eslint/parser": "8.59.3",
    "@types/express": "5.0.6",
    "@types/jsonwebtoken": "9.0.10",
    "@types/bcryptjs": "2.4.6",
    "@types/cors": "2.8.19",
    "@types/node": "25.8.0"
  }
}
```

---

## 9. Security Considerations

### Authentication Flow

```
1. Engineer submits username + password
2. bcryptjs.compare() at 10 rounds (~150ms on Windows Server 2008 R2)
3. On success:
   - Issue JWT access token (HS256, 15 min expiry)
   - Issue JWT refresh token (7 day expiry) → stored in DB table refresh_tokens
4. Access token stored in memory (Zustand) — NEVER localStorage
5. Refresh token stored in httpOnly cookie — not readable by JavaScript
6. Every API request: Authorization: Bearer {accessToken}
7. Access token expires → frontend silently calls POST /auth/refresh via httpOnly cookie
8. On logout → refresh token deleted from DB + cookie cleared
```

### Password Hashing

| Setting | Value | Reason |
|---|---|---|
| Library | bcryptjs 2.4.3 | Pure JS — no native bindings required for Windows Server 2008 R2 |
| Rounds | 10 | ~150ms on low-spec server; resistant to brute force |
| Minimum length | 8 characters | Enforced at Zod schema level before DB |

### CORS Configuration

```typescript
cors({
  origin: process.env.FRONTEND_URL,  // Exact Vercel URL — no wildcard
  credentials: true,                  // Required for httpOnly refresh token cookie
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
})
```

### Rate Limiting

```typescript
// Global — all routes
{ windowMs: 60_000, max: 100 }

// Login endpoint — brute force protection
{ windowMs: 900_000, max: 5 }   // 5 attempts per 15 minutes

// Refresh token endpoint
{ windowMs: 60_000, max: 20 }
```

### Additional Security Measures

- **Helmet.js** sets all security headers automatically (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **All inputs** validated with Zod before any database operation — no raw SQL, no injection risk via Prisma
- **Manager-only routes** protected by `requireRole('manager')` middleware — engineers cannot access `/admin/*` or `/dashboard/overview`
- **Email addresses** stored only in environment variables — never written to the database
- **File uploads** validated by MIME type + 5MB size limit before sending to Cloudinary
- **Refresh tokens** invalidated immediately on logout, password change, or account deactivation

---

## 10. Version Upgrade Policy

### Node.js

- **Current fallback:** Node.js 12.22.12 on Windows Server 2008 R2 — EOL since April 2022
- **Current primary:** Node.js 18.20.4 LTS on Render
- **Action required:** Upgrade Windows Server to Node.js 18 LTS within 3 months; the backend is already written for Node 18 with a Node 12 compatibility target

### Major Dependency Upgrades

- Scheduled quarterly review: January, April, July, October
- Never upgrade more than one major dependency at a time
- Each upgrade requires its own branch (`upgrade/next-15`, `upgrade/prisma-6`)
- Must pass manual QA of all 6 core flows before merging to `main`
- Breaking changes documented in `/docs/upgrades/`

### Security Patches (Minor / Patch versions)

- `npm audit` run in CI on every push — fails build on high/critical vulnerabilities
- Security patches applied within 72 hours of public disclosure
- Patch-level upgrades (`5.17.0 → 5.17.1`) merged to `main` after smoke test
- Minor upgrades (`5.17.x → 5.18.0`) require manual test of affected features

### Database Migration Path

- **SQL Server 2012** is EOL since July 2022 — use as local fallback only, never as primary
- Migration to PostgreSQL on Supabase: change `DATABASE_URL` + run `prisma migrate deploy` — Prisma makes this a one-command switch
- Target: Supabase PostgreSQL as sole database within 6 months of go-live

### Windows Server 2008 R2

- EOL since January 2020 — use as offline fallback only during Gulmarg internet outages
- Long-term: replace with a small cloud VPS (DigitalOcean $6/mo) or remain on Render free tier permanently

### Testing Requirements Before Any Upgrade

1. All TypeScript type checks pass (`tsc --noEmit`)
2. Manual test of all 6 core flows: Login → Checklist → Log Issue → Update Issue → Shift Report → Manager Dashboard
3. Staging deployment verified for 24 hours before production release
4. Previous deployment tagged in Render/Vercel for instant rollback if needed

---

*Document prepared for The Khyber Himalayan Resort & Spa IT Team — Gulmarg, J&K*
*Built with Claude + Antar Gravity | Stack optimised for free-tier cloud deployment with Windows Server fallback*
