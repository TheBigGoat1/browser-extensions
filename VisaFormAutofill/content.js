/**
 * Visa Form Autofill — Content script
 * Runs in the context of the visa form website. Fills inputs/selects from application JSON
 * and triggers proper events so conditional sections and validation run.
 * Best practices: no global leakage, safe coercion, checkbox/radio handling.
 */

(function () {
  'use strict';

  function getFieldSelectors() {
    return window.__VISA_AUTOFILL_MAPPING__ || null;
  }

  function coerceValue(value, tagName, type) {
    if (value === undefined || value === null) return '';
    const t = (type || '').toLowerCase();
    const tag = (tagName || '').toLowerCase();
    if (tag === 'input' && (t === 'checkbox' || t === 'radio')) {
      return Boolean(value);
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function fillField(selector, value, options) {
    options = options || {};
    const el = document.querySelector(selector);
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();

    try {
      if (tag === 'input') {
        if (type === 'checkbox' || type === 'radio') {
          const bool = Boolean(value === true || value === 'true' || value === '1' || value === 'yes');
          el.checked = bool;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.focus();
          el.value = coerceValue(value, tag, type);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }
      if (tag === 'textarea') {
        el.focus();
        el.value = coerceValue(value, tag, type);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      if (tag === 'select') {
        const str = coerceValue(value, tag, type);
        const opt = Array.from(el.options).find(
          (o) => (o.value === str || (o.text && o.text.trim() === str))
        );
        if (opt) {
          el.value = opt.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    } catch (err) {
      console.warn('[VisaFormAutofill] fillField error:', selector, err);
      return false;
    }
    return false;
  }

  function fillPage(fieldMap, formAnswers, applicant) {
    const filled = [];
    const data = Object.assign({}, applicant || {}, formAnswers || {});
    if (typeof fieldMap !== 'object' || fieldMap === null) return filled;
    for (const [schemaKey, selector] of Object.entries(fieldMap)) {
      if (typeof selector !== 'string' || !selector.trim()) continue;
      const value = data[schemaKey];
      if (value === undefined && !(schemaKey in data)) continue;
      if (fillField(selector.trim(), value)) filled.push(schemaKey);
    }
    return filled;
  }

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (msg.type !== 'FILL_PAGE') return;
    const payload = msg.payload || {};
    const fieldMapping = payload.fieldMapping || getFieldSelectors();
    if (!fieldMapping || typeof fieldMapping !== 'object') {
      sendResponse({ ok: false, error: 'No field mapping for this page' });
      return;
    }
    try {
      const filled = fillPage(
        fieldMapping,
        payload.formAnswers,
        payload.applicant
      );
      sendResponse({ ok: true, filled });
    } catch (err) {
      sendResponse({ ok: false, error: (err && err.message) || 'Fill failed' });
    }
  });
})();
