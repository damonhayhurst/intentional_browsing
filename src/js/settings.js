import prePromptText from '../resources/preprompt.text.txt';

export class OpenAISettings {
    static chatCompletionUrl = "https://api.openai.com/v1/chat/completions";
    static apiKey = process.env.OPENAI_API_KEY;
    static model = "gpt-3.5-turbo";
    static prePrompt = prePromptText;
}

export class LlamaSettings {
    static chatCompletionUrl = "http://localhost:11434/v1/chat/completions";
    static model = "llama3.1";
    static prePrompt = prePromptText;
}

export class ReaderLMSettings {
    static chatCompletionUrl = "http://localhost:11434/v1/chat/completions";
    static model = "reader-lm";
}

