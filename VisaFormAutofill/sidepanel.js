/**
 * Visa Form Autofill — Side panel UI
 * Responsive, accessible, and production-ready: config, fetch application, trigger fill.
 * Best practices: loading states, ARIA, validation, single source of state.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    API_BASE: 'visa_autofill_api_base',
    TOKEN: 'visa_autofill_token',
    LAST_APP_ID: 'visa_autofill_last_app_id',
  };

  const HINT_TYPES = { success: 'success', error: 'error', warning: 'warning', info: '' };
  const STATUS_CLEAR_MS = 5000;

  const els = {
    apiBase: document.getElementById('apiBase'),
    token: document.getElementById('token'),
    applicationId: document.getElementById('applicationId'),
    saveConfig: document.getElementById('saveConfig'),
    fetchApp: document.getElementById('fetchApp'),
    fillPage: document.getElementById('fillPage'),
    configStatus: document.getElementById('configStatus'),
    fetchStatus: document.getElementById('fetchStatus'),
    fillStatus: document.getElementById('fillStatus'),
    appPreview: document.getElementById('appPreview'),
  };

  let currentApplication = null;
  let statusClearTimer = null;

  function showHint(element, text, type = '') {
    if (!element) return;
    element.textContent = text || '';
    element.className = 'hint' + (type ? ` ${type}` : '');
    element.setAttribute('aria-live', text ? 'polite' : 'off');
    if (statusClearTimer) clearTimeout(statusClearTimer);
    if (text && type !== 'error') {
      statusClearTimer = setTimeout(() => {
        element.textContent = '';
        element.className = 'hint';
        element.setAttribute('aria-live', 'polite');
      }, STATUS_CLEAR_MS);
    }
  }

  function setLoading(button, loading, disabledWhenNotLoading) {
    if (!button) return;
    if (loading) {
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      button.disabled = disabledWhenNotLoading === true;
    }
  }

  function setFillButtonState(hasApp) {
    els.fillPage.disabled = !hasApp;
    els.fillPage.setAttribute('aria-disabled', hasApp ? 'false' : 'true');
  }

  function validateUrl(value) {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
      const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function getApiBase() {
    const v = els.apiBase && els.apiBase.value ? els.apiBase.value.trim() : '';
    return v.replace(/\/$/, '');
  }

  function loadStorage() {
    chrome.storage.local.get(
      [STORAGE_KEYS.API_BASE, STORAGE_KEYS.TOKEN, STORAGE_KEYS.LAST_APP_ID],
      (data) => {
        if (data[STORAGE_KEYS.API_BASE] && els.apiBase) els.apiBase.value = data[STORAGE_KEYS.API_BASE];
        if (data[STORAGE_KEYS.TOKEN] && els.token) els.token.value = data[STORAGE_KEYS.TOKEN] || '';
        if (data[STORAGE_KEYS.LAST_APP_ID] && els.applicationId) els.applicationId.value = data[STORAGE_KEYS.LAST_APP_ID] || '';
      }
    );
  }

  els.saveConfig.addEventListener('click', () => {
    const apiBase = getApiBase();
    const token = els.token && els.token.value ? els.token.value.trim() : '';
    if (apiBase && !validateUrl(apiBase)) {
      showHint(els.configStatus, 'Please enter a valid API URL.', HINT_TYPES.error);
      return;
    }
    chrome.storage.local.set(
      {
        [STORAGE_KEYS.API_BASE]: apiBase || undefined,
        [STORAGE_KEYS.TOKEN]: token || undefined,
      },
      () => {
        showHint(els.configStatus, 'Configuration saved.', HINT_TYPES.success);
      }
    );
  });

  els.fetchApp.addEventListener('click', async () => {
    const apiBase = getApiBase();
    const applicationId = els.applicationId && els.applicationId.value ? els.applicationId.value.trim() : '';
    const token = els.token && els.token.value ? els.token.value.trim() : '';

    if (!applicationId) {
      showHint(els.fetchStatus, 'Enter an application ID.', HINT_TYPES.error);
      return;
    }
    if (!apiBase || !validateUrl(apiBase)) {
      showHint(els.fetchStatus, 'Set a valid API base URL in Configuration first.', HINT_TYPES.error);
      return;
    }

    setLoading(els.fetchApp, true);
    showHint(els.fetchStatus, 'Fetching…');

    try {
      const url = `${apiBase}/api/applications/${encodeURIComponent(applicationId)}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      currentApplication = data;
      chrome.storage.local.set({ [STORAGE_KEYS.LAST_APP_ID]: applicationId });

      if (els.appPreview) {
        els.appPreview.textContent = JSON.stringify(
          { applicant: data.applicant, form_answers: data.form_answers },
          null,
          2
        );
        els.appPreview.classList.remove('hidden');
      }
      setFillButtonState(true);
      showHint(els.fetchStatus, 'Application loaded. You can fill the current page.', HINT_TYPES.success);
    } catch (e) {
      currentApplication = null;
      setFillButtonState(false);
      const message = e && e.message ? e.message : 'Fetch failed.';
      showHint(els.fetchStatus, message, HINT_TYPES.error);
    } finally {
      setLoading(els.fetchApp, false);
    }
  });

  els.fillPage.addEventListener('click', async () => {
    if (!currentApplication) {
      showHint(els.fillStatus, 'Fetch an application first.', HINT_TYPES.error);
      return;
    }
    showHint(els.fillStatus, 'Filling…');
    setLoading(els.fillPage, true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showHint(els.fillStatus, 'No active tab.', HINT_TYPES.error);
        return;
      }
      const payload = {
        fieldMapping: window.VISA_FIELD_MAPPING || null,
        formAnswers: currentApplication.form_answers,
        applicant: currentApplication.applicant,
      };

      // Ensure content script is in the tab (fixes "Receiving end does not exist")
      let reply = null;
      try {
        reply = await chrome.tabs.sendMessage(tab.id, { type: 'FILL_PAGE', payload });
      } catch (firstErr) {
        const noReceiver = (firstErr && firstErr.message && (firstErr.message.indexOf('Receiving end') !== -1 || firstErr.message.indexOf('receiving end') !== -1));
        if (noReceiver) {
          try {
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
          } catch (injectErr) {
            showHint(els.fillStatus, 'Cannot run on this page (e.g. chrome:// or New Tab). Open the visa form in a normal webpage and try again.', HINT_TYPES.error);
            return;
          }
          reply = await chrome.tabs.sendMessage(tab.id, { type: 'FILL_PAGE', payload });
        } else {
          throw firstErr;
        }
      }
      if (reply && reply.ok) {
        const filled = reply.filled && reply.filled.length ? reply.filled.join(', ') : 'none';
        showHint(els.fillStatus, `Filled: ${filled}.`, HINT_TYPES.success);
      } else {
        showHint(els.fillStatus, (reply && reply.error) || 'Fill failed.', HINT_TYPES.error);
      }
    } catch (e) {
      const msg = e && e.message ? e.message : 'Could not run on this page. Open the visa form in this tab.';
      showHint(els.fillStatus, msg, HINT_TYPES.error);
    } finally {
      setLoading(els.fillPage, false, !currentApplication);
      setFillButtonState(!!currentApplication);
    }
  });

  loadStorage();
  setFillButtonState(false);
})();
