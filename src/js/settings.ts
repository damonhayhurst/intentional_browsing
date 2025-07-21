interface ChatMessage {
    role: string;
    content: string;
}

interface OllamaOptions {
    chatCompletionUrl?: string;
    model?: string;
    keepAlive?: string;
    contextSize?: number;
    numPredict?: number;
    format?: string;
}

export abstract class BaseSettings {
    protected preprompt?: string;
    protected options?: Record<string, any>;
    protected chatCompletionUrl?: string;
    protected model?: string;

    constructor() {}

    createSystemPrompt(intention: string): string {
        return this.preprompt?.replace(/\[intention\]/gi, intention) || '';
    }

    createHeaders(apiKey?: string | null): Record<string, string> {
        const authHeader = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        const headers = {
            'Content-Type': 'application/json',
            ...authHeader
        };
        return headers;
    }

    getFetchChatCompletion(messages: ChatMessage[], apiKey?: string | null): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || (this.constructor as any).chatCompletionUrl;
        const model = this.model || (this.constructor as any).model;
        const headers = this.createHeaders(apiKey);

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

    getFetchChatGeneration(template: string, apiKey?: string | null): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || (this.constructor as any).chatCompletionUrl;
        const model = this.model || (this.constructor as any).model;
        const headers = this.createHeaders(apiKey);

        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "model": model,
                "prompt": template,
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

    private keepAlive: string;
    private contextSize: number;
    private numPredict: number;
    private format: string;

    constructor({
        chatCompletionUrl = OllamaSettings.defaultChatCompletionUrl,
        model = OllamaSettings.defaultModel,
        keepAlive = OllamaSettings.defaultKeepAlive,
        contextSize = OllamaSettings.defaultContextSize,
        numPredict = OllamaSettings.defaultNumPredict,
        format = OllamaSettings.defaultFormat
    }: OllamaOptions = {}) {
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

    getFetchChatCompletion(messages: ChatMessage[], apiKey?: string | null, signal?: AbortSignal): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || (this.constructor as any).chatCompletionUrl;
        const model = this.model || (this.constructor as any).model;
        const headers = this.createHeaders(apiKey);

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

    getFetchChatGeneration(prompt: string, apiKey?: string | null): Promise<Response> {
        const options = this.options ? { options: this.options } : {};
        const url = this.chatCompletionUrl || (this.constructor as any).chatCompletionUrl;
        const model = this.model || (this.constructor as any).model;
        const headers = this.createHeaders(apiKey);

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