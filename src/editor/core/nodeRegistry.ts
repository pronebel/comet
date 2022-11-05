import '../../core/nodes/nodeRegistry';

// helper
import { registerNodeType } from '../../core/nodes/nodeFactory';
// editor
import { DebugNode } from '../nodes/debug';
import { EmptyNode } from '../nodes/empty';

// registrations
registerNodeType(DebugNode);
registerNodeType(EmptyNode);
