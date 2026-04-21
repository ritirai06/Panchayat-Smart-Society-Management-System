# 🏢 Panchayat — AI-Powered Society Management System

A production-ready full-stack web application for managing apartment societies with AI-powered features, real-time notifications, image uploads, and automated reminders.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Run the App](#-run-the-app)
- [Demo Credentials](#-demo-credentials)
- [Features](#-features)
- [Tech Stack & Libraries](#-tech-stack--libraries)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [AI Features](#-ai-features)
- [Production Deployment](#-production-deployment)

---

## ✅ Prerequisites

Make sure the following are installed on your machine before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| MongoDB | 6+ | https://www.mongodb.com/try/download/community |
| npm | 9+ | Comes with Node.js |

---

## 📦 Installation

Open **two separate terminals** in your project folder.

**Terminal 1 — Backend**
```bash
cd "c:\Users\raiad\OneDrive\Desktop\RITI RAI\panchayat\backend"
npm install
```

**Terminal 2 — Frontend**
```bash
cd "c:\Users\raiad\OneDrive\Desktop\RITI RAI\panchayat\frontend"
npm install
```

---

## ⚙️ Environment Setup

Edit `backend/.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/panchayat
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Groq AI — FREE, no credit card needed
# Get your key at: https://console.groq.com
# Model: llama-3.3-70b-versatile (better than GPT-3.5, completely free)
GROQ_API_KEY=your_groq_api_key_here

# Cloudinary — for complaint image uploads
# Get at: https://cloudinary.com (free tier available)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Firebase — for push notifications
# Get at: https://console.firebase.google.com
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

NODE_ENV=development
```

> **Note:** Groq, Cloudinary, and Firebase are all optional. The app runs fully without them using built-in fallback logic.

### How to get a free Groq API key

1. Go to **https://console.groq.com**
2. Sign up — no credit card required
3. Click **API Keys** → **Create API Key**
4. Paste it into `.env` as `GROQ_API_KEY`

---

## 🌱 Seed the Database

Run this **once** to populate sample data (residents, flats, complaints, payments):

```bash
cd backend
node seed.js
```

Expected output:
```
Connected to MongoDB
Cleared existing data
✅ Seed data created successfully!

📋 Login Credentials:
Admin:    admin@panchayat.com    / admin123
Resident: resident@panchayat.com / resident123
Resident: amit@panchayat.com     / resident123

🏢 Society: Green Valley Apartments, Mumbai
```

---

## 🚀 Run the App

Make sure **MongoDB is running** first:

```bash
# Windows — if not running as a service
mongod
```

Then start both servers:

**Terminal 1 — Backend** (runs on port 5000)
```bash
cd backend
npm run dev
```

Expected output:
```
Panchayat server running on port 5000
MongoDB connected successfully
[Scheduler] Auto-reminder scheduler started (5-min interval)
[Embeddings] Local model loaded: all-MiniLM-L6-v2
```

**Terminal 2 — Frontend** (runs on port 3000)
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x  ready in ~300ms
  ➜  Local:   http://localhost:3000/
```

**Open in browser:**
```
http://localhost:3000
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@panchayat.com | admin123 |
| Resident | resident@panchayat.com | resident123 |
| Resident | amit@panchayat.com | resident123 |

---

## 🧩 Features

### ✅ Authentication
- JWT-based login and registration
- Role-based access control (Admin / Resident)
- Token persists across page refreshes
- Auto-logout on token expiry

### ✅ Society Management
- Create and configure a society
- Set maintenance amount, amenities, address
- Upload society bylaws (used by AI Bylaw Bot)

### ✅ Flat & Resident Management
- Add / edit / delete flats with floor, type, area
- Add residents with owner / tenant type
- Track family members and vehicle numbers
- Occupancy status auto-updates

### ✅ Complaint System
- Raise complaints with category, priority, description
- Attach up to 5 photos (uploaded to Cloudinary)
- Admin updates status: Open → In Progress → Resolved → Closed
- Comment thread on each complaint
- Filter by status, category, priority, search

### ✅ Voice-to-Ticket
- Click microphone → speak your complaint
- Web Speech API converts speech to text
- Groq AI detects category and priority automatically
- Review and confirm before submitting

### ✅ Payment System
- Admin generates monthly maintenance bills for all residents
- Auto-marks payments as Overdue past due date
- Admin marks payments as Paid (Online / Cash / Cheque / UPI)
- Send payment reminders to all pending residents
- Stats: Collected, Pending, Overdue amounts

### ✅ AI Chatbot
- Ask anything about your society (timings, rules, amenities)
- Powered by Groq LLaMA 3.3 70B (free)
- Falls back to keyword-based FAQ if no API key

### ✅ Bylaw Bot
- Ask questions about society rules
- Uses LangChain vector embeddings (local, free) for semantic search
- Finds the most relevant rule section before answering

### ✅ AI Summarization
- Admin clicks "Generate Insights" on Dashboard
- Groq AI analyzes all complaints and returns pattern summary
- Falls back to statistical count if no API key

### ✅ Notifications
- In-app notifications for complaints, payments, announcements
- Admin sends broadcast announcements to all residents
- Mark individual or all notifications as read
- Firebase FCM push notifications to device (when configured)
- Auto-retry missed notifications every 5 minutes (scheduler)

### ✅ Real-time Updates
- Socket.IO WebSocket connection per society room
- Live toast when new complaint is raised
- Live toast when announcement is sent
- Unread notification badge in sidebar

### ✅ Dashboard
- Total flats, residents, complaints, collected amount
- Doughnut chart — complaints by category
- Bar chart — complaints by status
- Bar chart — payment overview
- AI Insights panel (admin only)

---

## 📊 Tech Stack & Libraries

### Backend

| Library | Version | Used For |
|---------|---------|----------|
| `express` | 4.18 | REST API server, all routes |
| `mongoose` | 8.0 | MongoDB schemas and queries |
| `groq-sdk` | 0.7 | **Free AI** — LLaMA 3.3 70B for chatbot, summarize, voice-to-ticket, bylaw bot |
| `@xenova/transformers` | 2.17 | **Free local embeddings** — all-MiniLM-L6-v2 for bylaw semantic search |
| `langchain` | 0.1 | Vector chunk management and cosine similarity search |
| `firebase-admin` | 11.11 | FCM push notifications to devices |
| `cloudinary` | 1.41 | Complaint image upload and storage |
| `multer` | 1.4 | Multipart file handling (memory storage) |
| `socket.io` | 4.6 | Real-time WebSocket events |
| `jsonwebtoken` | 9.0 | JWT token generation and verification |
| `bcryptjs` | 2.4 | Password hashing |
| `dotenv` | 16.3 | Environment variable loading |
| `cors` | 2.8 | Cross-origin request handling |
| `nodemon` | 3.0 | Auto-restart server on file changes (dev) |

### Frontend

| Library | Version | Used For |
|---------|---------|----------|
| `react` | 18.2 | UI components, state, hooks |
| `react-router-dom` | 6.21 | Client-side routing, protected routes |
| `axios` | 1.6 | HTTP API calls, auth interceptor |
| `socket.io-client` | 4.6 | Real-time WebSocket connection |
| `chart.js` + `react-chartjs-2` | 4.4 | Doughnut and Bar charts on Dashboard |
| `react-hot-toast` | 2.4 | Success / error toast notifications |
| `react-icons` | 4.12 | All UI icons (Feather Icons set) |
| `tailwindcss` | 3.4 | Utility-first CSS styling |
| `vite` | 5.0 | Dev server, HMR, build tool, API proxy |

### Browser-native (no library)

| API | Used For |
|-----|----------|
| Web Speech API | Voice recording for Voice-to-Ticket |
| Notification API | FCM permission request |
| FormData | Multipart image upload |

---

## 📁 Project Structure

```
panchayat/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── aiController.js        # Groq AI — chat, summarize, voice, bylaw
│   │   │   ├── authController.js      # Register, login, JWT
│   │   │   ├── complaintController.js # CRUD + Cloudinary upload + FCM
│   │   │   ├── notificationController.js # Notifications + FCM broadcast
│   │   │   ├── paymentController.js   # Bills, payments, reminders
│   │   │   ├── residentController.js  # Flats + residents CRUD
│   │   │   └── societyController.js   # Society + bylaw embedding
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT protect + role authorize
│   │   │   └── upload.js              # Multer memory storage
│   │   ├── models/
│   │   │   ├── AILog.js
│   │   │   ├── Complaint.js
│   │   │   ├── Flat.js
│   │   │   ├── Notification.js
│   │   │   ├── Payment.js
│   │   │   ├── Resident.js
│   │   │   ├── Society.js             # includes bylawChunks for vector search
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── ai.js
│   │   │   ├── auth.js
│   │   │   ├── complaints.js
│   │   │   ├── flats.js
│   │   │   ├── notifications.js
│   │   │   ├── payments.js
│   │   │   ├── residents.js
│   │   │   └── societies.js
│   │   ├── services/
│   │   │   └── reminderScheduler.js   # 5-min auto-reminder + overdue payments
│   │   ├── utils/
│   │   │   ├── cloudinary.js          # Image upload helper
│   │   │   ├── db.js                  # MongoDB connection
│   │   │   ├── firebase.js            # FCM push helper
│   │   │   ├── jwt.js                 # Token helpers
│   │   │   └── langchain.js           # Local embeddings + cosine search
│   │   └── server.js                  # Express + Socket.IO entry point
│   ├── seed.js                        # Sample data seeder
│   └── .env                           # Environment config
└── frontend/
    └── src/
        ├── components/
        │   └── layout/
        │       └── Layout.jsx         # Sidebar, socket listener, nav
        ├── context/
        │   └── AuthContext.jsx        # Auth state + FCM token registration
        ├── pages/
        │   ├── Chatbot.jsx            # AI chat + bylaw mode
        │   ├── Complaints.jsx         # Complaints + voice + image upload
        │   ├── Dashboard.jsx          # Charts + AI insights
        │   ├── Login.jsx
        │   ├── Notifications.jsx      # Notifications + announcements
        │   ├── Payments.jsx           # Bills + payments + reminders
        │   ├── Register.jsx
        │   ├── Residents.jsx          # Flats + residents management
        │   └── Society.jsx            # Society settings + bylaws
        ├── services/
        │   ├── api.js                 # Axios instance + interceptors
        │   └── socket.js              # Socket.IO client
        ├── App.jsx                    # Routes + protected route
        └── main.jsx
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |
| PUT | `/api/auth/fcm-token` | Auth | Save FCM device token |

### Society
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/societies` | Auth | Create society |
| GET | `/api/societies/:id` | Auth | Get society details |
| PUT | `/api/societies/:id` | Admin | Update society |
| PUT | `/api/societies/:id/rules` | Admin | Upload bylaws + generate embeddings |

### Flats & Residents
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/flats` | Admin | Add flat |
| GET | `/api/flats/society/:id` | Auth | Get all flats |
| PUT | `/api/flats/:id` | Admin | Update flat |
| DELETE | `/api/flats/:id` | Admin | Delete flat |
| POST | `/api/residents` | Admin | Add resident |
| GET | `/api/residents/society/:id` | Auth | Get residents |
| PUT | `/api/residents/:id` | Admin | Update resident |
| DELETE | `/api/residents/:id` | Admin | Remove resident |

### Complaints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/complaints` | Auth | Create complaint (+ image upload) |
| GET | `/api/complaints/society/:id` | Auth | Get complaints (filterable) |
| GET | `/api/complaints/stats/:id` | Auth | Get complaint stats |
| PUT | `/api/complaints/:id` | Auth | Update status / add comment |
| DELETE | `/api/complaints/:id` | Admin | Delete complaint |

### Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/generate` | Admin | Generate monthly bills |
| GET | `/api/payments/society/:id` | Auth | Get payments |
| GET | `/api/payments/stats/:id` | Auth | Get payment stats |
| PUT | `/api/payments/:id/pay` | Admin | Mark as paid |
| POST | `/api/payments/reminders/:id` | Admin | Send payment reminders |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | Auth | Get notifications |
| PUT | `/api/notifications/read-all` | Auth | Mark all as read |
| PUT | `/api/notifications/:id/read` | Auth | Mark one as read |
| POST | `/api/notifications/announce` | Admin | Send announcement |

### AI
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/ai/chat` | Auth | AI chatbot (Groq LLaMA) |
| POST | `/api/ai/summarize` | Admin | Complaint insights (Groq LLaMA) |
| POST | `/api/ai/voice-to-ticket` | Auth | Voice transcript → complaint JSON |
| POST | `/api/ai/bylaw` | Auth | Bylaw question answering |
| GET | `/api/ai/logs/:id` | Admin | View AI usage logs |

---

## 🤖 AI Features

### Groq LLaMA 3.3 70B (Free)
Used for: Chatbot, Summarization, Voice-to-Ticket, Bylaw Bot

- Get free API key at **https://console.groq.com**
- No credit card required
- Free tier: 1,000 requests/day, 100,000 tokens/minute
- Model is better quality than GPT-3.5-turbo

### Local Embeddings — @xenova/transformers (100% Free)
Used for: Bylaw semantic search

- Model: `all-MiniLM-L6-v2` (~23 MB)
- Downloads once on first run, cached automatically
- Runs on your CPU — no internet, no API key, no cost
- Finds the most relevant bylaw section for each question

### Offline Fallback (No API key needed)
| Feature | Fallback behavior |
|---------|------------------|
| Chatbot | Keyword-based FAQ responses |
| Voice-to-Ticket | Keyword category detection |
| Summarization | Statistical complaint counts |
| Bylaw Bot | Returns error — requires Groq key |

---

## 🔧 Production Deployment

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Set environment
# In backend/.env set:
# NODE_ENV=production
# CLIENT_URL=https://yourdomain.com

# 3. Install PM2 process manager
npm install -g pm2

# 4. Start backend with PM2
cd backend
pm2 start src/server.js --name panchayat

# 5. Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup
```

Serve the frontend `dist/` folder using Nginx or any static host (Vercel, Netlify, etc.).

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoDB connection failed` | Make sure `mongod` is running |
| `Cannot find module 'groq-sdk'` | Run `npm install` in backend folder |
| `Port 5000 already in use` | Change `PORT` in `.env` or kill the process |
| `Port 3000 already in use` | Change `port` in `frontend/vite.config.js` |
| AI returns fallback responses | Check `GROQ_API_KEY` is set correctly in `.env` |
| Images not uploading | Set Cloudinary credentials in `.env` |
| Push notifications not working | Set Firebase credentials in `.env` |
| Embedding model slow on first run | Normal — model downloads once (~23 MB) and caches |
#   P a n c h a y a t - S m a r t - S o c i e t y - M a n a g e m e n t - S y s t e m  
 