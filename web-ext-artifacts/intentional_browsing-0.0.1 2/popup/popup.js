browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.reply) {
        populate(message.reply);
    }
});

function populate(reply) {
    document.querySelector('.reply').textContent = reply.reasoning;
    document.querySelector('.measure').textContent = reply.decision;
}

document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.getBackgroundPage(window => populate(window.current_reply))
})