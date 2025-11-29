import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SOURCE_REPO = path.resolve('../weekend-coding-agent');
const SITE_DIR = path.resolve('.');
const STEPS_DIR = path.join(SITE_DIR, 'src/content/steps');
const DATA_FILE = path.join(SITE_DIR, 'src/data/project.json');

// Ensure directories exist
const DOCS_DIR = path.join(SITE_DIR, 'src/content/docs');
if (fs.existsSync(STEPS_DIR)) {
    fs.rmSync(STEPS_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STEPS_DIR, { recursive: true });

if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// 1. Copy README
console.log('Copying README...');
try {
    execSync(`cp ${path.join(SOURCE_REPO, 'README.md')} ${path.join(DOCS_DIR, 'readme.md')}`);
} catch (e) {
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

// 4. Write project.json
const projectData = {
    title: "Weekend Coding Agent",
    repoPath: "../../weekend-coding-agent",
    steps
};

fs.writeFileSync(DATA_FILE, JSON.stringify(projectData, null, 2));
console.log(`Generated project.json with ${steps.length} steps from ${commits.length} commits.`);
