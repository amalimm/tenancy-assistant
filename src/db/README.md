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

## Local Seed Data

Run `npm run db:setup` to apply pending migrations and add deterministic
dashboard demo data. The seed targets the only active non-E2E admin household.
Set `SEED_HOUSEHOLD_ID` when the database contains more than one eligible
household. Re-running the seed updates its own records without duplicating them.
