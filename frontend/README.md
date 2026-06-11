# Aroma B2B Frontend Application

A production-ready, interactive React SPA frontend designed for the Aroma B2B SaaS platform. Built on React 19, Vite 8, Tailwind CSS v4, and Redux Toolkit, the application delivers a premium, real-time dashboard experience featuring comprehensive inventory analytics, transaction workflows, and a Point of Sale (POS) checkout interface.

---

## 🛠️ Technology Stack & Libraries

* **Framework**: React 19 (Functional components, custom Hooks)
* **Build & Dev Tooling**: Vite 8 (Ultra-fast hot reloading & optimized build pipeline)
* **Styling Engine**: Tailwind CSS v4 (Modern CSS utility classes, PostCSS architecture, custom transitions)
* **State Management**: Redux Toolkit & React-Redux (Centralized state for auth, caching, and cross-component syncing)
* **Data Visualization**: Recharts (Interactive SVG sales charts, profit margins, and inventory metrics)
* **Routing**: React Router DOM v7 (Declarative client-side routing with role-based route protection)
* **Forms & Validation**: React Hook Form & Zod (Performance-optimized validation models)
* **Notifications**: Sonner (Clean, elegant toast alerts)
* **Animations**: Framer Motion (Fluid transitions, page load animations, and interactive micro-animations)
* **Real-time Synchronization**: Socket.io-client (Live websocket integrations for refund approvals and notifications)

---

## 🏗️ Folder Structure & Architecture

```text
frontend/
├── public/                 # Static assets (favicons, public logos)
├── src/
│   ├── assets/             # Images, global logo resources
│   ├── components/         # Reusable UI component library
│   │   ├── charts/         # Custom Recharts wraps (sales charts, summary widgets)
│   │   ├── layout/         # Shell UI layouts (AppLayout, TopBar, Sidebar, PageSkeleton)
│   │   └── ui/             # Core UI components (Buttons, Input, Dialog, Cards, Badges)
│   ├── pages/              # Domain-specific dashboard routes
│   │   ├── auth/           # Login, Register, Profile, and Shop Selection
│   │   ├── categories/     # Category catalog view
│   │   ├── customers/      # B2B customer lists & profile analytics
│   │   ├── damaged-stock/  # Write-offs logs and loss auditing
│   │   ├── dashboard/      # Interactive main dashboard & KPI widgets
│   │   ├── inventory/      # Stock Movements, Low Stock alerts, and Adjustments
│   │   ├── products/       # Product catalog, new product request queues
│   │   ├── purchases/      # Supplier purchase registrations & details
│   │   ├── reports/        # Interval summaries (Sales, Profits, Valuation, Dead Stock)
│   │   ├── sales/          # Point of Sale (POS) checkout and sale receipts
│   │   ├── shops/          # Multi-tenant Shop registration and management
│   │   ├── suppliers/      # Vendor/Supplier registries
│   │   └── users/          # Users management / Admin RBAC panel
│   ├── router/             # Protected routing rules, role checks
│   ├── store/              # Centralized Redux store setup
│   │   └── slices/         # RTK state slices (auth, products, sales, etc.)
│   ├── utils/              # Network configuration, constants, and helper wrappers
│   ├── App.jsx             # React Bootstrap component and Toast setup
│   ├── main.jsx            # DOM entrypoint
│   └── index.css           # Tailwind CSS imports & global root styles
├── tailwind.config.js      # Utility layout config
├── postcss.config.js       # Styles post-processor configuration
└── vite.config.js          # Vite configuration
```

---

## 🔑 Key Client Features

### 1. Role-Based Navigation & Access Control
The application checks user roles (`ADMIN`, `MANAGER`, `INVENTORY_STAFF`, `CASHIER`) and shop memberships before displaying pages:
* **Admin-only**: Full multi-tenant configuration (Shops list, global logs).
* **Admin + Manager**: Vendor purchases, financial reports (COGS/Margins), employee role management, and customer/supplier databases.
* **Inventory Staff**: Catalog additions, product request queues, inventory adjustments, and receiving logs.
* **Cashier**: POS checkout screen, sales orders, and immediate refund requests.

### 2. POS Checkout Interface
* Interactive product grid filterable by category.
* Real-time cart calculations (subtotal, tax adjustments, total).
* Transaction validation preventing checkout if quantities exceed warehouse stock levels.

### 3. Analytics Dashboard & Reporting
* Beautiful SVG graphs plotting revenue and transaction trends over customized dates.
* Multi-dimensional financial sheets displaying cost margins, dead stock analysis, low-stock restock indicators, and transaction velocities.

### 4. WebSocket Real-time Request Workflows
* Integrated sockets listen for live state changes from the backend.
* Instantly notifies managers of new cash-register refund requests and product submissions, with options to approve or reject directly from the notification gateway.

---

## ⚡ Setup & Installation

### Prerequisites
* **Node.js** (v18 or higher recommended)
* A running instance of the **Aroma B2B Backend API**

### Step-by-Step Setup

1. **Clone and navigate to the folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the environment**:
   Create a `.env` file in the `frontend` root directory:
   ```env
   VITE_API_URL="http://localhost:4000/api/v1"
   VITE_SOCKET_URL="http://localhost:4000"
   ```
   *Adjust these URLs if your backend is hosted on a different address/port.*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *By default, the app will run at `http://localhost:5173`.*

5. **Build for Production**:
   To generate a minified, production-ready bundle inside the `dist/` directory:
   ```bash
   npm run build
   ```

6. **Preview Production Build**:
   ```bash
   npm run preview
   ```
