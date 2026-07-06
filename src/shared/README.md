# `src/shared`

## Purpose

Own reusable cross-cutting code that is not tied to one tenancy feature.

## Owns

- Shared UI primitives and layout helpers
- Generic utilities
- Cross-feature type helpers

## Structure

- `lib/`: framework-neutral utilities
- `ui/`: shadcn/ui components and shared app UI

## Use This Folder When

- A helper or component is reused by multiple features
- Code has no dependency on feature ownership

## Do Not Put Here

- Feature-specific domain logic
- Imports from `@features/**`
- Server secrets or environment parsing

## Extend / Update Checklist

- Keep shared code dependency-light
- Prefer explicit imports over barrels for heavy modules
- Keep shadcn-generated components uncustomized unless explicitly requested
