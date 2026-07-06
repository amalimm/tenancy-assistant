# `src/features/auth`

## Purpose

Own authentication, session lookup, role assignment, and authorization ability
creation.

## Owns

- Better Auth server configuration
- Better Auth browser client
- CASL app abilities for admin and tenant roles
- Session helpers used by pages and server actions

## Structure

- `auth-client.ts`: browser Better Auth client
- `auth-server.ts`: server Better Auth setup and session helpers
- `permissions.ts`: CASL ability definitions
- `sign-in-button.tsx`: Google sign-in/sign-out controls

## Use This Folder When

- Adding an auth provider
- Changing role bootstrap rules
- Adding or changing app permissions

## Do Not Put Here

- Household-specific queries
- Billing calculations
- Calendar UI

## Extend / Update Checklist

- Keep secrets inside server-only files
- Update tests when roles or abilities change
- Keep account creation admin-managed by email
