import { BaseSettings } from './settings';

interface Message {
    role: string;
    content: string;
}

interface ChatChoice {
    message: {
        content: string;
    };
}

interface ChatUsage {
    prompt_tokens: number;
    completion_tokens: number;
}

interface ChatResponse {
    choices?: ChatChoice[];
    usage?: ChatUsage;
    message?: string;
}

interface ChatGenerationResponse extends ChatResponse {
    response: string;
}

export class ChatCompletion {
    private systemPrompt: string;
    private content: string;
    messages: Message[];

    constructor(systemPrompt: string, content: string) {
        this.systemPrompt = systemPrompt;
        this.content = content;
        this.messages = this.getMessages();
    }

    private getMessages(): Message[] {
        return [
            { "role": "system", "content": this.systemPrompt },
            { "role": "user", "content": this.content }
        ];
    }
}

export function fetchChatCompletion(
    messages: Message[],
    chatSettings: BaseSettings,
    apiKey?: string
): Promise<string> {
    return chatSettings.getFetchChatCompletion(messages, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension");
            }
            return response.json();
        })
        .then((data: ChatResponse) => {
            if (data.choices) {
                logOutput(data);
                return data.choices[0].message.content;
            } else {
                throw Error(data.message || "Unknown error occurred");
            }
        });
}

export class ChatGenerate {
    private systemPrompt: string;
    private content: string;
    messages: Message[];

    constructor(systemPrompt: string, content: string) {
        this.systemPrompt = systemPrompt;
        this.content = this.format(content);
        this.messages = this.getMessages();
    }

    private format(content: string): string {
        return content.replace(/[^a-zA-Z0-9\s]+/g, "");
    }

    private getMessages(): Message[] {
        return [
            { "role": "system", "content": this.systemPrompt },
            { "role": "user", "content": this.content }
        ];
    }
}

export function fetchChatGeneration(
    template: string,
    chatSettings: BaseSettings,
    signal: AbortSignal,
    apiKey?: string
): Promise<ChatGenerationResponse> {
    return chatSettings.getFetchChatGeneration(template, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension");
            }
            return response.json();
        })
        .then((data: ChatGenerationResponse) => {
            if (data.response) {
                logOutput(data);
                return data;
            } else {
                throw Error(data.message || "Unknown error occurred");
            }
        });
}

function logOutput(data: ChatResponse): void {
    if (data.choices) {
        console.log(data.choices[0].message.content);
        if (data.usage) {
            console.log("Prompt Tokens " + data.usage.prompt_tokens);
            console.log("Completion Tokens " + data.usage.completion_tokens);
        }
    }
}
