import { PageAnalysis } from './analysis.js';
import { backgroundLog } from './log.js';
import _ from 'lodash';


class PageObserver {

  constructor(target, callbackFn, timeoutDuration = 3000, debounceWait = 0, debounceMaxWait = 1000) {
    this.callbackFn = callbackFn;
    this.target = target;
    this.timeoutDuration = timeoutDuration;
    this.debounceWait = debounceWait;
    this.debounceMaxWait = debounceMaxWait;
  }

  mutationObserverOptions = {
    childList: true,
    subtree: true
  }

  #observeMutation = (mutations, observer) => {
    clearTimeout(this.timeout);
    observer.disconnect();
    backgroundLog("Mutation observed");
    this.callbackFn();
  }


  #debounce(fn) {
    return _.debounce(fn, this.debounceWait, {
      'leading': false,
      'trailing': true,
      'maxWait': this.debounceMaxWait
    });
  }

  #startTimeout() {
    this.timeout = setTimeout(() => {
      backgroundLog('Timeout');
      this.callbackFn();
    }, this.timeoutDuration);
  }

  #createFinalMutationObserver() {
    return new MutationObserver(
      this.#debounce(this.#observeMutation)
    );
  }

  observe() {
    this.#startTimeout();
    this.observer = this.#createFinalMutationObserver();
    this.observer.observe(this.target, this.mutationObserverOptions);
  }
}

window.addEventListener("load", function (e) {
  const pageObserver = new PageObserver(document, () => {
    const content = new PageAnalysis().getHtml()
    const fullHtml = document.documentElement.outerHTML;
    sendHtml(fullHtml)
  });
  pageObserver.observe();
});


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
