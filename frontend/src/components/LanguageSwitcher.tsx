'use client';

import { useLocale } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation';
import { Link } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = useNextPathname();
  
  // Remove locale prefix from pathname to get the base path
  const pathWithoutLocale = pathname.replace(/^\/(en|mn)/, '') || '/';

  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
      <Link
        href={pathWithoutLocale}
        locale="en"
        className={`
          px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200
          ${locale === 'en' 
            ? 'bg-white text-primis-navy shadow-sm pointer-events-none' 
            : 'text-white/70 hover:text-white hover:bg-white/5'
          }
        `}
        title="English"
      >
        EN
      </Link>
      <Link
        href={pathWithoutLocale}
        locale="mn"
        className={`
          px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200
          ${locale === 'mn' 
            ? 'bg-white text-primis-navy shadow-sm pointer-events-none' 
            : 'text-white/70 hover:text-white hover:bg-white/5'
          }
        `}
        title="Монгол"
      >
        MN
      </Link>
    </div>
  );
}
