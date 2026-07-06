# `src/config`

## Purpose

Normalize environment variables and runtime settings for the app.

## Owns

- Environment schema and defaults
- Public vs server-only configuration boundaries

## Structure

- `env.ts`: server-side environment parsing

## Use This Folder When

- Adding an environment variable
- Normalizing deployment-specific configuration

## Do Not Put Here

- Feature flags that only one feature owns
- Database schema
- UI constants

## Extend / Update Checklist

- Validate new variables with Zod
- Keep secrets server-only
- Update `.env.example` when adding a required or optional variable
