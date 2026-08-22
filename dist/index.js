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

// src/index.ts
init_scaffolder();
function schemaScaffolder(_options = {}) {
  return {
    name: "astro-dev-schema-scaffolder",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: "astro-dev-schema-scaffolder",
          name: "Schema Scaffolder",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
          entrypoint: new URL("./app.js", import.meta.url).pathname
        });
      }
    }
  };
}
export {
  validateSchema,
  scaffoldSchema,
  formatSchemaOutput,
  extractPageData,
  schemaScaffolder as default,
  cleanAndParseJSON,
  checkChromeAIAvailability,
  buildRuleBasedSchema
};
