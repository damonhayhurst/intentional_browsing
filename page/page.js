document.querySelector("#intention-form").addEventListener("submit", function(e){
    e.preventDefault();    //stop form from submitting
    document.querySelector("#intention-text").classList.add("form-control-plaintext");
    var intention = document.querySelector("#intention-text").value;
    browser.runtime.sendMessage({intention: intention})
    .catch(err => {
        console.log(err);
    });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.reply) {
        populate(message.reply);
    }
})

document.addEventListener('DOMContentLoaded', function() {
    browser.runtime.getBackgroundPage(window => populate(window.current_reply))
})


function populate(reply) {
    document.querySelector('.reply').textContent = reply.reasoning;
    document.querySelector('.likelihood').textContent = reply.likelihood;
}

function populateIntention(intention) {
    document.querySelector("#intention-text").value = intention
}

function changedIntentionListener(changes) {
    if ("intention" in changes) {
        browser.storage.local.get('intention')
        .then(data => populateIntention(data.intention)) 
    }
    if ("intentionList" in changes) {
        browser.storage.local.get('intentionList')
        .then(data => populateIntentionList(data.intentionList))
    }
}

browser.storage.local.onChanged.addListener(changedIntentionListener);

window.addEventListener("load", function(e) {
    browser.storage.local.get('intention')
    .then(data => populateIntention(data.intention));
    browser.storage.local.get('intentionList')
    .then(data => {
        if (data.intentionList) {
            populateIntentionList(data.intentionList)
        }
    });
})

function createCard(intention) {
    card = `<div class="card">
                <div class="card-body">
                    <form class="form-floating intention-select-form">` + intention +
                        `<input class="btn btn-primary" id="select" type="submit" value="Select">
                    </form>
                </div>
            </div>`;
    return card;
}

function populateIntentionList(intentionList) {
    cards = '';
    for (intention of intentionList) {
        cards = createCard(intention) + cards;
    }
   document.querySelector(".intention-list").innerHTML = cards;
   document.querySelector(".intention-select-form").addEventListener("submit", function(e){
        e.preventDefault();    //stop form from submitting
        browser.runtime.sendMessage({intention: intention})
        .then(() => populateIntention(intention))
        .catch(err => {
            console.log(err);
        });
   });
   document.querySelector("#intention-text").classList.add("form-control-plaintext");
}

