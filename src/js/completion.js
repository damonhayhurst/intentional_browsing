export function fetchChatCompletion(messages, apiKey, chatSettings) {

    function getHeaders(apiKey) {
        const authHeader = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        return {
            'Content-Type': 'application/json',
            ...authHeader
        }
    }

    return fetch(chatSettings.chatCompletionUrl, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            "model": chatSettings.model,
            'messages': messages,
        })
    })
        .then(response => {
            if (response.status === 401) {
                throw Error("Check your API key is present in the preferences page for this extension")
            } else {
                return response.json()
            }
        })
        .then(data => {
            if (data.choices) {
                return data.choices[0].message.content;
            } else {
                throw Error(data.message);
            }
        })
}