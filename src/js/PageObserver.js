import { backgroundLog } from './log.js';
import _ from 'lodash';

export class PageObserver {

    constructor(target, options = {}) {
        this.target = target;
        console.log(options)
        this.options = {timeoutDuration: 5000, debounceWait: 1000, debounceMaxWait: 2000, ...options}
        this.timeoutDuration = this.options.timeoutDuration;
        this.debounceWait = this.options.debounceWait;
        this.debounceMaxWait = this.debounceMaxWait;
    }

    mutationObserverOptions = {
        childList: true,
        subtree: true
    }

    #observeMutation = (mutations, observer) => {
        clearTimeout(this.timeout);
        observer.disconnect();
        console.log("mutation")
        backgroundLog("Mutation observed");
        this.callbackFn();
    }


    #debounce(fn) {
        return _.debounce(fn, this.debounceWait, {
            'leading': false,
            'trailing': true,
            'maxWait': this.debounceMaxWait
        });
    }

    #startTimeout() {
        this.timeout = setTimeout(() => {
            backgroundLog('Timeout');
            console.log("timeout");
            this.callbackFn();
        }, this.timeoutDuration);
    }

    #createFinalMutationObserver() {
        return new MutationObserver(
            this.#debounce(this.#observeMutation)
        );
    }

    observe(callbackFn) {
        this.callbackFn = callbackFn
        this.#startTimeout();
        this.observer = this.#createFinalMutationObserver();
        this.observer.observe(this.target, this.mutationObserverOptions);
    }
}