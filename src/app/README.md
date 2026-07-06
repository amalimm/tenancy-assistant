# `src/app`

## Purpose

Own Next.js App Router routes, layouts, route handlers, and server-action entry
points.

## Owns

- Pages and layouts
- Auth route handlers
- Thin server actions that delegate domain work to feature services

## Structure

- `(app)/`: authenticated product routes
- `api/`: HTTP route handlers
- `globals.css`: global Tailwind and shadcn CSS entry
- `layout.tsx`: root HTML shell
- `page.tsx`: public landing/sign-in entry

## Use This Folder When

- Adding or changing a URL
- Connecting a page to feature services
- Creating an HTTP route handler

## Do Not Put Here

- Business rules that belong in `features/`
- Database schema or low-level query helpers
- Reusable UI primitives that belong in `shared/`

## Extend / Update Checklist

- Keep pages thin and move domain behavior to features
- Keep server actions close to the page that submits them unless shared by
  multiple routes
- Update this README when route groups or ownership changes
