# `src/styles`

## Purpose

Own global styling entry points and app-wide CSS imports.

## Owns

- Global Tailwind and shadcn CSS integration
- Vendor CSS imports that must apply app-wide

## Structure

- `fullcalendar.css`: small app-level FullCalendar sizing adjustments

## Use This Folder When

- A style needs to apply across routes
- A vendor stylesheet needs a single import point

## Do Not Put Here

- Feature-specific component styling
- shadcn component rewrites
- Theme customization beyond the native shadcn defaults

## Extend / Update Checklist

- Keep global selectors minimal
- Prefer component-local Tailwind classes for feature layout
- Document any new global CSS file here
