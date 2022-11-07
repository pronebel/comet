import EventEmitter from 'eventemitter3';

const emitter: EventEmitter = new EventEmitter();

export type EventDeclaration = Record<string, object>;

export function getGlobalEmitter<T>() {
    type K = keyof T extends string ? keyof T : never;
    return emitter as unknown as Omit<EventEmitter<K>, 'emit'> & {
        emit<E extends keyof T>(event: E, payload: T[E]): boolean;
    };
}

