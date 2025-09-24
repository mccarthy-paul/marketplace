# Juno Marketplace Application Architecture

This document provides a comprehensive overview of the Juno Marketplace application architecture, including all components, services, and their relationships.

## 🏗️ Application Overview

The Juno Marketplace is a luxury watch marketplace with two main applications:

1. **Main Marketplace App** - Customer-facing application for buying/selling watches
2. **Admin App** - Administrative interface for managing orders, bids, watches, and users

## 📡 Services & Deployment

### Local Development Ports
| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Main API** | 8001 | http://localhost:8001 | Backend API for marketplace |
| **Main Frontend** | 5173 | http://localhost:5173 | Customer marketplace interface |
| **Admin Frontend** | 5174 | http://localhost:5174 | Admin interface (dev) |

### Production Deployment
| Service | Platform | URL | Status |
|---------|----------|-----|--------|
| **Database** | MongoDB Atlas | `mongodb+srv://...@junomarketplace.ci9sfz3.mongodb.net` | ✅ Live |
| **Main API** | Google Cloud Run | https://api-53189232060.us-central1.run.app | ✅ Live |
| **Main Frontend** | Netlify | https://juno-marketplace.netlify.app | ✅ Live |
| **Admin Frontend** | Netlify | https://juno-marketplace-admin.netlify.app | ✅ Live |
| **Image Storage** | Google Cloud Storage | `juno-marketplace-watches` bucket | ✅ Live |

### Deployment Strategy
- **Backend**: Google Cloud Run (containerized deployment via `./deploy.sh`)
- **Frontend**: Netlify (automatic deployment via Git integration)
- **Admin App**: Netlify (separate site, automatic deployment via Git)
- **Images**: Google Cloud Storage (integrated with backend API)

## 🗂️ Directory Structure

```
juno-marketplace/
├── 📁 api/                          # Main API Server (Port 8001)
│   ├── 📁 db/                       # Database models and connection
│   │   ├── bidModel.js              # Bid schema and model
│   │   ├── transactionModel.js      # Order/transaction schema
│   │   ├── userModel.js             # User schema
│   │   ├── watchModel.js            # Watch schema
│   │   └── index.js                 # MongoDB connection
│   ├── 📁 routes/                   # API route handlers
│   │   ├── admin.js                 # 🆕 Admin API endpoints
│   │   ├── bids.js                  # Bid management endpoints
│   │   ├── junopay.js               # JunoPay integration
│   │   ├── orders.js                # Order management endpoints
│   │   ├── users.js                 # User management endpoints
│   │   └── watches.js               # Watch management endpoints
│   ├── 📁 services/                 # Business logic services
│   │   └── junopayService.js        # JunoPay API integration
│   ├── .env                         # Environment variables
│   └── index.js                     # Main API server
│
├── 📁 admin-app/                    # Admin Application (Port 5174)
│   ├── 📁 src/
│   │   ├── 📁 components/           # React components
│   │   │   ├── AdminDashboard.jsx   # Enhanced with orders/bids stats
│   │   │   ├── AdminLogin.jsx       # Admin authentication
│   │   │   ├── BidAdminList.jsx     # Bids management interface
│   │   │   ├── OrderAdminList.jsx   # Orders management interface
│   │   │   ├── UserAdminList.jsx    # User management interface
│   │   │   └── WatchAdminList.jsx   # Watch management interface
│   │   ├── 📁 utils/
│   │   │   └── api.js               # API configuration with backend URL
│   │   └── App.jsx                  # Admin app routing
│   ├── .env                         # Admin environment variables
│   └── vite.config.js               # Vite configuration for admin app
│
├── 📁 src/                          # Main Frontend (Port 5173)
│   ├── 📁 components/               # React components
│   │   ├── AdminBidDetailPage.jsx   # 🆕 Admin bid details (unused)
│   │   ├── AdminBidsPage.jsx        # 🆕 Admin bids list (unused)
│   │   ├── AdminOrderDetailPage.jsx # 🆕 Admin order details (unused)
│   │   ├── AdminOrdersPage.jsx      # 🆕 Admin orders list (unused)
│   │   └── DashboardPage.jsx        # 🆕 Enhanced for admin users
│   ├── WatchDetails.jsx             # Watch detail page with buy functionality
│   ├── ProfilePage.jsx              # User profile with order history
│   └── App.jsx                      # 🆕 Updated with admin routes
│
└── 📁 dist/                         # Built frontend files
```

## 🔐 Authentication & Users

### Database: `junoauth`
- **Location**: `mongodb://localhost:27017/junoauth`
- **Collections**: users, bids, watches, transactions, orders

### User Types
1. **Admin User**
   - Email: `admin@luxe24.com`
   - Password: `admin123`
   - Access: Admin app + marketplace app (with admin privileges)

2. **JunoPay Users**
   - Email: `broker1@junomoney.com`
   - Authentication: JunoPay OAuth
   - Access: Marketplace app only

### Authentication Flow
- **Marketplace**: JunoPay OAuth 2.1 + PKCE
- **Admin App**: Simple email/password with session management

## 📊 Data Models

### Bid Model (`bids` collection)
```javascript
{
  _id: ObjectId,
  watch: ObjectId,           // Reference to Watch
  bidder: ObjectId,          // Reference to User
  amount: Number,            // Bid amount in USD
  ownerEmail: String,        // Watch owner email
  bidderEmail: String,       // Bidder email
  bidderName: String,        // Bidder name
  status: String,            // 'offered', 'accepted', 'rejected', 'cancelled'
  comments: Array,           // Bid comments/messages
  created_at: Date,
  updated_at: Date
}
```

### Transaction Model (`transactions` collection)
```javascript
{
  _id: ObjectId,
  applicationTransactionId: String,    // JunoPay transaction ID
  watch: ObjectId,                     // Reference to Watch
  buyer: ObjectId,                     // Reference to User
  seller: ObjectId,                    // Reference to User
  buyerClientId: String,               // JunoPay buyer client ID
  sellerClientId: String,              // JunoPay seller client ID
  purchasePrice: String,               // Watch price
  shippingPrice: String,               // Shipping cost
  buyerFee: String,                    // Platform fee
  totalPrice: String,                  // Total amount
  status: String,                      // 'initiated', 'pending', 'completed', 'cancelled'
  currency: String,                    // 'USD'
  created_at: Date,
  updated_at: Date
}
```

## 🔗 API Endpoints

### Main API (Port 8001)
- **Base URL**: `http://localhost:8001/api`
- **Admin Routes** (`/admin/*`):
  - `GET /admin/orders/count` - Get total orders count
  - `GET /admin/orders` - List all orders with details
  - `GET /admin/orders/:id` - Get specific order details
  - `POST /admin/orders/:id/refresh-status` - Refresh JunoPay status
  - `GET /admin/bids/count` - Get total bids count
  - `GET /admin/bids` - List all bids with details
  - `GET /admin/bids/:id` - Get specific bid details
  - `GET /admin/users/count` - Get total users count
  - `GET /admin/watches/count` - Get total watches count

### Admin API (Port 8002)
- **Base URL**: `http://localhost:8002/api`
- **Authentication**: Session-based with admin user
- **Proxy Routes** (forward to database or main API):
  - `POST /admin/login` - Admin login
  - `GET /admin/status` - Check admin authentication
  - `GET /admin/orders/count` - Proxy to get orders count
  - `GET /admin/orders` - Direct database query for orders
  - `GET /admin/bids/count` - Direct database query for bids count
  - `GET /admin/bids` - Direct database query for bids
  - `GET /admin/users/count` - Direct database query for users count
  - `GET /admin/watches/count` - Direct database query for watches count

## 🎯 Key Features

### Admin Dashboard
- **Location**: `admin-app/src/components/AdminDashboard.jsx`
- **Features**:
  - Statistics cards showing counts for Users, Watches, Orders, Bids, Admin Users
  - Quick action buttons for managing each entity type
  - Admin authentication required

### Bids Management
- **List View**: `admin-app/src/components/BidAdminList.jsx`
- **Features**:
  - Display all bids with watch details, bidder info, amounts
  - Search and filter functionality
  - Status badges for bid states
  - Links to detailed bid views (future enhancement)

### Orders Management
- **List View**: `admin-app/src/components/OrderAdminList.jsx`
- **Features**:
  - Display all orders/transactions with watch details, buyer info
  - Search and filter functionality
  - Status badges for order states
  - Links to detailed order views (future enhancement)

## 🚀 Deployment & Access

### Local Development
1. **Start Main API**: `cd api && pnpm dev` (Port 8001)
2. **Start Main Frontend**: `pnpm dev` (Port 5173)
3. **Start Admin Frontend**: `cd admin-app && pnpm dev` (Port 5174)

### Production Access
- **Main App**: https://juno-marketplace.netlify.app
- **Admin App**: https://juno-marketplace-admin.netlify.app
- **API Endpoint**: https://api-53189232060.us-central1.run.app
- **Image Storage**: https://storage.googleapis.com/juno-marketplace-watches/

### Production Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│ Main Frontend   │────▶│  API Backend     │────▶│  MongoDB Atlas  │
│ (Netlify)       │     │  (Cloud Run)     │     │  (Cloud DB)     │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
┌─────────────────┐             │                          │
│                 │             │                          │
│ Admin Frontend  │─────────────┘                          │
│ (Netlify)       │                                        │
│                 │     ┌──────────────────┐               │
└─────────────────┘     │                  │               │
                        │ Google Cloud     │───────────────┘
                        │ Storage          │
                        │ (Images)         │
                        └──────────────────┘

React Apps              Express API + Storage        Database Cloud
Netlify Sites          Cloud Run + GCS Bucket      MongoDB Cluster
```

### Admin Access
1. Navigate to admin login (local): `http://localhost:5174/login`
2. Login with: `admin@luxe24.com` / `admin123`
3. Access dashboard and management interfaces

## 🛠️ Recent Enhancements

### ✅ Completed Features
1. **Admin Orders Management**: Complete CRUD interface for viewing and managing orders
2. **Admin Bids Management**: Complete interface for viewing and managing bids
3. **Enhanced Dashboard**: Added statistics for orders and bids
4. **Google Cloud Storage Integration**: Reliable image storage with public URLs
5. **Delete Watch Functionality**: Users can delete their own watch listings
6. **Image Display Fix**: Consistent image URLs across all components
7. **Netlify Deployment**: Both frontend and admin apps deployed to separate Netlify sites
8. **Authentication Integration**: Proper admin authentication for all admin features

### 🆕 Latest Updates (2025-09-24)
1. **Fixed Image Storage**: All watch images now consistently use Google Cloud Storage
2. **User Delete API**: New `DELETE /api/watches/user/:id` endpoint with security checks
3. **Enhanced ProfilePage**: Added delete buttons with confirmation dialogs
4. **Active Bid Protection**: Prevents deletion of watches with active bids
5. **Updated Documentation**: Reflects current deployment architecture

### 🔄 Architecture Decisions
1. **Separate Admin App**: Isolated admin functionality for security and maintenance
2. **Proxy Routes**: Admin app queries database directly to avoid complex cross-service auth
3. **Dual Database Access**: Both apps connect to `junoauth` database for data consistency
4. **CORS Configuration**: Main API allows requests from both marketplace and admin origins

## 🐛 Known Issues & Solutions

### CORS Issues
- **Problem**: Admin app making requests to main API
- **Solution**: Added admin domains to main API CORS configuration

### Authentication Complexity
- **Problem**: Two separate session systems
- **Solution**: Implemented proxy routes in admin app with direct database access

### Ngrok Domain Access
- **Problem**: API calls failing when accessing via ngrok
- **Solution**: Relative URLs in admin components, proxy routes handle database access

## 📝 Environment Variables

### Production API (.env.production)
```
MONGODB_URI=mongodb+srv://paulmccarthy_db_user:***@junomarketplace.ci9sfz3.mongodb.net?retryWrites=true&w=majority
JUNO_APPLICATION_ID=PaulsMarketplace-cafd2e7e
JUNO_SECRET_KEY=fd4b6008-f8c5-4c76-beae-8279bac9a91c
JUNO_REDIRECT_URI=https://api-53189232060.us-central1.run.app/auth/junopay/callback
JUNOPAY_AUTHORIZE_URL=https://stg.junomoney.org/oauth/authorize
JUNOPAY_TOKEN_URL=https://stg.junomoney.org/oauth/token
JUNOPAY_API_BASE_URL=https://stg.junomoney.org/restapi
SESSION_SECRET=***
NODE_ENV=production
```

### Frontend Build Variables
```
VITE_API_URL=https://api-53189232060.us-central1.run.app
```

### Admin App (.env)
```
MONGODB_URI=mongodb+srv://paulmccarthy_db_user:***@junomarketplace.ci9sfz3.mongodb.net?retryWrites=true&w=majority
VITE_API_URL=https://api-53189232060.us-central1.run.app
```

This architecture provides a scalable, maintainable solution for both customer-facing marketplace functionality and comprehensive administrative management.