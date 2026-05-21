# L8 Events — Admin Panel Redesign

## Overview

This is a complete visual + UX redesign of the L8 Events admin panel. It replaces the existing admin (events table + modal CRUD) with a calmer, more editorial system that scales across all admin sections: **Dashboard, Events, Artists, Venues, Gallery, Messages, Users, Account**.

The design is built around a few cross-cutting decisions:
- A single **editorial aesthetic** (Instrument Serif display + Geist UI + JetBrains Mono labels), with two alternative themes (clean SaaS and dark moody) togglable in dev.
- A **shared editor pattern** (Drawer / Modal / Full-page) used by every Create + Edit flow, so the form fields differ per entity but the chrome/animation/keyboard behavior is consistent.
- **Multiple list layouts** per section (Table / Rows / Grid / Timeline / Inbox / Masonry), each tailored to the data, with the chosen layout persisted.
- **Schema-faithful UI** — only DB columns are surfaced, with derived placeholder visuals (name-hashed colors) where images aren't uploaded yet.

---

## About the Design Files

The files in this bundle are **design references created as a runnable HTML prototype** — they show intended look, layout, copy, and interaction. They are *not* production code to copy directly.

The task is to **recreate these designs inside the target codebase's existing environment** (React / Next.js / whatever the L8 admin runs on) using the project's established patterns, component library, routing, state management, and API layer. The HTML prototype uses inline JSX + Babel for fast iteration; production should use the project's normal build pipeline.

If no React-ish admin shell exists yet, React + Vite + a lightweight router (TanStack Router or React Router) is a sensible default.

---

## Fidelity

**High-fidelity.** The mocks include final colors, typography scale, spacing, border radii, hover/focus states, copy, micro-interactions (toasts, save flashes, password strength meter), and full inline-edit semantics. The developer should aim for **pixel-faithful recreation** of the visual system; component-level details (e.g. dropdown internals) can use the project's existing primitives as long as they match dimensions, type, and color.

---

## How to run the prototype locally

Open `index.html` in any browser. No build step — it loads React + Babel from a CDN. Every section in the sidebar is functional with mock state; navigate around to see every screen.

A "Tweaks" panel in the bottom-right toggles theme, list layouts per section, and the editor pattern. Use it to preview every variation in the design system.

---

## Top-level App Shell

### Sidebar (`components/sidebar.jsx`)
- **Width:** 232px, sticky full-height
- **Background:** `var(--surface)` with a `1px` right border in `var(--line)`
- **Brand mark:** 36×36 rounded square in `var(--ink)` with display-font "L8". Below: "L8 Events" in Instrument Serif 22px, and "ADMIN" overline in mono 10.5px, letter-spacing 0.12em
- **Nav items:** 9px×12px padding, gap 1px, 13.5px size. Hover = `var(--bg-2)`. Active = `var(--bg-2)` + a 3px×18px coral accent bar on the left edge.
- **Badge:** unread message count, only shown if > 0. Coral pill, 18px tall.
- **Footer:** avatar (32px circle, name-hashed bg or imageUrl), live name + email of current user.

### Topbar (every section's header)
- Padding `28px 40px 0`, gap 22px
- **Greeting line:** display-font 44px page title (e.g. "Events") + sub-line in 13px gray
- **Actions row** (right-aligned): primary action button (e.g. "New event") with a mono "N" keyboard hint
- **Toolbar row:** search input (36px tall, 340px max), status/category chip filters, divider, dropdown selects, view-switcher (right-aligned via `margin-left: auto`)

### Editor patterns (Create + Edit shells)

The same form body is rendered inside one of three shells, controlled by the `pattern` tweak:

1. **Drawer** *(default)* — slides in from the right, `max-width: 640px`, `transform: translateX(100%)` → `0`, 280ms cubic-bezier(.2,.8,.2,1), with a scrim
2. **Modal** — centered, `max-width: 880px`, `max-height: calc(100vh - 80px)`, fade + slight scale-up
3. **Full-page** — replaces the main content, fills viewport; in this layout the form gets a sidebar "Preview" column

The header always shows: a close X, a crumb ("Events / Edit"), the title, and an "Esc" key hint. Footer pins Cancel + Save (and Delete in edit mode).

---

## Screens

### 1. Dashboard (`components/dashboard-view.jsx`)
**Purpose:** Landing page. Shows what needs attention across the whole admin.

**Layout:** Single column of stacked sections inside a `.dash` wrapper.

- **Greeting block**
  - Date stamp in mono 11px, 0.15em letter-spacing, uppercase
  - "Good morning, Daniel." in Instrument Serif 56px (time-of-day aware)
  - One-line summary: "X upcoming events, **Y unread messages**." (unread count in coral)
  - Quick actions right-aligned: Inbox / Roster / New event

- **KPI row** — 4-column grid, gap 16px:
  - Each card: 20px×22px padding, label in mono 11px, big number in Instrument Serif 56px, sub-line in 12.5px
  - Cards: Upcoming events, Unread inbox (number is coral if > 0), Roster (bookable vs off-roster), Tickets sold this period

- **2-col grid (1.5fr / 1fr)** — gap 20px:
  - **Next up** — 4 closest upcoming events with date tile + title + meta + sold/capacity bar
  - **Inbox** — 4 most recent messages with unread dots, name, subject preview, relative time

- **Bottom 2-col grid (1.5fr / 1fr):**
  - Left column stacks: **Recent uploads** (4×2 image tile grid) + **Event status** (stacked bar with legend)
  - Right column: **Team mini** (4 users with avatar, name, role pill, "You" badge on current user)

All numbers click through to the relevant section.

---

### 2. Events (`components/list-views.jsx` + `event-form.jsx`)
**Purpose:** Browse, create, edit, duplicate, delete events.

**Schema fields used:** `title`, `artistIds[]`, `date`, `time`, `endTime` (optional), `venueId`, `status` (`upcoming` | `completed` | `draft` | `cancelled`), `description`, `capacity`, `sold`, `price`, `imageUrl`. (Note: capacity/sold/price/posterImage were not in your provided schemas — left alone pending your event schema. See "Open questions" at the bottom.)

**Toolbar:**
- Search across title, artists, venue name
- Status chips (All / Upcoming / Completed / Draft) with counts
- Venue dropdown
- View switcher (4 layouts)

**Four layouts, all toggleable:**

#### Table view (default)
- Background `var(--surface)`, 10px radius, `var(--line)` border
- Header row: mono 10.5px uppercase letter-spacing 0.1em, `var(--ink-3)` color, `var(--bg-2)` background, 14px×18px padding
- Body rows: 14px×18px padding, `1px solid var(--line-2)` bottom border, hover `var(--bg-2)`
- Title cell uses Instrument Serif 19px; artist chips below
- Sold column has tiny progress bar (90px×3px, `var(--accent)` fill)

#### Rows view (image-led)
- Cards: 16px padding, 12px gap between, `var(--surface)` bg, 10px radius, `var(--line)` border
- Grid: 92px poster | 1fr main | auto side
- Poster is the placeholder photo (striped SVG with monogram and date overlay)
- Hover lifts 2px and changes border to `var(--ink-3)`

#### Poster grid view
- `auto-fill, minmax(260px, 1fr)` columns, gap 18px
- Each card has a 4:5 aspect poster art block with stripes, big date in mono, title in Instrument Serif 26px, artist list in mono caps
- Footer band: venue + status pill

#### Timeline view
- Groups events by month with Instrument Serif 30px month header
- Each row: 90px date column (right-aligned, day in 38px display + DOW in mono caps) | 1fr title + meta | auto status + actions

**Event form fields:**
- Title (display-font input, 28px, transparent borderless top, bottom-border only)
- Artists multi-select chip combobox (type to filter, click to add, ↑↓/Enter/Backspace, click chip × to remove)
- Schedule: 3-col grid (date / start / end)
- Venue select, Status segmented control (4 options), Capacity number, Price number (DKK)
- Description textarea (4 rows)
- Poster dropzone

**Interactions:**
- `N` keyboard shortcut → new event
- `Esc` → close editor
- Delete → confirmation modal, then toast with **Undo** action (3.2s)
- Duplicate → adds copy with " (copy)" suffix, status = draft

---

### 3. Artists (`components/artist-views.jsx` + `artist-form.jsx`)
**Purpose:** Manage the artist roster.

**Schema fields used (exactly the DB columns):**
`id` (uuid), `name`, `bio`, `imageUrl`, `socialMedia` (JSON), `genre`, `createdAt`, `updatedAt`, `embeddings` (JSON, not surfaced in UI), `isBookable`, `bookingUserId`.

**Toolbar:**
- Search across name, genre, bio
- "All / Bookable / Off-roster" chips
- Genre dropdown (auto-derived from data)
- View switcher (3 layouts)

**Three layouts:**

#### Card grid (default)
- `auto-fill, minmax(240px, 1fr)` columns, gap 18px
- Each card: 1:1 photo placeholder at top (striped, `colorFromName(artist.name)` background, monogram in 88px Instrument Serif, "[ no photo ]" tag bottom-left, Bookable/Off-roster badge top-right)
- Body: name in 24px Instrument Serif, genre in 12.5px gray
- Foot: event count + social icons (right-aligned)

#### Rows view
- 84px photo | 1fr (name + genre + socials + 2-line bio) | 220px stats | auto side
- Hover border = `var(--ink-3)`

#### Table view
- Columns: Artist, Genre, Events, Bookable, Booking manager, Updated, Actions
- Avatar is a 36px circle with monogram

**Form fields:**
- Profile photo: 96×96 monogram preview + imageUrl text input + dropzone
- First/Last as a single "Artist name" required field
- Genre (text + datalist of common values)
- Bio (4-row textarea)
- Social media: labeled rows for Instagram, Spotify, SoundCloud, Bandcamp, Website (stored as JSON)
- Bookable toggle (custom switch with explanatory copy)
- Booking manager select (only when bookable) — pulls from `USERS`

**Placeholder color is derived, not stored.** `colorFromName(name)` produces a deterministic `oklch(0.55 0.14 H)` color from a hash of the name. This means the same artist always shows the same color across renders, but the value never persists.

---

### 4. Venues (`components/venue-views.jsx` + `venue-form.jsx`)
**Purpose:** Manage performance venues.

**Schema fields used:** `id`, `uuid`, `name`, `description`, `address`, `city`, `createdAt`, `updatedAt`, `mapEmbedHtml`.

**Toolbar:**
- Search across name, city, address, description
- City chips (auto-derived from data, with counts)
- View switcher (3 layouts)

**Three layouts:**

#### Card grid (default)
- `auto-fill, minmax(280px, 1fr)`, gap 18px
- Map area is 16:10 aspect — when `mapEmbedHtml` is set, renders the iframe `src` directly (with `pointer-events: none` so the card stays clickable)
- When empty, falls back to a **procedural map placeholder** (SVG roads deterministic from venue id+name, faint dotted grid background, colored pin in center)
- Body: name in Instrument Serif 22px, address with pin icon
- Foot: event count + upcoming count

#### Rows view
- 120px mini-map | 1fr (name + address + 2-line description) | stats | actions

#### Table view
- Columns: Venue (with small pin tile colored from name) + address sub, City, Events, Upcoming, Updated, Actions

**Form fields:**
- Name (display-font, large)
- Address (required), City (with datalist)
- Description (4-row textarea)
- Map embed: monospaced textarea for raw `<iframe>` HTML, plus a live 200px iframe preview underneath that safely extracts the `src` attribute

**Security note:** The form does NOT inject raw mapEmbedHtml as innerHTML. It regex-extracts the `src=` attribute and renders a fresh sandboxed iframe (`sandbox="allow-scripts allow-same-origin"`). Reproduce this behavior in production — do not trust the stored HTML.

---

### 5. Gallery (`components/gallery-views.jsx` + `gallery-form.jsx`)
**Purpose:** Browse and curate event photos.

**Schema fields used:** `id`, `uuid`, `filename`, `url`, `caption`, `photographer`, `isPublished`, `createdAt`, `updatedAt`, `eventId` (optional FK), `category` (enum).

**Category enum:** `live`, `backstage`, `promo`, `portrait`, `crowd`, `soundcheck` — extend as needed.

**Toolbar (all on one row):**
- Search across filename, caption, photographer
- Published/Draft chips
- Divider, Photographer dropdown, Event dropdown
- Category strip (All + 6 category chips with counts)
- View switcher (right-aligned)

**Three layouts:**

#### Masonry (default)
- CSS columns: `column-count: 4` (3 ≤ 1400px, 2 ≤ 900px, 1 ≤ 600px), `column-gap: 12px`
- Each tile has a deterministic aspect ratio from filename hash (0.7 / 0.75 / 1.0 / 1.25 / 1.33 / 1.5)
- Photo: striped placeholder colored by `colorFromName(filename)`
- Top-left: "[ photo ]" mono tag
- Top-right: category tag in mono
- Bottom-left: "Draft" tag (yellow) if `!isPublished`
- **Hover overlay:** gradient from black 70% at bottom to transparent, revealing caption + photographer + event in mono 10px, plus action buttons (publish, edit, delete) top-right

#### Rows view
- 84×64 thumb | filename + caption | photographer + event | category pill | actions

#### Table view
- Sortable: File, Category, Photographer, Event, Status, Updated

**Lightbox** (click any tile)
- 1100px max-width modal, 2-col (image | 320px side panel)
- Image area is a large striped placeholder showing `[ url ]` in mono
- Side panel: filename + uuid in mono, then field blocks for Caption, Photographer, Category, Linked event, Status, Created, Updated, URL
- Footer: Publish/Unpublish toggle, Delete, Edit

**Form fields:**
- Filename (mono input, auto-derived from url if blank)
- URL (mono input) + upload dropzone + live preview
- Caption
- Photographer (with datalist of seen photographers)
- Category (segmented control)
- Linked event (dropdown, includes "Not linked")
- Publish toggle

---

### 6. Messages (`components/messages-views.jsx`)
**Purpose:** Inbox for inbound contact-form messages. Different shape — these are received, not created by admins.

**Schema fields used:** `id`, `uuid`, `name`, `email`, `message`, `isRead`, `status` (enum), `phone`, `subject`, `artistType`, `createdAt`, `updatedAt`.

**Status enum:** `new`, `open`, `replied`, `archived`, `spam`.

**Artist type values (form options):** `Artist (representation)`, `Venue / Promoter`, `Press / media`, `Fan`, `Other`.

**Toolbar:**
- Search across name, email, subject, body
- Read/Unread chips
- Status dropdown (with counts per status)
- Artist-type dropdown
- View switcher (3 layouts)
- "Mark all read" button (disabled when 0 unread)

**Three layouts:**

#### Inbox (default, 2-pane)
- 380px list | 1fr detail, in a single 600px-tall rounded card
- **List rows** (380px col): name (bold if unread), subject preview, body preview (1 line), status pill + artist-type chip in mono. Unread = coral dot + bold name. Selected = `var(--bg-2)` + 3px coral accent on left edge.
- **Detail panel:**
  - Header: crumb + uuid in mono, subject as Instrument Serif 30px, head actions (Mark unread, Delete)
  - From card: 36px monogram avatar (`colorFromName(name)` bg), name + email/phone/date row
  - Body: 14.5px, `white-space: pre-wrap`, 680px max-width
  - Metadata grid: 2-col (artistType, subject, phone, email, received, updated) in `var(--bg-2)` background
  - **Sticky status bar at bottom:** segmented control across 5 statuses (each option has a colored status dot), plus "Reply via email" button that opens `mailto:` with `Re: ${subject}` prefilled and sets `status: replied + isRead: true`

#### Cards view
- Full message body cards (3-line clamp), each with from + email/phone, subject, body, footer (date + actions)
- Unread cards get a 3px coral left border

#### Table view
- Columns: From (with unread dot + email sub), Subject, Type, Status, Received, Actions

**Auto-behaviors:**
- Opening a message marks it as read
- Sidebar badge live-updates with unread count (excluding spam + archived)
- Delete dialog has an **"Archive instead"** option for the safer path

---

### 7. Users (`components/users-views.jsx` + `user-form.jsx`)
**Purpose:** Manage the admin team.

**Schema fields used:** `id`, `uuid`, `firstName`, `lastName`, `email`, `role`, `phoneNumber`, `imageUrl`, `createdAt`, `updatedAt`. (`password` is never set or shown by admins — invite-flow on create, reset-link on edit.)

**Role enum suggested:** `admin`, `manager`, `editor`, `viewer`. Adjust to your real RBAC.

**Toolbar:**
- Search across name / email / phone / role
- Role chips: All / Admin / Manager / Editor / Viewer (with counts)
- View switcher (2 layouts)

**Two layouts:**

#### Card grid (default)
- `auto-fill, minmax(280px, 1fr)`, gap 14px
- Card: 56px circular avatar (image or monogram on hash-color bg) | name + role pill, info lines (email, phone with icons), footer (joined date + actions)
- "You" badge in mono on the current user's row (coral background)

#### Table view
- Columns: Name (with 32px avatar + uuid sub), Role, Email, Phone, Member since, Actions

**Self-protection:**
- Trash button is disabled on the current user's row
- Clicking edit on yourself **navigates to Account** instead — that's where you manage your own password

**Form fields:**
- Profile photo (circular preview + imageUrl + dropzone)
- First name (required), Last name (required)
- Email (required, validated)
- Role select (with live description below)
- Phone number
- **Create mode:** "Send invite email" toggle (defaults ON) — on save, toast says "Invite sent to X."
- **Edit mode:** NO password field. Instead a "Send reset link" row that triggers an email. Hint: "Admins never see passwords."

**Important architectural note:** USERS, CURRENT_USER, and the artist `bookingUserId` dropdown are all derived from the same data. Reproduce this in your backend — the booking-manager dropdown should pull from `users WHERE role IN ('admin', 'manager')` (or similar) and update live.

---

### 8. Account (`components/account-view.jsx`)
**Purpose:** Current user's profile editor, with password change.

**Schema fields edited:** Same as user form, but for the logged-in user.

**Layout:** 2-column grid, `280px | 1fr`, gap 36px, max-width 1080px.

#### Left rail (sticky)
- 140×140 circular avatar with monogram (hash-colored) or imageUrl
- Hover reveals "Change photo" overlay
- Name in Instrument Serif 30px
- Email in mono 12px
- Role pill (capitalized)
- Metadata block (top-bordered): User ID (mono), Member since, Last updated

#### Right column — 4 sections, each in a rounded card
Each section has its own dirty-state tracking, Revert button, and inline "Saved." flash with a check icon.

1. **Profile** — firstName, lastName, role, imageUrl + upload dropzone
2. **Contact** — email (validated `name@domain.tld`), phoneNumber, **address** (marked with a "+ schema" mono badge noting it's not in the current schema — see "Open questions")
3. **Password** — current / new / confirm. Each input has a show/hide eye toggle. New password drives a **5-bar strength meter** (weak / medium / strong, scored on length + variety). Confirm shows live match/mismatch. Save enabled only when: current filled + new ≥ 8 chars + match + new ≠ current.
4. **Danger zone** — red-bordered card with "Sign out of all devices" + "Delete account" rows

**Real-time syncing:** Edits flow up to the App-level user state, so the sidebar footer avatar/name AND any team mini cards update immediately when Profile is saved.

---

## Design System

### Colors

All colors use `oklch()` so theming is consistent across hues. CSS variables are defined on `:root` and swapped via `data-aesthetic` attribute.

#### Editorial (default)
```
--bg:        oklch(0.97 0.008 80)   /* warm ivory */
--bg-2:      oklch(0.945 0.01 75)
--surface:   oklch(0.995 0.003 80)
--ink:       oklch(0.18 0.012 60)   /* deep warm black */
--ink-2:     oklch(0.40 0.012 60)
--ink-3:     oklch(0.58 0.012 60)
--line:      oklch(0.88 0.008 70)
--line-2:    oklch(0.93 0.008 75)
--accent:    oklch(0.62 0.17 38)    /* coral */
--accent-soft: oklch(0.94 0.04 38)
--ok:        oklch(0.58 0.12 150)
--warn:      oklch(0.62 0.14 75)
--danger:    oklch(0.55 0.18 28)
```

#### Clean (SaaS)
- Pure white background, oklch neutral grays, indigo accent `oklch(0.55 0.17 255)`

#### Dark moody
- `--bg: oklch(0.16 0.012 270)`, light foreground, yellow-green accent `oklch(0.82 0.18 95)`

### Typography

Loaded from Google Fonts in `index.html`:
```
Instrument Serif (display) — italic available
Geist (UI) — 400 / 500 / 600 / 700
JetBrains Mono (labels, IDs) — 400 / 500
```

Use Instrument Serif for **page titles, big numbers, panel headers, event titles**. Geist for everything else. Mono for IDs, timestamps, file paths, uppercase eyebrow labels with letter-spacing.

In the **Clean** theme, display headlines fall back to Geist 600 weight at smaller sizes.

### Spacing & Radii

```
--r-sm: 6px    (inputs, buttons, chips)
--r-md: 10px   (cards, panels)
--r-lg: 16px   (modals)
--r-xl: 24px
```

Common paddings: 14–22px on cards; 28×40 on topbar; 18–26 inside modals.

### Components

All implemented as plain JSX in `components/`:
- `primitives.jsx` — Icons (`<I name="..." />`), `StatusPill`, `Poster`, `SoldRatio`, `monogram()`, `SocialIcons`, `colorFromName()`
- `sidebar.jsx`
- `editors.jsx` — generic `<Editor pattern="drawer|modal|fullpage">` shell
- Per-entity views + forms (each section has 2 files)

Icons are inline SVGs in `primitives.jsx` (~40 names, feather-style, 1.7px stroke). Replace with your project's icon library; names map cleanly.

---

## Interactions & Micro-behaviors

- **Tweaks panel**: bottom-right floating panel for toggling theme + layouts + editor patterns. In production, drop this entirely or wire it to per-user preferences.
- **Keyboard:**
  - `N` (when focus is on body) → New record on current section
  - `Esc` → close modal/drawer/lightbox/confirmation
  - Combobox arrow keys for artist multi-select
- **Toasts:** 3.2s auto-dismiss. Some include an action button (Undo, etc.). Anchored bottom-center, slide-up animation.
- **Form save flow:**
  - "Saved." inline confirmation flashes for 1.8s on the section that saved (Account uses this per-section)
  - Save buttons are disabled until the draft differs from the source
- **Confirmation modals:** Centered, max-width 460px, with a destructive Delete and a non-destructive alternative (Archive / Cancel) where applicable

---

## State Management

This prototype keeps everything in React `useState` at the page level. For production:

- **Server state:** Use whatever you use today (TanStack Query / SWR / Redux). Each section needs list + create + update + delete + (for messages) patch.
- **App-level state:** The current user is hoisted to `App` and passed to Sidebar + Account so edits propagate live. In production, this is your auth/session.
- **UI preferences:** Layout choices per section (table vs grid vs masonry etc.) should persist to user prefs — they're stored in URL/localStorage in the prototype.

---

## Open questions / things you'll want to confirm

1. **Address column on `users`** — the Account form has an Address field but your provided users schema doesn't include `address`. Either add the column or remove the UI. The field is currently rendered with a small "+ schema" badge to flag this.
2. **Events schema not provided** — the mock data invents `capacity`, `sold`, `price`, `posterImage`. Confirm your real event schema; the UI is structured to drop those if not real.
3. **Role enum values** — I used `admin / manager / editor / viewer`. Confirm your real RBAC.
4. **User permissions** — currently every signed-in user is shown the same UI. Restrict Users page + Danger zone + role editing to admins only.
5. **Message status enum** — I used `new / open / replied / archived / spam`. Confirm.
6. **Gallery category enum** — `live / backstage / promo / portrait / crowd / soundcheck`. Extend as needed.
7. **Booking manager dropdown source** — currently pulls from the `users` table (`USERS` array). Confirm whether ALL users or only certain roles should be eligible.
8. **Real images** — the prototype uses name-hashed color placeholders everywhere there'd be a photo. Wire `imageUrl` (artists, users) and `url` (gallery) to your CDN / storage. Add proper upload UI in place of the dropzones.
9. **Map embed safety** — DO NOT inject `mapEmbedHtml` as innerHTML. Use the iframe-src regex approach (see `gallery-views.jsx` `extractMapSrc`).

---

## Design Tokens — quick reference

```
/* Colors (editorial theme) */
bg:        #faf7f2  (oklch warm ivory)
bg-2:      #f3eee6
surface:   #fefdfa
ink:       #221d14
ink-2:     #6b6253
ink-3:     #9a8f7b
line:      #e0d8c8
line-2:    #eee7da
accent:    #d96343  (warm coral)
ok:        #2f8a5b
warn:      #ad7f1a
danger:    #c0392b

/* Radii */
sm: 6px   md: 10px   lg: 16px   xl: 24px

/* Font sizes (display) */
56, 44, 30, 26, 24, 22 (Instrument Serif)

/* Font sizes (UI) */
14, 13.5, 13, 12.5, 12, 11.5 (Geist)
11, 10.5 (mono labels, uppercase eyebrow with 0.08–0.15em letter-spacing)
```

---

## Files in this bundle

- `index.html` — entry point with script loading order
- `styles.css` — full stylesheet (~1400 lines, themed via CSS variables)
- `data.js` — mock data + helpers (USERS, ARTISTS, VENUES, EVENTS, GALLERY, MESSAGES + enums)
- `app.jsx` — page routing + per-section page components (EventsPage, ArtistsPage, etc.)
- `tweaks-panel.jsx` — dev-only theme/layout switcher (drop in production)
- `components/`
  - `primitives.jsx` — icons, monogram, color-from-name, etc.
  - `sidebar.jsx`
  - `editors.jsx` — generic modal/drawer/fullpage shell
  - `list-views.jsx` — events: 4 layouts
  - `event-form.jsx`
  - `artist-views.jsx` — 3 layouts
  - `artist-form.jsx`
  - `venue-views.jsx` — 3 layouts + procedural map placeholder
  - `venue-form.jsx`
  - `gallery-views.jsx` — 3 layouts + lightbox
  - `gallery-form.jsx`
  - `messages-views.jsx` — 3 layouts (inbox / cards / table)
  - `users-views.jsx` — 2 layouts
  - `user-form.jsx`
  - `account-view.jsx`
  - `dashboard-view.jsx`

Open `index.html` in a browser to see everything running end-to-end.
