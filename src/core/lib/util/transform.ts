import type { Container } from 'pixi.js';

export function setParent(view: Container, newParentView: Container)
{
    view.updateTransform();
    newParentView.updateTransform();

    const viewMatrix = view.worldTransform.clone();

    newParentView.addChild(view);

    const parentMatrix = newParentView.worldTransform.clone();

    const { tx, ty } = viewMatrix;
    const { a, d } = parentMatrix;

    // console.log({ tx, ty, a, d });

    parentMatrix.invert();
    viewMatrix.prepend(parentMatrix);

    viewMatrix.tx = tx / a;
    viewMatrix.ty = ty / d;

    view.transform.setFromMatrix(viewMatrix);
}
