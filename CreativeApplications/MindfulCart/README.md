# Overview

MindfulCart is a React-based web application designed to help users practice mindful consumption by tracking items they want to purchase and implementing a spaced repetition review system. The application encourages users to pause before making purchases by scheduling periodic reviews of saved items, helping them make more intentional buying decisions. Users can organize items into folders, set custom review schedules, and leverage AI-powered features for price tracking and product alternatives.

**Key Feature Update**: The application now includes a comprehensive archive system with positive messaging that celebrates sustainable consumption decisions. When items are deleted or archived during review cycles, they are moved to an "Archives" section with celebratory messaging about mindful spending choices. The "money saved" metric is calculated based on archived items that users decided NOT to purchase, creating positive reinforcement for thoughtful decision-making.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 and TypeScript, using Vite as the build tool. The UI is constructed with shadcn/ui components based on Radix UI primitives and styled with Tailwind CSS. The application follows a component-based architecture with:

- **Routing**: Uses wouter for client-side routing with pages for dashboard, archive, and not-found states
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **Component Library**: Comprehensive UI component system built on Radix UI primitives

## Backend Architecture
The backend is an Express.js server with TypeScript, following a layered architecture:

- **API Layer**: RESTful endpoints organized in route handlers for folders, items, reviews, and custom questions
- **Service Layer**: Separated business logic into services (AI service for price analysis, scheduler service for automated reviews)
- **Storage Layer**: Abstract storage interface allowing for different storage implementations
- **Middleware**: Request logging, error handling, and JSON parsing

## Data Storage
The application uses Drizzle ORM with PostgreSQL as the primary database:

- **Schema Design**: Normalized tables for folders, items, reviews, custom questions, and achievements
- **Database Dialect**: PostgreSQL with UUID primary keys and JSONB fields for flexible data storage
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Connection**: Neon Database serverless PostgreSQL connection

## Review System Architecture
Implements a spaced repetition system for item reviews:

- **Scheduling**: Configurable review intervals (1 day, 1 week, 1 month, 3 months, 6 months, 1 year)
- **Automation**: Background scheduler service checks for due reviews and triggers notifications
- **Decision Tracking**: Records user decisions (keep, archive, purchase) with reasoning
- **Progress Tracking**: Visual progress indicators showing completion status

## AI Integration
OpenAI GPT-4 integration for intelligent features:

- **Price Analysis**: Monitors price changes and trends for tracked items
- **Product Alternatives**: Suggests similar products at different price points
- **Sustainability Analysis**: Optional environmental impact assessment
- **Automated Updates**: Scheduled AI analysis updates for active items

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with hooks and modern features
- **Express.js**: Node.js web framework for the backend API
- **TypeScript**: Type safety across the entire application stack
- **Vite**: Fast build tool and development server

## Database and ORM
- **Drizzle ORM**: Type-safe SQL query builder and schema management
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component library
- **shadcn/ui**: Pre-built component system based on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating variant-based component APIs

## State Management and Data Fetching
- **TanStack Query**: Server state management with caching and background updates
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for forms and API data

## External Services
- **OpenAI API**: GPT-4 integration for price analysis and product recommendations
- **Replit Services**: Development environment integration with runtime error overlay and cartographer

## Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS plugin
- **date-fns**: Date utility library for formatting and calculations
- **tsx**: TypeScript execution for development server

## Session and Security
- **Express Sessions**: User session management
- **PostgreSQL Session Store**: Persistent session storage
- **CORS Handling**: Cross-origin request configuration
