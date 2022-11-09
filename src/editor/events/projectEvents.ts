export interface ProjectEvent
{
    'project.create.attempt': void;
    'project.create.success': void;
    'project.create.error': void;
    'project.open.attempt': void;
    'project.open.success': void;
    'project.open.error': void;
    'project.delete.attempt': void;
    'project.delete.success': void;
    'project.delete.error': void;
    'project.ready': void;
}
