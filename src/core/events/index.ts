import EventEmitter from 'eventemitter3';

const emitter: EventEmitter = new EventEmitter();

export function getGlobalEmitter<T extends string>() {
    return emitter as unknown as EventEmitter<T>;
}