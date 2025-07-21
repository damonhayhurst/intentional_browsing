import { OllamaSettings, OpenAISettings, ReaderLMSettings } from './settings';
import { UserStorageInterface } from './user';
import { ChatCompletion, ChatGenerate, fetchChatCompletion, fetchChatGeneration } from './completion';
import { PageAnalysis } from './PageAnalysis';
import { AutoTokenizer } from '@huggingface/transformers';
import { 
  AIResponse, 
  ContentMessage, 
  IntentionMessage, 
  ActionMessage, 
  HtmlMessage, 
  LogMessage, 
  FavoriteMessage, 
  MessageResponse,
  MessageHandler 
} from '../types/index.js';

const ChatSettings = OllamaSettings;
const MODEL: string = "qwen2.5:3b";
const HF_MODEL: string = "Qwen/Qwen2.5-3B-Instruct";
const User = UserStorageInterface;
const Tokenizer = AutoTokenizer;

// Maintain a reference to the current active fetch and its AbortController
let currentFetchController: AbortController | null = null;

User.setDefaultSettingsIfNotExists({}, "I want to carry out web development on my firefox extension");
setCurrentReply(null);

interface ChatTemplate {
  messages: Array<{ role: string; content: string }>;
}

interface TokenizerOptions {
  tokenize: boolean;
  return_tensor: boolean;
  add_generation_prompt: boolean;
}

async function getNTokenPrompt(completion: ChatGenerate, n: number = 4000, buffer: number = 25): Promise<string> {
  const tokenizer = await AutoTokenizer.from_pretrained(HF_MODEL);
  const input_ids = await tokenizer.apply_chat_template(
    completion.messages,
    {   
      tokenize: true,
      return_tensor: false,
      add_generation_prompt: true
    } as TokenizerOptions
  );
  
  if (Array.isArray(input_ids)) {
    const tokenIds = input_ids.flat().filter((id): id is number => typeof id === 'number');
    const promptEnd = tokenIds.slice(-5); 
    const promptStart = tokenIds.slice(0, n - buffer - 6);
    const nTokenPrompt = tokenizer.decode([...promptStart, ...promptEnd]);
    console.log(nTokenPrompt);
    return nTokenPrompt;
  }
  
  throw new Error('Failed to tokenize prompt');
}

function setCurrentReply(reply: AIResponse | null): void {
  window.current_reply = reply;
}

function askReaderLM(content: string): void {
  const messages = [
    { "role": "user", "content": content }
  ];
  console.log(content);
  fetchChatCompletion(messages, undefined, new ReaderLMSettings());
}

async function main(content: string): Promise<AIResponse> {
  cancelPriorFetches();
  currentFetchController = new AbortController();
  
  const intention = await User.getIntention();
  if (!intention) {
    throw new Error('No intention found');
  }
  
  const systemPrompt = await User.createSystemPrompt(intention);
  if (!systemPrompt) {
    throw new Error('Failed to create system prompt');
  }
  
  const apiKey = await User.getApiKey();
  const completion = new ChatGenerate(systemPrompt, content);
  const template = await getNTokenPrompt(completion, 4000);
  
  const settings = new ChatSettings({ 
    model: MODEL, 
    chatCompletionUrl: 'http://localhost:11434/api/generate', 
    contextSize: 4000, 
    format: "json"
  });
  
  return fetchChatGeneration(template, apiKey, settings, currentFetchController.signal)
    .then(async (data) => parseCompletionResponse(data.response || ''))
    .catch((err: Error) => {
      if (err.name === 'AbortError') {
        console.log('Fetches aborted');
        throw err;
      }
      throw err;
    });
}

function cancelPriorFetches(): void {
  if (currentFetchController) {
    currentFetchController.abort();
    currentFetchController = null;
  }
}

function parseCompletionResponse(response: string): AIResponse {
  let cleanedResponse = response.replace(/\n/g, '');
  cleanedResponse = cleanedResponse.replace(/\\/g, '');
  cleanedResponse = cleanedResponse.replace(/```/g, '');
  cleanedResponse = extractWithCurlyBrackets(cleanedResponse);
  
  try {
    if (!cleanedResponse) {
      throw new Error("No content found in the response");
    }
    return JSON.parse(cleanedResponse) as AIResponse;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    throw new Error('Failed to parse response: ' + cleanedResponse);
  }
}

function extractWithCurlyBrackets(str: string): string {
  const regex = /{[^}]*}/;
  const match = str.match(regex);
  return match ? match[0] : '';
}

interface MessageHandlers {
  [key: string]: MessageHandler;
}

const messageHandlers: MessageHandlers = {
  intention: async (message: IntentionMessage) => {
    await User.updateIntention(message.intention);
  },
  
  content: async (message: ContentMessage, sendResponse?: (response: MessageResponse) => void) => {
    try {
      const reply = await main(message.content);
      console.log(reply);
      sendResponse?.({ reply });
      setCurrentReply(reply);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse?.({ error: errorMessage });
    }
  },
  
  html: async (message: HtmlMessage, sendResponse?: (response: MessageResponse) => void) => {
    console.log(message.html);
    try {
      const reply = await main(message.content || '');
      sendResponse?.({ reply });
      setCurrentReply(reply);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse?.({ error: errorMessage });
    }
  },
  
  action: async (message: ActionMessage, sendResponse?: (response: MessageResponse) => void) => {
    console.log(message.action);
    try {
      const reply = await main(message.content || '');
      sendResponse?.({ reply });
      setCurrentReply(reply);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse?.({ error: errorMessage });
    }
  },
  
  favorite: (message: FavoriteMessage) => {
    User.toggleIntentionFromFavoritesMap(message.favorite);
    User.toggleShowFavoriteInHistoryList(message.favorite);
  },
  
  log: (message: LogMessage) => {
    console.debug(message.log);
  }
};

browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  const messageType = Object.keys(message)[0];
  const handler = messageHandlers[messageType];
  
  if (handler) {
    const result = handler(message, sendResponse);
    if (result instanceof Promise) {
      return true; // Indicates that we will send a response asynchronously
    }
  }
});

// Commented out listeners - uncomment if needed
// browser.tabs.onActivated.addListener(sendParseMessage);
// browser.tabs.onUpdated.addListener(sendParseMessage);