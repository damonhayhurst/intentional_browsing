import Readability from "../../node_modules/@mozilla/readability/Readability.js";
import debounce from "lodash.debounce";

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
  return content.replace(re, "\n ");
}

function populate(reasoning, measure) {
  document.querySelector('.reply').textContent = reasoning;
  document.querySelector('.measure').textContent = measure;
}

function blockContentByDecision(reply) {
  let decision = /^true$/i.test(reply.decision)
  if (!decision) {
    // blockContent()
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

function sendContent() {
  content = parseTextContent();
  if (content.length > 2000) {
    content = parseExcerpt();
  }
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
}

window.addEventListener("load", function(e) {
  // var observer = new MutationObserver(debounce(() => {sendContent()}, 10));
  // observer.observe(window.document, {childList:true, subtree: true});
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.parse) {
    sendContent();
  }
})

