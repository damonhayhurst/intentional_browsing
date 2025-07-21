import '../css/options.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import * as browser from 'webextension-polyfill';

interface StorageData {
    apiKey?: string;
    prePrompt?: string;
}

function saveOptions(e: Event): void {
    e.preventDefault();
    
    const apiKeyInput = document.querySelector("#api-key") as HTMLInputElement;
    const prePromptInput = document.querySelector("#pre-prompt") as HTMLTextAreaElement;
    
    if (!apiKeyInput || !prePromptInput) {
        console.error('Required form elements not found');
        return;
    }
    
    browser.storage.sync.set({
        apiKey: apiKeyInput.value,
        prePrompt: prePromptInput.value
    });
}

function restoreOptions(): void {
    function setCurrentConfig(result: StorageData): void {
        const apiKeyInput = document.querySelector("#api-key") as HTMLInputElement;
        const prePromptInput = document.querySelector("#pre-prompt") as HTMLTextAreaElement;
        
        if (apiKeyInput && result.apiKey !== undefined) {
            apiKeyInput.value = result.apiKey;
        }
        if (prePromptInput && result.prePrompt !== undefined) {
            prePromptInput.value = result.prePrompt;
        }
    }

    function onError(error: Error): void {
        console.log(`Error: ${error}`);
    }

    const getting = browser.storage.sync.get({apiKey: '', prePrompt: ''});
    getting.then(setCurrentConfig, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);

const form = document.querySelector("form") as HTMLFormElement;
if (form) {
    form.addEventListener("submit", saveOptions);
}