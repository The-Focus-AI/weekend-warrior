# Future Systems Report (Weekend Coding Warrior)

This project generates a "Future Systems Report" style tutorial from a Git repository. It transforms your commit history into a step-by-step technical manual.

## Prerequisites

- **Node.js**: v18 or higher
- **Git**: Installed and configured
- **Source Repository**: A git repository you want to turn into a tutorial

## Quick Start (with mise)

The easiest way to build a site is using [mise](https://mise.jdx.dev/):

```bash
# Build a site from a git repo (local or remote)
mise run build-site <git-path> <base-path> <output-dir>

# Examples:
mise run build-site ../my-project / ./output
mise run build-site https://github.com/user/repo.git /repo/ ./dist/repo
mise run build-site git@github.com:user/repo.git /my-site/ ./public
```

Arguments:
- `<git-path>` - Git repository URL or local path
- `<base-path>` - URL base path for the site (use `/` for root, `/project/` for subdirectory)
- `<output-dir>` - Directory to copy the built files to

## Manual Build

If you prefer not to use mise:

```bash
# Install dependencies
npm install

# Build site from a repository
npx tsx scripts/build-site.ts <git-path> [--base <base-path>]

# Examples:
npx tsx scripts/build-site.ts ../my-project
npx tsx scripts/build-site.ts https://github.com/user/repo.git --base /repo/
```

The output will be in the `dist/` directory.

## Development

To work on the site generator itself:

```bash
npm install

# Sync data from a source repo (defaults to ../weekend-coding-agent)
npm run gen:data
# Or specify a repo:
npx tsx scripts/sync-data.ts /path/to/repo

# Start the dev server
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Building for Production

```bash
npm run build
npm run preview  # Preview the built site
```

## Authoring

See [AUTHORING_GUIDE.md](./AUTHORING_GUIDE.md) for details on how to write tutorials using `STEP.md` and `OUTPUT.md`.

## Project Structure

- `src/pages/index.astro`: The "Report Cover" page.
- `src/pages/steps/[slug].astro`: The individual step pages.
- `src/components/Workspace.tsx`: The interactive file explorer and diff viewer.
- `src/styles/global.css`: Global styles and "Future Systems" design tokens.
- `scripts/sync-data.ts`: The script that ingests git data.
