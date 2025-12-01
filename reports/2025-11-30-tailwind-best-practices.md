# Tailwind CSS v4 Best Practices Guide (2024-2025)

**Date:** November 30, 2025
**Author:** Research Report
**Status:** Current as of Tailwind CSS v4.0 stable release (January 22, 2025)

---

## Executive Summary

Tailwind CSS v4 represents a fundamental reimagining of the framework, transitioning from JavaScript-based configuration to a CSS-first architecture. Released in stable form on January 22, 2025, v4 delivers dramatic performance improvements (up to 10x faster builds), simplified setup, and leverages modern CSS features like cascade layers, `@property`, and `color-mix()`.

This report covers migration strategies, the new `@theme` directive, project organization patterns, performance optimization, accessibility best practices, and integration with modern frameworks like Astro and React.

---

## 1. Tailwind v4 New Features and Migration from v3

### 1.1 Release Timeline

- **March 6, 2024:** v4-alpha launched and open-sourced
- **November 21, 2024:** v4-beta-1 released
- **January 22, 2025:** Stable v4.0 released

### 1.2 Major New Features

#### High-Performance Engine (Oxide)

Tailwind v4 features a complete rewrite with critical components in Rust, delivering:

- **3.78x faster** full builds (378ms → 100ms on Tailwind website)
- **8.8x faster** incremental builds with new CSS (44ms → 5ms)
- **182x faster** incremental builds with no new CSS (35ms → 192µs)
- **35% smaller** installed package size

#### CSS-First Configuration

The most significant change is the replacement of `tailwind.config.js` with CSS-based configuration using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 1920px;
  --color-avocado-500: oklch(0.84 0.18 117.33);
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
}
```

**Benefits:**
- Configuration lives where it's used
- No JavaScript context switching
- All design tokens become CSS variables automatically
- Runtime access without JavaScript overhead

#### Simplified Installation

Three simple steps replace previous complexity:

```bash
# 1. Install dependencies
npm i tailwindcss @tailwindcss/postcss

# 2. Configure PostCSS
export default {
  plugins: ["@tailwindcss/postcss"],
};

# 3. Import in CSS
@import "tailwindcss";
```

For Vite projects, use the first-party plugin for maximum performance:

```bash
npm i tailwindcss @tailwindcss/vite
```

```javascript
// vite.config.js
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [tailwindcss()],
};
```

#### Automatic Content Detection

Template files are discovered automatically using intelligent heuristics:
- Respects `.gitignore` to avoid scanning dependencies
- Automatically ignores binary extensions (images, videos, zip files)
- No content array configuration required

#### Dynamic Utility Values

No more square brackets for many dynamic values:

```html
<!-- v3 -->
<div class="h-[100px] grid-cols-[15]">

<!-- v4 -->
<div class="h-100 grid-cols-15">
```

Custom data attributes work natively:

```html
<div data-current class="opacity-75 data-current:opacity-100">
```

#### Container Queries in Core

Built-in support without plugins:

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3">
    <!-- Content adapts to container size, not viewport -->
  </div>
</div>
```

Max-width container queries:

```html
<div class="@max-sm:hidden">
  <!-- Hidden when container is smaller than sm -->
</div>
```

#### 3D Transform Utilities

Native 3D transform support:

```html
<div class="perspective-distant">
  <article class="rotate-x-51 rotate-z-43 transform-3d">
    <!-- 3D transformed content -->
  </article>
</div>
```

#### Enhanced Gradient APIs

**Linear gradients with angles:**

```html
<div class="bg-linear-45 from-indigo-500 to-pink-500">
```

**Gradient interpolation control:**

```html
<div class="bg-linear-to-r/oklch from-indigo-500 to-teal-400">
```

**Conic and radial gradients:**

```html
<div class="bg-conic/[in_hsl_longer_hue] from-red-600 to-red-600">
<div class="bg-radial-[at_25%_25%] from-white to-zinc-900">
```

#### @starting-style Support

Animate elements as they appear without JavaScript:

```html
<div popover id="my-popover"
     class="transition-discrete starting:open:opacity-0">
  <!-- Animates in when popover opens -->
</div>
```

#### not-* Variant

Style elements that don't match conditions:

```html
<div class="not-hover:opacity-75">
  <!-- Reduced opacity when NOT hovering -->
</div>

<div class="not-supports-hanging-punctuation:px-4">
  <!-- Padding when feature not supported -->
</div>
```

#### Additional Utilities

- `inset-shadow-*` and `inset-ring-*` for layered shadows
- `field-sizing` for auto-resizing textareas
- `color-scheme` for scrollbar styling in dark mode
- `font-stretch` for variable font control
- `inert` variant for non-interactive elements
- `nth-*` variants for advanced selection
- `in-*` variant (like `group-*` without class requirement)

#### Modernized Color Palette

Colors upgraded from `rgb` to `oklch` color space for:
- Wider gamut support
- More vivid colors on modern displays
- Better perceptual uniformity
- P3 color space compatibility

### 1.3 Breaking Changes

#### Browser Requirements

**Minimum versions:**
- Safari 16.4+
- Chrome 111+
- Firefox 128+

These requirements enable use of modern CSS features like `@property` and `color-mix()`. If you need older browser support, remain on v3.4.

#### Import Syntax

**v3:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v4:**
```css
@import "tailwindcss";
```

#### Utility Naming Changes

Several utilities renamed for consistency:

| v3 | v4 |
|----|----|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `blur-sm` | `blur-xs` |
| `rounded-sm` | `rounded-xs` |
| `outline-none` | `outline-hidden` |
| `ring` (3px) | `ring-3` |

#### Default Color Changes

- **Border and ring utilities** now default to `currentColor` instead of specific gray values
- **Placeholder color** now at 50% opacity of current text color
- Explicitly specify colors where the old defaults were relied upon

#### Important Modifier Position

**v3:**
```html
<div class="!flex !bg-red-500">
```

**v4:**
```html
<div class="flex! bg-red-500!">
```

Move `!` to the end of class names (old way still supported but deprecated).

#### Prefix Syntax

**v3:**
```html
<div class="flex:tw bg-blue-500:tw">
```

**v4:**
```html
<div class="tw:flex tw:bg-blue-500">
```

Prefixes now appear at the class start.

#### Custom Utilities

**v3:**
```css
@layer utilities {
  .custom-utility {
    /* styles */
  }
}
```

**v4:**
```css
@utility custom-utility {
  /* styles */
}
```

Use `@utility` directive instead of `@layer utilities`.

#### CSS Variable Syntax

**v3:**
```html
<div class="bg-[--brand-color]">
```

**v4:**
```html
<div class="bg-(--brand-color)">
```

#### Other Notable Changes

- Individual transform properties (`rotate`, `scale`, `translate`) replace combined `transform` usage
- Variant stacking order reversed (left-to-right instead of right-to-left)
- JavaScript config files require explicit `@config` directives
- `resolveConfig` function removed; use CSS variables directly
- **Sass/Less/Stylus preprocessing no longer supported**

### 1.4 Migration Strategy

#### Automated Migration Tool

The official upgrade tool automates most migration work:

```bash
npx @tailwindcss/upgrade
```

**Requirements:**
- Node.js 20 or higher
- Clean Git working directory (use `--force` to bypass)

**What it does:**
- Updates dependencies
- Migrates `tailwind.config.js` to `@theme` in CSS
- Updates template files with new syntax
- Handles utility name changes

**Recommendation:** Run in a new branch and review changes before merging.

#### Manual Migration Steps

**1. Update PostCSS configuration:**

```javascript
// postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**2. Update Vite configuration (if using Vite):**

```javascript
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [tailwindcss()],
};
```

**3. Update CLI commands:**

```bash
# Old
npx tailwindcss -i input.css -o output.css

# New
npx @tailwindcss/cli -i input.css -o output.css
```

**4. Convert configuration:**

Migrate `tailwind.config.js` theme settings to `@theme` in your CSS file.

**5. Update imports:**

Replace `@tailwind` directives with `@import "tailwindcss"`.

**6. Test thoroughly:**

- Verify visual appearance across all pages
- Test interactive states (hover, focus, active)
- Check dark mode if implemented
- Validate responsive breakpoints

---

## 2. Theme Customization with @theme Directive

### 2.1 Understanding @theme

The `@theme` directive defines special CSS variables that:
1. Create corresponding utility classes
2. Become CSS custom properties accessible anywhere
3. Integrate seamlessly with Tailwind's design system

**Key distinction:** Unlike `:root` variables, `@theme` variables generate utilities.

### 2.2 Basic Usage

```css
@import "tailwindcss";

@theme {
  --color-mint-500: oklch(0.72 0.11 178);
  --font-script: Great Vibes, cursive;
  --spacing-huge: 12rem;
}
```

**This generates:**
- CSS variables: `var(--color-mint-500)`, `var(--font-script)`, `var(--spacing-huge)`
- Utility classes: `bg-mint-500`, `text-mint-500`, `font-script`, `p-huge`, `m-huge`

### 2.3 Extending vs. Overriding

#### Extending the Default Theme

Add new variables alongside defaults:

```css
@theme {
  --font-poppins: Poppins, sans-serif;
  --color-brand-purple: oklch(0.55 0.25 285);
}
```

Default utilities remain available; your custom ones are added.

#### Overriding Specific Values

Replace individual default values:

```css
@theme {
  --breakpoint-sm: 30rem;  /* Changed from default 40rem */
  --breakpoint-lg: 64rem;  /* Changed from default 64rem */
}
```

#### Complete Namespace Replacement

Remove all defaults in a namespace:

```css
@theme {
  --color-*: initial;
  --color-white: #fff;
  --color-black: #000;
  --color-purple: #3f3cbb;
  --color-pink: #ec4899;
}
```

Only your custom colors generate utilities; all default colors removed.

#### Custom Theme from Scratch

```css
@theme {
  --*: initial;
  --spacing: 4px;
  --font-body: Inter, sans-serif;
  --color-primary: oklch(0.72 0.11 221.19);
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
}
```

### 2.4 Common Namespaces

| Namespace | Maps To | Example Utilities |
|-----------|---------|-------------------|
| `--color-*` | Color utilities | `bg-red-500`, `text-blue-700` |
| `--font-*` | Font families | `font-sans`, `font-mono` |
| `--text-*` | Font sizes | `text-xl`, `text-sm` |
| `--font-weight-*` | Font weights | `font-bold`, `font-light` |
| `--spacing-*` | Spacing utilities | `p-4`, `m-8`, `gap-2` |
| `--breakpoint-*` | Responsive variants | `sm:*`, `md:*`, `lg:*` |
| `--shadow-*` | Shadow utilities | `shadow-lg`, `shadow-md` |
| `--radius-*` | Border radius | `rounded-lg`, `rounded-full` |

### 2.5 Advanced Features

#### Animation Keyframes

```css
@theme {
  --animate-fade-in-scale: fade-in-scale 0.3s ease-out;

  @keyframes fade-in-scale {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

Usage:
```html
<div class="animate-fade-in-scale">
  <!-- Smoothly fades in and scales up -->
</div>
```

#### Variable References with `inline`

```css
@theme inline {
  --font-sans: var(--font-inter);
  --color-primary: var(--color-purple-600);
}
```

The `inline` option ensures utilities use actual values, not nested references.

#### Shared Theme Files

**./brand/theme.css:**
```css
@theme {
  --color-primary: oklch(0.72 0.11 221.19);
  --color-secondary: oklch(0.85 0.15 142.50);
  --font-body: Inter, sans-serif;
  --font-heading: Poppins, sans-serif;
}
```

**./app.css:**
```css
@import "tailwindcss";
@import "../brand/theme.css";
```

This enables theme reuse across multiple projects.

### 2.6 Using Theme Variables in Custom CSS

All theme variables are accessible as CSS variables:

```css
@layer components {
  .card {
    background: var(--color-white);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4);
  }

  .typography p {
    font-size: var(--text-base);
    color: var(--color-gray-700);
  }
}
```

In JavaScript:
```javascript
const styles = getComputedStyle(document.documentElement);
const shadowValue = styles.getPropertyValue("--shadow-xl");
```

In arbitrary values with calculations:
```html
<div class="rounded-[calc(var(--radius-xl)-1px)]">
  <!-- Calculated border radius -->
</div>
```

### 2.7 Dark Mode with @theme

#### Using light-dark() Function

```css
@theme {
  --color-background: light-dark(#ffffff, #0a0a0a);
  --color-foreground: light-dark(#0a0a0a, #ffffff);
  --color-pink: light-dark(#eb6bd8, #8e0d7a);
}
```

**Note:** `light-dark()` is Baseline 2024, so browser support is Safari 17.5+, Chrome 123+, Firefox 120+.

#### Custom Dark Mode Variant

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Then toggle with JavaScript:

```javascript
// Add to <html> or <body>
document.documentElement.classList.toggle('dark');
```

#### Design Token Approach (Recommended)

Define semantic tokens once:

```css
@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.2 0 0);
  --color-card: oklch(0.98 0 0);
  --color-border: oklch(0.9 0 0);
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: oklch(0.15 0 0);
    --color-foreground: oklch(0.95 0 0);
    --color-card: oklch(0.18 0 0);
    --color-border: oklch(0.25 0 0);
  }
}
```

**Benefits:**
- Write `bg-background` instead of `bg-white dark:bg-gray-950`
- Changes propagate automatically
- Reduces template complexity
- More maintainable at scale

### 2.8 When to Use @theme vs :root

**Use `@theme` when:**
- You want a utility class generated
- The value is part of your design system
- You need theme tokens accessible across utilities

**Use `:root` when:**
- The variable is for internal component use only
- You don't need corresponding utilities
- You want a simple CSS variable

**Example:**

```css
@theme {
  --color-primary: oklch(0.72 0.11 221.19);
}

:root {
  --header-height: 64px;  /* No utility needed */
  --sidebar-width: 280px;
}
```

---

## 3. Project Organization and CSS Architecture

### 3.1 Recommended File Structure

```
project/
├── src/
│   ├── styles/
│   │   ├── main.css           # Main entry point
│   │   ├── theme.css          # @theme definitions
│   │   ├── base.css           # Base/reset styles
│   │   ├── components.css     # Component styles
│   │   └── utilities.css      # Custom utilities
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css (optional)
│   │   └── Card/
│   │       ├── Card.tsx
│   │       └── Card.module.css (optional)
│   └── ...
```

### 3.2 CSS Layer Architecture

Tailwind v4 uses native CSS cascade layers:

```
@layer theme, base, components, utilities;
```

**Layer order** (from lowest to highest specificity):
1. `theme` - Design tokens and theme variables
2. `base` - Reset styles and base element styles
3. `components` - Component patterns
4. `utilities` - Utility classes

**Example main.css:**

```css
@import "tailwindcss";
@import "./theme.css";
@import "./base.css";
@import "./components.css";
@import "./utilities.css";
```

**theme.css:**
```css
@theme {
  --color-primary: oklch(0.72 0.11 221.19);
  --color-secondary: oklch(0.85 0.15 142.50);
  --font-body: Inter, sans-serif;
}
```

**base.css:**
```css
@layer base {
  body {
    @apply font-body text-foreground bg-background;
  }

  h1, h2, h3 {
    @apply font-heading;
  }
}
```

**components.css:**
```css
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-primary text-white hover:bg-primary-600;
  }

  .card {
    @apply bg-card rounded-xl p-6 shadow-sm border border-border;
  }
}
```

**utilities.css:**
```css
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
```

### 3.3 Component Extraction Best Practices

#### Avoid Premature Abstraction

**Anti-pattern:**
```css
/* Creating a class for something used once */
@layer components {
  .hero-heading {
    @apply text-4xl font-bold text-gray-900;
  }
}
```

**Better:**
```html
<h1 class="text-4xl font-bold text-gray-900">
  <!-- Used directly in template -->
</h1>
```

**Rule of thumb:** Only extract when used 3+ times or when it represents a distinct component pattern.

#### Prefer Framework Components Over @apply

**Anti-pattern:**
```css
.btn-primary {
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-500 text-white rounded;
}

.btn-large {
  @apply px-6 py-3 text-lg;
}
```

**Better (React):**
```tsx
// Button.tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
  children: React.ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'normal',
  children
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors';

  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
  };

  const sizeClasses = {
    normal: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </button>
  );
}
```

#### Use @apply Strategically

**Good use cases:**
- Very small, highly reusable elements (buttons, badges, inputs)
- Base component styles that don't need programmatic variation
- Vendor library customization where templates aren't accessible

**Poor use cases:**
- Complex components with many states
- Anything easily represented as a React/Vue/Astro component
- One-off styling patterns

### 3.4 Enterprise-Scale Organization

#### Multi-Brand/Multi-Theme Setup

**Structure:**
```
project/
├── themes/
│   ├── brand-a/
│   │   └── theme.css
│   ├── brand-b/
│   │   └── theme.css
│   └── shared/
│       └── base-theme.css
├── src/
│   ├── app-a/
│   │   └── main.css  # @import "../../themes/brand-a/theme.css"
│   └── app-b/
│       └── main.css  # @import "../../themes/brand-b/theme.css"
```

**themes/brand-a/theme.css:**
```css
@import "../shared/base-theme.css";

@theme {
  --color-primary: oklch(0.50 0.20 240);
  --color-secondary: oklch(0.70 0.15 180);
  --font-heading: "Brand A Sans", sans-serif;
}
```

#### Design System Integration

**1. Define design tokens centrally:**

```css
@theme {
  /* Spacing scale */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Typography scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* Color palette */
  --color-gray-50: oklch(0.99 0 0);
  --color-gray-100: oklch(0.97 0 0);
  /* ... */
  --color-gray-900: oklch(0.25 0 0);
}
```

**2. Document design system:**

Maintain a living style guide with:
- All available design tokens
- Component examples
- Accessibility guidelines
- Usage patterns

**3. Enforce with linting:**

```json
// .stylelintrc.json
{
  "rules": {
    "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla"],
    "declaration-property-value-disallowed-list": {
      "color": ["/^#/"],
      "background-color": ["/^#/"]
    }
  }
}
```

### 3.5 Scaling Strategies for Large Teams

#### Plugin-Based Architecture

Separate concerns by domain:

```javascript
// tailwind.config.js (if using legacy config)
module.exports = {
  plugins: [
    require('./plugins/marketing'),
    require('./plugins/dashboard'),
    require('./plugins/forms'),
  ],
};
```

Or in CSS with separate imports:

```css
@import "tailwindcss";
@import "./themes/marketing.css";
@import "./themes/dashboard.css";
@import "./themes/forms.css";
```

#### Automated Class Sorting

Use Prettier with Tailwind plugin:

```bash
npm i -D prettier prettier-plugin-tailwindcss
```

**.prettierrc:**
```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Classes automatically sort to Tailwind's recommended order.

#### Component Library Pattern

**Create a dedicated components package:**

```
packages/
├── ui/
│   ├── src/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   ├── styles/
│   │   └── theme.css
│   └── package.json
└── app/
    ├── src/
    └── package.json
```

Share components across projects while maintaining consistent styling.

### 3.6 Hybrid Architecture (Tailwind + CSS Modules)

For complex component-specific styles:

**Button.module.css:**
```css
.button {
  /* Complex styles that don't map well to utilities */
  background: linear-gradient(135deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.button::before {
  /* Pseudo-element styling */
}
```

**Button.tsx:**
```tsx
import styles from './Button.module.css';

export function Button({ children }) {
  return (
    <button className={`${styles.button} px-4 py-2 rounded-lg`}>
      {children}
    </button>
  );
}
```

**When to use this pattern:**
- Complex pseudo-elements or pseudo-classes
- Advanced selectors (`:has()`, `:nth-child()` patterns)
- Component-specific animations
- Styles that would be unwieldy with utilities

---

## 4. Performance Considerations

### 4.1 Build Performance

#### Tailwind v4 Benchmarks

**Tailwind CSS website:**
- v3: 960ms full build
- v4: 105ms full build
- **9.14x faster**

**Catalyst UI kit:**
- v3: 341ms full build
- v4: 55ms full build
- **6.2x faster**

**Incremental builds:**
- No new CSS: **182x faster** (35ms → 192µs)
- With new CSS: **8.8x faster** (44ms → 5ms)

#### Optimization Strategies

**1. Use the Vite plugin for Vite projects:**

```javascript
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [tailwindcss()],
};
```

The Vite plugin provides tighter integration and better caching.

**2. Minimize custom utilities:**

Every custom `@utility` adds to processing time. Prefer framework components.

**3. Leverage automatic content detection:**

Don't manually configure content paths unless necessary. Automatic detection is optimized.

**4. Use native CSS features:**

v4 leverages native cascade layers, `@property`, and `color-mix()` which browsers handle efficiently.

### 4.2 Runtime Performance

#### CSS Bundle Size

Most Tailwind projects ship **less than 10KB of CSS** to the client due to automatic purging of unused utilities.

**Best practices:**

**1. Avoid dynamic class construction:**

```jsx
// ❌ Bad - Tailwind can't detect these classes
const color = 'red';
<div className={`bg-${color}-500`} />

// ✅ Good - Full class names
const colorClasses = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};
<div className={colorClasses[color]} />
```

**2. Use safelist for truly dynamic classes:**

```css
@utility bg-red-500 {
  /* Force inclusion */
}

@utility bg-blue-500 {
  /* Force inclusion */
}
```

**3. Avoid unnecessary specificity:**

```html
<!-- ❌ Over-specific -->
<div class="text-gray-700 hover:text-gray-900 md:text-gray-800 md:hover:text-gray-950">

<!-- ✅ More efficient -->
<div class="text-gray-700 hover:text-gray-900">
```

#### Loading Strategy

**1. Inline critical CSS:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline critical above-the-fold styles */
    body { font-family: sans-serif; }
    .hero { /* ... */ }
  </style>
  <link rel="stylesheet" href="/styles.css">
</head>
```

**2. Use `media` attribute for conditional loading:**

```html
<link rel="stylesheet" href="/print.css" media="print">
```

**3. Preload fonts referenced in @theme:**

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
```

### 4.3 Developer Experience Performance

#### Fast Feedback Loop

v4's incremental build speed (192µs for cached builds) means:
- Near-instantaneous browser updates in dev mode
- Minimal context switching
- Better flow state

#### Automatic Content Detection Benefits

- No manual configuration updates when adding new files
- Faster onboarding for new developers
- Fewer build configuration errors

---

## 5. Accessibility Patterns with Tailwind

### 5.1 Built-in ARIA Support

Tailwind v3.2+ includes variants for ARIA attributes:

```html
<button
  role="switch"
  aria-checked="true"
  class="bg-gray-200 aria-checked:bg-blue-500"
>
  Toggle
</button>
```

**Common ARIA variants:**

- `aria-checked:*` - For checkboxes, switches
- `aria-disabled:*` - For disabled states
- `aria-expanded:*` - For accordions, dropdowns
- `aria-hidden:*` - For visibility control
- `aria-pressed:*` - For toggle buttons
- `aria-selected:*` - For tabs, listboxes
- `aria-invalid:*` - For form validation

### 5.2 Accessible Toggle Switch Pattern

```tsx
import { useState } from 'react';

export function ToggleSwitch({ label, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label class="flex items-center gap-3">
      <span class="text-sm font-medium">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className="
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors
          bg-gray-200 aria-checked:bg-blue-500
          focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        "
      >
        <span class="sr-only">{label}</span>
        <span
          className="
            inline-block h-4 w-4 rounded-full bg-white
            transition-transform
            translate-x-1 aria-checked:translate-x-6
          "
          aria-hidden="true"
        />
      </button>
    </label>
  );
}
```

### 5.3 Focus Management

#### Visible Focus Indicators

```html
<button class="
  px-4 py-2 bg-blue-500 text-white rounded
  focus-visible:outline-2 focus-visible:outline-blue-700 focus-visible:outline-offset-2
">
  Accessible Button
</button>
```

**Best practices:**
- Always provide focus indicators
- Use `focus-visible:*` instead of `focus:*` to avoid visual clutter on click
- Ensure 3:1 contrast ratio for focus indicators
- Minimum 2px focus outline

#### Skip Links

```html
<a
  href="#main-content"
  class="
    sr-only focus:not-sr-only
    focus:absolute focus:top-4 focus:left-4
    focus:z-50 focus:px-4 focus:py-2
    focus:bg-white focus:text-blue-700
    focus:rounded focus:shadow-lg
  "
>
  Skip to main content
</a>

<main id="main-content">
  <!-- Content -->
</main>
```

### 5.4 Screen Reader Utilities

#### sr-only Class

```html
<button>
  <svg class="w-5 h-5" aria-hidden="true">
    <!-- Icon -->
  </svg>
  <span class="sr-only">Close dialog</span>
</button>
```

#### Conditional Screen Reader Text

```html
<div class="flex items-center gap-2">
  <span class="text-green-600">✓</span>
  <span>Verified</span>
  <span class="sr-only">account status</span>
</div>
```

### 5.5 Group and Peer ARIA Variants

```html
<!-- Parent controls child styling based on ARIA state -->
<div class="group">
  <button aria-expanded="false" class="...">
    Accordion Header
  </button>
  <div class="hidden group-aria-expanded:block">
    Accordion content
  </div>
</div>

<!-- Sibling controls styling -->
<div>
  <input
    type="text"
    aria-invalid="true"
    class="peer border-gray-300 aria-invalid:border-red-500"
  />
  <p class="hidden peer-aria-invalid:block text-red-600 text-sm">
    Please enter a valid value
  </p>
</div>
```

### 5.6 Motion Preferences

```html
<div class="
  transition-transform duration-300
  motion-reduce:transition-none
  hover:scale-105 motion-reduce:hover:scale-100
">
  <!-- Respects prefers-reduced-motion -->
</div>
```

**Animation best practices:**
- Always provide `motion-reduce:*` alternatives
- Disable autoplay for users preferring reduced motion
- Use `transition-discrete` for enter/exit animations

```css
@media (prefers-reduced-motion: reduce) {
  @theme {
    --animate-*: initial;
  }
}
```

### 5.7 Color Contrast

#### Tailwind's Default Palette

Tailwind's default colors are designed with WCAG AA compliance in mind:

- Gray 900 on white: ✅ AAA (>7:1)
- Gray 700 on white: ✅ AA (>4.5:1)
- Gray 600 on white: ⚠️ Borderline
- Gray 500 on white: ❌ Fails

**Verify custom colors:**

```css
@theme {
  /* Use oklch for perceptually uniform lightness */
  --color-text: oklch(0.25 0 0);        /* Dark text */
  --color-background: oklch(1 0 0);     /* Light background */
  --color-text-secondary: oklch(0.45 0 0); /* Gray text (AA compliant) */
}
```

Tools:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible color palette generator](https://accessiblepalette.com/)

### 5.8 Semantic HTML + Tailwind

```html
<!-- ❌ Bad - Divs for everything -->
<div class="flex items-center gap-4">
  <div class="cursor-pointer" onclick="navigate()">Home</div>
  <div class="cursor-pointer" onclick="navigate()">About</div>
</div>

<!-- ✅ Good - Semantic HTML -->
<nav class="flex items-center gap-4" aria-label="Main navigation">
  <a href="/" class="text-blue-600 hover:underline">Home</a>
  <a href="/about" class="text-blue-600 hover:underline">About</a>
</nav>
```

### 5.9 Accessible Form Patterns

```html
<div class="space-y-2">
  <label for="email" class="block text-sm font-medium">
    Email address
  </label>
  <input
    type="email"
    id="email"
    aria-describedby="email-error"
    aria-invalid="true"
    class="
      w-full px-3 py-2 border rounded
      border-gray-300 aria-invalid:border-red-500
      focus-visible:ring-2 focus-visible:ring-blue-500
    "
  />
  <p id="email-error" class="text-sm text-red-600">
    Please enter a valid email address
  </p>
</div>
```

### 5.10 Accessibility Checklist

- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators have 3:1 contrast ratio
- ✅ Text has 4.5:1 contrast (AA) or 7:1 (AAA)
- ✅ ARIA attributes are accurate and up-to-date
- ✅ Screen reader text provided where visual context exists
- ✅ Animations respect `prefers-reduced-motion`
- ✅ Forms have associated labels and error messages
- ✅ Semantic HTML used where possible
- ✅ Images have `alt` attributes
- ✅ Headings follow logical hierarchy (h1 → h2 → h3)

---

## 6. Integration with Astro and React

### 6.1 Astro Integration

#### Official Support

As of **Astro 5.2 (January 2025)**, Tailwind v4 is officially supported via the `@tailwindcss/vite` plugin.

#### Setup

**1. Install dependencies:**

```bash
npm install tailwindcss @tailwindcss/vite
```

**2. Configure Astro:**

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**3. Create CSS file:**

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.72 0.11 221.19);
  --font-body: Inter, sans-serif;
}
```

**4. Import in layout:**

```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>My Site</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

#### Important Notes

**Old `@astrojs/tailwind` integration:**
- Deprecated for Tailwind v4
- Uninstall and use `@tailwindcss/vite` directly
- Migration guide: https://docs.astro.build/en/guides/integrations-guide/tailwind/

#### Astro Component Example

```astro
---
// src/components/Card.astro
export interface Props {
  title: string;
  description: string;
  variant?: 'default' | 'highlighted';
}

const { title, description, variant = 'default' } = Astro.props;

const variantClasses = {
  default: 'bg-white border-gray-200',
  highlighted: 'bg-blue-50 border-blue-300',
};
---

<article class={`
  rounded-xl border p-6 shadow-sm
  ${variantClasses[variant]}
`}>
  <h3 class="text-xl font-semibold mb-2">{title}</h3>
  <p class="text-gray-600">{description}</p>
</article>
```

#### Astro + React Components

```bash
npm install @astrojs/react react react-dom
```

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**React component in Astro:**

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div class="flex items-center gap-4">
      <button
        onClick={() => setCount(count - 1)}
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        -
      </button>
      <span class="text-2xl font-bold">{count}</span>
      <button
        onClick={() => setCount(count + 1)}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        +
      </button>
    </div>
  );
}
```

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import { Counter } from '../components/Counter';
---

<Layout>
  <main class="container mx-auto p-8">
    <h1 class="text-4xl font-bold mb-8">Interactive Counter</h1>
    <Counter client:load />
  </main>
</Layout>
```

### 6.2 React Integration

#### Setup with Vite

**1. Create React app:**

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
```

**2. Install Tailwind:**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

**3. Configure Vite:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**4. Setup CSS:**

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.55 0.25 262);
  --color-secondary: oklch(0.75 0.15 195);
}
```

**5. Import in main:**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### Reusable Component Patterns

**Button Component:**

```tsx
// src/components/Button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-600 focus-visible:ring-primary',
      secondary: 'bg-secondary text-white hover:bg-secondary-600 focus-visible:ring-secondary',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-primary',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

**Usage:**

```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>
```

#### Class Name Management

**Using `clsx` for conditional classes:**

```bash
npm install clsx
```

```tsx
import clsx from 'clsx';

interface CardProps {
  title: string;
  featured?: boolean;
  className?: string;
}

export function Card({ title, featured, className }: CardProps) {
  return (
    <div className={clsx(
      'rounded-xl p-6 shadow-sm',
      featured ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200',
      className
    )}>
      <h3 class="text-xl font-semibold">{title}</h3>
    </div>
  );
}
```

**Using `tailwind-merge` to handle conflicts:**

```bash
npm install tailwind-merge
```

```tsx
import { twMerge } from 'tailwind-merge';

export function Card({ className, ...props }: CardProps) {
  return (
    <div className={twMerge(
      'rounded-xl p-6 bg-white',
      className  // User's classes override defaults
    )}>
      {/* ... */}
    </div>
  );
}
```

**Best of both worlds - `cn` helper:**

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
import { cn } from '@/lib/utils';

export function Card({ featured, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-xl p-6',
      featured && 'bg-blue-50 border-blue-500',
      className
    )}>
      {/* ... */}
    </div>
  );
}
```

#### TypeScript + Tailwind Best Practices

**Type-safe variant props:**

```tsx
import { type VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-600',
        secondary: 'bg-secondary text-white hover:bg-secondary-600',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### 6.3 Framework-Agnostic Best Practices

#### Component Prop Patterns

**Avoid passing raw classNames:**

```tsx
// ❌ Anti-pattern
<Button className="bg-red-500 text-white px-4 py-2" />

// ✅ Better
<Button variant="danger" size="md" />
```

**When to allow className overrides:**

```tsx
// Layout components that need flexibility
<Container className="max-w-screen-2xl">

// Utility wrappers
<Stack spacing="4" className="md:flex-row">
```

#### Composition Over Configuration

```tsx
// ✅ Flexible composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// ❌ Rigid configuration
<Card
  title="Title"
  content="Content"
  footerButton="Action"
/>
```

---

## 7. Recommendations and Action Items

### 7.1 For New Projects

1. **Start with Tailwind v4** - No reason to use v3 for greenfield projects
2. **Use the Vite plugin** - Best performance and developer experience
3. **Define @theme early** - Establish design tokens before building components
4. **Prefer framework components** - Minimize `@apply` usage
5. **Setup Prettier plugin** - Automatic class sorting from day one
6. **Plan dark mode strategy** - Use design token approach for scalability

### 7.2 For Existing Projects

1. **Test migration in a branch** - Use `npx @tailwindcss/upgrade`
2. **Verify browser support** - Ensure Safari 16.4+, Chrome 111+, Firefox 128+
3. **Audit custom utilities** - Convert `@layer utilities` to `@utility`
4. **Update CI/CD** - New CLI package and build commands
5. **Train team** - New `@theme` syntax and conventions
6. **Update documentation** - Revise style guides and component libraries

### 7.3 Performance Optimization Checklist

- ✅ Use `@tailwindcss/vite` plugin for Vite projects
- ✅ Avoid dynamic class construction
- ✅ Minimize custom utilities and `@apply` usage
- ✅ Leverage automatic content detection
- ✅ Implement design token approach for theming
- ✅ Use native CSS features (cascade layers, `@property`, `color-mix()`)
- ✅ Setup proper caching headers for CSS files
- ✅ Consider critical CSS inlining for above-fold content

### 7.4 Accessibility Checklist

- ✅ Use ARIA variants (`aria-checked:*`, `aria-disabled:*`, etc.)
- ✅ Implement visible focus indicators with `focus-visible:*`
- ✅ Provide screen reader text with `sr-only`
- ✅ Respect motion preferences with `motion-reduce:*`
- ✅ Ensure 4.5:1 text contrast minimum
- ✅ Use semantic HTML
- ✅ Test with keyboard navigation
- ✅ Validate with automated tools (axe, Lighthouse)

### 7.5 Team Collaboration

1. **Establish conventions** - Document when to use `@apply` vs components
2. **Code review guidelines** - Ensure accessibility and performance standards
3. **Component library** - Build reusable patterns with clear APIs
4. **Design system documentation** - Living style guide with examples
5. **Linting and formatting** - Enforce consistency automatically
6. **Regular audits** - Review bundle size, accessibility, performance

---

## 8. Conclusion

Tailwind CSS v4 represents a mature, thoughtful evolution of the utility-first approach. The shift to CSS-first configuration via `@theme` aligns with modern web standards while dramatically improving performance. For teams building with Astro, React, or other modern frameworks, v4 offers:

- **10x faster builds** through the Oxide engine
- **Simpler setup** with zero configuration by default
- **Better theming** via native CSS variables
- **Modern CSS features** like cascade layers and `@property`
- **Improved accessibility** with ARIA variants
- **Excellent framework integration** via first-party plugins

The migration path from v3 is well-supported with automated tooling, and the framework continues to prioritize developer experience without compromising on performance or capabilities.

For organizations considering Tailwind v4, the benefits clearly outweigh the migration costs, especially for projects that can meet the modern browser requirements.

---

## 9. Sources

### Official Documentation
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Upgrade guide - Tailwind CSS](https://tailwindcss.com/docs/upgrade-guide)
- [Theme variables - Tailwind CSS](https://tailwindcss.com/docs/theme)
- [Dark mode - Tailwind CSS](https://tailwindcss.com/docs/dark-mode)
- [Reusing Styles - Tailwind CSS](https://tailwindcss.com/docs/reusing-styles)
- [astrojs/tailwind - Astro Docs](https://docs.astro.build/en/guides/integrations-guide/tailwind/)
- [Astro 5.2](https://astro.build/blog/astro-520/)

### Migration Guides
- [Migration from v3 to v4 | DeepWiki](https://deepwiki.com/tailwindlabs/tailwindcss/5-migration-from-v3-to-v4)
- [What's New and Migration Guide: Tailwind CSS v4.0](https://dev.to/kasenda/whats-new-and-migration-guide-tailwind-css-v40-3kag)
- [Real-World Migration Steps from Tailwind CSS v3 to v4](https://dev.to/mridudixit15/real-world-migration-steps-from-tailwind-css-v3-to-v4-1nn3)

### Features and Updates
- [Tailwind CSS v4 Is Here: All the Updates You Need to Know](https://khushil21.medium.com/tailwind-css-v4-is-here-all-the-updates-you-need-to-know-394645b53755)
- [What's New in Tailwind CSS 4.0 – Full Feature Breakdown](https://staticmania.com/blog/tailwind-css-4-key-updates)
- [Everything you need to know about Tailwind CSS v4](https://tailkit.com/blog/everything-you-need-to-know-about-tailwind-css-v4)

### Best Practices
- [Tailwind CSS 4 Best Practices for Enterprise-Scale Projects (2025 Playbook)](https://medium.com/@sureshdotariya/tailwind-css-4-best-practices-for-enterprise-scale-projects-2025-playbook-bf2910402581)
- [How to Master Tailwind CSS: Best Practices 2025](https://www.bootstrapdash.com/blog/tailwind-css-best-practices)
- [Best Practices for Using Tailwind CSS in Large Projects](https://www.wisp.blog/blog/best-practices-for-using-tailwind-css-in-large-projects)
- [Tailwind CSS Best Practices for Enterprise Projects](https://sanfordev.com/blog/tailwind-best-practices/)
- [Best Practices for Writing Scalable Tailwind CSS Code](https://scriptbinary.com/tailwind/scalable-tailwind-css-best-practices)

### Theme and Customization
- [How to use custom color themes in TailwindCSS v4](https://stackoverflow.com/questions/79499818/how-to-use-custom-color-themes-in-tailwindcss-v4)
- [Goodbye tailwind.config.js? TailwindCSS v4's New CSS-First Setup](https://medium.com/@rohantgeorge05/goodbye-tailwind-config-js-tailwindcss-v4s-new-css-first-setup-explained-with-react-vite-496aabdd1457)
- [A First Look at Setting Up Tailwind CSS v4.0](https://bryananthonio.com/blog/configuring-tailwind-css-v4/)
- [Build a Flawless, Multi-Theme System using New Tailwind CSS v4 & React](https://medium.com/render-beyond/build-a-flawless-multi-theme-ui-using-new-tailwind-css-v4-react-dca2b3c95510)
- [Dark Mode with Design Tokens in Tailwind CSS](https://www.richinfante.com/2024/10/21/tailwind-dark-mode-design-tokens-themes-css)

### Performance
- [Tailwind CSS v4.0: 40% Faster Builds & Performance Guide](https://medium.com/@mernstackdevbykevin/tailwind-css-v4-0-performance-boosts-build-times-jit-more-abf6b75e37bd)
- [Tailwind CSS v4: What's New and Why It Matters for Developers in 2025](https://medium.com/@asierr/tailwind-css-v4-whats-new-and-why-it-matters-for-developers-in-2025-5df81fd2b8b5)
- [Optimizing for Production - Tailwind CSS](https://v3.tailwindcss.com/docs/optimizing-for-production)

### Accessibility
- [Tying Tailwind styling to ARIA attributes](https://dev.to/philw_/tying-tailwind-styling-to-aria-attributes-502f)
- [Creating an Accessible Toggle Switch in Tailwind CSS](https://dockyard.com/blog/2024/05/28/creating-an-accessible-toggle-switch-in-tailwindcss)
- [Accessibility Beyond Compliance: Real Patterns for React and Tailwind](https://www.maxitect.blog/posts/accessibility-beyond-compliance-real-patterns-for-react-and-tailwind)
- [Building Accessible UI with Tailwind CSS and ARIA](https://www.bahaj.dev/blog/building-accessible-ui-with-tailwind-css-and-aria)
- [ARIA Integration | Tailwind](https://stevekinney.com/courses/tailwind/aria-integration)

### Framework Integration
- [How to Use Tailwind CSS v4 in Astro](https://dev.to/dipankarmaikap/how-to-use-tailwind-css-v4-in-astro-31og)
- [How to setup Tailwind CSS v4.1.5 with Vite + React (2025 updated guide)](https://dev.to/imamifti056/how-to-setup-tailwind-css-v415-with-vite-react-2025-updated-guide-3koc)
- [Install Tailwind CSS with Vite (v4 Plugin Guide)](https://tailkits.com/blog/install-tailwind-css-with-vite/)
- [Setting Up Tailwind CSS with Vite: A Quick and Easy Guide](https://amandeepkochhar.medium.com/2025-setting-up-tailwind-css-with-vite-a-quick-and-easy-guide-86f15335f401)

### Component Patterns
- [Building reusable React components using Tailwind CSS](https://blog.logrocket.com/building-reusable-react-components-using-tailwind-css/)
- [Component Abstraction: Writing Reusable UI with Tailwind + React](https://tryhoverify.com/blog/component-abstraction-writing-reusable-ui-with-tailwind-react/)
- [Tailwind Best Practices: Structuring Utility Classes, Creating Reusable Components](https://blogs.neutronlabs.tech/blog/tailwind-utility-classes-reusable-components)
- [Building Reusable React Components Using Tailwind](https://www.smashingmagazine.com/2020/05/reusable-react-components-tailwind/)

---

**Report Generated:** November 30, 2025
**Tailwind CSS Version:** v4.0 (stable)
**Last Updated:** January 2025
