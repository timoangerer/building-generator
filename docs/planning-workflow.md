# Planning Workflow

Status: durable reference

## Purpose

This repo should separate enduring product context from change-specific planning.

Use the `docs/` folder for durable guidance that should remain true across many changes.

Use OpenSpec for work that is planned, active, under implementation, or newly archived.

## What Lives Where

### Durable reference docs

Use `docs/` for:

- product vision
- architectural principles
- verification strategy
- stable workflow guidance

These docs should stay short, stable, and useful as default agent context.

### Active or planned work

Use `openspec/changes/<change-name>/` for change-specific artifacts such as:

- `proposal.md` for why the change exists and what it should deliver
- `design.md` for the technical approach
- `tasks.md` for the implementation checklist
- `specs/<capability>/spec.md` for change-specific delta specs

### Stable current product behavior

Use `openspec/specs/<capability>/spec.md` for the current accepted behavior of the system after a change has been synced into main specs.

### Historical change record

Archive completed changes under:

`openspec/changes/archive/YYYY-MM-DD-<change-name>/`

Archived changes are the decision history for why the product evolved the way it did.

## Working Agreement

Do not turn `docs/product-vision.md` into a living backlog or PRD dump.

When work becomes concrete, move it into OpenSpec instead of expanding the high-level docs.

The intended flow is:

1. Use `docs/` to understand the product and architecture.
2. Create or continue an OpenSpec change for a concrete feature or refactor.
3. Implement against that change's proposal, specs, design, and tasks.
4. Sync approved delta specs into `openspec/specs/` when they represent the new stable state.
5. Archive the completed change.

## Current Repository State

This repo currently has `openspec/config.yaml`, but OpenSpec has not been fully initialized yet. That means there is not yet an active `openspec/changes/` tree or a populated `openspec/specs/` directory.

Treat the workflow described here as the target structure. Once OpenSpec is initialized, new work should follow it.
