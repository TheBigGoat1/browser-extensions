// AfriCart - User-friendly logging and activity trail
// Well-worded messages, optional persistence for dashboard/CLI export.

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const MAX_ACTIVITY_ENTRIES = 100;
const ACTIVITY_KEY = 'activityLog';

const PHRASES = {
  comparison: 'Price comparison opened',
  wishlistAdd: 'Product added to wishlist',
  wishlistRemove: 'Product removed from wishlist',
  panelOpen: 'AfriCart panel opened',
  refresh: 'Product data refreshed',
  copyLink: 'Product link copied',
  storeNotSupported: 'Current site is not a supported store',
  productLoaded: 'Product loaded successfully',
  errorLoad: 'Could not load product. Please refresh the page.',
  errorGeneric: 'Something went wrong. Please try again.',
};

function levelName(level) {
  return Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level) || 'info';
}

async function appendActivity(entry) {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    const { [ACTIVITY_KEY]: log = [] } = await chrome.storage.local.get([ACTIVITY_KEY]);
    log.unshift({
      ts: Date.now(),
      level: entry.level || 'info',
      message: entry.message,
      store: entry.store || null,
      url: entry.url || null,
    });
    const trimmed = log.slice(0, MAX_ACTIVITY_ENTRIES);
    await chrome.storage.local.set({ [ACTIVITY_KEY]: trimmed });
  } catch (e) {}
}

function log(level, messageKeyOrMessage, meta = {}) {
  const levelNum = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  const message = PHRASES[messageKeyOrMessage] || messageKeyOrMessage;
  const prefix = '[AfriCart]';
  const out = `${prefix} ${message}`;
  if (level === 'error') console.error(out, meta);
  else if (level === 'warn') console.warn(out, meta);
  else console.log(out, meta);
  appendActivity({ level: levelName(levelNum), message, ...meta });
}

const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  /** Log a comparison (hop) for stats and activity */
  comparison: (store) => {
    log('info', 'comparison', { store });
  },
};

async function getActivityLog() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const r = await chrome.storage.local.get([ACTIVITY_KEY]);
      return r[ACTIVITY_KEY] || [];
    }
  } catch (e) {}
  return [];
}

if (typeof window !== 'undefined') {
  window.afriCartLogger = logger;
  window.getActivityLog = getActivityLog;
}
