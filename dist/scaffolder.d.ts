/**
 * Schema.org Generator and Validator for Astro Dev Schema Scaffolder
 * Generates valid JSON-LD schemas using Gemini Nano (window.ai.languageModel)
 * with robust deterministic rule-based fallbacks and multi-format exporters.
 */
import type { ExtractedPageData } from './extractor.js';
import './chrome-ai.d.ts';
export type SchemaType = 'TechArticle' | 'Product' | 'Event' | 'FAQPage' | 'Organization' | 'HowTo';
export type OutputFormat = 'script-tag' | 'astro-frontmatter' | 'raw-json' | 'astro-props';
export interface SchemaValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface GenerationResult {
    schema: Record<string, any>;
    formatted: string;
    source: 'gemini-nano' | 'rule-based-fallback';
    validation: SchemaValidationResult;
    modelTokensUsed?: number;
}
/**
 * Validates a Schema.org JSON-LD object for required and recommended fields.
 */
export declare function validateSchema(schema: Record<string, any>, expectedType?: SchemaType): SchemaValidationResult;
/**
 * Builds deterministic Schema.org JSON-LD based on extracted DOM data.
 */
export declare function buildRuleBasedSchema(type: SchemaType, data: ExtractedPageData): Record<string, any>;
/**
 * Checks if Chrome Built-in AI languageModel is available in the current browser environment.
 */
export declare function checkChromeAIAvailability(): Promise<'readily' | 'after-download' | 'no'>;
/**
 * Cleans markdown code fences and returns parsed JSON.
 */
export declare function cleanAndParseJSON(raw: string): Record<string, any>;
/**
 * Scaffolds Schema.org JSON-LD using Gemini Nano (window.ai.languageModel) or falls back to rule-based.
 */
export declare function scaffoldSchema(type: SchemaType, data: ExtractedPageData, format?: OutputFormat): Promise<GenerationResult>;
/**
 * Formats a Schema.org object into the desired output format.
 */
export declare function formatSchemaOutput(schema: Record<string, any>, format: OutputFormat): string;
