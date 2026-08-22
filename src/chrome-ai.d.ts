/**
 * Complete Chrome Built-in AI TypeScript definitions
 * Covers window.ai, languageModel, summarizer, rewriter, writer, and translator APIs.
 */

export type AICapabilityAvailability = 'readily' | 'after-download' | 'no';

export interface AICapabilities {
  readonly available: AICapabilityAvailability;
  readonly defaultTemperature?: number;
  readonly maxTemperature?: number;
  readonly defaultTopK?: number;
  readonly maxTopK?: number;
}

export interface AILanguageModelCapabilities extends AICapabilities {
  readonly supportsLanguage?: (languageTag: string) => AICapabilityAvailability;
}

export interface AILanguageModelCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  systemPrompt?: string;
  initialPrompts?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  topK?: number;
}

export interface AICreateMonitor extends EventTarget {
  ondownloadprogress?: (event: { loaded: number; total: number }) => void;
}

export interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
  context?: string;
  prefix?: string;
}

export interface AILanguageModel extends EventTarget {
  readonly maxTokens: number;
  readonly tokensSoFar: number;
  readonly tokensLeft: number;
  readonly topK: number;
  readonly temperature: number;

  prompt(input: string, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(
    input: string,
    options?: AILanguageModelPromptOptions
  ): ReadableStream<string>;
  countPromptTokens(
    input: string,
    options?: AILanguageModelPromptOptions
  ): Promise<number>;
  clone(): Promise<AILanguageModel>;
  destroy(): void;
}

export interface AILanguageModelFactory {
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
  availability?(options?: AILanguageModelCreateOptions): Promise<AICapabilityAvailability>;
}

export interface AISummarizerCapabilities extends AICapabilities {
  readonly maxInputLength?: number;
}

export interface AISummarizerCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  sharedContext?: string;
  type?: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
}

export interface AISummarizer {
  summarize(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>;
  summarizeStreaming(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): ReadableStream<string>;
  destroy(): void;
}

export interface AISummarizerFactory {
  capabilities(): Promise<AISummarizerCapabilities>;
  create(options?: AISummarizerCreateOptions): Promise<AISummarizer>;
}

export interface AIRewriterCapabilities extends AICapabilities {}

export interface AIRewriterCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  sharedContext?: string;
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  format?: 'as-is' | 'plain-text' | 'markdown';
  length?: 'as-is' | 'shorter' | 'longer';
}

export interface AIRewriter {
  rewrite(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>;
  rewriteStreaming(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): ReadableStream<string>;
  destroy(): void;
}

export interface AIRewriterFactory {
  capabilities(): Promise<AIRewriterCapabilities>;
  create(options?: AIRewriterCreateOptions): Promise<AIRewriter>;
}

export interface AIWriterCapabilities extends AICapabilities {}

export interface AIWriterCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  sharedContext?: string;
  tone?: 'formal' | 'neutral' | 'casual';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
}

export interface AIWriter {
  write(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): Promise<string>;
  writeStreaming(
    input: string,
    options?: { context?: string; signal?: AbortSignal }
  ): ReadableStream<string>;
  destroy(): void;
}

export interface AIWriterFactory {
  capabilities(): Promise<AIWriterCapabilities>;
  create(options?: AIWriterCreateOptions): Promise<AIWriter>;
}

export interface AITranslatorCapabilities extends AICapabilities {
  languagePairAvailable(
    sourceLanguage: string,
    targetLanguage: string
  ): AICapabilityAvailability;
}

export interface AITranslatorCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: AICreateMonitor) => void;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(
    input: string,
    options?: { signal?: AbortSignal }
  ): ReadableStream<string>;
  destroy(): void;
}

export interface AITranslatorFactory {
  capabilities(): Promise<AITranslatorCapabilities>;
  create(options: AITranslatorCreateOptions): Promise<AITranslator>;
}

export interface ChromeAI {
  readonly languageModel?: AILanguageModelFactory;
  readonly summarizer?: AISummarizerFactory;
  readonly rewriter?: AIRewriterFactory;
  readonly writer?: AIWriterFactory;
  readonly translator?: AITranslatorFactory;
}

declare global {
  interface Window {
    ai?: ChromeAI;
  }
  const ai: ChromeAI | undefined;
}
