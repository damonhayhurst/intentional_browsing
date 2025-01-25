import { OllamaSettings, OpenAISettings, ReaderLMSettings } from './settings.js';
import { UserStorageInterface } from './user.js';
import { ChatCompletion, ChatGenerate, fetchChatCompletion, fetchChatGeneration } from './completion.js';
import { PageAnalysis } from './PageAnalysis.js';
import {AutoTokenizer} from '@transformers';

const ChatSettings = OllamaSettings;
const MODEL = "qwen2.5:3b" 
const HF_MODEL = "Qwen/Qwen2.5-3B-Instruct";
const User = UserStorageInterface;
const Tokenizer = AutoTokenizer;

// Maintain a reference to the current active fetch and its AbortController
let currentFetchController = null;

User.setDefaultSettingsIfNotExists(ChatSettings, "I want to carry out web development on my firefox extension")
setCurrentReply("")

async function getNTokenPrompt(completion, n=4000, buffer=25) {
    const tokenizer = await AutoTokenizer.from_pretrained(HF_MODEL)
    const input_ids = await tokenizer.apply_chat_template(
        completion.messages,
        {   
            tokenize: true,
            return_tensor: false,
            add_generation_prompt: true
        }
    );
    const promptEnd = input_ids.splice(-5); 
    const promptStart = input_ids.slice(0, n - buffer - 6);
    const nTokenPrompt = tokenizer.decode([...promptStart, ...promptEnd])
    console.log(nTokenPrompt)
    return nTokenPrompt
}

function setCurrentReply(reply) {
    window.current_reply = reply;
}

function askReaderLM(content) {
    const messages = [
        { "role": "user", "content": content }
    ];
    console.log(content)
    fetchChatCompletion(messages, undefined, ReaderLMSettings)
}

async function main(content) {
    cancelPriorFetches();
    currentFetchController = new AbortController();
    const intention = await User.getIntention();
    const systemPrompt = await User.createSystemPrompt(intention);
    const apiKey = await User.getApiKey();
    const completion = new ChatGenerate(systemPrompt, content)
    const template = await getNTokenPrompt(completion, 4000)
    const settings = new ChatSettings({ 
        model: MODEL, 
        chatCompletionUrl: 'http://localhost:11434/api/generate', 
        contextSize: 4000, 
        format: "json"
    })
    
    return fetchChatGeneration(template, apiKey, settings, currentFetchController.signal)
        .then(async data => parseCompletionResponse(data.response))
        .catch(err => {
            if (err.name === 'AbortError') {
                console.log('Fetches aborted');
                return null; // or handle aborted fetch as needed
            }
            throw err; // Re-throw other errors
        });
}

function cancelPriorFetches() {
    // Abort the current fetch if it exists
    if (currentFetchController) {
        currentFetchController.abort();
        currentFetchController = null;
    }
}

function parseCompletionResponse(response) {
    response = response.replace(/\n/g, '');
    response = response.replace(/\\/g, '')
    response = response.replace(/```/g, '')
    response = extractWithCurlyBrackets(response)   
    try {
        if (!response) {
            throw new Error("No content found in the response");
        }
        return JSON.parse(response);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        throw new Error('Failed to parse response: ' + response);
    }
}

function extractWithCurlyBrackets(str) {
    const regex = /{[^}]*}/;
    const match = str.match(regex);
    return match ? match[0] : null;
}

const messageHandlers = {
    intention: async (message) => {
        await User.updateIntention(message.intention);
    },
    content: async (message, sendResponse) => {
        try {
            const reply = await main(message.content);
            console.log(reply)
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
        console.debug(message.log);
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

//     },
//     { urls: ["<all_urls>"] },
//     ["responseHeaders"]
// );

// Uncomment these listeners if needed
// browser.tabs.onActivated.addListener(sendParseMessage);
// browser.tabs.onUpdated.addListener(sendParseMessage);
