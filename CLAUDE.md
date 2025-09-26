# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a luxury watch marketplace application built with React 18 + Vite frontend and Express.js backend. The application implements "Login with Juno" OAuth 2.1 + PKCE authentication and allows users to browse, bid on, and purchase luxury watches.

## Development Commands

### Frontend (React + Vite)
```bash
pnpm dev          # Start development server on port 5173
pnpm build        # Build for production (TypeScript compilation + Vite build)
pnpm preview      # Preview production build
```

### Backend (Express.js API)
```bash
cd api
pnpm dev          # Start development server with nodemon on port 8001
pnpm start        # Start production server
```

## Architecture Overview

### Frontend Structure
- **React 18** with **React Router** for client-side routing
- **Tailwind CSS** for styling with custom brand colors (dark green #0b3d2e, gold #facc15)
- **Vite** as build tool with proxy configuration for API calls
- **TypeScript** support with strict configuration

### Key Frontend Components
- `App.jsx`: Main application with routing and admin route protection
- `HomePage.jsx`: Landing page with hero section and Juno login
- `admin/`: Admin dashboard components (watches, users, login)
- `WatchDetails.jsx`, `WatchBidsPage.jsx`, `BidDetailsPage.jsx`: Watch and bidding functionality
- `NavigationHandler.jsx`: Handles navigation state

### Backend Structure
- **Express.js** server with session management
- **MongoDB** with Mongoose ODM
- **Multer** for file uploads (watch images)
- **CORS** configured for frontend communication

### Data Models
- `Watch`: Core watch entity with brand, model, reference_number, condition, bidding
- `Bid`: Bidding system with comments, status tracking (offered/accepted/rejected)
- `User`: User management with admin roles
- `Listing`: Watch listings
- `Order`: Purchase orders

### API Routes
- `/api/watches`: CRUD operations for watches
- `/api/bids`: Bidding functionality
- `/api/users`: User management
- `/api/admin`: Admin authentication and operations
- `/auth/juno`: Juno OAuth integration

## Authentication System
- **Juno OAuth 2.1 + PKCE** implementation
- Session-based authentication with express-session
- Admin role protection using `AdminRoute` component
- PKCE state/verifier stored in sessionStorage

## Database Configuration
- MongoDB connection configured via `MONGODB_URI` environment variable
- Separate database files for models and connection logic in `api/db/`

## Deployment Architecture

### Production Environment
- **Backend API**: Google Cloud Run - `https://api-xio7lz2d5a-uc.a.run.app`
- **Main Frontend**: Google Cloud Run - `https://frontend-xio7lz2d5a-uc.a.run.app`
- **Admin Frontend**: Netlify - `https://juno-marketplace-admin.netlify.app`
- **Database**: MongoDB Atlas - `mongodb+srv://...@junomarketplace.ci9sfz3.mongodb.net`
- **Image Storage**: Google Cloud Storage - `juno-marketplace-watches` bucket

⚠️ **CRITICAL**: Never hardcode these URLs - always verify current URLs with:
```bash
gcloud run services list --region=us-central1
```

### Development Environment
- Frontend runs on port 5173, backend on port 8001
- Admin app runs on port 5174 (separate Vite server)
- Vite proxy configuration handles API calls to backend
- Both frontend and backend need to be running for full functionality

### File Storage System
- **Production**: Google Cloud Storage with public URLs
- **Image URLs**: `https://storage.googleapis.com/juno-marketplace-watches/watchImages-{timestamp}.{ext}`
- **Upload Process**: Memory storage → Google Cloud Storage → Public URL in database

## Google Cloud Run Deployment Process

### PROVEN WORKING DEPLOYMENT METHOD (September 2025)

**Current Live Service URLs:**
- API: `https://api-53189232060.us-central1.run.app`
- Frontend: `https://frontend-53189232060.us-central1.run.app`

### STEP 1: Deploy API (Minimal with Buildpack)
```bash
# Use the proven minimal API configuration
export PATH=$PATH:~/google-cloud-sdk/bin
gcloud builds submit --config cloudbuild-simple-api.yaml . --timeout=900s
```

**Key API Files:**
- `cloudbuild-simple-api.yaml` - Buildpack deployment from api/ directory
- `api/index.js` - Only essential JunoPay auth routes enabled
- All other routers commented out to prevent route pattern errors

### STEP 2: Deploy Frontend (From dist/ Directory)
```bash
# Use the proven dist directory deployment
export PATH=$PATH:~/google-cloud-sdk/bin
gcloud builds submit --config cloudbuild-dist-frontend.yaml . --timeout=900s
```

**Key Frontend Files:**
- `cloudbuild-dist-frontend.yaml` - Deploys from dist/ directory only
- `dist/server.js` - Simple Express server serving static files on PORT
- `dist/package.json` - Clean dependencies (only Express)
- `.gcloudignore` - Excludes node_modules, api/, admin-app/ (reduces 275MB to 31MB)

### Critical Deployment Fixes Applied:

#### 1. Database Connection Issue FIXED
- `api/db/index.js` - No longer calls `process.exit(1)` on connection failure
- Uses retry logic with exponential backoff instead
- Server starts immediately, database connects after

#### 2. Route Pattern Errors FIXED
- Removed all malformed route patterns (`/*` → `*`)
- Disabled catch-all routes that caused path-to-regexp errors
- Commented out problematic router imports

#### 3. Upload Size Optimized
- Added `.gcloudignore` to exclude unnecessary files
- Frontend deployment reduced from 275MB to 31MB (89% reduction)
- Much faster deployments and builds

#### 4. Port Configuration FIXED
- Frontend uses simple Express server in dist/ directory
- Proper `PORT` environment variable handling
- No Docker complexity or nginx template issues

### Environment Variables (Set in Cloud Run)
```bash
# API Environment Variables
MONGODB_URI=mongodb+srv://paulmccarthy_db_user:***@junomarketplace.ci9sfz3.mongodb.net
JUNO_APPLICATION_ID=PaulsMarketplace-cafd2e7e
JUNO_SECRET_KEY=fd4b6008-f8c5-4c76-beae-8279bac9a91c
SESSION_SECRET=DfkdSLDQRvk9vHdJFiEyGLNGSSD7x+6OkzcB4PQZNYU=
NODE_ENV=production
CORS_ORIGINS=https://frontend-53189232060.us-central1.run.app
JUNO_REDIRECT_URI=https://api-53189232060.us-central1.run.app/auth/junopay/callback
JUNOPAY_AUTHORIZE_URL=https://stg.junomoney.org/oauth/authorize
JUNOPAY_TOKEN_URL=https://stg.junomoney.org/oauth/token
JUNOPAY_API_BASE_URL=https://stg.junomoney.org/restapi
FRONTEND_URL=https://frontend-53189232060.us-central1.run.app

# Frontend Environment Variables
VITE_API_URL=https://api-53189232060.us-central1.run.app
```

### Files Created for Working Deployment:
- `.gcloudignore` - Upload optimization
- `cloudbuild-simple-api.yaml` - Minimal API buildpack deployment
- `cloudbuild-dist-frontend.yaml` - Frontend from dist/ directory
- `dist/server.js` - Simple static file server
- `dist/package.json` - Clean frontend server dependencies

### DO NOT USE (Failed Approaches):
- ❌ `cloudbuild-frontend.yaml` - Docker approach with port issues
- ❌ `cloudbuild-simple-frontend.yaml` - Root directory deployment (monorepo conflicts)
- ❌ Deployment from root directory without .gcloudignore
- ❌ Complex nginx Docker configurations

### Environment Variables
- **Production API**: Environment variables set in `cloudbuild-api.yaml`
- **Frontend**: Build-time `VITE_API_URL` in `cloudbuild-frontend.yaml` and `Dockerfile.frontend`
- **Admin App**: Separate Netlify site with own environment configuration

### Admin App Deployment (Netlify)
```bash
# Admin app remains on Netlify for simpler management
cd admin-app
VITE_API_URL=https://api-xio7lz2d5a-uc.a.run.app pnpm build
netlify deploy --prod --dir=dist --site=b29d6f3c-4054-48b5-87ae-a08ba0b400ea
```

## Development Notes
- Admin functionality requires `is_admin` flag in user session
- Watch bidding system supports multiple bids per watch with comment threads
- Image display uses `getImageUrl()` helper to convert paths to full URLs
- Delete functionality allows users to delete their own watch listings
- Active bid protection prevents deletion of watches with pending bids

## Environment Setup
- **Local Development**: Copy `.env.example` to `.env.local`
- **Production**: Environment variables set in Google Cloud Run and Netlify
- **MongoDB**: Shared MongoDB Atlas cluster for all environments
- **CORS**: Configured to allow requests from both Netlify domains

## Key Features
- Watch marketplace with bidding system
- Admin dashboard for watch and user management (separate app)
- Juno OAuth integration for secure authentication
- Google Cloud Storage for reliable image hosting
- Delete functionality for user-owned watches
- Responsive design with Tailwind CSS
- Separate admin interface with enhanced management tools