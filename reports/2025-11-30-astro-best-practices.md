# Astro 5.x Best Practices Guide (2024-2025)

**Report Date:** November 30, 2025
**Framework Version:** Astro 5.x
**Research Focus:** Current best practices for production-ready Astro development

---

## Table of Contents

1. [Project Structure and Organization Patterns](#project-structure-and-organization-patterns)
2. [Content Collections Best Practices](#content-collections-best-practices)
3. [TypeScript Configuration Recommendations](#typescript-configuration-recommendations)
4. [Performance Optimization Techniques](#performance-optimization-techniques)
5. [Security Best Practices](#security-best-practices)
6. [Testing Approaches for Astro Projects](#testing-approaches-for-astro-projects)
7. [Static Site Generation Patterns](#static-site-generation-patterns)

---

## 1. Project Structure and Organization Patterns

### Standard Directory Layout

Astro projects follow an opinionated folder structure that balances convention with flexibility:

```
project-root/
├── src/
│   ├── pages/          # Required - defines routes
│   ├── components/     # Reusable components (Astro, React, Vue, etc.)
│   ├── layouts/        # Page layout templates
│   ├── styles/         # CSS/Sass files
│   ├── content/        # Content collections (Markdown, MDX, etc.)
│   └── middleware/     # Request/response processing
├── public/             # Static assets (copied as-is)
├── astro.config.mjs    # Astro configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

### Key Directory Guidelines

**`src/pages/` - Required Directory**

- The only mandatory directory in Astro projects
- Files here automatically become routes based on file-based routing
- Without it, your site will have no pages or routes
- Supports `.astro`, `.md`, `.mdx`, and framework component files

**`src/components/` - Recommended Convention**

- Store reusable UI components (Astro and framework components)
- Optional but highly recommended for organization
- Can be organized by feature, type, or framework

**`src/layouts/` - Layout Templates**

- Define shared UI structures across multiple pages
- Common layouts: BaseLayout, BlogPostLayout, DocumentationLayout
- Conventional but not mandatory

**`src/content/` - Content Collections**

- Organize collections with each subdirectory representing a named collection
- While Astro 5's Content Layer API allows collections anywhere, this structure maintains clarity
- Example: `src/content/blog/`, `src/content/docs/`

**`public/` - Static Assets**

- Files served untouched during builds
- Not bundled or optimized by Astro
- Ideal for: `robots.txt`, `favicon.ico`, manifests, pre-optimized images
- Referenced in HTML with root-relative paths: `/favicon.ico`

### File Naming Conventions

**Component Files:**

- Use `.astro` for reusable components and page layouts
- Only `.astro` files can handle Astro API calls like `getStaticPaths()`
- Framework components (`.jsx`, `.vue`, `.svelte`) for interactive elements

**Consistent Naming:**

- Use lowercase with dashes instead of spaces: `blog-post.astro`, `user-profile.tsx`
- Makes content easier to find and organize
- Improves cross-platform compatibility

### Project Organization Recommendations

1. **Modular Development:** Organize components by feature or domain
2. **Code Splitting:** Astro handles this by default for optimal loading
3. **Import Aliases:** Configure path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@content/*": ["src/content/*"]
    }
  }
}
```

---

## 2. Content Collections Best Practices

### Content Layer API (Astro 5.0)

Astro 5.0 introduces the Content Layer API, a fundamental improvement for content management:

- **Unified, type-safe API** for defining, loading, and accessing content
- **Works with any source:** local files, APIs, databases, CMS platforms
- **Performance gains:** 5x faster builds for Markdown, 2x faster for MDX
- **Memory efficiency:** 25-50% reduction in memory usage

### Setting Up Content Collections

**1. Create Configuration File**

Create `src/content.config.ts` (or `.js`, `.mjs`):

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    image: z.object({
      src: z.string(),
      alt: z.string()
    }).optional()
  })
});

export const collections = { blog };
```

**2. TypeScript Requirements**

Ensure these settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true
  }
}
```

Recommended: Use `"strict": true` or extend `astro/tsconfigs/strict` for full type safety.

### Schema Validation Best Practices

**Always Define Schemas**

While optional, schemas are highly recommended because they:
- Enforce consistent frontmatter structure
- Provide automatic TypeScript typings
- Enable property autocompletion in editors
- Catch validation errors during builds

**Use Zod Effectively**

```typescript
import { z } from 'astro:content';

// Make fields optional explicitly
const schema = z.object({
  title: z.string(),                    // Required
  subtitle: z.string().optional(),      // Optional
  publishDate: z.date().transform((date) => new Date(date)), // Transform
  status: z.enum(['draft', 'published', 'archived']), // Enum
  readingTime: z.number().positive(),   // Validated number
  tags: z.array(z.string()).default([]) // Default value
});
```

**Key Zod Patterns:**

- Everything is required by default - use `.optional()` explicitly
- Use `.transform()` for data conversion (strings to dates, etc.)
- Use `.default()` to provide fallback values
- Use `.enum()` for constrained string values

### Collection Organization

**Separate Collections by Content Type**

If content represents different structures, use separate collections:

```
src/content/
├── blog/          # Blog posts
├── docs/          # Documentation
├── authors/       # Author profiles
└── projects/      # Project showcases
```

**Cross-Collection References**

Use the `reference()` function for relationships:

```typescript
import { defineCollection, z, reference } from 'astro:content';

const authors = defineCollection({
  schema: z.object({
    name: z.string(),
    bio: z.string()
  })
});

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    author: reference('authors'),        // Single reference
    relatedPosts: z.array(reference('blog')).optional() // Multiple
  })
});
```

### Querying Content Collections

**Type-Safe Queries**

```typescript
import { getCollection, getEntry } from 'astro:content';

// Get all entries
const allPosts = await getCollection('blog');

// Filter entries
const publishedPosts = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});

// Get single entry
const post = await getEntry('blog', 'my-first-post');
```

**Typing Component Props**

```typescript
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
---
```

### Content Collection Maintenance

**Development Workflow**

1. **Restart dev server** or use sync command (`s + enter`) after schema changes
2. **Add `.astro` to `.gitignore`** - contains generated types
3. **Use consistent naming** for file slugs to ensure predictable URLs

**Production Considerations**

- Filter draft content in production builds
- Leverage incremental content caching for faster builds
- Use loaders for remote content sources (CMS, APIs)

---

## 3. TypeScript Configuration Recommendations

### Recommended Strictness Levels

Astro provides three TypeScript configuration presets:

1. **`base`** - Minimal TypeScript support, permissive
2. **`strict`** - Recommended for TypeScript projects
3. **`strictest`** - Maximum type safety

**Recommendation:** Use `strict` or `strictest` for production projects.

### Strict Configuration

**Extending Astro's Strict Preset:**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@utils/*": ["src/utils/*"]
    },
    "verbatimModuleSyntax": true
  }
}
```

### Key Compiler Options

**Essential Settings:**

```json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "strictNullChecks": true,          // Required for content collections
    "allowJs": true,                   // Support .js files
    "verbatimModuleSyntax": true,      // Enforce type imports
    "isolatedModules": true,           // Ensure file-level transpilation
    "skipLibCheck": true,              // Speed up compilation
    "moduleResolution": "bundler",     // Modern module resolution
    "jsx": "react-jsx"                 // For JSX support
  }
}
```

**Verbatim Module Syntax**

Enabled by default in Astro's presets, this setting enforces `import type` for types:

```typescript
// Correct
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

// Error - type should use 'import type'
import { CollectionEntry, getCollection } from 'astro:content';
```

### Multiple JSX Framework Configuration

When using multiple frameworks (React, Preact, Solid), configure per-file JSX:

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"  // Default framework
  }
}
```

**Per-File Override:**

```tsx
/** @jsxImportSource preact */
import { h } from 'preact';

export function PreactComponent() {
  return <div>Preact Component</div>;
}
```

### Path Aliases Best Practices

**Organize imports with clear aliases:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@lib/*": ["src/lib/*"],
      "@utils/*": ["src/utils/*"],
      "@content/*": ["src/content/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

**Usage:**

```typescript
// Instead of: import { formatDate } from '../../../utils/date';
import { formatDate } from '@utils/date';
```

### Type Generation and Validation

**Automatic Type Generation**

Astro automatically generates types for:
- Content collections schemas
- Environment variables (via `astro:env`)
- Route parameters

**Manual Sync**

Force type regeneration:
```bash
npx astro sync
```

Do this when:
- Adding new content collections
- Modifying collection schemas
- After pulling changes from version control

### Editor Integration

**VS Code Configuration**

Install the official Astro extension for:
- Syntax highlighting for `.astro` files
- TypeScript IntelliSense
- Code formatting
- Error checking
- Debugging support

**Why tsconfig.json Matters**

Even if not writing TypeScript, `tsconfig.json` enables:
- NPM package imports in the editor
- Framework component type checking
- Better autocompletion
- Import path resolution

---

## 4. Performance Optimization Techniques

### Astro 5.0 Built-in Improvements

**Content Layer Performance**

Astro 5.0 delivers significant build performance improvements:
- **5x faster** for Markdown pages on content-heavy sites
- **2x faster** for MDX content
- **25-50% reduction** in memory usage

**Server Islands Architecture**

Server Islands extend the Islands Architecture to the server, enabling:
- Static HTML caching on Edge CDNs
- Independent loading of dynamic components
- Custom fallback content during island loading
- Individual cache lifetime per island

### Build Optimization Strategies

Real-world optimization can improve build speed from 35 pages/second to 127 pages/second (3.6x improvement):

**1. Upgrade Node.js and Astro**

```bash
# Use latest LTS Node.js version
node --version  # Should be v20+ or v22+

# Keep Astro updated
npm update astro
```

Expected improvement: ~30% faster builds

**2. Increase Memory Allocation**

```bash
# In package.json scripts
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=8192' astro build"
  }
}
```

Benefits:
- Reduced garbage collection pauses
- Eliminated memory-related crashes
- Faster processing of large sites

**3. Configure Build Concurrency**

```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    concurrency: 4  // Adjust based on CPU cores
  }
});
```

Optimal settings:
- 4 for most systems
- Too high causes resource contention
- Too low underutilizes CPU

**4. Implement API Caching**

Problem: Individual API calls per page during build significantly increase build times.

Solution: Cache API responses in `getStaticPaths()`:

```typescript
// Bad: API call in component (runs for each page)
---
const data = await fetch('https://api.example.com/data');
---

// Good: Cache in getStaticPaths (runs once)
export async function getStaticPaths() {
  const data = await fetch('https://api.example.com/data');
  const items = await data.json();

  return items.map(item => ({
    params: { slug: item.slug },
    props: { item }  // Pass as props
  }));
}
```

**5. Move Large Assets to CDN**

```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    assets: 'assets'  // Customize asset directory
  }
});
```

Benefits:
- Reduced build time (no processing of large files)
- Faster page loads
- Lower hosting costs

### Image Optimization

**Use Modern Formats**

```astro
---
import { Image } from 'astro:assets';
import heroImage from '@assets/hero.jpg';
---

<Image
  src={heroImage}
  alt="Hero image"
  format="webp"           // or 'avif'
  quality={80}
  loading="lazy"
  widths={[400, 800, 1200]}
  sizes="(max-width: 800px) 100vw, 800px"
/>
```

Best practices:
- **WebP/AVIF:** Smaller file sizes, better quality
- **Responsive widths:** Load appropriate sizes per screen
- **Lazy loading:** Load images only when in viewport
- **Quality settings:** 80-85 is often sufficient

**Image Component Benefits**

Astro's `<Image>` component automatically:
- Optimizes images during build
- Generates multiple sizes
- Serves modern formats with fallbacks
- Adds proper width/height attributes (prevents layout shift)

### CSS Optimization

**Automatic Optimizations**

Astro handles CSS optimization by default:
- Minification
- Purification (removes unused styles)
- Critical CSS extraction
- Scoped styles per component

**Best Practices**

```astro
---
// Component-scoped styles (recommended)
---
<style>
  h1 {
    color: var(--primary-color);
  }
</style>

<!-- Or global styles when needed -->
<style is:global>
  :root {
    --primary-color: #3b82f6;
  }
</style>
```

**Code Splitting**

Astro automatically splits code:
- Each page gets only its required JavaScript
- Components are bundled efficiently
- Shared dependencies are extracted

### Incremental Content Caching

Enable for large content sites:

```javascript
// astro.config.mjs
export default defineConfig({
  experimental: {
    contentCollectionCache: true
  }
});
```

Benefits:
- Reuses unchanged content entries
- Dramatically speeds up incremental builds
- Tracks changes via internal build manifest

### Runtime Performance

**Minimize JavaScript**

Astro's HTML-first philosophy:
- Zero JavaScript by default
- Add interactivity only where needed
- Framework components are islands of interactivity

**View Transitions**

Smooth page transitions without JavaScript overhead:

```astro
---
import { ViewTransitions } from 'astro:transitions';
---
<head>
  <ViewTransitions />
</head>
```

**Prefetching**

```astro
<a href="/about" data-astro-prefetch>About</a>
```

---

## 5. Security Best Practices

### Content Security Policy (CSP)

**Astro 5.9 CSP Support**

Astro 5.9 introduces experimental built-in CSP support - the framework's most upvoted feature request:

```javascript
// astro.config.mjs
export default defineConfig({
  experimental: {
    security: {
      csp: true
    }
  }
});
```

**Benefits:**

- Ditch `unsafe-inline` workarounds
- Works with all adapters and runtimes
- Supports static sites, serverless, Node.js, edge runtimes
- Compatible with all frontend libraries

**Hash-Based CSP Implementation**

Astro uses hash-based CSP instead of nonces:
- Generates hashes for every script and stylesheet
- More complex but supports more use cases
- Works with static sites (nonce headers don't)

**CSP via Meta Tag**

For static sites and SPAs, Astro uses:

```html
<meta http-equiv="content-security-policy" content="...">
```

This approach works everywhere, not just server-rendered pages.

### Static Site Security Advantages

**Inherent Security Benefits:**

1. **Reduced Attack Surface:** Pre-built HTML with minimal JavaScript
2. **No Server-Side Processing:** Can't exploit server vulnerabilities
3. **XSS Protection:** Static content can't inject malicious scripts
4. **No Database:** No SQL injection risks
5. **Faster Patches:** Rebuild and redeploy quickly

**Default Security Posture**

Astro renders entire pages to static HTML by default:
- Removes all JavaScript from final build (unless explicitly added)
- No runtime code execution vulnerabilities
- Combines performance with security

### Environment Variable Security

**Type-Safe Environment Variables (astro:env)**

```typescript
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      // Public client variable
      PUBLIC_API_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://api.example.com"
      }),

      // Public server variable
      BUILD_TIME: envField.string({
        context: "server",
        access: "public"
      }),

      // Secret server variable
      API_SECRET: envField.string({
        context: "server",
        access: "secret"
      }),

      // Optional with validation
      DB_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true
      })
    },
    validateSecrets: true  // Validate on start
  }
});
```

**Security Rules:**

- **Client variables:** Available in browser (public data only)
- **Server variables:** Server-side only, not in client bundle
- **Secrets:** Never exposed to client, validated at runtime
- **No client secrets:** Framework prevents this (no safe way to send)

**Usage:**

```typescript
// Server-side only
import { API_SECRET } from 'astro:env/server';

// Client and server
import { PUBLIC_API_URL } from 'astro:env/client';
```

### Security Best Practices Checklist

**Environment Variables:**

- ✅ Never hardcode sensitive information
- ✅ Use `.env` files, add to `.gitignore`
- ✅ Use `astro:env` for type safety
- ✅ Rotate secrets regularly
- ✅ Apply least privilege principle
- ✅ Use different secrets for dev/staging/production

**Content Security:**

- ✅ Enable CSP in production
- ✅ Validate user-generated content
- ✅ Sanitize Markdown/MDX inputs
- ✅ Use trusted content sources

**Dependency Security:**

```bash
# Audit dependencies regularly
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

**Headers and Configuration:**

```javascript
// astro.config.mjs
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=()'
    }
  }
});
```

### Static Site Generation Security

**Build-Time Security:**

- Environment variables evaluated at build time
- Can't change after deployment
- Predictable, immutable output

**Best Practices:**

1. **Validate inputs** at build time
2. **Use CSP** to lock down allowed resources
3. **Implement ISR** carefully - understand caching implications
4. **Audit third-party scripts** before including
5. **Monitor dependencies** for vulnerabilities

---

## 6. Testing Approaches for Astro Projects

### Testing Strategy Overview

Astro supports comprehensive testing approaches:
- **Unit tests:** Test individual functions and utilities
- **Component tests:** Test Astro and framework components
- **End-to-end tests:** Test complete user flows

Recommended tools:
- **Vitest:** Unit and component testing
- **Playwright:** End-to-end testing
- **Cypress:** Alternative E2E option

### Vitest Setup for Unit Testing

**Installation:**

```bash
npm install -D vitest
```

**Configuration (vitest.config.ts):**

```typescript
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    globals: true,
    environment: 'happy-dom'  // or 'jsdom'
  }
});
```

**Key Points:**

- Use `getViteConfig()` to integrate with Astro's settings
- Auto-detects Astro config by default
- Choose DOM library: `happy-dom` (faster) or `jsdom` (more compatible)

**Custom Configuration (Astro 4.8+):**

```typescript
export default getViteConfig(
  { test: { /* ... */ } },
  {
    site: 'https://example.com',
    trailingSlash: 'always'
  }
);
```

### Component Testing with Container API

**Astro 4.9+ Container API**

The Container API enables native Astro component testing:

```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from '../src/components/Card.astro';

test('Card component renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    props: {
      title: 'Test Card',
      description: 'Test description'
    }
  });

  expect(result).toContain('Test Card');
  expect(result).toContain('Test description');
});
```

**Testing with Slots:**

```typescript
test('Card with slot content', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    slots: {
      default: '<p>Slot content</p>'
    }
  });

  expect(result).toContain('Slot content');
});
```

**Environment Configuration:**

```typescript
// At top of test file
/// @vitest-environment happy-dom

import { expect, test } from 'vitest';
```

### Vitest 2.0 Browser Mode

**Enhanced Component Testing:**

Vitest 2.0 introduced Browser Mode:
- Built on Playwright
- Renders components in iframe with real browser events
- More accurate than JSDOM
- Less error-prone than snapshot testing

**Configuration:**

```typescript
export default {
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright'
    }
  }
};
```

### Compatibility Considerations

**Astro 5 + Vitest Issues:**

Recent compatibility notes:
- Vitest reverted Vite 6 support in v2.1.7
- Update to Vitest 3.0.5+ for Astro 5 compatibility
- "test does not exist" errors indicate version conflicts

**Solution:**

```bash
npm install -D vitest@latest
```

### Playwright Setup for E2E Testing

**Installation:**

```bash
npm init playwright@latest
```

**Configuration (playwright.config.ts):**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  baseURL: 'http://localhost:4321',

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI
  },

  use: {
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    }
  ]
});
```

**Example E2E Test:**

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check page title
  await expect(page).toHaveTitle(/My Astro Site/);

  // Check heading
  const heading = page.locator('h1');
  await expect(heading).toHaveText('Welcome to Astro');

  // Test navigation
  await page.click('a[href="/about"]');
  await expect(page).toHaveURL(/about/);
});

test('blog posts load', async ({ page }) => {
  await page.goto('/blog');

  const articles = page.locator('article');
  await expect(articles).toHaveCount(3);
});
```

**Running Tests:**

```bash
# Run all tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# View test report
npx playwright show-report
```

### Testing Best Practices

**1. Test Production Builds**

```bash
# Build first
npm run build

# Test against preview
npm run preview
npx playwright test
```

Production builds may differ from development.

**2. Test Real Deployments**

```typescript
// playwright.config.ts for production
export default defineConfig({
  baseURL: process.env.PRODUCTION_URL || 'http://localhost:4321'
});
```

**3. Organize Tests**

```
tests/
├── unit/              # Vitest unit tests
│   ├── utils.test.ts
│   └── helpers.test.ts
├── component/         # Vitest component tests
│   ├── Card.test.ts
│   └── Navigation.test.ts
└── e2e/              # Playwright E2E tests
    ├── homepage.spec.ts
    └── blog.spec.ts
```

**4. Test Framework Components**

For React/Vue/Svelte components, use framework-specific testing libraries:

```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import ReactButton from '../src/components/ReactButton';

test('React button renders', () => {
  render(<ReactButton label="Click me" />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

**5. Client-Side Testing**

For now, test client-side Astro component code with E2E tests (Playwright/Cypress) rather than unit tests.

### Continuous Integration

**GitHub Actions Example:**

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build site
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
```

---

## 7. Static Site Generation Patterns

### getStaticPaths() for Dynamic Routes

**Core Concept**

In static mode, all routes must be determined at build time. Dynamic routes require `getStaticPaths()` to generate paths.

**Basic Pattern:**

```typescript
---
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog');

  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<h1>{post.data.title}</h1>
<Content />
```

**Key Rules:**

- Returns array of objects with `params` property
- Each object generates one route
- Executes in isolated scope (can't reference parent scope except imports)
- Runs once at build time

### Advanced Patterns

**Multiple Parameters:**

```typescript
// src/pages/[category]/[year]/[slug].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const categories = ['tech', 'design', 'business'];
  const years = ['2023', '2024', '2025'];

  return categories.flatMap(category =>
    years.flatMap(year =>
      posts
        .filter(p => p.data.category === category && p.data.year === year)
        .map(post => ({
          params: { category, year, slug: post.slug },
          props: { post }
        }))
    )
  );
}
```

Generates routes like: `/tech/2024/my-post`

**Pagination Pattern:**

```typescript
---
import { getCollection } from 'astro:content';

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog');
  const sortedPosts = posts.sort(
    (a, b) => b.data.publishDate - a.data.publishDate
  );

  return paginate(sortedPosts, { pageSize: 10 });
}

const { page } = Astro.props;
---

{page.data.map(post => (
  <article>
    <h2>{post.data.title}</h2>
  </article>
))}

<!-- Pagination controls -->
{page.url.prev && <a href={page.url.prev}>Previous</a>}
{page.url.next && <a href={page.url.next}>Next</a>}
```

**API Data at Build Time:**

```typescript
export async function getStaticPaths() {
  // Fetch once at build time
  const response = await fetch('https://api.example.com/products');
  const products = await response.json();

  return products.map(product => ({
    params: { id: product.id },
    props: { product }  // Pass data as props
  }));
}
```

### Performance Optimization for getStaticPaths

**1. Limit Data Fetching**

```typescript
// Bad: Fetching full product data for each page
export async function getStaticPaths() {
  const products = await fetchAllProductsWithFullDetails();
  return products.map(p => ({ params: { id: p.id }, props: { p } }));
}

// Good: Fetch only IDs, get details in component
export async function getStaticPaths() {
  const ids = await fetchProductIds();  // Lighter query
  return ids.map(id => ({ params: { id } }));
}

// In component
const { id } = Astro.params;
const product = await fetchProduct(id);  // Cached/memoized
```

**2. Implement Caching**

```typescript
// utils/cache.ts
const cache = new Map();

export async function cachedFetch(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);

  return data;
}

// Use in getStaticPaths
export async function getStaticPaths() {
  const data = await cachedFetch('https://api.example.com/data');
  // ...
}
```

**3. Content Collections over getStaticPaths**

When possible, use Content Collections instead of `getStaticPaths()`:

```typescript
// Preferred: Content Collections
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }));
}
```

Benefits:
- Type-safe schemas
- 5x faster builds
- Better caching
- Automatic optimization

### Hybrid Rendering (Astro 5.0)

**Simplified Configuration**

Astro 5.0 merged `hybrid` and `static` modes:

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'static',  // Default
  adapter: node()    // For SSR routes
});
```

**Selective SSR:**

```typescript
// src/pages/api/dynamic.ts
export const prerender = false;  // This route uses SSR

export async function GET() {
  const data = await fetchLiveData();
  return new Response(JSON.stringify(data));
}
```

**Selective Static:**

```typescript
// In SSR mode
export const prerender = true;  // This route is pre-rendered
```

### Server Islands for Static Sites

**Use Case:**

Combine static HTML with dynamic, server-rendered components:

```astro
---
// src/pages/product/[id].astro (static)
import DynamicPricing from '@components/DynamicPricing.astro';
import Reviews from '@components/Reviews.astro';
---

<!-- Static content -->
<h1>{product.name}</h1>
<p>{product.description}</p>

<!-- Dynamic island -->
<DynamicPricing server:defer productId={product.id}>
  <div slot="fallback">Loading price...</div>
</DynamicPricing>

<!-- Another island -->
<Reviews server:defer productId={product.id}>
  <div slot="fallback">Loading reviews...</div>
</Reviews>
```

**Benefits:**

- Static page cached on CDN (fast delivery)
- Dynamic data loaded independently
- Slower islands don't block fast ones
- Fallback content shows immediately

**When to Use:**

✅ E-commerce sites (static products, dynamic pricing/inventory)
✅ Content sites with personalization
✅ Dashboards with mostly static layout

❌ Avoid when: high ratio of dynamic to static content

### Incremental Static Regeneration (ISR)

**Middleware Pattern:**

```typescript
// src/middleware.ts
const cache = new Map();
const REVALIDATE_TIME = 60 * 1000; // 1 minute

export async function onRequest({ request, next }, locals) {
  const url = new URL(request.url);
  const cacheKey = url.pathname;

  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < REVALIDATE_TIME) {
    return cached.response;
  }

  const response = await next();

  cache.set(cacheKey, {
    response: response.clone(),
    timestamp: Date.now()
  });

  return response;
}
```

**CDN-Level ISR:**

```javascript
// astro.config.mjs
export default defineConfig({
  adapter: netlify(),
  output: 'static'
});

// In page component
---
export const prerender = true;

// Set cache headers
Astro.response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=86400');
---
```

**Stale-While-Revalidate:**

- Serves stale content immediately
- Revalidates in background
- User never waits for fresh content
- Ideal for frequently updated but not real-time content

### Static Site Best Practices

**1. Build Strategy**

```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    format: 'directory',      // URLs without .html
    inlineStylesheets: 'auto', // Inline small CSS
    assetsPrefix: 'https://cdn.example.com'  // CDN for assets
  }
});
```

**2. Route Organization**

```
src/pages/
├── index.astro              # /
├── about.astro              # /about
├── blog/
│   ├── index.astro          # /blog
│   └── [slug].astro         # /blog/[slug]
├── docs/
│   └── [...slug].astro      # /docs/any/path
└── api/
    └── search.json.ts       # /api/search.json
```

**3. Content Organization**

Use Content Collections for type-safety:
- Better organization
- Schema validation
- Automatic type generation
- Performance optimization

**4. Monitoring and Validation**

```bash
# Check for broken links
npm run build
npx broken-link-checker http://localhost:4321

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

---

## Conclusion

Astro 5.x represents a mature, production-ready framework for building high-performance static sites with modern developer experience. Key takeaways:

**Performance First:**
- HTML-first architecture
- Zero JavaScript by default
- Built-in optimizations
- Incremental adoption of interactivity

**Type Safety:**
- Full TypeScript support
- Automatic type generation
- Content Collections schemas
- Environment variable validation

**Developer Experience:**
- Intuitive project structure
- Multiple testing approaches
- Framework-agnostic
- Excellent documentation

**Production Ready:**
- Built-in security features
- Multiple deployment targets
- Performance monitoring
- Scalability patterns

By following these best practices, teams can build fast, secure, and maintainable websites with Astro 5.x.

---

## Sources

### Official Documentation
- [Astro 5.0 Release](https://astro.build/blog/astro-5/)
- [Project Structure - Astro Docs](https://docs.astro.build/en/basics/project-structure/)
- [Content Collections - Astro Docs](https://docs.astro.build/en/guides/content-collections/)
- [TypeScript - Astro Docs](https://docs.astro.build/en/guides/typescript/)
- [Testing - Astro Docs](https://docs.astro.build/en/guides/testing/)
- [Routing - Astro Docs](https://docs.astro.build/en/guides/routing/)
- [Environment Variables - Astro Docs](https://docs.astro.build/en/guides/environment-variables/)
- [Environment Variables API Reference](https://docs.astro.build/en/reference/modules/astro-env/)
- [Server Islands - Astro Docs](https://docs.astro.build/en/guides/server-islands/)
- [Astro 5.9 Release](https://astro.build/blog/astro-590/)

### Tutorials and Guides
- [What is Astro? A Step-by-Step Tutorial for Beginners in 2025](https://themefisher.com/astro-js-introduction)
- [Astro Web Framework Guide 2025](https://apatero.com/blog/astro-web-framework-complete-guide-2025)
- [How to Use Astro Content Collections](https://astrocourse.dev/blog/how-to-use-content-collections/)
- [Getting Started with Content Collections in Astro — SitePoint](https://www.sitepoint.com/getting-started-with-content-collections-in-astro/)
- [Understanding Astro's getStaticPaths function](https://kristianfreeman.com/understanding-astros-getstaticpaths-function)
- [Type-safe environment variables in Astro 5.0](https://bryanlrobinson.com/blog/type-safe-environment-variables-in-astro-5-0/)

### Performance Optimization
- [Boosting Web Performance with Astro JS](https://dev.to/benajaero/boosting-web-performance-how-we-supercharged-our-agencys-site-with-astro-js-image-speed-optimization-techniques-18mf)
- [Astro Build Speed Optimization: From 35 to 127 Pages/Second](https://www.bitdoze.com/astro-ssg-build-optimization/)
- [How We Cut Astro Build Time from 30 Minutes to 5 Minutes](https://medium.com/@mohdkhan.mk99/how-we-cut-astro-build-time-from-30-minutes-to-5-minutes-83-faster-115349727060)
- [How to optimize images in Astro: A step-by-step guide](https://uploadcare.com/blog/how-to-optimize-images-in-astro/)
- [Production-Ready Astro Middleware](https://www.lorenstew.art/blog/production-ready-astro-middleware)
- [How to Implement ISR in Astro](https://logsnag.com/blog/implementing-isr-in-astro)
- [How to do advanced caching and ISR with Astro](https://developers.netlify.com/guides/how-to-do-advanced-caching-and-isr-with-astro/)

### Security
- [Astro 5.9: Content Security Policy Support](https://www.piyushmehta.com/blog/astro-v5-9-content-security-policy)
- [Complete Guide to Astro SEO Optimization](https://astrojs.dev/articles/astro-seo-optimization/)

### Testing
- [How to set up unit tests for Astro components](https://angelika.me/2025/02/01/astro-component-unit-tests/)
- [Testing dynamic astro endpoints](https://allpointsburnes.com/blog/2024-01-23-testing-dynamic-astro-endpoints/)

### Server Islands
- [Server Islands - The Future of Astro](https://astro.build/blog/future-of-astro-server-islands/)
- [Astro 4.12: Server Islands](https://astro.build/blog/astro-4120/)
- [How Astro's server islands deliver progressive rendering](https://developers.netlify.com/guides/how-astros-server-islands-deliver-progressive-rendering-for-your-sites/)

### Community Resources
- [2024 Year in Review](https://astro.build/blog/year-in-review-2024/)
- [The Rise of Astro.js in 2025](https://dev.to/fahim_shahrier_4a003786e0/the-rise-of-astrojs-in-2025-m4k)
- [Starting 2025 With Astro](https://randomgeekery.org/post/2024/12/starting-2025-with-astro/)
- [AstroWind Theme](https://github.com/arthelokyo/astrowind)
