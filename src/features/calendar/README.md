# `src/features/calendar`

## Purpose

Own absence calendar rendering and FullCalendar range normalization.

## Owns

- Month/week absence calendar UI
- FullCalendar start-inclusive and end-exclusive date handling
- Calendar-specific forms and event mapping

## Structure

- `absence-calendar.tsx`: client calendar component

## Use This Folder When

- Changing absence range interactions
- Adding calendar views
- Integrating future scheduler/timeline behavior

## Do Not Put Here

- Bill allocation formulas
- Payment status updates
- Auth provider setup

## Extend / Update Checklist

- Keep all-day ranges as local dates
- Preserve FullCalendar exclusive-end semantics
- Avoid paid timeline/resource plugins unless explicitly scoped
