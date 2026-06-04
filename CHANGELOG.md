# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Upgraded TypeScript from 5.9.3 to 6.0.3
- Upgraded Vite from 7.3.5 to 8.0.16
- Upgraded pnpm from 9.15.4 to 11.5.1
- Upgraded jsdom from 26.1.0 to 29.1.1
- Upgraded commander from 13.1.0 to 15.0.0
- Upgraded @types/node from 22.19.19 to 25.9.1
- Upgraded vee-validate from 4.0.0 to 4.15.1
- Updated Node.js minimum version requirement from 18 to 22.5 (pnpm 11.x requires `node:sqlite`)
- Updated Tailwind CSS configuration to use Vite plugin instead of PostCSS
- Updated `@tailwind` directives to `@import 'tailwindcss'` syntax

### Fixed

- Fixed TypeScript 6 compatibility: changed `moduleResolution` from `"Node"` to `"bundler"` in shared and registry tsconfigs
- Fixed TypeScript 6 compatibility: removed deprecated `baseUrl` option from ui tsconfig
- Added `optionalDependencies` field to `ComponentMeta` interface
- Added CSS module type declaration file (`css.d.ts`)
- Fixed `emblaRef` template reference type error in Carousel component
- Fixed jsdom 29 compatibility: updated tests to use `dispatchEvent` instead of `trigger` for MouseEvent properties
- Fixed Lucide icon import: replaced removed `Github` icon with inline SVG
- Fixed VitePress build: updated to use `@tailwindcss/vite` plugin

### Added

- Added Node.js and pnpm version badges to README
- Added CHANGELOG.md

## [0.5.7] - 2026-06-03

### Previous release

See git history for changes prior to this version.
