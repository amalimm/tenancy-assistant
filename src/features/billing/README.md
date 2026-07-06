# `src/features/billing`

## Purpose

Own electricity billing cycles, allocation calculation, bill uploads, and
allocation summaries.

## Owns

- Present-day proportion calculation
- Billing-cycle validation
- Allocation and payment summary UI

## Structure

- `allocation.ts`: pure bill allocation logic
- `allocation.test.ts`: unit coverage for the calculation contract

## Use This Folder When

- Changing how a bill is split
- Adding billing-cycle edge cases
- Adding bill upload or allocation screens

## Do Not Put Here

- Calendar rendering
- Auth role definitions
- Generic date utilities that multiple features need

## Extend / Update Checklist

- Add tests for every calculation rule change
- Keep local-date math start-inclusive and end-exclusive
- Keep persisted allocation output reproducible
