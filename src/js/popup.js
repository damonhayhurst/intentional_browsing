import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/popup.css';

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
    browser.runtime.getBackgroundPage(window => {
        if (window.current_reply) {
            populate(window.current_reply)
        }
    })
})