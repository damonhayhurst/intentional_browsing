import { backgroundLog } from './log.js';
import debounce from 'lodash.debounce';

interface PageObserverOptions {
    timeoutDuration?: number;
    debounceWait?: number;
    debounceMaxWait?: number;
}

export class PageObserver {
    private target: Node;
    private options: Required<PageObserverOptions>;
    private timeoutDuration: number;
    private debounceWait: number;
    private debounceMaxWait: number;
    private timeout?: NodeJS.Timeout;
    private observer?: MutationObserver;
    private callbackFn?: () => void;

    readonly mutationObserverOptions: MutationObserverInit = {
        childList: true,
        subtree: true
    };

    constructor(target: Node, options: PageObserverOptions = {}) {
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

    #observeMutation = (_mutations: MutationRecord[], observer: MutationObserver): void => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        observer.disconnect();
        console.log("mutation");
        backgroundLog("Mutation observed");
        if (this.callbackFn) {
            this.callbackFn();
        }
    };

    #debounce(fn: (...args: any[]) => void): (...args: any[]) => void {
        return debounce(fn, this.debounceWait, {
            'leading': false,
            'trailing': true,
            'maxWait': this.debounceMaxWait
        });
    }

    #startTimeout(): void {
        this.timeout = setTimeout(() => {
            backgroundLog('Timeout');
            console.log("timeout");
            if (this.callbackFn) {
                this.callbackFn();
            }
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
