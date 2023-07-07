browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.reply) {
        populate(message.reply);
    }
});

function populate(reply) {
    document.querySelector('.reply').textContent = reply.reasoning;
    document.querySelector('.likelihood').textContent = reply.likelihood;
}

document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.getBackgroundPage(window => populate(window.current_reply))
})