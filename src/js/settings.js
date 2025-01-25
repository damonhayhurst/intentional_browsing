export class BaseSettings {
    constructor() {
        
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
    static llmInstanceUrl = "https://api.openai.com/v1/chat/completions";
    static apiKey = process.env.OPENAI_API_KEY;
    static model = "gpt-3.5-turbo";

    constructor() {
        super();
    }
}

export class OllamaSettings extends BaseSettings {
    static defaultChatCompletionUrl = "http://localhost:11434/v1/chat/completions";
    static defaultModel = "llama3.2";
    static defaultKeepAlive = "3m";
    static defaultContextSize = 4000;
    static defaultNumPredict = 128;
    static defaultFormat = "json"
    constructor({
        chatCompletionUrl = OllamaSettings.defaultChatCompletionUrl,
        model = OllamaSettings.defaultModel,
        keepAlive = OllamaSettings.defaultKeepAlive,
        contextSize = OllamaSettings.defaultContextSize,
        numPredict = OllamaSettings.defaultNumPredict,
        format = OllamaSettings.defaultFormat
    } = {}) {
        super();
        this.chatCompletionUrl = chatCompletionUrl;
        this.model = model;
        this.keepAlive = keepAlive;
        this.contextSize = contextSize;
        this.numPredict = numPredict;
        this.format = format;
        this.options = {
            "num_ctx": this.contextSize,
            "num_predict": this.numPredict
        };
    }


    getFetchChatCompletion(messages, apiKey, signal) {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || this.constructor.chatCompletionUrl;
        const model = this.model || this.constructor.model;
        const headers = this.createHeaders(apiKey)

        return fetch(url, {
            method: 'POST',
            headers,
            signal: signal,
            body: JSON.stringify({
                "model": model,
                'messages': messages,
                "format": this.format,
                ...options
            })
        });
    }

    getFetchChatGeneration(prompt, apiKey) {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || this.constructor.chatCompletionUrl;
        const model = this.model || this.constructor.model;
        const headers = this.createHeaders(apiKey)

        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "model": model,
                "prompt": prompt,
                "stream": false,
                "format": this.format,
                "raw": true,
                "keep_alive": this.keepAlive,
                ...options
            })
        });
    }
}

export class ReaderLMSettings extends BaseSettings {
    static chatCompletionUrl = "http://localhost:11434/v1/chat/completions";
    static model = "reader-lm";
}
