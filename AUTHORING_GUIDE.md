# Authoring Guide: Future Systems Report

This system generates a "Future Systems Report" (tutorial) automatically from a Git repository. Each commit in your repository represents a step in the tutorial.

## Concept

The core idea is **"One Commit = One Step"**.

As you build your project, you commit your changes. The system reads your git history and transforms it into a step-by-step manual. It allows users to see exactly what files changed in each step, read your explanation, and see the expected terminal output.

## How to Author a Tutorial

### 1. Setup Your Project

Create a standard Git repository for your project. This will be the "Source Repo".

### 2. Create a Step

For each step in your tutorial:

1.  **Write Code**: Make the code changes for this step (e.g., create a file, update a function).
2.  **Add `STEP.md`**: Create or update a file named `STEP.md` in the root of your repo. This file contains the tutorial text for this specific step.
    *   **Title**: The first H1 (`# Title`) in this file will be used as the step title in the navigation.
    *   **Content**: Explain what you did, why you did it, and what the code does. Markdown is supported.
3.  **Add `OUTPUT.md` (Optional)**: Create or update a file named `OUTPUT.md` (or `OUTPUT.txt`) in the root.
    *   **Content**: Paste the terminal output you want to show for this step (e.g., build logs, test results).
    *   *Note*: The system looks for `OUTPUT.md` in the commit.
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

The site generator (`scripts/sync-data.ts`) does the following:
1.  Reads the `git log` of your source repo.
2.  For each commit:
    *   Extracts `STEP.md` to create the tutorial content.
    *   Extracts `OUTPUT.md` to create the terminal view.
    *   Calculates file diffs between this commit and the previous one.
3.  Generates the static site.

To run the site locally:
```bash
cd site
npm run dev
```
This command runs the sync script and starts the Astro dev server.

## File Structure Example

**Commit 1:**
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

## Configuration

The source repository path is configured in `site/scripts/sync-data.ts`:

```typescript
const SOURCE_REPO = path.resolve('../weekend-coding-agent');
```

Change this path to point to your own repository.
