import { OllamaSettings, OpenAISettings, ReaderLMSettings } from './settings.js';
import { UserStorageInterface } from './user.js';
import { fetchChatCompletion } from './completion.js';
import { PageAnalysis } from './PageAnalysis.js';

const ChatSettings = new OllamaSettings();
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
    return fetchChatCompletion(messages, apiKey, ChatSettings)
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
    const systemPrompt = ChatSettings.createSystemPrompt(intention);
    const apiKey = await User.getApiKey();
    return askText(systemPrompt, content, apiKey);
}

function parseCompletionResponse(response) {
    response = response.replace(/\n/g, '');
    return JSON.parse(response)
}

const messageHandlers = {
    intention: async (message) => {
        console.log(message.intention);
        await User.updateIntention(message.intention);
    },
    content: async (message, sendResponse) => {
        try {
            const response = await main(message.content);
            const reply = parseCompletionResponse(response);
            sendResponse({ reply });
            setCurrentReply(reply);
        } catch (error) {
            console.error("Error:", error);
            sendResponse({ error });
        }
    },
    html: async (message, sendResponse) => {
        console.log(message.html);
        try {
            const response = await main(message.content);
            const reply = JSON.parse(response);
            sendResponse({ reply });
            setCurrentReply(reply);
        } catch (error) {
            console.error("Error:", error);
            sendResponse({ error });
        }
    },
    action: async (message, sendResponse) => {
        console.log(message.action);
        try {
            const response = await main(message.content);
            const reply = parseCompletionResponse(response);
            sendResponse({ reply });
            setCurrentReply(reply);
        } catch (error) {
            console.error("Error:", error);
            sendResponse({ error });
        }
    },   
    favorite: (message) => {
        User.toggleIntentionFromFavoritesMap(message.favorite);
        User.toggleShowFavoriteInHistoryList(message.favorite);
    },
    log: (message) => {
        console.log(currentTime)
        console.log(message.log);
    }
};

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const messageType = Object.keys(message)[0];
    const handler = messageHandlers[messageType];
    
    if (handler) {
        const result = handler(message, sendResponse);
        if (result instanceof Promise) {
            return true; // Indicates that we will send a response asynchronously
        }
    }
});

function sendParseMessage(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.status === 'complete') {
        browser.tabs.sendMessage(tabId, { parse: true });
    }
}

let fullSource = {}

// browser.webRequest.onCompleted.addListener(
//     function (details) {
//         if (details.type === "main_frame") {
//             fetch(details.url)
//                 .then(response => response.text())
//                 .then(text => {
//                     fullSource[details.tabId] = text;
//                     const parser = new DOMParser();
//                     const doc = parser.parseFromString(text, 'text/html');
//                     const analysis = new PageAnalysis(doc)
    
//                     const body = analysis.getBodyHTML()
//                     main(body)
//                     .then(response => {
//                         const reply = parseCompletionResponse(response);
//                     })
//                 })
//                 .catch(error => console.error('Error fetching source:', error));
//         }
//     },
//     { urls: ["<all_urls>"] },
//     ["responseHeaders"]
// );

// Uncomment these listeners if needed
// browser.tabs.onActivated.addListener(sendParseMessage);
// browser.tabs.onUpdated.addListener(sendParseMessage);
