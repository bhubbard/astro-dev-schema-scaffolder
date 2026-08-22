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
    headings: Array<{
        level: number;
        text: string;
    }>;
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
export declare function extractPageData(doc?: Document | HTMLElement): ExtractedPageData;
