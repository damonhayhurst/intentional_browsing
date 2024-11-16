import { BaseSettings } from "./settings.js";

export function fetchChatCompletion(messages, apiKey, chatSettings) {
    const settings = chatSettings instanceof BaseSettings ? chatSettings : new chatSettings();
    
    return settings.getFetchChatCompletion(messages, apiKey)
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension")
            } else {
                return response.json()
            }
        })
        .then(data => {
            console.log(data)
            if (data.choices) {
                return data.choices[0].message.content;
            } else {
                throw Error(data.message);
            }
        })
}
