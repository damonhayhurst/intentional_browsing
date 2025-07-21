import { backgroundLog } from './log';
import _ from 'lodash';
import { ObserverOptions } from '../types/index';

export class PageObserver {
    private target: Node;
    private options: ObserverOptions;
    private timeoutDuration: number;
    private debounceWait: number;
    private debounceMaxWait: number;
    private timeout?: number;
    private observer?: MutationObserver;
    private callbackFn?: () => void;

    constructor(target: Node, options: Partial<ObserverOptions> = {}) {
        this.target = target;
        console.log(options);
        this.options = {
            timeoutDuration: 5000,
            debounceWait: 1000,
            debounceMaxWait: 2000,
            ...options
        };
        this.timeoutDuration = this.options.timeoutDuration;
        this.debounceWait = this.options.debounceWait;
        this.debounceMaxWait = this.options.debounceMaxWait;
    }

    private mutationObserverOptions: MutationObserverInit = {
        childList: true,
        subtree: true
    };

    #observeMutation = (mutations: MutationRecord[], observer: MutationObserver): void => {
        clearTimeout(this.timeout);
        observer.disconnect();
        console.log("mutation");
        backgroundLog("Mutation observed");
        this.callbackFn?.();
    };

    #debounce(fn: (mutations: MutationRecord[], observer: MutationObserver) => void) {
        return _.debounce(fn, this.debounceWait, {
            'leading': false,
            'trailing': true,
            'maxWait': this.debounceMaxWait
        });
    }

    #startTimeout(): void {
        this.timeout = window.setTimeout(() => {
            backgroundLog('Timeout');
            console.log("timeout");
            this.callbackFn?.();
        }, this.timeoutDuration);
    }

    #createFinalMutationObserver(): MutationObserver {
        return new MutationObserver(
            this.#debounce(this.#observeMutation)
        );
    }

    observe(callbackFn: () => void): void {
        this.callbackFn = callbackFn;
        this.#startTimeout();
        this.observer = this.#createFinalMutationObserver();
        this.observer.observe(this.target, this.mutationObserverOptions);
    }
}