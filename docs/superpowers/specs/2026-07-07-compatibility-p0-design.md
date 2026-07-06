# P0 Compatibility Batch Design

Date: 2026-07-07

## Scope

This batch addresses the highest-risk compatibility items from `docs/review/compatibility-legacy-review-2026-07-07.md` without changing public component APIs.

## Changes

1. Align the UI package `prepack` script with `build` so published packages include `dist/preflight.css`.
2. Add shared environment capability helpers in `packages/ui/src/lib/env.ts` for document body, IntersectionObserver, and AudioContext detection.
3. Make lazy images load normally when IntersectionObserver is unavailable.
4. Make InfiniteScroll and `useInfiniteScroll` fall back to a conservative one-time load trigger when IntersectionObserver is unavailable.
5. Make `useAudioEngine` tolerate missing or blocked Web Audio APIs, including Safari `webkitAudioContext`.
6. Make functional dialog APIs return inert handles when no document body is available.

## Non-Goals

- No registry legacy metadata in this batch.
- No package exports generation in this batch.
- No broad release gate or full test run.

## Verification

Run focused checks only:

- `pnpm --filter brutx-ui-vue test packages/ui/src/composables/useAudioEngine.test.ts`
- Typecheck or additional narrow tests only if the changed files require it.
