import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_PATH = path.resolve('../weekend-coding-agent');
const STEPS_PATH = path.join(REPO_PATH, 'STEPS.md');

export interface Step {
    id: string;
    slug: string;
    title: string;
    commit: string;
    commitMessage: string;
    content: string;
}

export function getSteps(): Step[] {
    // 1. Get commits from git log
    let commits: { hash: string; message: string }[] = [];
    try {
        const output = execSync('git log --oneline --reverse --no-abbrev-commit', {
            cwd: REPO_PATH,
            encoding: 'utf-8'
        });

        commits = output.trim().split('\n').map(line => {
            const [hash, ...msgParts] = line.split(' ');
            return {
                hash,
                message: msgParts.join(' ')
            };
        });
    } catch (e) {
        console.error('Failed to read git log', e);
        return [];
    }

    // 2. Read and parse STEPS.md
    let sections: { title: string; content: string }[] = [];
    try {
        const fileContent = fs.readFileSync(STEPS_PATH, 'utf-8');
        // Split by H1 headers, keeping the separator
        const parts = fileContent.split(/^# /m);

        // The first part is usually empty or frontmatter before the first H1
        // We start from index 1 because split will give [preamble, title1 + content1, title2 + content2, ...]

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            const newlineIndex = part.indexOf('\n');
            const title = part.substring(0, newlineIndex).trim();
            const content = part.substring(newlineIndex).trim();

            sections.push({
                title,
                content
            });
        }

    } catch (e) {
        console.error('Failed to read STEPS.md', e);
        return [];
    }

    // 3. Merge commits and sections
    // We assume 1:1 mapping as verified in the plan
    const steps: Step[] = [];
    const count = Math.min(commits.length, sections.length);

    for (let i = 0; i < count; i++) {
        steps.push({
            id: i.toString(),
            slug: i.toString(), // 0-based slug
            title: sections[i].title,
            commit: commits[i].hash,
            commitMessage: commits[i].message,
            content: sections[i].content
        });
    }

    return steps;
}
