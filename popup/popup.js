browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.reply) {
        document.querySelector('.reply').value = message.reply;
    }
});