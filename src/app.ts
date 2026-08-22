/**
 * Astro Dev Toolbar App - Schema Scaffolder
 * Provides in-browser UI to inspect current DOM, choose Schema.org types,
 * scaffold JSON-LD with Gemini Nano (window.ai.languageModel) or rule-based fallback,
 * validate compliance, and copy directly into Astro frontmatter or clipboard.
 */

import { defineToolbarApp } from 'astro/toolbar';
import { extractPageData } from './extractor.js';
import {
  scaffoldSchema,
  checkChromeAIAvailability,
  type SchemaType,
  type OutputFormat,
  type GenerationResult,
} from './scaffolder.js';

export default defineToolbarApp({
  init(canvas, app) {
    let currentSchemaType: SchemaType = 'TechArticle';
    let currentFormat: OutputFormat = 'script-tag';
    let currentResult: GenerationResult | null = null;
    let isGenerating = false;

    // Create container
    const container = document.createElement('div');
    container.className = 'schema-scaffolder-root';

    // Inject scoped styles
    const style = document.createElement('style');
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

    // Initial render
    async function renderUI() {
      const aiStatus = await checkChromeAIAvailability();
      const extracted = extractPageData(document);

      let aiBadgeClass = 'badge-fallback';
      let aiBadgeText = '⚡ Rule-Based Engine';
      if (aiStatus === 'readily') {
        aiBadgeClass = 'badge-gemini';
        aiBadgeText = '✨ Gemini Nano (On-Device)';
      } else if (aiStatus === 'after-download') {
        aiBadgeClass = 'badge-downloading';
        aiBadgeText = '⏳ Gemini Nano Downloading';
      }

      const isArticleCandidate = extracted.techArticle && extracted.techArticle.codeSnippetCount! > 0;
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
              <option value="TechArticle" ${currentSchemaType === 'TechArticle' ? 'selected' : ''}>TechArticle ${isArticleCandidate ? '★' : ''}</option>
              <option value="Product" ${currentSchemaType === 'Product' ? 'selected' : ''}>Product ${isProductCandidate ? '★' : ''}</option>
              <option value="Event" ${currentSchemaType === 'Event' ? 'selected' : ''}>Event ${isEventCandidate ? '★' : ''}</option>
              <option value="FAQPage" ${currentSchemaType === 'FAQPage' ? 'selected' : ''}>FAQPage ${isFaqCandidate ? '★' : ''}</option>
              <option value="Organization" ${currentSchemaType === 'Organization' ? 'selected' : ''}>Organization</option>
              <option value="HowTo" ${currentSchemaType === 'HowTo' ? 'selected' : ''}>HowTo</option>
            </select>
          </div>

          <div class="format-tabs">
            <button type="button" class="format-tab ${currentFormat === 'script-tag' ? 'active' : ''}" data-format="script-tag">HTML &lt;script&gt;</button>
            <button type="button" class="format-tab ${currentFormat === 'astro-frontmatter' ? 'active' : ''}" data-format="astro-frontmatter">Frontmatter</button>
            <button type="button" class="format-tab ${currentFormat === 'raw-json' ? 'active' : ''}" data-format="raw-json">Raw JSON</button>
          </div>
        </div>

        <div class="scaffolder-summary">
          <div class="summary-item">Title: <strong>${escapeHtml(extracted.title.slice(0, 30))}${extracted.title.length > 30 ? '...' : ''}</strong></div>
          <div class="summary-item">Headings: <strong>${extracted.headings.length}</strong></div>
          <div class="summary-item">FAQs: <strong>${extracted.faqs.length}</strong></div>
          <div class="summary-item">Author: <strong>${escapeHtml(extracted.author || 'N/A')}</strong></div>
        </div>

        <div class="scaffolder-preview-area">
          <pre class="preview-code"><code id="schema-code-output">${
            isGenerating
              ? '✨ Generating Schema.org JSON-LD with Gemini Nano...'
              : currentResult
                ? escapeHtml(currentResult.formatted)
                : 'Click "Scan & Generate" to scaffold microdata for this page.'
          }</code></pre>
        </div>

        <div class="validation-bar ${currentResult?.validation?.isValid ? 'validation-valid' : currentResult ? 'validation-invalid' : ''}">
          <span>${
            currentResult
              ? currentResult.validation.isValid
                ? '✅ Schema.org Valid'
                : `⚠️ ${currentResult.validation.errors[0] || 'Invalid Schema'}`
              : 'Ready to scaffold'
          }</span>
          <span>${
            currentResult?.source === 'gemini-nano'
              ? '✨ Gemini Nano Scaffolder'
              : currentResult
                ? '⚡ Rule-Based Engine'
                : ''
          }</span>
        </div>

        <div class="scaffolder-footer">
          <button type="button" id="btn-scan-generate" class="btn btn-primary" ${isGenerating ? 'disabled' : ''}>
            ${isGenerating ? '<span class="loading-spinner"></span> Generating...' : '🔄 Scan & Generate'}
          </button>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btn-copy" class="btn btn-secondary" ${!currentResult ? 'disabled' : ''}>
              📋 Copy
            </button>
            <button type="button" id="btn-download" class="btn btn-secondary" ${!currentResult ? 'disabled' : ''}>
              💾 .jsonld
            </button>
          </div>
        </div>
      `;

      attachEventListeners();
    }

    function escapeHtml(str: string): string {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    async function triggerGeneration() {
      isGenerating = true;
      await renderUI();

      try {
        const extracted = extractPageData(document);
        currentResult = await scaffoldSchema(currentSchemaType, extracted, currentFormat);
      } catch (err) {
        console.error('[astro-dev-schema-scaffolder] Generation error:', err);
      } finally {
        isGenerating = false;
        await renderUI();
      }
    }

    function attachEventListeners() {
      // Type select
      const typeSelect = container.querySelector('#schema-type-select') as HTMLSelectElement | null;
      typeSelect?.addEventListener('change', async (e) => {
        currentSchemaType = (e.target as HTMLSelectElement).value as SchemaType;
        await triggerGeneration();
      });

      // Format tabs
      container.querySelectorAll('.format-tab').forEach((tab) => {
        tab.addEventListener('click', async (e) => {
          const target = e.currentTarget as HTMLElement;
          const format = target.getAttribute('data-format') as OutputFormat;
          if (format) {
            currentFormat = format;
            if (currentResult) {
              const { formatSchemaOutput } = await import('./scaffolder.js');
              currentResult.formatted = formatSchemaOutput(currentResult.schema, currentFormat);
            }
            await renderUI();
          }
        });
      });

      // Generate button
      container.querySelector('#btn-scan-generate')?.addEventListener('click', () => {
        triggerGeneration();
      });

      // Copy button
      const copyBtn = container.querySelector('#btn-copy');
      copyBtn?.addEventListener('click', async () => {
        if (!currentResult) return;
        try {
          await navigator.clipboard.writeText(currentResult.formatted);
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '✓ Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 1800);
        } catch (err) {
          console.error('[astro-dev-schema-scaffolder] Clipboard error:', err);
        }
      });

      // Download button
      container.querySelector('#btn-download')?.addEventListener('click', () => {
        if (!currentResult) return;
        const blob = new Blob([JSON.stringify(currentResult.schema, null, 2)], {
          type: 'application/ld+json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSchemaType.toLowerCase()}-schema.jsonld`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Dev toolbar visibility toggle
    container.style.display = 'none';
    app.onToggled(({ state }) => {
      container.style.display = state ? 'flex' : 'none';
      if (state && !currentResult) {
        triggerGeneration();
      }
    });

    renderUI();
  },
});
