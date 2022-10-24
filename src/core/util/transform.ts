import { type Container, Matrix } from 'pixi.js';

export function setParent(view: Container, newParentView: Container)
{
    if (view.parent)
    {
        view.updateTransform();
    }
    if (newParentView.parent)
    {
        newParentView.updateTransform();
    }

    const viewMatrix = view.worldTransform.clone();

    newParentView.addChild(view);

    const parentMatrix = newParentView.worldTransform.clone();
    const p = parentMatrix.apply({ x: view.x, y: view.y });

    parentMatrix.invert();
    viewMatrix.prepend(parentMatrix);
    const translate = new Matrix();

    translate.translate(p.x, p.y);
    viewMatrix.append(translate);

    view.transform.setFromMatrix(viewMatrix);
}
