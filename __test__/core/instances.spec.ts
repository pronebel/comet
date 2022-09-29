import {
    clearInstances,
    consolidateId,
    getInstance,
    newId,
    parseId,
    peekNextIdCount,
    registerInstance,
    unregisterInstance } from '../../src/core/nodes/instances';

describe('Instances', () =>
{
    describe('id Generation', () =>
    {
        it('should start ids at 1', () =>
        {
            expect(peekNextIdCount('some-new-type')).toBe(1);
        });

        it('should return formatted id string for new id', () =>
        {
            expect(newId('some-type')).toBe('some-type:1');
        });

        it('should peek the next value', () =>
        {
            expect(peekNextIdCount('some-type')).toBe(2);
        });

        it('should increase counter to max value when consolidating id', () =>
        {
            consolidateId('some-type:5');

            expect(peekNextIdCount('some-type')).toBe(6);
        });

        it('should parse ids', () =>
        {
            expect(parseId('some-id:1')).toStrictEqual({
                type: 'some-id',
                idCounter: 1,
            });
        });
    });

    describe('Instance tracking', () =>
    {
        it('should access registered instance', () =>
        {
            const instance = { id: 'some-id:1' };

            registerInstance(instance);

            expect(getInstance(instance.id)).toStrictEqual(instance);
        });

        it('should consolidate id when registering', () =>
        {
            registerInstance({ id: 'some-thing:1' });
            registerInstance({ id: 'some-thing:5' });

            expect(peekNextIdCount('some-thing')).toBe(6);
        });

        it('should throw when registering instance more than once', () =>
        {
            const instance = { id: 'some-id:2' };

            registerInstance(instance);

            expect(() => registerInstance(instance)).toThrow();
        });

        it('should unregister instances and throw when accessing unregistered instance', () =>
        {
            const instance = { id: 'some-id:3' };

            registerInstance(instance);
            unregisterInstance(instance);

            expect(() => unregisterInstance(instance)).toThrow();
        });

        it('should clear instances', () =>
        {
            registerInstance({ id: 'some-kind:1' });
            registerInstance({ id: 'some-kind:2' });
            clearInstances();

            expect(peekNextIdCount('some-kind')).toBe(1);
            expect(() => getInstance('some-kind:1')).toThrow();
        });
    });
});
