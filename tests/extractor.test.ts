import { describe, it, expect } from 'bun:test';
import { Window } from 'happy-dom';
import { extractPageData } from '../src/extractor.js';

describe('extractPageData', () => {
  it('extracts standard metadata from HTML tags and OpenGraph meta', () => {
    const window = new Window();
    const doc = window.document;
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Astro On-Device AI Guide</title>
          <link rel="canonical" href="https://example.com/guide" />
          <meta name="description" content="A complete guide to on-device AI in Astro using Gemini Nano." />
          <meta property="og:title" content="Astro On-Device AI Guide" />
          <meta property="og:description" content="A complete guide to on-device AI in Astro using Gemini Nano." />
          <meta property="og:image" content="https://example.com/og.png" />
          <meta property="og:site_name" content="Astro Docs" />
          <meta name="author" content="Jane Developer" />
          <meta name="date" content="2026-08-20" />
        </head>
        <body>
          <h1>Astro On-Device AI Guide</h1>
          <h2>Prerequisites</h2>
          <p>Make sure Chrome 128+ is installed.</p>
          <h2>Implementation Steps</h2>
          <pre><code>npm install astro-dev-schema-scaffolder</code></pre>
        </body>
      </html>
    `);

    const data = extractPageData(doc as unknown as Document);

    expect(data.title).toBe('Astro On-Device AI Guide');
    expect(data.description).toBe('A complete guide to on-device AI in Astro using Gemini Nano.');
    expect(data.url).toBe('https://example.com/guide');
    expect(data.author).toBe('Jane Developer');
    expect(data.language).toBe('en');
    expect(data.image).toBe('https://example.com/og.png');
    expect(data.siteName).toBe('Astro Docs');
    expect(data.datePublished).toBe('2026-08-20');
    expect(data.headings).toEqual([
      { level: 1, text: 'Astro On-Device AI Guide' },
      { level: 2, text: 'Prerequisites' },
      { level: 2, text: 'Implementation Steps' },
    ]);
    expect(data.techArticle?.codeSnippetCount).toBe(1);
    expect(data.techArticle?.proficiencyLevel).toBe('Beginner');
  });

  it('extracts FAQ items from details/summary and dl/dt/dd', () => {
    const window = new Window();
    const doc = window.document;
    doc.write(`
      <!DOCTYPE html>
      <html>
        <body>
          <details>
            <summary>What is Gemini Nano?</summary>
            <p>Gemini Nano is Google's on-device foundation model built into Chrome.</p>
          </details>
          <dl>
            <dt>Does it work offline?</dt>
            <dd>Yes, it runs 100% locally on your hardware.</dd>
          </dl>
          <div class="faq-item">
            <h3 class="faq-question">Is it free to use?</h3>
            <p class="faq-answer">Yes, no API keys or cloud tokens are required.</p>
          </div>
        </body>
      </html>
    `);

    const data = extractPageData(doc as unknown as Document);

    expect(data.faqs.length).toBe(3);
    expect(data.faqs[0].question).toBe('What is Gemini Nano?');
    expect(data.faqs[0].answer).toContain('built into Chrome');
    expect(data.faqs[1].question).toBe('Does it work offline?');
    expect(data.faqs[1].answer).toBe('Yes, it runs 100% locally on your hardware.');
    expect(data.faqs[2].question).toBe('Is it free to use?');
    expect(data.faqs[2].answer).toBe('Yes, no API keys or cloud tokens are required.');
  });

  it('extracts Product data correctly', () => {
    const window = new Window();
    const doc = window.document;
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mechanical Keyboard</title>
        </head>
        <body class="product">
          <h1 class="product-title">Ergonomic Mechanical Keyboard</h1>
          <span class="price" data-price="149.99">$149.99</span>
          <span class="sku">KB-9000</span>
          <div class="rating">4.8</div>
          <div class="reviews-count">128</div>
          <span class="in-stock">In Stock</span>
        </body>
      </html>
    `);

    const data = extractPageData(doc as unknown as Document);

    expect(data.product).toBeDefined();
    expect(data.product?.name).toBe('Ergonomic Mechanical Keyboard');
    expect(data.product?.price).toBe('149.99');
    expect(data.product?.priceCurrency).toBe('USD');
    expect(data.product?.sku).toBe('KB-9000');
    expect(data.product?.ratingValue).toBe('4.8');
    expect(data.product?.reviewCount).toBe('128');
  });

  it('extracts Event data and Organization data', () => {
    const window = new Window();
    const doc = window.document;
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Astro Conf 2026</title>
          <meta property="og:site_name" content="Astro Community" />
        </head>
        <body class="event">
          <header>
            <img class="logo" src="https://example.com/logo.svg" alt="Logo" />
          </header>
          <h1>Astro Conf 2026</h1>
          <time class="event-date" datetime="2026-10-15T09:00:00Z">Oct 15, 2026</time>
          <div class="venue">Moscone Center, SF</div>
          <a href="https://twitter.com/astrodotbuild">Twitter</a>
          <a href="https://github.com/withastro">GitHub</a>
          <a href="mailto:support@astro.build">Contact</a>
        </body>
      </html>
    `);

    const data = extractPageData(doc as unknown as Document);

    expect(data.event).toBeDefined();
    expect(data.event?.name).toBe('Astro Conf 2026');
    expect(data.event?.startDate).toBe('2026-10-15T09:00:00Z');
    expect(data.event?.locationName).toBe('Moscone Center, SF');

    expect(data.organization).toBeDefined();
    expect(data.organization?.name).toBe('Astro Community');
    expect(data.organization?.logo).toBe('https://example.com/logo.svg');
    expect(data.organization?.socialLinks).toContain('https://twitter.com/astrodotbuild');
    expect(data.organization?.socialLinks).toContain('https://github.com/withastro');
    expect(data.organization?.email).toBe('support@astro.build');
  });

  it('handles empty document gracefully with fallback defaults', () => {
    const data = extractPageData(null as unknown as Document);
    expect(data.title).toBe('Untitled Page');
    expect(data.headings).toEqual([]);
    expect(data.faqs).toEqual([]);
  });
});
