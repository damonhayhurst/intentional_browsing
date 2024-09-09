import {ChatSettings} from './settings.js';

const settings = ChatSettings.llama3();
const defaultIntention = "I want to carry out web development on my firefox extension"

setDefaultSettings(settings, defaultIntention)

function setDefaultSettings(settings, intention) {
    browser.storage.sync.get(['apiKey', 'prePrompt'])
        .then(data => {
            browser.storage.sync.set({
                apiKey: data.apiKey ? data.apiKey : settings.apiKey,
                prePrompt: data.prePrompt ? data.prePrompt : settings.prePrompt
            })
        })
    browser.storage.local.get("intention")
        .then(data => {
            if (!data.intention) {
                updateIntention(intention);
            }
        })
    setCurrentReply("")
}

function setCurrentReply(reply) {
    window.current_reply = reply;
}

function createSystemPrompt(prompt, intention) {
    return prompt.replace(/\[intention\]/gi, intention);
}

function askText(systemPrompt, content, apiKey) {

    const messages = [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": content }
    ];

    fetchChatCompletion(messages, apiKey)
 
}

function askImage(systemPrompt, image, apiKey) {

    const messages = [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": image }
    ];

    fetchChatCompletion(messages, apiKey)
}

function fetchChatCompletion(messages) {
    function getHeaders(apiKey) {
        const authHeader = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        return {
            'Content-Type': 'application/json',
            ...authHeader
        }
    }

    return fetch(settings.chatCompletionUrl, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            "model": settings.model,
            'messages': messages,
        })
    })
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension")
            } else {
                return response.json()
            }
        })
        .then(data => {
            if (data.choices) {
                return data.choices[0].message.content;
            } else {
                throw Error(data.message);
            }
        })
}

async function getIntention() {
    return browser.storage.local.get("intention")
        .then(data => {
            if (data.intention) {
                return data.intention;
            } else {
                throw Error("No intention found");
            }
        });
}

async function getApiKey() {
    return browser.storage.sync.get("apiKey")
        .then(data => {
            if (data.apiKey) {
                return data.apiKey;
            } else {
                throw Error("No API Key found");
            }
        })
}

async function getSystemPrompt(intention) {
    return browser.storage.sync.get("prePrompt")
        .then(data => {
            if (data.prePrompt) {
                return data.prePrompt;
            } else {
                throw Error("No Pre-Prompt found");
            }
        })
        .then(prompt => createSystemPrompt(prompt, intention));
}

async function main(content) {
    try {
        const intention = await getIntention();
        const systemPrompt = await getSystemPrompt(intention);
        const apiKey = await getApiKey();
        return askText(systemPrompt, content, apiKey);
    } catch (e) {
        console.log(e.message);
        throw e;
    }
}

async function main_image(image) {
    try {
        const intention = await getIntention();
        const systemPrompt = await getSystemPrompt(intention);
        const apiKey = await getApiKey();
        return ask_image(systemPrompt, content, apiKey);
    } catch (e) {
        console.log(e.message);
        throw e;
    }
}

function updateIntention(intention) {
    browser.storage.local.get("intention")
        .then(data => {
            if (data.intention !== intention) {
                browser.storage.local.set({ intention: intention })
                    .then(() => {
                        browser.storage.local.get("intentionHistory")
                            .then(data => {
                                addToIntentionHistoryList(data.intentionHistory, intention);
                            })
                    })
            }
        })

}

function addToIntentionHistoryList(intentionList, intention) {
    var intentionObj = {
        words: intention,
        favorite: false
    };
    if (intentionList) {
        intentionList.push(intentionObj)
        browser.storage.local.set({ intentionHistory: intentionList })
    } else {
        browser.storage.local.set({ intentionHistory: [intentionObj] })
    }
}

function addRemoveIntentionFromFavoritesMap(intention) {
    browser.storage.local.get("intentionFavorites")
        .then(data => {
            var favoritesMap;
            if (data.intentionFavorites) {
                favoritesMap = data.intentionFavorites;
                if (favoritesMap.has(intention)) {
                    favoritesMap.delete(intention)
                } else {
                    favoritesMap.set(intention, true);
                }
            } else {
                favoritesMap = new Map();
                favoritesMap.set(intention, true);
            }
            return browser.storage.local.set({ intentionFavorites: favoritesMap });
        })
}

function toggleShowFavoriteInHistoryList(intention) {
    browser.storage.local.get("intentionHistory")
        .then(data => {
            if (data.intentionHistory) {
                var intentionHistoryList = data.intentionHistory;
                for (let i = 0; i < intentionHistoryList.length; i++) {
                    if (intentionHistoryList[i].words === intention) {
                        intentionHistoryList[i].favorite = !intentionHistoryList[i].favorite
                    }
                }
                browser.storage.local.set({ intentionHistory: intentionHistoryList })
            }
        })
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.intention) {
        console.log(message.intention)
        updateIntention(message.intention)
    }
    if (message.content) {
        // main(message.content)
        //     .then(response => JSON.parse(response))
        //     .then(reply => {
        //         sendResponse({ reply: reply });
        //         setCurrentReply(reply)
        //     })
        //     .catch(error => sendResponse({ error: error }));
        // return true;
        captureScreenshot()
    }
    if (message.favorite) {
        addRemoveIntentionFromFavoritesMap(message.favorite);
        toggleShowFavoriteInHistoryList(message.favorite);
    }
    if (message.log) {
        console.log(message.log)
    }
});

// // /*
// // Update content when a new tab becomes active.
// // */
// browser.tabs.onActivated.addListener(sendParseMessage);

/*
Update content when a new page is loaded into a tab.
*/
// browser.tabs.onUpdated.addListener(sendParseMessage);

function captureScreenshot() {
    browser.tabs.captureVisibleTab(null, { format: "png" })
        .then((imageUri) => {
            console.log("Captured screenshot as a base64 data URL:");
            console.log(imageUri); // This will output the base64 data URL of the screenshot
            // You can save it or display it as needed
        })
        .catch((error) => {
            console.error("Error capturing screenshot: ", error);
        });
}


function sendParseMessage(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.status === 'complete') {
        browser.tabs.sendMessage(tabId, { parse: true });
    }
}

