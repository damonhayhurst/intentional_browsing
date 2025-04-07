import '../css/options.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import browser from 'webextension-polyfill';

interface StorageData {
    apiKey?: string;
    prePrompt?: string;
}

type StorageDataRecord = Record<keyof StorageData, string>;

function saveOptions(e: Event): void {
    e.preventDefault();
    const apiKeyInput = document.querySelector<HTMLInputElement>("#api-key");
    const prePromptInput = document.querySelector<HTMLTextAreaElement>("#pre-prompt");

    if (apiKeyInput && prePromptInput) {
        browser.storage.sync.set({
            apiKey: apiKeyInput.value,
            prePrompt: prePromptInput.value
        });
    }
}

function restoreOptions(): void {
    function setCurrentConfig(result: Record<string, unknown>): void {
        const data = result as StorageDataRecord;
        const apiKeyInput = document.querySelector<HTMLInputElement>("#api-key");
        const prePromptInput = document.querySelector<HTMLTextAreaElement>("#pre-prompt");

        if (apiKeyInput && prePromptInput) {
            apiKeyInput.value = data.apiKey || '';
            prePromptInput.value = data.prePrompt || '';
        }
    }

    function onError(error: Error): void {
        console.error(`Error: ${error.message}`);
    }

    const defaultSettings: StorageDataRecord = {
        apiKey: '',
        prePrompt: ''
    };

    browser.storage.sync.get(defaultSettings)
        .then(setCurrentConfig)
        .catch(onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form")?.addEventListener("submit", saveOptions);
