import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'mn'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Don't use locale prefix in URL for default locale
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
