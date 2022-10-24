import { Container, Matrix } from 'pixi.js';

export function setParent(view: Container, newParentView: Container)
{
    const container = new Container();

    container.addChild(view);

    view.updateTransform();
    newParentView.updateTransform();

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
