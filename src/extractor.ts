/**
 * DOM Extractor for Astro Dev Schema Scaffolder
 * Extracts page metadata, headings, FAQ items, Product/Pricing, Event details,
 * and Organization attributes from the rendered document.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name?: string;
  text: string;
}

export interface ProductData {
  name?: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
  sku?: string;
  availability?: string;
  ratingValue?: string;
  reviewCount?: string;
  image?: string;
}

export interface EventData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  locationName?: string;
  locationAddress?: string;
  isOnline?: boolean;
  url?: string;
}

export interface OrganizationData {
  name?: string;
  url?: string;
  logo?: string;
  socialLinks?: string[];
  email?: string;
  telephone?: string;
  address?: string;
}

export interface TechArticleData {
  headline?: string;
  description?: string;
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  dependencies?: string[];
  codeSnippetCount?: number;
  wordCount?: number;
}

export interface ExtractedPageData {
  url: string;
  title: string;
  description: string;
  author: string;
  datePublished?: string;
  dateModified?: string;
  language: string;
  image?: string;
  siteName?: string;
  headings: Array<{ level: number; text: string }>;
  faqs: FAQItem[];
  product?: ProductData;
  event?: EventData;
  organization?: OrganizationData;
  techArticle?: TechArticleData;
  howToSteps?: HowToStep[];
  rawTextSummary: string;
}

/**
 * Extracts complete page metadata and structured candidates from a Document or root Element.
 */
export function extractPageData(doc: Document | HTMLElement = typeof document !== 'undefined' ? document : (null as unknown as Document)): ExtractedPageData {
  if (!doc) {
    return {
      url: 'https://example.com',
      title: 'Untitled Page',
      description: '',
      author: '',
      language: 'en',
      headings: [],
      faqs: [],
      rawTextSummary: '',
    };
  }

  const root = 'documentElement' in doc ? doc.documentElement : (doc as HTMLElement);
  const query = (selector: string): Element | null => doc.querySelector?.(selector) || null;
  const queryAll = (selector: string): Element[] => Array.from(doc.querySelectorAll?.(selector) || []);
  const getMeta = (names: string[]): string => {
    for (const name of names) {
      const el = query(`meta[name="${name}" i], meta[property="${name}" i]`);
      const val = el?.getAttribute('content')?.trim();
      if (val) return val;
    }
    return '';
  };

  // URL
  const canonicalEl = query('link[rel="canonical"]');
  const pageUrl =
    canonicalEl?.getAttribute('href') ||
    getMeta(['og:url', 'twitter:url']) ||
    (typeof window !== 'undefined' && window.location?.href ? window.location.href : 'https://example.com');

  // Title
  const docTitle = ('title' in doc && typeof (doc as Document).title === 'string' ? (doc as Document).title : '') || '';
  const pageTitle =
    getMeta(['og:title', 'twitter:title']) ||
    docTitle ||
    query('h1')?.textContent?.trim() ||
    'Untitled Page';

  // Description
  const pageDescription =
    getMeta(['description', 'og:description', 'twitter:description']) ||
    query('p')?.textContent?.trim().slice(0, 200) ||
    '';

  // Author
  const pageAuthor =
    getMeta(['author', 'article:author', 'twitter:creator']) ||
    query('[rel="author"], .author, .byline, [itemprop="author"]')?.textContent?.trim() ||
    '';

  // Dates
  const datePublished =
    getMeta(['article:published_time', 'datePublished', 'publish-date', 'date']) ||
    query('time[datetime]')?.getAttribute('datetime') ||
    undefined;

  const dateModified =
    getMeta(['article:modified_time', 'dateModified', 'last-modified']) ||
    undefined;

  // Language
  const language =
    root?.getAttribute('lang') ||
    getMeta(['og:locale', 'language']) ||
    'en';

  // Image / Logo
  const pageImage =
    getMeta(['og:image', 'twitter:image', 'image']) ||
    query('meta[property="og:image:secure_url"]')?.getAttribute('content') ||
    query('article img, main img, img[src]')?.getAttribute('src') ||
    undefined;

  // Site name
  const siteName =
    getMeta(['og:site_name', 'application-name']) ||
    undefined;

  // Headings
  const headingElements = queryAll('h1, h2, h3, h4');
  const headings = headingElements.map((el) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace('h', ''), 10) || 1;
    return {
      level,
      text: el.textContent?.replace(/\s+/g, ' ').trim() || '',
    };
  }).filter((h) => h.text.length > 0);

  // FAQs extraction (details/summary, dt/dd, .faq, .qa)
  const faqs: FAQItem[] = [];

  // Pattern 1: details > summary
  queryAll('details').forEach((details) => {
    const summary = details.querySelector('summary');
    if (summary) {
      const q = summary.textContent?.replace(/\s+/g, ' ').trim() || '';
      // Clone and remove summary to get answer body text
      const clone = details.cloneNode(true) as HTMLElement;
      const s = clone.querySelector('summary');
      if (s) s.remove();
      const a = clone.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (q && a) {
        faqs.push({ question: q, answer: a });
      }
    }
  });

  // Pattern 2: dl > dt + dd
  queryAll('dl').forEach((dl) => {
    const children = Array.from(dl.children);
    let currentQ = '';
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'dt') {
        currentQ = child.textContent?.replace(/\s+/g, ' ').trim() || '';
      } else if (tag === 'dd' && currentQ) {
        const a = child.textContent?.replace(/\s+/g, ' ').trim() || '';
        if (a) {
          faqs.push({ question: currentQ, answer: a });
          currentQ = '';
        }
      }
    }
  });

  // Pattern 3: .faq-item, .qa-item, [itemtype*="Question"]
  queryAll('.faq-item, .faq, .qa-item, .accordion-item').forEach((item) => {
    const qEl = item.querySelector('.faq-question, .question, .accordion-header, h3, h4, strong');
    const aEl = item.querySelector('.faq-answer, .answer, .accordion-body, p');
    if (qEl && aEl) {
      const q = qEl.textContent?.replace(/\s+/g, ' ').trim() || '';
      const a = aEl.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (q && a && !faqs.some((f) => f.question === q)) {
        faqs.push({ question: q, answer: a });
      }
    }
  });

  // HowTo Steps extraction (.step, ol > li, [itemprop="step"])
  const howToSteps: HowToStep[] = [];
  queryAll('.step, .howto-step, ol.steps > li, [itemprop="step"]').forEach((stepEl, idx) => {
    const nameEl = stepEl.querySelector('h3, h4, strong, .step-title');
    const stepName = nameEl?.textContent?.trim() || `Step ${idx + 1}`;
    const stepText = stepEl.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (stepText) {
      howToSteps.push({ name: stepName, text: stepText });
    }
  });

  // Product & Pricing extraction
  let product: ProductData | undefined;
  const priceEl = query('[itemprop="price"], .price, .product-price, [data-price]');
  const skuEl = query('[itemprop="sku"], .sku, [data-sku]');
  const ratingEl = query('[itemprop="ratingValue"], .rating, .review-score');
  const reviewCountEl = query('[itemprop="reviewCount"], .reviews-count');

  // Regex price matcher on body text or price element
  let detectedPrice = priceEl?.getAttribute('data-price') || priceEl?.getAttribute('content') || priceEl?.textContent?.trim();
  let currency = 'USD';

  if (detectedPrice) {
    if (detectedPrice.includes('$')) currency = 'USD';
    else if (detectedPrice.includes('€')) currency = 'EUR';
    else if (detectedPrice.includes('£')) currency = 'GBP';
    else if (detectedPrice.includes('¥')) currency = 'JPY';
    detectedPrice = detectedPrice.replace(/[^0-9.]/g, '');
  }

  const isProductCandidate = !!(priceEl || skuEl || query('.product, [itemtype*="Product"]'));
  if (isProductCandidate) {
    product = {
      name: query('.product-title, .product-name, h1')?.textContent?.trim() || pageTitle,
      description: pageDescription,
      price: detectedPrice || '0.00',
      priceCurrency: getMeta(['price:currency']) || currency,
      sku: skuEl?.textContent?.trim() || undefined,
      availability: query('.in-stock, [itemprop="availability"]')?.textContent?.toLowerCase().includes('in stock')
        ? 'https://schema.org/InStock'
        : 'https://schema.org/InStock',
      ratingValue: ratingEl?.textContent?.trim().replace(/[^0-9.]/g, '') || undefined,
      reviewCount: reviewCountEl?.textContent?.trim().replace(/[^0-9]/g, '') || undefined,
      image: pageImage,
    };
  }

  // Event extraction
  let event: EventData | undefined;
  const isEventCandidate = !!(query('.event, [itemtype*="Event"], .event-date, .venue'));
  if (isEventCandidate) {
    const eventTime = query('.event-date, .event-time, time[datetime]')?.getAttribute('datetime') ||
      query('.event-date, .event-time')?.textContent?.trim();
    const venueEl = query('.venue, .event-location, [itemprop="location"]');
    const isOnline = !!query('.online-event, [data-online="true"]') ||
      root.textContent?.toLowerCase().includes('webinar') ||
      root.textContent?.toLowerCase().includes('virtual event');

    event = {
      name: query('.event-title, .event-name, h1')?.textContent?.trim() || pageTitle,
      description: pageDescription,
      startDate: eventTime || new Date().toISOString(),
      locationName: venueEl?.textContent?.trim() || (isOnline ? 'Online' : 'Main Venue'),
      isOnline,
      url: pageUrl,
    };
  }

  // Organization extraction
  const logoEl = query('img.logo, .site-logo img, [itemprop="logo"], header img');
  const orgLogo = logoEl?.getAttribute('src') || pageImage;
  const socialLinks: string[] = [];
  queryAll('a[href*="twitter.com"], a[href*="x.com"], a[href*="github.com"], a[href*="linkedin.com"], a[href*="facebook.com"], a[href*="youtube.com"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && !socialLinks.includes(href)) {
      socialLinks.push(href);
    }
  });

  const organization: OrganizationData = {
    name: siteName || pageAuthor || (typeof window !== 'undefined' ? window.location?.hostname : 'Organization'),
    url: pageUrl,
    logo: orgLogo,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    email: query('a[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || undefined,
    telephone: query('a[href^="tel:"]')?.getAttribute('href')?.replace('tel:', '') || undefined,
  };

  // TechArticle candidate analysis
  const rawCodeElements = queryAll('pre, code, .astro-code, .highlight');
  const codeBlocks = rawCodeElements.filter((el) => {
    if (el.tagName.toLowerCase() === 'code' && el.closest('pre')) {
      return false;
    }
    return true;
  });
  const mainContent = query('main, article, #content, .content') || root;
  const bodyText = mainContent.textContent?.replace(/\s+/g, ' ').trim() || '';
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  const techArticle: TechArticleData = {
    headline: pageTitle,
    description: pageDescription,
    proficiencyLevel: codeBlocks.length > 5 ? 'Intermediate' : 'Beginner',
    codeSnippetCount: codeBlocks.length,
    wordCount,
  };

  // Summary raw text (trimmed for AI context)
  const rawTextSummary = bodyText.slice(0, 2500);

  return {
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    author: pageAuthor,
    datePublished,
    dateModified,
    language,
    image: pageImage,
    siteName,
    headings,
    faqs,
    product,
    event,
    organization,
    techArticle,
    howToSteps: howToSteps.length > 0 ? howToSteps : undefined,
    rawTextSummary,
  };
}
