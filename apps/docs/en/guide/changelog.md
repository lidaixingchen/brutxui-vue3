---
title: Changelog
description: BrutxUI version release history.
translated: true
---

# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and version numbers follow [Semantic Versioning](https://semver.org/).

For the full changelog, see [CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md) on GitHub.

---

## Latest Version

### [0.8.1] - 2026-06-30

#### Refactoring

- **Compatibility audit fixes**: ~30 fixes across 5 major categories
  - defaultValue/defaultXxx dual-mode fixes (8 items)
  - Naming inconsistency fixes (6 items)
  - Dead code cleanup (10 items)
  - Type and TS side-effect fixes (8 items)
  - CVA empty variant value cleanup (3 items)
- **Full-component compatibility cleanup**: cleared ~96 compatibility issues across 12 categories
- **Component deep-dive enhancements**: 8 batches of comprehensive changes
  - Accessibility compliance and motion degradation
  - Variant implementation and API consistency
  - Component feature enhancements
  - Programmatic control exposure
  - Composable extraction

#### Documentation

- Updated all component documentation with complete props, events, and slots descriptions

#### Bug Fixes

- Fixed CI test failures in 5 components
- Fixed demo overflow and container ratio issues in multiple components
- Fixed specific issues in Slider, KanbanBoard, ChatBubble, and other components

---

## Historical Version Summary

| Version | Date | Key Changes |
| --- | --- | --- |
| 0.8.0 | 2026-06-29 | Icon size system, multi-component enhancements, CLI security hardening |
| 0.7.8 | 2026-06-28 | DataTable composable, GlitchButton/GlitchText direction control |
| 0.7.5 | 2026-06-27 | GlitchButton, VirtualScroll components |
| 0.7.4 | 2026-06-27 | TreeSelect, TypewriterText, NoiseBackground components |
| 0.7.2 | 2026-06-26 | ColorPicker, DatePicker components |
| 0.7.0 | 2026-06-26 | Warm theme, DataTable, Theme Playground, CLI enhancements |

---

::: tip
For the full changelog, see [CHANGELOG.md](https://github.com/lidaixingchen/brutxui-vue3/blob/main/CHANGELOG.md)
:::
