export class ChatCompletion {

    constructor(systemPrompt, content) {
        this.systemPrompt = systemPrompt;
        this.content = content;
        this.messages = this.getMessages();
    }

    getMessages() {
        return [
            { "role": "system", "content": this.systemPrompt },
            { "role": "user", "content": this.content }
        ];
    }
}

export function fetchChatCompletion(messages, apiKey, chatSettings) {
    return chatSettings.getFetchChatCompletion(messages, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension")
            } else {
                return response.json()
            }
        })
        .then(data => {
            if (data.choices) {
                logOutput(data)
                return data.choices[0].message.content;
            } else {
                throw Error(data.message);
            }
        })
}

export class ChatGenerate {

    constructor(systemPrompt, content) {
        this.systemPrompt = systemPrompt;
        this.content = content;
        this.messages = this.getMessages();
    }

    getMessages() {
        return [
            { "role": "system", "content": this.systemPrompt },
            { "role": "user", "content": this.content }
        ];
    }
}

export function fetchChatGeneration(template, apiKey, chatSettings) {
    return chatSettings.getFetchChatGeneration(template, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension")
            } else {
                return response.json()
            }
        })
        .then(data => {
            if (data.response) {
                logOutput(data)
                return data;
            } else {
                throw Error(data.message);
            }
        })
}


function logOutput(data) {
    if (data.choices) {
        console.log(data.choices[0].message.content);
        console.log("Prompt Tokens " + data.usage.prompt_tokens);
        console.log("Completion Tokens " + data.usage.completion_tokens);
    }
}