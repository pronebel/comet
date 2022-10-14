import '../core/nodes/nodeRegistry';

// helper
import { registerNodeType } from '../core/nodes/nodeFactory';
// editor
import { DebugNode } from './devTools/nodes/debug';
import { EmptyNode } from './devTools/nodes/empty';

// registrations
registerNodeType(DebugNode);
registerNodeType(EmptyNode);
