import type { Container } from 'pixi.js';

export function setParent(view: Container, newParentView: Container)
{
    view.updateTransform();
    newParentView.updateTransform();

    const viewMatrix = view.worldTransform.clone();

    // newParentView.addChild(view);
    const parentMatrix = newParentView.worldTransform.clone();

    parentMatrix.invert();
    viewMatrix.prepend(parentMatrix);
    view.transform.setFromMatrix(viewMatrix);
}
