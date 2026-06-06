# AI Receptionist — Project Bible

## What We're Building
A multi-tenant SaaS AI receptionist platform for SMB service businesses (plumbers, HVAC, cleaners, fence companies, etc.). Each business gets a dedicated phone number, a customizable AI persona, a knowledge base, and a dashboard. Vijay sells directly to businesses and manages onboarding.

## Product Name
**AI Switchboard** (working name — may change later)
- Wordmark: "Switchboard" in Bricolage Grotesque
- Logo mark: small AI icon (circuit node / spark) in a 26×26 rounded square with terracotta fill
- Never use the letter "S" as the logo — always use the AI icon

## Who I'm Working With
Vijay is product-minded — hasn't coded in 20+ years. He reads code to follow along but won't write it. Always explain decisions in **product terms first, technical terms second**. Never dump syntax without explaining what it does and why.

## Collaboration Rules
- **Always plan before building.** For every task, present a clear plan first — what will be built, what files will be created or changed, and why. Wait for explicit approval before writing any code.
- **Always present options before building** anything non-trivial. Show trade-offs in plain English, wait for a decision.
- **One question at a time** when brainstorming or gathering requirements.
- **Never build out of scope.** Check the POC scope doc before adding features.
- **Flag before spending money.** Twilio numbers, Claude API calls, Vercel deployments — always warn before anything that costs real money.
- **No surprises.** If something will take more than 30 minutes to build, say so upfront.
- **Confirm before proceeding.** After presenting a plan, explicitly ask "Ready to build?" and wait for a yes before starting.
- **Report when done.** After completing a task, summarize what was built in plain English and what the next step is.

## Tech Stack (decided)
| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Full-stack, one codebase |
| Database + Auth | Supabase | Postgres + auth + real-time |
| UI | shadcn/ui + Tailwind | Mobile-first, responsive |
| AI | Claude API (claude-sonnet-4-6) | AI receptionist brain |
| Phone/SMS | Twilio | Voice + SMS, WhatsApp later |
| Email | Resend | Notifications to business owners |
| Deployment | Vercel | One-click deploys |

## Architecture: Multi-Tenant
Every account (tenant) has:
- Their own dedicated Twilio phone number
- Their own knowledge base (services, hours, pricing, FAQs, service area)
- Their own AI persona settings (name, tone, emergency protocol)
- Their own notification preferences (SMS + email toggles)
- Their own dashboard (leads, call logs, bookings)
- Their own contacts (owner, manager, staff)

Vijay has a super-admin view across all accounts.

## Design System
- Full style spec lives in `docs/style-spec.md` — always follow it exactly
- Direction C: Warm & Approachable — cream backgrounds, terracotta accent, rounded shapes
- Fonts: Bricolage Grotesque (display/titles) + Hanken Grotesk (body/UI)
- Color tokens, component specs, and layout grids are all defined in the style spec
- Never use pure white (`#ffffff`) or pure black (`#000000`)
- Never invent colors or styles not in the spec

## Mobile Strategy
- Build mobile-first (design for small screen, scale up)
- PWA from day one (installable on phone without App Store)
- Capacitor wrapper for App Store listing when ready (no rewrite needed)

## Coding Standards
- TypeScript everywhere — no `any` types
- Mobile-first CSS — design small screen first
- Components go in `/components`, organized by feature
- API routes go in `/app/api`
- Database logic goes in `/lib/db`
- Keep components small and focused — one job each
- Comment the "why", not the "what"

## What NOT to Do
- Don't add features not in the current scope doc
- Don't use `any` in TypeScript
- Don't write desktop-first CSS
- Don't make API calls directly from components (use server actions or API routes)
- Don't store secrets in code — use environment variables

## File Structure
```
/app                    # Next.js pages and API routes
  /api                  # Backend API endpoints
  /(admin)              # Vijay's super-admin views
  /(dashboard)          # Business owner dashboard
  /(widget)             # Public-facing chat widget
/components             # Reusable UI components
  /ui                   # shadcn primitives
  /dashboard            # Dashboard-specific components
  /receptionist         # Chat/call UI components
/lib
  /db                   # Supabase queries
  /ai                   # Claude API logic
  /twilio               # Twilio helpers
  /prompts              # AI system prompts
/types                  # Shared TypeScript types
```
