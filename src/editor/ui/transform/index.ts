import { type Container, type InteractionEvent, Transform } from 'pixi.js';

import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import { TransformGizmoFrame } from './frame';
import type { TransformOperation } from './operation';

export class BaseTransformGizmo
{
    public width: number;
    public height: number;
    public pivot?: Point;

    public transform: Transform;
    public frame: TransformGizmoFrame;
    public operation?: TransformOperation;

    constructor()
    {
        this.width = 1;
        this.height = 1;

        this.transform = new Transform();
        this.frame = new TransformGizmoFrame(this);

        this.initFrame();
    }

    protected initFrame()
    {
        const { frame } = this;

        frame
            .on('mousedown', this.onMouseDown)
            .on('mousemove', this.onMouseMove)
            .on('mouseup', this.onMouseUp);
    }

    public setContainer(container: Container)
    {
        container.addChild(this.frame.container);
    }

    public setSize(width: number, height: number)
    {
        this.width = width;
        this.height = height;

        this.update();
    }

    public setPivot(x: number, y: number)
    {
        this.pivot = {
            x,
            y,
        };

        this.update();
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown = (e: InteractionEvent) =>
    {
        //
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseMove = (e: InteractionEvent) =>
    {
        //
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp = (e: MouseEvent) =>
    {
        //
    };

    get matrix()
    {
        return this.transform.localTransform;
    }

    get x()
    {
        return this.transform.position.x;
    }

    set x(x: number)
    {
        this.transform.position.x = x;
        this.update();
    }

    get y()
    {
        return this.transform.position.x;
    }

    set y(y: number)
    {
        this.transform.position.y = y;
        this.update();
    }

    get pivotX()
    {
        return this.transform.pivot.x;
    }

    set pivotX(x: number)
    {
        this.transform.pivot.x = x;
        this.update();
    }

    get pivotY()
    {
        return this.transform.pivot.y;
    }

    set pivotY(y: number)
    {
        this.transform.pivot.y = y;
        this.update();
    }

    get rotation()
    {
        return radToDeg(this.transform.rotation);
    }

    set rotation(deg: number)
    {
        this.transform.rotation = degToRad(deg);
        this.update();
    }

    get scaleX()
    {
        return this.transform.scale.x;
    }

    set scaleX(x: number)
    {
        this.transform.scale.x = x;
        this.update();
    }

    get scaleY()
    {
        return this.transform.scale.y;
    }

    set scaleY(y: number)
    {
        this.transform.scale.y = y;
        this.update();
    }

    get pivotGlobalPos()
    {
        const { matrix, transform, pivot } = this;

        if (pivot)
        {
            return matrix.apply({ x: pivot.x, y: pivot.y });
        }

        return matrix.apply({ x: transform.pivot.x, y: transform.pivot.y });
    }

    protected update()
    {
        this.transform.updateLocalTransform();

        this.frame.update();
    }
}
