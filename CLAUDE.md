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
- **Backend API**: Google Cloud Run - `https://api-53189232060.us-central1.run.app`
- **Main Frontend**: Netlify - `https://juno-marketplace.netlify.app`
- **Admin Frontend**: Netlify - `https://juno-marketplace-admin.netlify.app`
- **Database**: MongoDB Atlas - `mongodb+srv://...@junomarketplace.ci9sfz3.mongodb.net`
- **Image Storage**: Google Cloud Storage - `juno-marketplace-watches` bucket

### Development Environment
- Frontend runs on port 5173, backend on port 8001
- Admin app runs on port 5174 (separate Vite server)
- Vite proxy configuration handles API calls to backend
- Both frontend and backend need to be running for full functionality

### File Storage System
- **Production**: Google Cloud Storage with public URLs
- **Image URLs**: `https://storage.googleapis.com/juno-marketplace-watches/watchImages-{timestamp}.{ext}`
- **Upload Process**: Memory storage → Google Cloud Storage → Public URL in database

## Deployment Commands

### Deploy to Google Cloud Run (Backend only)
```bash
./deploy.sh  # Deploys API, Frontend, and Admin to Google Cloud Run
```

### Deploy to Netlify (Current setup)
```bash
# Frontend deployment (automatic via Git)
git push origin main

# Admin app deployment (automatic via Git)
cd admin-app && git push origin main
```

### Environment Variables
- **Production API**: Uses `.env.production` with Cloud Run environment variables
- **Netlify Frontend**: Uses build-time `VITE_API_URL` environment variable
- **Admin App**: Separate Netlify site with own environment configuration

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