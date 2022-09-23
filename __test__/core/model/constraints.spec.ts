import { NumericRangeLimitConstraint } from '../../../src/core/model/constraints';

describe('Model Constraints', () =>
{
    describe('NumericRangeLimitConstraint', () =>
    {
        const MIN = 10;
        const MAX = 20;
        const constraint = new NumericRangeLimitConstraint(MIN, MAX);

        it('should limit to min value', () =>
        {
            expect(constraint.applyToValue(MIN - 10)).toBe(MIN);
        });

        it('should limit to max value', () =>
        {
            expect(constraint.applyToValue(MAX + 10)).toBe(MAX);
        });
    });
});
