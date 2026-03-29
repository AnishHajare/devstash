# Sidebar Pro Badge Spec

## Overview

Add a "Pro" badge next to the File and Image item types in the sidebar to indicate they are Pro-only features.

## Requirements

- Add a small "Pro" badge next to the File and Image types in the sidebar item type list
- Use shadcn/ui `Badge` component (install if not already available)
- Badge should be visually subtle — small, secondary/outline variant, not distracting
- Only show the badge on item types where `isSystem` is true and the type name is "file" or "image"
- Badge should not interfere with the existing icon, label, and count layout

## References

- @src/components/dashboard/sidebar-content.tsx
- @context/project-overview.md (item types table — File and Image are Pro only)
