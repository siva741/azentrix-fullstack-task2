# TaskFlow — Multi-User Task Management System

> **Azentrix Full Stack Intern — Task 2**
> A lightweight, self-hostable, real-time Kanban task collaboration tool for remote teams.

![TaskFlow Banner](https://img.shields.io/badge/TaskFlow-Mini%20Trello-6366f1?style=for-the-badge&logo=trello)
![License](https://img.shields.io/badge/license-MIT-10b981?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | `https://azentrix-taskflow.vercel.app` *(deploy on Vercel)* |
| **Backend API** | `https://azentrix-taskflow-api.onrender.com` *(deploy on Render)* |

---

## ✨ Features

- 🔐 **JWT Authentication** — Register / Login with role assignment (first user = Admin)
- 📋 **Kanban Boards** — Create boards with 3 default columns (To Do / In Progress / Done)
- 🃏 **Rich Task Cards** — Title, description, assignee, due date, priority (Low / Medium / High / Urgent)
- 🖱️ **Drag & Drop** — Move cards between columns with `@hello-pangea/dnd`
- ⚡ **Real-Time Sync** — Two users on the same board see live updates via Socket.IO WebSockets
- 👥 **Board Members** — Board owners can invite members by email
- 👑 **Role-Based Access Control**
  - Admins: manage all cards, all boards, and all users
  - Members: can only edit/delete their own cards
- 🛡️ **Admin Panel** — View all users, toggle roles (Admin ↔ Member), delete users

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| Prisma ORM | Type-safe database access |
| PostgreSQL (Supabase) | Database |
| Socket.IO | Real-time WebSocket events |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework + build tool |
| React Router DOM | Client-side routing |
| @hello-pangea/dnd | Drag & drop for Kanban |
| Framer Motion | Smooth animations |
| Socket.IO Client | Real-time board updates |
| Axios | HTTP API calls |
| react-hot-toast | Toast notifications |
| date-fns | Date formatting |

---

## 📁 Project Structure

```
azentrix-fullstack-task2/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # DB schema (User, Board, Column, Card)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js  # Register, Login, GetMe
│   │   │   ├── boardController.js # Board CRUD + member management
│   │   │   ├── cardController.js  # Card CRUD + reorder
│   │   │   └── adminController.js # User management (Admin only)
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification middleware
│   │   │   └── roles.js           # Role-based guard
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth/*
│   │   │   ├── boards.js          # /api/boards/*
│   │   │   ├── cards.js           # /api/cards/*
│   │   │   └── admin.js           # /api/admin/*
│   │   ├── socket/
│   │   │   └── index.js           # Socket.IO board room handlers
│   │   ├── utils/
│   │   │   └── jwt.js             # Token generate/verify helpers
│   │   └── index.js               # Express + Socket.IO entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Board/
    │   │   │   ├── KanbanBoard.jsx # DragDropContext + optimistic reorder
    │   │   │   └── Column.jsx      # Droppable column + add card form
    │   │   ├── Card/
    │   │   │   ├── TaskCard.jsx    # Draggable card with priority/due date
    │   │   │   └── CardModal.jsx   # Full card edit modal
    │   │   └── Layout/
    │   │       └── Layout.jsx      # Sidebar + nav + user info
    │   ├── context/
    │   │   ├── AuthContext.jsx     # JWT auth state + login/register/logout
    │   │   └── SocketContext.jsx   # Socket.IO connection + room helpers
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx   # Board list + create/delete
    │   │   ├── BoardPage.jsx       # Kanban view + real-time socket listeners
    │   │   └── AdminPage.jsx       # User management table
    │   ├── services/
    │   │   └── api.js              # Axios instance with interceptors
    │   ├── App.jsx                 # React Router + protected routes
    │   ├── main.jsx                # App entry + providers
    │   └── index.css               # Dark glassmorphism design system
    ├── .env.example
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- npm v9+
- A PostgreSQL database (free via [Supabase](https://supabase.com))

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/azentrix-fullstack-task2.git
cd azentrix-fullstack-task2
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

> 💡 **Get a free PostgreSQL URL:** Go to [supabase.com](https://supabase.com) → New Project → Settings → Database → Connection String (URI mode)

Run Prisma migrations:

```bash
npm run db:push
```

Start the backend dev server:

```bash
npm run dev
```

Backend runs at: `http://localhost:4000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|--------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login → JWT token | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Boards
| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|--------------|
| GET | `/api/boards` | List user's boards | ✅ |
| POST | `/api/boards` | Create board | ✅ |
| GET | `/api/boards/:id` | Get board with columns & cards | ✅ |
| DELETE | `/api/boards/:id` | Delete board | ✅ Owner/Admin |
| POST | `/api/boards/:id/members` | Add member by email | ✅ Owner/Admin |
| DELETE | `/api/boards/:id/members/:userId` | Remove member | ✅ Owner/Admin |

### Cards
| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|--------------|
| GET | `/api/boards/:boardId/cards` | List all cards on board | ✅ |
| POST | `/api/boards/:boardId/cards` | Create card | ✅ |
| PATCH | `/api/cards/:id` | Update card | ✅ Owner/Admin |
| DELETE | `/api/cards/:id` | Delete card | ✅ Owner/Admin |
| PATCH | `/api/boards/:boardId/cards/reorder` | Reorder after drag | ✅ |

### Admin
| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|--------------|
| GET | `/api/admin/users` | List all users | ✅ Admin |
| PATCH | `/api/admin/users/:id` | Update user role | ✅ Admin |
| DELETE | `/api/admin/users/:id` | Delete user | ✅ Admin |

---

## ⚡ Real-Time Events (Socket.IO)

Clients join a board room: `socket.emit('join-board', boardId)`

| Event | Payload | Description |
|-------|---------|-------------|
| `card:created` | Card object | New card added |
| `card:updated` | Card object | Card edited |
| `card:deleted` | `{ id, boardId }` | Card removed |
| `card:reordered` | `{ boardId, cards[] }` | Cards moved/sorted |
| `board:created` | Board object | New board |
| `board:deleted` | `{ id }` | Board removed |
| `board:memberAdded` | `{ boardId, user }` | Member joined |

---

## 🚀 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repository → select `backend/` as root
4. **Build Command:** `npm install && npx prisma generate`
5. **Start Command:** `npm start`
6. Add **Environment Variables** (same as `.env`)
7. Deploy → copy your Render URL

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect GitHub repo → set **Root Directory** to `frontend`
3. Add **Environment Variable:**
   - `VITE_API_URL` = `https://YOUR_RENDER_URL/api`
4. Deploy → copy Vercel URL
5. Go back to Render → update `CLIENT_URL` to your Vercel URL

---

## 🎨 Design Approach

- **Dark Glassmorphism** theme — deep navy/indigo palette with frosted glass cards
- **Animated blobs** on auth pages for a premium feel
- **Smooth micro-animations** using Framer Motion throughout
- **Color-coded priority system** (Low→Green, Medium→Amber, High→Orange, Urgent→Red)
- **Live connection indicator** (green Wifi icon when Socket.IO is connected)
- **Drag ghost effect** — cards rotate and glow when being dragged

---

## 📊 Database Schema

```
User        id, name, email, password, role (ADMIN|MEMBER), createdAt
Board       id, name, description, ownerId, createdAt
BoardMember boardId, userId  [unique pair]
Column      id, name, order, color, boardId
Card        id, title, description, priority, dueDate, order,
            columnId, assigneeId, createdById, createdAt
```

---

## 🔑 Role Permissions

| Action | Admin | Member (own card) | Member (others' card) |
|--------|-------|-------------------|-----------------------|
| Create card | ✅ | ✅ | ✅ |
| Edit card | ✅ | ✅ | ❌ |
| Delete card | ✅ | ✅ | ❌ |
| Drag card | ✅ | ✅ | ❌ |
| Create board | ✅ | ✅ | ✅ |
| Delete board | ✅ (any) | ✅ (own) | ❌ |
| Add members | ✅ | ✅ (own board) | ❌ |
| Manage users | ✅ | ❌ | ❌ |

---

## 🧰 Scripts

### Backend
```bash
npm run dev        # Start with nodemon (hot reload)
npm run start      # Production start
npm run db:push    # Push Prisma schema to DB (no migration history)
npm run db:migrate # Create & run migrations
npm run db:studio  # Open Prisma Studio (DB GUI)
```

### Frontend
```bash
npm run dev        # Vite dev server (localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
```

---

## 📄 License

MIT © 2026 — Built for Azentrix Full Stack Intern Task 2
