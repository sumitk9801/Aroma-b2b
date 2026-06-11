# Aroma B2B Backend Architecture

A production-grade, high-performance Node.js & Express.js backend engineered for a B2B product platform. Powered by PostgreSQL and Prisma ORM, the application implements transaction-safe inventory controls, unified dashboard widgets, intelligent reporting engines, standard logging, and global security policies.

---

## Technical Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| **Runtime & Framework** | Node.js / Express.js | Core application router and middleware stack |
| **Database & ORM** | PostgreSQL / Prisma ORM | Transactional data storage and type-safe relational schemas |
| **Authentication** | JSON Web Tokens (JWT) / bcrypt | Stateless authentication and token-based security |
| **Validation** | Zod | Schema-based payload and query-parameter validation |
| **Security Layer** | Helmet / CORS / Rate Limiter / HPP / XSS | Threat mitigation, parameter pollution protection, and cross-origin controls |
| **Image Hosting** | Cloudinary / Multer | Multipart file ingestion and cloud storage integrations |
| **Logging Pipeline** | Node FS / Latency Monitors | Console streams, rotating combined/auth/error filesystem logs |

---

## Directory Structure

```text
backend/
├── server.js                  # Starts the HTTP listener
├── app.js                    # Configures Express middlewares, rate limits, and routers
├── config/
│   └── cloudinary.js         # Cloudinary storage integration settings
├── controllers/              # Thin handlers extracting request context
│   ├── authController.js
│   ├── categoryController.js
│   ├── dashboardController.js
│   ├── healthController.js
│   ├── productController.js
│   ├── purchaseController.js
│   ├── reportController.js
│   ├── saleController.js
│   ├── shopController.js
│   ├── stockMovementController.js
│   └── uploadController.js
├── db/
│   └── db.js                 # Initializes PostgreSQL connection pool using Prisma Client
├── middleware/               # Centralized security, logger, and validation interceptors
│   ├── authMiddleware.js     # Token verification and blacklisting
│   ├── errorMiddleware.js    # Operational and validation exception mapper
│   ├── requestLogger.js      # Endpoint latency and request variable logger
│   ├── responseFormatter.js  # Success response decorator (ok / created)
│   ├── validate.js           # Generic Zod validation middleware
│   └── validationSchemas.js  # Request query and payload validation blueprints
├── prisma/
│   └── schema.prisma         # Relational database schema definition
├── routes/                   # Mounted endpoint routers
│   ├── authRoute.js
│   ├── categoriesRoute.js
│   ├── dashboardRoute.js
│   ├── healthRoute.js
│   ├── productRoute.js
│   ├── purchasesRoute.js
│   ├── reportsRoute.js
│   ├── salesRoute.js
│   ├── shopRoute.js
│   ├── stock-movementsRoute.js
│   └── uploadsRoute.js
├── services/                 # Layered business logic, equations, and Prisma queries
│   ├── authService.js
│   ├── categoryService.js
│   ├── dashboardService.js
│   ├── productService.js
│   ├── purchaseService.js
│   ├── reportService.js
│   ├── saleService.js
│   ├── shopService.js
│   ├── stockMovementService.js
│   └── uploadService.js
└── utils/                    # Common structural models and logger helper utilities
    ├── ApiError.js           # Custom operational exception shapes
    ├── ApiResponse.js        # Central success envelope blueprints
    ├── asyncHandler.js       # Asynchronous controller promise-catcher
    └── logger.js             # Standard console and rotating file logger
```

---

## Centralized Middlewares & Security Layers

### 1. Global Security Middlewares
* **Helmet**: Restructures HTTP response headers to secure application context.
* **CORS**: Configures safe origin bounds and method permissions.
* **XSS Clean**: Dynamically sanitizes query parameters and payload strings to prevent script injections.
* **HPP**: Prevents HTTP Parameter Pollution.
* **Rate Limiters**: Defends database resources against brute force:
  * `/api`: 100 requests per 15-minute window.
  * `/api/v1/auth`: 10 authentication requests per 15-minute window.

### 2. Standard Success Response Envelope
Every successful endpoint returns a programmatically uniform JSON payload via `res.ok()` or `res.created()`, conforming to:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

### 3. Global Operational Error Handling
Uncaught errors, Zod validation failures, and database relational constraints are intercepted by `errorMiddleware` and formatted:
* **Zod Schema Errors (400)**: Maps failing validation paths to explicit fields.
* **Database Errors (400)**: Masked to prevent system stack leakage.
* **Operational Exceptions**: Custom `ApiError` representations are preserved.

### 4. Logging & Latency Monitoring
Standard logs are automatically written to both the system console and filesystem logs:
* `logs/combined.log`: General operational histories and completed requests containing method, URL, status code, requesting IP, processing latency, and user-agent.
* `logs/error.log`: Error stack traces and system exceptions.
* `logs/auth.log`: Failed registration, invalid/expired tokens, blacklisted tokens, and failed login coordinate details.

---

## Database Transaction Safety

To guarantee stock level consistency, the application wraps all inventory-affecting actions inside ACID-compliant Prisma database transactions (`$transaction`):
1. **Sales (`createSale`)**: Deducts item stock levels only after verifying that all check-out products have sufficient quantities. Logs a corresponding stock reduction.
2. **Purchases (`createPurchase`)**: Increments item stock levels on receiving vendor supplies. Logs an addition stock movement.
3. **Manual Adjustments (`adjustStock`)**: Applies additions or reductions safely after verifying current levels. Logs an audited stock movement.

---

## Active API Endpoints

### 1. Authentication (`/api/v1/auth`)

* **`POST /register`**: Registers a new user. Default role is `customer`.
* **`POST /login`**: Returns JWT token on success.
* **`POST /logout`**: Blacklists current JWT token in database.
* **`GET /profile`**: Retrieves details of the authenticated user.
* **`POST /refresh-token`**: Extends session token validity.

### 2. Dashboard APIs (`/api/v1/dashboard`)

* **`GET /summary`**: Compiles today's counts (total products, total categories, active low stock products under minimum levels, total sales count, total revenue, and supplier purchases).
* **`GET /recent-sales`**: Fetches the 10 most recent checkout sales.
* **`GET /top-products`**: Groups sales items to determine the highest volume products.
* **`GET /low-stock`**: Identifies all active products that have dropped below restock limits.
* **`GET /sales-chart`**: Compiles chronological daily sales performance timelines for the last 7-day and 30-day periods.

### 3. Reporting Engine (`/api/v1/reports`)

* **`GET /sales-summary`**: Interval-based summary (`daily`, `weekly`, `monthly`, `yearly`).
* **`GET /purchase-summary`**: Periodic supplier replenishment histories.
* **`GET /profit-summary`**: Subtracts actual item COGS (purchase cost) from final retail prices to determine net and gross profit margins.
* **`GET /stock-valuation`**: Counts total quantities in warehouses, comparing cumulative cost assets against retail value to calculate potential profit assets.
* **`GET /dead-stock`**: Isolates stagnant product lines that have recorded zero checkout activity during the specified reporting interval.
* **`GET /fast-moving-products`**: Ranks products by transaction velocity, calculated by dividing units checked out by active inventory duration.

---

## Installation & Startup

### 1. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aroma_b2b
JWT_SECRET=your_jwt_secret_key_string
CLOUD_NAME=cloudinary_cloud_name
API_KEY=cloudinary_api_key
API_SECRET=cloudinary_api_secret
PORT=4000
```

### 2. Install Packages
```bash
npm install
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Start Server
```bash
npm run dev
```
The server will bind to the configured port (defaulting to `3000` or `4000` from environment).

---


