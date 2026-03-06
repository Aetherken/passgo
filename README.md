# PassGo 🚌

**Bus pass booking platform for Vimal Jyothi Engineering College students.**

A full-stack monorepo with a bold editorial React frontend and Node.js/Express backend, powered by MySQL.

---

## Project Structure

```
passgo/
├── client/          # React + Vite + Tailwind CSS
└── server/          # Node.js + Express + MySQL
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+
- MySQL Server 8+

### 2. Clone & Configure

```bash
# Clone the repository
git clone <repo-url>
cd passgo
```

**Configure backend:**
```bash
cd server
cp ../.env.example .env
# Edit .env with your MySQL credentials and email config
```

### 3. Database Setup

```bash
cd server
node database/migrate.js
```
This runs `schema.sql` (creates the 9 tables) and `seed.sql` (adds 6 cities, 6 buses, 12 time slots, and 1 Super Admin).

**Default Super Admin credentials (from seed):**
- Email: `admin@passgo.com`
- Password: `admin123`

### 4. Install & Run

**Backend:**
```bash
cd server
npm install
npm run dev      # Start with auto-reload on port 5000
```

**Frontend:**
```bash
cd client
npm install
npm run dev      # Start Vite on port 5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

---

## Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (passgo) |
| `SESSION_SECRET` | Random string for session signing |
| `CLIENT_URL` | Frontend URL for CORS |
| `EMAIL_HOST` | SMTP host (e.g. smtp.gmail.com) |
| `EMAIL_PORT` | SMTP port (587) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | Gmail App Password |
| `EMAIL_FROM` | Sender name + email |

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords. Generate one for "Mail" and use it as `EMAIL_PASS`.

---

## Deployment

### Frontend → Vercel

1. Push `client/` to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variable: `VITE_API_URL=https://your-railway-backend.up.railway.app`
5. Deploy — `vercel.json` handles SPA routing

### Backend → Railway

1. Push `server/` to GitHub (separate repo or monorepo)
2. Create a new project at [railway.app](https://railway.app)
3. Add a **MySQL** plugin — Railway provides the DB URL
4. Set all environment variables from `.env.example`
5. Deploy — `railway.json` + `Procfile` handle startup

**After Railway deployment:**
- SSH into Railway or use the CLI to run the migration:
  ```bash
  node database/migrate.js
  ```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Fonts | League Gothic (headings), Inter (body) |
| Maps | React-Leaflet + OpenStreetMap |
| Charts | Recharts |
| Tickets | qrcode.react + html2canvas + jsPDF |
| Backend | Node.js, Express |
| Auth | express-session + bcrypt |
| Database | MySQL 8 + mysql2 |
| Email | Nodemailer |
| Uploads | Multer |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cities` | List all cities |
| GET | `/api/routes` | List all routes |
| GET | `/api/routes/:id/slots` | Get time slots |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/my` | My booking history |
| PATCH | `/api/bookings/:token/verify` | Verify QR ticket |

### Admin (requires admin/superadmin role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard metrics |
| GET/POST/DELETE | `/api/admin/buses` | Bus management |
| GET | `/api/admin/students` | List students |
| PATCH | `/api/admin/students/:id/toggle` | Activate/deactivate |
| POST | `/api/admin/students/:id/flag` | Flag & email student |
| POST | `/api/admin/notifications` | Send mass notification |
| POST | `/api/admin/cities` | Add city (Super Admin) |
| POST | `/api/admin/routes` | Add route (Super Admin) |
| PATCH | `/api/admin/fare` | Update flat fare (Super Admin) |
