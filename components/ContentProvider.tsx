'use client';

import React, { createContext, useContext } from 'react';
import { en } from '@/content/en';
import { ar } from '@/content/ar';
import type { Locale, SiteContent } from '@/content/types';

const Ctx = createContext<SiteContent>(en);

/** The page's copy for one language; every section reads it with useContent(). */
export function ContentProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale === 'ar' ? ar : en}>{children}</Ctx.Provider>;
}

export const useContent = () => useContext(Ctx);
