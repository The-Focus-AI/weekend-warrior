# Authoring Guide: TheFocus.AI Labs Tutorials

This system generates a "TheFocus.AI Labs" tutorial automatically from a Git repository. Each commit in your repository represents a step in the tutorial.

## Concept

The core idea is **"One Commit = One Step"**.

As you build your project, you commit your changes. The system reads your git history and transforms it into a step-by-step manual. It allows users to see exactly what files changed in each step, read your explanation, and see the expected terminal output.

## Project Configuration

Add YAML frontmatter to your `README.md` file to customize project metadata:

```markdown
---
title: Weekend Coding Agent
description: Learn to build an AI-powered coding assistant from scratch.
docNumber: WCA-2025
---

# My Project

This is the rest of your README content...
```

### Configuration Options

| Field | Description | Default |
|-------|-------------|---------|
| `title` | Project name displayed in the hero section | Derived from repo name |
| `description` | Short description shown on the landing page | Generic default text |
| `docNumber` | Document number shown in header | Initials from repo name + year |

If frontmatter is not present, the system will generate sensible defaults from:
- **Title**: Repo name with dashes replaced by spaces and title-cased (e.g., `weekend-coding-agent` → "Weekend Coding Agent")
- **Doc Number**: First letters of each word + year (e.g., "WCA-2025")
- **Dates**: Extracted from first and last commit timestamps

**Note**: The frontmatter is stripped when displaying the README on the landing page.

## How to Author a Tutorial

### 1. Setup Your Project

Create a standard Git repository for your project. This will be the "Source Repo".

### 2. Create a Step

For each step in your tutorial:

1.  **Write Code**: Make the code changes for this step (e.g., create a file, update a function).
2.  **Add `STEP.md`**: Create or update a file named `STEP.md` in the root of your repo. This file contains the tutorial text for this specific step.
    *   **Title**: The first H1 (`# Title`) in this file will be used as the step title in the navigation.
    *   **Content**: Explain what you did, why you did it, and what the code does. Markdown is supported.
3.  **Add `OUTPUT.md` (Optional)**: Create or update a file named `OUTPUT.md` in the root.
    *   **Content**: Paste the terminal output you want to show for this step (e.g., build logs, test results).
4.  **Commit**: Commit all changes (code + `STEP.md` + `OUTPUT.md`).
    ```bash
    git add .
    git commit -m "Step 1: Initial setup"
    ```

### 3. Repeat

Continue building your project. For the next step:
1.  Modify your code.
2.  Update `STEP.md` with the new instructions for *this* step.
3.  Update `OUTPUT.md` if there's new output.
4.  Commit.

### 4. Build the Site

Use the `mise` task to build the site from your repo:

```bash
# Build from a local repo with a base path
mise run build-site ../my-project /my-base-path/

# Build from a remote repo
mise run build-site https://github.com/user/repo.git /project-name/

# Build without a base path (deploys to root)
mise run build-site ../my-project
```

Or use npm directly:

```bash
npm run build-site -- ../my-project --base /my-base-path/
```

The build process:
1.  Clones remote repos to `/tmp` (or uses local path directly)
2.  Reads `README.md` and parses frontmatter for metadata
3.  Reads the `git log` of your source repo
4.  For each commit:
    *   Extracts `STEP.md` to create the tutorial content
    *   Extracts `OUTPUT.md` to create the terminal view
    *   Calculates file diffs between this commit and the previous one
5.  Generates the static site in `dist/`

To run the site locally for development:
```bash
npm run dev
```

## File Structure Example

Your source repository should look like:

```
my-tutorial-repo/
├── README.md             # Project overview (with optional frontmatter)
├── STEP.md               # Current step explanation
├── OUTPUT.md             # Optional: terminal output for current step
└── src/                  # Your actual project code
    └── ...
```

**Note**: The following files are hidden in the file viewer and won't appear in diffs:
- `README.md`, `STEP.md`, `OUTPUT.md` (tutorial metadata files)

**Commit 1:**
- `README.md`:
  ```markdown
  ---
  title: My Awesome Tutorial
  description: Learn to build something cool.
  ---

  # My Awesome Tutorial

  This tutorial walks you through building...
  ```
- `src/index.ts` (New file)
- `STEP.md`:
  ```markdown
  # Project Setup
  We start by creating the main entry point...
  ```
- `OUTPUT.md`:
  ```
  $ npm init -y
  Wrote to .../package.json
  ```

**Commit 2:**
- `src/index.ts` (Modified)
- `STEP.md`:
  ```markdown
  # Adding Logic
  Now we add the main logic function...
  ```

## Tips

- **Interactive Development**: You can write your code and `STEP.md` simultaneously.
- **Rewriting History**: If you make a mistake, you can use `git rebase -i` to edit previous steps (commits).
- **Images**: You can include images in your repo and reference them in `STEP.md`.
- **Base Path**: When deploying to a subdirectory (e.g., GitHub Pages project site), use the `--base` flag to ensure all links work correctly.
- **Hidden Files**: `README.md`, `STEP.md`, and `OUTPUT.md` are automatically hidden from the code viewer so readers focus on your actual project code.
