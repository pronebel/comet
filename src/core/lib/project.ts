export interface Project
{
    customProperties: Map<string, any>;
}

export const project: Project = {
    customProperties: new Map(),
};

project.customProperties.set('label', 'default');
