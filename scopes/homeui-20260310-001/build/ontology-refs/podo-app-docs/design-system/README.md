# Design System Documentation

> RAG-optimized comprehensive documentation for Podo design system packages

**Keywords:** design-system, design-token, component-library, react, tailwindcss, storybook, podo, ui-components, design-tokens, css-variables, semantic-tokens, scale-tokens, static-tokens

## Table of Contents

1. [Overview](#overview)
2. [Design Token Architecture](#design-token-architecture)
3. [@design-system/core](#design-systemcore)
4. [@design-system/podo](#design-systempodo)
5. [@packages/design-token](#packagesdesign-token)
6. [Usage Guide](#usage-guide)
7. [Development Workflow](#development-workflow)

---

## Overview

### Architecture Philosophy

The Podo design system follows a **3-tier hierarchical token structure** for consistent and scalable design management:

```
Static Tokens (정적 토큰)
    ↓
Semantic Tokens (의미론적 토큰)
    ↓
Scale Tokens (스케일 토큰)
```

**Path Index:**
- Main directory: `~/podo-app-DOC/design-system/`
- Design system overview: `~/podo-app-DOC/design-system/DESIGN-SYSTEM.md`

### Package Structure

| Package | Purpose | Path |
|---------|---------|------|
| `@design-system/core` | Base layout primitives and type utilities | `~/podo-app-DOC/design-system/core/` |
| `@design-system/podo` | Podo-specific UI components (v1, v2, v3) | `~/podo-app-DOC/design-system/podo/` |
| `@packages/design-token` | Design token definitions and generators | `~/podo-app-DOC/packages/design-token/` |

---

## Design Token Architecture

**Keywords:** design-tokens, css-variables, token-hierarchy, static-tokens, semantic-tokens, scale-tokens, style-dictionary

### Token Hierarchy

#### 1. Static Tokens (정적 토큰)

**Location:** `~/podo-app-DOC/packages/design-token/src/vars/static/`

Primitive, immutable values that form the foundation of the design system.

**Files:**
- `border.ts` - Border styles, widths, radii
- `space.ts` - Spacing values
- `layer.ts` - Z-index layers
- `motion.ts` - Animation timings
- `size.ts` - Sizing values
- `elevation.ts` - Shadow/elevation values

**Example** (`border.ts`):
```typescript
// Border styles
export const none = 'var(--static-border-none)' as const
export const solid = 'var(--static-border-solid)' as const

// Border widths
export const width1 = 'var(--static-border-width-1)' as const
export const width2 = 'var(--static-border-width-2)' as const

// Border radii
export const radius8 = 'var(--static-border-radius-8)' as const
export const radiusFull = 'var(--static-border-radius-full)' as const
```

#### 2. Semantic Tokens (의미론적 토큰)

**Location:** `~/podo-app-DOC/packages/design-token/src/vars/semantic/`

Purpose-driven tokens that abstract static tokens for UI use cases.

**Examples:**
- `color` - Semantic color names (primary, secondary, error, success)
- `typography` - Font styles (heading, body, label)
- `space` - Layout spacing (inline, stack, inset)
- `elevation` - Component elevation (card, modal, tooltip)
- `motion` - Transition presets (enter, exit, hover)

#### 3. Scale Tokens (스케일 토큰)

**Location:** `~/podo-app-DOC/packages/design-token/src/vars/scale/`

Product-specific customizations built on semantic tokens.

**Podo Scale** (`~/podo-app-DOC/packages/design-token/src/vars/scale/podo/index.ts`):
```typescript
export const color = {
  primary: semanticColor.colorPodoPrimary,
  text: {
    primary: semanticColor.textPrimary,
    secondary: semanticColor.textSecondary,
  },
  status: {
    error: semanticColor.colorError,
    success: semanticColor.colorSuccess,
  },
}

export const typography = {
  heading: {
    large: semanticTypography.h1,
    medium: semanticTypography.h2,
  },
  body: {
    large: semanticTypography.bodyLg,
    medium: semanticTypography.bodyMd,
  },
}
```

**Tutor Scale** (`~/podo-app-DOC/packages/design-token/src/vars/scale/tutor/`):
- `color.ts` - Tutor-specific colors
- `button.ts` - Button variants
- `typography.ts` - Typography presets

### CSS Variable Generation

**Build Commands:**
```bash
# Build all tokens
pnpm -C packages/design-token build:token

# Build Podo tokens only
pnpm -C packages/design-token build:podo-token

# Build Tailwind config
pnpm -C packages/design-token build:podo-tailwind
```

**Generated Files:**
- `~/podo-app-DOC/packages/design-token/build/css/podo-variables.css` - CSS variables
- `~/podo-app-DOC/packages/design-token/build/podo-tailwind.config.ts` - Tailwind config

**Process:**
1. Token definitions → Style Dictionary → CSS variables
2. CSS variables → Tailwind theme extension
3. Import in applications via `@packages/design-token/podo-design-token`

---

## @design-system/core

**Keywords:** layout-primitives, flex, stack, box, divider, spacer, polymorphic-components, react-components

**Location:** `~/podo-app-DOC/design-system/core/`

### Purpose

Foundation layout primitives for building UI components. Provides low-level building blocks that are framework-agnostic and reusable across Podo and Tutor applications.

### Package Configuration

**File:** `~/podo-app-DOC/design-system/core/package.json`

```json
{
  "name": "@design-system/core",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    },
    "./output.css": "./dist/output.css"
  }
}
```

**Dependencies:**
- `@packages/design-token` - Token system integration
- `class-variance-authority` - Variant styling
- `tailwind-merge` - Class merging utilities
- `cva` - Component variant API

**Dev Dependencies:**
- `storybook` 9.0.14 - Component documentation
- `tsup` - TypeScript bundler
- `tailwindcss` - CSS framework

### Component Catalog

**Location:** `~/podo-app-DOC/design-system/core/src/components/Layout/`

#### Box

**Path:** `~/podo-app-DOC/design-system/core/src/components/Layout/box/`

**Files:**
- `box.tsx` - Component implementation
- `box.type.ts` - TypeScript types
- `box.stories.tsx` - Storybook documentation
- `index.ts` - Public exports

**Description:** Polymorphic container component supporting any HTML element via `as` prop.

**Usage:**
```typescript
import { Box } from '@design-system/core'

<Box as="section" className="p-4">
  Content
</Box>
```

**Type Definition:**
```typescript
type BoxProps<E extends React.ElementType = 'div'> = {
  as?: E
  children?: React.ReactNode
  className?: string
  ref?: React.Ref<any>
} & ComponentPropsWithoutRef<E>
```

#### Flex

**Path:** `~/podo-app-DOC/design-system/core/src/components/Layout/flex/`

**Files:**
- `flex.tsx` - Component implementation
- `flex.type.ts` - TypeScript types
- `flex.css.ts` - Variant styles (CVA)
- `flex.stories.tsx` - Storybook documentation
- `index.ts` - Public exports

**Description:** Flexbox layout component with variant support.

**Variants:**
- `direction`: row | column | row-reverse | column-reverse
- `justify`: start | center | end | between | around | evenly
- `align`: start | center | end | stretch | baseline
- `wrap`: wrap | nowrap | wrap-reverse
- `gap`: spacing values

#### Stack

**Path:** `~/podo-app-DOC/design-system/core/src/components/Layout/stack/`

**Files:**
- `stack.tsx` - Generic stack component
- `h-stack.tsx` - Horizontal stack (convenience wrapper)
- `v-stack.tsx` - Vertical stack (convenience wrapper)
- `stack.type.ts` - TypeScript types
- `stack.css.ts` - Variant styles
- `stack.stories.tsx` - Storybook documentation
- `index.ts` - Public exports

**Description:** Directional layout component for vertical/horizontal stacking.

**Exports:**
- `Stack` - Base stack component
- `HStack` - Horizontal stack shorthand
- `VStack` - Vertical stack shorthand

**Usage:**
```typescript
import { VStack, HStack } from '@design-system/core'

<VStack gap="4">
  <div>Item 1</div>
  <div>Item 2</div>
</VStack>

<HStack justify="between">
  <button>Cancel</button>
  <button>Submit</button>
</HStack>
```

#### Divider

**Path:** `~/podo-app-DOC/design-system/core/src/components/Layout/divider/`

**Files:**
- `divider.tsx` - Component implementation
- `divider.type.ts` - TypeScript types
- `divider.css.ts` - Variant styles
- `divider.stories.tsx` - Storybook documentation
- `index.ts` - Public exports

**Description:** Visual separator with orientation support.

**Variants:**
- `orientation`: horizontal | vertical
- `thickness`: 1 | 2 | 4
- `color`: Custom color values

#### Spacer

**Path:** `~/podo-app-DOC/design-system/core/src/components/Layout/spacer/`

**Files:**
- `spacer.tsx` - Component implementation
- `spacer.type.ts` - TypeScript types
- `space.stories.tsx` - Storybook documentation
- `index.ts` - Public exports

**Description:** Empty spacing component for layout control.

**Usage:**
```typescript
import { Spacer } from '@design-system/core'

<HStack>
  <button>Left</button>
  <Spacer />
  <button>Right</button>
</HStack>
```

### Type Utilities

**Path:** `~/podo-app-DOC/design-system/core/src/types/`

**Files:**
- `polymorphic.type.ts` - Polymorphic component types
- `utility.type.ts` - Utility type helpers
- `index.ts` - Type exports

**Exports:**
- `PolymorphicComponentPropsWithRef` - For polymorphic components with ref support
- `PolymorphicRef` - Ref types for polymorphic components
- Utility types for component prop inference

### Exports

**File:** `~/podo-app-DOC/design-system/core/src/index.ts`

```typescript
// Types
export type * from './types'

// Components
export * from './components'
```

**Available Exports:**
- `Box` - Polymorphic container
- `Flex` - Flexbox layout
- `Stack`, `HStack`, `VStack` - Stack layouts
- `Divider` - Visual separator
- `Spacer` - Empty space
- Type utilities

### Storybook

**Location:** `~/podo-app-DOC/design-system/core/.storybook/`

**Commands:**
```bash
# Development
pnpm -C design-system/core storybook

# Build
pnpm -C design-system/core build:storybook
```

**Port:** 6006

**Configuration:**
- Framework: `@storybook/react-vite`
- Addons: essentials, interactions, docs
- Auto-generated documentation enabled

---

## @design-system/podo

**Keywords:** podo-components, ui-components, button, input, dialog, tabs, checkbox, chip, badge, toast, radix-ui, versioned-components

**Location:** `~/podo-app-DOC/design-system/podo/`

### Purpose

Podo-specific UI component library with multiple version support. Provides production-ready components with accessibility, animations, and Podo design language.

### Package Configuration

**File:** `~/podo-app-DOC/design-system/podo/package.json`

```json
{
  "name": "@design-system/podo",
  "exports": {
    ".": "./src/entry-point.ts",
    "./third-party": {
      "import": "./dist/third-party.mjs"
    },
    "./tailwind-configuration": {
      "import": "./dist/tailwind.config.mjs"
    },
    "./output.css": "./dist/output.css"
  }
}
```

**Key Dependencies:**
- `@design-system/core` - Layout primitives
- `@packages/design-token` - Design tokens
- `@radix-ui/*` - Accessible component primitives
- `lucide-react` - Icon library
- `sonner` - Toast notifications
- `vaul` - Bottom sheet component

### Entry Points

**Client Entry** (`~/podo-app-DOC/design-system/podo/src/client-entry.ts`):
```typescript
export * from './components'
export { Box, Divider, Flex, HStack, Stack, VStack } from '@design-system/core'
```

**Shared Entry** (`~/podo-app-DOC/design-system/podo/src/shared-entry.ts`):
```typescript
export * from './lib'
```

**Third Party** (`~/podo-app-DOC/design-system/podo/src/third-party.ts`):
- Re-exports of external component libraries

### Component Versions

The package maintains **3 concurrent versions** of components to support incremental migration:

#### Version 1 (v1) - Legacy Components

**Location:** `~/podo-app-DOC/design-system/podo/src/components/v1/`

**Export File:** `~/podo-app-DOC/design-system/podo/src/components/v1/index.ts`

**Component List:**
1. **AlertDialog** (`alert-dialog/`)
   - Modal dialog for critical confirmations
   - Radix UI based
   - Files: `alert-dialog.tsx`, `index.ts`, `alert-dialog.stories.tsx`

2. **Badge** (`badge/`)
   - Label/status indicator
   - Variant support: default, success, error, warning

3. **Button** (`button/`)
   - Primary interaction component
   - Path: `~/podo-app-DOC/design-system/podo/src/components/v1/button/`
   - Files: `button.tsx`, `button.types.ts`, `button.css.ts`, `button.stories.tsx`
   - Variants: primary, secondary, tertiary, ghost
   - Sizes: small, medium, large
   - Shapes: square, rounded, circular
   - Icon support via `Icon` prop

4. **Checkbox** (`checkbox/`)
   - Form checkbox input
   - Controlled/uncontrolled modes
   - Accessibility compliant

5. **Chip** (`chip/`)
   - Tag/filter component
   - Dismissible option
   - Color variants

6. **ConfirmDialog** (`confirm-dialog/`)
   - Yes/No confirmation modal
   - Action/cancel callbacks

7. **Icon** (`icon/`)
   - Path: `~/podo-app-DOC/design-system/podo/src/components/v1/icon/`
   - Files: `icon.tsx`, `icon.types.ts`, `podo-icons.tsx`, `clock.tsx`, `checkbox-circle-icon.tsx`
   - Custom Podo icon set
   - Size variants

8. **Input** (`input/`)
   - Text input component
   - Path: `~/podo-app-DOC/design-system/podo/src/components/v1/input/`
   - Files: `input.tsx`, `input.types.ts`, `input.css.ts`, `input.stories.tsx`
   - Types: text, email, password, number
   - States: error, disabled, focused
   - Prefix/suffix support

9. **Popover** (`popover/`)
   - Floating content container
   - Radix Popover primitive

10. **Radio** (`radio/`)
    - Radio button group
    - Single selection

11. **Separator** (`separator/`)
    - Horizontal/vertical divider
    - Radix Separator primitive

12. **SubTab** (`sub-tab/`)
    - Secondary navigation tabs
    - Nested tab support

13. **Tabs** (`tabs/`)
    - Path: `~/podo-app-DOC/design-system/podo/src/components/v1/tabs/`
    - Files: `tabs.tsx`, `tabs.css.ts`, `tabs.stories.tsx`
    - Tabbed interface component
    - Radix Tabs primitive
    - Keyboard navigation

14. **Typography** (`typography/`)
    - Path: `~/podo-app-DOC/design-system/podo/src/components/v1/typography/`
    - Files: `typography.tsx`, `typography.types.ts`, `typography.css.ts`, `typography.stories.tsx`
    - Text styling component
    - Variants: h1, h2, h3, h4, h5, h6, body, caption, label
    - Weight, color, alignment options

#### Version 2 (v2) - Current Components

**Location:** `~/podo-app-DOC/design-system/podo/src/components/v2/`

**Export File:** `~/podo-app-DOC/design-system/podo/src/components/v2/index.ts`

**Component List:**
1. **AlertDialogV2** (`alert-dialog/`)
   - Enhanced modal with image support
   - Exports: AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogImage, AlertDialogOverlay, AlertDialogPortal

2. **BadgeV2** (`badge/`)
   - Updated badge component
   - New color variants

3. **BottomSheet** (`bottom-sheet/`)
   - Mobile-friendly drawer component
   - Vaul library integration
   - Swipe-to-dismiss support
   - Files: `bottom-sheet.tsx`, stories, types

4. **ButtonV2** (`button/`)
   - Refined button component
   - Loading state support
   - Icon positioning improvements

5. **CheckboxV2** (`checkbox/`)
   - Enhanced checkbox
   - Indeterminate state support

6. **ChipV2** (`chip/`)
   - Updated chip design
   - Animation improvements

7. **ChipWithBadge** (`chip-with-badge/`)
   - Path: `~/podo-app-DOC/design-system/podo/src/components/v2/chip-with-badge/`
   - Combined chip + badge component
   - Notification count support
   - Export: `ChipWithBadge`, `ChipWithBadgeProps`

8. **ConfirmDialogV2** (`confirm-dialog/`)
   - Improved confirmation modal
   - Async action support
   - Exports: ConfirmDialog, ConfirmDialogTrigger, ConfirmDialogContent, ConfirmDialogHeader, ConfirmDialogTitle, ConfirmDialogDescription, ConfirmDialogFooter, ConfirmDialogClose, ConfirmDialogOverlay, ConfirmDialogPortal

9. **FeedbackList** (`feedback-list/`)
   - List component with feedback states
   - Empty state support
   - Loading skeleton
   - Files: `feedback-list.tsx`, exports in `index.ts`

10. **Progress** (`progress/`)
    - Progress indicator component
    - Radix Progress primitive
    - Determinate/indeterminate modes
    - Files: `progress.tsx`, exports

11. **SelectableCard** (`selectable-card/`)
    - Card with selection state
    - Radio button alternative
    - Export: `SelectableCard`, `SelectableCardProps`

12. **Stepper** (`stepper/`)
    - Multi-step indicator
    - Progress tracking
    - Files: `stepper.tsx`, exports

13. **TabsV2** (`tabs/`)
    - Enhanced tabs component
    - Improved animations

14. **Toaster** (`toaster/`)
    - Toast notification system
    - Sonner library integration
    - Position variants
    - Action support
    - Files: `toaster.tsx`, exports

15. **Toggle** (`toggle/`)
    - Switch/toggle component
    - Radix Switch primitive
    - On/off state
    - Files: `toggle.tsx`, exports

#### Version 3 (v3) - Experimental Components

**Location:** `~/podo-app-DOC/design-system/podo/src/components/v3/`

**Export File:** `~/podo-app-DOC/design-system/podo/src/components/v3/index.ts`

**Component List:**
1. **ChipV3** (`chip/`)
   - Latest chip implementation
   - Performance optimizations

2. **ChipWithBadgeV3** (`chip-with-badge/`)
   - Updated chip-with-badge
   - New API design

**Note:** v3 components are experimental and may have breaking API changes.

### Utility Library

**Location:** `~/podo-app-DOC/design-system/podo/src/lib/`

**Files:**
- `util.ts` - Utility functions
- `index.ts` - Library exports

**Common Utilities:**
```typescript
// Class name merging with Tailwind
import { cn } from '@design-system/podo/lib'

<div className={cn('base-class', conditionalClass)} />
```

### Tailwind Configuration

**File:** `~/podo-app-DOC/design-system/podo/tailwind.config.ts`

```typescript
import podoTailwindCssConfig from '@packages/design-token/podo-tailwind.config.ts'
import type { Config } from 'tailwindcss'

export default {
  ...podoTailwindCssConfig,
  theme: {
    ...podoTailwindCssConfig.theme,
    screens: {
      mobile: '360px',
      tablet: '480px',
    },
  },
} satisfies Config
```

**Extends:** `@packages/design-token/podo-tailwind.config.ts`

**Custom Screens:**
- `mobile`: 360px
- `tablet`: 480px

### Build Configuration

**File:** `~/podo-app-DOC/design-system/podo/tsup.config.ts`

**Build Targets:**
1. **Client Entry** - Client-side components
   - Output: `dist/client/`
   - Format: ESM, CJS
   - Preserves `use client` directives

2. **Shared Entry** - Shared utilities
   - Output: `dist/shared/`
   - Format: ESM, CJS

3. **Tailwind Config** - Exportable Tailwind configuration
   - Format: ESM
   - Type definitions included

4. **Third Party** - External library exports
   - Format: ESM

### Storybook

**Location:** `~/podo-app-DOC/design-system/podo/.storybook/`

**Commands:**
```bash
# Development
pnpm -C design-system/podo storybook

# Build
pnpm -C design-system/podo build:storybook
```

**Port:** 6006

**Features:**
- Includes `@design-system/core` stories
- Tailwind CSS v4 support
- Automatic documentation generation
- Component playground

**Story Paths:**
- Podo components: `../src/**/*.stories.tsx`
- Core components: `../../core/src/**/*.stories.tsx`
- MDX docs: `../**/*.mdx`

---

## @packages/design-token

**Keywords:** design-tokens, style-dictionary, tailwindcss, css-variables, token-generation, podo-tokens, tutor-tokens

**Location:** `~/podo-app-DOC/packages/design-token/`

### Purpose

Central token management system that generates CSS variables and Tailwind configurations from design token definitions.

### Package Configuration

**File:** `~/podo-app-DOC/packages/design-token/package.json`

```json
{
  "name": "@packages/design-token",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    },
    "./podo-tailwind.config.ts": {
      "import": "./build/podo-tailwind.config.ts"
    },
    "./podo-design-token": "./build/css/podo-variables.css"
  }
}
```

### Build Process

**Commands:**
```bash
# Full build
pnpm -C packages/design-token build

# Token generation only
pnpm -C packages/design-token build:token

# Podo tokens only
pnpm -C packages/design-token build:podo-token

# Tailwind config generation
pnpm -C packages/design-token build:podo-tailwind
```

**Build Pipeline:**
1. Token definitions (TypeScript) → Style Dictionary
2. Style Dictionary → CSS variables (`build/css/podo-variables.css`)
3. Token definitions → Tailwind config generator
4. Tailwind config generator → `build/podo-tailwind.config.ts`

### Token Source Files

#### Static Tokens

**Location:** `~/podo-app-DOC/packages/design-token/src/vars/static/`

**Files:**
- `border.ts` - Border styles, widths, radii
- `space.ts` - Spacing scale (0-96)
- `layer.ts` - Z-index layering system
- `motion.ts` - Animation durations and easings
- `size.ts` - Size scale (width, height)
- `elevation.ts` - Shadow definitions
- `index.ts` - Static token exports

**Example Usage:**
```typescript
import { border, space, elevation } from '@packages/design-token/vars/static'

const styles = {
  borderRadius: border.radius8,
  padding: space.space16,
  boxShadow: elevation.level2,
}
```

#### Semantic Tokens

**Location:** `~/podo-app-DOC/packages/design-token/src/vars/semantic/`

**Token Categories:**
- `color.ts` - Semantic color mappings (primary, secondary, text, background, status)
- `typography.ts` - Font sizes, weights, line heights (h1-h6, body, label)
- `space.ts` - Layout spacing (inline, stack, inset)
- `elevation.ts` - Component elevation (card, modal, tooltip, popover)
- `motion.ts` - Transition presets (enter, exit, hover, focus)
- `index.ts` - Semantic token exports

#### Scale Tokens

**Podo Scale** (`~/podo-app-DOC/packages/design-token/src/vars/scale/podo/index.ts`):
```typescript
import { color as semanticColor, typography as semanticTypography } from '../../semantic'

export const color = {
  primary: semanticColor.colorPodoPrimary,
  text: {
    primary: semanticColor.textPrimary,
    secondary: semanticColor.textSecondary,
  },
  background: {
    default: semanticColor.backgroundDefault,
  },
  status: {
    error: semanticColor.colorError,
    success: semanticColor.colorSuccess,
  },
}

export const typography = {
  heading: {
    large: semanticTypography.h1,
    medium: semanticTypography.h2,
  },
  body: {
    large: semanticTypography.bodyLg,
    medium: semanticTypography.bodyMd,
  },
}
```

**Tutor Scale** (`~/podo-app-DOC/packages/design-token/src/vars/scale/tutor/`):
- `color.ts` - Tutor-specific color palette
- `button.ts` - Tutor button styles
- `typography.ts` - Tutor typography scale
- `index.ts` - Tutor scale exports

### Token Configuration Files

**Style Dictionary Config** (`~/podo-app-DOC/packages/design-token/config/podo-style-dictionary.ts`):
- Transforms token definitions into CSS variables
- Output: `build/css/podo-variables.css`

**Tailwind Config Generator** (`~/podo-app-DOC/packages/design-token/config/podo.tailwindcss.ts`):
- Converts tokens to Tailwind theme configuration
- Output: `build/podo-tailwind.config.ts`

**Constants** (`~/podo-app-DOC/packages/design-token/config/constants.ts`):
- Build configuration constants
- Output path definitions

### JSON Token Sources

**Location:** `~/podo-app-DOC/packages/design-token/tokens/podo-web/`

**Files:**
- `v1/podo-design-token.json` - Version 1 token definitions
- `v2/podo-design-token.json` - Version 2 token definitions

**Purpose:** Exported token data for external tools and documentation generators.

### Generated Outputs

**CSS Variables** (`build/css/podo-variables.css`):
```css
:root {
  --static-border-radius-8: 8px;
  --static-space-16: 16px;
  --semantic-color-primary: #6B4EFF;
  --scale-podo-text-primary: #1A1A1A;
  /* ... hundreds more */
}
```

**Tailwind Config** (`build/podo-tailwind.config.ts`):
```typescript
export default {
  theme: {
    extend: {
      colors: {
        'podo-primary': 'var(--scale-podo-color-primary)',
        'text-primary': 'var(--scale-podo-text-primary)',
        // ...
      },
      spacing: {
        '4': 'var(--static-space-4)',
        '8': 'var(--static-space-8)',
        // ...
      },
      borderRadius: {
        'sm': 'var(--static-border-radius-4)',
        'md': 'var(--static-border-radius-8)',
        // ...
      },
    },
  },
}
```

---

## Usage Guide

### Installing Design System

```bash
# In package.json
{
  "dependencies": {
    "@design-system/core": "workspace:^",
    "@design-system/podo": "workspace:^",
    "@packages/design-token": "workspace:^"
  }
}
```

### Using Layout Primitives

```typescript
import { Box, Flex, HStack, VStack, Divider } from '@design-system/core'

function Layout() {
  return (
    <Box as="main" className="container">
      <VStack gap="4">
        <header>Header</header>
        <Divider />
        <Flex justify="between" align="center">
          <div>Left</div>
          <div>Right</div>
        </Flex>
      </VStack>
    </Box>
  )
}
```

### Using Podo Components

```typescript
import { Button, Input, AlertDialog } from '@design-system/podo'
import { ButtonV2, ChipWithBadge } from '@design-system/podo' // v2 components

function Form() {
  return (
    <VStack gap="4">
      <Input placeholder="Enter name" />
      <HStack gap="2">
        <Button variant="secondary">Cancel</Button>
        <ButtonV2 variant="primary">Submit</ButtonV2>
      </HStack>
      <ChipWithBadge label="Notifications" count={5} />
    </VStack>
  )
}
```

### Using Design Tokens

#### In CSS/SCSS

```css
@import '@packages/design-token/podo-design-token';

.custom-component {
  color: var(--scale-podo-text-primary);
  padding: var(--static-space-16);
  border-radius: var(--static-border-radius-8);
  background: var(--semantic-color-background-default);
}
```

#### In Tailwind

```typescript
// tailwind.config.ts
import podoTailwindConfig from '@packages/design-token/podo-tailwind.config.ts'

export default {
  presets: [podoTailwindConfig],
  content: ['./src/**/*.{ts,tsx}'],
}
```

```tsx
<div className="bg-podo-primary text-white rounded-md p-4">
  Styled with token-based Tailwind classes
</div>
```

#### In TypeScript

```typescript
import { color, space, typography } from '@packages/design-token'

const theme = {
  primaryColor: color.primary,
  spacing: space.space16,
  headingFont: typography.heading.large,
}
```

### Component Versioning Strategy

When migrating between versions:

```typescript
// Old code (v1)
import { Button, Chip } from '@design-system/podo'

// New code (v2) - explicit version import
import { ButtonV2, ChipV2 } from '@design-system/podo'

// Or use v1 explicitly during migration
import { Button as ButtonV1 } from '@design-system/podo'
import { ButtonV2 } from '@design-system/podo'
```

### Storybook Usage

```bash
# View core components
pnpm -C design-system/core storybook

# View Podo components (includes core)
pnpm -C design-system/podo storybook
```

Open `http://localhost:6006` to browse components, see live examples, and view auto-generated documentation.

---

## Development Workflow

### Adding a New Component

#### To @design-system/core

1. Create component directory:
   ```bash
   mkdir -p design-system/core/src/components/Layout/my-component
   ```

2. Add component files:
   ```
   my-component/
   ├── my-component.tsx      # Implementation
   ├── my-component.type.ts  # TypeScript types
   ├── my-component.css.ts   # CVA variants (optional)
   ├── my-component.stories.tsx # Storybook stories
   └── index.ts              # Public exports
   ```

3. Export from Layout index:
   ```typescript
   // design-system/core/src/components/Layout/index.ts
   export * from './my-component'
   ```

4. Build and test:
   ```bash
   pnpm -C design-system/core build
   pnpm -C design-system/core storybook
   ```

#### To @design-system/podo

1. Choose version directory (typically v2):
   ```bash
   mkdir -p design-system/podo/src/components/v2/my-component
   ```

2. Add component files:
   ```
   my-component/
   ├── my-component.tsx
   ├── my-component.types.ts
   ├── my-component.stories.tsx
   └── index.ts
   ```

3. Export from version index:
   ```typescript
   // design-system/podo/src/components/v2/index.ts
   export { MyComponent as MyComponentV2 } from './my-component'
   ```

4. Build and test:
   ```bash
   pnpm -C design-system/podo build
   pnpm -C design-system/podo storybook
   ```

### Adding Design Tokens

1. Add static token:
   ```typescript
   // packages/design-token/src/vars/static/my-tokens.ts
   export const myValue = 'var(--static-my-value)' as const
   ```

2. Add semantic token:
   ```typescript
   // packages/design-token/src/vars/semantic/my-tokens.ts
   import { myValue as staticValue } from '../static/my-tokens'

   export const mySemanticValue = staticValue
   ```

3. Add to scale:
   ```typescript
   // packages/design-token/src/vars/scale/podo/index.ts
   export const myScale = {
     value: semanticMyValue,
   }
   ```

4. Rebuild tokens:
   ```bash
   pnpm -C packages/design-token build:token
   ```

### Testing Changes

```bash
# Run all Storybook instances
pnpm -C design-system/core storybook &
pnpm -C design-system/podo storybook &

# Build all packages
pnpm build

# Test in consuming app
cd apps/web
pnpm dev
```

### Version Migration Checklist

When deprecating v1 in favor of v2:

- [ ] Create v2 component with backward-compatible API
- [ ] Export v2 component with `V2` suffix
- [ ] Update Storybook documentation
- [ ] Add migration guide in stories
- [ ] Create deprecation notice for v1 component
- [ ] Update consuming applications incrementally
- [ ] Remove v1 component after full migration

---

## File Path Quick Reference

### Core Package
```
~/podo-app-DOC/design-system/core/
├── src/
│   ├── components/Layout/
│   │   ├── box/
│   │   ├── flex/
│   │   ├── stack/
│   │   ├── divider/
│   │   └── spacer/
│   ├── types/
│   └── index.ts
├── .storybook/
├── package.json
└── tailwind.config.ts
```

### Podo Package
```
~/podo-app-DOC/design-system/podo/
├── src/
│   ├── components/
│   │   ├── v1/        # 14 components
│   │   ├── v2/        # 15 components
│   │   └── v3/        # 2 components
│   ├── lib/
│   ├── styles/
│   ├── client-entry.ts
│   └── shared-entry.ts
├── .storybook/
├── package.json
├── tailwind.config.ts
└── tsup.config.ts
```

### Design Token Package
```
~/podo-app-DOC/packages/design-token/
├── src/vars/
│   ├── static/
│   ├── semantic/
│   └── scale/
│       ├── podo/
│       └── tutor/
├── config/
│   ├── podo-style-dictionary.ts
│   └── podo.tailwindcss.ts
├── tokens/podo-web/
│   ├── v1/podo-design-token.json
│   └── v2/podo-design-token.json
├── build/
│   ├── css/podo-variables.css
│   └── podo-tailwind.config.ts
└── package.json
```

---

## Keywords for RAG Retrieval

**Packages:** design-system, design-system-core, design-system-podo, design-token, packages-design-token

**Components:** box, flex, stack, hstack, vstack, divider, spacer, button, input, checkbox, chip, badge, tabs, alert-dialog, confirm-dialog, bottom-sheet, toast, toaster, toggle, progress, stepper, selectable-card, feedback-list, chip-with-badge, typography, icon, radio, separator, popover, sub-tab

**Concepts:** design-tokens, css-variables, tailwind-configuration, token-hierarchy, static-tokens, semantic-tokens, scale-tokens, style-dictionary, component-versioning, storybook, polymorphic-components, layout-primitives, radix-ui, accessibility, variants, cva, class-variance-authority

**Technologies:** react, typescript, tailwindcss, storybook, tsup, vanilla-extract, radix-ui, lucide-react, sonner, vaul

**Build:** build-process, token-generation, css-generation, tailwind-config-generation, tsup-configuration

**Versions:** v1, v2, v3, component-migration, backward-compatibility, version-strategy

