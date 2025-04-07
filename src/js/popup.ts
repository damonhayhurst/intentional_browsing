import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/popup.css';
import browser from 'webextension-polyfill';

interface Reply {
    reasoning: string;
    aligned: string;
}

interface Message {
    reply?: Reply;
}

browser.runtime.onMessage.addListener((message: unknown, sender: browser.Runtime.MessageSender) => {
    if (typeof message === 'object' && message !== null && 'reply' in message) {
        const msg = message as Message;
        if (msg.reply) {
            populate(msg.reply);
        }
    }
});

function populate(reply: Reply): void {
    const reasoningElement = document.querySelector('.reply');
    const measureElement = document.querySelector('.measure');

    if (reasoningElement) {
        reasoningElement.textContent = reply.reasoning;
    }
    if (measureElement) {
        measureElement.textContent = reply.aligned;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    browser.runtime.getBackgroundPage().then(window => {
        if ((window as any).current_reply) {
            populate((window as any).current_reply);
        }
    });
});
