import { NumericRangeLimitConstraint } from '../../../src/core/lib/model/constraints';
import { createModel } from '../../../src/core/lib/model/model';
import { ModelSchema } from '../../../src/core/lib/model/schema';

interface TestModel
{
    x: number;
    y: number;
    visible: boolean;
    obj: {name: string};
}

const constraint = new NumericRangeLimitConstraint(10, 20);

const schema = new ModelSchema<TestModel>({
    x: 1,
    y: 2,
    visible: true,
    obj: { name: 'foo' },
}, {
    x: [constraint],
});

describe('Model', () =>
{
    describe('Basic Access', () =>
    {
        it('should return undefined for own values if no props passed', () =>
        {
            const model = createModel(schema);

            expect(model.x).toBeUndefined();
            expect(model.y).toBeUndefined();
            expect(model.visible).toBeUndefined();
            expect(model.obj).toBeUndefined();
        });

        it('should return given prop values for own values if props passed', () =>
        {
            const props = {
                x: 10,
                y: 20,
                visible: false,
                obj: { name: 'bar' },
            };
            const model = createModel(schema, props);

            expect(model.x).toBe(props.x);
            expect(model.y).toBe(props.y);
            expect(model.visible).toBe(props.visible);
            expect(model.obj).toBe(props.obj);
        });

        it('should return defaults for values if no props passed and .getValue<T> used', () =>
        {
            const model = createModel(schema);

            expect(model.getValue('x')).toBe(schema.defaults.x);
            expect(model.getValue('y')).toBe(schema.defaults.y);
            expect(model.getValue('visible')).toBe(schema.defaults.visible);
            expect(model.getValue('obj')).toBe(schema.defaults.obj);
        });

        it('should apply constraints if given', () =>
        {
            const model = createModel(schema, { x: 15 });

            model.x = constraint.min - 10;
            expect(model.getValue('x')).toBe(constraint.min);

            model.x = constraint.max + 10;
            expect(model.getValue('x')).toBe(constraint.max);
        });

        it('should accept partial values with .setValues(), and fallback to defaults if not set', () =>
        {
            const model = createModel(schema);
            const props = {
                x: 10,
                y: 20,
            };

            model.setValues(props);

            expect(model.getValue('x')).toBe(props.x);
            expect(model.getValue('y')).toBe(props.y);

            expect(model.getValue('visible')).toBe(schema.defaults.visible);
            expect(model.getValue('obj')).toBe(schema.defaults.obj);
        });
    });

    describe('Nesting and linking', () => {});

    describe('Events', () => {});
});
