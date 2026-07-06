# `src/components`

## Purpose

Own shadcn/ui generated components in the native CLI location.

## Owns

- `ui/`: shadcn-generated primitives

## Structure

- `ui/`: component files created by `npx shadcn add`

## Use This Folder When

- Adding a shadcn component with the native CLI
- Importing reusable UI primitives from `@/components/ui/*`

## Do Not Put Here

- Feature-specific UI composition
- Hand-rolled replacements for shadcn primitives

## Extend / Update Checklist

- Use `npx shadcn@latest add <component>` for new primitives
- Keep generated primitives uncustomized unless explicitly requested
- Document non-shadcn additions before adding them here
