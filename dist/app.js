var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
// src/scaffolder.ts
var exports_scaffolder = {};
__export(exports_scaffolder, {
  validateSchema: () => validateSchema,
  scaffoldSchema: () => scaffoldSchema,
  formatSchemaOutput: () => formatSchemaOutput,
  cleanAndParseJSON: () => cleanAndParseJSON,
  checkChromeAIAvailability: () => checkChromeAIAvailability,
  buildRuleBasedSchema: () => buildRuleBasedSchema
});
function validateSchema(schema, expectedType) {
  const errors = [];
  const warnings = [];
  if (!schema || typeof schema !== "object") {
    return {
      isValid: false,
      errors: ["Schema must be a valid JSON object."],
      warnings: []
    };
  }
  if (schema["@context"] !== "https://schema.org" && schema["@context"] !== "http://schema.org") {
    errors.push('Missing or invalid "@context". Expected "https://schema.org".');
  }
  const type = schema["@type"];
  if (!type) {
    errors.push('Missing "@type" property.');
  } else if (expectedType && type !== expectedType) {
    errors.push(`Expected @type "${expectedType}", but got "${type}".`);
  }
  switch (type) {
    case "TechArticle":
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
    case "Product":
      if (!schema.name) {
        errors.push('Product must have a "name".');
      }
      if (!schema.offers) {
        warnings.push('Recommended: Product should include an "offers" property (price, currency, availability).');
      } else if (typeof schema.offers === "object") {
        if (!schema.offers.price && !schema.offers.priceSpecification) {
          warnings.push('Product offers should have a "price".');
        }
        if (!schema.offers.priceCurrency) {
          warnings.push('Product offers should have a "priceCurrency".');
        }
      }
      break;
    case "Event":
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
    case "FAQPage":
      if (!schema.mainEntity || !Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
        errors.push('FAQPage must have a non-empty "mainEntity" array of Question objects.');
      } else {
        schema.mainEntity.forEach((q, i) => {
          if (q["@type"] !== "Question") {
            errors.push(`mainEntity[${i}] must have @type "Question".`);
          }
          if (!q.name) {
            errors.push(`mainEntity[${i}] Question must have a "name" (the question text).`);
          }
          if (!q.acceptedAnswer || q.acceptedAnswer["@type"] !== "Answer" || !q.acceptedAnswer.text) {
            errors.push(`mainEntity[${i}] Question must have an "acceptedAnswer" of @type "Answer" with "text".`);
          }
        });
      }
      break;
    case "Organization":
      if (!schema.name) {
        errors.push('Organization must have a "name".');
      }
      if (!schema.url) {
        warnings.push('Recommended: Organization should have a "url".');
      }
      break;
    case "HowTo":
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
    warnings
  };
}
function buildRuleBasedSchema(type, data) {
  const base = {
    "@context": "https://schema.org",
    "@type": type
  };
  switch (type) {
    case "TechArticle": {
      return {
        ...base,
        headline: data.techArticle?.headline || data.title,
        description: data.description || undefined,
        url: data.url,
        inLanguage: data.language || "en",
        datePublished: data.datePublished || new Date().toISOString().split("T")[0],
        dateModified: data.dateModified || undefined,
        author: data.author ? {
          "@type": "Person",
          name: data.author
        } : undefined,
        publisher: data.siteName ? {
          "@type": "Organization",
          name: data.siteName,
          logo: data.organization?.logo ? {
            "@type": "ImageObject",
            url: data.organization.logo
          } : undefined
        } : undefined,
        proficiencyLevel: data.techArticle?.proficiencyLevel || "Beginner",
        image: data.image || undefined,
        wordCount: data.techArticle?.wordCount || undefined
      };
    }
    case "Product": {
      const prod = data.product;
      return {
        ...base,
        name: prod?.name || data.title,
        description: prod?.description || data.description || undefined,
        image: prod?.image || data.image || undefined,
        sku: prod?.sku || undefined,
        offers: {
          "@type": "Offer",
          url: data.url,
          priceCurrency: prod?.priceCurrency || "USD",
          price: prod?.price || "0.00",
          availability: prod?.availability || "https://schema.org/InStock"
        },
        aggregateRating: prod?.ratingValue ? {
          "@type": "AggregateRating",
          ratingValue: prod.ratingValue,
          reviewCount: prod.reviewCount || "1"
        } : undefined
      };
    }
    case "Event": {
      const evt = data.event;
      return {
        ...base,
        name: evt?.name || data.title,
        description: evt?.description || data.description || undefined,
        startDate: evt?.startDate || new Date().toISOString(),
        endDate: evt?.endDate || undefined,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: evt?.isOnline ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
        location: evt?.isOnline ? {
          "@type": "VirtualLocation",
          url: evt.url || data.url
        } : {
          "@type": "Place",
          name: evt?.locationName || "Main Venue",
          address: evt?.locationAddress || "123 Main St"
        },
        image: data.image || undefined,
        organizer: data.organization?.name ? {
          "@type": "Organization",
          name: data.organization.name,
          url: data.organization.url || data.url
        } : undefined
      };
    }
    case "FAQPage": {
      const faqList = data.faqs.length > 0 ? data.faqs : [
        {
          question: data.headings.find((h) => h.level === 2)?.text || "What is this article about?",
          answer: data.description || "This page provides detailed technical explanations and guides."
        }
      ];
      return {
        ...base,
        mainEntity: faqList.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer
          }
        }))
      };
    }
    case "Organization": {
      const org = data.organization;
      return {
        ...base,
        name: org?.name || data.siteName || data.title,
        url: org?.url || data.url,
        logo: org?.logo || data.image || undefined,
        sameAs: org?.socialLinks && org.socialLinks.length > 0 ? org.socialLinks : undefined,
        contactPoint: org?.email || org?.telephone ? {
          "@type": "ContactPoint",
          contactType: "Customer Support",
          email: org.email || undefined,
          telephone: org.telephone || undefined
        } : undefined
      };
    }
    case "HowTo": {
      const steps = data.howToSteps && data.howToSteps.length > 0 ? data.howToSteps : data.headings.filter((h) => h.level === 2 || h.level === 3).slice(0, 4).map((h, i) => ({
        name: h.text,
        text: `Follow the instructions for ${h.text}.`
      }));
      return {
        ...base,
        name: data.title,
        description: data.description || undefined,
        image: data.image || undefined,
        step: steps.length > 0 ? steps.map((s, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.name,
          text: s.text
        })) : [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Getting Started",
            text: "Begin following the guide."
          }
        ]
      };
    }
    default:
      return {
        ...base,
        name: data.title,
        description: data.description,
        url: data.url
      };
  }
}
async function checkChromeAIAvailability() {
  if (typeof window === "undefined" || !window.ai?.languageModel) {
    return "no";
  }
  try {
    const caps = await window.ai.languageModel.capabilities();
    return caps.available;
  } catch {
    return "no";
  }
}
function cleanAndParseJSON(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}
async function scaffoldSchema(type, data, format = "script-tag") {
  const availability = await checkChromeAIAvailability();
  if (availability === "readily" || availability === "after-download") {
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
- Author: ${data.author || "N/A"}
- Published Date: ${data.datePublished || "N/A"}
- Image: ${data.image || "N/A"}
- Headings: ${JSON.stringify(data.headings.slice(0, 8))}
- FAQs: ${JSON.stringify(data.faqs.slice(0, 6))}
- Product info: ${JSON.stringify(data.product || {})}
- Event info: ${JSON.stringify(data.event || {})}
- Page text summary: ${data.rawTextSummary.slice(0, 1500)}`;
      const session = await window.ai.languageModel.create({
        systemPrompt,
        temperature: 0.1,
        topK: 1
      });
      const rawResponse = await session.prompt(userPrompt);
      session.destroy();
      const parsedSchema = cleanAndParseJSON(rawResponse);
      if (!parsedSchema["@context"])
        parsedSchema["@context"] = "https://schema.org";
      if (!parsedSchema["@type"])
        parsedSchema["@type"] = type;
      const validation2 = validateSchema(parsedSchema, type);
      const formatted2 = formatSchemaOutput(parsedSchema, format);
      return {
        schema: parsedSchema,
        formatted: formatted2,
        source: "gemini-nano",
        validation: validation2
      };
    } catch (err) {
      console.warn("[astro-dev-schema-scaffolder] Chrome AI generation failed, using rule-based fallback:", err);
    }
  }
  const fallbackSchema = buildRuleBasedSchema(type, data);
  const validation = validateSchema(fallbackSchema, type);
  const formatted = formatSchemaOutput(fallbackSchema, format);
  return {
    schema: fallbackSchema,
    formatted,
    source: "rule-based-fallback",
    validation
  };
}
function formatSchemaOutput(schema, format) {
  const jsonString = JSON.stringify(schema, null, 2);
  switch (format) {
    case "script-tag":
      return `<script type="application/ld+json">
${jsonString}
</script>`;
    case "astro-frontmatter":
      return `---
// Paste inside Astro frontmatter
const schema = ${jsonString};
---

<!-- Place in your Astro component/layout <head> -->
<script type="application/ld+json" set:html={JSON.stringify(schema)} />`;
    case "astro-props":
      return `export interface Props {
  schema?: typeof schema;
}

const schema = ${jsonString};`;
    case "raw-json":
    default:
      return jsonString;
  }
}
var init_scaffolder = () => {};

// node_modules/astro/dist/toolbar/index.js
function defineToolbarApp(app) {
  return app;
}

// src/extractor.ts
function extractPageData(doc = typeof document !== "undefined" ? document : null) {
  if (!doc) {
    return {
      url: "https://example.com",
      title: "Untitled Page",
      description: "",
      author: "",
      language: "en",
      headings: [],
      faqs: [],
      rawTextSummary: ""
    };
  }
  const root = "documentElement" in doc ? doc.documentElement : doc;
  const query = (selector) => doc.querySelector?.(selector) || null;
  const queryAll = (selector) => Array.from(doc.querySelectorAll?.(selector) || []);
  const getMeta = (names) => {
    for (const name of names) {
      const el = query(`meta[name="${name}" i], meta[property="${name}" i]`);
      const val = el?.getAttribute("content")?.trim();
      if (val)
        return val;
    }
    return "";
  };
  const canonicalEl = query('link[rel="canonical"]');
  const pageUrl = canonicalEl?.getAttribute("href") || getMeta(["og:url", "twitter:url"]) || (typeof window !== "undefined" && window.location?.href ? window.location.href : "https://example.com");
  const docTitle = ("title" in doc && typeof doc.title === "string" ? doc.title : "") || "";
  const pageTitle = getMeta(["og:title", "twitter:title"]) || docTitle || query("h1")?.textContent?.trim() || "Untitled Page";
  const pageDescription = getMeta(["description", "og:description", "twitter:description"]) || query("p")?.textContent?.trim().slice(0, 200) || "";
  const pageAuthor = getMeta(["author", "article:author", "twitter:creator"]) || query('[rel="author"], .author, .byline, [itemprop="author"]')?.textContent?.trim() || "";
  const datePublished = getMeta(["article:published_time", "datePublished", "publish-date", "date"]) || query("time[datetime]")?.getAttribute("datetime") || undefined;
  const dateModified = getMeta(["article:modified_time", "dateModified", "last-modified"]) || undefined;
  const language = root?.getAttribute("lang") || getMeta(["og:locale", "language"]) || "en";
  const pageImage = getMeta(["og:image", "twitter:image", "image"]) || query('meta[property="og:image:secure_url"]')?.getAttribute("content") || query("article img, main img, img[src]")?.getAttribute("src") || undefined;
  const siteName = getMeta(["og:site_name", "application-name"]) || undefined;
  const headingElements = queryAll("h1, h2, h3, h4");
  const headings = headingElements.map((el) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace("h", ""), 10) || 1;
    return {
      level,
      text: el.textContent?.replace(/\s+/g, " ").trim() || ""
    };
  }).filter((h) => h.text.length > 0);
  const faqs = [];
  queryAll("details").forEach((details) => {
    const summary = details.querySelector("summary");
    if (summary) {
      const q = summary.textContent?.replace(/\s+/g, " ").trim() || "";
      const clone = details.cloneNode(true);
      const s = clone.querySelector("summary");
      if (s)
        s.remove();
      const a = clone.textContent?.replace(/\s+/g, " ").trim() || "";
      if (q && a) {
        faqs.push({ question: q, answer: a });
      }
    }
  });
  queryAll("dl").forEach((dl) => {
    const children = Array.from(dl.children);
    let currentQ = "";
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (tag === "dt") {
        currentQ = child.textContent?.replace(/\s+/g, " ").trim() || "";
      } else if (tag === "dd" && currentQ) {
        const a = child.textContent?.replace(/\s+/g, " ").trim() || "";
        if (a) {
          faqs.push({ question: currentQ, answer: a });
          currentQ = "";
        }
      }
    }
  });
  queryAll(".faq-item, .faq, .qa-item, .accordion-item").forEach((item) => {
    const qEl = item.querySelector(".faq-question, .question, .accordion-header, h3, h4, strong");
    const aEl = item.querySelector(".faq-answer, .answer, .accordion-body, p");
    if (qEl && aEl) {
      const q = qEl.textContent?.replace(/\s+/g, " ").trim() || "";
      const a = aEl.textContent?.replace(/\s+/g, " ").trim() || "";
      if (q && a && !faqs.some((f) => f.question === q)) {
        faqs.push({ question: q, answer: a });
      }
    }
  });
  const howToSteps = [];
  queryAll('.step, .howto-step, ol.steps > li, [itemprop="step"]').forEach((stepEl, idx) => {
    const nameEl = stepEl.querySelector("h3, h4, strong, .step-title");
    const stepName = nameEl?.textContent?.trim() || `Step ${idx + 1}`;
    const stepText = stepEl.textContent?.replace(/\s+/g, " ").trim() || "";
    if (stepText) {
      howToSteps.push({ name: stepName, text: stepText });
    }
  });
  let product;
  const priceEl = query('[itemprop="price"], .price, .product-price, [data-price]');
  const skuEl = query('[itemprop="sku"], .sku, [data-sku]');
  const ratingEl = query('[itemprop="ratingValue"], .rating, .review-score');
  const reviewCountEl = query('[itemprop="reviewCount"], .reviews-count');
  let detectedPrice = priceEl?.getAttribute("data-price") || priceEl?.getAttribute("content") || priceEl?.textContent?.trim();
  let currency = "USD";
  if (detectedPrice) {
    if (detectedPrice.includes("$"))
      currency = "USD";
    else if (detectedPrice.includes("€"))
      currency = "EUR";
    else if (detectedPrice.includes("£"))
      currency = "GBP";
    else if (detectedPrice.includes("¥"))
      currency = "JPY";
    detectedPrice = detectedPrice.replace(/[^0-9.]/g, "");
  }
  const isProductCandidate = !!(priceEl || skuEl || query('.product, [itemtype*="Product"]'));
  if (isProductCandidate) {
    product = {
      name: query(".product-title, .product-name, h1")?.textContent?.trim() || pageTitle,
      description: pageDescription,
      price: detectedPrice || "0.00",
      priceCurrency: getMeta(["price:currency"]) || currency,
      sku: skuEl?.textContent?.trim() || undefined,
      availability: query('.in-stock, [itemprop="availability"]')?.textContent?.toLowerCase().includes("in stock") ? "https://schema.org/InStock" : "https://schema.org/InStock",
      ratingValue: ratingEl?.textContent?.trim().replace(/[^0-9.]/g, "") || undefined,
      reviewCount: reviewCountEl?.textContent?.trim().replace(/[^0-9]/g, "") || undefined,
      image: pageImage
    };
  }
  let event;
  const isEventCandidate = !!query('.event, [itemtype*="Event"], .event-date, .venue');
  if (isEventCandidate) {
    const eventTime = query(".event-date, .event-time, time[datetime]")?.getAttribute("datetime") || query(".event-date, .event-time")?.textContent?.trim();
    const venueEl = query('.venue, .event-location, [itemprop="location"]');
    const isOnline = !!query('.online-event, [data-online="true"]') || root.textContent?.toLowerCase().includes("webinar") || root.textContent?.toLowerCase().includes("virtual event");
    event = {
      name: query(".event-title, .event-name, h1")?.textContent?.trim() || pageTitle,
      description: pageDescription,
      startDate: eventTime || new Date().toISOString(),
      locationName: venueEl?.textContent?.trim() || (isOnline ? "Online" : "Main Venue"),
      isOnline,
      url: pageUrl
    };
  }
  const logoEl = query('img.logo, .site-logo img, [itemprop="logo"], header img');
  const orgLogo = logoEl?.getAttribute("src") || pageImage;
  const socialLinks = [];
  queryAll('a[href*="twitter.com"], a[href*="x.com"], a[href*="github.com"], a[href*="linkedin.com"], a[href*="facebook.com"], a[href*="youtube.com"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (href && !socialLinks.includes(href)) {
      socialLinks.push(href);
    }
  });
  const organization = {
    name: siteName || pageAuthor || (typeof window !== "undefined" ? window.location?.hostname : "Organization"),
    url: pageUrl,
    logo: orgLogo,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    email: query('a[href^="mailto:"]')?.getAttribute("href")?.replace("mailto:", "") || undefined,
    telephone: query('a[href^="tel:"]')?.getAttribute("href")?.replace("tel:", "") || undefined
  };
  const rawCodeElements = queryAll("pre, code, .astro-code, .highlight");
  const codeBlocks = rawCodeElements.filter((el) => {
    if (el.tagName.toLowerCase() === "code" && el.closest("pre")) {
      return false;
    }
    return true;
  });
  const mainContent = query("main, article, #content, .content") || root;
  const bodyText = mainContent.textContent?.replace(/\s+/g, " ").trim() || "";
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
  const techArticle = {
    headline: pageTitle,
    description: pageDescription,
    proficiencyLevel: codeBlocks.length > 5 ? "Intermediate" : "Beginner",
    codeSnippetCount: codeBlocks.length,
    wordCount
  };
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
    rawTextSummary
  };
}

// src/app.ts
init_scaffolder();
var app_default = defineToolbarApp({
  init(canvas, app) {
    let currentSchemaType = "TechArticle";
    let currentFormat = "script-tag";
    let currentResult = null;
    let isGenerating = false;
    const container = document.createElement("div");
    container.className = "schema-scaffolder-root";
    const style = document.createElement("style");
    style.textContent = `
      .schema-scaffolder-root {
        position: fixed;
        bottom: 80px;
        right: 24px;
        width: 620px;
        max-width: calc(100vw - 48px);
        max-height: 85vh;
        background: #12161f;
        color: #f1f5f9;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border-radius: 12px;
        box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        font-size: 13px;
        box-sizing: border-box;
      }

      .schema-scaffolder-root * {
        box-sizing: border-box;
      }

      .scaffolder-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #1a202c;
        border-bottom: 1px solid #2d3748;
      }

      .scaffolder-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .scaffolder-icon {
        color: #8b5cf6;
      }

      .scaffolder-title {
        font-weight: 600;
        font-size: 14px;
        color: #f8fafc;
      }

      .scaffolder-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 9999px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .badge-gemini {
        background: rgba(139, 92, 246, 0.2);
        color: #c4b5fd;
        border: 1px solid rgba(139, 92, 246, 0.4);
      }

      .badge-fallback {
        background: rgba(100, 116, 139, 0.2);
        color: #cbd5e1;
        border: 1px solid rgba(100, 116, 139, 0.4);
      }

      .badge-downloading {
        background: rgba(245, 158, 11, 0.2);
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }

      .scaffolder-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        gap: 10px;
        background: #151a23;
        border-bottom: 1px solid #2d3748;
      }

      .scaffolder-select-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .scaffolder-select {
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid #475569;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        outline: none;
      }

      .scaffolder-select:focus {
        border-color: #8b5cf6;
      }

      .format-tabs {
        display: flex;
        background: #0f172a;
        padding: 2px;
        border-radius: 6px;
        border: 1px solid #334155;
      }

      .format-tab {
        background: transparent;
        border: none;
        color: #94a3b8;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.15s;
      }

      .format-tab.active {
        background: #8b5cf6;
        color: #ffffff;
      }

      .scaffolder-summary {
        padding: 8px 16px;
        background: #0b0f17;
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        border-bottom: 1px solid #1e293b;
      }

      .summary-item {
        display: flex;
        gap: 4px;
      }

      .summary-item strong {
        color: #e2e8f0;
      }

      .scaffolder-preview-area {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        background: #090d14;
        min-height: 220px;
        max-height: 380px;
      }

      .preview-code {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px;
        line-height: 1.45;
        color: #e2e8f0;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .validation-bar {
        padding: 6px 16px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid #1e293b;
      }

      .validation-valid {
        background: rgba(16, 185, 129, 0.1);
        color: #34d399;
      }

      .validation-invalid {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
      }

      .scaffolder-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: #151a23;
        border-top: 1px solid #2d3748;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: background 0.15s;
      }

      .btn-primary {
        background: #8b5cf6;
        color: white;
      }

      .btn-primary:hover {
        background: #7c3aed;
      }

      .btn-secondary {
        background: #1e293b;
        color: #e2e8f0;
        border: 1px solid #334155;
      }

      .btn-secondary:hover {
        background: #334155;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .loading-spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    canvas.appendChild(style);
    canvas.appendChild(container);
    async function renderUI() {
      const aiStatus = await checkChromeAIAvailability();
      const extracted = extractPageData(document);
      let aiBadgeClass = "badge-fallback";
      let aiBadgeText = "⚡ Rule-Based Engine";
      if (aiStatus === "readily") {
        aiBadgeClass = "badge-gemini";
        aiBadgeText = "✨ Gemini Nano (On-Device)";
      } else if (aiStatus === "after-download") {
        aiBadgeClass = "badge-downloading";
        aiBadgeText = "⏳ Gemini Nano Downloading";
      }
      const isArticleCandidate = extracted.techArticle && extracted.techArticle.codeSnippetCount > 0;
      const isProductCandidate = !!extracted.product;
      const isEventCandidate = !!extracted.event;
      const isFaqCandidate = extracted.faqs.length > 0;
      container.innerHTML = `
        <div class="scaffolder-header">
          <div class="scaffolder-title-group">
            <svg class="scaffolder-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="scaffolder-title">Schema Scaffolder</span>
            <span class="scaffolder-badge ${aiBadgeClass}">${aiBadgeText}</span>
          </div>
        </div>

        <div class="scaffolder-controls">
          <div class="scaffolder-select-group">
            <label for="schema-type-select" style="font-weight: 500; font-size: 11.5px; color: #94a3b8;">Type:</label>
            <select id="schema-type-select" class="scaffolder-select">
              <option value="TechArticle" ${currentSchemaType === "TechArticle" ? "selected" : ""}>TechArticle ${isArticleCandidate ? "★" : ""}</option>
              <option value="Product" ${currentSchemaType === "Product" ? "selected" : ""}>Product ${isProductCandidate ? "★" : ""}</option>
              <option value="Event" ${currentSchemaType === "Event" ? "selected" : ""}>Event ${isEventCandidate ? "★" : ""}</option>
              <option value="FAQPage" ${currentSchemaType === "FAQPage" ? "selected" : ""}>FAQPage ${isFaqCandidate ? "★" : ""}</option>
              <option value="Organization" ${currentSchemaType === "Organization" ? "selected" : ""}>Organization</option>
              <option value="HowTo" ${currentSchemaType === "HowTo" ? "selected" : ""}>HowTo</option>
            </select>
          </div>

          <div class="format-tabs">
            <button type="button" class="format-tab ${currentFormat === "script-tag" ? "active" : ""}" data-format="script-tag">HTML &lt;script&gt;</button>
            <button type="button" class="format-tab ${currentFormat === "astro-frontmatter" ? "active" : ""}" data-format="astro-frontmatter">Frontmatter</button>
            <button type="button" class="format-tab ${currentFormat === "raw-json" ? "active" : ""}" data-format="raw-json">Raw JSON</button>
          </div>
        </div>

        <div class="scaffolder-summary">
          <div class="summary-item">Title: <strong>${escapeHtml(extracted.title.slice(0, 30))}${extracted.title.length > 30 ? "..." : ""}</strong></div>
          <div class="summary-item">Headings: <strong>${extracted.headings.length}</strong></div>
          <div class="summary-item">FAQs: <strong>${extracted.faqs.length}</strong></div>
          <div class="summary-item">Author: <strong>${escapeHtml(extracted.author || "N/A")}</strong></div>
        </div>

        <div class="scaffolder-preview-area">
          <pre class="preview-code"><code id="schema-code-output">${isGenerating ? "✨ Generating Schema.org JSON-LD with Gemini Nano..." : currentResult ? escapeHtml(currentResult.formatted) : 'Click "Scan & Generate" to scaffold microdata for this page.'}</code></pre>
        </div>

        <div class="validation-bar ${currentResult?.validation?.isValid ? "validation-valid" : currentResult ? "validation-invalid" : ""}">
          <span>${currentResult ? currentResult.validation.isValid ? "✅ Schema.org Valid" : `⚠️ ${currentResult.validation.errors[0] || "Invalid Schema"}` : "Ready to scaffold"}</span>
          <span>${currentResult?.source === "gemini-nano" ? "✨ Gemini Nano Scaffolder" : currentResult ? "⚡ Rule-Based Engine" : ""}</span>
        </div>

        <div class="scaffolder-footer">
          <button type="button" id="btn-scan-generate" class="btn btn-primary" ${isGenerating ? "disabled" : ""}>
            ${isGenerating ? '<span class="loading-spinner"></span> Generating...' : "\uD83D\uDD04 Scan & Generate"}
          </button>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btn-copy" class="btn btn-secondary" ${!currentResult ? "disabled" : ""}>
              \uD83D\uDCCB Copy
            </button>
            <button type="button" id="btn-download" class="btn btn-secondary" ${!currentResult ? "disabled" : ""}>
              \uD83D\uDCBE .jsonld
            </button>
          </div>
        </div>
      `;
      attachEventListeners();
    }
    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    async function triggerGeneration() {
      isGenerating = true;
      await renderUI();
      try {
        const extracted = extractPageData(document);
        currentResult = await scaffoldSchema(currentSchemaType, extracted, currentFormat);
      } catch (err) {
        console.error("[astro-dev-schema-scaffolder] Generation error:", err);
      } finally {
        isGenerating = false;
        await renderUI();
      }
    }
    function attachEventListeners() {
      const typeSelect = container.querySelector("#schema-type-select");
      typeSelect?.addEventListener("change", async (e) => {
        currentSchemaType = e.target.value;
        await triggerGeneration();
      });
      container.querySelectorAll(".format-tab").forEach((tab) => {
        tab.addEventListener("click", async (e) => {
          const target = e.currentTarget;
          const format = target.getAttribute("data-format");
          if (format) {
            currentFormat = format;
            if (currentResult) {
              const { formatSchemaOutput: formatSchemaOutput2 } = await Promise.resolve().then(() => (init_scaffolder(), exports_scaffolder));
              currentResult.formatted = formatSchemaOutput2(currentResult.schema, currentFormat);
            }
            await renderUI();
          }
        });
      });
      container.querySelector("#btn-scan-generate")?.addEventListener("click", () => {
        triggerGeneration();
      });
      const copyBtn = container.querySelector("#btn-copy");
      copyBtn?.addEventListener("click", async () => {
        if (!currentResult)
          return;
        try {
          await navigator.clipboard.writeText(currentResult.formatted);
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = "✓ Copied!";
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 1800);
        } catch (err) {
          console.error("[astro-dev-schema-scaffolder] Clipboard error:", err);
        }
      });
      container.querySelector("#btn-download")?.addEventListener("click", () => {
        if (!currentResult)
          return;
        const blob = new Blob([JSON.stringify(currentResult.schema, null, 2)], {
          type: "application/ld+json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentSchemaType.toLowerCase()}-schema.jsonld`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
    container.style.display = "none";
    app.onToggled(({ state }) => {
      container.style.display = state ? "flex" : "none";
      if (state && !currentResult) {
        triggerGeneration();
      }
    });
    renderUI();
  }
});
export {
  app_default as default
};
