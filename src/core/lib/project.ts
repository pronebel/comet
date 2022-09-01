import type { CustomProperties } from './model/customProperty';

export interface Project
{
    customProperties: CustomProperties;
}

export const project: Project = {
    customProperties: new Map(),
};
