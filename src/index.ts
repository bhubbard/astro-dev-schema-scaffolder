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
export default function schemaScaffolder(_options: SchemaScaffolderOptions = {}): AstroIntegration {
  return {
    name: 'astro-dev-schema-scaffolder',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: 'astro-dev-schema-scaffolder',
          name: 'Schema Scaffolder',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
          entrypoint: new URL('./app.js', import.meta.url).pathname,
        });
      },
    },
  };
}

export * from './extractor.js';
export * from './scaffolder.js';
