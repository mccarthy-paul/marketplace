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

## Development Notes
- Frontend runs on port 5173, backend on port 8001
- Vite proxy configuration handles API calls to backend
- File uploads stored in `public/uploads/watches/`
- Admin functionality requires `is_admin` flag in user session
- Watch bidding system supports multiple bids per watch with comment threads

## Environment Setup
- Copy `.env.example` to `.env.local` and configure Juno client credentials
- Ensure MongoDB is running and accessible
- Both frontend and backend need to be running for full functionality

## Key Features
- Watch marketplace with bidding system
- Admin dashboard for watch and user management
- Juno OAuth integration for secure authentication
- Image upload for watch listings
- Responsive design with Tailwind CSS