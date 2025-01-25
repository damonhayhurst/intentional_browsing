import { backgroundLog } from "./log.js";

export class WindowObserver {

    constructor(callback, trackUrlInterval = 100) {
        new WindowLoadEventSingleton(callback);
        this.#trackUrlChanges(callback, trackUrlInterval);
    }

    #trackUrlChanges(callback, trackUrlInterval = 100) {
        let currentUrl = window.location.href;

        function checkUrlChange() {
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
    constructor(callback) {
        this.callback = callback;
        this.hasRun = false;
        this.setup();
    }

    setup() {
        const triggerCallback = () => {
            if (!this.hasRun) {
                this.hasRun = true;
                this.callback();
                cleanup();
            }
        };

        const loadCallback = () => {
            backgroundLog('loadCallback')
            triggerCallback();
        };

        const domContentLoadCallback = () => {
            backgroundLog('domContentLoadedCallback')
            triggerCallback();
        }; 

        const popStateCallback = () => {
            backgroundLog('popstateCallback')
            triggerCallback();
        };

        const add = () => {
            window.addEventListener('load', loadCallback);
            window.addEventListener('DOMContentLoaded', domContentLoadCallback);
            window.addEventListener('popstate', popStateCallback);
        }

        const cleanup = () => {
            window.removeEventListener('load', loadCallback);
            window.removeEventListener('DOMContentLoaded', domContentLoadCallback);
            window.removeEventListener('popstate', popStateCallback);
        }

        add();
    }
}
