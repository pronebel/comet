import EventEmitter from 'eventemitter3';

const emitter: EventEmitter = new EventEmitter();

export function events<T extends string>(): EventEmitter<T> {
    return emitter as unknown as EventEmitter<T>;
}