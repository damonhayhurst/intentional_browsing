import browser from 'webextension-polyfill';

export function backgroundLog(message: string): void {
    browser.runtime.sendMessage({ log: message });
}
