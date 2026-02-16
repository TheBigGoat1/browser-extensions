/**
 * Mock Chrome APIs for standalone preview (open sidepanel-preview.html in browser).
 * Use this only for UI/design testing. Real extension uses real chrome.* in the browser.
 */
(function () {
  const store = {};
  const listeners = [];

  window.chrome = {
    storage: {
      local: {
        get: function (keys, callback) {
          const result = {};
          const keysArr = Array.isArray(keys) ? keys : (keys ? Object.keys(keys) : Object.keys(store));
          if (!keysArr.length && Object.keys(store).length) keysArr.push(...Object.keys(store));
          keysArr.forEach(function (k) {
            if (store[k] !== undefined) result[k] = store[k];
          });
          if (typeof callback === 'function') setTimeout(callback.bind(null, result), 0);
        },
        set: function (obj, callback) {
          Object.keys(obj).forEach(function (k) {
            const old = store[k];
            store[k] = obj[k];
            listeners.forEach(function (fn) {
              fn({ [k]: { oldValue: old, newValue: obj[k] } }, 'local');
            });
          });
          if (typeof callback === 'function') setTimeout(callback, 0);
        }
      },
      onChanged: {
        addListener: function (fn) {
          listeners.push(fn);
        }
      }
    },
    tabs: {
      create: function (opts) {
        if (opts && opts.url) window.open(opts.url, '_blank');
      }
    }
  };
})();
