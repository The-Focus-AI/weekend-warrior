import projectData from '../data/project.json';

export interface ProjectData {
    title: string;
    description: string;
    repoName: string;
    repoPath: string;
    repoUrl: string;
    startDate: string;
    lastDate: string;
    docNumber: string;
    steps: {
        id: string;
        title: string;
        commit: string;
        slug: string;
        commitMessage: string;
        hasOutput: boolean;
    }[];
}

export function getProject(): ProjectData {
    return projectData as ProjectData;
}

// Helper to split title into lines for the hero display
// e.g., "Weekend Coding Agent" -> ["WEEKEND", "CODING", "AGENT"]
export function getTitleLines(title: string): string[] {
    return title.toUpperCase().split(' ');
}
