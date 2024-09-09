import Readability from "../../node_modules/@mozilla/readability/Readability.js";
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
    const content = getContent();
    sendContent(content);
  });
  pageObserver.observe();
})


class PageAnalysis {

  constructor() {
    this.document = document.cloneNode(true);
    this.readability = new Readability(this.document).parse();
  }

  getBreakdownWithoutTextContent() {
    return {
      "title": this.#parseTitle(),
      "headings": this.#parseHeadings(),
      "semantic elements": this.#parseSemanticElements(),
      "images": this.#parseImages(),
      "links": this.#parseLinks(),
      "has forms": this.#parseForms().length > 0,
    }
  }

  getBreakdown() {
    return {
      "title": this.#parseTitle(),
      "text content": this.#parseTextContent(),
      "headings": this.#parseHeadings(),
      "semantic elements": this.#parseSemanticElements(),
      "images": this.#parseImages(),
      "links": this.#parseLinks(),
      "has forms": this.#parseForms().length > 0,
    }
  }

  getTextContent() {
    return {
      "title": this.#parseTitle(),
      "text content": this.#parseTextContent()
    }
  }

  getHtml() {
    return this.#parseHtmlContent();
  }

  getTitleAndBodyHtml() {
    return {
      "title": this.#parseTitle(),
      "body": this.#parseBodyHTML()
    }
  }

  getExcerpt() {
    return this.#parseExcerpt();
  }

  #parseBodyHTML() {
    let body = this.document.querySelector('body').cloneNode(true);
    return this.#format(body.innerHTML)
  }

  #parseHtmlContent() {
    return this.#format(this.readability.content);
  }

  #parseTitle() {
    return this.#format(this.readability.title);
  }

  #parseTextContent() {
    return this.#format(this.readability.textContent);
  }

  #parseHeadings() {
    let headings = {};
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      headings[tag] = [...this.document.querySelectorAll(tag)].map(el => el.innerText);
    });
    return headings;
  }

  #parseSemanticElements() {
    // semanticTags = ['article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time'];
    let semanticTags = ['article', 'section', 'nav', 'aside'];
    let semanticElements = {};

    semanticTags.forEach(tag => {
      semanticElements[tag] = [...this.document.querySelectorAll(tag)].map(element => element.innerText);
    });

    return semanticElements;
  }

  #parseImages() {
    let images = [...this.document.querySelectorAll('img')].map(img => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt')
    }));
    return images;
  }

  #parseLinks() {
    const anchors = document.querySelectorAll('a');
    const links = Array.from(anchors).map(anchor => ({
      href: anchor.href,
      text: anchor.textContent.trim()
    }));
    return links
  }

  #parseForms() {
    return [...this.document.querySelectorAll('form')];
  }

  #removeLineBreaks(content) {
    const re = /\n(\s*){2,}/g;
    if (content) {
      content.replace(re, "\n ");
    }
    return content;
  }

  #parseExcerpt() {
    return this.#format(this.readability.excerpt);
  }

  #format(content) {
    content = this.#removeLineBreaks(content);
    return content;
  }

}

function getPriority(analysis) {
  return [analysis.getHtml, analysis.getTitleAndBodyHtml, analysis.getBreakdown, analysis.getBreakdownWithoutTextContent, analysis.getTextContent, analysis.getExcerpt]
}

function getAnalysisContent(analysis) {
  let analysisFunctions = getPriority(analysis)
  const maxLength = 2000
  for (let fn of analysisFunctions) {
    let result = fn.bind(analysis)();
    // console.log(result);
    let resultJson = JSON.stringify(result, (key, value) => {
      // console.log(value);
      if (value === undefined || value === "") {
        return undefined; // Exclude from the final string
      }
      else {
        backgroundLog(fn.name)
        return value;
      }
    })
    if (resultJson.length < maxLength) {
      return result;
    }
  }
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

function getAnalysis() {
  return new PageAnalysis();
}

function getContent() {
  let analysis = getAnalysis();
  return getAnalysisContent(analysis);
}


function backgroundLog(message) {
  const currentDate = new Date();
  const currentTime = currentDate.toISOString() + " ";
  browser.runtime.sendMessage({ log: currentTime + message })
} 