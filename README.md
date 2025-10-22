# HabitFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v22.14.0-green.svg)](https://nodejs.org/)

A progressive web app (PWA) for building and tracking habits with robust offline support, quantitative tracking, weekly goals, accessibility features, data exports, and GDPR compliance.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

HabitFlow is a user-friendly PWA designed to help individuals build and maintain habits across multiple devices, even offline. It emphasizes reliability with features like quantitative habit tracking (e.g., 2L water intake or 10k steps), weekly X/week goals with micro-coaching and risk assessment nudges, accessible heatmaps (WCAG 2.1 AA compliant, including high-contrast and color-blind modes), seamless synchronization using IndexedDB and Last-Write-Wins (LWW) conflict resolution, data exports in CSV format, and full GDPR compliance including Data Subject Access Requests (DSAR), Right to Erasure (RTBF), and privacy policies.

The MVP focuses on core functionalities such as creating, editing, and archiving habits; check-ins with portioned quantitative entries; offline queue with idempotent commands and exponential backoff; tag-based filtering; trash/undo mechanisms (7-day retention); daily reminder digests; read-only ICS feeds for calendar integration; and private read-only API v0 with Personal Access Tokens (PAT). It supports Free and Pro plans with limits on exports, ICS feeds, and PATs.

Built for simplicity and privacy, HabitFlow addresses common pain points like cross-device sync issues, intrusive notifications, and data portability while ensuring high performance (e.g., Lighthouse PWA score ≥90) and accessibility.

For detailed requirements, see the internal [Product Requirements Document (PRD)](.ai/prd.md).

## Tech Stack

### Frontend
- **Astro 5**: For fast, content-focused static sites with minimal JavaScript.
- **React 19**: For interactive components where dynamic behavior is needed.
- **TypeScript 5**: For type-safe development and better IDE support.
- **Tailwind CSS 4**: Utility-first CSS framework for rapid, responsive styling.
- **Shadcn/ui**: Accessible, customizable React components built on Radix UI and Tailwind.

### Backend
- **Supabase**: Open-source Firebase alternative providing PostgreSQL database, authentication (magic links, OAuth), real-time subscriptions, and Edge Functions. Handles Row Level Security (RLS), rate limiting, and at-rest encryption.

### CI/CD and Hosting
- **GitHub Actions**: For automated CI/CD pipelines including linting, testing, and builds.
- **AWS or Vercel**: For deployment, utilizing Docker images for containerized hosting.

Key dependencies include Astro integrations for React and Node, Lucide React for icons, and ESLint/Prettier for code quality.

## Getting Started Locally

To set up and run HabitFlow locally:

1. **Prerequisites**:
   - Node.js v22.14.0 (use [NVM](https://github.com/nvm-sh/nvm) to manage versions: `nvm use` after installing).
   - Git.
   - A Supabase account (free tier sufficient for development). Create a project and note your project's URL and anon key.

2. **Clone the Repository**:
   ```
   git clone https://github.com/your-username/habitflow.git
   cd habitflow
   ```

3. **Install Dependencies**:
   ```
   npm install
   ```

4. **Environment Setup**:
   - Copy `.env.example` to `.env.local` (create if missing based on needs).
   - Add Supabase credentials:
     ```
     PUBLIC_SUPABASE_URL=your_supabase_url
     PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
     ```
   - For development, ensure your Supabase project has the required tables (profiles, habits, checkins, etc.) set up via migrations or SQL editor.

5. **Run the Development Server**:
   ```
   npm run dev
   ```
   The app will be available at `http://localhost:4321`. It supports hot-reloading for Astro and React components.

6. **Build for Production**:
   Follow the build script below and deploy to Vercel/AWS.

Note: The project structure follows Astro conventions:
- `src/pages/`: Route-based pages.
- `src/components/`: Reusable UI components (Astro and React).
- `src/lib/`: Utilities and services.
- `src/db/`: Supabase clients (to be added).
- `public/`: Static assets.

For full setup, refer to Astro docs: [Astro Getting Started](https://docs.astro.build/en/getting-started/).

## Available Scripts

In the project root, run the following npm scripts:

- `npm run dev`: Start the development server with hot-reloading (Astro dev mode).
- `npm run build`: Build the project for production (outputs to `dist/`).
- `npm run preview`: Preview the production build locally.
- `npm run astro`: Run Astro CLI commands (e.g., `npm run astro check` for type-checking).
- `npm run lint`: Run ESLint to check code for errors and style issues.
- `npm run lint:fix`: Run ESLint and automatically fix issues.
- `npm run format`: Run Prettier to format code (TS/TSX/Astro/JSON/CSS/MD files).

Linting is hooked into Git via Husky and lint-staged for pre-commit checks.

## Project Scope

### MVP Features
- **Habit Management**: Binary/quantitative habits (units: ml, m, s, count) with daily/weekly/X-per-week frequencies, tags (max 3, with aliases), and backfill editing (≤3 days).
- **Tracking & Sync**: Check-ins with batching/compression, offline queue (IndexedDB, FIFO, retries), LWW conflict resolution, and status banners.
- **Stats & Visualization**: Heatmaps with a11y (keyboard nav, aria-live), weekly progress bars, risk nudges for X/week goals.
- **Data Handling**: CSV exports/imports (v2 schema, fuzzy matching, undo), trash with 7-day restore, DSAR process (ZIP packs, RESUME mechanism).
- **Integrations**: Read-only ICS feeds (rotatable tokens), private API v0 (PAT with scopes, rate limits).
- **UX & Accessibility**: PWA installable, focus mode, reduced motion, shortcuts (desktop), WCAG 2.1 AA, multi-language (PL/EN).
- **Privacy & Security**: RLS on Supabase tables, re-auth for sensitive actions, quiet hours for reminders, audit logs.
- **Plans**: Free (limited exports/ICS/PAT) vs. Pro (extended limits, priority queues).

### Out of Scope for MVP
- Bidirectional calendar sync (ICS read-only).
- Native integrations (e.g., Health/Fitbit).
- Mutating public API in v0.
- App-level field encryption (stage 2).
- AI coaching (beta flag).

Future phases include Pro plan enhancements and advanced analytics. See [PRD](.ai/prd.md) for 27+ user stories and success metrics (e.g., D7 retention, p95 render ≤1.5s).

## Project Status

This project is in early development (v0.0.1). The repository is initialized with core Astro setup, but many features from the MVP (e.g., Supabase integration, offline queue, UI components) are yet to be implemented. Currently on the `master` branch, with untracked files including config and source code. Contributions welcome via issues/pull requests. Active focus: Onboarding, habit CRUD, and offline basics.

Track progress in [user stories](.ai/prd.md#5-historyjki-użytkowników). For bugs or features, open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Note: Create a `LICENSE` file if not present.)
