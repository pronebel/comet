// start concrete nodes...
import { ContainerNode } from './concrete/container';
import { EmptyNode } from './concrete/empty';
import { ProjectNode } from './concrete/project';
import { SceneNode } from './concrete/scene';
import { SpriteNode } from './concrete/sprite';
// end concrete nodes...
import { registerGraphNodeType } from './factory';

registerGraphNodeType(ContainerNode);
registerGraphNodeType(EmptyNode);
registerGraphNodeType(ProjectNode);
registerGraphNodeType(SceneNode);
registerGraphNodeType(SpriteNode);
