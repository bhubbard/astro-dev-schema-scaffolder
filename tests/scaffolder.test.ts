import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  validateSchema,
  buildRuleBasedSchema,
  cleanAndParseJSON,
  formatSchemaOutput,
  scaffoldSchema,
} from '../src/scaffolder.js';
import type { ExtractedPageData } from '../src/extractor.js';

const mockExtractedData: ExtractedPageData = {
  url: 'https://astro.build/blog/hybrid-rendering',
  title: 'Hybrid Rendering in Astro 5',
  description: 'Learn how to combine SSG and SSR in Astro with Gemini Nano SEO tools.',
  author: 'Sarah Astro',
  datePublished: '2026-05-10',
  language: 'en',
  image: 'https://astro.build/og-hybrid.jpg',
  siteName: 'Astro Blog',
  headings: [
    { level: 1, text: 'Hybrid Rendering in Astro 5' },
    { level: 2, text: 'What is Hybrid Rendering?' },
    { level: 2, text: 'Configuring output: "hybrid"' },
  ],
  faqs: [
    {
      question: 'What is hybrid rendering?',
      answer: 'It lets you statically pre-render pages by default while opting into server rendering on demand.',
    },
  ],
  product: {
    name: 'Astro Pro Subscription',
    price: '29.00',
    priceCurrency: 'USD',
    sku: 'ASTRO-PRO-01',
    ratingValue: '4.9',
    reviewCount: '45',
  },
  event: {
    name: 'Astro World Tour',
    startDate: '2026-09-01T10:00:00Z',
    locationName: 'Virtual',
    isOnline: true,
  },
  organization: {
    name: 'Astro Technology Co.',
    url: 'https://astro.build',
    logo: 'https://astro.build/logo.svg',
    socialLinks: ['https://twitter.com/astrodotbuild'],
  },
  howToSteps: [
    { name: 'Install Astro', text: 'Run npm create astro@latest.' },
    { name: 'Enable AI', text: 'Enable Chrome flags for Prompt API.' },
  ],
  rawTextSummary: 'Hybrid Rendering in Astro 5 guide and complete breakdown.',
};

describe('validateSchema', () => {
  it('validates a correct TechArticle schema', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Hybrid Rendering in Astro 5',
      author: { '@type': 'Person', name: 'Sarah Astro' },
      datePublished: '2026-05-10',
    };
    const result = validateSchema(schema, 'TechArticle');
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('reports missing @context and required fields', () => {
    const invalidSchema = {
      '@type': 'TechArticle',
      // missing @context and headline
    };
    const result = validateSchema(invalidSchema as any, 'TechArticle');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing or invalid "@context". Expected "https://schema.org".');
    expect(result.errors).toContain('TechArticle must have a "headline" or "name".');
  });

  it('validates FAQPage structure with Question and Answer', () => {
    const validFAQ = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Astro?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A modern web framework.',
          },
        },
      ],
    };
    const result = validateSchema(validFAQ, 'FAQPage');
    expect(result.isValid).toBe(true);
  });

  it('catches invalid FAQPage mainEntity', () => {
    const invalidFAQ = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [],
    };
    const result = validateSchema(invalidFAQ, 'FAQPage');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('FAQPage must have a non-empty "mainEntity" array of Question objects.');
  });
});

describe('buildRuleBasedSchema', () => {
  it('builds a complete TechArticle JSON-LD', () => {
    const schema = buildRuleBasedSchema('TechArticle', mockExtractedData);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('TechArticle');
    expect(schema.headline).toBe('Hybrid Rendering in Astro 5');
    expect(schema.author?.name).toBe('Sarah Astro');
    expect(schema.publisher?.name).toBe('Astro Blog');
  });

  it('builds a complete Product JSON-LD', () => {
    const schema = buildRuleBasedSchema('Product', mockExtractedData);
    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe('Astro Pro Subscription');
    expect(schema.offers?.price).toBe('29.00');
    expect(schema.offers?.priceCurrency).toBe('USD');
    expect(schema.aggregateRating?.ratingValue).toBe('4.9');
  });

  it('builds a complete Event JSON-LD', () => {
    const schema = buildRuleBasedSchema('Event', mockExtractedData);
    expect(schema['@type']).toBe('Event');
    expect(schema.name).toBe('Astro World Tour');
    expect(schema.location?.['@type']).toBe('VirtualLocation');
    expect(schema.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
  });

  it('builds a complete FAQPage JSON-LD', () => {
    const schema = buildRuleBasedSchema('FAQPage', mockExtractedData);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.length).toBe(1);
    expect(schema.mainEntity[0].name).toBe('What is hybrid rendering?');
    expect(schema.mainEntity[0].acceptedAnswer.text).toContain('statically pre-render');
  });

  it('builds a complete Organization JSON-LD', () => {
    const schema = buildRuleBasedSchema('Organization', mockExtractedData);
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('Astro Technology Co.');
    expect(schema.sameAs).toContain('https://twitter.com/astrodotbuild');
  });

  it('builds a complete HowTo JSON-LD', () => {
    const schema = buildRuleBasedSchema('HowTo', mockExtractedData);
    expect(schema['@type']).toBe('HowTo');
    expect(schema.step.length).toBe(2);
    expect(schema.step[0].name).toBe('Install Astro');
  });
});

describe('cleanAndParseJSON', () => {
  it('parses raw JSON string', () => {
    const parsed = cleanAndParseJSON('{"@context":"https://schema.org","@type":"Product","name":"Book"}');
    expect(parsed['@type']).toBe('Product');
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"@context":"https://schema.org","@type":"Event","name":"Meetup"}\n```';
    const parsed = cleanAndParseJSON(raw);
    expect(parsed['@type']).toBe('Event');
    expect(parsed.name).toBe('Meetup');
  });

  it('extracts JSON object when surrounded by model chatter', () => {
    const raw = 'Here is the requested schema:\n{"@context":"https://schema.org","@type":"Organization","name":"Acme"}\nHope this helps!';
    const parsed = cleanAndParseJSON(raw);
    expect(parsed['@type']).toBe('Organization');
    expect(parsed.name).toBe('Acme');
  });
});

describe('formatSchemaOutput', () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Guide',
  };

  it('formats as HTML script tag', () => {
    const output = formatSchemaOutput(schema, 'script-tag');
    expect(output).toContain('<script type="application/ld+json">');
    expect(output).toContain('"headline": "Guide"');
    expect(output).toContain('</script>');
  });

  it('formats as Astro frontmatter snippet', () => {
    const output = formatSchemaOutput(schema, 'astro-frontmatter');
    expect(output).toContain('---');
    expect(output).toContain('const schema = {');
    expect(output).toContain('<script type="application/ld+json" set:html={JSON.stringify(schema)} />');
  });

  it('formats as raw JSON', () => {
    const output = formatSchemaOutput(schema, 'raw-json');
    expect(JSON.parse(output)).toEqual(schema);
  });
});

describe('scaffoldSchema with Gemini Nano / Fallback', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  it('falls back to rule-based generation when window.ai is not available', async () => {
    (globalThis as any).window = undefined;
    const result = await scaffoldSchema('TechArticle', mockExtractedData, 'script-tag');
    expect(result.source).toBe('rule-based-fallback');
    expect(result.schema['@type']).toBe('TechArticle');
    expect(result.validation.isValid).toBe(true);
  });

  it('uses window.ai.languageModel when available', async () => {
    const mockAIResponse = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Hybrid Rendering in Astro 5 AI Generated',
      author: { '@type': 'Person', name: 'Sarah Astro' },
      datePublished: '2026-05-10',
    });

    (globalThis as any).window = {
      ai: {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => ({
            prompt: async () => mockAIResponse,
            destroy: () => {},
          }),
        },
      },
    };

    const result = await scaffoldSchema('TechArticle', mockExtractedData, 'script-tag');
    expect(result.source).toBe('gemini-nano');
    expect(result.schema.headline).toBe('Hybrid Rendering in Astro 5 AI Generated');
    expect(result.validation.isValid).toBe(true);
  });

  it('gracefully falls back to rule-based if window.ai throws an error', async () => {
    (globalThis as any).window = {
      ai: {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => {
            throw new Error('Model crashed');
          },
        },
      },
    };

    const result = await scaffoldSchema('Product', mockExtractedData, 'raw-json');
    expect(result.source).toBe('rule-based-fallback');
    expect(result.schema['@type']).toBe('Product');
    expect(result.validation.isValid).toBe(true);
  });
});
