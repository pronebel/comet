import EventEmitter from 'eventemitter3';
import type { KeyHandler } from 'hotkeys-js';
import hotkeys, { type HotkeysEvent } from 'hotkeys-js';

export const isMac = () =>
    window.navigator.platform.toLowerCase().indexOf('mac') === 0;

export interface ActionOptions
{
    isEnabled: boolean;
    isChecked: boolean;
    canToggle: boolean;
    hotkey: string;
}

export const defaultActionOptions: Omit<ActionOptions, 'hotkey'> = {
    isEnabled: true,
    isChecked: false,
    canToggle: false,
};

export type ActionConstructorOptions = Partial<ActionOptions> & { hotkey: string };

export class Action
{
    public id: string;
    public isEnabled: boolean;
    public isChecked: boolean;
    public canToggle: boolean;
    public hotkey: string;
    public handler: KeyHandler;

    public static actions: Map<string, Action> = new Map();
    public static emitter = new EventEmitter<'execute'>();

    public static register(id: string, handler: KeyHandler, options: ActionConstructorOptions)
    {
        return new Action(id, handler, options).register();
    }

    constructor(id: string, handler: KeyHandler, options: ActionConstructorOptions)
    {
        if (Action.actions.has(id))
        {
            throw new Error(`Action "${id}" already registered`);
        }

        const { isEnabled, isChecked, canToggle } = {
            ...defaultActionOptions,
            ...options,
        };

        this.id = id;
        this.handler = handler;
        this.hotkey = options.hotkey;
        this.isEnabled = isEnabled;
        this.isChecked = isChecked;
        this.canToggle = canToggle;
    }

    get printShortcut()
    {
        return this.hotkey
            .split('+')
            .map((part) => part[0].toUpperCase() + part.substring(1))
            .join(' ');
    }

    protected register()
    {
        if (this.hotkey)
        {
            hotkeys(this.hotkey, (event, handler) =>
            {
                event.preventDefault();
                this.execute(event, handler);

                return false;
            });
        }

        Action.actions.set(this.id, this);

        return this;
    }

    public unregister()
    {
        if (this.hotkey)
        {
            hotkeys.unbind(this.hotkey);
        }
    }

    public execute(event: KeyboardEvent, handler: HotkeysEvent)
    {
        if (this.isEnabled)
        {
            if (this.canToggle)
            {
                this.isChecked = !this.isChecked;
            }
            this.handler(event, handler);

            Action.emitter.emit('execute', this, event, handler);
        }
    }
}
