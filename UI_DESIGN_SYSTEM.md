# UI Design System — SomePharm HR Portal
> Single Source of Truth for all frontend UI decisions.  
> Every page, component, and interaction must follow this document.  
> File: `somepharm-frontend-main/` · Stack: Next.js 14 + Tailwind CSS 3 + Lucide React

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Typography](#2-typography)
3. [Spacing & Sizing](#3-spacing--sizing)
4. [Elevation & Shadows](#4-elevation--shadows)
5. [Border Radius](#5-border-radius)
6. [Layout System](#6-layout-system)  
   — [6.1 Layout Primitives (PageWrapper / Stack / FormGroup)](#61-layout-primitives)
7. [Role-Based Theming](#7-role-based-theming)
8. [Component Catalog](#8-component-catalog)
9. [Status & Badge Conventions](#9-status--badge-conventions)
10. [Icon Conventions](#10-icon-conventions)
11. [Animation & Transitions](#11-animation--transitions)
12. [Interaction States](#12-interaction-states)
13. [Navigation — Sidebar Structure](#13-navigation--sidebar-structure)
14. [Page Templates](#14-page-templates)
15. [Content Conventions](#15-content-conventions)

---

## 1. Design Tokens

All values are defined in `tailwind.config.ts`. Never use arbitrary hex values outside this palette.

### Brand Blue (Primary)

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| blue-50 | `#F0F9FE` | `bg-blue-50` | Tinted backgrounds |
| blue-100 | `#E0F3FD` | `bg-blue-100` | Hover backgrounds, badge fills |
| blue-200 | `#B9E5F9` | `bg-blue-200` | Borders, dividers |
| blue-400 | `#25ADE3` | `bg-blue-400` | — |
| **blue-500** | **`#25ADE3`** | `bg-blue-500` | **Brand primary** |
| **blue-600** | **`#25ADE3`** | `bg-blue-600` | **Active states, CTAs, sidebar active** |
| blue-700 | `#1E8FBC` | `bg-blue-700` | Hover on primary buttons |
| blue-800 | `#176E91` | `bg-blue-800` | — |
| blue-900 | `#0F465C` | `bg-blue-900` | Dark text on light blue bg |

### Semantic Colors

| Role | Color | Hex | Tailwind |
|---|---|---|---|
| Success / Approved | Emerald | `#10B981` | `emerald-500` |
| Warning / Pending | Amber | `#F59E0B` | `amber-500` |
| Danger / Refused | Red | `#DC2626` | `red-600` |
| Info | Blue | `#25ADE3` | `blue-600` |
| Neutral | Gray | `#6B7280` | `gray-500` |
| Cancelled | Gray-light | `#D1D5DB` | `gray-300` |

### Surface Colors

| Token | Hex | Usage |
|---|---|---|
| Surface / Page bg | `#F9FAFB` | `bg-gray-50` — page background |
| Card / Panel | `#FFFFFF` | `bg-white` — all cards and panels |
| Sidebar | `rgba(255,255,255,0.8)` | `bg-white/80` + `backdrop-blur-md` |
| Dark panel | `rgba(17,24,39,0.4)` | `bg-gray-900/40` — audit logs, dark sections |
| Dark deep | `#030712` | `bg-gray-950` — "Boîte Noire" sections |
| Overlay | `rgba(0,0,0,0.6)` | `bg-black/60` — modal backdrop |

---

## 2. Typography

### Scale

| Element | Size | Weight | Transform | Class |
|---|---|---|---|---|
| Page hero title | `text-7xl` | `font-black` (900) | uppercase italic | Dashboard "Bienvenue" |
| Section title | `text-5xl` | `font-black` | uppercase italic | Modal title, section header |
| Card title | `text-2xl`–`text-3xl` | `font-black` | uppercase italic | — |
| Stat number | `text-6xl`–`text-7xl` | `font-black` | — | Big KPI values |
| Body / list item | `text-sm` | `font-medium` | — | General readable content |
| Label / meta | `text-[10px]`–`text-xs` | `font-black` | uppercase | `tracking-widest` |
| Timestamp | `text-[11px]` | `font-medium` | — | Audit logs, dates |
| Badge text | `text-[10px]` | `font-black` | uppercase | `tracking-widest` |

### Rules

- **Section labels, field labels, table headers:** always `text-[10px] font-black uppercase tracking-widest`.
- **Primary headings:** always `italic` + `uppercase` + `font-black`.
- **Letter spacing on all-caps labels:** always `tracking-widest` or `tracking-[0.2em]`.
- **Body copy:** `font-medium text-sm text-gray-700`.
- **Muted secondary text:** `text-gray-400`.
- **Critical alerts:** `font-black uppercase text-red-600`.
- Never use `font-normal` or `font-light` anywhere in the UI.

---

## 3. Spacing & Sizing

### Padding Scale

| Context | Value | Class |
|---|---|---|
| Card inner padding | `2rem` | `p-8` |
| Modal inner padding | `4rem` | `p-16` |
| Table cell | `2rem` | `p-8` |
| Button (small) | `0.5rem 1rem` | `px-4 py-2` |
| Button (standard) | `1.25rem 2.5rem` | `px-10 py-5` |
| Section vertical spacing | `3rem` | `py-12` / `mb-12` |
| Gap between cards | `1.5rem` | `gap-6` |
| Gap between items in a row | `1rem` | `gap-4` |
| Sidebar lateral inset | `1.5rem` | `left-6 top-6 bottom-6` |

### Width Conventions

| Component | Expanded | Collapsed |
|---|---|---|
| Sidebar | `w-80` (320px) | `w-28` (112px) |
| Main content (sidebar open) | `ml-96` | `ml-36` |
| Modal | `max-w-2xl w-full` | — |
| Wide modal | `max-w-4xl w-full` | — |
| Dropdown | `w-80` | — |

---

## 4. Elevation & Shadows

| Level | Class | Usage |
|---|---|---|
| Flat | `shadow-none` | Inline items, rows |
| Subtle | `shadow-sm` | Default card resting state |
| Card | `shadow-md` | Slightly elevated cards |
| Active card | `shadow-xl` + color variant | Hovered or selected card |
| Modal | `shadow-2xl` | Modals, overlays |
| Blue tinted | `shadow-xl shadow-blue-100` | Active sidebar items (employee) |
| Amber tinted | `shadow-xl shadow-amber-100` | Active sidebar items (manager) |
| Red tinted | `shadow-xl shadow-red-200` | Admin danger actions |

### Rule
Color-tinted shadows are reserved for **active navigation items** and **primary CTA buttons** only.

---

## 5. Border Radius

| Context | Value | Class |
|---|---|---|
| Small badge / chip | `0.375rem` | `rounded-md` |
| Input field | `2rem` | `rounded-[2rem]` |
| Button | `2rem` | `rounded-[2rem]` |
| Card / Panel | `3rem` | `rounded-[3rem]` |
| Sidebar | `3rem` | `rounded-[3rem]` |
| Modal | `4rem` | `rounded-[4rem]` |
| Dropdown / Notification | `2rem` | `rounded-[2rem]` |
| Avatar / circle | `9999px` | `rounded-full` |

### Rule
Never mix radii within the same component family. Cards are always `rounded-[3rem]`, modals always `rounded-[4rem]`, inputs always `rounded-[2rem]`.

---

## 6. Layout System

### 6.1 Layout Primitives

Three shared components live in `src/app/components/layout/`. Import from the barrel:

```ts
import { PageWrapper, Stack, FormGroup } from '../../components/layout'
```

---

#### `PageWrapper`

Wraps the entire page content area. Enforces the `pt-28 px-12` premium padding on every page.

| Prop | Type | Default | Effect |
|---|---|---|---|
| `locked` | `boolean` | `false` | `true` → `h-screen overflow-hidden flex flex-col` (dashboards, data tools) |
| `locked` | `boolean` | `false` | `false` → `pb-24` standard scrolling document flow |
| `className` | `string` | `''` | Extra classes appended after base |

```tsx
// Locked dashboard (sidebar stays visible, inner sections scroll)
<PageWrapper locked>
  <PageHeader />
  <Stack gap="lg" className="flex-1 overflow-hidden">
    ...
  </Stack>
</PageWrapper>

// Scrollable form / config page
<PageWrapper>
  <PageHeader />
  <Stack gap="lg">
    ...
  </Stack>
</PageWrapper>
```

**Rule:** Every page must use `PageWrapper`. Never add `pt-` or `px-` directly on a page's root `<div>`.

---

#### `Stack`

Flex column (or row) with a constrained gap. Always pick from the three semantic sizes — never use arbitrary `gap-*` directly on page-level layout.

| `gap` value | Tailwind | px | Use for |
|---|---|---|---|
| `lg` | `gap-10` | 40px | Between major page sections |
| `md` *(default)* | `gap-6` | 24px | Between cards in a grid row |
| `sm` | `gap-4` | 16px | Between items inside a card |

| `direction` | Values | Default |
|---|---|---|
| `col` / `row` | `'col' \| 'row'` | `'col'` |

```tsx
// Page-level vertical rhythm
<Stack gap="lg">
  <StatGrid />
  <DataTable />
  <ActivityFeed />
</Stack>

// Card-level inner spacing
<Stack gap="sm">
  <FormGroup label="Nom">...</FormGroup>
  <FormGroup label="Email">...</FormGroup>
</Stack>

// Horizontal row of cards
<Stack direction="row" gap="md">
  <StatCard />
  <StatCard />
  <StatCard />
</Stack>

// Internal scroll inside locked PageWrapper
<Stack gap="lg" className="flex-1 overflow-hidden">
  <div className="overflow-y-auto">...</div>
</Stack>
```

**Rule:** Do not use `space-y-*` or raw `gap-*` for page-level or card-level layout. Use `Stack`.

---

#### `FormGroup`

Label + input + optional error message wrapper. Enforces the label style from the design system.

| Prop | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | ✅ | Rendered as the field label (auto-uppercased via CSS) |
| `error` | `string` | — | Shown in red below the input when truthy |
| `hint` | `string` | — | Secondary helper text shown below the label |
| `className` | `string` | — | Extra wrapper classes |

```tsx
<FormGroup label="Matricule" error={errors.matricule}>
  <input
    type="text"
    className="w-full bg-gray-50 border border-gray-100 rounded-[2rem]
               h-20 px-10 text-sm font-medium focus:outline-none
               focus:ring-4 focus:ring-blue-500/10"
  />
</FormGroup>

<FormGroup label="Motif" hint="Optionnel — max 500 caractères">
  <textarea className="w-full bg-gray-50 border border-gray-100 rounded-[2rem]
                       px-10 py-6 text-sm font-medium resize-none min-h-[8rem]
                       focus:outline-none focus:ring-4 focus:ring-blue-500/10"/>
</FormGroup>
```

**Rule:** Every form field must be wrapped in `FormGroup`. Never write a raw `<label>` + `<input>` pair outside of it.

---

### Page Shell

Every protected page uses a fixed sidebar + scrollable main content area.

```
┌─────────────────────────────────────────────────────┐
│  Fixed Sidebar                  Scrollable Content   │
│  (left-6 top-6 bottom-6)       (ml-96 / ml-36)      │
│  bg-white/80 backdrop-blur-md   bg-gray-50           │
│  rounded-[3rem]                 p-8 min-h-screen     │
│  shadow                                              │
└─────────────────────────────────────────────────────┘
```

### Content Area Header

Every page has a consistent header block at the top of the content area:

```
<div class="flex items-start justify-between mb-12">
  <div>
    <h1 class="text-7xl font-black uppercase italic tracking-tighter text-gray-900">
      Page Title
    </h1>
    <p class="text-xs font-black uppercase tracking-widest text-gray-400 mt-2">
      Subtitle / context line
    </p>
  </div>
  <!-- Right slot: NotificationCenter, refresh button, etc. -->
</div>
```

### Grid Layouts

| Layout | Class |
|---|---|
| 3-column stats | `grid grid-cols-3 gap-6` |
| 2-column split | `grid grid-cols-2 gap-6` |
| 4-column grid | `grid grid-cols-4 gap-4` |
| Full-width section | `w-full` |

Always wrap grid content in a `<div class="space-y-8">` for vertical rhythm between sections.

---

## 7. Role-Based Theming

Each portal has its own accent color used for active sidebar items and role-specific highlights. **All other tokens remain identical across portals.**

| Portal | Role | Accent Color | Active Sidebar Class | Shadow Class |
|---|---|---|---|---|
| Employee | ROLE_EMPLOYE | Blue `#25ADE3` | `bg-blue-600 text-white` | `shadow-blue-100` |
| Manager — Team section | ROLE_MANAGER | Amber `#F59E0B` | `bg-amber-500 text-white` | `shadow-amber-100` |
| Manager — Personal section | ROLE_MANAGER | Blue `#25ADE3` | `bg-blue-600 text-white` | `shadow-blue-100` |
| HR | ROLE_RH | Blue `#25ADE3` | `bg-blue-600 text-white` | `shadow-blue-100` |
| Admin | ROLE_ADMIN | Blue `#25ADE3` | `bg-blue-600 text-white` | `shadow-blue-100` |
| SuperAdmin badge | ROLE_SUPERADMIN | Red `#DC2626` | `bg-red-600 text-white` | `shadow-red-200` |

### Rule
The **only** place accent colors differ per role is the sidebar active state. All cards, buttons, and forms on the main content area use the same blue-600 primary regardless of role.

---

## 8. Component Catalog

### 8.1 Buttons

#### Primary Button
```html
<button class="bg-blue-600 text-white px-10 py-5 rounded-[2rem]
               font-black uppercase tracking-widest text-sm
               hover:bg-blue-700 hover:scale-105
               shadow-xl shadow-blue-100
               transition-all duration-200
               disabled:opacity-50 disabled:cursor-not-allowed">
  LABEL
</button>
```

#### Secondary Button
```html
<button class="bg-white border border-gray-200 text-gray-900 px-10 py-5 rounded-[2rem]
               font-black uppercase tracking-widest text-sm
               hover:bg-gray-50 hover:scale-105
               transition-all duration-200">
  LABEL
</button>
```

#### Danger Button
```html
<button class="bg-red-600 text-white px-10 py-5 rounded-[2rem]
               font-black uppercase tracking-widest text-sm
               hover:bg-red-700 hover:scale-105
               shadow-xl shadow-red-200
               transition-all duration-200">
  LABEL
</button>
```

#### Ghost / Icon Button
```html
<button class="p-3 rounded-[1rem] text-gray-400
               hover:bg-gray-100 hover:text-gray-700
               transition-all duration-200">
  <Icon size={18}/>
</button>
```

#### Loading State
Replace label content with:
```html
<RefreshCw size={16} class="animate-spin mr-2"/> CHARGEMENT...
```

---

### 8.2 Cards

#### Standard Card
```html
<div class="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
  <!-- content -->
</div>
```

#### Accent Card (KPI / Stat)
```html
<div class="bg-white p-8 rounded-[3rem] shadow-sm
            border border-gray-100 border-b-8 border-b-blue-600">
  <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">LABEL</p>
  <p class="text-6xl font-black text-gray-900 mt-2">42</p>
  <p class="text-xs font-medium text-gray-400 mt-1">sous-texte</p>
</div>
```
Replace `border-b-blue-600` with `border-b-red-500` / `border-b-amber-500` for semantic variants.

#### Dark Card
```html
<div class="bg-gray-900/40 p-10 rounded-[3rem]
            border border-white/5 backdrop-blur-md">
  <!-- Use text-gray-300/400 for content -->
</div>
```

#### Clickable Card (hover effect)
Add to any card: `cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200`

---

### 8.3 Badges & Status Chips

Base class (always the same structure, only colors change):
```html
<span class="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest
             bg-{color}-50 border border-{color}-100 text-{color}-600">
  LABEL
</span>
```

See [Section 9](#9-status--badge-conventions) for the full color map.

---

### 8.4 Tables

```html
<div class="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
  <table class="w-full">
    <thead>
      <tr class="bg-gray-50 border-b border-gray-100">
        <th class="p-8 text-left text-[11px] font-black uppercase text-gray-400">
          COLUMN
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      <tr class="hover:bg-blue-50/30 transition-colors">
        <td class="p-8 text-sm font-medium text-gray-700">value</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 8.5 Forms

#### Field Label
```html
<label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic">
  CHAMP
</label>
```

#### Text Input
```html
<input class="w-full bg-gray-50 border border-gray-100 rounded-[2rem]
              h-20 px-10 text-sm font-medium text-gray-900
              focus:outline-none focus:ring-4 focus:ring-blue-500/10
              focus:border-blue-300 transition-all"/>
```

#### Textarea
```html
<textarea class="w-full bg-gray-50 border border-gray-100 rounded-[2rem]
                 px-10 py-6 text-sm font-medium text-gray-900 resize-none
                 min-h-[8rem] focus:outline-none focus:ring-4
                 focus:ring-blue-500/10 transition-all"/>
```

#### Select
```html
<select class="w-full bg-white border border-gray-100 rounded-[2rem]
               h-20 px-10 text-sm font-medium text-gray-900
               appearance-none focus:outline-none
               focus:ring-4 focus:ring-blue-500/20">
  <option>...</option>
</select>
```

#### Validation Error
```html
<p class="text-[10px] font-black uppercase tracking-widest text-red-500 ml-4 mt-1">
  MESSAGE D'ERREUR
</p>
```

#### Form Group Wrapper
```html
<div class="space-y-2">
  <!-- label + input + optional error -->
</div>
```

---

### 8.6 Modals

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]
            flex items-center justify-center p-8">

  <!-- Panel -->
  <div class="bg-white rounded-[4rem] p-16 max-w-2xl w-full shadow-2xl
              animate-in fade-in zoom-in-95 duration-300">

    <!-- Header -->
    <h2 class="text-5xl font-black italic uppercase tracking-tighter mb-2">
      TITRE
    </h2>
    <p class="text-xs font-black uppercase tracking-widest text-gray-400 mb-12 italic">
      sous-titre contextuel
    </p>

    <!-- Body -->
    <div class="space-y-6">
      <!-- form / content -->
    </div>

    <!-- Footer -->
    <div class="flex gap-4 mt-12">
      <button class="...secondary button...">ANNULER</button>
      <button class="...primary button...">CONFIRMER</button>
    </div>
  </div>
</div>
```

**Rule:** The close / cancel action is always on the **left**, confirm on the **right**.

---

### 8.7 Notification Dropdown

```html
<div class="absolute right-0 mt-4 w-80
            bg-white/80 backdrop-blur-xl rounded-[2rem]
            shadow-2xl border border-gray-100 overflow-hidden z-50">
  <!-- Unread item -->
  <div class="flex items-start gap-3 p-5 hover:bg-gray-50 transition-colors
              border-l-4 border-blue-500">
    <!-- icon + message + time -->
  </div>
  <!-- Read item -->
  <div class="flex items-start gap-3 p-5 hover:bg-gray-50 transition-colors
              border-l-4 border-transparent">
  </div>
</div>
```

---

### 8.8 Empty States

```html
<div class="flex flex-col items-center justify-center p-20 text-center">
  <Icon size={48} class="text-gray-200 mb-6"/>
  <p class="text-sm font-black uppercase tracking-widest text-gray-300">
    AUCUN ÉLÉMENT À AFFICHER
  </p>
  <p class="text-xs text-gray-400 mt-2">Message d'aide optionnel</p>
</div>
```

---

### 8.9 Loading State

```html
<!-- Inline spinner -->
<div class="flex items-center gap-3 text-blue-600">
  <RefreshCw size={18} class="animate-spin"/>
  <span class="text-xs font-black uppercase tracking-widest">
    CHARGEMENT...
  </span>
</div>

<!-- Full-section pulse skeleton -->
<div class="animate-pulse space-y-4">
  <div class="h-20 bg-gray-100 rounded-[2rem]"/>
  <div class="h-20 bg-gray-100 rounded-[2rem] w-3/4"/>
</div>
```

---

### 8.10 Alert / Error Banners

```html
<!-- Warning -->
<div class="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex items-center gap-4">
  <ShieldAlert size={20} class="text-amber-500 shrink-0"/>
  <p class="text-sm font-black uppercase tracking-widest text-amber-700">MESSAGE</p>
</div>

<!-- Error -->
<div class="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-center gap-4">
  <AlertCircle size={20} class="text-red-500 shrink-0"/>
  <p class="text-sm font-black uppercase tracking-widest text-red-700">MESSAGE</p>
</div>

<!-- Success -->
<div class="bg-green-50 border border-green-100 rounded-[2rem] p-6 flex items-center gap-4">
  <CheckCircle2 size={20} class="text-green-500 shrink-0"/>
  <p class="text-sm font-black uppercase tracking-widest text-green-700">MESSAGE</p>
</div>
```

---

## 9. Status & Badge Conventions

All statuses use the same badge structure — only the color token changes.

### Request Lifecycle (`statutCycleVie`)

| Status value | Label | bg | border | text | Icon |
|---|---|---|---|---|---|
| `EN_ATTENTE_MANAGER` | EN ATTENTE | `amber-50` | `amber-100` | `amber-600` | `Clock` |
| `VALIDE_MANAGER` | VALIDÉ MANAGER | `blue-50` | `blue-100` | `blue-600` | `CheckSquare` |
| `APPROUVE` | APPROUVÉ | `green-50` | `green-100` | `green-600` | `CheckCircle2` |
| `REFUSE` | REFUSÉ | `red-50` | `red-100` | `red-600` | `XCircle` |
| `ANNULE` | ANNULÉ | `gray-100` | `gray-200` | `gray-400` | `X` |

### Exit Pass (`BonDeSortie.statut`)

| Status | Label | Color |
|---|---|---|
| `EN_ATTENTE` | EN ATTENTE | amber |
| `EN_COURS` | EN COURS | blue |
| `CLOTURE` | CLÔTURÉ | gray |

### Attendance (`Pointage.statut`)

| Status | Label | Color |
|---|---|---|
| `OK` | OK | green |
| `RETARD` | RETARD | amber |
| `ANOMALIE` | ANOMALIE | red |

### Announcement Priority

| Priority | Label | Color | Behavior |
|---|---|---|---|
| `NORMAL` | NORMAL | blue | Standard display |
| `URGENT` | URGENT | amber-600 with white text | Triggers `UrgentAnnouncementPopup` full-screen overlay |

### Announcement Status

| Status | Label | Color |
|---|---|---|
| `DRAFT` | BROUILLON | gray |
| `PUBLISHED` | PUBLIÉ | green |
| `ARCHIVED` | ARCHIVÉ | gray-light |

### Request Type

| Type | Label | Color |
|---|---|---|
| `CONGE` | CONGÉ | blue |
| `DOCUMENT` | DOCUMENT | purple |
| `ADMINISTRATIVE` | ADMINISTRATIF | amber |
| `REGULARISATION` | RÉGULARISATION | orange |

### Account Status (`statutCompte`)

| Status | Color |
|---|---|
| `ACTIF` | green |
| `INACTIF` | gray |
| `EN_ATTENTE_PREMIERE_CONNEXION` | amber |

### Audit / Backup Status

| Value | Color |
|---|---|
| `SUCCESS` / `VALID` | green |
| `FAILED` / `CORRUPTED` | red |
| `WARNING` | amber |

---

## 10. Icon Conventions

Icon library: **Lucide React** (imported from `lucide-react`). No other icon library.

### Standard Icon Sizes

| Context | Size | Class |
|---|---|---|
| Sidebar nav item | 20px | `size={20}` |
| Button icon | 16px | `size={16}` |
| Card accent icon | 24–32px | `size={24}` |
| Empty state | 48px | `size={48}` |
| Status badge | 12–14px | `size={12}` |
| Background watermark | 200–300px | `size={300} class="opacity-5"` |

### Concept → Icon Mapping

| Concept | Icon | Notes |
|---|---|---|
| Dashboard / overview | `LayoutDashboard` | — |
| Clock in / out | `Fingerprint` | The biometric punch action |
| Time / duration | `Clock` | Timestamps, schedules |
| Timer | `Timer` | Live countdown |
| Calendar | `Calendar` | Date pickers, plannings |
| Leave requests | `Calendar` + `Umbrella` | Context-dependent |
| Document requests | `FileText` | All document types |
| Announcements | `Megaphone` | Communication hub |
| Employees / team | `Users` | Lists, directories |
| Single user | `User` | Profile, individual card |
| Manager | `Briefcase` | Hierarchy |
| Salary slip | `Wallet` / `DollarSign` | Payroll |
| QR code | `QrCode` | Bons de sortie, scanning |
| Settings | `Settings` | Configuration pages |
| Logout | `LogOut` | Always `text-red-400` |
| Security / alerts | `ShieldAlert` / `ShieldCheck` | — |
| Success | `CheckCircle2` | Confirmation states |
| Error | `XCircle` / `AlertCircle` | Refusal, errors |
| Warning | `AlertTriangle` | Non-critical issues |
| Database | `Database` | Admin / system |
| Server | `Server` | Health monitoring |
| CPU | `Cpu` | System metrics |
| Storage | `HardDrive` | Backup / storage |
| Email | `Mail` | SMTP config |
| Copy | `Copy` | Copy-to-clipboard |
| Download | `Download` | File download |
| Delete | `Trash2` | Destructive actions |
| Refresh | `RefreshCw` | Reload, spinner |
| Back | `ChevronLeft` | Navigation |
| Expand / next | `ChevronRight` | Navigation |
| Notifications | `Bell` | Notification center |
| Audit / logs | `Activity` | Audit trail |
| Lock | `Lock` | Password, security |
| Visibility | `Eye` / `EyeOff` | Show/hide password |

---

## 11. Animation & Transitions

### Entry Animations

| Context | Class |
|---|---|
| Page load | `animate-in fade-in slide-in-from-bottom-8 duration-1000` |
| Modal open | `animate-in fade-in zoom-in-95 duration-300` |
| List item stagger | `animate-in fade-in slide-in-from-left-2 duration-300` |
| Dropdown open | `animate-in fade-in slide-in-from-top-2 duration-200` |

### Continuous Animations

| Context | Class |
|---|---|
| Loading spinner | `animate-spin` |
| Urgent / critical item | `animate-pulse` |
| Notification bell (unread) | `animate-bounce` |

### Hover Transitions

| Context | Class |
|---|---|
| Cards | `hover:shadow-xl hover:scale-[1.02] transition-all duration-200` |
| Buttons | `hover:scale-105 transition-all duration-200` |
| Nav items | `transition-all duration-200` |
| Table rows | `hover:bg-blue-50/30 transition-colors` |

### Rules

- All transitions: `duration-200` (200ms) or `duration-300` (300ms) for modals only.
- Never use `transition-none`. Every interactive element must have a transition.
- Scale transforms are `scale-105` for buttons, `scale-[1.02]` for cards (never more).

---

## 12. Interaction States

| State | Class |
|---|---|
| Hover (button) | `hover:bg-{color}-700 hover:scale-105` |
| Hover (card) | `hover:shadow-xl hover:scale-[1.02]` |
| Hover (nav item) | `hover:bg-gray-50 hover:text-blue-600` |
| Focus (input) | `focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300` |
| Focus (danger input) | `focus:ring-red-500/10 focus:border-red-300` |
| Active (nav item) | Role-accent background + white text + `shadow-xl shadow-{color}-100` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Loading (button) | Replace icon with `<RefreshCw class="animate-spin"/>`, disable button |
| Selected (row/card) | `border-l-4 border-blue-500` or `bg-blue-50` |

---

## 13. Navigation — Sidebar Structure

### Shared Sidebar Anatomy

All sidebars share the same shell:

```
Position : fixed left-6 top-6 bottom-6
Width    : w-80 (expanded) | w-28 (retracted)
BG       : bg-white/80 backdrop-blur-md
Border   : border border-gray-100
Radius   : rounded-[3rem]
Shadow   : shadow-[0_10px_40px_rgba(0,0,0,0.04)]
Toggle   : Chevron button at -right-2 top-8
```

Logo: Full logo shown when expanded (`opacity-100 scale-90`), mini icon when retracted.

Logout button: Always at bottom, `text-red-400 hover:bg-red-50 hover:text-red-600`.

### Employee Portal Navigation

| Order | Label | Icon | Path | Badge |
|---|---|---|---|---|
| 1 | Tableau de Bord | `LayoutDashboard` | `/employee/dashboard` | — |
| 2 | Mes Demandes | `Calendar` | `/employee/demandes` | — |
| 3 | Communication | `Megaphone` | `/employee/communication` | Unread count (red) |
| 4 | Bons de Sortie | `QrCode` | `/employee/bons-de-sortie` | — |
| 5 | Mes Documents | `FileText` | `/employee/documents` | — |
| 6 | Mon Profil | `User` | `/employee/profil` | — |
| 7 | Paramètres | `Settings` | `/employee/parametres` | — |

Active state: `bg-blue-600 text-white shadow-xl shadow-blue-100`

### Manager Portal Navigation

**Section "Pilotage d'Équipe"** (amber accent):

| Label | Icon | Path |
|---|---|---|
| Tableau de Bord | `LayoutDashboard` | `/manager/dashboard` |
| Mon Équipe | `Users` | `/manager/equipe` |
| Gestion des Demandes | `CheckSquare` | `/manager/demandes` |

**Section "Espace Personnel"** (blue accent):

| Label | Icon | Path |
|---|---|---|
| Mes Demandes | `Calendar` | `/manager/demandes-perso` |
| Communication | `Megaphone` | `/manager/communication` |
| Bons de Sortie | `QrCode` | `/manager/bons-de-sortie` |
| Mon Profil | `User` | `/manager/profil` |
| Paramètres | `Settings` | `/manager/parametres` |

### HR Portal Navigation

| Label | Icon | Path |
|---|---|---|
| Tableau de Bord | `LayoutDashboard` | `/hr/dashboard` |
| Collaborateurs | `Users` | `/hr/employes` |
| Validation & Demandes | `CheckSquare` | `/hr/demandes` |
| Gestion des Congés | `Calendar` | `/hr/conges` |
| Temps & Présence | `Clock` | `/hr/absences` |
| Communication | `Megaphone` | `/hr/communication` |
| Paie & Documents | `Wallet` | `/hr/paie` |
| Paramètres RH | `Settings` | `/hr/parametres` |

Active state: `bg-blue-600 text-white shadow-xl shadow-blue-100`

### Admin Cockpit Navigation

| Label | Icon | Path | Role guard |
|---|---|---|---|
| Le Cockpit | `LayoutDashboard` | `/admin/dashboard` | — |
| Collaborateurs | `Users` | `/admin/collaborateurs` | — |
| Activation Comptes | `UserCheck` | `/admin/activation` | — |
| Audit & Logs | `Activity` | `/admin/audit` | — |
| Santé Système | `Server` | `/admin/health` | — |
| Monitoring | `Activity` | `/admin/monitoring` | — |
| Helpdesk | `MessageSquare` | `/admin/tickets` | — |
| Stockage | `HardDrive` | `/admin/storage` | — |
| Config Mail | `Mail` | `/admin/config-mail` | — |
| Config PDF | `FileText` | `/admin/config-pdf` | — |
| Config QR | `QrCode` | `/admin/config-qr` | — |
| Root Console | `ShieldAlert` | `/superadmin/...` | ROLE_SUPERADMIN only — red-600 |

---

## 14. Page Templates

### Template A — Dashboard (Data-heavy)

```
Header (title + subtitle + NotificationCenter)
  └─ PunchWidget (full-width or 2/3 width)
Grid 3-cols: Stat card · Stat card · Stat card
Full-width section: Table or activity feed
Full-width section: Chart or planning view
```

### Template B — List / Management Page

```
Header (title + action button right-aligned)
Full-width: Filter bar (search input + status select + date pickers)
Full-width: Data table (rounded-[3rem] card)
  └─ Table header (gray-50 bg)
  └─ Table rows (divide-y divide-gray-100)
  └─ Empty state (centered, icon + label)
Floating: Modal (when row action triggered)
```

### Template C — Profile / Configuration Page

```
Header (title + save button right-aligned)
2-col grid:
  Left col: Personal info form card
  Right col: Avatar / summary card
Full-width: Secondary settings card (optional)
```

### Template D — Single-Action Page (Activation, Reset)

```
Full-page centered layout:
  Logo
  Heading (text-7xl, italic, uppercase)
  Subheading (text-xs, uppercase, gray-400)
  Form card (bg-white, rounded-[3rem], p-10)
  CTA button (full-width or centered)
```

---

## 15. Content Conventions

### Language

- All UI text is in **French**.
- All labels, headers, button text, and badge text are in **UPPERCASE**.
- Body content and form values may use normal casing.

### Text Patterns

| Element | Format | Example |
|---|---|---|
| Page title | Uppercase italic | *"TABLEAU DE BORD"* |
| Section label | Uppercase | `"MES DEMANDES"` |
| Field label | Uppercase italic | `"NOM COMPLET"` |
| Button | Uppercase | `"SOUMETTRE"` |
| Badge | Uppercase | `"APPROUVÉ"` |
| Empty state | Uppercase | `"AUCUN RÉSULTAT"` |
| Placeholder | Sentence case (regular) | `"Entrez votre matricule"` |
| Error message | Uppercase | `"CHAMP OBLIGATOIRE"` |
| Timestamp | `fr-FR` locale | `"12 mai 2026 à 09:41"` |
| Date only | `fr-FR` | `"12/05/2026"` |

### Number Formatting

- Large numbers: `toLocaleString('fr-FR')` → `"1 234"` (space as thousands separator).
- Currency: `new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' })`.
- Percentages: `n.toFixed(1) + " %"`.

### API Status → Display Label Map

| API value | Display (French) |
|---|---|
| `EN_ATTENTE_MANAGER` | `EN ATTENTE MANAGER` |
| `VALIDE_MANAGER` | `VALIDÉ MANAGER` |
| `APPROUVE` | `APPROUVÉ` |
| `REFUSE` | `REFUSÉ` |
| `ANNULE` | `ANNULÉ` |
| `EN_ATTENTE` | `EN ATTENTE` |
| `EN_COURS` | `EN COURS` |
| `CLOTURE` | `CLÔTURÉ` |
| `ACTIF` | `ACTIF` |
| `INACTIF` | `INACTIF` |
| `EN_ATTENTE_PREMIERE_CONNEXION` | `1ÈRE CONNEXION` |
| `OK` | `OK` |
| `RETARD` | `RETARD` |
| `ANOMALIE` | `ANOMALIE` |

### Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use `rounded-[3rem]` for cards | Mix `rounded-xl` and `rounded-[3rem]` on the same page |
| Use `font-black uppercase tracking-widest` for all labels | Use `font-semibold` for labels |
| Use `shadow-blue-100` only on active states | Add colored shadows to all cards |
| Import icons from `lucide-react` only | Import icons from any other library |
| Use `fr-FR` locale for all dates and numbers | Use raw ISO strings in the UI |
| Put cancel on the left, confirm on the right in modals | Reverse button order |
| Use `space-y-8` between page sections | Use raw `mb-` utilities between sections |
| Wrap table in `rounded-[3rem] overflow-hidden` card | Put a bare `<table>` on the page |
| Use `animate-pulse` for urgent/critical items only | Apply `animate-pulse` to static decorative elements |
| Use `text-gray-400` for secondary/muted text | Use `text-gray-300` for text (too low contrast) |
