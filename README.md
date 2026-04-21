# Panchayat — Smart Society Management System 🏢

Panchayat is a comprehensive, AI-powered residential society management platform designed to automate and streamline the complexities of community living. It provides a highly interactive and secure ecosystem for Administrators and Residents.

![Branding](https://img.shields.io/badge/Aesthetics-Premium-emerald)
![Tech](https://img.shields.io/badge/Stack-MERN-blue)
![AI](https://img.shields.io/badge/AI-LLaMA_3.3_Powered-teal)

---

## 🌟 Features Breakdown

### 🛠️ Administrative Excellence
- **Unified Dashboard**: Real-time analytics on society health, payment collections, and open complaints.
- **Advanced Resident Tracking**: Securely manage resident data, including family details and vehicle registrations.
- **Smart Billing Engine**: Automated generation of monthly maintenance invoices for all flats.
- **Financial Controls**: Comprehensive payment history with the ability to waive, mark as paid, or track overdue accounts.
- **AI-Powered Insights**: Get automated executive summaries of society activity using LLaMA 3.3.
- **Digital Society Profile**: Manage rules, amenities, and community branding from a single interface.

### 🏠 Resident Empowerment
- **Personalized Portal**: Track dues, maintenance history, and personal complaints.
- **Seamless Payments**: Integrated **Razorpay** checkout for secure, instant maintenance payments.
- **One-Click Complaints**: Report maintenance issues with title, description, and status tracking.
- **Intelligent Assistant**: An AI-driven chatbot to help residents with society bylaws and FAQs.
- **Mobile-Responsive**: A "mobile-first" layout designed to work perfectly on any device.

---

## 📂 Project Structure

```text
panchayat/
├── backend/                # Express & Node.js Server
│   ├── src/
│   │   ├── controllers/    # Request handlers & logic
│   │   ├── models/         # MongoDB Schemas
│   │   ├── routes/         # API Endpoint definitions
│   │   ├── middleware/     # Auth & Error handling
│   │   └── services/       # External API integrations (AI, Mail)
│   └── .env                # Server configurations
├── frontend/               # React & Vite Application
│   ├── src/
│   │   ├── components/     # Reusable UI modules
│   │   ├── pages/          # Main view components
│   │   ├── context/        # Global state management (Auth)
│   │   ├── services/       # Axios API client
│   │   └── assets/         # Styles & static media
│   └── .env                # Client-side environment keys
└── README.md
```

---

## 🚀 API Architecture (Key Endpoints)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User authentication & JWT issuance | Public |
| `POST` | `/api/residents` | Add a new resident (Admin only) | Admin |
| `GET` | `/api/societies/stats/:id` | Get overall society analytics | Admin |
| `POST` | `/api/payments/generate` | Generate bills for the month | Admin |
| `POST` | `/api/payments/verify` | Verify Razorpay payment signature | Resident |
| `POST` | `/api/ai/summary` | Generate AI insights from data | Admin |

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for image hosting)
- Groq Cloud Account (for AI features)

### 2. Quick Install
```bash
# Clone the repository
git clone https://github.com/ritirai06/Panchayat-Smart-Society-Management-System.git
cd panchayat

# Setup Backend
cd backend && npm install
# (Create .env file with your keys)

# Setup Frontend
cd ../frontend && npm install
# (Create .env file with your keys)
```

### 3. Environment Variables
Ensure your `.env` files contain the following:
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A secure string for token signing.
- `GROQ_API_KEY`: API key from Groq Cloud.
- `CLOUDINARY_URL`: Your Cloudinary environment variable.

---

## 🎨 Professional Design System
Panchayat is built with a custom design system focused on clarity and premium aesthetics:
- **Primary Color**: Emerald-600 (`#10b981`)
- **Secondary Color**: Zinc-900 (`#18181b`)
- **Typography**: Inter / Outfit for modern readability.
- **Glassmorphism**: Subtle blurs and translucent panels used across the dashboard.

---

## 🤝 Contribution
Contributions are welcome! Please fork the repository and submit a pull request for any enhancements.

---
*Built for the future of community living.*

*Written By* -- RITI RAI
