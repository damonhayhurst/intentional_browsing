type Headers = {
    'Content-Type': string;
    Authorization?: string;
};

interface ChatCompletionOptions {
    num_ctx?: number;
    num_predict?: number;
}

export interface OllamaConfig {
    chatCompletionUrl?: string;
    model?: string;
    keepAlive?: string;
    contextSize?: number;
    numPredict?: number;
    format?: string;
}

export class BaseSettings {
    protected options?: ChatCompletionOptions;
    protected chatCompletionUrl?: string;
    protected model?: string;
    protected format?: string;
    static chatCompletionUrl?: string;
    static model?: string;

    createSystemPrompt(intention: string): string {
        return (this as any).preprompt.replace(/\[intention\]/gi, intention);
    }

    createHeaders(apiKey?: string): Headers {
        const authHeader = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        const headers = {
            'Content-Type': 'application/json',
            ...authHeader
        };
        return headers;
    }

    getFetchChatCompletion(messages: Array<{ role: string; content: string }>, apiKey?: string, signal?: AbortSignal): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const constructor = this.constructor as typeof BaseSettings;
        const url = this.chatCompletionUrl || constructor.chatCompletionUrl;
        const model = this.model || constructor.model;
        const headers = this.createHeaders(apiKey);

        return fetch(url!, {
            signal,
            method: 'POST',
            headers,
            body: JSON.stringify({
                "model": model,
                'messages': messages,
                ...options
            })
        });
    }

    getFetchChatGeneration(prompt: string, apiKey?: string, signal?: AbortSignal): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const constructor = this.constructor as typeof BaseSettings;
        const url = this.chatCompletionUrl || constructor.chatCompletionUrl;
        const model = this.model || constructor.model;
        const headers = this.createHeaders(apiKey);

        return fetch(url!, {
            method: 'POST',
            headers,
            signal,
            body: JSON.stringify({
                "model": model,
                "prompt": prompt,
                "stream": false,
                "format": this.format,
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
    static defaultFormat = "json";

    keepAlive: string;
    contextSize: number;
    numPredict: number;
    format: string;

    constructor({
        chatCompletionUrl = OllamaSettings.defaultChatCompletionUrl,
        model = OllamaSettings.defaultModel,
        keepAlive = OllamaSettings.defaultKeepAlive,
        contextSize = OllamaSettings.defaultContextSize,
        numPredict = OllamaSettings.defaultNumPredict,
        format = OllamaSettings.defaultFormat
    }: OllamaConfig = {}) {
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

    getFetchChatCompletion(messages: Array<{ role: string; content: string }>, apiKey?: string, signal?: AbortSignal): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const constructor = this.constructor as typeof BaseSettings;
        const url = this.chatCompletionUrl || constructor.chatCompletionUrl;
        const model = this.model || constructor.model;
        const headers = this.createHeaders(apiKey);

        return fetch(url!, {
            method: 'POST',
            headers,
            signal,
            body: JSON.stringify({
                "model": model,
                'messages': messages,
                "format": this.format,
                ...options
            })
        });
    }

    getFetchChatGeneration(prompt: string, apiKey?: string): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const constructor = this.constructor as typeof BaseSettings;
        const url = this.chatCompletionUrl || constructor.chatCompletionUrl;
        const model = this.model || constructor.model;
        const headers = this.createHeaders(apiKey);

        return fetch(url!, {
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

    constructor() {
        super();
        this.chatCompletionUrl = ReaderLMSettings.chatCompletionUrl;
        this.model = ReaderLMSettings.model;
    }
}
