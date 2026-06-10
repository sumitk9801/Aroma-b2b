# Aroma B2B: Full-Stack Inventory, Sales & Analytics Platform

Aroma B2B is a production-ready, enterprise-grade B2B SaaS monorepo designed for multi-tenant wholesale and retail business management. The system is split into an Express & PostgreSQL backend powered by Prisma ORM, and a modern, interactive React SPA frontend built on Vite and Tailwind CSS v4.

The platform guarantees stock integrity using database transactions, schedules automated nightly analytical consolidations for future AI integration, and maintains real-time synchronization using WebSockets.

---

## 🏗️ Repository Architecture

This is a monorepo containing two distinct workspaces:

```text
aroma-b2b/
├── backend/            # Express.js REST API + Prisma ORM + Sockets & Cron Jobs
└── frontend/           # React 19 SPA + Vite + Tailwind CSS v4 + Redux Toolkit
```

Each project contains its own configuration, dependency tree, and start scripts. For detailed documentation on either service, refer to:
* 🗄️ [Backend API Guide](./backend/README.md)
* 🧠 [Backend AI & Analytics Specs](./backend/analytics_and_ai_design.md)
* 💻 [Frontend Application Guide](./frontend/README.md)

---

## 🛠️ Technology Stack

### Backend Services
* **Runtime & Framework**: Node.js & Express.js (HTTP and routing middleware stack)
* **Database & ORM**: PostgreSQL & Prisma ORM (Type-safe relational database management)
* **State & Sync**: WebSockets via Socket.io (Real-time events like cashier refunds and approvals)
* **Automation**: Node-Cron (Nightly analytical precomputations and aggregations at 23:59 IST)
* **Security & Validation**: JWT, Bcrypt, Zod (Validation), Helmet, CORS, HPP, and Rate Limiters
* **Media Pipelines**: Multer & Cloudinary (Ingestion and storage of category and product assets)

### Frontend Application
* **Framework**: React 19 (Functional components and Hooks)
* **Build Tooling**: Vite 8 (Ultra-fast Hot Module Replacement)
* **Styling Engine**: Tailwind CSS v4 & PostCSS (Modern utilities, custom container styles, and layouts)
* **State Management**: Redux Toolkit & React-Redux (Centralized auth, UI state, and cache stores)
* **Data Visualization**: Recharts (Interactive SVG sales metrics, trends, and profitability charts)
* **Navigation & Forms**: React Router DOM v7 (Declarative routing) and React Hook Form + Zod (Validation)
* **User Experience**: Framer Motion (Micro-animations and layout transitions) and Sonner (Toast notifications)

---

## 🔑 Key Enterprise Features

1. **Role-Based Access Control (RBAC)**: Supports roles (`ADMIN`, `MANAGER`, `INVENTORY_STAFF`, `CASHIER`, etc.) to lock down specific sub-routes and backend endpoints (e.g. only Admins/Managers can register supplier purchases and view margins).
2. **Transaction-Safe Stock Controls**: All core operations that alter inventory quantities (Sales, Purchases, and manual Adjustments) are wrapped in Prisma `$transaction` blocks to prevent race conditions and stock inconsistencies.
3. **Nightly Analytics Precomputation**: Aggregations are calculated at 11:59 PM IST every day and frozen in dedicated analytical tables (`DailyShopMetrics`, `DailyProductPerformance`). This improves performance and provides structured historical data for future AI demand forecasting.
4. **Real-Time Notification Gateways**: Integrates WebSockets to push critical, real-time alerts. Cashiers can submit refund requests that are broadcasted instantly to the administrator console for instant approval/rejection.
5. **Damaged Stock Logs**: A dedicated audit trail for reporting damaged goods, recalculating write-off values, and capturing the associated financial losses automatically.
6. **Administrative Request Workflows**: Staff members can submit requests (`ProductRequest`) to register new catalog products. These are held in a pending queue until approved, cataloged, or rejected by managers/admins.

---

## ⚡ Quick Setup & Startup

To run the full stack locally, configure both folders by following these instructions:

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **PostgreSQL** instance running locally or hosted on the cloud

---

### Step 1: Backend Setup

1. Navigate to the backend workspace:
   ```bash
   cd backend
   ```
2. Install the server-side dependencies:
   ```bash
   npm install
   ```
3. Set up your environment file:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://username:password@localhost:5432/aroma_b2b?schema=public"
   JWT_SECRET="your_jwt_signing_key_secret"
   CLOUD_NAME="your_cloudinary_cloud_name"
   API_KEY="your_cloudinary_api_key"
   API_SECRET="your_cloudinary_api_secret"
   ```
4. Run database migrations to provision the schema:
   ```bash
   npx prisma db push
   ```
5. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```
6. Spin up the dev server:
   ```bash
   npm run dev
   ```
   *The backend server will run on `http://localhost:4000`.*

---

### Step 2: Frontend Setup

1. Navigate to the frontend workspace (from the root folder):
   ```bash
   cd frontend
   ```
2. Install the client-side dependencies:
   ```bash
   npm install
   ```
3. Set up the client-side environment file:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL="http://localhost:4000/api/v1"
   VITE_SOCKET_URL="http://localhost:4000"
   ```
4. Run the frontend development server:
   ```bash
   npm run dev
   ```
   *Vite will start the application on `http://localhost:5173` (or the next available port).*

---
