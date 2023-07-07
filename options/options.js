function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
      apiKey: document.querySelector("#api-key").value
    });
}

function restoreOptions() {
    function setCurrentConfig(result) {
        document.querySelector("#api-key").value = result.apiKey || undefined;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get("apiKey");
    getting.then(setCurrentConfig, onError);
}
  
document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
