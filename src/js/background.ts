import { OllamaSettings, OpenAISettings, ReaderLMSettings } from './settings';
import { UserStorageInterface } from './user';
import { ChatCompletion, ChatGenerate, fetchChatCompletion, fetchChatGeneration } from './completion';
import { PageAnalysis } from './PageAnalysis';
import { AutoTokenizer } from '@transformers/tokenizers';
import browser from 'webextension-polyfill';

interface MessageResponse {
    reply?: any;
    error?: Error;
}

interface IntentionMessage {
    intention: string;
}

interface ContentMessage {
    content: string;
}

interface HtmlMessage {
    html: string;
    content: string;
}

interface ActionMessage {
    action: string;
    content: string;
}

interface FavoriteMessage {
    favorite: string;
}

interface LogMessage {
    log: string;
}

type Message = 
    | IntentionMessage 
    | ContentMessage 
    | HtmlMessage 
    | ActionMessage 
    | FavoriteMessage 
    | LogMessage;

const ChatSettings = OllamaSettings;
const MODEL = "qwen2.5:3b";
const HF_MODEL = "Qwen/Qwen2.5-3B-Instruct";
const User = UserStorageInterface;
const Tokenizer = AutoTokenizer;

// Maintain a reference to the current active fetch and its AbortController
let currentFetchController: AbortController | null = null;

User.setDefaultSettingsIfNotExists(ChatSettings, "I want to carry out web development on my firefox extension");
setCurrentReply("");

async function getNTokenPrompt(completion: ChatGenerate, n: number = 4000, buffer: number = 25): Promise<string> {
    const tokenizer = await AutoTokenizer.from_pretrained(HF_MODEL);
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
    const nTokenPrompt = tokenizer.decode([...promptStart, ...promptEnd]);
    console.log(nTokenPrompt);
    return nTokenPrompt;
}

function setCurrentReply(reply: any): void {
    (window as any).current_reply = reply;
}

function askReaderLM(content: string): void {
    const messages = [
        { "role": "user", "content": content }
    ];
    console.log(content);
    fetchChatCompletion(messages, new ReaderLMSettings(), undefined);
}

async function main(content: string): Promise<any> {
    cancelPriorFetches();
    currentFetchController = new AbortController();
    const intention = await User.getIntention();
    if (intention === undefined) {
        throw new Error("No intention found");
    }
    const systemPrompt = await User.createSystemPrompt(intention);
    if (systemPrompt === undefined) {
        throw new Error("Failed to create system prompt");
    }
    const apiKey = await User.getApiKey();
    const completion = new ChatGenerate(systemPrompt, content);
    const template = await getNTokenPrompt(completion, 4000);
    const settings = new ChatSettings({ 
        model: MODEL, 
        chatCompletionUrl: 'http://localhost:11434/api/generate', 
        contextSize: 4000, 
        format: "json"
    });
    
    return fetchChatGeneration(template, settings, currentFetchController.signal, apiKey)
        .then(async (data: { response: string }) => parseCompletionResponse(data.response))
        .catch((err: Error) => {
            if (err.name === 'AbortError') {
                console.log('Fetches aborted');
                return null;
            }
            throw err;
        });
}

function cancelPriorFetches(): void {
    if (currentFetchController) {
        currentFetchController.abort();
        currentFetchController = null;
    }
}

function parseCompletionResponse(response: string): any {
    let processedResponse = response.replace(/\n/g, '');
    processedResponse = processedResponse.replace(/\\/g, '');
    processedResponse = processedResponse.replace(/```/g, '');
    const jsonContent = extractWithCurlyBrackets(processedResponse);
    
    if (!jsonContent) {
        throw new Error("No content found in the response");
    }
    try {
        return JSON.parse(jsonContent);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        throw new Error('Failed to parse response: ' + response);
    }
}

function extractWithCurlyBrackets(str: string): string | null {
    const regex = /{[^}]*}/;
    const match = str.match(regex);
    return match ? match[0] : null;
}

const messageHandlers = {
    intention: async (message: IntentionMessage): Promise<void> => {
        await User.updateIntention(message.intention);
    },
    content: async (message: ContentMessage, sendResponse: (response: MessageResponse) => void): Promise<void> => {
        try {
            const reply = await main(message.content);
            console.log(reply);
            sendResponse({ reply });
            setCurrentReply(reply);
        } catch (error) {
            console.error("Error:", error);
            sendResponse({ error: error as Error });
        }
    },
    html: async (message: HtmlMessage, sendResponse: (response: MessageResponse) => void): Promise<void> => {
        console.log(message.html);
        try {
            const response = await main(message.content);
            const reply = JSON.parse(response);
            sendResponse({ reply });
            setCurrentReply(reply);
        } catch (error) {
            console.error("Error:", error);
            sendResponse({ error: error as Error });
        }
    },
    action: async (message: ActionMessage, sendResponse: (response: MessageResponse) => void): Promise<void> => {
        console.log(message.action);
        try {
            const response = await main(message.content);
            const reply = parseCompletionResponse(response);
            sendResponse({ reply });
            setCurrentReply(reply);
        } catch (error) {
            console.error("Error:", error);
            sendResponse({ error: error as Error });
        }
    },   
    favorite: (message: FavoriteMessage): void => {
        User.toggleIntentionFromFavoritesMap(message.favorite);
        User.toggleShowFavoriteInHistoryList(message.favorite);
    },
    log: (message: LogMessage): void => {
        console.debug(message.log);
    }
};

browser.runtime.onMessage.addListener((
    message: unknown,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response?: any) => void
): true => {
    if (typeof message === 'object' && message !== null) {
        const messageType = Object.keys(message)[0] as keyof typeof messageHandlers;
        const handler = messageHandlers[messageType];
        
        if (handler && messageType in messageHandlers) {
            const result = handler(message as any, sendResponse as any);
            if (result instanceof Promise) {
                result.catch((error: Error) => {
                    console.error('Message handler error:', error);
                    sendResponse({ error });
                });
            }
        }
    }
    return true; // Always return true to indicate async response
});

//     },
//     { urls: ["<all_urls>"] },
//     ["responseHeaders"]
// );

// Uncomment these listeners if needed
// browser.tabs.onActivated.addListener(sendParseMessage);
// browser.tabs.onUpdated.addListener(sendParseMessage);
