let content = document.body.innerText;
browser.runtime.sendMessage({content: content}).then(response => {
    console.log(response.reply);
  }).catch(err => {
    console.log(err);
  });