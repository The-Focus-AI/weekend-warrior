import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import projectData from '../data/project.json';

const REPO_PATH = projectData.repoPath;

export interface FileNode {
    path: string;
    content?: string;
    isBinary?: boolean;
}

export function getFileContent(commit: string, filePath: string): string | null {
    try {
        const contentBuffer = execSync(`git show ${commit}:${filePath}`, { cwd: REPO_PATH, stdio: ['pipe', 'pipe', 'ignore'] });
        if (contentBuffer.includes(0)) return null;
        return contentBuffer.toString('utf-8');
    } catch (e) {
        return null;
    }
}

export function getChangedFiles(commit: string): string[] {
    try {
        const output = execSync(`git show --format= --name-only ${commit}`, { cwd: REPO_PATH, encoding: 'utf-8' });
        return output.split('\n').filter(Boolean);
    } catch (e) {
        return [];
    }
}

export function getCommitFiles(commit: string): FileNode[] {
    try {
        const output = execSync(`git ls-tree -r --name-only ${commit}`, { cwd: REPO_PATH, encoding: 'utf-8' });
        const files = output.split('\n').filter(Boolean);

        return files.map(filePath => {
            try {
                const content = getFileContent(commit, filePath);
                if (content === null) return { path: filePath, isBinary: true };
                return { path: filePath, content };
            } catch (e) {
                return { path: filePath, isBinary: true };
            }
        });
    } catch (e) {
        console.error(`Failed to list files for ${commit}`, e);
        return [];
    }
}
