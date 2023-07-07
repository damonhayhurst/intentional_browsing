function parseTextContent() {
  var documentClone = document.cloneNode(true);
  var article = new Readability(documentClone).parse();
  return removeLineBreaks(article.textContent);
}

function parseExcerpt() {
  var documentClone = document.cloneNode(true);
  var article = new Readability(documentClone).parse();
  return removeLineBreaks(article.excerpt);
}

function removeLineBreaks(content) {
  const re = /\n(\s*){2,}/g;
  return content.replace(re, "\n");
}

function populate(reply, document) {
  document.querySelector('.reply').textContent = reply.reasoning;
  document.querySelector('.likelihood').textContent = reply.likelihood;
}

function blockContent(reply) {
  percentage = parseInt(reply.likelihood);
  if (percentage < 50) {
    document.location = browser.runtime.getURL("page/page.html");
    populate(reply, document);
  }
}


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.parse) {
    content = parseTextContent();
    browser.runtime.sendMessage({content: content})
    .then(response => {
      console.log(response.reply);
      browser.runtime.sendMessage(response.reply)
      blockContent(response.reply)
    })
    .catch(error => console.error('Error:', error));
    return true;
  }
  if (message.error) {
    console.log(message.error);
  }
})

