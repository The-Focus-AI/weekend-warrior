import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Accept source repo as command line argument or use default
const SOURCE_REPO = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve('../weekend-coding-agent');

const SITE_DIR = path.resolve(__dirname, '..');
const STEPS_DIR = path.join(SITE_DIR, 'src/content/steps');
const DATA_FILE = path.join(SITE_DIR, 'src/data/project.json');

console.log(`Source repo: ${SOURCE_REPO}`);

// Ensure directories exist
const DOCS_DIR = path.join(SITE_DIR, 'src/content/docs');
if (fs.existsSync(STEPS_DIR)) {
    fs.rmSync(STEPS_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STEPS_DIR, { recursive: true });

if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// 1. Read README.md, parse frontmatter, and save content without frontmatter
interface ProjectConfig {
    title?: string;
    description?: string;
    docNumber?: string;
}
let projectConfig: ProjectConfig = {};

console.log('Reading README.md...');
const readmePath = path.join(SOURCE_REPO, 'README.md');
if (fs.existsSync(readmePath)) {
    let rawReadme = fs.readFileSync(readmePath, 'utf-8');
    let readmeBody = rawReadme;

    // Parse frontmatter - handle leading whitespace and various formats
    const frontmatterMatch = rawReadme.match(/^\s*---\s*\n([\s\S]*?)\n\s*---\s*\n?([\s\S]*)$/);
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        readmeBody = frontmatterMatch[2].trim();

        // Parse YAML fields
        for (const line of frontmatter.split('\n')) {
            const match = line.match(/^(\w+):\s*(.+?)\s*$/);
            if (match) {
                const [, key, value] = match;
                const cleanValue = value.replace(/^["']|["']$/g, '');
                if (key === 'title') projectConfig.title = cleanValue;
                if (key === 'description') projectConfig.description = cleanValue;
                if (key === 'docNumber') projectConfig.docNumber = cleanValue;
            }
        }

        console.log('Parsed frontmatter:', projectConfig);
    }

    // Remove first H1 heading (we show title in hero already)
    readmeBody = readmeBody.replace(/^#\s+.+\n+/, '');

    // Write README WITHOUT frontmatter and first H1
    fs.writeFileSync(path.join(DOCS_DIR, 'readme.md'), readmeBody);
} else {
    console.warn('README.md not found in source repo.');
}

// 2. Get git log
console.log('Reading git log...');
const logOutput = execSync(`git log --oneline --reverse --format="%h %s"`, { cwd: SOURCE_REPO, encoding: 'utf-8' });
const commits = logOutput.split('\n').filter(Boolean).map(line => {
    const [hash, ...msgParts] = line.split(' ');
    return { hash, message: msgParts.join(' ') };
});

// 3. Map commits to steps
const steps = commits.map((commit, index) => {
    const id = index.toString();
    const destStepFile = path.join(STEPS_DIR, `${id}.md`);
    const destOutputFile = path.join(STEPS_DIR, `${id}.output.txt`);

    let stepContent = '';
    let outputContent = '';
    let title = commit.message;

    // Try to get STEP.md
    try {
        stepContent = execSync(`git show ${commit.hash}:STEP.md`, { cwd: SOURCE_REPO, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
        // Try to extract title from first line if it's a header
        const match = stepContent.match(/^#\s+(.+)$/m);
        if (match) {
            title = match[1];
        }
    } catch (e) {
        // Fallback if STEP.md doesn't exist
        stepContent = `# ${commit.message}\n\n*No STEP.md found for this commit.*`;
    }

    // Try to get OUTPUT.md
    try {
        outputContent = execSync(`git show ${commit.hash}:OUTPUT.md`, { cwd: SOURCE_REPO, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
        outputContent = '';
    }

    // Write step file
    const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
commit: "${commit.hash}"
slug: "${id}"
---

${stepContent}
`;
    fs.writeFileSync(destStepFile, fileContent);

    // Write output file
    if (outputContent) {
        fs.writeFileSync(destOutputFile, outputContent);
    }

    return {
        id,
        title,
        commit: commit.hash,
        slug: id,
        commitMessage: commit.message,
        hasOutput: !!outputContent
    };
});

// 4. Get repo info
let repoUrl = '';
let repoName = path.basename(SOURCE_REPO);
try {
    repoUrl = execSync('git remote get-url origin', { cwd: SOURCE_REPO, encoding: 'utf-8' }).trim();
    // Extract repo name from URL
    const urlMatch = repoUrl.match(/\/([^\/]+?)(\.git)?$/);
    if (urlMatch) {
        repoName = urlMatch[1];
    }
} catch (e) {
    // No remote, use directory name
}

// 5. Get first and last commit dates
let startDate = new Date().toISOString().split('T')[0];
let lastDate = startDate;
try {
    // First commit date (oldest)
    startDate = execSync('git log --reverse --format="%ai" | head -1', { cwd: SOURCE_REPO, encoding: 'utf-8', shell: '/bin/bash' }).trim().split(' ')[0];
    // Last commit date (newest)
    lastDate = execSync('git log -1 --format="%ai"', { cwd: SOURCE_REPO, encoding: 'utf-8' }).trim().split(' ')[0];
} catch (e) {
    console.warn('Could not get commit dates');
}

// 6. Generate doc number from repo name (can be overridden by README frontmatter)
const defaultDocNumber = repoName
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase())
    .join('') + '-' + startDate.split('-')[0];

// 7. Generate default title from repo name (can be overridden by README frontmatter)
const defaultTitle = repoName.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

// 8. Write project.json
const projectData = {
    title: projectConfig.title || defaultTitle,
    description: projectConfig.description || '',
    repoName,
    repoPath: SOURCE_REPO,
    repoUrl,
    startDate,
    lastDate,
    docNumber: projectConfig.docNumber || defaultDocNumber,
    steps
};

fs.writeFileSync(DATA_FILE, JSON.stringify(projectData, null, 2));
console.log(`Generated project.json with ${steps.length} steps from ${commits.length} commits.`);
