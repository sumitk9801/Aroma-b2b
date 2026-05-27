# Aroma B2B Backend

Node.js and Express.js backend for a B2B product platform. The API currently supports user registration, login, protected profile access, logout token blacklisting, and product module code for image-based product creation with Cloudinary.

> Current status: only `/user` routes are mounted in `app.js`. Product routes and services exist, but they need wiring fixes before they are available to frontend clients.

## Project Overview

Aroma B2B is designed to manage users, products, product images, and future order workflows for a B2B commerce system.

High-level flow:

```text
Frontend -> Route -> Middleware -> Controller -> Service -> MongoDB / Cloudinary -> Response
```

The backend uses a layered structure:

- Routes define API paths.
- Middleware handles authentication, authorization, and file parsing.
- Controllers handle request/response logic.
- Services contain business logic.
- Models define MongoDB schemas.
- Config files manage external integrations such as Cloudinary.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| Node.js | Backend runtime |
| Express.js | API routing and middleware |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| Cloudinary | Product image storage |
| Multer | Multipart file upload handling |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| dotenv | Environment variable loading |
| nodemon | Development server reload |

## Folder Structure

```text
aroma-b2b/
├── app.js
├── server.js
├── package.json
├── config/
│   └── cloudinary.js
├── controller/
│   ├── productController.js
│   └── userController.js
├── db/
│   └── db.js
├── middleware/
│   ├── authMiddleware.js
│   └── multer.js
├── models/
│   ├── blackListModel.js
│   ├── orderModel.js
│   ├── productModel.js
│   └── userModel.js
├── routes/
│   ├── orderRoute.js
│   ├── productRoute.js
│   └── userRoute.js
└── services/
    ├── productService.js
    └── userService.js
```

| Folder/File | Responsibility |
| --- | --- |
| `app.js` | Initializes Express, connects MongoDB, registers middleware and routes |
| `server.js` | Starts the HTTP server |
| `db/` | MongoDB connection setup |
| `config/` | Third-party service configuration |
| `routes/` | API route declarations |
| `controller/` | HTTP request and response handlers |
| `services/` | Business logic, database operations, external service calls |
| `middleware/` | Auth, role checks, and file upload middleware |
| `models/` | Mongoose schemas |

## API Status

| Module | Base Route | Status |
| --- | --- | --- |
| Users | `/user` | Active |
| Products | `/product` | Code exists, not mounted |
| Orders | `/order` | Placeholder only |

## API Endpoints

### Health Check

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Returns `Hello World` |

### Users

#### Register

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/user/register` | No | Create a user |

Request body:

| Field | Type | Required |
| --- | --- | --- |
| `name` | string | Yes |
| `email` | string | Yes |
| `password` | string | Yes |
| `role` | string | No, defaults to `customer` |

Example:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "customer"
}
```

Success response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {}
}
```

#### Login

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/user/login` | No | Login and receive JWT |

Request body:

| Field | Type | Required |
| --- | --- | --- |
| `email` | string | Yes |
| `password` | string | Yes |

Success response:

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": "JWT_TOKEN"
}
```

#### Get Profile

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/user/profile` | Yes | Get current user profile |

Headers:

```http
Authorization: Bearer JWT_TOKEN
```

Success response:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {}
}
```

#### Logout

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/user/logout` | Yes | Blacklist current JWT |

Headers:

```http
Authorization: Bearer JWT_TOKEN
```

Success response:

```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

### Products

Product endpoints are defined but not currently active because `/product` is commented out in `app.js`.

#### Add Product

| Method | Route | Auth | Role | Content Type |
| --- | --- | --- | --- | --- |
| `POST` | `/product/add` | Yes | `admin` | `multipart/form-data` |

Form fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | Yes | Product name |
| `skuCode` | string | Yes | Unique SKU |
| `pricePerKg` | number | Yes | Price per kg |
| `currentStock` | number | Yes | Current stock |
| `minimunStock` | number | Yes | Code uses this spelling |
| `image` | file | Yes | Product image |
| `description` | string | No | Product description |

#### Get Products

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/product/get` | No | Get all products |

#### Get Product by SKU

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/product/getbyId` | No | Find product by `skuCode` |

Request body:

```json
{
  "skuCode": "SKU-001"
}
```

#### Search Product by Name

The controller and service include name search logic, but no route currently exposes it.

Search behavior:

- Searches product `name`
- Uses MongoDB `$regex`
- Case-insensitive with `$options: "i"`
- Returns the first matching product

## Product Module

Product creation flow:

```text
Frontend FormData
  -> upload.single("image")
  -> req.body + req.file
  -> Cloudinary upload
  -> Product saved in MongoDB
  -> JSON response
```

Important product concepts:

- `skuCode` is the unique business identifier for products.
- `image` must be sent as the file field name.
- Product images are uploaded to Cloudinary.
- Cloudinary returns `secure_url` and `public_id`.
- `public_id` should be used later for image update/delete operations.

## File Upload System

The backend uses Multer with memory storage:

```js
const storage = multer.memoryStorage();
const upload = multer({ storage });
```

With memory storage, files are not saved locally. Multer stores the uploaded file in `req.file.buffer`, and the service converts that buffer to a base64 data URI before uploading it to Cloudinary.

Frontend upload requirements:

- Use `multipart/form-data`.
- Send text fields through `FormData`.
- Send the image file using the key `image`.
- Do not manually set the `Content-Type` header when using browser `FormData`.

## Environment Variables

Create a `.env` file in the project root. Keep it private and never commit secrets.

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | JWT signing and verification secret |
| `CLOUD_NAME` | Cloudinary cloud name |
| `API_KEY` | Cloudinary API key |
| `API_SECRET` | Cloudinary API secret |
| `port` | Server port, defaults to `3000` |

Example names only:

```env
MONGO_URL=
JWT_SECRET=
CLOUD_NAME=
API_KEY=
API_SECRET=
port=
```

## Installation

Install dependencies:

```bash
npm install
```

Create `.env` with the required variables.

Start the development server:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Frontend Integration

### Login

```js
const response = await fetch("http://localhost:3000/user/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: "test@example.com",
    password: "password123"
  })
});

const result = await response.json();
const token = result.data;
```

### Protected Request

```js
const response = await fetch("http://localhost:3000/user/profile", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const profile = await response.json();
```

### Product Upload

This applies after product routes are mounted and fixed.

```js
const formData = new FormData();

formData.append("name", "Lavender Oil");
formData.append("description", "Pure lavender oil");
formData.append("skuCode", "SKU-001");
formData.append("pricePerKg", "1200");
formData.append("currentStock", "50");
formData.append("minimunStock", "5");
formData.append("image", file);

const response = await fetch("http://localhost:3000/product/add", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
});

const product = await response.json();
```

### Fetch Products

```js
const response = await fetch("http://localhost:3000/product/get");
const result = await response.json();
```

### Fetch Product by SKU

```js
const response = await fetch("http://localhost:3000/product/getbyId", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    skuCode: "SKU-001"
  })
});

const result = await response.json();
```

## Error Handling

Common response shape:

```json
{
  "success": false,
  "message": "Error message"
}
```

Common errors:

| Status | Meaning |
| --- | --- |
| `400` | Missing or invalid request fields |
| `401` | Missing, invalid, expired, or blacklisted token |
| `403` | User is authenticated but not authorized |
| `404` | Requested product or product list not found |
| `500` | Server, database, upload, or service failure |

Auth middleware may return:

```json
{
  "message": "No token provided"
}
```

```json
{
  "message": "Invalid token"
}
```

```json
{
  "message": "Token is blacklisted"
}
```

## Current Implementation Notes

Before enabling the product module, review these code issues:

- `app.js` comments out `/product` and `/order`.
- `routes/productRoute.js` imports `../controllers/productController`, but the folder is `controller`.
- `middleware/multer.js` does not export `upload`.
- `services/productService.js` imports `../utils/cloudinaryConfig`, but Cloudinary config exists at `config/cloudinary.js`.
- `services/productService.js` does not currently export its functions.
- `models/productModel.js` imports `monogoose` but uses `mongoose`.
- `routes/userRoute.js` uses `authMiddleware` directly, but `authMiddleware.js` exports `{ auth, authorize }`.
- `orderRoute.js` is empty.

## Future Improvements

- Add centralized validation with Zod, Joi, or express-validator.
- Add global error handling middleware.
- Standardize all API response formats.
- Enable and fix product routes.
- Add pagination, sorting, and filtering for products.
- Add indexes for `skuCode` and searchable product fields.
- Add rate limiting for auth routes.
- Add automated tests.
- Add Docker support.
- Add Cloudinary image update/delete APIs using `public_id`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Starts the development server with Nodemon |
| `npm test` | Placeholder test script |
