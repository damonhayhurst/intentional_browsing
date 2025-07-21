// Core interfaces for the intentional browsing extension

export interface AnalysisMeta {
  type: string;
  length: number;
  output: string;
}

export interface AIResponse {
  aligned: string;
  reasoning: string;
  likelihood?: string;
}

export interface ContentMessage {
  content: string;
}

export interface IntentionMessage {
  intention: string;
}

export interface ReplyMessage {
  reply: AIResponse;
}

export interface ObserverOptions {
  timeoutDuration: number;
  debounceWait: number;
  debounceMaxWait: number;
}

export interface DomainConfig {
  [domain: string]: any;
}

export interface UserSettings {
  provider: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface UserIntention {
  intention: string;
  timestamp: number;
  url?: string;
}

// Message types for background and content scripts
export interface ActionMessage {
  action: string;
  content?: string;
}

export interface HtmlMessage {
  html: string;
  content?: string;
}

export interface LogMessage {
  log: string;
}

export interface FavoriteMessage {
  favorite: string;
}

export interface TryAgainMessage {
  tryAgain: boolean;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  reply: AIResponse;
}

export type MessageResponse = ErrorResponse | SuccessResponse;

export interface MessageHandler {
  (message: any, sendResponse?: (response: MessageResponse) => void): void | Promise<void>;
}

// Window global types
declare global {
  const browser: typeof import('webextension-polyfill');
  interface Window {
    current_reply?: AIResponse;
  }
  // const chrome: typeof import('chrome');
}