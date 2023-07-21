import Readability from "../../node_modules/@mozilla/readability/Readability.js";

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

function populate(reasoning, measure) {
  document.querySelector('.reply').textContent = reasoning;
  document.querySelector('.measure').textContent = measure;
}

function blockContentByDecision(reply) {
  let decision = /^true$/i.test(reply.decision)
  if (!decision) {
    blockContent()
    populate(reply.reasoning, reply.decision)
  }
}

function blockContent() {
  document.location = browser.runtime.getURL("html/page.html");
}

function blockContentByLikelihood(reply) {
  percentage = parseInt(reply.likelihood);
  if (percentage < 50) {
    blockContent()
    populate(reply.reasoning, reply.likelihood);
  }
}


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.parse) {
    content = parseTextContent();
    browser.runtime.sendMessage({content: content})
    .then(response => {
      if (response.error) {
        throw Error(response.error.message);
      }
      console.log(response.reply);
      browser.runtime.sendMessage(response.reply)
      blockContentByDecision(response.reply)
    })
    .catch(error => console.error(error));
    return true;
  }
  if (message.error) {
    console.log(message.error);
  }
})

