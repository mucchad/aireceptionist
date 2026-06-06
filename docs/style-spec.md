# Switchboard — Style Spec (Direction C · Warm & Approachable)

A design spec for the **Switchboard** AI‑receptionist app. Two surfaces:

1. **Admin panel** (internal — accounts list, account detail, knowledge base, leads)
2. **Owner dashboard** (the shareable secret link each client opens — their leads list)

This document is the source of truth for visual style. Implement tokens first, then components, then screens. Everything below is copy‑paste ready.

---

## 1. Design principles

- **Warm, human, trustworthy.** The buyer is a small‑business owner who is *not* tech‑savvy. Favor plain language, generous spacing, soft rounded shapes, and warm off‑white surfaces over slick "techy" UI.
- **Cream, not white.** Page background is a warm off‑white (`#f7f0e6`); cards are a near‑white warm tone (`#fffdf9`). Never use pure `#ffffff` or pure `#000`.
- **One accent.** Terracotta (`#c8633f`) is the only brand accent. Use it sparingly — primary buttons, active tab underline, key highlights. Status colors (green/amber) are functional, not decorative.
- **Rounded & soft.** Large radii (cards 18px, controls 12px), full‑pill badges and avatars, soft warm shadows. No hard hairlines or sharp corners.
- **Calm density.** Comfortable row heights (64px), clear hierarchy, no clutter. Every element earns its place.

---

## 2. Typography

Load from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&display=swap" rel="stylesheet">
```

| Role | Family | Notes |
|---|---|---|
| **Display** (page titles, brand, stat values, avatars) | `Bricolage Grotesque` | Characterful warm grotesque. Weights 600–700. |
| **Body / UI** (everything else, incl. phone numbers) | `Hanken Grotesk` | Friendly humanist sans. Weights 400–700. |

> Note: Direction C does **not** use a monospace font. Phone numbers render in Hanken Grotesk with normal letter‑spacing — this reads as friendlier than mono.

**Type scale**

| Token | Size / Weight / Tracking | Usage |
|---|---|---|
| Page title (`h1`) | 28px · 700 · −0.015em · Bricolage | "Accounts", "Here's who reached out" |
| Stat value | 28px · 700 · −0.02em · Bricolage | The big number in a stat card |
| Row name | 14px · 600 · Hanken | Business / customer name |
| Body | 14px · 400 · 1.45 line‑height · Hanken | Job descriptions, default text |
| Secondary | 13px · 400 · Hanken | Dates, timestamps, captions |
| Small / sub | 12px · 400 · Hanken | Phone under name, category line |
| Label (uppercase) | 11.5px · 600 · 0.03–0.05em · uppercase · Hanken | Stat keys, table headers |
| Badge / pill | 11.5px · 600 · Hanken | Status & count pills |

Base font-size `14px`, base line-height `1.45`, `-webkit-font-smoothing: antialiased`.

---

## 3. Color tokens

Paste this into your global stylesheet (e.g. `:root` or a Tailwind theme). Names are semantic.

```css
:root {
  /* Surfaces */
  --color-bg:            #f7f0e6; /* warm cream page background */
  --color-surface:       #fffdf9; /* cards, top bar, panels */
  --color-surface-sunken:#f4ecdd; /* inputs, resolved badge, inset chips */
  --color-row-hover:     #faf4ea;

  /* Borders */
  --color-border:        #e9ddc9; /* default 1px borders */
  --color-border-soft:   #f0e7d8; /* row dividers */

  /* Text */
  --color-text:          #2c2620; /* primary (warm near-black) */
  --color-text-secondary:#5a5247;
  --color-text-muted:    #938876; /* labels, captions, placeholders */

  /* Brand accent — terracotta */
  --color-accent:        #c8633f;
  --color-accent-hover:  #b6502d;
  --color-accent-text:   #b6502d; /* accent text on light bg (AA-safe) */
  --color-accent-weak:   #f6e3da; /* accent-tinted fill (badges, active pill) */
  --color-on-accent:     #ffffff; /* text/icon on a solid accent fill */
  --color-accent-2:      #d9954a; /* warm amber, secondary brand tone */

  /* Status — Live / online (green) */
  --color-live:          #3f8f6b;
  --color-live-weak:     #e4f0e8;
  --color-live-ring:     rgba(63,143,107,.45); /* pulse animation ring */

  /* Status — POC / pending / "contacted" (amber) */
  --color-amber:         #c0852a;
  --color-amber-weak:    #f7ecd6;
}
```

**Status color mapping**

| State | Text color | Fill |
|---|---|---|
| `Live` (account) | `--color-live` | `--color-live-weak` |
| `POC` (account) | `--color-amber` | `--color-amber-weak` |
| `New` (lead) | `--color-accent-text` | `--color-accent-weak` |
| `Contacted` (lead) | `--color-amber` | `--color-amber-weak` |
| `Resolved` (lead) | `--color-text-muted` | `--color-surface-sunken` |

---

## 4. Shape, spacing & elevation

```css
:root {
  --radius-card:    18px; /* cards, panels, stat tiles */
  --radius-control: 12px; /* buttons, inputs */
  --radius-pill:    999px;/* badges, avatars, live pill, count chips */
  --radius-logo:    9px;

  --shadow-card:   0 2px 14px rgba(120,90,50,.06);  /* soft warm card lift */
  --shadow-accent: 0 4px 14px rgba(200,99,63,.28);  /* primary button glow */
}
```

- **Avatars are circles** (`--radius-pill`) in Direction C.
- **Badges are full pills** (`--radius-pill`).
- Spacing rhythm: page padding `26px 28px 28px`; vertical gap between page sections `18px`; stat‑grid gap `14px`.
- Shadows are warm‑toned and subtle — never gray, never harsh.

---

## 5. Components

### Top bar
- Height `60px`, `--color-surface` bg, `1px solid --color-border` bottom, horizontal padding `28px`, items gap `18px`.
- **Brand lockup:** 26×26 rounded‑square logo (`--radius-logo`, solid `--color-accent` fill, white initial, Bricolage 800) + wordmark (16px, Bricolage, `--color-text`).
- Admin only: a context pill labeled "Admin" — 11px uppercase, `--color-text-muted`, `1px --color-border`, pill radius.
- Right side: search input (admin) and/or a 30px circular user avatar; owner surface shows a **Live pill** + ghost "Export" button.

### Buttons

```
height: 38px; padding: 0 16px; border-radius: var(--radius-control);
font: 600 13.5px Hanken; display: inline-flex; align-items: center; gap: 8px;
```

- **Primary:** `background: var(--color-accent)`, `color: var(--color-on-accent)`, `box-shadow: var(--shadow-accent)`. Hover → `--color-accent-hover`.
- **Ghost:** transparent bg, `color: var(--color-text)`, `1px solid var(--color-border)`. Hover → `--color-row-hover`.
- A leading "+" glyph (16px) for create actions ("+ New account").

### Search input
`240×34px`, `--color-surface-sunken` bg, `1px --color-border`, `--radius-control`, 13px text, placeholder in `--color-text-muted`. Focus ring uses `--color-accent`.

### Stat card
- `--color-surface` bg, `1px --color-border`, `--radius-card`, `--shadow-card`, padding `16px 18px`, internal gap `7px`.
- **Key:** 11.5px, 600, uppercase, `0.03em`, `--color-text-muted`.
- **Value:** 28px, 700, Bricolage, `-0.02em`. May trail a small (12px, 600) delta string — green (`--color-live`) for positive, muted for neutral (e.g. "+18%", "● 2 just in", "by Switchboard").
- Admin uses a 4‑up grid; owner uses 3‑up.

### Tabs (filter)
- Row of tabs over a `1px --color-border` baseline.
- Tab: padding `9px 14px`, 13px / 600, `--color-text-muted`; **active** → `--color-text` with a `2px solid --color-accent` bottom border.
- Each tab carries a **count chip**: 11px / 700, pill radius, `--color-surface-sunken` bg / muted text; on the active tab the chip is `--color-accent-weak` bg / `--color-accent-text`.

### List panel + rows
- Panel: `--color-surface`, `1px --color-border`, `--radius-card`, `--shadow-card`, `overflow: hidden`.
- **Header row:** height `42px`, 11px uppercase `0.05em` `--color-text-muted`.
- **Data row:** height `64px`, divider `1px --color-border-soft` (none on last), hover bg `--color-row-hover`. Use CSS Grid for columns (see §6).
- Rows are clickable in the admin (whole row → account detail); show a trailing `›` chevron (`--color-text-muted`, 15px).

### Avatar (initials)
- 34×34 circle, `--color-accent-weak` bg, `--color-accent-text` initials (Bricolage, 13px, 700). Up to 2 letters from the name.
- The "me" avatar in the top bar is 30px on a solid accent fill.

### Badge / status pill

```
display:inline-flex; align-items:center; gap:6px;
font:600 11.5px Hanken; padding:3px 9px; border-radius:var(--radius-pill);
```

Leading 6px dot in `currentColor`. Colors per the §3 status table.

### Channel chip (Call vs Text)
- 13px / 600 text + an 8px marker dot, gap `7px`.
- **Call:** solid dot in `--color-accent`.
- **Text:** 9px dot, transparent fill, `2px solid --color-text-muted` ring (hollow).
- Label reads "Call" or "Text".

### Status selector (owner leads)
- Renders the current status badge followed by a small `▾` chevron (9px, `--color-text-muted`) to signal it's changeable.
- Interaction (for build): clicking cycles/opens **New → Contacted → Resolved**. Resolved shows no chevron (terminal), or allow reopen per your preference.

### Live pill + pulse
- `display:inline-flex; gap:7px; padding:5px 11px; border-radius:var(--radius-pill);`
  `font:600 12px; color:var(--color-live); background:var(--color-live-weak);`
- Leading 7px dot in `--color-live` with an expanding‑ring pulse:

```css
.live-dot { box-shadow: 0 0 0 0 var(--color-live-ring); animation: pulse 1.8s infinite; }
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 var(--color-live-ring); }
  70%  { box-shadow: 0 0 0 7px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

---

## 6. Screen layouts

### A) Admin — Accounts list
- Top bar: brand · "Admin" pill · spacer · search ("Search accounts…") · user avatar.
- Page head: `h1` "Accounts" + muted subtitle; right‑aligned **primary** "+ New account".
- Stat grid (4): Total accounts · Live (+ "● active") · In POC · Leads this week (+ delta).
- Tabs: All / Live / POC (with counts).
- Table grid columns:
  `grid-template-columns: minmax(0,1.7fr) 120px 172px 150px 96px 22px;`
  → **Business** (avatar + name + category) · **Status** (Live/POC badge) · **Phone number** · **Created** (e.g. "Apr 2, 2026") · **Leads** (count) · chevron.
- Whole row is a link to the account detail.

### B) Owner — Leads dashboard (the shareable link)
- Top bar: **the client's** brand (their name + initial logo) · spacer · **Live pill** · ghost "Export". (No admin context pill — this is the client's view.)
- Page head: warm `h1` "Here's who reached out" + subtitle "New messages land here the moment a call or text comes in."
- Stat grid (3): New today (+ "● N just in") · This week · Avg. first response (e.g. "38s · by Switchboard").
- Tabs: All / New / Contacted / Resolved (with counts).
- Table grid columns:
  `grid-template-columns: 210px minmax(0,1.7fr) 116px 116px 150px;`
  → **Customer** (avatar + name + phone) · **What they need** (job description, clamp to 2 lines) · **Channel** (Call/Text chip) · **When** (time / "Yesterday") · **Status** (status selector).
- **Real‑time:** new leads animate in at the top of the list; the Live pill indicates the connection is active. Status changes persist per lead.

---

## 7. Voice & copy

- Plain, warm, jargon‑free. The owner is a plumber, not an engineer.
- Prefer human phrasing: "Here's who reached out" over "Lead Inventory"; "What they need" over "Description"; "When" over "Timestamp".
- Sentence case everywhere except the small uppercase labels. No exclamation overload, no emoji.
- Numbers/metrics only when useful to the owner — avoid vanity stats.

---

## 8. Accessibility

- Body text and `--color-text` on `--color-surface` exceed WCAG AA. Use `--color-accent-text` (not raw `--color-accent`) for accent text on light backgrounds.
- Don't rely on the channel dot alone — always pair with the "Call"/"Text" label.
- Hit targets ≥ 36px (buttons are 38px; rows 64px).
- Respect `prefers-reduced-motion`: disable the live‑pill pulse and any lead‑entrance animation.
- Visible focus rings on inputs, buttons, tabs, and rows (use `--color-accent`).

---

*Reference implementation of both screens in this style: `Style Directions.html` (Section C). "Switchboard" and the logo mark are placeholders — swap for the real product name/logo.*
