# Design Guidelines: Visit Dzaleka Admin Dashboard

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Linear (clean data tables, status badges), Notion (flexible layouts, easy scanning), and Stripe Dashboard (financial clarity, action-oriented design) to create an efficient admin interface that complements the existing public-facing website.

## Brand Consistency
Maintain alignment with existing Dzaleka branding:
- **Primary Font**: Manrope throughout
- **Accent Color**: #0284C7 (sky-600) for CTAs and links
- **Primary Gray**: #4B5563 (gray-600) for text
- **Background**: #FFFFFF with subtle gray (#F9FAFB) for cards/sections
- **Border Radius**: 6px for inputs, 8px for primary buttons, 12px for secondary buttons
- **Tone**: Professional, efficient, respectful

## Typography Hierarchy
- **Page Headers**: text-3xl font-semibold text-gray-900
- **Section Headers**: text-xl font-semibold text-gray-900
- **Card Titles**: text-lg font-medium text-gray-900
- **Body Text**: text-sm text-gray-600
- **Labels**: text-sm font-medium text-gray-700
- **Metadata/Stats**: text-xs text-gray-500

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24 for consistent rhythm
- Page padding: p-6 md:p-8
- Card padding: p-4 md:p-6
- Section gaps: space-y-6
- Grid gaps: gap-4 or gap-6

## Component Library

### Navigation
- **Sidebar Navigation**: Fixed left sidebar (w-64) with logo, main nav items, user profile at bottom
- **Top Bar**: Breadcrumbs, page title, primary actions aligned right
- **Mobile**: Hamburger menu collapsing sidebar

### Data Display
- **Tables**: Striped rows, hover states, sortable headers, inline status badges
- **Cards**: White background, subtle shadow, rounded-lg borders
- **Status Badges**: 
  - Pending: bg-yellow-100 text-yellow-800
  - Confirmed: bg-green-100 text-green-800
  - Completed: bg-blue-100 text-blue-800
  - Cancelled: bg-red-100 text-red-800

### Forms
- **Input Fields**: border-gray-300, focus:ring-sky-600 focus:border-sky-600, rounded-md
- **Select Dropdowns**: Consistent with inputs
- **Date/Time Pickers**: Integrated calendar UI
- **Validation**: Red error text below fields, green success states

### Actions
- **Primary Buttons**: bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2
- **Secondary Buttons**: bg-white border border-gray-300 text-gray-700 hover:bg-gray-50
- **Danger Actions**: bg-red-600 hover:bg-red-700 for deletions
- **Icon Buttons**: Minimal, gray-400 hover:gray-600

### Dashboard Elements
- **Stat Cards**: 4-column grid (lg:grid-cols-4) with icon, number, label, trend indicator
- **Charts**: Simple bar/line charts for bookings over time
- **Recent Activity**: List view with timestamps and user avatars
- **Quick Actions**: Prominent card with common tasks

## Key Screens Structure

### Dashboard Overview
- Stats row: Total Bookings, Pending Requests, Active Guides, Today's Tours
- Calendar view of upcoming tours
- Recent booking requests table
- Quick actions card

### Bookings Management
- Filterable table: Date range, status, guide, group size
- Inline actions: View details, confirm, cancel, assign guide
- Booking detail modal: Full request info, visitor details, payment status, notes field
- Bulk actions toolbar when rows selected

### Guide Management
- Grid or list of guide profiles with photo, name, stats (tours completed, earnings)
- Guide detail view: Schedule calendar, tour history, earnings breakdown
- Add/edit guide form: Profile info, availability settings, contact details

### Calendar View
- Month/week view with color-coded bookings
- Drag-and-drop for guide assignment
- Conflict indicators for double-bookings
- Filter by guide, zone, tour type

## Icons
Use Heroicons (outline style) via CDN for consistency with existing site

## Animations
Minimal and functional only:
- Smooth transitions on hover states (transition-colors duration-150)
- Fade-in for modals/dropdowns
- Loading spinners for async actions
- No decorative animations

## Accessibility
- Proper heading hierarchy (h1 > h2 > h3)
- ARIA labels on icon-only buttons
- Keyboard navigation for all interactive elements
- Focus indicators matching sky-600 theme
- Sufficient color contrast (WCAG AA minimum)

## Images
**No hero images** for admin dashboard - focus on data density and efficiency. Use icons and avatars only:
- Guide profile photos (circular, 40x40px in lists, 80x80px in detail views)
- User avatars in activity feeds
- Empty state illustrations (simple, minimal SVG)