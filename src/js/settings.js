import prePromptText from '../resources/preprompt.text.txt';

export class BaseSettings {
    constructor() {
        this.preprompt = prePromptText;
    }

    createSystemPrompt(intention) {
        return this.preprompt.replace(/\[intention\]/gi, intention);
    }

    createHeaders(apiKey) {
        const authHeader = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        const headers = {
            'Content-Type': 'application/json',
            ...authHeader
        };
        return headers;
    }

    getFetchChatCompletion(messages, apiKey) {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || this.constructor.chatCompletionUrl;
        const model = this.model || this.constructor.model;
        const headers = this.createHeaders(apiKey)

        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "model": model,
                'messages': messages,
                ...options
            })
        });
    }
}

export class OpenAISettings extends BaseSettings {
    static chatCompletionUrl = "https://api.openai.com/v1/chat/completions";
    static apiKey = process.env.OPENAI_API_KEY;
    static model = "gpt-3.5-turbo";

    constructor() {
        super();
    }
}

export class OllamaSettings extends BaseSettings {
    static chatCompletionUrl = "http://localhost:11434/v1/chat/completions";
    static model = "llama3.2";
    static keepAlive = "3m";
    static contextSize = 8000;
    static numPredict = 128;
    options = {
        "keep_alive": OllamaSettings.keepAlive,
        "num_ctx": OllamaSettings.contextSize,
    }

    constructor(model = OllamaSettings.model) {
        super();
        this.model = model;
    }

    getFetchChatCompletion(messages, apiKey) {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || this.constructor.chatCompletionUrl;
        const model = this.model || this.constructor.model;
        const headers = this.createHeaders(apiKey)

        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "model": model,
                'messages': messages,
                "format": "json",
                ...options
            })
        });
    }
}

export class ReaderLMSettings extends BaseSettings {
    static chatCompletionUrl = "http://localhost:11434/v1/chat/completions";
    static model = "reader-lm";
}
