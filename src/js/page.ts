import Tab from '../../node_modules/bootstrap/js/dist/tab.js';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../../node_modules/bootstrap-icons/font/bootstrap-icons.css';
import '../css/page.css';
import * as browser from 'webextension-polyfill';
import { AIResponse, ReplyMessage, IntentionMessage } from '../types/index';

interface IntentionItem {
    words: string;
    favorite: boolean;
}

interface StorageData {
    intention?: string;
    intentionHistory?: IntentionItem[];
    intentionFavorites?: Map<string, boolean>;
}

interface BackgroundWindow extends Window {
    current_reply?: AIResponse;
}

declare global {
    interface Window {
        current_reply?: AIResponse;
    }
}

const intentionForm = document.querySelector("#intention-form") as HTMLFormElement;
if (intentionForm) {
    intentionForm.addEventListener("submit", function(e: SubmitEvent) {
        e.preventDefault();
        
        const intentionTextInput = document.querySelector("#intention-text") as HTMLInputElement;
        if (!intentionTextInput) {
            console.error('Intention text input not found');
            return;
        }
        
        intentionTextInput.classList.add("form-control-plaintext");
        const intention = intentionTextInput.value;
        
        browser.runtime.sendMessage({
            intention: intention
        } as IntentionMessage)
        .catch(err => {
            console.log(err);
        });
        
        const submitter = e.submitter as HTMLInputElement;
        if (submitter && submitter.name === "try-again") {
            history.back();
            sendTryAgain();
        }
        if (submitter && submitter.name === "just-this-once") {
            history.back();
        }
    });
}

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response?: any) => void) => {
    const typedMessage = message as ReplyMessage;
    if (typedMessage.reply) {
        populate(typedMessage.reply);
    }
    return true; // Keep the message channel open for async responses
});

function sendTryAgain(): void {
    browser.runtime.sendMessage({ tryAgain: true })
        .catch(error => console.error(error));
}

document.addEventListener('DOMContentLoaded', function() {
    browser.runtime.getBackgroundPage().then((backgroundWindow: BackgroundWindow) => {
        if (backgroundWindow.current_reply) {
            populate(backgroundWindow.current_reply);
        }
    });
});

function populate(reply: AIResponse): void {
    const replyElement = document.querySelector('.reply') as HTMLElement;
    if (replyElement) {
        replyElement.textContent = reply.reasoning;
    }
    // document.querySelector('.measure').textContent = reply.likelihood;
}

function populateIntention(intention: string): void {
    const intentionTextInput = document.querySelector("#intention-text") as HTMLInputElement;
    if (intentionTextInput) {
        intentionTextInput.value = intention;
    }
}

function changedIntentionListener(changes: { [key: string]: any }): void {
    if ("intention" in changes) {
        browser.storage.local.get('intention')
        .then(data => {
            if (data.intention) {
                populateIntention(data.intention as string);
            }
        });
    }
    if ("intentionHistory" in changes) {
        browser.storage.local.get(['intentionHistory', 'intention'])
        .then(data => populateIntentionHistoryList(data.intentionHistory as IntentionItem[], data.intention as string));
    }
    if ("intentionFavorites" in changes) {
        browser.storage.local.get(['intentionFavorites', 'intention'])
        .then(data => populateIntentionFavoritesList(data.intentionFavorites as Map<string, boolean>, data.intention as string));
    }
}

browser.storage.local.onChanged.addListener(changedIntentionListener);

window.addEventListener("load", function(e: Event) {
    browser.storage.local.get(['intention', 'intentionHistory', 'intentionFavorites'])
    .then((data: any) => {
        if (data.intention) {
            populateIntention(data.intention as string);
        }
        if (data.intentionHistory) {
            populateIntentionHistoryList(data.intentionHistory as IntentionItem[], data.intention as string);
        }
        if (data.intentionFavorites) {
            populateIntentionFavoritesList(data.intentionFavorites as Map<string, boolean>, data.intention as string);
        }
    });
});

function createCard(intention: string, isFavorite: boolean, isSelected: boolean): string {
    const star = isFavorite ? "bi-star-fill" : "bi-star";
    const selectInput = (() => {
        if (isSelected) {
            return `<input class="btn btn-primary disabled" id="select" type="submit" value="Selected">`;
        } else {
            return `<input class="btn btn-primary" id="select" type="submit" value="Select">`;
        }
    })();
    const card = `<div class="card">
                <div class="card-body">
                    <form class="form-floating intention-select-form">
                        ${intention}
                        <i class="${star} favorite-star text-black-50"></i>
                        ${selectInput}
                    </form>
                </div>
            </div>`;
    return card;
}

function populateIntentionHistoryList(intentionList: IntentionItem[], currentIntention?: string): void {
    populateIntentionList(intentionList, ".intention-history-list", currentIntention);
}

function populateIntentionFavoritesList(favoritesMap: Map<string, boolean>, currentIntention?: string): void {
    const favoritesList = Array.from(favoritesMap.keys());
    const favoritesIntentionList = favoritesList.map(intention => ({words: intention, favorite: true}));
    populateIntentionList(favoritesIntentionList, ".intention-favorites-list", currentIntention);
}

function populateIntentionList(intentionList: IntentionItem[], intentionListClassName: string, currentIntention?: string): void {
    const intentionListElement = document.querySelector(intentionListClassName) as HTMLElement;
    if (!intentionListElement) {
        console.error(`Element with class ${intentionListClassName} not found`);
        return;
    }
    
    intentionListElement.innerHTML = "";
    for (const intention of intentionList) {
        const isCurrentIntention = intention.words === currentIntention;
        const card = createCard(intention.words, intention.favorite, isCurrentIntention);
        intentionListElement.insertAdjacentHTML('afterbegin', card);
        
        const intentionCardElement = intentionListElement.firstElementChild as HTMLElement;
        if (intentionCardElement) {
            intentionCardElement.addEventListener("submit", function(e: SubmitEvent) {
                e.preventDefault();
                const target = e.target as HTMLFormElement;
                browser.runtime.sendMessage({
                    intention: target.innerText
                } as IntentionMessage)
                .catch(err => {
                    console.log(err);
                });
            });
            
            const favoriteStarElement = intentionCardElement.querySelector('.favorite-star') as HTMLElement;
            if (favoriteStarElement) {
                favoriteStarElement.addEventListener("click", function (e: MouseEvent) {
                    const target = e.target as HTMLElement;
                    const words = target.parentElement?.innerText || '';
                    browser.runtime.sendMessage({
                        favorite: words
                    })
                    .then(() => {
                        target.classList.toggle("bi-star");
                        target.classList.toggle("bi-star-fill");
                    });
                });
            }
        }
    }
    
    const intentionTextInput = document.querySelector("#intention-text") as HTMLInputElement;
    if (intentionTextInput) {
        intentionTextInput.classList.add("form-control-plaintext");
    }
}

const triggerTabList = document.querySelectorAll('.nav-tabs button') as NodeListOf<HTMLButtonElement>;
triggerTabList.forEach(triggerEl => {
    const tabTrigger = new Tab(triggerEl);

    triggerEl.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        tabTrigger.show();
    });
});