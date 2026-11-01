# Evently – Smart Event Booking System

Evently is a full-stack, real-time event booking and management web application built with **React**, **Tailwind CSS**, **Node.js (Express.js)**, **MySQL**, and **Socket.IO**. It features complete end-to-end customer booking flows, high-resolution digital QR ticket generation and image downloading, live Google Maps venue display, real-time seat availability synchronization, and a dedicated, role-separated Admin Dashboard for event CRUD, statistics, and booking management.

---

## 🌟 Key Features

### 1. User Authentication & Profile
- **Complete Auth Flow**: Sign Up, Sign In, and Sign Out with persistent session state on page refresh.
- **Registration**: Full validation for name, email, mobile (7–15 digits), password (bcrypt-hashed), and confirm password.
- **JWT Authentication**: Secured user tokens (`role: 'user'`) separated from admin tokens.
- **User Profile & Booking History**: View personal details, update profile information (name, mobile), view personal booking history with status badges, and download tickets.
- **Strict Data Privacy**: Users can only access and cancel their own bookings and tickets; attempting to access another user's booking returns `403 Forbidden`.

### 2. Admin Authentication & Dashboard
- **Role Separation**: Dedicated admin login (`/admin/login`) with role-guarded middleware (`role: 'admin'`).
- **Dashboard Analytics**: Real-time aggregated statistics including Total Events, Total Bookings, Upcoming Events, Total Revenue (INR), and Recent Bookings.
- **Event CRUD**: Create, read, update, and delete events with date-time picker, pricing, seating capacity, and venue location.
- **Booking Management**: Search bookings by ID, customer name, email, or event title; filter by status; inspect detailed booking info; and cancel bookings.
- **Automated Seat Restoration**: Cancelling a booking instantly restores seats to the event in MySQL and broadcasts real-time seat updates.

### 3. Events, Discovery & Ticket Categories
- **Event Discovery**: Search by keyword, filter by category pills (Technology, Workshop, Music, Business, Arts & Culture, etc.), location, and date range.
- **Dynamic Ticket Categories**: 3-tier pricing model (General 1.0x, Premium 1.5x, VIP 2.5x) with real-time selection, tier perks breakdown, and dynamic backend pricing computation.
- **Related Events**: Intelligent recommendations based on category browsing.
- **Seat Availability**: Live seat counter, visual progress bars, and sold-out states.

### 4. Concurrency Control & Robust Database Integrity
- **ACID Transactions**: MySQL transactions with `SELECT ... FOR UPDATE` row-level locking prevent race conditions and overbooking.
- **Temporary Seat Reservation Hold**: In-memory seat hold with 5-minute auto-expiry and Socket.io broadcasts.
- **Backend Calculation**: Total amounts (`quantity * price * tier_multiplier`) are strictly computed on the backend.
- **Input Validation**: Parameterized SQL queries protect against SQL injection vulnerabilities.

### 5. QR Digital Ticket, Verification & Google Maps
- **QR Code Generation**: Unique ticket reference barcode (`EVENTLY-BOOKING-<id>`) generated for every confirmed reservation.
- **Online Ticket Verification Portal**: Dedicated inspector page (`/verify-ticket` & `/verify-ticket/:refOrId`) providing real-time authenticity checks (Genuine/Confirmed vs Cancelled/Void vs Invalid).
- **Celebration Confetti**: Animated full-screen celebration burst upon successful booking reservation.
- **High-Definition Ticket Download**: Exports a branded, high-resolution ticket image (`.png`) via an offscreen HTML5 Canvas renderer with complete booking metadata (no `window.print()` required).
- **Print / PDF Capability**: Styled print view for saving tickets as PDF.
- **Interactive Google Maps**: Embedded interactive map showing venue location with an automatic functional fallback card and direct Google Maps navigation link.

### 6. Admin Analytics & Reporting
- **Live SVG Analytics Charts**:
  - **Booking Trends**: Responsive SVG line chart with gradient fill.
  - **Daily Revenue Velocity**: Vertical SVG bar chart showing daily income.
  - **Booking Status**: Donut chart with confirmed vs cancelled breakdown and live cancellation rate %.
  - **Top Popular Events**: Ranked horizontal bar chart by gross revenue and tickets sold.
  - **Seat Occupancy**: Capacity progress meters with color alerts.
- **Excel/CSV Export**: One-click streaming downloads for Bookings report (`/api/admin/reports/bookings/export`) and Events report (`/api/admin/reports/events/export`).
- **Date Range Filters**: Instant switching between 7-Day, 30-Day, and All-Time performance metrics.

### 7. Progressive Web App (PWA)
- **Installable PWA**: Configured with `manifest.webmanifest`, app icons, theme colors, and offline cache service worker (`sw.js`).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Vite, Framer Motion, Lucide React, Axios, QRCode.react, Socket.IO Client
- **Backend**: Node.js, Express.js (ES Modules), MySQL2 (Promise Pool), bcrypt, jsonwebtoken, Socket.IO, dotenv, cors
- **Database**: MySQL (InnoDB, Foreign Key Constraints, Transactions, `CHECK` constraints)

---

## 📁 Project Architecture

```
SmartEventBooking/
├── backend/
│   ├── config/
│   │   └── db.js                        # MySQL connection pool & health check
│   ├── controllers/
│   │   ├── adminController.js           # Admin analytics controllers
│   │   ├── authController.js            # User/Admin registration & login
│   │   ├── bookingsController.js        # Booking create, list, view, cancel
│   │   └── eventsController.js          # Event CRUD & validation
│   ├── middlewares/
│   │   └── auth.js                      # adminAuth, userAuth, and anyAuth guards
│   ├── migrations/
│   │   ├── 20231101_create_admins_table.sql
│   │   └── 20261102_add_users_and_booking_user_id.sql
│   ├── routes/
│   │   ├── admin.js                     # /api/admin
│   │   ├── auth.js                      # /api/auth
│   │   ├── bookings.js                  # /api/bookings
│   │   ├── events.js                    # /api/events
│   │   └── user.js                      # /api/users
│   ├── scripts/
│   │   ├── comprehensive_test.mjs       # Full 44-point automated test suite
│   │   ├── runMigration.js              # Safe database migration runner
│   │   ├── seedAdmin.js                 # Admin seed script
│   │   └── seedEvents.js                # Sample event seed script
│   ├── services/
│   │   ├── adminService.js
│   │   ├── authService.js
│   │   ├── bookingsService.js           # Transactions & SELECT FOR UPDATE
│   │   └── eventsService.js
│   ├── sockets/
│   │   └── index.js                     # Socket.IO room join/leave logic
│   ├── utils/
│   │   └── socket.js                    # Global Socket.IO instance provider
│   ├── .env                             # Backend environment variables
│   ├── index.js                         # Express & Socket.IO server entry
│   └── package.json
├── database/
│   └── event_booking.sql                # Complete MySQL DDL schema
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.jsx      # Admin sidebar and layout
│   │   │   │   └── ProtectedRoute.jsx   # Admin route guard
│   │   │   ├── Navbar.jsx               # Navigation with user dropdown & auth state
│   │   │   ├── Footer.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventFilters.jsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx          # Separate User & Admin session management
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminBookingsPage.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminEventsPage.jsx
│   │   │   │   └── AdminLoginPage.jsx
│   │   │   ├── BookingPage.jsx          # Booking form with auth guard & prefill
│   │   │   ├── BookingSuccessPage.jsx   # QR ticket & Canvas PNG downloader
│   │   │   ├── EventDetailsPage.jsx     # Detail view, live map, real-time seats
│   │   │   ├── EventsPage.jsx           # Search, location/date filters, grid/list
│   │   │   ├── LandingPage.jsx          # Hero, categories, features
│   │   │   ├── LoginPage.jsx            # User sign in
│   │   │   ├── RegisterPage.jsx         # User registration
│   │   │   └── UserProfilePage.jsx      # User profile & booking history
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── api.js                   # Axios client with smart JWT interceptor
│   │   │   ├── bookingsService.js
│   │   │   ├── eventsService.js
│   │   │   ├── socket.js                # Socket.IO client
│   │   │   └── userService.js
│   │   ├── utils/
│   │   │   └── ticketDownload.js        # High-res Canvas ticket exporter
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env                             # Frontend environment variables
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables Setup

### Backend (`backend/.env`)
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_event_booking
PORT=5002
JWT_SECRET=supersecretkey_evently_2026
JWT_EXPIRES_IN=24h
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:5002/api
VITE_BACKEND_URL=http://localhost:5002
VITE_GOOGLE_MAPS_API_KEY=
```
*(Leave `VITE_GOOGLE_MAPS_API_KEY` blank to use the built-in universal map embed).*

---

## 🗄️ Database Setup & Migrations

### 1. Initialize Database Schema
Create the database and base tables using the schema file:
```bash
mysql -u root -p < database/event_booking.sql
```

### 2. Run Migrations
Run the safe automated database migration script (verifies/creates `users` table and ensures `user_id` foreign key exists on `bookings` without modifying or deleting existing records):
```bash
node --env-file=backend/.env backend/scripts/runMigration.js
```

### 3. Seed Default Admin (Optional)
If not already created, seed the default administrator account:
```bash
node --env-file=backend/.env backend/scripts/seedAdmin.js
```
- **Default Admin Credentials**:
  - Email: `admin@evently.com`
  - Password: `Admin@1234`

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Start the Backend Server (Port 5002)
```bash
cd backend
npm start
# Server starts at http://localhost:5002
```

### 3. Start the Frontend Development Server (Port 5173)
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 4. Build Frontend for Production
```bash
cd frontend
npm run build
```

---

## 🌐 Production Deployment Guide

Evently is architected for seamless cloud deployment with **Vercel** (Frontend), **Render** (Backend), and **Hosted MySQL** (Aiven, Railway, AWS RDS, or PlanetScale/TiDB).

```
 ┌──────────────────────┐        REST / WebSocket        ┌──────────────────────┐
 │   Vercel (Client)    │ ─────────────────────────────> │   Render (Backend)   │
 │   React SPA + PWA    │ <───────────────────────────── │ Express + Socket.IO  │
 └──────────────────────┘                                └──────────┬───────────┘
                                                                    │ MySQL Pool
                                                                    ▼
                                                         ┌──────────────────────┐
                                                         │     Hosted MySQL     │
                                                         │ (Aiven/Railway/RDS)  │
                                                         └──────────────────────┘
```

---

### Step 1: Set Up Hosted MySQL Database

1. **Create Database**:
   - Provision a free MySQL database on [Aiven](https://aiven.io), [Railway](https://railway.app), or your preferred cloud provider.
2. **Import Schema**:
   - Using MySQL Workbench or the `mysql` CLI, execute `database/event_booking.sql` against your cloud database:
     ```bash
     mysql -h <HOST> -P <PORT> -u <USER> -p <DATABASE_NAME> < database/event_booking.sql
     ```
3. **Note Connection Details**:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and SSL requirement (`DB_SSL=true`).
   - (Or the full `DATABASE_URL` / `MYSQL_URL` connection string).

---

### Step 2: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New → Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `evently-backend` (or your choice)
   - **Region**: Choose the region closest to your database
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Add **Environment Variables** in Render:
   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production environment flag |
   | `PORT` | `10000` | (Render sets this automatically) |
   | `DB_HOST` | `mysql-xxxxx.aivencloud.com` | Hosted database host |
   | `DB_PORT` | `25060` | Hosted database port |
   | `DB_USER` | `avnadmin` | Database username |
   | `DB_PASSWORD` | `<your-db-password>` | Database password |
   | `DB_NAME` | `defaultdb` | Database schema name |
   | `DB_SSL` | `true` | Enables TLS for hosted cloud database |
   | `JWT_SECRET` | `<random-64-character-string>` | Secret key for JWT signing |
   | `JWT_EXPIRES_IN` | `24h` | Token expiration duration |
   | `FRONTEND_URL` | `https://your-evently-app.vercel.app` | Your Vercel frontend URL for CORS |
   *(Alternatively, set `DATABASE_URL` instead of individual `DB_*` variables).*
5. Click **Deploy Web Service**.
6. Once deployed, verify your service by opening `https://<YOUR-RENDER-APP>.onrender.com/api/health` in your browser. It should return `{"status":"healthy"}`.
7. **Seed Admin**: In Render Dashboard under the **Shell** tab, run:
   ```bash
   node scripts/seedAdmin.js
   ```

---

### Step 3: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New… → Project**.
2. Import your GitHub repository.
3. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://evently-backend.onrender.com/api` | Render backend API endpoint (with `/api`) |
   | `VITE_BACKEND_URL` | `https://evently-backend.onrender.com` | Render backend base URL (for Socket.IO) |
   | `VITE_GOOGLE_MAPS_API_KEY` | *(optional)* | Google Maps API key (fallback active if omitted) |
5. Click **Deploy**.
6. When deployment finishes, copy your live Vercel URL (e.g. `https://your-evently-app.vercel.app`).
7. Update `FRONTEND_URL` in your **Render Environment Variables** with your live Vercel URL to finalize strict CORS authorization.

---

## 📡 API Reference

### User Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new customer account | No |
| `POST` | `/api/auth/login` | Authenticate customer and issue JWT | No |

### User Profile & Bookings (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/users/profile` | Get logged-in user profile | User JWT |
| `PUT` | `/api/users/profile` | Update profile (name, mobile) | User JWT |
| `GET` | `/api/users/bookings`| Get user's own booking history | User JWT |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/admin/login` | Authenticate administrator | No |
| `GET` | `/api/admin/stats` | Aggregated dashboard metrics & recent bookings | Admin JWT |
| `GET` | `/api/admin/analytics` | Deep metrics: trends, donut status, popular events, occupancy | Admin JWT |
| `GET` | `/api/admin/reports/bookings/export` | Download complete bookings CSV report | Admin JWT |
| `GET` | `/api/admin/reports/events/export` | Download complete events CSV report | Admin JWT |

### Events (`/api/events`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/events` | List all events (supports `?category=`) | Public |
| `GET` | `/api/events/:id` | Get event details by ID | Public |
| `GET` | `/api/events/:id/related` | Get related events in category | Public |
| `POST` | `/api/events` | Create new event with category | Admin JWT |
| `PUT` | `/api/events/:id` | Update event details & capacity | Admin JWT |
| `DELETE` | `/api/events/:id` | Delete event (blocked if bookings exist) | Admin JWT |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/bookings` | Book tickets (with category tiers & transactions) | User JWT |
| `GET` | `/api/bookings` | Admin: view all bookings; User: view own bookings | Any JWT |
| `GET` | `/api/bookings/:id` | View booking details (isolated to booking owner/admin) | Any JWT |
| `GET` | `/api/bookings/verify/:reference` | Verify QR code / booking reference validity | Public |
| `PUT` | `/api/bookings/:id/cancel` | Cancel booking & restore seats | Owner / Admin JWT |

---

## 🧪 Testing

A comprehensive automated test suite (`backend/scripts/comprehensive_test.mjs`) is provided, covering:
1. Database connectivity and foreign keys
2. Admin authentication, JWT signing with `role: 'admin'`, and dashboard metrics
3. Admin analytics endpoints (booking trends, donut status, popular events, occupancy, cancellation rate)
4. Admin CSV export generation for both bookings and events
5. User signup, duplicate prevention, password hashing, and profile updates
6. Strict token and role separation (User tokens cannot access Admin endpoints)
7. Event CRUD, category assignment, related event queries, and seat capacity validation
8. Real-time Socket.IO room join/leave and seat broadcast
9. Temporary seat reservation hold locking and auto-broadcast
10. Booking transactions with `SELECT ... FOR UPDATE` and dynamic tier price calculations
11. Concurrency race conditions (simultaneous bookings exceeding remaining seats)
12. QR ticket verification endpoint (valid confirmed vs invalid cancelled/void)
13. User booking isolation (User A cannot view or cancel User B's tickets)
14. Booking cancellation, seat restoration in MySQL, and Socket.IO real-time emission

### Run Tests:
```bash
node --env-file=backend/.env backend/scripts/comprehensive_test.mjs
```
**Test Results**: `65 passed, 0 failed` (100% automated coverage).

