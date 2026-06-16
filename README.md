# 🚀 TaskFlow - Multi-User Task Management System

TaskFlow is a lightweight, premium, self-hostable task collaboration app built for remote teams. It operates as a focused scrum/Kanban board with robust JWT authentication, MongoDB persistence, draggable cards, role-based access controls, and real-time Socket.IO synchronization.

---

## 🌐 Live Deployment Links

* **Frontend Application (Vercel):** [https://azentrix-fullstack-task2-chi.vercel.app](https://azentrix-fullstack-task2-chi.vercel.app)
* **Backend API Gateway (Render):** [https://azentrix-taskflow-api.onrender.com/api](https://azentrix-taskflow-api.onrender.com/api)
* **Database (MongoDB Atlas):** Hosted on `Cluster0` (Database: `azentrix_task2`)

> 💡 *Note: Render's free tier services automatically spin down after inactivity. If the app takes a few seconds to load on your first visit, please wait a moment for the backend instance to spin up.*

---

## ✨ Features

- **Draggable Kanban Board:** Interactive, responsive board layout with columns for *To Do*, *In Progress*, and *Done* powered by `@hello-pangea/dnd`.
- **Draggable Card Ordering:** Drag and drop cards inside a single column or move them between columns, preserving card indices and order.
- **Detailed Card Metadata:** Supports titles, descriptions, due dates, priority levels (Low, Medium, High), status, and assigned members.
- **Priority Visuals & Badges:** Color-coded priority borders/tags and intelligent due-date badges (Upcoming, Due Today, Overdue).
- **Socket.IO Rooms:** Subscribes users to specific board rooms for real-time card movements, creation, edits, and deletions across multiple active browsers.
- **Role-Based Access Control (RBAC):**
  - `ADMIN`: Full management of users, all boards, columns, and cards.
  - `MEMBER`: Limited to creating, modifying, and deleting only cards they own or are assigned to.
- **Interactive Admin Dashboard:** Displays live analytics (total boards, total tasks, completed vs. pending tasks) and includes a user management panel.
- **Database Reset Endpoint:** A secure endpoint (`/api/auth/reset-db`) protected by server secret to clear database contents or reset admin passwords.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| --- | --- | --- |
| **Frontend** | React (v19), Vite, React Router (v7) | Clean, component-based single-page application framework. |
| **Styling** | Vanilla CSS, Framer Motion, Lucide | Dark glassmorphism theme, premium micro-animations, icons. |
| **Realtime** | Socket.IO Client (v4) | Bidirectional websocket events for board updates. |
| **Backend** | Node.js, Express | Fast, unopinionated, minimalist web framework. |
| **Database** | MongoDB Atlas, Mongoose (v8) | Cloud-hosted document database and Object Data Modeling (ODM). |
| **Auth** | JSON Web Tokens (JWT), BcryptJS | Secure password hashing and token-based stateful authentication. |

---

## 📂 Project Structure

```text
azentrix-fullstack-task2/
├── backend/
│   ├── scripts/
│   │   ├── runDevWithMemoryDb.js  # Runs dev backend with memory server
│   │   ├── seedAdmin.js           # Seeds an admin user into the DB
│   │   └── setup.js               # Tests Atlas database connection
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Mongoose DB connection & DNS setup
│   │   ├── controllers/           # Request handlers (auth, board, card, admin)
│   │   ├── middleware/            # JWT authentication middleware
│   │   ├── models/                # Mongoose schemas (User, Board, Task)
│   │   ├── routes/                # Express API endpoints
│   │   ├── socket/                # Socket.io connection handlers
│   │   ├── utils/                 # Token helpers, constants, & serializers
│   │   └── index.js               # Main server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/            # KanbanBoard, Column, TaskCard, Layout
│   │   ├── context/               # AuthContext and SocketContext
│   │   ├── pages/                 # Login, Register, Dashboard, Board, Admin
│   │   ├── services/              # API Axios instance & interceptors
│   │   ├── App.jsx                # Router & Protected route wrapper
│   │   ├── main.jsx               # React entry point with providers
│   │   └── index.css              # Custom global styles & variables
│   ├── vercel.json                # Vercel SPA rewrite rules
│   ├── package.json
│   └── .env.example
└── render.yaml                    # Render Blueprint infrastructure definition
```

---

## ⚙️ Local Installation & Development

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Fill in your `backend/.env` configuration:
```env
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/azentrix_task2"
JWT_SECRET="generate-a-long-random-string"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:5173"
```
Test your database connection:
```bash
npm run setup
```
Start the development server:
```bash
npm run dev
```

---

### 2. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```
Fill in your `frontend/.env` configuration:
```env
VITE_API_URL="http://localhost:4000/api"
```
Start the dev server:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

> 💡 *Note: The first user to register on a clean database is automatically assigned the **ADMIN** role.*

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate credentials and return a JWT.
- `GET /api/auth/me` - Fetch authenticated user details.
- `POST /api/auth/reset-db` - Secure developer endpoint to reset/clear database.

### 📋 Boards
- `GET /api/boards` - Fetch all boards the user belongs to.
- `POST /api/boards` - Create a new Kanban board.
- `GET /api/boards/:id` - Fetch board columns and cards.
- `DELETE /api/boards/:id` - Delete a board (Owner/Admin only).
- `POST /api/boards/:id/members` - Add user as a board member.
- `DELETE /api/boards/:id/members/:userId` - Remove user from a board.

### 🗂️ Cards & Tasks
- `GET /api/boards/:boardId/cards` - Fetch all cards inside a board.
- `POST /api/boards/:boardId/cards` - Create a card.
- `PATCH /api/boards/:boardId/cards/reorder` - Save drag-and-drop card ordering.
- `PATCH /api/cards/:id` - Update card details/priority/assignee.
- `DELETE /api/cards/:id` - Delete card.

---

## 🔒 Database Reset & Recovery

If you need to recover credentials or wipe database collections to start fresh, you can call the secure reset endpoint.

### Clear Database
Deletes all boards, tasks, and users (allowing the next registered user to become the new Admin):
```bash
curl -X POST "https://azentrix-taskflow-api.onrender.com/api/auth/reset-db" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_JWT_SECRET",
    "action": "clear"
  }'
```

### Reset Admin Credentials
Recreates or updates the admin user:
```bash
curl -X POST "https://azentrix-taskflow-api.onrender.com/api/auth/reset-db" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_JWT_SECRET",
    "action": "reset-admin",
    "email": "admin@example.com",
    "password": "NewSecurePassword123"
  }'
```

---

## 📄 License

Distributed under the MIT License. Copyright © 2026.
