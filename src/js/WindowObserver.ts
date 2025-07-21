import { backgroundLog } from "./log.js";

export class WindowObserver {
    constructor(callback: () => void, trackUrlInterval: number = 100) {
        new WindowLoadEventSingleton(callback);
        this.#trackUrlChanges(callback, trackUrlInterval);
    }

    #trackUrlChanges(callback: () => void, trackUrlInterval: number = 100): void {
        let currentUrl = window.location.href;

        function checkUrlChange(): void {
            if (window.location.href !== currentUrl) {
                callback();
                currentUrl = window.location.href;
            }
        }

        // Check URL periodically
        setInterval(checkUrlChange, trackUrlInterval);
    }
}

class WindowLoadEventSingleton {
    private callback: () => void;
    private hasRun: boolean;

    constructor(callback: () => void) {
        this.callback = callback;
        this.hasRun = false;
        this.setup();
    }

    setup(): void {
        const triggerCallback = (): void => {
            if (!this.hasRun) {
                this.hasRun = true;
                this.callback();
                cleanup();
            }
        };

        const loadCallback = (): void => {
            backgroundLog('loadCallback');
            triggerCallback();
        };

        const domContentLoadCallback = (): void => {
            backgroundLog('domContentLoadedCallback');
            triggerCallback();
        };

        const popStateCallback = (): void => {
            backgroundLog('popstateCallback');
            triggerCallback();
        };

        const add = (): void => {
            window.addEventListener('load', loadCallback);
            window.addEventListener('DOMContentLoaded', domContentLoadCallback);
            window.addEventListener('popstate', popStateCallback);
        };

        const cleanup = (): void => {
            window.removeEventListener('load', loadCallback);
            window.removeEventListener('DOMContentLoaded', domContentLoadCallback);
            window.removeEventListener('popstate', popStateCallback);
        };

        add();
    }
}