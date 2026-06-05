# TaskFlow — Multi-User Task Management System

A lightweight, self-hostable, real-time Kanban task collaboration tool built for remote teams.

![TaskFlow](https://img.shields.io/badge/TaskFlow-Kanban-6366f1?style=for-the-badge&logo=trello)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase)

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | [https://azentrix-fullstack-task2-chi.vercel.app](https://azentrix-fullstack-task2-chi.vercel.app) |
| **Backend API** | [https://azentrix-taskflow-api.onrender.com](https://azentrix-taskflow-api.onrender.com) |

---

## ✨ Features

- 🔐 **JWT Authentication** — Register and login with automatic role assignment (first user becomes Admin)
- 📋 **Kanban Boards** — Create boards with 3 default columns: To Do, In Progress, Done
- 🃏 **Rich Task Cards** — Title, description, assignee, due date, and priority tag (Low / Medium / High / Urgent)
- 🖱️ **Drag & Drop** — Move cards between columns using `@hello-pangea/dnd`
- ⚡ **Real-Time Sync** — Multiple users on the same board see live updates via Socket.IO WebSockets
- 👥 **Board Members** — Board owners can invite members by email
- 👑 **Role-Based Access Control**
  - Admins: manage all cards, boards, and users
  - Members: can only edit or delete their own cards
- 🛡️ **Admin Panel** — View all users, toggle roles (Admin ↔ Member), delete users

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| Prisma ORM | Type-safe database access |
| PostgreSQL (Supabase) | Relational database |
| Socket.IO | Real-time WebSocket events |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Secure password hashing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework and build tool |
| React Router DOM | Client-side routing |
| @hello-pangea/dnd | Drag and drop for Kanban |
| Framer Motion | Smooth UI animations |
| Socket.IO Client | Real-time board updates |
| Axios | HTTP API client |
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
│   │   │   └── roles.js           # Role-based access guard
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
    │   │   │   └── Column.jsx      # Droppable column + add card inline form
    │   │   ├── Card/
    │   │   │   ├── TaskCard.jsx    # Draggable card with priority bar + due date
    │   │   │   └── CardModal.jsx   # Full card edit modal
    │   │   └── Layout/
    │   │       └── Layout.jsx      # Sidebar + nav + user info
    │   ├── context/
    │   │   ├── AuthContext.jsx     # JWT auth state: login/register/logout
    │   │   └── SocketContext.jsx   # Socket.IO connection + joinBoard/leaveBoard
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx   # Board grid + create/delete modal
    │   │   ├── BoardPage.jsx       # Kanban view + real-time socket listeners
    │   │   └── AdminPage.jsx       # User management table
    │   ├── services/
    │   │   └── api.js              # Axios instance with auth interceptors
    │   ├── App.jsx                 # React Router with protected routes
    │   ├── main.jsx                # App entry + context providers
    │   └── index.css               # Dark glassmorphism design system
    ├── .env.example
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- npm v9+
- A PostgreSQL database — free via [Supabase](https://supabase.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/siva741/azentrix-fullstack-task2.git
cd azentrix-fullstack-task2
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure the environment file:

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-strong-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

> 💡 **Free database:** Go to [supabase.com](https://supabase.com) → New Project → Settings → Database → Connection String (URI)

Push the schema to your database:

```bash
npm run db:push
```

Start the backend:

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

Copy and configure the environment file:

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
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login → returns JWT | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Boards
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/api/boards` | List user's boards | ✅ |
| POST | `/api/boards` | Create board | ✅ |
| GET | `/api/boards/:id` | Get board with columns & cards | ✅ |
| DELETE | `/api/boards/:id` | Delete board | ✅ Owner/Admin |
| POST | `/api/boards/:id/members` | Add member by email | ✅ Owner/Admin |
| DELETE | `/api/boards/:id/members/:userId` | Remove member | ✅ Owner/Admin |

### Cards
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/api/boards/:boardId/cards` | List all cards on board | ✅ |
| POST | `/api/boards/:boardId/cards` | Create card | ✅ |
| PATCH | `/api/cards/:id` | Update card | ✅ Owner/Admin |
| DELETE | `/api/cards/:id` | Delete card | ✅ Owner/Admin |
| PATCH | `/api/boards/:boardId/cards/reorder` | Reorder after drag & drop | ✅ |

### Admin
| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/api/admin/users` | List all users | ✅ Admin |
| PATCH | `/api/admin/users/:id` | Update user role | ✅ Admin |
| DELETE | `/api/admin/users/:id` | Delete user | ✅ Admin |

---

## ⚡ Real-Time Events (Socket.IO)

Clients join a board room: `socket.emit('join-board', boardId)`

| Event | Payload | Description |
|-------|---------|-------------|
| `card:created` | Card object | New card added to board |
| `card:updated` | Card object | Card details edited |
| `card:deleted` | `{ id, boardId }` | Card removed |
| `card:reordered` | `{ boardId, cards[] }` | Cards moved between columns |
| `board:created` | Board object | New board created |
| `board:deleted` | `{ id }` | Board removed |
| `board:memberAdded` | `{ boardId, user }` | New member joined board |

---

## 🚀 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repository → set **Root Directory** to `backend`
4. **Build Command:** `npm install && npx prisma generate`
5. **Start Command:** `node src/index.js`
6. Add environment variables (same as `.env`)
7. Click Deploy → copy your Render URL

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect GitHub repo → set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://YOUR_RENDER_URL/api`
4. Click Deploy → copy your Vercel URL
5. Go back to Render → update `CLIENT_URL` to your Vercel URL and redeploy

---

## 🎨 Design Decisions

I chose a **dark glassmorphism** aesthetic because it gives the app a modern, premium feel without being distracting during focused work sessions. Key decisions:

- Deep navy (`#0a0a14`) base keeps the UI easy on the eyes during long sessions
- Priority is shown as a colored top-border on each card — instantly scannable without cluttering the card
- Socket.IO was chosen over polling because it gives true bidirectional real-time sync with minimal server overhead
- Prisma ORM made it straightforward to handle complex relational queries (boards → columns → cards) with full type safety
- The first registered user automatically becomes Admin — this removes the need for a separate admin seeding step in fresh deployments

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
| Move card (drag) | ✅ | ✅ | ❌ |
| Create board | ✅ | ✅ | ✅ |
| Delete board | ✅ any | ✅ own | ❌ |
| Add members | ✅ | ✅ own board | ❌ |
| Manage users | ✅ | ❌ | ❌ |

---

## 🧰 Scripts

### Backend
```bash
npm run dev        # Start with nodemon (hot reload)
npm start          # Production start
npm run db:push    # Push Prisma schema to database
npm run db:migrate # Create and run migrations
npm run db:studio  # Open Prisma Studio (visual DB browser)
```

### Frontend
```bash
npm run dev        # Vite dev server (localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build locally
```
