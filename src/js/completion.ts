import { BaseSettings } from './settings';

interface ChatMessage {
    role: string;
    content: string;
}

interface ChatCompletionResponse {
    choices?: Array<{
        message: {
            content: string;
        };
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
    message?: string;
}

interface ChatGenerationResponse {
    response?: string;
    message?: string;
}

export class ChatCompletion {
    private systemPrompt: string;
    private content: string;
    private messages: ChatMessage[];

    constructor(systemPrompt: string, content: string) {
        this.systemPrompt = systemPrompt;
        this.content = content;
        this.messages = this.getMessages();
    }

    getMessages(): ChatMessage[] {
        return [
            { "role": "system", "content": this.systemPrompt },
            { "role": "user", "content": this.content }
        ];
    }
}

export function fetchChatCompletion(messages: ChatMessage[], apiKey: string | undefined, chatSettings: BaseSettings): Promise<string> {
    return chatSettings.getFetchChatCompletion(messages, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension");
            } else {
                return response.json() as Promise<ChatCompletionResponse>;
            }
        })
        .then(data => {
            if (data.choices) {
                logOutput(data);
                return data.choices[0].message.content;
            } else {
                throw Error(data.message || 'Unknown error');
            }
        });
}

export class ChatGenerate {
    private systemPrompt: string;
    private content: string;
    public messages: ChatMessage[];

    constructor(systemPrompt: string, content: string) {
        this.systemPrompt = systemPrompt;
        this.content = this.format(content);
        this.messages = this.getMessages();
    }

    format(content: string): string {
        return content.replace(/[^a-zA-Z0-9\s]+/g, "");
    }

    getMessages(): ChatMessage[] {
        return [
            { "role": "system", "content": this.systemPrompt },
            { "role": "user", "content": this.content }
        ];
    }
}

export function fetchChatGeneration(template: string, apiKey: string | null, chatSettings: BaseSettings, signal?: AbortSignal): Promise<ChatGenerationResponse> {
    return chatSettings.getFetchChatGeneration(template, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension");
            } else {
                return response.json() as Promise<ChatGenerationResponse>;
            }
        })
        .then(data => {
            if (data.response) {
                logOutput(data);
                return data;
            } else {
                throw Error(data.message || 'Unknown error');
            }
        });
}

function logOutput(data: ChatCompletionResponse | ChatGenerationResponse): void {
    if ('choices' in data && data.choices) {
        console.log(data.choices[0].message.content);
        if (data.usage) {
            console.log("Prompt Tokens " + data.usage.prompt_tokens);
            console.log("Completion Tokens " + data.usage.completion_tokens);
        }
    }
}