# TaskFlow - Multi-User Task Management System

TaskFlow is a lightweight, self-hostable task collaboration app built for remote teams. It works like a focused mini Trello/Jira scrum board with JWT authentication, MongoDB persistence, draggable cards, role-based permissions, and near real-time Socket.IO updates.

## Live Links

- Frontend: [https://azentrix-fullstack-task2-chi.vercel.app](https://azentrix-fullstack-task2-chi.vercel.app)
- Backend API: [https://azentrix-taskflow-api.onrender.com](https://azentrix-taskflow-api.onrender.com)
- Health check: [https://azentrix-taskflow-api.onrender.com/health](https://azentrix-taskflow-api.onrender.com/health)

Render free-tier services can take a short time to wake up after inactivity. If the backend link times out on the first request, wait a moment and reload.

## Features

- User registration and login with JWT auth
- Password hashing with bcrypt
- MongoDB database using Mongoose
- Boards with default columns: To Do, In Progress, Done
- Drag-and-drop cards
- Card fields: title, description, assignee, due date, priority, status
- Priority colors for Low, Medium, and High
- Due date badges for upcoming, due today, and overdue cards
- Near real-time updates with Socket.IO board rooms
- Admin role for user management and full board/card control
- Member role limited to managing their own cards
- Dashboard totals for boards, tasks, completed tasks, and pending tasks
- Admin page for creating users, switching roles, and deleting users
- Render backend config and Vercel frontend config included

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router |
| UI | CSS, lucide-react, framer-motion, react-hot-toast |
| Drag and drop | @hello-pangea/dnd |
| Realtime | Socket.IO, socket.io-client |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| Deployment | Vercel frontend, Render backend |

## Folder Structure

```text
azentrix-fullstack-task2/
  backend/
    scripts/
      seedAdmin.js
      setup.js
    src/
      config/db.js
      controllers/
      middleware/
      models/
      routes/
      socket/
      utils/
      index.js
  frontend/
    public/
    src/
      components/
      context/
      pages/
      services/
      App.jsx
      main.jsx
      index.css
  render.yaml
  PROJECT_REPORT.md
```

## Environment Variables

Backend `backend/.env`:

```env
MONGODB_URI="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/azentrix_taskflow?retryWrites=true&w=majority"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:5173"

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMeToAStrongPassword
ADMIN_NAME=Admin User
```

Frontend `frontend/.env`:

```env
VITE_API_URL="http://localhost:4000/api"
```

## Local Installation

1. Install backend dependencies:

```bash
cd backend
npm install
cp .env.example .env
```

2. Add your MongoDB Atlas URI and JWT secret in `backend/.env`.

3. Optionally seed an admin user:

```bash
npm run seed:admin
```

4. Start the backend:

```bash
npm run dev
```

5. Install and start the frontend in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

6. Open `http://localhost:5173`.

The first user who registers also becomes an admin automatically.

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/reset-db` (secure admin reset / DB clear)

### Boards

- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:id`
- `PUT /api/boards/:id`
- `DELETE /api/boards/:id`
- `POST /api/boards/:id/members`
- `DELETE /api/boards/:id/members/:userId`

### Cards and Tasks

- `GET /api/boards/:boardId/cards`
- `POST /api/boards/:boardId/cards`
- `PATCH /api/boards/:boardId/cards/reorder`
- `PATCH /api/cards/:id`
- `DELETE /api/cards/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Admin Users

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

The same admin user-management API is also available at `/api/users`.

## Deployment

### MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. Create a database user and password.
3. Add your IP address or `0.0.0.0/0` for hosted services.
4. Copy the connection string and use it as `MONGODB_URI`.

### Render Backend

Use the included `render.yaml`, or create a Web Service manually:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `node src/index.js`
- Environment:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN=7d`
  - `CLIENT_URL=https://your-vercel-app.vercel.app`
  - `NODE_ENV=production`

### Vercel Frontend

Create a Vercel project from the `frontend` folder:

- Framework: Vite
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Environment:
  - `VITE_API_URL=https://your-render-service.onrender.com/api`

If you redeploy under different Render or Vercel URLs, update the Live Links section above.

## Screenshots and Demo

Add screenshots here after deployment:

- Login and registration page
- Dashboard with board totals
- Board page with To Do, In Progress, and Done columns
- Admin user-management page

Demo checklist:

1. Register the first user and confirm the Admin role.
2. Create a board.
3. Add a member by email.
4. Create cards with priority, assignee, and due date.
5. Open the board in two browsers and drag a card between columns.
6. Confirm the second browser updates in near real time.
7. Log in as a member and confirm only owned cards can be edited, moved, or deleted.

## Verification

These checks pass in the completed project:

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd ..
Get-ChildItem -Recurse -Include *.js -Path backend\src,backend\scripts | ForEach-Object { node --check $_.FullName }
```

## Notes

- The app requires a real MongoDB connection to run the backend.
- If the backend exits locally, check `backend/.env` and replace any old SQL/Prisma `DATABASE_URL` with `MONGODB_URI`.
- The backend starts only after MongoDB connects, which prevents deployment from appearing healthy while the database is unavailable.
- Socket.IO rooms are used so updates are broadcast to users on the same board.

---

## 🔒 Database Reset & Admin Credentials Reset

If you forget the admin credentials or want to start fresh with a clean database, you can use the secure `/api/auth/reset-db` endpoint. It is protected by the `JWT_SECRET` key configured on your server (which prevents unauthorized access).

### 1. Reset Admin User
To reset the admin password (or create the admin user if deleted), send a POST request with `action: "reset-admin"`.

```bash
curl -X POST "https://your-backend-url.onrender.com/api/auth/reset-db" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_JWT_SECRET_HERE",
    "action": "reset-admin",
    "email": "admin@example.com",
    "password": "NewSecurePassword123"
  }'
```

### 2. Clear Database
To completely clear the database (deleting all boards, cards, and users so the next registered user will automatically become the new Admin), send a POST request with `action: "clear"`.

```bash
curl -X POST "https://your-backend-url.onrender.com/api/auth/reset-db" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_JWT_SECRET_HERE",
    "action": "clear"
  }'
```
