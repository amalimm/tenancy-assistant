# Occupancy Legend Header Design

## Goal

Move the Tenant Calendar status legend from below the occupancy grid to the
top-right header area and reduce visual clutter around the table.

## Design

- Allow `DashboardPanel` metadata to accept React content as well as text.
- Group `Next 14 days` with a compact, labelled status legend in the panel's
  existing top-right metadata position.
- Keep the three semantic states and their current colors unchanged.
- Use smaller swatches and tighter spacing in the header.
- Let the date range and legend stack while remaining right-aligned on narrow
  screens.
- Remove the footer legend row so the grid ends cleanly after tenant data.

## Verification

- Add a component test proving the labelled legend is contained in the same
  header row as the Tenant Calendar heading.
- Run the focused dashboard test, full test suite, type checking, and linting.
- Leave the development server listening on port 4000 for visual review.
