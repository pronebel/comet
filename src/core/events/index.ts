import EventEmitter from 'eventemitter3';

import { getUserLogColor, getUserName } from '../../editor/sync/user';

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:teal';

const emitter: EventEmitter = new EventEmitter();

// debug logging
(emitter as any).emit = function emit(event: string, ...args: any[])
{
    console.log(`%c${logId}:%cEmit: "${event}"`, userColor, logStyle);
    EventEmitter.prototype.emit.apply(emitter, [event, ...args]);
};

export type EventDeclaration = Record<string, object>;

export function getGlobalEmitter<T>()
{
    type K = keyof T extends string ? keyof T : never;

    return emitter as unknown as Omit<EventEmitter<K>, 'emit'> & {
        emit: <E extends keyof T>(event: E, payload: T[E]) => boolean;
    };
}

