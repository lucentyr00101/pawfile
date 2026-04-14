# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is PawFile?

PawFile is a pet profile and health tracker for pet owners. It lets users create profiles for their pets and keep all health-related information in one place — vet visits, vaccinations, medications, grooming, and reminders — without digging through photos or forgetting appointment dates.

**Core features (MVP):** user auth, pet profiles (name, breed, species, birthday, weight, photo), health records (vet visits, vaccinations, medications), a chronological timeline view per pet, and a basic in-app reminder system.

**Monetization model:** free tier (up to 2 pets), premium tier (~99–149 PHP/month) for unlimited pets, file uploads, reminders, PDF export, and family sharing.

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run generate     # Static site generation
bun run preview      # Preview production build
bun run lint         # Run ESLint (via @nuxt/eslint)
```

> The project uses **bun** as the package manager (see `bun.lock`).

## Environment

Copy `.env.example` to `.env` and fill in:
- `MONGODB_URI` — MongoDB Atlas connection string (required for all server routes)

## Architecture

PawFile is a **Nuxt 4** app (files live under `app/`) backed by a **Nitro** server layer. The frontend and API live in the same repo; there is no separate backend service.

**Key boundaries:**
- `app/` — Vue/Nuxt frontend (pages, components, layouts, composables)
- `server/api/` — Nitro API routes; file name encodes method (e.g. `index.post.ts`, `[id].get.ts`)
- `server/models/` — Mongoose schemas (source of truth for data shape)
- `server/services/` — Business logic called by API routes
- `server/utils/db.ts` — Singleton Mongoose connection; call `connectDB()` at the top of every server route that touches the database

**Data flow:** API routes → services → Mongoose models → MongoDB Atlas.

**Auth** is not yet implemented (TBD between Nuxt Auth Utils and Clerk).

## Design System

For ANY frontend work: always invoke the `ui-ux-pro-max` skill and refer to `DESIGN.md` for design concepts and reference. Colors are provided in the Nuxt UI config file.

The design uses a Sentry-inspired dark-purple aesthetic:
- **Tailwind utilities** map directly to the custom palette defined in `assets/css/main.css`
- **Semantic color roles** (`primary`, `secondary`, `tertiary`, `neutral`) are configured in `app/app.config.ts` and registered in `nuxt.config.ts` under `ui.theme.colors`
- Use `primary` (Sentry Purple) for interactive elements, `secondary` (Muted Purple) for button backgrounds, `tertiary` (Lime Green) for high-visibility accents — sparingly, one per section max
- Never use pure black (`#000000`) for backgrounds; always use the warm purple-blacks from the palette

## Nuxt UI v4

Components come from `@nuxt/ui` v4. The root `app.vue` must wrap everything in `<UApp>` — without it, the theme and color system won't apply. Color props on components (e.g. `color="primary"`) resolve through the semantic aliases in `app/app.config.ts`. Custom single-value design tokens (e.g. `bg-coral`, `border-border-dark`) are available as Tailwind utilities from `@theme static` in `app/assets/css/main.css`.
