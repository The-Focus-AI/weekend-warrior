import fs from 'fs';
import path from 'path';
import projectData from '../data/project.json';
import { getCollection } from 'astro:content';

export interface Step {
    id: string;
    slug: string;
    title: string;
    commit: string;
    commitMessage: string;
    content: string;
}

export async function getSteps(): Promise<Step[]> {
    // Get step content from Astro content collection
    const stepsCollection = await getCollection('steps');

    // Map project.json metadata with content collection body
    const steps: Step[] = projectData.steps.map((stepMeta: any) => {
        const stepEntry = stepsCollection.find(s => s.id === `${stepMeta.id}.md` || s.id === stepMeta.id);
        const content = stepEntry?.body || `# ${stepMeta.title}\n\n*Step content not found.*`;

        return {
            id: stepMeta.id,
            slug: stepMeta.slug,
            title: stepMeta.title,
            commit: stepMeta.commit,
            commitMessage: stepMeta.commitMessage,
            content
        };
    });

    return steps;
}
