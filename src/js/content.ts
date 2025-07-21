import { PageAnalysisFactory } from './PageAnalysisFactory.js';
import { PageObserver } from './PageObserver.js';
import { backgroundLog } from './log.js';
import { WindowObserver } from './WindowObserver.js';
import { 
  AIResponse, 
  ContentMessage, 
  TryAgainMessage, 
  MessageResponse,
  AnalysisMeta 
} from '../types/index.js';

const DO_BLOCK: boolean = true;

function createWindowObserver(): void {
  new WindowObserver(() => {
    const observer = new PageObserver(document, { timeoutDuration: 5000, debounceWait: 1000, debounceMaxWait: 2000 });
    observer.observe(() => {
      const analysis = PageAnalysisFactory.create(document);
      analysis.parse();
      backgroundLog(analysis.meta ? JSON.stringify(analysis.meta) : 'No meta data');
      sendContent(analysis.output || '');
    });
  });
}

createWindowObserver();

function populate(reasoning: string, measure: string): void {
  const replyElement = document.querySelector('.reply');
  const measureElement = document.querySelector('.measure');
  
  if (replyElement) {
    replyElement.textContent = reasoning;
  }
  if (measureElement) {
    measureElement.textContent = measure;
  }
}

function blockContentByDecision(reply: AIResponse): void {
  const decision = /^true$/i.test(reply.aligned);
  if (!decision && DO_BLOCK) {
    blockContent();
    populate(reply.reasoning, reply.aligned);
  }
}

function blockContent(): void {
  document.location.href = browser.runtime.getURL("html/page.html");
}

function blockContentByLikelihood(reply: AIResponse): void {
  if (reply.likelihood) {
    const percentage = parseInt(reply.likelihood);
    if (percentage < 50) {
      blockContent();
      populate(reply.reasoning, reply.likelihood);
    }
  }
}

function sendAction(action: string = 'getSource'): void {
  const message = { action };
  
  browser.runtime.sendMessage(message)
    .then((response: MessageResponse) => {
      if ('error' in response) {
        throw new Error(response.error);
      }
      console.log(response.reply);
      blockContentByDecision(response.reply);
    })
    .catch((error: Error) => console.error(error));
}

function sendContent(content: string): void {
  const message: ContentMessage = { content };
  
  browser.runtime.sendMessage(message)
    .then((response: MessageResponse) => {
      if ('error' in response) {
        throw new Error(response.error);
      }
      console.log(response.reply);
      blockContentByDecision(response.reply);
    })
    .catch((error: Error) => console.error(error));
}

browser.runtime.onMessage.addListener((message: TryAgainMessage, sender, sendResponse) => {
  if (message.tryAgain) {
    createWindowObserver();
  }
  return true;
});