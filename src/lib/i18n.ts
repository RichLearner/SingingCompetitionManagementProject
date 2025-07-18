import { getRequestConfig } from "next-intl/server";

export const locales = ["zh-TW", "en"] as const;
export const defaultLocale = "zh-TW" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale || defaultLocale;
  return {
    messages: (await import(`../../messages/${currentLocale}.json`)).default,
    locale: currentLocale,
  };
});
