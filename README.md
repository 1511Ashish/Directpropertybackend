# 🏠 Real Estate Admin Panel — Backend API

A production-ready REST API for managing real estate listings, leads, image uploads, and admin analytics. Built with Node.js, Express.js, MongoDB, and Cloudinary.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (LTS) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh Tokens) |
| Image Storage | Cloudinary |
| File Upload | Multer + multer-storage-cloudinary |
| Validation | Joi |
| Logging | Winston + Morgan |
| Security | Helmet, CORS, express-rate-limit, express-mongo-sanitize |

---

## 📁 Project Structure

```
real-estate-backend/
├── server.js                  # Entry point
├── app.js                     # Express app setup
├── config/
│   ├── db.js                  # MongoDB connection
│   └── cloudinary.js          # Cloudinary config
├── controllers/
│   ├── auth.controller.js
│   ├── property.controller.js
│   ├── lead.controller.js
│   └── dashboard.controller.js
├── middleware/
│   ├── auth.middleware.js      # JWT protect + RBAC
│   ├── catchAsync.js           # Async error wrapper
│   ├── errorHandler.js         # Centralized error handler
│   ├── upload.middleware.js    # Multer + Cloudinary storage
│   └── validate.js             # Joi validation middleware
├── models/
│   ├── Admin.model.js
│   ├── Property.model.js
│   └── Lead.model.js
├── routes/
│   ├── auth.routes.js
│   ├── property.routes.js
│   ├── lead.routes.js
│   └── dashboard.routes.js
├── services/
│   └── cloudinary.service.js   # Image delete helpers
├── utils/
│   ├── AppError.js             # Custom error class
│   ├── apiResponse.js          # Consistent response helpers
│   ├── logger.js               # Winston logger
│   └── tokenUtils.js           # JWT sign/verify helpers
├── validations/
│   └── schemas.js              # All Joi schemas
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚙️ Setup & Installation

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd real-estate-backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in all values (see section below).

### 3. Create Logs Directory

```bash
mkdir logs
```

### 4. Run the Server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:5000` by default.

---

## 🔑 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/real_estate_db` |
| `JWT_SECRET` | Secret for signing access tokens | Long random string |
| `JWT_EXPIRE` | Access token expiry | `7d` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Different long random string |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | `30d` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | `mycloudname` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123secret` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |

---

## 🔐 Authentication Guide

This API uses **JWT Bearer Token** authentication.

### Flow

1. POST `/api/v1/auth/login` → receive `accessToken` + `refreshToken`
2. Include `accessToken` in every protected request header:
   ```
   Authorization: Bearer <accessToken>
   ```
3. When access token expires (401), POST `/api/v1/auth/refresh-token` with the `refreshToken` to get a new pair.

### Roles

| Role | Permissions |
|---|---|
| `admin` | Manage properties, view leads, dashboard |
| `super_admin` | All admin permissions + register new admins |

---

## 📋 API Reference

**Base URL:** `http://localhost:5000/api/v1`

**Standard Response Format:**
```json
{
  "success": true,
  "message": "Description of result",
  "data": {}
}
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

---

### 🔐 Auth Endpoints

#### POST `/auth/login`
Login and receive tokens. **Public.**

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "admin": {
      "id": "64f1a...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**Error Response `401`:**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

#### POST `/auth/register`
Register a new admin. **Protected — Super Admin only.**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "securepassword",
  "role": "admin"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "64f1b...",
    "name": "New Admin",
    "email": "newadmin@example.com",
    "role": "admin"
  }
}
```

---

#### POST `/auth/refresh-token`
Get a new access + refresh token pair. **Public.**

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

#### POST `/auth/logout`
Invalidate the current session. **Protected.**

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET `/auth/me`
Get the currently authenticated admin's profile. **Protected.**

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "64f1a...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "super_admin",
    "lastLogin": "2024-09-01T10:30:00.000Z"
  }
}
```

---

#### PATCH `/auth/me/password`
Change the currently authenticated admin's password. **Protected.**

This updates only the logged-in admin account and clears the stored refresh token, so the admin must log in again.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newsecurepassword"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

---

#### PATCH `/auth/me/email`
Update the currently authenticated admin's email. **Protected.**

This keeps the same admin ID and does not change or remove properties, leads, or other related data.

**Request Body:**
```json
{
  "currentPassword": "securepassword",
  "email": "newadmin@example.com"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "id": "64f1a...",
    "name": "Admin User",
    "email": "newadmin@example.com",
    "role": "super_admin"
  }
}
```

---

### 🏠 Property Endpoints

#### GET `/properties`
Get all properties with pagination, filtering, and search. **Public.**

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `search` | string | Search by title or location |
| `propertyType` | string | `flat`, `villa`, `plot`, `house`, `commercial`, `office` |
| `status` | string | `available` or `sold` |
| `city` | string | Filter by city name |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `sortBy` | string | `price`, `createdAt`, `title` (default: `createdAt`) |
| `order` | string | `asc` or `desc` (default: `desc`) |

**Example:** `GET /properties?city=Mumbai&propertyType=flat&minPrice=5000000&sortBy=price&order=asc&page=1&limit=10`

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Properties fetched",
  "data": {
    "properties": [
      {
        "_id": "64f2c...",
        "title": "Luxury 3BHK Flat in Bandra",
        "slug": "luxury-3bhk-flat-in-bandra",
        "price": 15000000,
        "status": "available",
        "propertyType": "flat",
        "location": { "address": "SV Road", "city": "Mumbai", "state": "Maharashtra" },
        "images": [{ "url": "https://res.cloudinary.com/...", "publicId": "real-estate/..." }],
        "amenities": ["Gym", "Pool", "Parking"],
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 1450,
        "constructionSize": 1200,
        "kitchen": 1,
        "hall": 1,
        "tower": "Tower A",
        "otherRooms": ["Pooja Room", "Study Room"],
        "facing": "North",
        "createdAt": "2024-09-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

#### GET `/properties/:id`
Get a single property by MongoDB ID or slug. **Public.**

**Example:** `GET /properties/luxury-3bhk-flat-in-bandra`

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Property fetched",
  "data": {
    "_id": "64f2c...",
    "title": "Luxury 3BHK Flat in Bandra",
    "slug": "luxury-3bhk-flat-in-bandra",
    "description": "Spacious flat with sea view...",
    "price": 15000000,
    "status": "available",
    "propertyType": "flat",
    "location": { "address": "SV Road", "city": "Mumbai", "state": "Maharashtra", "pincode": "400050" },
    "images": [{ "url": "https://res.cloudinary.com/...", "publicId": "real-estate/prop_001" }],
    "amenities": ["Gym", "Pool", "Parking"],
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 1450,
    "constructionSize": 1200,
    "kitchen": 1,
    "hall": 1,
    "tower": "Tower A",
    "otherRooms": ["Pooja Room", "Study Room", "Guest Room"],
    "facing": "North",
    "isFeatured": true,
    "createdAt": "2024-09-01T00:00:00.000Z"
  }
}
```

---

#### POST `/properties`
Create a new property with images. **Protected (Admin).**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data Fields:**

| Field | Type | Required |
|---|---|---|
| `title` | string | ✅ |
| `description` | string | ✅ |
| `price` | number | ✅ |
| `location[address]` | string | ✅ |
| `location[city]` | string | ✅ |
| `location[state]` | string | ❌ |
| `location[pincode]` | string | ❌ |
| `propertyType` | string | ✅ |
| `status` | string | ❌ |
| `amenities` | string[] | ❌ |
| `bedrooms` | number | ❌ |
| `bathrooms` | number | ❌ |
| `area` | number | ❌ |
| `constructionSize` | number | ❌ |
| `kitchen` | number | ❌ |
| `hall` | number | ❌ |
| `tower` | string | ❌ |
| `otherRooms` | string[] | ❌ |
| `facing` | string (`North`, `East`, `West`, `South`) | ❌ |
| `isFeatured` | boolean | ❌ |
| `images` | file[] | ❌ (max 10) |

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": { "...full property object..." }
}
```

---

#### PUT `/properties/:id`
Update a property. Uploading new images appends them to existing ones. **Protected (Admin).**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Send only the fields you want to update.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Property updated successfully",
  "data": { "...updated property object..." }
}
```

---

#### DELETE `/properties/:id`
Soft-delete a property and remove all images from Cloudinary. **Protected (Admin).**

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

#### DELETE `/properties/:id/images/:publicId`
Remove a single image from a property. **Protected (Admin).**

> `publicId` must be URL-encoded (replace `/` with `%2F`).

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": { "...updated property with remaining images..." }
}
```

---

### 📩 Lead Endpoints

#### POST `/leads`
Submit a new enquiry from the website. **Public.**

**Request Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "message": "I am interested in the 3BHK flat in Bandra.",
  "property": "64f2c...",
  "source": "website"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Enquiry submitted successfully",
  "data": {
    "id": "64f3d...",
    "name": "Rahul Sharma",
    "createdAt": "2024-09-01T12:00:00.000Z"
  }
}
```

---

#### GET `/leads`
Get all leads with pagination and filters. **Protected (Admin).**

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | `new`, `contacted`, `converted`, `closed` |
| `search` | string | Search by name, email, or phone |
| `order` | string | `asc` or `desc` |

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Leads fetched",
  "data": {
    "leads": [
      {
        "_id": "64f3d...",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "message": "Interested in the Bandra flat.",
        "status": "new",
        "property": { "_id": "64f2c...", "title": "Luxury 3BHK Flat in Bandra", "price": 15000000 },
        "createdAt": "2024-09-01T12:00:00.000Z"
      }
    ],
    "pagination": { "total": 80, "page": 1, "limit": 20, "totalPages": 4 }
  }
}
```

---

#### GET `/leads/:id`
Get a single lead. **Protected (Admin).**

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Lead fetched",
  "data": { "...full lead object with populated property..." }
}
```

---

#### PATCH `/leads/:id/status`
Update the status of a lead. **Protected (Admin).**

**Request Body:**
```json
{
  "status": "contacted"
}
```

Valid values: `new`, `contacted`, `converted`, `closed`

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Lead status updated",
  "data": { "...updated lead object..." }
}
```

---

#### DELETE `/leads/:id`
Permanently delete a lead. **Protected (Admin).**

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

---

### 📊 Dashboard Endpoint

#### GET `/dashboard`
Get aggregated analytics data. **Protected (Admin).**

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Dashboard data fetched",
  "data": {
    "properties": {
      "total": 120,
      "available": 95,
      "sold": 25,
      "featured": 8,
      "byType": [
        { "type": "flat", "count": 60 },
        { "type": "villa", "count": 30 },
        { "type": "plot", "count": 20 },
        { "type": "commercial", "count": 10 }
      ]
    },
    "leads": {
      "total": 340,
      "new": 48,
      "byStatus": [
        { "status": "new", "count": 48 },
        { "status": "contacted", "count": 120 },
        { "status": "converted", "count": 100 },
        { "status": "closed", "count": 72 }
      ]
    },
    "recentActivity": {
      "properties": [ { "...5 most recent properties..." } ],
      "leads": [ { "...5 most recent leads..." } ]
    }
  }
}
```

---

## ❌ Error Reference

| HTTP Code | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Unauthenticated — missing or invalid token |
| `403` | Forbidden — insufficient role |
| `404` | Resource not found |
| `422` | Unprocessable entity — Joi validation failed |
| `429` | Too many requests — rate limit hit |
| `500` | Internal server error |

---

## 🚀 Deployment Notes

### Environment
- Set `NODE_ENV=production`
- Use a strong, unique `JWT_SECRET` (minimum 32 characters)
- Point `MONGO_URI` to your Atlas cluster

### MongoDB Atlas
1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Whitelist your server IP
3. Copy the connection string into `MONGO_URI`

### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, and API Secret from Dashboard
3. Images upload to `real-estate/properties/` folder automatically

### Process Manager (PM2)
```bash
npm install -g pm2
pm2 start server.js --name real-estate-api
pm2 save
pm2 startup
```

### Recommended: Reverse Proxy with Nginx
Point your domain to port 5000 with SSL via Let's Encrypt + Certbot.

---

## 📌 First-Time Setup Checklist

- [ ] Copy `.env.example` → `.env` and fill all values
- [ ] Create `logs/` directory
- [ ] Run `npm install`
- [ ] Create your first Super Admin directly in MongoDB:
  ```js
  // Use mongosh or MongoDB Compass
  // Password must be pre-hashed with bcrypt rounds=12
  db.admins.insertOne({
    name: "Super Admin",
    email: "superadmin@example.com",
    password: "<bcrypt_hash>",
    role: "super_admin",
    isActive: true
  })
  ```
  Or temporarily allow public registration, create the admin, then re-protect the route.
#   D i r e c t p r o p e r t y b a c k e n d  
 
