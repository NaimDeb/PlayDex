/**
 * Internationalization configuration
 * To use i18n in your app:
 * 1. Install: npm install next-intl
 * 2. Follow Next.js App Router i18n guide: https://next-intl-docs.vercel.app/docs/getting-started/app-router
 */

export const defaultLocale = 'fr' as const;
export const locales = ['fr', 'en'] as const;
export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

/**
 * Get translation messages for a locale
 * @param locale - Locale code ('fr' or 'en')
 * @returns Translation messages object
 */
export async function getMessages(locale: Locale) {
  return (await import(`./locales/${locale}.json`)).default;
}

/**
 * Configuration ready for next-intl
 * To enable i18n:
 * 1. Install next-intl: npm install next-intl
 * 2. Create middleware.ts at project root
 * 3. Wrap your app with NextIntlClientProvider
 *
 * See README_I18N.md for full setup instructions
 */
export const i18nConfig = {
  locales,
  defaultLocale,
  localePrefix: 'as-needed' as const, // Don't add /fr prefix for default locale
};
