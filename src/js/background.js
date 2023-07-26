const openai_url = 'https://api.openai.com/v1/chat/completions';

let defaultSettings = {
    apiKey: "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",
    prePrompt: "I want you to act as a productivity assistant. " +
    "I will provide you with a piece of content and you need to determine whether that piece of content " +
    "will be helpful towards achieving my intention. My intention is: '[intention]'. You must answer with" +
    "true or false to the statement, 'this content is helpful towards achieving the intention' and give your reasoning also." +
    "I want you to be lenient. If the page is likely to be degree away from a page that is helpful to the intention. " +
    "Then it should be deemed to be helpful. Any content related" +
    " to the acceptance of cookies should be ok too. Your response should be in json format with keys, reasoning and " +
    "decision. Where decision is true or false. ",
    intention: "I want to carry out web development on my firefox extension"
}

setDefaultSettings()

function setDefaultSettings() {
    browser.storage.sync.get(['apiKey', 'prePrompt'])
    .then(data => {
        browser.storage.sync.set({
            apiKey: data.apiKey ? data.apiKey : defaultSettings.apiKey,
            prePrompt: data.prePrompt ? data.prePrompt : defaultSettings.prePrompt
        })
    })
    browser.storage.local.get("intention")
    .then(data => {
        if (!data.intention) {
            updateIntention(defaultSettings.intention);
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

function ask (systemPrompt, content, apiKey) {

    const messages = [
        {"role": "system", "content": systemPrompt},
        {"role": "user", "content": content}
    ];

    return fetch(openai_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            "model": "gpt-3.5-turbo",
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

async function getSystemPrompt(intention){
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
        return ask(systemPrompt, content, apiKey);
    } catch (e) {
        console.log(e.message);
        throw e;
    }
}

window.current_reply = "";

function updateIntention(intention) {
    browser.storage.local.set({ intention : intention })
    .then(() => {
        browser.storage.local.get("intentionHistory")
        .then(data => {
            addToIntentionHistoryList(data.intentionHistory, intention);
        })
    })
}

function addToIntentionHistoryList(intentionList, intention) {
    var intentionObj = {
        words: intention,
        favorite: false
    };
    if (intentionList) {
        intentionList.push(intentionObj)
        browser.storage.local.set({intentionHistory: intentionList})
    } else {
        browser.storage.local.set({intentionHistory: [intentionObj]})
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
        return browser.storage.local.set({intentionFavorites: favoritesMap});
    })
}

function toggleShowFavoriteInHistoryList(intention) {
    browser.storage.local.get("intentionHistory")
    .then(data => {
        if (data.intentionHistory) {
            var intentionHistoryList = data.intentionHistory;
            for (i = 0; i < intentionHistoryList.length; i++) {
                if (intentionHistoryList[i].words === intention) {
                    intentionHistoryList[i].favorite = !intentionHistoryList[i].favorite
                }
            }
            browser.storage.local.set({intentionHistory: intentionHistoryList})
        }
    })
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.intention) {
        console.log(message.intention)
        updateIntention(message.intention)
    }
    if (message.content) {
        main(message.content)
        .then(response => JSON.parse(response))
        .then(reply => {
            sendResponse({reply: reply});
            setCurrentReply(reply)
        })
        .catch(error => sendResponse({error: error}));
        return true;
    }
    if (message.favorite) {
        addRemoveIntentionFromFavoritesMap(message.favorite);
        toggleShowFavoriteInHistoryList(message.favorite);
    }
});

function sendParseMessage() {
    browser.tabs.sendMessage(details.tabId, {parse: true});
}

  