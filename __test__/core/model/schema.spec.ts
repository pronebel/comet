import { ModelSchema } from '../../../src/core/lib/model/schema';

describe('Model Schema', () =>
{
    const defaults = { x: 1, y: 2, z: 3 };
    const constraints = {} as any;
    const schema = new ModelSchema(defaults, constraints);

    it('should create schema keys from given defaults', () =>
    {
        expect(schema.keys).toEqual(['x', 'y', 'z']);
    });

    it('should create schema with given defaults', () =>
    {
        expect(schema.defaults).toEqual(defaults);
    });

    it('should create schema with given constraints', () =>
    {
        expect(schema.constraints).toEqual(constraints);
    });
});
