import prePromptText from '../resources/preprompt.text.txt';

export class ChatSettings {

    static defaults() {
        return ChatSettings.gpt3();
    }

    static gpt3() {
        return {
            chatCompletionUrl: "https://api.openai.com/v1/chat/completions",
            apiKey: process.env.OPENAI_API_KEY,
            model: "gpt-3.5-turbo",
            prePrompt: prePromptText,
        }
    }

    static llama3() {
        return {
            chatCompletionUrl: "http://localhost:11434/v1/chat/completions",
            model: "llama3.1",
            prePrompt: prePromptText,
        }
    }
    
    static llava() {
        return {
            chatCompletionUrl: "http://localhost:11434/v1/chat/completions",
            model: "llava",
            prePrompt: prePromptImages,
        }
    }
}
