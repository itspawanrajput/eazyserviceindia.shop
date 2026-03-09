# EazyService – AC Services Website

A full-stack, production-ready business website for **EazyService**, an AC servicing company operating in the Delhi-NCR region. Built with React + TypeScript on the frontend and an Express + SQLite backend, it features lead capture forms, an admin dashboard, a visual page builder, and WhatsApp integration.

---

## 🖥️ Live Features

### Public Website
- **Hero Section** – Animated typewriter search bar, 4 service icons, rating (4.8 ★ · 3.8M bookings), and an embedded booking form
- **Service Sections** – 4 dedicated sections: AC Cleaning, Repair, Installation/Uninstallation & Gas Charging
- **Keyword Search** – Searches the service text and auto-scrolls to the matching section
- **Booking Form** – Full lead capture with name, phone, location, service type, preferred date/time, and message
- **Reviews** – Customer testimonials section
- **FAQ** – Common questions and answers
- **WhatsApp Button** – Floating click-to-chat button
- **Mobile CTA** – Full-width call-to-action for mobile users
- **Responsive Design** – Optimized for desktop, tablet, and mobile

### Admin Panel (`/admin`)
| Route | Description |
|---|---|
| `/admin/login` | Secure login with JWT authentication |
| `/admin/dashboard` | Stats overview and recent leads |
| `/admin/leads` | Manage, filter, update status & delete leads |
| `/admin/content` | Content Management System |
| `/admin/security` | Change admin password |

### Visual Page Builder (`/edit`)
- Edit text, images, buttons, and icons inline (via `Editable` wrapper components)
- Desktop / Tablet / Mobile preview modes
- Save drafts & publish to live
- Protected route — requires admin login

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Routing** | React Router DOM v7 |
| **Animations** | Framer Motion (`motion`) |
| **Icons** | Lucide React |
| **Backend** | Express 5, Node.js (via `tsx`) |
| **Database** | SQLite3 (via `sqlite` & `sqlite3`) |
| **Auth** | JWT (`jsonwebtoken`), BCrypt (`bcryptjs`) |
| **File Uploads** | Multer |
| **Sessions** | Cookie Parser |
| **AI Integration** | Google Generative AI (`@google/genai`) |

---

## 📁 Project Structure

```
eazyservice-ac-services/
├── index.html              # Entry HTML
├── index.tsx               # React entry point
├── App.tsx                 # Root app with routing
├── constants.ts            # Service data, keyword map, placeholders
├── types.ts                # Shared TypeScript types (SectionID, ServiceData)
├── server.ts               # Express backend (API + Vite dev middleware)
├── vite.config.ts          # Vite configuration
├── package.json
│
├── components/             # Public website components
│   ├── Header.tsx          # Sticky header with search, nav, call button
│   ├── Hero.tsx            # Hero section with service icons
│   ├── HeroForm.tsx        # Inline booking form in hero
│   ├── ServiceSection.tsx  # Alternating service info sections
│   ├── BookingForm.tsx     # Standalone full booking form
│   ├── Reviews.tsx         # Customer reviews
│   ├── FAQ.tsx             # FAQ accordion
│   ├── Footer.tsx          # Footer with links
│   ├── WhatsAppButton.tsx  # Floating WhatsApp CTA
│   ├── ModalForm.tsx       # Modal popup booking form
│   ├── MobileCTA.tsx       # Mobile sticky CTA bar
│   │
│   └── admin/              # Admin panel components
│       ├── AdminLogin.tsx
│       ├── AdminLayout.tsx
│       ├── DashboardHome.tsx
│       ├── LeadManagement.tsx
│       ├── ContentManagement.tsx
│       └── SecuritySettings.tsx
│
├── src/
│   ├── components/
│   │   ├── Editable.tsx        # Visual builder wrapper
│   │   ├── EditPanel.tsx       # Side panel for editing
│   │   ├── AdminToolbar.tsx    # Top bar in edit mode
│   │   └── ProtectedRoute.tsx  # Auth guard for admin routes
│   ├── context/
│   │   └── VisualBuilderContext.tsx  # Global builder state
│   └── services/               # (API service helpers)
│
└── services/
    └── api.ts              # Frontend API call helpers
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js `v18+`
- npm `v9+`

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd eazyservice-ac-services

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_super_secret_jwt_key_here
```

> ⚠️ Change `JWT_SECRET` to a strong random string in production. Never commit `.env` to version control.

### Running in Development

```bash
npm run dev
```

This starts the Express server (with Vite middleware) on **http://localhost:3000**.

### Building for Production

```bash
npm run build
```

Then start the production server:

```bash
NODE_ENV=production npm start
```

---

## 🔐 Default Admin Credentials

| Username | Password |
|---|---|
| `admin` | `admin123` |

> **⚠️ Change the password immediately** after first login via `/admin/security`.

---

## 🗄️ Database

The app uses a local SQLite database (`database.sqlite`) auto-created on first run. Tables:

| Table | Purpose |
|---|---|
| `users` | Admin user accounts |
| `leads` | Customer booking/inquiry submissions |
| `settings` | Site-wide configuration (key-value) |
| `sections` | CMS section content |
| `page_state` | Visual builder draft & published JSON |

---

## 🌐 API Endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads` | Submit a new lead |
| `GET` | `/api/settings` | Retrieve site settings |
| `GET` | `/api/sections` | Retrieve CMS sections |
| `GET` | `/api/builder/page/:id` | Get builder page state |

### Protected (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Admin login |
| `POST` | `/api/auth/logout` | Admin logout |
| `GET` | `/api/auth/me` | Verify auth token |
| `POST` | `/api/auth/change-password` | Update password |
| `GET` | `/api/leads` | List all leads |
| `PATCH` | `/api/leads/:id` | Update lead status |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `POST` | `/api/settings` | Update settings |
| `POST` | `/api/sections` | Create/update a section |
| `DELETE` | `/api/sections/:id` | Delete a section |
| `POST` | `/api/upload` | Upload a media file |
| `POST` | `/api/builder/save/:id` | Save builder draft |
| `POST` | `/api/builder/publish/:id` | Publish builder page |

---

## 🚀 Deployment (Hostinger / Any VPS)

1. Upload all files to your server
2. Run `npm install` and `npm run build`
3. Set `NODE_ENV=production` in your environment
4. Start the server: `node server.ts` (or use PM2 for process management)
5. Point your domain to port `3000` (or use a reverse proxy like Nginx)

---

## 📞 Contact & Business Info

- **Business:** EazyService – Expert AC Care
- **Phone:** +91 9911481331
- **Service Areas:** Delhi, Gurgaon, Noida, Faridabad, Ghaziabad

---

## 📄 License

This project is proprietary and intended for private business use.
