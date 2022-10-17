import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import { nodeFactoryEmitter, registerNodeType } from '../../core/nodes/nodeFactory';
import { Application } from '../application';
import { getUserLogColor, getUserName } from '../sync/user';
import { DebugNode } from './nodes/debug';

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logStyle = `color:PaleTurquoise`;
const logId = `${userName}`;

// must register any nodes outside of core explicitly
registerNodeType(DebugNode);

export class DevTools
{
    constructor()
    {
        this.initNodeFactoryEvents();
    }

    protected initNodeFactoryEvents()
    {
        nodeFactoryEmitter.on('created', (node: ClonableNode) =>
        {
            console.log(`%c${logId}:%cCREATED: "${node.id}"`, userColor, logStyle);
        }).on('disposed', (node: ClonableNode) =>
        {
            console.log(`%c${logId}:%cDISPOSED: "${node.id}"`, userColor, logStyle);

            throw new Error('disposed?');
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }).on('modelModified', (node: ClonableNode, key: string, value: ModelValue, oldValue: ModelValue) =>
        {
            // const val = JSON.stringify(value);
            // const oldVal = JSON.stringify(oldValue);

            // console.log(`%c${logId}:MODIFIED: "${node.id}" [${key}]=${val} (${oldVal})`, logStyle);
        })
            .on('childAdded', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cCHILD ADDED: "${node.id}"`, userColor, logStyle);
            })
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .on('childRemoved', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cCHILD REMOVED: "${node.id}"`, userColor, logStyle);
            })
            .on('cloaked', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cCLOAKED: "${node.id}"`, userColor, logStyle);
            })
            .on('uncloaked', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cUNCLOAKED: "${node.id}"`, userColor, logStyle);
            });
    }

    public inspect()
    {
        // const { selected } = this;

        // if (selected)
        // {
        //     const cloneRoot = selected.getCloneRoot();

        //     const definedProps: Record<string, CustomProperty[]> = {};

        //     selected.getDefinedCustomProps().forEach((props, key) => { definedProps[key] = props; });

        //     const info = {
        //         id: selected.id,
        //         parent: selected.parent?.id,
        //         children: selected.children.map((node) => (node.id)),
        //         allChildren: selected.getAllChildren<ClonableNode>().map((node) => (node.id)),
        //         parents: selected.getParents().map((node) => (node.id)),
        //         dependants: selected.getDependants().map((node) => (node.id)),
        //         dependencies: selected.getDependencies().map((node) => (node.id)),
        //         restoreDependencies: selected.getRestoreDependencies().map((node) => (node.id)),
        //         original: selected.getOriginal().id,
        //         cloneTarget: selected.getCloneTarget().id,
        //         cloneRoot: cloneRoot ? cloneRoot.id : undefined,
        //         modifyCloneTarget: selected.getModificationCloneTarget().id,
        //         addChildCloneTarget: selected.getAddChildCloneTarget().id,
        //         clonedDescendants: selected.getClonedDescendants().map((node) => (node.id)),
        //         cloneAncestors: selected.getCloneAncestors().map((node) => (node.id)),
        //         cloneTreeAncestors: selected.getCloneTreeAncestors().map((node) => (node.id)),
        //         definedProps,
        //         nodeGraphSchema: getNodeSchema(selected.cast<ClonableNode>()),
        //         dsNodeSchema: this.datastore.getNodeElementSchema(selected.id),
        //     };

        //     console.clear();
        //     console.dir(selected);
        //     console.log(JSON.stringify(info, null, 4));

        //     (window as any).$ = selected;
        // }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public debug(element: HTMLPreElement)
    {
        const app = Application.instance;

        if (app.project)
        {
            let html = '';

            const nodeId = (node?: GraphNode) => (node ? node.id.replace('Node', '') : '.');
            const selected: ClonableNode | undefined = undefined;

            app.project.walk<ContainerNode>((node, options) =>
            {
                const {
                    model: { id: modelId },
                    cloneInfo, cloneInfo: { cloned, cloneMode },
                } = node;

                const cloner = cloneInfo.getCloner<ContainerNode>();

                const pad = ''.padStart(options.depth, '+');
                const id = `&lt;${nodeId(node)}&gt;(${nodeId(node.parent)})`;
                const modelInfo = `${modelId}`;
                const clonerInfo = cloner
                    ? `<span style="color:lime"><- ${nodeId(cloner)}</span>`
                    : '';
                const clonedInfo = cloned.length > 0
                    ? `<span style="color:green">-> [${cloned.length}] ${cloned
                        .map((component) => `${nodeId(component as unknown as ContainerNode)}`).join(',')}</span>`
                    : '';
                const modelValues = JSON.stringify(node.model.ownValues).replace(/^{|}$/g, '');

                const customPropsDefined: string[] = [];
                const customPropsAssigned: string[] = [];

                node.defineCustomProperties.forEach((prop, key) => { customPropsDefined.push(`${key}=${prop.value}`); });
                node.assignedCustomProperties.forEach((customKey, modelKey) =>
                {
                    customPropsAssigned.push(`${modelKey}->${customKey}`);
                });

                const modelLine = `${modelInfo} <span style="color:cyan;">${modelValues}</span>`;
                const isCloned = selected
                    ? selected === cloner || cloned.includes(selected)
                    : false;
                const cloneModeInfo = `${cloneMode.toUpperCase()}`;
                let output = `${pad} ${id} ${cloneModeInfo} ${clonerInfo} ${clonedInfo}\n`;

                output += `${pad}  ... ${modelLine}\n`;

                if (customPropsDefined.length || customPropsAssigned.length)
                {
                    output += `${pad}  ... `;

                    if (customPropsDefined.length)
                    {
                        output += `<span style="color:pink">${customPropsDefined}</span> `;
                    }
                    if (customPropsAssigned.length)
                    {
                        output += `<span style="color:orange">${customPropsAssigned}</span> `;
                    }

                    output += '\n';
                }

                const line = node === selected ? `<b style="background-color:#222">${output}</b>` : output;

                let final = isCloned ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;

                final = node.isCloaked ? `<span style="opacity:0.7;font-style:italic">${line}</span>` : line;

                html += final;
            }, {
                includeSelf: true,
            });

            element.innerHTML = `${html}`;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById('undo')!.innerHTML = app.undoStack.debugPrint();
        }
    }
}
