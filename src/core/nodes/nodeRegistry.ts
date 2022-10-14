// core
import { ContainerNode } from './concrete/container';
import { ProjectNode } from './concrete/project';
import { SceneNode } from './concrete/scene';
import { SpriteNode } from './concrete/sprite';
// helper
import { registerNodeType } from './nodeFactory';

// registrations
registerNodeType(ContainerNode);
registerNodeType(ProjectNode);
registerNodeType(SceneNode);
registerNodeType(SpriteNode);
