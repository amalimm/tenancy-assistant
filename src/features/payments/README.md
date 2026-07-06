# `src/features/payments`

## Purpose

Own payment status, payment notes, and payment reconciliation behavior.

## Owns

- Payment state transitions
- Payment status display
- Payment action validation

## Structure

- UI and services can be added here when payment workflows outgrow the
  dashboard route.

## Use This Folder When

- Adding proof-of-payment uploads
- Changing paid/partial/unpaid behavior
- Adding payment reminders

## Do Not Put Here

- Bill allocation formulas
- Calendar range normalization
- Auth provider setup

## Extend / Update Checklist

- Keep payment amounts in cents
- Preserve allocation-line linkage
- Add tests when payment status rules change
