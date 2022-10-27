import { type Container, type InteractionEvent, Transform } from 'pixi.js';

import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import { TransformGizmoFrame } from './frame';
import type { HandleVertex } from './handle';
import type { TransformOperation } from './operation';
import { type TransformGizmoConfig, defaultTransformGizmoConfig } from './types';

export class BaseTransformGizmo
{
    public config: TransformGizmoConfig;

    public naturalWidth: number;
    public naturalHeight: number;
    public pivot?: Point;

    public transform: Transform;
    public frame: TransformGizmoFrame;
    public operation?: TransformOperation;
    public vertex: HandleVertex;

    constructor(config?: TransformGizmoConfig)
    {
        this.config = config ?? { ...defaultTransformGizmoConfig };

        this.naturalWidth = 1;
        this.naturalHeight = 1;

        this.transform = new Transform();
        this.frame = new TransformGizmoFrame(this);
        this.vertex = { h: 'none', v: 'none' };

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
        this.naturalWidth = width;
        this.naturalHeight = height;

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

    public setConfig(config: Partial<TransformGizmoConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        if (config.pivotView)
        {
            this.frame.setPivotView(config.pivotView);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown = (e: InteractionEvent) =>
    {
        console.log(this.vertex);
        console.log('mousedown');
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseMove = (e: InteractionEvent) =>
    {
        if (this.operation)
        {
            console.log('mousemove');
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp = (e: MouseEvent) =>
    {
        if (this.operation)
        {
            console.log('mouseup');
        }
        this.vertex = { h: 'none', v: 'none' };
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
    }

    get y()
    {
        return this.transform.position.x;
    }

    set y(y: number)
    {
        this.transform.position.y = y;
    }

    get pivotX()
    {
        return this.transform.pivot.x;
    }

    set pivotX(xFraction: number)
    {
        this.transform.pivot.x = this.naturalWidth * xFraction;
    }

    get pivotY()
    {
        return this.transform.pivot.y;
    }

    set pivotY(yFraction: number)
    {
        this.transform.pivot.y = this.naturalHeight * yFraction;
    }

    get pivotGlobalPos()
    {
        const { matrix, transform, pivot, naturalWidth, naturalHeight } = this;

        if (pivot)
        {
            return matrix.apply({ x: naturalWidth * pivot.x, y: naturalHeight * pivot.y });
        }

        return matrix.apply({ x: transform.pivot.x, y: transform.pivot.y });
    }

    get rotation()
    {
        return radToDeg(this.transform.rotation);
    }

    set rotation(deg: number)
    {
        this.transform.rotation = degToRad(deg);
    }

    get scaleX()
    {
        return this.transform.scale.x;
    }

    set scaleX(x: number)
    {
        this.transform.scale.x = x;
    }

    get scaleY()
    {
        return this.transform.scale.y;
    }

    set scaleY(y: number)
    {
        this.transform.scale.y = y;
    }

    protected update()
    {
        this.transform.updateLocalTransform();

        this.frame.update();
    }

    public setActiveVertex(vertex: HandleVertex)
    {
        this.vertex = vertex;
    }
}
