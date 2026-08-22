# astro-dev-schema-scaffolder

[![npm version](https://img.shields.io/npm/v/astro-dev-schema-scaffolder.svg?style=flat-square)](https://www.npmjs.com/package/astro-dev-schema-scaffolder)
[![Astro](https://img.shields.io/badge/Astro-5.0+-BC52EE.svg?style=flat-square)](https://astro.build)
[![Gemini Nano](https://img.shields.io/badge/Chrome%20AI-Gemini%20Nano-4285F4.svg?style=flat-square)](https://developer.chrome.com/docs/ai/built-in)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **Astro Dev Toolbar App** that inspects the current rendered page and drafts valid, SEO-optimized **Schema.org microdata** (`TechArticle`, `Product`, `Event`, `FAQPage`, `Organization`, `HowTo`) ready to paste into frontmatter or copy to clipboard using on-device Gemini Nano (`window.ai.languageModel`).

---

## ✨ Features

- 🛠️ **Dev Toolbar Integration**: Launches directly from Astro's Dev Toolbar with zero UI clutter.
- 🧠 **On-Device Gemini Nano AI**: Leverages Chrome Built-in AI (`window.ai.languageModel`) to parse and generate accurate JSON-LD microdata locally with zero cloud API keys.
- ⚡ **Rule-Based Fallback Engine**: Works offline or in browsers without Chrome AI enabled using deterministic DOM heuristics.
- 🏷️ **6 Core Schema.org Types**:
  - `TechArticle` (code snippets, proficiency level, author, word count)
  - `Product` (pricing, currency, SKU, ratings, stock availability)
  - `Event` (dates, physical/virtual venues, online links)
  - `FAQPage` (automatically extracts accordion, `<details>`, `<dl>`, and Q&A items)
  - `Organization` (logo, social links, contact email/phone)
  - `HowTo` (step-by-step guides, titles, directions)
- 📋 **Multi-Format Switcher**:
  - HTML `<script type="application/ld+json">` tag
  - Astro Frontmatter snippet (`const schema = ...` + `set:html`)
  - Pure formatted JSON
  - TypeScript Props interface
- ✅ **Built-In Schema.org Validator**: Instant validation checking `@context`, `@type`, and mandatory/recommended schema properties.
- 💾 **Export Options**: One-click clipboard copy and `.jsonld` file download.

---

## 📦 Installation

```bash
# Using bun
bun add -d astro-dev-schema-scaffolder

# Using npm
npm install --save-dev astro-dev-schema-scaffolder

# Using pnpm
pnpm add -D astro-dev-schema-scaffolder
```

---

## 🚀 Quick Setup

Add `astro-dev-schema-scaffolder` to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import schemaScaffolder from 'astro-dev-schema-scaffolder';

export default defineConfig({
  integrations: [
    schemaScaffolder(),
  ],
});
```

Start your dev server:

```bash
bun dev
# or: npm run dev
```

Open your app in the browser, look at the **Astro Dev Toolbar** at the bottom of the screen, and click the **Schema Scaffolder** icon.

---

## ⚙️ Enabling Gemini Nano in Chrome

To use on-device Gemini Nano AI features:

1. Use **Google Chrome 128+** (Dev, Canary, or Stable with experimental flags enabled).
2. Navigate to `chrome://flags/#prompt-api-for-gemini-nano` and set to **Enabled**.
3. Navigate to `chrome://flags/#optimization-guide-on-device-model` and set to **Enabled BypassPerfRequirement**.
4. Restart Chrome.
5. Go to `chrome://components` and find **Optimization Guide On Device Model**. Click **Check for update** to ensure the Gemini Nano model is downloaded.

> [!NOTE]
> If Chrome AI is unavailable, `astro-dev-schema-scaffolder` will automatically switch to its fast **Rule-Based Fallback Engine** so you never get blocked.

---

## 💻 Template Integration Examples

### 1. Astro Component / Layout (`.astro`)

Paste the generated frontmatter snippet directly into your layout:

```astro
---
// src/layouts/ArticleLayout.astro
interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": title,
  "description": description,
  "url": Astro.url.href,
  "author": {
    "@type": "Person",
    "name": "Sarah Astro"
  },
  "proficiencyLevel": "Intermediate"
};
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
    <!-- Inject Schema.org JSON-LD -->
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 2. Programmatic Usage in Build Scripts or Endpoints

You can also import extraction and scaffolding helpers directly into your TypeScript code:

```typescript
import { extractPageData, scaffoldSchema, validateSchema } from 'astro-dev-schema-scaffolder';

// Extract data from DOM or simulated environment
const data = extractPageData(document);

// Scaffold JSON-LD schema
const result = await scaffoldSchema('TechArticle', data, 'astro-frontmatter');

console.log(result.formatted);
console.log('Validation:', result.validation);
```

---

## 🛠️ Configuration Options

```typescript
// astro.config.mjs
import schemaScaffolder from 'astro-dev-schema-scaffolder';

export default defineConfig({
  integrations: [
    schemaScaffolder({
      // Default schema type to open in dev toolbar ('TechArticle' | 'Product' | 'Event' | 'FAQPage' | 'Organization' | 'HowTo')
      defaultSchemaType: 'TechArticle',
      // Default export format ('script-tag' | 'astro-frontmatter' | 'raw-json')
      defaultFormat: 'script-tag',
    }),
  ],
});
```

---

## 🧪 Testing

```bash
# Run tests with Bun
bun test

# Run TypeScript type check
bun run typecheck

# Build bundle
bun run build
```

---

## 📄 License

MIT © [Brian Hubbard](https://github.com/bhubbard)
