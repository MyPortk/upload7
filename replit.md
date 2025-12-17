# Inventory Management System

## Overview

A full-stack inventory management system built for equipment tracking and reservation workflows. The application enables employees to browse available equipment, request reservations, and manage check-out/check-in processes, while administrators oversee approvals, user management, and system-wide operations. The system features bilingual support (English/Arabic), QR code integration for physical item tracking, and comprehensive activity logging.

**Core Capabilities:**
- Category-based equipment organization with dynamic sub-types
- Reservation workflow with approval process
- QR code generation and scanning for item tracking
- Real-time notifications system
- Activity and audit logging
- User management with role-based access control (admin/user)
- Maintenance status tracking
- **Quantity tracking** - Items can have multiple quantities in stock
- **Column visibility toggles** - Toggle Quantity and Location columns in table view
- **Card view enhancements** - Display quantity on every item card

## User Preferences

Preferred communication style: Simple, everyday language.

**CRITICAL DATA INTEGRITY RULES:**
- ⚠️ **Categories and items visible in the Inventory page are the user's ACTUAL data - these must NEVER be modified or duplicated**
- ⚠️ **NEVER add new categories or items to the database without explicit permission**
- ⚠️ **Only work with categories/items that already exist in the Inventory**
- The user has 12 equipment categories with Google Drive images - these are sacred and must be preserved
- Dashboard Top Categories feature dynamically shows the top 4 checked-out categories from the user's existing inventory

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite as build tool and development server
- TanStack Query (React Query) for server state management
- Shadcn UI component library (New York variant) with Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Component Structure:**
- Page-level components in `client/src/pages/` (Login, UserHome, Inventory, Reservations, ActivityLogs, QRCodes, Maintenance, UserManagement)
- Reusable UI components in `client/src/components/` following Shadcn patterns
- Path aliases configured for clean imports (`@/` for client, `@shared/` for shared types)
- **UserHome page** - Pixy-style landing page for regular users with hero section, categories grid, and quick actions

**State Management:**
- Session-based authentication state
- React Query for API data caching and synchronization with 5-10 second polling intervals for real-time updates
- Local state for UI interactions (dialogs, forms, view modes)
- Column visibility state (showQuantityColumn, showLocationColumn) for table view customization

**Design System:**
- Custom CSS variables for theming (light/dark mode support)
- Consistent spacing scale (2, 4, 6, 8 Tailwind units)
- Typography hierarchy with specific font weights for data-dense interfaces
- System-based design prioritizing clarity and efficiency
- **Pixy design theme** - Anton font for headings, Outfit for body text, floating shapes, and modern animations (UserHome page)

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js
- TypeScript with ES modules
- Session-based authentication using express-session with MemoryStore
- Bcrypt for password hashing

**API Design:**
- RESTful endpoints organized by resource type
- Session middleware for authentication (`requireAuth`, `requireAdmin`)
- JSON request/response format
- Credentials included in requests for session persistence

**Key API Routes:**
- `/api/auth/*` - Authentication (login/logout)
- `/api/items/*` - Item CRUD operations (includes quantity field)
- `/api/categories/*` - Category management
- `/api/reservations/*` - Reservation workflow
- `/api/users/*` - User management (admin only)
- `/api/activity-logs/*` - Activity tracking
- `/api/notifications/*` - Notification system
- `/api/qrcodes/*` - QR code generation

**Authentication & Authorization:**
- Session-based authentication stored in memory (production should use persistent store)
- Role-based access control (admin vs user roles)
- Middleware functions enforce authentication requirements
- Password hashing with bcrypt (10 salt rounds)

### Data Storage

**Database:**
- PostgreSQL as primary database
- Drizzle ORM for type-safe database operations
- Connection pooling via `pg` package
- Neon Database serverless driver (`@neondatabase/serverless`)

**Schema Design (from shared/schema.ts):**
- **users** - Authentication and user profiles (id, username, password, email, name, role, department)
- **items** - Inventory items (id, barcode, productName, productType, status, location, notes, quantity, qrCode)
- **categories** - Equipment categories (id, name, image, subTypes array, showQuantity, showLocation, showNotes)
- **reservations** - Booking system (id, itemId, userId, startDate, returnDate, status, notes, timestamps)
- **activityLogs** - Audit trail (id, userId, userName, action, itemName, timestamp)
- **notifications** - User notifications (id, userId, message, type, isRead, timestamp, notificationFor)
- **itemEditHistory** - Item modification tracking
- **reservationStatusHistory** - Reservation status change tracking

**Status Enumerations:**
- Item statuses: Available, In Use, Reserved, Maintenance
- Reservation statuses: Pending, Approved, Rejected, Active, Completed, Cancelled

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Migration files in `./migrations` directory
- Push-based deployment with `drizzle-kit push`

### Recent Changes (Dec 1, 2025)

**Dashboard Enhancements:**
- **Purple gradient header**: Dashboard title uses purple gradient design matching "Add Category" button (from-[#667eea] to-[#764ba2])
- **Tabbed Most Requested & Overdue Section**: Single card with two tabs
  - **Most Requested Tab**: Top 6 most requested equipment as vertical bars with purple gradient
    - Bars scale proportionally based on request count
    - Hover effects and tooltips
    - Compact and professional design
  - **Overdue Tab**: Shows count of items overdue for return
    - Red highlighted alert style
    - Items with checkout past return date
- **System Summary Footer**: 6-column metrics grid
  - Equipment and Assets counts
  - Usage Rate, Active Reservations, Alerts, Overdue
- **Metric Cards**: 4-column display (Total Items, Available, In Use, Pending)
  - Color-coded icons (blue, green, purple, amber)
  - Percentage indicators for Available and In Use
- **Detailed Stats Grid**: 3-column section (Maintenance, Reservations, System Health)
- **Professional layout**: Improved spacing, hierarchy, and visual consistency throughout the dashboard

### Previous Changes (Nov 30, 2025)

**Developer Role Full Admin Access:**
- Updated all frontend pages to include developer role in admin checks
- Developer credentials: username `developer`, password `omg`
- Developer account now has complete admin access across the entire application

### Previous Changes (Nov 23, 2025)

**Email Notification System:**
- Integrated nodemailer for transactional email sending
- Created `server/emailService.ts` with three email templates:
  - **Reservation Request**: Sent to admins when user creates a reservation (includes user details, department, item name, dates, purpose of use)
  - **Reservation Approved**: Sent to user when admin approves the reservation
  - **Reservation Rejected**: Sent to user when admin rejects with optional rejection reason
- Email addresses stored in user table (email field already present in UserManagement)
- Supports SMTP configuration via environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
- Falls back to console logging if SMTP not configured (for development)

**Reports Navigation Fix:**
- Added Reports menu item to all pages (Inventory, Reservations, QR Codes, Maintenance, Activity Logs, User Management)
- Reports text translated to "Damage Reports" using translation keys
- Fixed onNavigateToReports prop passing through all pages in App.tsx

**Quantity Tracking Implementation:**
- Added `quantity` field to items table (defaults to 1)
- Updated ItemFormDialog to include quantity input with minimum value of 1
- Items display quantity: "2 cameras" means 1 item with quantity 2 available
- Checkout/return logic now works with available quantities

**Column Visibility Toggles:**
- Added `showQuantityColumn` and `showLocationColumn` state to Inventory page
- Toggle buttons appear in table view header (Qty, Location)
- Buttons show 'default' variant when column is visible, 'outline' when hidden
- Table header and rows dynamically show/hide based on toggle state

**Card View Enhancements:**
- ItemCard component now accepts and displays `quantity` prop
- Quantity displayed alongside Type in card grid (2-column layout)
- Both Equipment (card) and Assets (card) show quantity information
- Quantity defaults to 1 if not specified

## Features Summary

### Recently Added
- ✅ Email notification system (reservations, approvals, rejections)
- ✅ Reports tab visible on all pages for easy navigation
- ✅ Quantity field with input validation (min: 1)
- ✅ Column visibility toggles for table view (Quantity, Location)
- ✅ Quantity display on all item cards
- ✅ Default quantity 1 for all items
- ✅ Column visibility only appears in table view mode

### Existing Features
- ✅ Date range filters (This week, Last week, This month, Last month, Custom)
- ✅ Separate notifications for users and admins
- ✅ QR code generation and scanning
- ✅ Equipment reservation with approval workflow
- ✅ Checkout/check-in with condition tracking
- ✅ Activity logging with search
- ✅ Reports page for damage tracking
- ✅ User management (admin only)
- ✅ Bilingual support (English/Arabic)
- ✅ Mobile responsive design
