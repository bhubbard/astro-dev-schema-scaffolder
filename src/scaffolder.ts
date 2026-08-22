/**
 * Schema.org Generator and Validator for Astro Dev Schema Scaffolder
 * Generates valid JSON-LD schemas using Gemini Nano (window.ai.languageModel)
 * with robust deterministic rule-based fallbacks and multi-format exporters.
 */

import type { ExtractedPageData } from './extractor.js';
import './chrome-ai.d.ts';

export type SchemaType =
  | 'TechArticle'
  | 'Product'
  | 'Event'
  | 'FAQPage'
  | 'Organization'
  | 'HowTo';

export type OutputFormat =
  | 'script-tag'
  | 'astro-frontmatter'
  | 'raw-json'
  | 'astro-props';

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
export function validateSchema(
  schema: Record<string, any>,
  expectedType?: SchemaType
): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schema || typeof schema !== 'object') {
    return {
      isValid: false,
      errors: ['Schema must be a valid JSON object.'],
      warnings: [],
    };
  }

  // Check @context
  if (
    schema['@context'] !== 'https://schema.org' &&
    schema['@context'] !== 'http://schema.org'
  ) {
    errors.push('Missing or invalid "@context". Expected "https://schema.org".');
  }

  const type = schema['@type'] as SchemaType;
  if (!type) {
    errors.push('Missing "@type" property.');
  } else if (expectedType && type !== expectedType) {
    errors.push(`Expected @type "${expectedType}", but got "${type}".`);
  }

  // Type-specific validation
  switch (type) {
    case 'TechArticle':
      if (!schema.headline && !schema.name) {
        errors.push('TechArticle must have a "headline" or "name".');
      }
      if (!schema.author) {
        warnings.push('Recommended: TechArticle should specify an "author".');
      }
      if (!schema.datePublished) {
        warnings.push('Recommended: TechArticle should specify "datePublished".');
      }
      if (!schema.proficiencyLevel) {
        warnings.push('Optional: "proficiencyLevel" (e.g. "Beginner", "Expert") enhances TechArticle.');
      }
      break;

    case 'Product':
      if (!schema.name) {
        errors.push('Product must have a "name".');
      }
      if (!schema.offers) {
        warnings.push('Recommended: Product should include an "offers" property (price, currency, availability).');
      } else if (typeof schema.offers === 'object') {
        if (!schema.offers.price && !schema.offers.priceSpecification) {
          warnings.push('Product offers should have a "price".');
        }
        if (!schema.offers.priceCurrency) {
          warnings.push('Product offers should have a "priceCurrency".');
        }
      }
      break;

    case 'Event':
      if (!schema.name) {
        errors.push('Event must have a "name".');
      }
      if (!schema.startDate) {
        errors.push('Event must have a "startDate".');
      }
      if (!schema.location) {
        warnings.push('Recommended: Event should specify a "location" (Place or VirtualLocation).');
      }
      break;

    case 'FAQPage':
      if (!schema.mainEntity || !Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
        errors.push('FAQPage must have a non-empty "mainEntity" array of Question objects.');
      } else {
        schema.mainEntity.forEach((q: any, i: number) => {
          if (q['@type'] !== 'Question') {
            errors.push(`mainEntity[${i}] must have @type "Question".`);
          }
          if (!q.name) {
            errors.push(`mainEntity[${i}] Question must have a "name" (the question text).`);
          }
          if (!q.acceptedAnswer || q.acceptedAnswer['@type'] !== 'Answer' || !q.acceptedAnswer.text) {
            errors.push(`mainEntity[${i}] Question must have an "acceptedAnswer" of @type "Answer" with "text".`);
          }
        });
      }
      break;

    case 'Organization':
      if (!schema.name) {
        errors.push('Organization must have a "name".');
      }
      if (!schema.url) {
        warnings.push('Recommended: Organization should have a "url".');
      }
      break;

    case 'HowTo':
      if (!schema.name) {
        errors.push('HowTo must have a "name".');
      }
      if (!schema.step || !Array.isArray(schema.step) || schema.step.length === 0) {
        errors.push('HowTo must contain at least one "step" in the step array.');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Builds deterministic Schema.org JSON-LD based on extracted DOM data.
 */
export function buildRuleBasedSchema(
  type: SchemaType,
  data: ExtractedPageData
): Record<string, any> {
  const base = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'TechArticle': {
      return {
        ...base,
        headline: data.techArticle?.headline || data.title,
        description: data.description || undefined,
        url: data.url,
        inLanguage: data.language || 'en',
        datePublished: data.datePublished || new Date().toISOString().split('T')[0],
        dateModified: data.dateModified || undefined,
        author: data.author
          ? {
              '@type': 'Person',
              name: data.author,
            }
          : undefined,
        publisher: data.siteName
          ? {
              '@type': 'Organization',
              name: data.siteName,
              logo: data.organization?.logo
                ? {
                    '@type': 'ImageObject',
                    url: data.organization.logo,
                  }
                : undefined,
            }
          : undefined,
        proficiencyLevel: data.techArticle?.proficiencyLevel || 'Beginner',
        image: data.image || undefined,
        wordCount: data.techArticle?.wordCount || undefined,
      };
    }

    case 'Product': {
      const prod = data.product;
      return {
        ...base,
        name: prod?.name || data.title,
        description: prod?.description || data.description || undefined,
        image: prod?.image || data.image || undefined,
        sku: prod?.sku || undefined,
        offers: {
          '@type': 'Offer',
          url: data.url,
          priceCurrency: prod?.priceCurrency || 'USD',
          price: prod?.price || '0.00',
          availability: prod?.availability || 'https://schema.org/InStock',
        },
        aggregateRating: prod?.ratingValue
          ? {
              '@type': 'AggregateRating',
              ratingValue: prod.ratingValue,
              reviewCount: prod.reviewCount || '1',
            }
          : undefined,
      };
    }

    case 'Event': {
      const evt = data.event;
      return {
        ...base,
        name: evt?.name || data.title,
        description: evt?.description || data.description || undefined,
        startDate: evt?.startDate || new Date().toISOString(),
        endDate: evt?.endDate || undefined,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: evt?.isOnline
          ? 'https://schema.org/OnlineEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
        location: evt?.isOnline
          ? {
              '@type': 'VirtualLocation',
              url: evt.url || data.url,
            }
          : {
              '@type': 'Place',
              name: evt?.locationName || 'Main Venue',
              address: evt?.locationAddress || '123 Main St',
            },
        image: data.image || undefined,
        organizer: data.organization?.name
          ? {
              '@type': 'Organization',
              name: data.organization.name,
              url: data.organization.url || data.url,
            }
          : undefined,
      };
    }

    case 'FAQPage': {
      const faqList = data.faqs.length > 0
        ? data.faqs
        : [
            {
              question: data.headings.find((h) => h.level === 2)?.text || 'What is this article about?',
              answer: data.description || 'This page provides detailed technical explanations and guides.',
            },
          ];

      return {
        ...base,
        mainEntity: faqList.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
    }

    case 'Organization': {
      const org = data.organization;
      return {
        ...base,
        name: org?.name || data.siteName || data.title,
        url: org?.url || data.url,
        logo: org?.logo || data.image || undefined,
        sameAs: org?.socialLinks && org.socialLinks.length > 0 ? org.socialLinks : undefined,
        contactPoint: org?.email || org?.telephone
          ? {
              '@type': 'ContactPoint',
              contactType: 'Customer Support',
              email: org.email || undefined,
              telephone: org.telephone || undefined,
            }
          : undefined,
      };
    }

    case 'HowTo': {
      const steps = data.howToSteps && data.howToSteps.length > 0
        ? data.howToSteps
        : data.headings.filter((h) => h.level === 2 || h.level === 3).slice(0, 4).map((h, i) => ({
            name: h.text,
            text: `Follow the instructions for ${h.text}.`,
          }));

      return {
        ...base,
        name: data.title,
        description: data.description || undefined,
        image: data.image || undefined,
        step: steps.length > 0
          ? steps.map((s, idx) => ({
              '@type': 'HowToStep',
              position: idx + 1,
              name: s.name,
              text: s.text,
            }))
          : [
              {
                '@type': 'HowToStep',
                position: 1,
                name: 'Getting Started',
                text: 'Begin following the guide.',
              },
            ],
      };
    }

    default:
      return {
        ...base,
        name: data.title,
        description: data.description,
        url: data.url,
      };
  }
}

/**
 * Checks if Chrome Built-in AI languageModel is available in the current browser environment.
 */
export async function checkChromeAIAvailability(): Promise<'readily' | 'after-download' | 'no'> {
  if (typeof window === 'undefined' || !window.ai?.languageModel) {
    return 'no';
  }
  try {
    const caps = await window.ai.languageModel.capabilities();
    return caps.available;
  } catch {
    return 'no';
  }
}

/**
 * Cleans markdown code fences and returns parsed JSON.
 */
export function cleanAndParseJSON(raw: string): Record<string, any> {
  let cleaned = raw.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  // Extract outermost json object if there's leading/trailing noise
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Scaffolds Schema.org JSON-LD using Gemini Nano (window.ai.languageModel) or falls back to rule-based.
 */
export async function scaffoldSchema(
  type: SchemaType,
  data: ExtractedPageData,
  format: OutputFormat = 'script-tag'
): Promise<GenerationResult> {
  const availability = await checkChromeAIAvailability();

  if (availability === 'readily' || availability === 'after-download') {
    try {
      const systemPrompt = `You are a Schema.org SEO and JSON-LD expert.
Given webpage metadata and content, output ONLY a single valid JSON-LD object matching Schema.org specifications for @type "${type}".
Requirements:
1. "@context" MUST be "https://schema.org".
2. "@type" MUST be "${type}".
3. Extract precise information from the provided data (e.g. title, description, headings, FAQs, pricing, author, dates).
4. Output raw JSON only. Do not add markdown backticks, conversational preamble, or explanations.`;

      const userPrompt = `Generate Schema.org ${type} JSON-LD for this page:
- URL: ${data.url}
- Title: ${data.title}
- Description: ${data.description}
- Author: ${data.author || 'N/A'}
- Published Date: ${data.datePublished || 'N/A'}
- Image: ${data.image || 'N/A'}
- Headings: ${JSON.stringify(data.headings.slice(0, 8))}
- FAQs: ${JSON.stringify(data.faqs.slice(0, 6))}
- Product info: ${JSON.stringify(data.product || {})}
- Event info: ${JSON.stringify(data.event || {})}
- Page text summary: ${data.rawTextSummary.slice(0, 1500)}`;

      const session = await window.ai!.languageModel!.create({
        systemPrompt,
        temperature: 0.1,
        topK: 1,
      });

      const rawResponse = await session.prompt(userPrompt);
      session.destroy();

      const parsedSchema = cleanAndParseJSON(rawResponse);
      // Ensure basic @context and @type
      if (!parsedSchema['@context']) parsedSchema['@context'] = 'https://schema.org';
      if (!parsedSchema['@type']) parsedSchema['@type'] = type;

      const validation = validateSchema(parsedSchema, type);
      const formatted = formatSchemaOutput(parsedSchema, format);

      return {
        schema: parsedSchema,
        formatted,
        source: 'gemini-nano',
        validation,
      };
    } catch (err) {
      console.warn('[astro-dev-schema-scaffolder] Chrome AI generation failed, using rule-based fallback:', err);
    }
  }

  // Fallback to deterministic rule-based builder
  const fallbackSchema = buildRuleBasedSchema(type, data);
  const validation = validateSchema(fallbackSchema, type);
  const formatted = formatSchemaOutput(fallbackSchema, format);

  return {
    schema: fallbackSchema,
    formatted,
    source: 'rule-based-fallback',
    validation,
  };
}

/**
 * Formats a Schema.org object into the desired output format.
 */
export function formatSchemaOutput(
  schema: Record<string, any>,
  format: OutputFormat
): string {
  const jsonString = JSON.stringify(schema, null, 2);

  switch (format) {
    case 'script-tag':
      return `<script type="application/ld+json">\n${jsonString}\n</script>`;

    case 'astro-frontmatter':
      return `---
// Paste inside Astro frontmatter
const schema = ${jsonString};
---

<!-- Place in your Astro component/layout <head> -->
<script type="application/ld+json" set:html={JSON.stringify(schema)} />`;

    case 'astro-props':
      return `export interface Props {
  schema?: typeof schema;
}

const schema = ${jsonString};`;

    case 'raw-json':
    default:
      return jsonString;
  }
}
