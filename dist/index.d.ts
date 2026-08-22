/**
 * Astro Dev Schema Scaffolder Integration
 * Registers the Dev Toolbar App for instant on-device Schema.org microdata generation.
 */
import type { AstroIntegration } from 'astro';
export interface SchemaScaffolderOptions {
    /**
     * Default Schema.org type to scaffold on app open.
     * Defaults to 'TechArticle'.
     */
    defaultSchemaType?: 'TechArticle' | 'Product' | 'Event' | 'FAQPage' | 'Organization' | 'HowTo';
    /**
     * Default export format for the generated schema.
     * Defaults to 'script-tag'.
     */
    defaultFormat?: 'script-tag' | 'astro-frontmatter' | 'raw-json';
}
/**
 * Astro Dev Schema Scaffolder integration
 */
export default function schemaScaffolder(_options?: SchemaScaffolderOptions): AstroIntegration;
export * from './extractor.js';
export * from './scaffolder.js';
