import { PageAnalysisFactory } from './PageAnalysisFactory.js';
import { PageObserver } from './PageObserver.js';
import { backgroundLog } from './log.js';

const DO_BLOCK = true;

window.addEventListener("load", function (e) {
  const observer = new PageObserver(document, {timeoutDuration: 5000, debounceWait: 1000, debounceMaxWait: 2000});
  observer.observe(() => {
    const analysis = PageAnalysisFactory.create(document);
    analysis.parse();
    backgroundLog(analysis.meta);
    sendContent(analysis.output);
  });
});


function populate(reasoning, measure) {
  document.querySelector('.reply').textContent = reasoning;
  document.querySelector('.measure').textContent = measure;
}

function blockContentByDecision(reply) {
  let decision = /^true$/i.test(reply.aligned)
  if (!decision && DO_BLOCK) {
    blockContent()
    populate(reply.reasoning, reply.aligned)
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

function sendAction(action = 'getSource') {
  browser.runtime.sendMessage({ action: content })
    .then(response => {
      if (response.error) {
        throw Error(response.error);
      }
      console.log(response.reply);
      browser.runtime.sendMessage(response.reply)
      blockContentByDecision(response.reply)
    })
    .catch(error => console.error(error));
}

function sendContent(content) {

  browser.runtime.sendMessage({ content: content })
    .then(response => {
      if (response.error) {
        throw Error(response.error);
      }
      console.log(response.reply);
      browser.runtime.sendMessage(response.reply)
      blockContentByDecision(response.reply)
    })
    .catch(error => console.error(error));
}

function sendHtml(html) {
  browser.runtime.sendMessage({ html: html })
}
