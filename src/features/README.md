# `src/features`

## Purpose

Own vertical business domains for tenancy workflows.

## Owns

- Feature services and policies
- Feature-specific UI composition
- Domain calculations and validation

## Structure

- `auth/`: authentication helpers and authorization abilities
- `household/`: household and tenant management
- `billing/`: bill cycles, allocation, uploads, and payment summaries
- `calendar/`: absence calendar UI and range normalization
- `payments/`: payment state and payment actions

## Use This Folder When

- Adding a user-facing tenancy capability
- Implementing domain rules
- Creating feature-specific components

## Do Not Put Here

- Cross-cutting shared primitives
- Raw environment parsing
- Generic database client setup

## Extend / Update Checklist

- Do not import sibling features from a feature folder
- Move shared contracts to `shared/` when multiple features need them
- Add a local README for each new feature folder
