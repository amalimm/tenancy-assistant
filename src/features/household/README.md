# `src/features/household`

## Purpose

Own household and tenant management behavior.

## Owns

- Household setup flow
- Tenant registration by admin-created email
- Tenancy period display and validation helpers

## Structure

- UI and services can be added here when household workflows outgrow the
  dashboard route.

## Use This Folder When

- Adding tenant profile fields
- Changing household setup
- Changing tenancy start/end rules

## Do Not Put Here

- Billing allocation formulas
- Calendar rendering
- Auth provider configuration

## Extend / Update Checklist

- Keep tenant accounts admin-created by email
- Preserve email uniqueness per household
- Add tests for tenancy-period rules when they change
