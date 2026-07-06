# `src`

## Purpose

Define the application source root, its top-level layering, and the entry
points that compose the runtime application.

## Owns

- App Router entry points and route handlers
- The top-level folder map for all runtime source code
- Layering guidance for `app/`, `config/`, `db/`, `features/`, `shared/`, and
  `styles/`

## Structure

- `app/`: Next.js App Router pages, layouts, and route handlers
- `components/`: shadcn/ui generated components in the native CLI location
- `config/`: environment parsing and runtime configuration
- `db/`: Drizzle client, schema, and database-facing repositories
- `features/`: vertical business domains
- `lib/`: shadcn-generated utility helpers
- `shared/`: reusable cross-cutting UI, utilities, and primitives
- `styles/`: global styles owned by the application shell

## Use This Folder When

- You need the top-level map of the application source tree
- You are deciding which top-level layer should own a new file or subsystem
- You are tracing how the app is composed from entry points down into features
  and shared code

## Do Not Put Here

- New domain logic directly in the `src/` root unless it is a real app entry
  point or composition root
- Generic helper modules that should live in a top-level layer folder
- Feature, layout, or shared implementation files that bypass their owning
  folder

## Extend / Update Checklist

- Keep the `src/` root shallow; prefer new code in an owning top-level folder
- Add a local `README.md` for every new top-level folder under `src/`
- Update this README when the source-root folder map or entry points change
- Update the relevant child folder README when ownership moves within the tree
