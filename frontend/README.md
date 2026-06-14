# TaskFlow Frontend

React + Vite frontend for the TaskFlow multi-user task management system.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to your backend API URL, for example:

```env
VITE_API_URL="http://localhost:4000/api"
```

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build in `dist`.
- `npm run lint` runs ESLint.
- `npm run preview` previews the production build.
