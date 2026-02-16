/**
 * Visa Form Autofill — Background service worker
 * Side panel behavior, storage, and messaging between panel and content script.
 * Best practices: async-safe sendResponse, normalized API base URL, error handling.
 */

'use strict';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function () {});

const STORAGE_KEYS = {
  API_BASE: 'visa_autofill_api_base',
  TOKEN: 'visa_autofill_token',
  LAST_APP_ID: 'visa_autofill_last_app_id',
};

function normalizeApiBase(url) {
  if (typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'GET_STORAGE') {
    const keys = message.keys && Array.isArray(message.keys) ? message.keys : Object.values(STORAGE_KEYS);
    chrome.storage.local.get(keys).then(sendResponse).catch(function (e) {
      sendResponse({ error: e && e.message ? e.message : 'storage_error' });
    });
    return true;
  }

  if (message.type === 'SET_STORAGE') {
    const payload = message.payload;
    if (payload && typeof payload === 'object') {
      chrome.storage.local.set(payload).then(function () {
        sendResponse({ ok: true });
      }).catch(function (e) {
        sendResponse({ ok: false, error: e && e.message ? e.message : 'storage_error' });
      });
    } else {
      sendResponse({ ok: false, error: 'invalid_payload' });
    }
    return true;
  }

  if (message.type === 'FETCH_APPLICATION') {
    const apiBase = normalizeApiBase(message.apiBase || '');
    const token = message.token;
    const applicationId = message.applicationId;
    if (!apiBase || !applicationId) {
      sendResponse({ ok: false, error: 'Missing apiBase or applicationId' });
      return true;
    }
    const url = apiBase + '/api/applications/' + encodeURIComponent(String(applicationId));
    const headers = {};
    if (token && typeof token === 'string' && token.trim()) {
      headers.Authorization = 'Bearer ' + token.trim();
    }
    fetch(url, { headers: headers })
      .then(function (r) {
        if (!r.ok) return Promise.reject(new Error(r.statusText || 'HTTP ' + r.status));
        return r.json();
      })
      .then(function (data) {
        sendResponse({ ok: true, data: data });
      })
      .catch(function (err) {
        sendResponse({ ok: false, error: err && err.message ? err.message : 'fetch_failed' });
      });
    return true;
  }

  if (message.type === 'INJECT_FILL') {
    const tabId = sender.tab && sender.tab.id != null ? sender.tab.id : message.tabId;
    if (tabId == null) {
      sendResponse({ ok: false, error: 'No tab id' });
      return true;
    }
    chrome.tabs.sendMessage(tabId, { type: 'FILL_PAGE', payload: message.payload || {} })
      .then(sendResponse)
      .catch(function (e) {
        sendResponse({ ok: false, error: (e && e.message) || 'Content script not ready' });
      });
    return true;
  }
});
