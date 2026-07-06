# `src/db`

## Purpose

Own the database client, Drizzle schema, and persistence contracts.

## Owns

- Turso/libSQL client setup
- Drizzle table definitions and relations
- Shared database helpers

## Structure

- `client.ts`: libSQL and Drizzle client
- `schema.ts`: database schema

## Use This Folder When

- Adding or changing persisted tables
- Creating cross-feature query helpers
- Updating migration-related types

## Do Not Put Here

- Page actions
- UI state
- Domain calculations that do not need database access

## Extend / Update Checklist

- Keep schema names explicit and stable
- Generate migrations after schema changes
- Keep feature-specific write flows in feature services
