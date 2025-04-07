import { Tab } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../css/page.css';
import browser from 'webextension-polyfill';

interface IntentionItem {
    words: string;
    favorite: boolean;
}

interface StorageData {
    intention?: string;
    intentionHistory?: IntentionItem[];
    intentionFavorites?: Map<string, boolean>;
}

interface Reply {
    reasoning: string;
    likelihood?: string;
}

interface Message {
    reply?: Reply;
    intention?: string;
    favorite?: string;
    tryAgain?: boolean;
}

document.querySelector<HTMLFormElement>("#intention-form")?.addEventListener("submit", function(e: SubmitEvent) {
    e.preventDefault();    //stop form from submitting
    const intentionText = document.querySelector<HTMLInputElement>("#intention-text");
    if (intentionText) {
        intentionText.classList.add("form-control-plaintext");
        const intention = intentionText.value;
        browser.runtime.sendMessage({
            intention: intention
        })
        .catch(err => {
            console.log(err);
        });

        const submitter = e.submitter as HTMLInputElement;
        if (submitter?.name === "try-again") {
            history.back();
            sendTryAgain();
        }
        if (submitter?.name === "just-this-once") {
            history.back();
        }
    }
});

browser.runtime.onMessage.addListener((message: unknown, sender: browser.Runtime.MessageSender) => {
    if (typeof message === 'object' && message !== null && 'reply' in message) {
        const msg = message as Message;
        if (msg.reply) {
            populate(msg.reply);
        }
    }
});

function sendTryAgain(): void {
    browser.runtime.sendMessage({ tryAgain: true })
        .catch(error => console.error(error));
}

document.addEventListener('DOMContentLoaded', function() {
    browser.runtime.getBackgroundPage().then(window => {
        if ((window as any).current_reply) {
            populate((window as any).current_reply);
        }
    });
});

function populate(reply: Reply): void {
    const replyElement = document.querySelector('.reply');
    if (replyElement) {
        replyElement.textContent = reply.reasoning;
    }
}

function populateIntention(intention: string): void {
    const intentionText = document.querySelector<HTMLInputElement>("#intention-text");
    if (intentionText) {
        intentionText.value = intention;
    }
}

function changedIntentionListener(changes: { [key: string]: browser.Storage.StorageChange }): void {
    if ("intention" in changes) {
        browser.storage.local.get('intention')
            .then(data => populateIntention(data.intention as string));
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

window.addEventListener("load", function() {
    browser.storage.local.get(['intention', 'intentionHistory', 'intentionFavorites'])
        .then((data: StorageData) => {
            if (data.intention) {
                populateIntention(data.intention);
            }
            if (data.intentionHistory) {
                populateIntentionHistoryList(data.intentionHistory, data.intention);
            }
            if (data.intentionFavorites) {
                populateIntentionFavoritesList(data.intentionFavorites, data.intention);
            }
        });
});

function createCard(intention: string, isFavorite: boolean, isSelected: boolean): string {
    const star = isFavorite ? "bi-star-fill" : "bi-star";
    const selectInput = isSelected
        ? `<input class="btn btn-primary disabled" id="select" type="submit" value="Selected">`
        : `<input class="btn btn-primary" id="select" type="submit" value="Select">`;

    return `<div class="card">
                <div class="card-body">
                    <form class="form-floating intention-select-form">
                        ${intention}
                        <i class="${star} favorite-star text-black-50"></i>
                        ${selectInput}
                    </form>
                </div>
            </div>`;
}

function populateIntentionHistoryList(intentionList: IntentionItem[], currentIntention?: string): void {
    populateIntentionList(intentionList, ".intention-history-list", currentIntention);
}

function populateIntentionFavoritesList(favoritesMap: Map<string, boolean>, currentIntention?: string): void {
    const favoritesList = [...favoritesMap.keys()].map(intention => ({
        words: intention,
        favorite: true
    }));
    populateIntentionList(favoritesList, ".intention-favorites-list", currentIntention);
}

function populateIntentionList(intentionList: IntentionItem[], intentionListClassName: string, currentIntention?: string): void {
    const intentionListElement = document.querySelector(intentionListClassName);
    if (!intentionListElement) return;

    intentionListElement.innerHTML = "";
    for (const intention of intentionList) {
        const isCurrentIntention = intention.words === currentIntention;
        const card = createCard(intention.words, intention.favorite, isCurrentIntention);
        intentionListElement.insertAdjacentHTML('afterbegin', card);
        
        const intentionCardElement = intentionListElement.firstElementChild;
        if (!intentionCardElement) continue;

        intentionCardElement.addEventListener("submit", function(e: Event) {
            e.preventDefault();    //stop form from submitting
            const form = e.target as HTMLFormElement;
            browser.runtime.sendMessage({
                intention: form.innerText
            })
            .catch(err => {
                console.log(err);
            });
        });

        const starElement = intentionCardElement.querySelector('.favorite-star');
        if (starElement) {
            starElement.addEventListener("click", function(e: Event) {
                const target = e.target as HTMLElement;
                const words = target.parentElement?.innerText;
                if (words) {
                    browser.runtime.sendMessage({
                        favorite: words
                    })
                    .then(() => {
                        target.classList.toggle("bi-star");
                        target.classList.toggle("bi-star-fill");
                    });
                }
            });
        }
    }

    const intentionText = document.querySelector<HTMLInputElement>("#intention-text");
    if (intentionText) {
        intentionText.classList.add("form-control-plaintext");
    }
}

const triggerTabList = document.querySelectorAll<HTMLButtonElement>('.nav-tabs button');
triggerTabList.forEach(triggerEl => {
    const tabTrigger = new Tab(triggerEl);

    triggerEl.addEventListener('click', event => {
        event.preventDefault();
        tabTrigger.show();
    });
});
