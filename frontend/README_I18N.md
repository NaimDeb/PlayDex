# Internationalization (i18n) Setup Guide

This guide will help you add multi-language support to PlayDex using next-intl.

## Current Setup

Your i18n infrastructure is ready:
- ✅ Translation files in `/src/i18n/locales/` (French & English)
- ✅ i18n configuration in `/src/i18n/config.ts`
- ✅ All user-facing strings extracted and translated

## Step 1: Install next-intl

```bash
npm install next-intl
```

## Step 2: Create Middleware

Create `middleware.ts` in your project root:

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

## Step 3: Update App Structure

Reorganize your app directory to support locales:

```
src/app/
  [locale]/           # Add this folder
    layout.tsx        # Move existing layout here
    page.tsx          # Move existing pages here
    ...other pages
```

## Step 4: Update Root Layout

Create `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Your existing providers */}
          <HeroUIProvider>
            <AuthProvider>
              <FollowedGamesProvider>
                <FlashMessageProvider>
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </FlashMessageProvider>
              </FollowedGamesProvider>
            </AuthProvider>
          </HeroUIProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Step 5: Use Translations in Components

### Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroSubtitle')}</p>
    </div>
  );
}
```

### Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');

  return (
    <form>
      <label>{t('email')}</label>
      <input placeholder={t('email')} />
      <button>{t('loginTitle')}</button>
    </form>
  );
}
```

## Step 6: Create Language Switcher

Create `src/components/LanguageSwitcher.tsx`:

```tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(path);
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value as Locale)}
      className="px-3 py-2 bg-off-gray text-off-white rounded"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
```

## Step 7: Update Links

Use next-intl's `Link` component for internal navigation:

```tsx
import { Link } from 'next-intl';

<Link href="/profile">{t('nav.profile')}</Link>
```

## Migration Guide

### Replace Hardcoded Strings

**Before:**
```tsx
<h1>Bienvenue sur PlayDex !</h1>
<button>Se connecter</button>
```

**After:**
```tsx
const t = useTranslations();
<h1>{t('home.welcomeTitle')}</h1>
<button>{t('auth.loginTitle')}</button>
```

### Update Form Labels

**Before:**
```tsx
<label htmlFor="email">Email</label>
```

**After:**
```tsx
const t = useTranslations('auth');
<label htmlFor="email">{t('email')}</label>
```

### Format Plurals and Numbers

```tsx
const t = useTranslations('game');

// Plurals
t('newUpdates', { count: 5 }); // "5 mises à jour"

// Numbers
t('followers', { count: 1234 }); // "1 234 abonnés"
```

## Translation File Structure

All strings are organized by domain:

- **common**: Buttons, actions, common words
- **nav**: Navigation menu items
- **home**: Homepage content
- **auth**: Login, register, authentication
- **game**: Game details, DLC, platforms
- **patchnote**: Patchnote types and actions
- **search**: Search, filters, results
- **time**: Relative time strings
- **meta**: SEO and OpenGraph

## Adding New Translations

1. Add key to both `/src/i18n/locales/fr.json` and `/src/i18n/locales/en.json`
2. Use the translation in your component:
   ```tsx
   const t = useTranslations('yourDomain');
   t('yourKey');
   ```

## SEO with i18n

Update metadata to be locale-aware:

```tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  };
}
```

## Testing i18n

1. **Test locale switching**: `/fr/profile` ↔ `/en/profile`
2. **Test missing keys**: Should show key name in development
3. **Test plurals**: Check different counts (0, 1, 2, 5)
4. **Test formatting**: Numbers, dates, currencies

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
