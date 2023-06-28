document.querySelector("#intention-form").addEventListener("submit", function(e){
    e.preventDefault();    //stop form from submitting
    document.querySelector("#intention-text").classList.add("form-control-plaintext");
    var intention = document.querySelector("#intention-text").value;
    browser.runtime.sendMessage({intention: intention}).catch(err => {
        console.log(err);
    });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.reply) {
        document.querySelector(".reply").textContent = reply
    }
})

window.addEventListener("load", function(e) {
    browser.storage.local.get('intention')
    .then(data => document.querySelector("#intention-text").value = data.intention) 
})