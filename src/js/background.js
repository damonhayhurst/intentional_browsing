import { LlamaSettings, OpenAISettings, ReaderLMSettings } from './settings.js';
import { UserStorageInterface } from './user.js';
import { fetchChatCompletion } from './completion.js';

const ChatSettings = OpenAISettings;
const User = UserStorageInterface;
User.setDefaultSettingsIfNotExists(ChatSettings, "I want to carry out web development on my firefox extension")
setCurrentReply("")


function setCurrentReply(reply) {
    window.current_reply = reply;
}

function askText(systemPrompt, content, apiKey) {

    const messages = [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": content }
    ];

    fetchChatCompletion(messages, apiKey, ChatSettings)
}

function askReaderLM(content) {

    const messages = [
        { "role": "user", "content": content }
    ];
    console.log(content)
    fetchChatCompletion(messages, undefined, ReaderLMSettings)
}

async function main(content) {
    const intention = await User.getIntention();
    const systemPrompt = await User.getSystemPrompt(intention);
    const apiKey = await User.getApiKey();
    return askText(systemPrompt, content, apiKey);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.intention) {
        console.log(message.intention)
        User.updateIntention(message.intention)
    }
    if (message.content) {
        console.log(message.content)
        main(message.content)
            .then(response => JSON.parse(response))
            .then(reply => {
                sendResponse({ reply: reply });
                setCurrentReply(reply)
            })
            .catch(error => sendResponse({ error: error }));
        return true;
    }
    if (message.html) {
        console.log(message.html)
        askReaderLM(message.html)
            .then(response => JSON.parse(response))
            .then(response => console.log(response))
            .then(reply => {
                sendResponse({ reply: reply });
                setCurrentReply(reply)
            })
            .catch(error => sendResponse({ error: error }));
        return true;
    }
    if (message.favorite) {
        User.toggleIntentionFromFavoritesMap(message.favorite);
        User.toggleShowFavoriteInHistoryList(message.favorite);
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


function sendParseMessage(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.status === 'complete') {
        browser.tabs.sendMessage(tabId, { parse: true });
    }
}

