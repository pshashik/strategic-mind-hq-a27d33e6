export const GEMINI_FLASH_MODEL = "gemini-2.5-flash" as const;

/** Max RSS articles per Gemini request — stays within Flash per-minute token windows. */
export const GEMINI_FEED_ARTICLE_LIMIT = 15;

/** Max articles the RSS hook may pass into server functions (validated before slicing). */
export const RSS_FEED_ARTICLE_LIMIT = 20;

export function prepareFeedArticles<T>(articles: T[]): T[] {
  return articles.slice(0, GEMINI_FEED_ARTICLE_LIMIT);
}