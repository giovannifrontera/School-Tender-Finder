# replit.md

## Overview

School Tender Finder – Calabria is a full-stack web application designed to help users discover procurement tenders published by schools in the Calabria region of Italy. The application allows users to upload school datasets, filter by geographic criteria, and automatically scrape various platforms to find relevant procurement opportunities.

## System Architecture

### Overall Architecture
- **Monolithic Node.js Application**: Single-process architecture combining Express backend with Vite-powered React frontend
- **Development Stack**: Node.js 20, Express, React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Replit autoscale deployment

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express backend application  
├── shared/          # Shared schemas and types
├── migrations/      # Database migration files
└── attached_assets/ # Additional project resources
```

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application built with React 18 and TypeScript
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with optimized development and production builds

### Backend Architecture
- **Express Server**: RESTful API with Express.js
- **Database Layer**: Drizzle ORM with PostgreSQL (Neon serverless)
- **File Processing**: Multer for file uploads, CSV parsing capabilities
- **Web Scraping**: Axios and Cheerio for extracting tender data from school websites
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Data Models
```typescript
// Schools table - stores educational institution data
schools: {
  id, codiceMeccanografico, denominazioneScuola,
  codiceIstitutoRiferimento, denominazioneIstitutoRiferimento,
  indirizzoEmail, sitoWeb, indirizzo, cap, comune,
  provincia, regione, areaGeografica, tipoIstituto,
  detectedPlatforms: string[]
}

// Tenders table - stores procurement opportunities
tenders: {
  id, schoolId, title, excerpt, deadline, type,
  platform, pdfUrl, sourceUrl, hash, createdAt
}

// Scan sessions - tracks scraping operations
scanSessions: {
  id, status, totalSchools, completedSchools,
  totalTenders, startedAt, completedAt, progress
}
```

## Data Flow

### File Upload Process
1. User uploads CSV/JSON file containing school data
2. Backend processes and validates file format
3. School records are bulk inserted into PostgreSQL
4. Geographic data is extracted for filtering interface
5. Frontend updates with available schools and filter options

### Tender Scanning Process
1. User selects schools and initiates scan
2. System creates scan session with tracking metadata
3. Background process iterates through selected schools
4. Multiple scraping strategies applied per school:
   - Official .edu.it website parsing
   - Platform-specific scrapers (Axios, Argo, Spaggiari, Net4Market)
5. Extracted tenders are deduplicated and stored
6. Real-time progress updates via polling
7. Results displayed in filterable table interface

### Platform Detection Strategy
The system automatically detects which platforms each school uses:
- **Axios Platform**: trasparenzascuole.it integration
- **Argo Platform**: portaleargo.it integration  
- **Spaggiari Platform**: web.spaggiari.eu integration
- **Net4Market Platform**: *.net4market.com integration
- **Generic Scraping**: Direct .edu.it domain parsing

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe SQL query builder
- **express**: Web application framework
- **axios**: HTTP client for API requests and scraping
- **cheerio**: Server-side HTML parsing and manipulation
- **multer**: Multipart form data handling
- **csv-parser**: CSV file processing

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Minimalist routing for React

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Dev Server**: Vite development server with HMR
- **Database**: Automatically provisioned PostgreSQL instance
- **Port Configuration**: Development on port 5000, external port 80

### Production Deployment
- **Target**: Replit autoscale deployment
- **Build Process**: 
  1. `npm run build` - Vite builds client to `dist/public`
  2. esbuild bundles server code to `dist/index.js`
- **Runtime**: Single Node.js process serving both API and static files
- **Database**: Production PostgreSQL with connection pooling

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)

## Changelog
```
Changelog:
- June 20, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```