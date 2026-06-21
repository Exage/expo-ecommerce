<h1 align="center">✨ Full-Stack E-Commerce App (Mobile + Admin + API) ✨</h1>

✨ **Highlights:**

- 📱 Fully Functional E-Commerce Mobile App (React Native + Expo)
- 🔐 Secure Authentication with Clerk (Google & Apple sign-in)
- 🛒 Cart, Favorites, Checkout & Orders Flow
- 💳 Stripe-Powered Payments
- 🗺️ Addresses System
- 🏪 Admin Dashboard — Products, Orders, Customers & Stats
- ⚙️ Complete REST API (Node.js + Express) with Auth & Roles
- 🛂 Admin-Only Protected Routes
- 📦 Background Jobs with Inngest
- 🧭 Dashboard with Live Analytics
- 🛠️ Product Management (CRUD, image handling, pricing, etc.)
- 📦 Order Management
- 👥 Customer Management Page
- 🛡️ Sentry Integration for monitoring & error tracking
- 🚀 Deployment on Sevalla (API + Admin Dashboard)
- 🖼️ Product Image Slider
- ⚡ Data Fetching & Caching with TanStack Query
- 🧰 End-to-End Git & GitHub Workflow (branches, commits, PRs, code reviews)
- 🤖 CodeRabbit PR Analysis (security, quality, optimization)

---

## 🧪 `.env` Setup

### 🟦 Backend (`/backend`)

```bash
NODE_ENV=development
PORT=3000

DB_URL=<YOUR_DB_URL>

CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<YOUR_CLERK_SECRET_KEY>

INNGEST_SIGNING_KEY=<YOUR_INNGEST_SIGNING_KEY>

CLOUDINARY_API_KEY=<YOUR_CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_CLOUDINARY_API_SECRET>
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUDINARY_CLOUD_NAME>

ADMIN_EMAIL=<YOUR_ADMIN_EMAIL>

CLIENT_URL=http://localhost:5173

STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>

STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>

GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.0-flash
```

---

### 🟩 Admin Dashboard (/admin)

```bash
VITE_CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
VITE_API_URL=http://localhost:3000/api

VITE_SENTRY_DSN=<YOUR_SENTRY_DSN>
```

---

### 🟧 Mobile App (/mobile)

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY= <YOUR_CLERK_PUBLISHABLE_KEY>

SENTRY_AUTH_TOKEN=<YOUR_SENTRY_DSN>

EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
```

## 🚀 Инструкция по запуску

Проект запускается из корня репозитория одной командой, без ручного старта каждого приложения:

```bash
npm run dev:all
```

Этот скрипт автоматически поднимает:

- `backend`
- `admin`
- `mobile`

Если в одном из приложений нет `node_modules`, скрипт сам выполнит установку зависимостей перед запуском.

### Альтернативные команды

Если удобнее запускать через платформенный скрипт, можно использовать:

- macOS/Linux: `bash scripts/start-all.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1`

### Требования для запуска

- Docker 27.2.0
- Visual Studio Code
- Google Chrome

### Как остановить проект

Нажмите `Ctrl+C` в том терминале, где запущен общий стартовый скрипт.

### Что будет доступно после запуска

- API: `http://localhost:3000`
- Admin dashboard: `http://localhost:5173`
- Mobile app: Expo Dev Tools / QR-код в терминале

### Если нужно запустить отдельно

Скрипты ниже оставлены как резервный вариант, но обычно они не нужны:

- Backend: `npm run dev --prefix backend`
- Admin: `npm run dev --prefix admin`
- Mobile: `npm run start --prefix mobile`

### AI Product Assistant Endpoint

`POST /api/products/assistant/suggest`

Body example:

```json
{
  "query": "Нужен недорогой смартфон с хорошей камерой",
  "limit": 6
}
```
