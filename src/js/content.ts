import { PageAnalysisFactory } from './PageAnalysisFactory';
import { PageObserver } from './PageObserver';
import { backgroundLog } from './log';
import { WindowObserver } from './WindowObserver';
import browser from 'webextension-polyfill';

const DO_BLOCK = true;

interface Reply {
    reasoning: string;
    aligned: string;
    likelihood?: string;
}

interface Message {
    tryAgain?: boolean;
    action?: string;
    content?: string;
    reply?: Reply;
    error?: string;
}

function createWindowObserver(): void {
    new WindowObserver(() => {
        const observer = new PageObserver(document, {
            timeoutDuration: 5000,
            debounceWait: 1000,
            debounceMaxWait: 2000
        });
        observer.observe(() => {
            const analysis = PageAnalysisFactory.create(document);
            analysis.parse();
            backgroundLog(JSON.stringify(analysis.meta));
            sendContent(analysis.output);
        });
    });
}

createWindowObserver();

function populate(reasoning: string, measure: string): void {
    const replyElement = document.querySelector('.reply');
    const measureElement = document.querySelector('.measure');

    if (replyElement) {
        replyElement.textContent = reasoning;
    }
    if (measureElement) {
        measureElement.textContent = measure;
    }
}

function blockContentByDecision(reply: Reply): void {
    const decision = /^true$/i.test(reply.aligned);
    if (!decision && DO_BLOCK) {
        blockContent();
        populate(reply.reasoning, reply.aligned);
    }
}

function blockContent(): void {
    document.location.href = browser.runtime.getURL("html/page.html");
}

function blockContentByLikelihood(reply: Reply): void {
    if (reply.likelihood) {
        const percentage = parseInt(reply.likelihood);
        if (percentage < 50) {
            blockContent();
            populate(reply.reasoning, reply.likelihood);
        }
    }
}

function sendAction(action: string = 'getSource'): void {
    browser.runtime.sendMessage({ action: action })
        .then((response: unknown) => {
            const msg = response as Message;
            if (msg.error) {
                throw new Error(msg.error);
            }
            if (msg.reply) {
                console.log(msg.reply);
                browser.runtime.sendMessage(msg.reply);
                blockContentByDecision(msg.reply);
            }
        })
        .catch(error => console.error(error));
}

function sendContent(content: string): void {
    browser.runtime.sendMessage({ content: content })
        .then((response: unknown) => {
            const msg = response as Message;
            if (msg.error) {
                throw new Error(msg.error);
            }
            if (msg.reply) {
                console.log(msg.reply);
                browser.runtime.sendMessage(msg.reply);
                blockContentByDecision(msg.reply);
            }
        })
        .catch(error => console.error(error));
}

browser.runtime.onMessage.addListener((message: unknown) => {
    if (typeof message === 'object' && message !== null && 'tryAgain' in message) {
        createWindowObserver();
    }
});
