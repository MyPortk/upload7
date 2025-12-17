# Design Guidelines: Inventory Management System

## Design Approach
**System-Based Design** following Shadcn UI patterns optimized for data-heavy inventory management. Priority: clarity, efficiency, and bilingual accessibility.

---

## Typography System

**Hierarchy:**
- Page Titles: `text-3xl font-bold` 
- Section Headers: `text-xl font-semibold`
- Card/Component Titles: `text-lg font-medium`
- Body Text: `text-sm` (default for tables, forms, lists)
- Labels: `text-sm font-medium`
- Captions/Meta: `text-xs text-muted-foreground`

**Fonts:**
- Primary: Inter or System UI stack via Tailwind defaults
- Monospace: For QR codes, IDs, and serial numbers (`font-mono`)

---

## Layout System

**Spacing Scale:** Use Tailwind units **2, 4, 6, 8** consistently
- Component padding: `p-4` or `p-6`
- Section gaps: `gap-6` or `gap-8`
- Form field spacing: `space-y-4`
- Card spacing: `p-6`

**Container Strategy:**
- Dashboard/App Layout: Full-width with Sidebar (16rem collapsed, 3rem icon-only)
- Content area: `max-w-7xl mx-auto px-4` for main views
- Modals/Dialogs: `max-w-2xl` for forms, `max-w-4xl` for detailed views
- Tables: Full-width within container, horizontal scroll on mobile

**Grid Patterns:**
- Item Cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Dashboard Stats: `grid-cols-2 lg:grid-cols-4 gap-4`
- Form Layouts: Single column with `max-w-2xl`

---

## Component Library

### Navigation
- **Sidebar (Primary):** Fixed left sidebar with collapsible icon mode. Includes logo, navigation items with icons, user profile at bottom
- **Header:** Top bar with breadcrumbs, search, notifications bell, language toggle (EN/AR), user dropdown
- **Mobile:** Sheet-based sidebar overlay with full navigation

### Data Display
- **Tables:** Shadcn Table with sticky header, sortable columns, row actions dropdown, pagination below
- **Cards:** Elevated cards (`border rounded-lg`) for inventory items with image thumbnail, title, status badge, metadata grid, action buttons
- **Badges:** Status indicators - Available, Reserved, In Maintenance, Unavailable (use Shadcn Badge variants)
- **Stats Cards:** Large number display with icon, label, and trend indicator

### Forms & Input
- **Form Fields:** Label above input, helper text below, error messages in destructive variant
- **Search:** Input with search icon, clear button, live filtering
- **Filters:** Dropdown selects for category, status, location with "Apply Filters" button
- **Date Pickers:** Calendar component for reservation dates
- **QR Scanner:** Modal with camera view or upload area

### Actions
- **Primary CTAs:** Shadcn Button default variant (`h-9`)
- **Secondary Actions:** Button outline variant
- **Destructive:** Button destructive variant for delete/cancel
- **Icon Buttons:** Square `h-9 w-9` for actions in tables/cards
- **Floating Action:** Fixed bottom-right for quick add on mobile

### Feedback
- **Toasts:** Top-right position for success/error notifications
- **Loading States:** Skeleton loaders for tables and cards
- **Empty States:** Centered with icon, heading, description, and primary action
- **Dialogs:** Confirmation dialogs for destructive actions, form dialogs for add/edit

### Special Components
- **QR Code Display:** Large QR code in card with download/print buttons
- **Reservation Timeline:** Horizontal timeline showing booked periods with conflict indicators
- **Activity Log:** List with timestamps, user avatars, action descriptions
- **Maintenance Schedule:** Calendar view or list with status indicators

---

## Layout Patterns

### Dashboard Page
- Stats grid at top (4 cards: Total Items, Available, Reserved, In Maintenance)
- Recent activity list (left 2/3) + Quick actions card (right 1/3)
- Charts: Bar chart for category distribution

### Inventory List
- Filters toolbar (category, status, search) at top
- Grid view toggle (table/cards)
- Pagination at bottom
- Item cards show: thumbnail, name, category, status badge, location, action menu

### Item Detail
- Two-column layout: Image gallery + QR code (left) | Details, specs, history (right)
- Tabs: Overview, Reservations, Maintenance, Activity Log
- Action buttons: Edit, Reserve, Report Issue, Delete

### Reservation Form
- Modal dialog with calendar date picker
- Conflict checking with visual indicators
- User selection (admin only), notes field
- Preview of selected dates with total duration

### User Management (Admin)
- Table with columns: Name, Role, Email, Status, Actions
- Add User button (top right)
- Inline edit or modal for user details
- Role badges with distinct styling

---

## Responsive Strategy

**Breakpoints:**
- Mobile: Base styles, single column, sheet navigation
- Tablet (md): 2-column grids, collapsible sidebar
- Desktop (lg+): 3-column grids, full sidebar, optimized spacing

**Mobile Optimizations:**
- Bottom navigation for key actions
- Swipeable tabs instead of sidebar on mobile
- Card view preferred over table on small screens
- Touch-friendly tap targets (min 44px)

---

## Bilingual & RTL Support

- Use Tailwind RTL variants: `rtl:text-right`, `ltr:ml-4 rtl:mr-4`
- Mirror layouts completely for Arabic (sidebar right, text alignment right)
- Icons remain consistent (don't mirror)
- Numbers and dates localized per language
- Language toggle in header with flags or language codes

---

## Accessibility

- All interactive elements keyboard navigable
- Focus states with ring-2 ring-ring
- ARIA labels for icon-only buttons
- Form errors announced to screen readers
- Color contrast meeting WCAG AA standards
- RTL navigation with arrow keys respecting direction

---

## Visual Refinement

- Consistent border-radius: `rounded-lg` for cards, `rounded-md` for buttons/inputs
- Shadows: `shadow-sm` for cards, `shadow-lg` for modals
- Hover states: Subtle `hover:bg-accent` for interactive elements
- Icons: Lucide icons at `h-4 w-4` for inline, `h-5 w-5` for buttons
- Loading: Skeleton components matching content structure
- Animations: Minimal - only for state changes (toast entry, dialog fade)

---

## Images

**QR Codes:** Programmatically generated, displayed at 200x200px minimum, downloadable as PNG
**Item Thumbnails:** Placeholder illustrations for items without photos (simple product icons)
**Empty States:** Simple line illustrations for "no items found" scenarios
**User Avatars:** Initials-based fallback when no photo uploaded

No hero images needed - this is a utility application prioritizing function over marketing.