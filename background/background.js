const openai_url = 'https://api.openai.com/v1/chat/completions';
// const api_key = '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';  // replace 'your-api-key' with your actual API key

browser.storage.local.set({ intention : "I want to browse music" });

function createSystemPrompt(intention) {
    return `I want you to act as a productivity assistant. I will provide you with a piece of content 
    and you need to determine whether that piece of content will be helpful towards achieving my intention. My intention is: 
    '${intention}'. You must answer with a percentage likelihood that is is helpful towards achieving my intention 
    and give your reasoning as to why a piece of content is or is
    not helpful towards achieving my intention. I want you to be lenient, 
    if the page is likely to be one click away from a page that is helpful for the intention.
    Any content related to the acceptance of cookies should be ok.
    Your response should be in json format with keys, reasoning and likelihood. Likelihood is expressed as an integer.`;
}

function ask(intention, content, api_key) {
    let system_prompt = createSystemPrompt(intention)

    const messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content}
    ];

    return fetch(openai_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`,
        },
        body: JSON.stringify({
            "model": "gpt-3.5-turbo",
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
    .then(data => data.choices[0].message.content)
}

function main_old(content) {
    return browser.storage.local.get("intention")
    .then(data => intention = data.intention)
    .then(browser.storage.sync.get("apiKey"))
    .then(data => api_key = data.apiKey)
    .then(ask(intention, content, api_key))
    .then(data => data.choices[0].message.content)
    .catch(error => console.error(error));
}

async function getIntention() {
    return browser.storage.local.get("intention")
    .then(data => data.intention);
}

async function getApiKey() {
    return browser.storage.sync.get("apiKey")
    .then(data => data.apiKey)
}

async function main(content) {
    const intention = await getIntention();
    const api_key = await getApiKey();
    return ask(intention, content, api_key).catch(error => {
        console.log(error)
    })
}

current_reply = "";

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.intention) {
        console.log(message.intention)
        browser.storage.local.get('intention')
        .then(data => {
            if (data.intention) {
                let intention = data.intention;
                browser.storage.local.get("intentionList")
                .then(data => {
                    if (data.intentionList) {
                        data.intentionList.push(intention)
                        browser.storage.local.set({intentionList: data.intentionList})
                    } else {
                        browser.storage.local.set({intentionList: [intention]})
                    }
                })
            }
        })
        browser.storage.local.set({ intention : message.intention });
    }
    if (message.content) {
        main(message.content)
        .then(response => JSON.parse(response))
        .then(reply => {
            sendResponse({reply: reply});
            current_reply = reply;
        })
        .catch(error => sendResponse({error: error}));
        return true;
    }
});

function getResponse(reply) {
	
	if (reply.likelihood) {
		if (reply.likelihood < 50) {
			console.log(":P)")
		} 
	}
}

// // /*
// // Update content when a new tab becomes active.
// // */
// browser.tabs.onActivated.addListener(sendParseMessage);

/*
Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(sendParseMessage);


function sendParseMessage(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.status === 'complete') {
        browser.tabs.sendMessage(tabId, {parse: true});
    }
}

  