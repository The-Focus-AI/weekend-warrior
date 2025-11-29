#!/usr/bin/env npx tsx
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
    console.log(`Usage: build-site.ts <git-path> [--base <basedir>]

Arguments:
  git-path    Git repository URL or local path
  --base      Base directory prefix for the site (e.g., /my-project/)

Examples:
  npx tsx scripts/build-site.ts https://github.com/user/repo.git --base /repo/
  npx tsx scripts/build-site.ts ../my-local-repo --base /my-site/
  npx tsx scripts/build-site.ts git@github.com:user/repo.git
`);
    process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    usage();
}

let gitPath = '';
let basedir = '/';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
        basedir = args[i + 1];
        // Ensure basedir starts and ends with /
        if (!basedir.startsWith('/')) basedir = '/' + basedir;
        if (!basedir.endsWith('/')) basedir = basedir + '/';
        i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
        usage();
    } else if (!gitPath) {
        gitPath = args[i];
    }
}

if (!gitPath) {
    console.error('Error: git-path is required');
    usage();
}

const SITE_DIR = path.resolve(__dirname, '..');
let sourceRepo: string;

// Determine if it's a remote URL or local path
const isRemote = gitPath.startsWith('http://') ||
                 gitPath.startsWith('https://') ||
                 gitPath.startsWith('git@') ||
                 gitPath.startsWith('ssh://');

if (isRemote) {
    // Clone to temp directory
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weekend-warrior-'));
    sourceRepo = path.join(tmpDir, 'repo');

    console.log(`Cloning ${gitPath} to ${sourceRepo}...`);
    try {
        execSync(`git clone --depth=1000 "${gitPath}" "${sourceRepo}"`, {
            stdio: 'inherit'
        });
    } catch (e) {
        console.error('Failed to clone repository');
        process.exit(1);
    }
} else {
    // Local path - resolve it
    sourceRepo = path.resolve(gitPath);
    if (!fs.existsSync(sourceRepo)) {
        console.error(`Error: Local path does not exist: ${sourceRepo}`);
        process.exit(1);
    }
    if (!fs.existsSync(path.join(sourceRepo, '.git'))) {
        console.error(`Error: Not a git repository: ${sourceRepo}`);
        process.exit(1);
    }
    console.log(`Using local repository: ${sourceRepo}`);
}

// Run sync-data.ts with the source repo
console.log('\nSyncing data from repository...');
try {
    execSync(`npx tsx "${path.join(SITE_DIR, 'scripts/sync-data.ts')}" "${sourceRepo}"`, {
        cwd: SITE_DIR,
        stdio: 'inherit'
    });
} catch (e) {
    console.error('Failed to sync data');
    process.exit(1);
}

// Build the site with the base path
console.log(`\nBuilding site with base: ${basedir}`);
try {
    execSync(`npm run build`, {
        cwd: SITE_DIR,
        stdio: 'inherit',
        env: {
            ...process.env,
            SITE_BASE: basedir
        }
    });
} catch (e) {
    console.error('Failed to build site');
    process.exit(1);
}

console.log('\nBuild complete! Output is in the dist/ directory.');
