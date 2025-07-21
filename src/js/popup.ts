import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/popup.css';
import * as browser from 'webextension-polyfill';
import { AIResponse, ReplyMessage } from '../types/index';

declare global {
    interface Window {
        current_reply?: AIResponse;
    }
}

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response?: any) => void) => {
    const typedMessage = message as ReplyMessage;
    if (typedMessage.reply) {
        populate(typedMessage.reply);
    }
    return true; // Keep the message channel open for async responses
});

function populate(reply: AIResponse): void {
    const replyElement = document.querySelector('.reply') as HTMLElement;
    const measureElement = document.querySelector('.measure') as HTMLElement;
    
    if (replyElement) {
        replyElement.textContent = reply.reasoning;
    }
    if (measureElement) {
        measureElement.textContent = reply.aligned;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    browser.runtime.getBackgroundPage().then((backgroundWindow: Window) => {
        if (backgroundWindow.current_reply) {
            populate(backgroundWindow.current_reply);
        }
    });
});