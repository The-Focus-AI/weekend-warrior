# Future Systems Report (Weekend Coding Warrior)

This project generates a "Future Systems Report" style tutorial from a Git repository. It transforms your commit history into a step-by-step technical manual.

## Prerequisites

- **Node.js**: v18 or higher.
- **Git**: Installed and configured.
- **Source Repository**: The git repository you want to turn into a tutorial.

## Setup

1.  **Clone this repository**:
    ```bash
    git clone <this-repo-url> site
    cd site
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Link Source Repository**:
    The site expects the source repository to be at `../weekend-coding-agent`. You can create a symlink if your repo is elsewhere:
    
    ```bash
    # From the parent directory of 'site'
    cd ..
    ln -s /path/to/your/repo weekend-coding-agent
    ```
    
    *Alternatively, you can modify `scripts/sync-data.ts` to point to a different path.*

## Running Locally

To start the development server:

```bash
npm run dev
```

This command will:
1.  Run `scripts/sync-data.ts` to read your git history and generate content.
2.  Start the Astro dev server at `http://localhost:4321`.

## Building for Production

To build the static site:

```bash
npm run build
```

The output will be in the `dist/` directory. You can preview the build with:

```bash
npm run preview
```

## Authoring

See [AUTHORING_GUIDE.md](./AUTHORING_GUIDE.md) for details on how to write tutorials using `STEP.md` and `OUTPUT.md`.

## Project Structure

- `src/pages/index.astro`: The "Report Cover" page.
- `src/pages/steps/[slug].astro`: The individual step pages.
- `src/components/Workspace.tsx`: The interactive file explorer and diff viewer.
- `src/styles/global.css`: Global styles and "Future Systems" design tokens.
- `scripts/sync-data.ts`: The script that ingests git data.
