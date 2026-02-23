// AfriCart - Internationalization (language switch, location-aware)
// Use t('key') for translated strings. Locale from storage or browser language.

const SUPPORTED_LOCALES = ['en', 'fr', 'es'];
const DEFAULT_LOCALE = 'en';

let _locale = DEFAULT_LOCALE;
let _messages = null;

function getMessages() {
  if (typeof MESSAGES !== 'undefined') _messages = MESSAGES;
  return _messages || {};
}

/** Get current locale (from storage or navigator). */
async function getLocale() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const r = await chrome.storage.local.get(['locale']);
      if (r.locale && SUPPORTED_LOCALES.includes(r.locale)) return r.locale;
    }
  } catch (e) {}
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  const code = (nav && nav.split('-')[0]) || 'en';
  return SUPPORTED_LOCALES.includes(code) ? code : DEFAULT_LOCALE;
}

/** Set and persist locale. */
async function setLocale(code) {
  if (!SUPPORTED_LOCALES.includes(code)) code = DEFAULT_LOCALE;
  _locale = code;
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
      await chrome.storage.local.set({ locale: code });
  } catch (e) {}
  return code;
}

/** Translate key. Use after getLocale() or initI18n(). */
function t(key) {
  const msg = getMessages()[_locale] || getMessages()[DEFAULT_LOCALE] || {};
  return msg[key] != null ? msg[key] : (getMessages().en || {})[key] || key;
}

/** Initialize i18n: load locale from storage then apply. Call once on page load. */
async function initI18n() {
  _locale = await getLocale();
  return _locale;
}

if (typeof window !== 'undefined') {
  window.getLocale = getLocale;
  window.setLocale = setLocale;
  window.t = t;
  window.initI18n = initI18n;
  window.SUPPORTED_LOCALES = SUPPORTED_LOCALES;
}
