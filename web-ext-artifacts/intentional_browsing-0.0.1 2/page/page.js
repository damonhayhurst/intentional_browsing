document.querySelector("#intention-form").addEventListener("submit", function(e){
    e.preventDefault();    //stop form from submitting
    document.querySelector("#intention-text").classList.add("form-control-plaintext");
    var intention = document.querySelector("#intention-text").value;
    browser.runtime.sendMessage({
        intention: intention
    })
    .catch(err => {
        console.log(err);
    });
    if (e.submitter.name === "try-again") {
        history.back();
    }
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
    document.querySelector('.measure').textContent = reply.likelihood;
}

function populateIntention(intention) {
    document.querySelector("#intention-text").value = intention
}

function changedIntentionListener(changes) {
    if ("intention" in changes) {
        browser.storage.local.get('intention')
        .then(data => populateIntention(data.intention));
    }
    if ("intentionHistory" in changes) {
        browser.storage.local.get(['intentionHistory', 'intention'])
        .then(data => populateIntentionHistoryList(data.intentionHistory, data.intention))
    }
    if ("intentionFavorites" in changes) {
        browser.storage.local.get(['intentionFavorites', 'intention'])
        .then(data => populateIntentionFavoritesList(data.intentionFavorites, data.intention))
    }
}

browser.storage.local.onChanged.addListener(changedIntentionListener);

window.addEventListener("load", function(e) {
    browser.storage.local.get(['intention', 'intentionHistory', 'intentionFavorites'])
    .then(data => {
        if (data.intention) {
            populateIntention(data.intention)
        }
        if (data.intentionHistory) {
            populateIntentionHistoryList(data.intentionHistory, data.intention)
        }
        if (data.intentionFavorites) {
            populateIntentionFavoritesList(data.intentionFavorites, data.intention);
        }
    })
})

function createCard(intention, isFavorite, isSelected) {
    var star = isFavorite ? "bi-star-fill" : "bi-star";
    var selectInput = (() => {
        if (isSelected) {
            return `<input class="btn btn-primary disabled" id="select" type="submit" value="Selected">`;
        } else {
            return `<input class="btn btn-primary" id="select" type="submit" value="Select">`;
        }
    })();
    card = `<div class="card">
                <div class="card-body">
                    <form class="form-floating intention-select-form">
                        ${intention}
                        <i class="${star} favorite-star text-black-50"></i>
                        ${selectInput}
                    </form>
                </div>
            </div>`;
    return card;
}

function populateIntentionHistoryList(intentionList, currentIntention) {
    populateIntentionList(intentionList, ".intention-history-list", currentIntention);
}

function populateIntentionFavoritesList(favoritesMap, currentIntention) {
    favoritesList = [...favoritesMap.keys()];
    favoritesList = favoritesList.map(intention => ({words: intention, favorite: true}))
    populateIntentionList(favoritesList, ".intention-favorites-list", currentIntention);
}

function populateIntentionList(intentionList, intentionListClassName, currentIntention) {
    var intentionListElement = document.querySelector(intentionListClassName);
    intentionListElement.innerHTML = "";
    for (intention of intentionList) {
        let isCurrentIntention = intention.words === currentIntention;
        card = createCard(intention.words, intention.favorite, isCurrentIntention);
        intentionListElement.insertAdjacentHTML('afterbegin', card);
        var intentionCardElement = intentionListElement.firstElementChild;
        intentionCardElement.addEventListener("submit", function(e){
            e.preventDefault();    //stop form from submitting
            browser.runtime.sendMessage({
                intention: e.target.innerText
            })
            .catch(err => {
                console.log(err);
            });
        });
        intentionCardElement.querySelector('.favorite-star').addEventListener("click", function (e) {
            let words = e.target.parentElement.innerText;
            browser.runtime.sendMessage({
                favorite: words
            })
            .then(() => {
                e.target.classList.toggle("bi-star");
                e.target.classList.toggle("bi-star-fill");
            });
       })
    }
   document.querySelector("#intention-text").classList.add("form-control-plaintext");
}

const triggerTabList = document.querySelectorAll('.nav-tabs button')
triggerTabList.forEach(triggerEl => {
  const tabTrigger = new bootstrap.Tab(triggerEl)

  triggerEl.addEventListener('click', event => {
    event.preventDefault();
    tabTrigger.show();
  })
})
