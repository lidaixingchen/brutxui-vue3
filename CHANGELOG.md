# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.3] - 2026-06-06

### Fixed

- Comprehensive bug fixes across 40+ components:
  - Fixed controlled/uncontrolled mode conflicts in Checkbox, Switch, Toggle
  - Added IME composition event handling in Input for CJK input methods
  - Fixed async race condition in CodeBlock when rapidly switching languages
  - Fixed canvas interaction blocking after reveal in ScratchCard
  - Fixed canvas progress reset on resize in useCanvasInteraction composable
  - Added missing event binding for AuthCard register button
  - Removed duplicate title/description rendering in FeedbackForm
  - Replaced fragile DOM traversal with component event in OverviewPage
  - Fixed Ref object boolean check in CopyToClipboard (`isSupported.value`)
  - Fixed drag-and-drop visual flickering in KanbanBoard
  - Added accessibility improvements: aria-label for Combobox/Slider, aria-busy for Skeleton/SubmitButton, keyboard navigation for TreeView
  - Exposed missing props: disabled for SelectTrigger, name/disabled/orientation for RadioGroup, ariaLabel for Slider
  - Added v-model visibility control and transition animation to CookieConsent
  - Converted Calendar styles to scoped with :deep() penetration
  - Added Pagination currentPage boundary validation
  - Fixed ChatBubble initials calculation for multi-word names
  - Fixed DataTableSection v-for key using row index
  - Added FooterSection href support (renders as <a> when href exists)
  - Added TabsNav modelValue prop for controlled mode
  - Fixed StepperSection slot conflict with built-in components
  - Added CardTitle dynamic tag support via `as` prop
  - Removed dead code `stepperItemVariants` from stepper
  - Added Marquee inert attribute to duplicate slot
  - Added BeforeAfter range input aria-label with i18n support
  - Fixed QuickActions v-for key using action label
  - Added Carousel scrollSnaps empty array guard
  - Removed GlitchText unnecessary onUpdated lifecycle hook
  - Added pointer capture to useCanvasInteraction for drag-out-of-bounds
  - Fixed SettingsPage TabsRoot v-model/default-value conflict
  - Fixed DashboardStats neutral trend icon and color
  - Fixed Form initialValues reactivity with watch
  - Removed Form double type assertion
  - Removed FormControl redundant optional chaining
  - Fixed Slider to render multiple thumbs matching modelValue length
  - Fixed HardcoreInput FormField value sync and duplicate dispose
  - Added Button asChild disabled pointer-events-none
  - Added dynamic Loader2 icon size based on Button size prop
  - Changed Badge root element from div to span
  - Added Checkbox indeterminate state support in emit type
  - Removed Input placeholder auto-fallback to i18n text

## [0.5.7] - 2026-06-03

### Previous release

See git history for changes prior to this version.
