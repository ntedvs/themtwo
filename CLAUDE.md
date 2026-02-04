# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package manager:** Use `bun` for all operations (not npm/yarn/pnpm).

```bash
bun run dev      # Start Vite dev server + Convex backend
bun run build    # Production build
bun run preview  # Preview production build
bun run lint     # Run ESLint
```

## Architecture Overview

**Stack:** React 19 + TypeScript + Vite + Convex (real-time backend) + @dnd-kit + Tailwind CSS 4

### Data Flow Architecture

This is a **real-time collaborative canvas** with client-side rendering and Convex backend:

1. **Convex Backend** (`/convex`) - Real-time serverless functions
   - `schema.ts`: Two tables - `people` (name, positionX, positionY) and `connections` (personAId, personBId, connectionType)
   - `people.ts`: CRUD operations - list, get, create, updatePosition, rename, remove
   - `connections.ts`: CRUD operations - list, getForPerson, create, remove
   - Connections have indexes on both `personAId` and `personBId` for efficient queries
   - When deleting a person, all associated connections are cascade deleted

2. **React Frontend** (`/src`)
   - `Canvas.tsx` - Root component wrapping everything in `DndContext`
   - Uses `useQuery` for reactive data (people, connections)
   - Uses `useMutation` for updates (updatePosition, rename, create, delete)
   - Drag-and-drop handled via @dnd-kit's `onDragEnd` event

3. **Component Hierarchy**
   ```
   Canvas (DndContext wrapper)
   ├── Toolbar (UI controls for adding people/connections)
   ├── ConnectionsLayer (SVG overlay for all connection lines)
   │   └── ConnectionLine (individual curved path between two people)
   └── PersonBox[] (draggable person nodes with @dnd-kit useDraggable)
   ```

### Key Patterns

- **Position updates**: Drag events calculate delta, add to current position, call `updatePosition` mutation
- **Name editing**: Double-click PersonBox to edit inline, debounced mutation on blur
- **Connection rendering**: ConnectionsLayer renders absolute-positioned SVG, ConnectionLine draws cubic bezier curves between person centers
- **Cascade deletes**: When removing a person, query both connection indexes and delete all matches before deleting person
- **Real-time sync**: All mutations trigger automatic re-queries via Convex reactivity - no manual refetching needed

## Convex Integration

- Convex functions auto-generate types in `convex/_generated/`
- Import API via `import { api } from "../../convex/_generated/api"`
- All queries/mutations are strongly typed with `v.id("people")` and `v.id("connections")`
- Development requires Convex backend running (started automatically with `bun run dev`)
